import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  User,
  FileText,
  Users,
  ArrowRight,
  Send,
  Bike,
  Printer
} from "lucide-react";
import { InquiryCard, type InquiryWithDetails } from "@/components/loans/InquiryCard";
import { InquiryEditDialog } from "@/components/loans/InquiryEditDialog";
import { LoanApplicationDialog } from "@/components/loans/LoanApplicationDialog";
import { LoanContract } from "@/components/loans/LoanContract";

interface LoanWithDetails {
  id: string;
  loan_number: string;
  principal_amount: number;
  total_amount: number;
  loan_balance: number;
  installment_amount: number;
  total_installments: number;
  down_payment: number;
  interest_rate: number;
  end_date: string;
  status: string;
  start_date: string;
  next_payment_date: string | null;
  missed_payments: number;
  repayment_frequency: string;
  client: {
    full_name: string;
    phone: string;
    district: string;
    national_id?: string;
    address?: string;
    village?: string;
    next_of_kin_name?: string;
    next_of_kin_phone?: string;
  } | null;
  asset: {
    asset_type: string;
    brand: string;
    model: string;
    chassis_number: string;
    engine_number?: string;
    registration_number: string | null;
    color?: string;
  } | null;
}

interface ContractData {
  loan: LoanWithDetails;
  approvedBy: string;
  approvedAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const CreditCollection = () => {
  const { user, profile, loading: authLoading, hasAnyRole, roles } = useAuth();
  const navigate = useNavigate();
  const contractRef = useRef<HTMLDivElement>(null);
  const [activeLoans, setActiveLoans] = useState<LoanWithDetails[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanWithDetails[]>([]);
  const [underReviewLoans, setUnderReviewLoans] = useState<LoanWithDetails[]>([]);
  const [awaitingApprovalLoans, setAwaitingApprovalLoans] = useState<LoanWithDetails[]>([]);
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInquiry, setEditingInquiry] = useState<InquiryWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [applicationInquiry, setApplicationInquiry] = useState<InquiryWithDetails | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [stats, setStats] = useState({
    totalActive: 0,
    pendingKYC: 0,
    awaitingApproval: 0,
    totalOutstanding: 0,
    todaysDue: 0,
    qualifiedLeads: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAnyRole(['super_admin', 'admin', 'field_officer', 'accountant'])) {
      fetchData();
    }
  }, [user, roles]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchLoans(), fetchInquiries()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .in("status", ["qualified", "contacted"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries(data || []);

      const qualifiedCount = data?.filter(i => i.status === 'qualified').length || 0;
      setStats(prev => ({ ...prev, qualifiedLeads: qualifiedCount }));
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    }
  };

  const fetchLoans = async () => {
    try {
      const loanFields = `
        id, loan_number, principal_amount, total_amount, loan_balance,
        installment_amount, total_installments, down_payment, interest_rate, end_date,
        status, start_date, next_payment_date, missed_payments, repayment_frequency,
        client:clients(full_name, phone, district, national_id, address, village, next_of_kin_name, next_of_kin_phone),
        asset:assets(asset_type, brand, model, chassis_number, engine_number, registration_number, color)
      `;

      // Fetch all loan stages in parallel
      const [activeResult, pendingResult, underReviewResult, awaitingApprovalResult] = await Promise.all([
        supabase.from("loans").select(loanFields).eq("status", "active").is("deleted_at", null).order("next_payment_date", { ascending: true }),
        supabase.from("loans").select(loanFields).eq("status", "pending").is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("loans").select(loanFields).eq("status", "under_review").is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("loans").select(loanFields).eq("status", "awaiting_approval").is("deleted_at", null).order("created_at", { ascending: false }),
      ]);

      if (activeResult.error) throw activeResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (underReviewResult.error) throw underReviewResult.error;
      if (awaitingApprovalResult.error) throw awaitingApprovalResult.error;

      setActiveLoans(activeResult.data || []);
      setPendingLoans(pendingResult.data || []);
      setUnderReviewLoans(underReviewResult.data || []);
      setAwaitingApprovalLoans(awaitingApprovalResult.data || []);

      // Calculate stats
      const totalOutstanding = (activeResult.data || []).reduce((sum, loan) => sum + Number(loan.loan_balance), 0);
      const today = new Date().toISOString().split('T')[0];
      const todaysDue = (activeResult.data || []).filter(loan => 
        loan.next_payment_date && loan.next_payment_date <= today
      ).length;

      setStats(prev => ({
        ...prev,
        totalActive: activeResult.data?.length || 0,
        pendingKYC: (pendingResult.data?.length || 0) + (underReviewResult.data?.length || 0),
        awaitingApproval: awaitingApprovalResult.data?.length || 0,
        totalOutstanding,
        todaysDue,
      }));
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    }
  };

  const handleSendToOperations = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from("loans")
        .update({ status: 'awaiting_asset' })
        .eq("id", loanId);

      if (error) throw error;
      
      toast.success("Sent to Operations for asset assignment");
      fetchData();
    } catch (error) {
      console.error("Error updating loan:", error);
      toast.error("Failed to update loan");
    }
  };

  const handleStartReview = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from("loans")
        .update({ status: 'under_review' })
        .eq("id", loanId);

      if (error) throw error;
      
      toast.success("Loan moved to under review");
      fetchData();
    } catch (error) {
      console.error("Error updating loan:", error);
      toast.error("Failed to update loan");
    }
  };

  const handleFinalApproval = async (loanId: string) => {
    try {
      const approvedAt = new Date().toISOString();
      
      // Update loan status
      const { error } = await supabase
        .from("loans")
        .update({ 
          status: 'active',
          approved_by: user?.id,
          approved_at: approvedAt
        })
        .eq("id", loanId);

      if (error) throw error;
      
      // Find the loan from awaiting approval list for contract
      const loan = awaitingApprovalLoans.find(l => l.id === loanId);
      
      if (loan) {
        // Prepare contract data and open print dialog
        setContractData({
          loan,
          approvedBy: profile?.full_name || 'Authorized Officer',
          approvedAt
        });
        setIsContractDialogOpen(true);
      }
      
      toast.success("Loan approved and activated! Printing contract...");
      fetchData();
    } catch (error) {
      console.error("Error approving loan:", error);
      toast.error("Failed to approve loan");
    }
  };

  const handlePrintContract = () => {
    const printContent = contractRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to print the contract");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loan Contract - ${contractData?.loan.loan_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; padding: 20px; }
            @media print {
              body { padding: 0; }
              .page-break-inside-avoid { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    setIsContractDialogOpen(false);
    setContractData(null);
  };

  const handleEditInquiry = (inquiry: InquiryWithDetails) => {
    setEditingInquiry(inquiry);
    setIsEditDialogOpen(true);
  };

  const handleStartApplication = (inquiry: InquiryWithDetails) => {
    setApplicationInquiry(inquiry);
    setIsApplicationOpen(true);
  };

  const handleSaveInquiry = async (id: string, data: Partial<InquiryWithDetails>) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Inquiry updated successfully");
      fetchInquiries();
    } catch (error) {
      console.error("Error updating inquiry:", error);
      toast.error("Failed to update inquiry");
      throw error;
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Status updated to ${newStatus}`);
      fetchInquiries();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAnyRole(['super_admin', 'admin', 'field_officer', 'accountant'])) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access Credit & Collection.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const LoanCard = ({ loan, actions }: { loan: LoanWithDetails; actions: React.ReactNode }) => (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{loan.loan_number}</h3>
            <Badge variant="outline" className={
              loan.status === 'pending' ? 'bg-muted/50 text-muted-foreground' :
              loan.status === 'under_review' ? 'bg-info/10 text-info border-info/30' :
              loan.status === 'awaiting_approval' ? 'bg-success/10 text-success border-success/30' :
              'bg-warning/10 text-warning border-warning/30'
            }>
              {loan.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {loan.client?.full_name || 'Unknown'} • {loan.client?.phone} • {loan.client?.district}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <span className="font-medium">Amount:</span> {formatCurrency(loan.total_amount)}
            </span>
            <span>
              <span className="font-medium capitalize">{loan.repayment_frequency}:</span> {formatCurrency(loan.installment_amount)}
            </span>
            {loan.asset && (
              <span className="flex items-center gap-1">
                <Bike className="h-4 w-4" />
                {loan.asset.brand} {loan.asset.model}
                {loan.asset.registration_number && ` (${loan.asset.registration_number})`}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {actions}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit & Collection</h1>
          <p className="text-muted-foreground">Manage loan applications, approvals, and daily collections</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leads</p>
                <p className="text-xl font-bold text-foreground">{stats.qualifiedLeads}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending KYC</p>
                <p className="text-xl font-bold text-foreground">{stats.pendingKYC}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final Approval</p>
                <p className="text-xl font-bold text-foreground">{stats.awaitingApproval}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-foreground">{stats.totalActive}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalOutstanding)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Today</p>
                <p className="text-xl font-bold text-foreground">{stats.todaysDue}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Loan</span> Applications
              {stats.qualifiedLeads > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.qualifiedLeads}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              KYC Review
              {stats.pendingKYC > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.pendingKYC}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="final-approval" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Final Approval
              {stats.awaitingApproval > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.awaitingApproval}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Collection
            </TabsTrigger>
          </TabsList>

          {/* Loan Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Qualified Leads - Ready for Application
                </CardTitle>
                <CardDescription>
                  Process loan applications for qualified leads. Complete KYC and submit for approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No qualified leads. They'll appear here from the Sales pipeline.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <InquiryCard
                        key={inquiry.id}
                        inquiry={inquiry}
                        onEdit={handleEditInquiry}
                        onStartApplication={handleStartApplication}
                        onUpdateStatus={handleUpdateStatus}
                        showApplicationButton={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Review Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  KYC Review - Due Diligence
                </CardTitle>
                <CardDescription>
                  Review loan applications and complete KYC before sending to Operations for asset assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoans.length === 0 && underReviewLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending KYC reviews.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending - need to start review */}
                    {pendingLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        actions={
                          <Button variant="outline" onClick={() => handleStartReview(loan.id)}>
                            Start Review
                          </Button>
                        }
                      />
                    ))}
                    {/* Under review - approve if asset assigned, otherwise send to operations */}
                    {underReviewLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        actions={
                          loan.asset ? (
                            <Button className="bg-success hover:bg-success/90" onClick={() => handleFinalApproval(loan.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve & Activate
                            </Button>
                          ) : (
                            <Button onClick={() => handleSendToOperations(loan.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send to Operations
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Final Approval Tab */}
          <TabsContent value="final-approval">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Final Approval - Ready for Disbursement
                </CardTitle>
                <CardDescription>
                  Asset has been assigned by Operations. Complete final approval to activate the loan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {awaitingApprovalLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No loans awaiting final approval.</p>
                    <p className="text-sm text-muted-foreground mt-1">They'll appear here after Operations assigns the asset.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {awaitingApprovalLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        actions={
                          <Button className="bg-success hover:bg-success/90" onClick={() => handleFinalApproval(loan.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Activate
                          </Button>
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Collection Tab */}
          <TabsContent value="collection">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Active Loans Collection
                </CardTitle>
                <CardDescription>Track daily collections and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {activeLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active loans to collect from.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeLoans.map((loan) => {
                      const isOverdue = loan.next_payment_date && loan.next_payment_date <= new Date().toISOString().split('T')[0];
                      return (
                        <div key={loan.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{loan.loan_number}</h3>
                                {isOverdue && (
                                  <Badge variant="destructive">Overdue</Badge>
                                )}
                                {loan.missed_payments > 0 && (
                                  <Badge variant="outline" className="border-destructive/30 text-destructive">
                                    {loan.missed_payments} missed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {loan.client?.full_name || 'Unknown'} • {loan.client?.phone}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <span>
                                  <span className="font-medium">Balance:</span> {formatCurrency(loan.loan_balance)}
                                </span>
                                <span>
                                  <span className="font-medium capitalize">{loan.repayment_frequency}:</span> {formatCurrency(loan.installment_amount)}
                                </span>
                                <span>
                                  <span className="font-medium">Next:</span>{' '}
                                  {loan.next_payment_date 
                                    ? new Date(loan.next_payment_date).toLocaleDateString()
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" onClick={() => navigate('/payments')}>
                              Record Payment
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Inquiry Dialog */}
      <InquiryEditDialog
        inquiry={editingInquiry}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingInquiry(null);
        }}
        onSave={handleSaveInquiry}
      />

      {/* Loan Application Dialog */}
      <LoanApplicationDialog
        inquiry={applicationInquiry}
        open={isApplicationOpen}
        onOpenChange={(open) => {
          setIsApplicationOpen(open);
          if (!open) setApplicationInquiry(null);
        }}
        onSuccess={() => {
          fetchData();
        }}
        userId={user?.id || ''}
        userBranchId={profile?.branch_id}
      />

      {/* Contract Print Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Loan Contract - {contractData?.loan.loan_number}
            </DialogTitle>
          </DialogHeader>
          
          {contractData && contractData.loan.client && contractData.loan.asset && (
            <div className="space-y-4">
              <LoanContract
                ref={contractRef}
                loan={{
                  loan_number: contractData.loan.loan_number,
                  principal_amount: contractData.loan.principal_amount,
                  total_amount: contractData.loan.total_amount,
                  down_payment: contractData.loan.down_payment,
                  loan_balance: contractData.loan.loan_balance,
                  installment_amount: contractData.loan.installment_amount,
                  total_installments: contractData.loan.total_installments,
                  repayment_frequency: contractData.loan.repayment_frequency,
                  interest_rate: contractData.loan.interest_rate,
                  start_date: contractData.loan.start_date,
                  end_date: contractData.loan.end_date,
                }}
                client={{
                  full_name: contractData.loan.client.full_name,
                  phone: contractData.loan.client.phone,
                  national_id: contractData.loan.client.national_id,
                  address: contractData.loan.client.address || '',
                  district: contractData.loan.client.district,
                  village: contractData.loan.client.village,
                  next_of_kin_name: contractData.loan.client.next_of_kin_name,
                  next_of_kin_phone: contractData.loan.client.next_of_kin_phone,
                }}
                asset={{
                  asset_type: contractData.loan.asset.asset_type,
                  brand: contractData.loan.asset.brand,
                  model: contractData.loan.asset.model,
                  chassis_number: contractData.loan.asset.chassis_number,
                  engine_number: contractData.loan.asset.engine_number,
                  registration_number: contractData.loan.asset.registration_number || undefined,
                  color: contractData.loan.asset.color,
                }}
                approvedBy={contractData.approvedBy}
                approvedAt={contractData.approvedAt}
              />
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handlePrintContract}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Contract
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CreditCollection;
