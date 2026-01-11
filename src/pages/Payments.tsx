import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Receipt, Loader2, CheckCircle, XCircle } from "lucide-react";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import type { Payment, Loan, Client } from "@/lib/types";

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user, profile, isAuthenticated, loading: authLoading, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [selectedLoan, setSelectedLoan] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("mtn_momo");
  const [transactionId, setTransactionId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isStaff()) {
      fetchPayments();
      fetchLoans();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, isStaff()]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*, loan:loans(loan_number), client:clients(full_name, phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data as Payment[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    const { data } = await supabase
      .from("loans")
      .select("id, loan_number, client:clients(full_name), loan_balance, installment_amount")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("loan_number");
    setLoans(data || []);
  };

  const handleRecordPayment = async () => {
    if (!selectedLoan || !amount || Number(amount) <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Get the loan details
      const loan = loans.find((l) => l.id === selectedLoan);
      if (!loan) throw new Error("Loan not found");

      // Generate payment reference
      const { data: refData } = await supabase.rpc("generate_payment_reference");
      const paymentRef = refData || `PAY${Date.now()}`;

      // Get client_id from the loan
      const { data: loanData } = await supabase
        .from("loans")
        .select("client_id, branch_id")
        .eq("id", selectedLoan)
        .single();

      if (!loanData) throw new Error("Loan details not found");

      const paymentData = {
        payment_reference: paymentRef,
        loan_id: selectedLoan,
        client_id: loanData.client_id,
        amount: Number(amount),
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        phone_number: phoneNumber || null,
        status: "pending",
        branch_id: loanData.branch_id || profile?.branch_id,
        received_by: user?.id,
      };

      const { error } = await supabase.from("payments").insert(paymentData as any);
      if (error) throw error;

      toast.success("Payment recorded successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      // Get the payment details
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) return;

      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          confirmed_by: user?.id,
        })
        .eq("id", paymentId);

      if (paymentError) throw paymentError;

      // Update loan balance
      const { data: loanData } = await supabase
        .from("loans")
        .select("loan_balance, installments_paid")
        .eq("id", payment.loan_id)
        .single();

      if (loanData) {
        const newBalance = Math.max(0, Number(loanData.loan_balance) - payment.amount);
        const newInstallmentsPaid = loanData.installments_paid + 1;

        await supabase
          .from("loans")
          .update({
            loan_balance: newBalance,
            installments_paid: newInstallmentsPaid,
            last_payment_date: new Date().toISOString(),
            status: newBalance === 0 ? "completed" : "active",
          })
          .eq("id", payment.loan_id);

        // If loan is completed, transfer asset ownership
        if (newBalance === 0) {
          const { data: loan } = await supabase
            .from("loans")
            .select("asset_id")
            .eq("id", payment.loan_id)
            .single();

          if (loan?.asset_id) {
            await supabase
              .from("assets")
              .update({ status: "transferred" })
              .eq("id", loan.asset_id);
          }
        }
      }

      // Mark appropriate repayment schedule item as paid
      const { data: scheduleItems } = await supabase
        .from("repayment_schedule")
        .select("*")
        .eq("loan_id", payment.loan_id)
        .eq("is_paid", false)
        .order("due_date")
        .limit(1);

      if (scheduleItems && scheduleItems.length > 0) {
        await supabase
          .from("repayment_schedule")
          .update({
            is_paid: true,
            amount_paid: payment.amount,
            paid_at: new Date().toISOString(),
          })
          .eq("id", scheduleItems[0].id);
      }

      toast.success("Payment confirmed successfully");
      fetchPayments();
      fetchLoans();
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error(error.message || "Failed to confirm payment");
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "rejected" })
        .eq("id", paymentId);

      if (error) throw error;
      toast.success("Payment rejected");
      fetchPayments();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject payment");
    }
  };

  const resetForm = () => {
    setSelectedLoan("");
    setAmount("");
    setPaymentMethod("mtn_momo");
    setTransactionId("");
    setPhoneNumber("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.client as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === "all" || payment.payment_method === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const confirmedPayments = payments.filter((p) => p.status === "confirmed" || p.status === "reconciled");
  const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isStaff()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Record and manage loan repayments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Enter payment details received from client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Loan *</Label>
                  <Select value={selectedLoan} onValueChange={setSelectedLoan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {loans.map((loan) => (
                        <SelectItem key={loan.id} value={loan.id}>
                          {loan.loan_number} - {(loan.client as any)?.full_name} (Bal: {formatCurrency(loan.loan_balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (UGX) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {selectedLoan && (
                    <p className="text-sm text-muted-foreground">
                      Suggested: {formatCurrency(loans.find((l) => l.id === selectedLoan)?.installment_amount || 0)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.icon} {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(paymentMethod === "mtn_momo" || paymentMethod === "airtel_money") && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+256..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID / Reference</Label>
                  <Input
                    id="transactionId"
                    placeholder="External reference number"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleRecordPayment} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Record Payment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-yellow-100">Pending Confirmation</CardDescription>
              <CardTitle className="text-3xl">{pendingPayments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-100 text-sm">Payments awaiting verification</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-100">Confirmed Payments</CardDescription>
              <CardTitle className="text-3xl">{confirmedPayments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-100 text-sm">Total: {formatCurrency(totalConfirmed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-3xl">{payments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">All time payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, client, or transaction ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(PAYMENT_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>{filteredPayments.length} payments found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Loan #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.payment_reference}</TableCell>
                      <TableCell>
                        <div className="font-medium">{(payment.client as any)?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{(payment.client as any)?.phone}</div>
                      </TableCell>
                      <TableCell className="font-mono">{(payment.loan as any)?.loan_number}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{PAYMENT_METHODS[payment.payment_method]?.icon}</span>
                          <span className="text-sm">{PAYMENT_METHODS[payment.payment_method]?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.received_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={PAYMENT_STATUSES[payment.status]?.color || ""}>
                          {PAYMENT_STATUSES[payment.status]?.label || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === "pending" && isAdmin() && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleConfirmPayment(payment.id)} className="text-green-600 hover:text-green-700">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRejectPayment(payment.id)} className="text-red-600 hover:text-red-700">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
