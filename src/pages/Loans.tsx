import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, Search, CreditCard, Loader2, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { LOAN_STATUSES, INTEREST_RATE, REPAYMENT_FREQUENCIES } from "@/lib/constants";
import type { Loan, Client, Asset, LoanCalculation } from "@/lib/types";
import { addDays, addWeeks, format } from "date-fns";

const Loans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user, profile, isAuthenticated, loading: authLoading, isStaff, isAdmin, roles } = useAuth();
  const navigate = useNavigate();

  // Form state for new loan
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [repaymentFrequency, setRepaymentFrequency] = useState<"daily" | "weekly">("daily");
  const [loanTermMonths, setLoanTermMonths] = useState<number>(6);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isStaff()) {
      fetchLoans();
      fetchClients();
      fetchAssets();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, roles]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*, client:clients(full_name, phone), asset:assets(brand, model, asset_type)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoans(data as Loan[]);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, full_name, phone")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name");
    setClients(data || []);
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("assets")
      .select("id, brand, model, asset_type, selling_price")
      .eq("status", "available")
      .is("deleted_at", null)
      .order("brand");
    setAssets(data || []);
  };

  // Calculate loan terms
  useEffect(() => {
    if (!selectedAsset) {
      setCalculation(null);
      return;
    }

    const asset = assets.find((a) => a.id === selectedAsset);
    if (!asset) return;

    const principalAmount = asset.selling_price - downPayment;
    const interestAmount = principalAmount * (INTEREST_RATE / 100);
    const totalAmount = principalAmount + interestAmount;

    const daysInPeriod = repaymentFrequency === "daily" ? 1 : 7;
    const totalDays = loanTermMonths * 30;
    const totalInstallments = Math.ceil(totalDays / daysInPeriod);
    const installmentAmount = Math.ceil(totalAmount / totalInstallments);

    const startDate = new Date();
    const endDate = repaymentFrequency === "daily"
      ? addDays(startDate, totalInstallments)
      : addWeeks(startDate, totalInstallments);

    setCalculation({
      principalAmount,
      interestAmount,
      totalAmount,
      installmentAmount,
      totalInstallments,
      endDate,
    });
  }, [selectedAsset, loanTermMonths, repaymentFrequency, downPayment, assets]);

  const handleCreateLoan = async () => {
    if (!selectedClient || !selectedAsset || !calculation) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Generate loan number
      const { data: loanNumberData } = await supabase.rpc("generate_loan_number");
      const loanNumber = loanNumberData || `NWP${Date.now()}`;

      const startDate = new Date();

      const loanData = {
        loan_number: loanNumber,
        client_id: selectedClient,
        asset_id: selectedAsset,
        branch_id: profile?.branch_id,
        principal_amount: calculation.principalAmount,
        interest_rate: INTEREST_RATE,
        total_amount: calculation.totalAmount,
        down_payment: downPayment,
        loan_balance: calculation.totalAmount,
        repayment_frequency: repaymentFrequency,
        installment_amount: calculation.installmentAmount,
        total_installments: calculation.totalInstallments,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(calculation.endDate, "yyyy-MM-dd"),
        next_payment_date: format(
          repaymentFrequency === "daily" ? addDays(startDate, 1) : addWeeks(startDate, 1),
          "yyyy-MM-dd"
        ),
        status: "pending",
        created_by: user?.id,
      };

      const { data: newLoan, error } = await supabase
        .from("loans")
        .insert(loanData as any)
        .select()
        .single();

      if (error) throw error;

      // Generate repayment schedule
      const scheduleItems = [];
      let currentDate = startDate;
      for (let i = 1; i <= calculation.totalInstallments; i++) {
        currentDate = repaymentFrequency === "daily"
          ? addDays(startDate, i)
          : addWeeks(startDate, i);
        scheduleItems.push({
          loan_id: newLoan.id,
          installment_number: i,
          due_date: format(currentDate, "yyyy-MM-dd"),
          amount_due: calculation.installmentAmount,
        });
      }

      await supabase.from("repayment_schedule").insert(scheduleItems);

      // Update asset status
      await supabase
        .from("assets")
        .update({ status: "assigned" })
        .eq("id", selectedAsset);

      toast.success("Loan created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchLoans();
      fetchAssets();
    } catch (error: any) {
      console.error("Error creating loan:", error);
      toast.error(error.message || "Failed to create loan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from("loans")
        .update({
          status: "active",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", loanId);

      if (error) throw error;
      toast.success("Loan approved successfully");
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve loan");
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    try {
      // Get the loan to find the asset
      const { data: loan } = await supabase
        .from("loans")
        .select("asset_id")
        .eq("id", loanId)
        .single();

      // Update loan status
      const { error } = await supabase
        .from("loans")
        .update({ status: "recovered" }) // Using recovered as rejected equivalent
        .eq("id", loanId);

      if (error) throw error;

      // Release the asset
      if (loan?.asset_id) {
        await supabase
          .from("assets")
          .update({ status: "available" })
          .eq("id", loan.asset_id);
      }

      toast.success("Loan rejected");
      fetchLoans();
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject loan");
    }
  };

  const resetForm = () => {
    setSelectedClient("");
    setSelectedAsset("");
    setRepaymentFrequency("daily");
    setLoanTermMonths(6);
    setDownPayment(0);
    setCalculation(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.loan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.client as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || loan.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
          <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
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
            <h1 className="text-2xl font-bold">Loans</h1>
            <p className="text-muted-foreground">Manage loan applications and tracking</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Loan</DialogTitle>
                <DialogDescription>
                  Set up a new loan for a registered client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Client Selection */}
                <div className="space-y-2">
                  <Label>Select Client *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name} ({client.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Asset Selection */}
                <div className="space-y-2">
                  <Label>Select Asset *</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.asset_type === "motorcycle" ? "🏍️" : "🛺"} {asset.brand} {asset.model} - {formatCurrency(asset.selling_price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Repayment Frequency */}
                <div className="space-y-2">
                  <Label>Repayment Frequency</Label>
                  <Select value={repaymentFrequency} onValueChange={(v: "daily" | "weekly") => setRepaymentFrequency(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Payments</SelectItem>
                      <SelectItem value="weekly">Weekly Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Loan Term */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Loan Term</Label>
                    <span className="text-sm font-medium">{loanTermMonths} months</span>
                  </div>
                  <Slider
                    value={[loanTermMonths]}
                    onValueChange={(v) => setLoanTermMonths(v[0])}
                    min={3}
                    max={24}
                    step={1}
                  />
                </div>

                {/* Down Payment */}
                <div className="space-y-2">
                  <Label htmlFor="downPayment">Down Payment (UGX)</Label>
                  <Input
                    id="downPayment"
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                  />
                </div>

                {/* Loan Summary */}
                {calculation && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Loan Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Principal Amount:</span>
                        <span className="font-medium">{formatCurrency(calculation.principalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest ({INTEREST_RATE}%):</span>
                        <span className="font-medium">{formatCurrency(calculation.interestAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="font-bold">{formatCurrency(calculation.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-primary">
                        <span>{repaymentFrequency === "daily" ? "Daily" : "Weekly"} Payment:</span>
                        <span className="font-bold">{formatCurrency(calculation.installmentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Number of Payments:</span>
                        <span>{calculation.totalInstallments}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>End Date:</span>
                        <span>{format(calculation.endDate, "MMM d, yyyy")}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLoan} disabled={submitting || !calculation}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Loan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Object.entries(LOAN_STATUSES).map(([key, value]) => {
            const count = loans.filter((l) => l.status === key).length;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardDescription>{value.label}</CardDescription>
                  <CardTitle className="text-2xl">{count}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by loan number or client name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(LOAN_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Applications</CardTitle>
            <CardDescription>{filteredLoans.length} loans found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono font-medium">{loan.loan_number}</TableCell>
                      <TableCell>
                        <div className="font-medium">{(loan.client as any)?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{(loan.client as any)?.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{(loan.asset as any)?.asset_type === "motorcycle" ? "🏍️" : "🛺"}</span>
                          {(loan.asset as any)?.brand} {(loan.asset as any)?.model}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(loan.total_amount)}</TableCell>
                      <TableCell>
                        <span className={loan.loan_balance > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                          {formatCurrency(loan.loan_balance)}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{loan.repayment_frequency}</TableCell>
                      <TableCell>
                        <Badge className={LOAN_STATUSES[loan.status]?.color || ""}>
                          {LOAN_STATUSES[loan.status]?.label || loan.status}
                        </Badge>
                        {loan.consecutive_missed >= 4 && (
                          <Badge variant="destructive" className="ml-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Recovery
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {loan.status === "pending" && isAdmin() && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleApproveLoan(loan.id)} className="text-green-600 hover:text-green-700">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleRejectLoan(loan.id)} className="text-red-600 hover:text-red-700">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLoans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No loans found
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

export default Loans;
