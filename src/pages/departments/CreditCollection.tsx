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
  TrendingDown,
  DollarSign,
  User,
  FileText,
  Users,
  ArrowRight,
  Send,
  Bike,
  Printer,
  UserPlus,
  Percent,
  Target
} from "lucide-react";
import { DepartmentStatsCard } from "@/components/departments/DepartmentStatsCard";
import { OfficerManagement } from "@/components/departments/OfficerManagement";
import { RecordPerformanceDialog } from "@/components/departments/RecordPerformanceDialog";
import { InquiryCard, type InquiryWithDetails } from "@/components/loans/InquiryCard";
import { InquiryEditDialog } from "@/components/loans/InquiryEditDialog";
import { LoanApplicationDialog } from "@/components/loans/LoanApplicationDialog";
import { LoanContract } from "@/components/loans/LoanContract";

interface Officer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface DepartmentTarget {
  target_value: number;
  max_officers: number;
  per_officer_target: number;
}

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
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [target, setTarget] = useState<DepartmentTarget | null>(null);
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
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    currentLoansPercent: 0,
    collectionRate: 0,
  });
  const [stats, setStats] = useState({
    totalActive: 0,
    pendingKYC: 0,
    awaitingApproval: 0,
    totalOutstanding: 0,
    todaysDue: 0,
    qualifiedLeads: 0,
  });

  const canManage = hasAnyRole(['super_admin', 'admin', 'credit_admin']);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAnyRole(['super_admin', 'admin', 'credit_admin', 'credit_officer', 'accountant'])) {
      fetchData();
    }
  }, [user, roles]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchOfficers(), fetchTarget(), fetchLoans(), fetchInquiries(), fetchPerformance()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from("department_officers")
        .select("*")
        .eq("department", "credit_collection")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error("Error fetching officers:", error);
    }
  };

  const fetchTarget = async () => {
    try {
      const { data, error } = await supabase
        .from("department_targets")
        .select("target_value, max_officers, per_officer_target")
        .eq("department", "credit_collection")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setTarget(data);
    } catch (error) {
      console.error("Error fetching target:", error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const { data, error } = await supabase
        .from("department_performance")
        .select("collection_rate, default_rate, amount_disbursed")
        .eq("department", "credit_collection")
        .gte("period_start", weekStart.toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setPerformanceStats({
          currentLoansPercent: data[0].collection_rate || 0,
          collectionRate: data[0].collection_rate || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching performance:", error);
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
      
      const { error } = await supabase
        .from("loans")
        .update({ 
          status: 'active',
          approved_by: user?.id,
          approved_at: approvedAt
        })
        .eq("id", loanId);

      if (error) throw error;
      
      const loan = awaitingApprovalLoans.find(l => l.id === loanId);
      
      if (loan) {
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAnyRole(['super_admin', 'admin', 'credit_admin', 'credit_officer', 'accountant'])) {
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

  const targetValue = target?.target_value || 75;
  const isBelowTarget = performanceStats.currentLoansPercent < targetValue;

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
          <h1 className="text-2xl font-bold text-foreground">Credit Department</h1>
          <p className="text-muted-foreground">Manage credit officers and track loan performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DepartmentStatsCard
            title="Current Loans"
            value={`${performanceStats.currentLoansPercent.toFixed(1)}%`}
            target={targetValue}
            showProgress
            subtitle={`Target: ${targetValue}%`}
            icon={TrendingDown}
            iconBgColor="bg-warning/10"
            valueColor={isBelowTarget ? "text-destructive" : "text-success"}
            isBelowTarget={isBelowTarget}
          />
          <DepartmentStatsCard
            title="Credit Officers"
            value={officers.length}
            subtitle=""
            icon={Users}
            iconBgColor="bg-success/10"
            valueColor="text-foreground"
          />
          <DepartmentStatsCard
            title="Target"
            value={`${targetValue}%`}
            subtitle="Weekly current loan target"
            icon={Target}
            iconBgColor="bg-success/10"
            valueColor="text-success"
          />
          <DepartmentStatsCard
            title="Payment Cycle"
            value="Weekly"
            subtitle=""
            icon={Clock}
            iconBgColor="bg-success/10"
            valueColor="text-foreground"
          />
        </div>

        {/* Action Buttons */}
        {canManage && (
          <div className="flex gap-3">
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Credit Officer
            </Button>
            <Button 
              variant="outline" 
              className="border-success text-success hover:bg-success/10"
              onClick={() => setIsPerformanceDialogOpen(true)}
            >
              <Percent className="h-4 w-4 mr-2" />
              Record Performance
            </Button>
          </div>
        )}

        {/* Officers List */}
        <OfficerManagement
          department="credit_collection"
          officers={officers}
          maxOfficers={target?.max_officers || 4}
          canManage={canManage}
          onRefresh={fetchOfficers}
          userId={user?.id || ""}
        />

        {/* Loan Management Tabs */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications">Applications ({stats.qualifiedLeads})</TabsTrigger>
            <TabsTrigger value="pending">Pending KYC ({stats.pendingKYC})</TabsTrigger>
            <TabsTrigger value="approval">Final Approval ({stats.awaitingApproval})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.totalActive})</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Loan Applications (Qualified Leads)
                </CardTitle>
                <CardDescription>Convert qualified leads into formal loan applications</CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No qualified leads. Sales team will send qualified leads here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <InquiryCard
                        key={inquiry.id}
                        inquiry={inquiry}
                        onEdit={handleEditInquiry}
                        onUpdateStatus={handleUpdateStatus}
                        showApplicationButton
                        onStartApplication={handleStartApplication}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending KYC Review
                </CardTitle>
                <CardDescription>Review client documents and verify information</CardDescription>
              </CardHeader>
              <CardContent>
                {[...pendingLoans, ...underReviewLoans].length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-muted-foreground">No loans pending KYC review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...pendingLoans, ...underReviewLoans].map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        actions={
                          <>
                            {loan.status === 'pending' && (
                              <Button size="sm" onClick={() => handleStartReview(loan.id)}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Start Review
                              </Button>
                            )}
                            {loan.status === 'under_review' && (
                              <>
                                {loan.asset ? (
                                  <Button 
                                    size="sm" 
                                    className="bg-success hover:bg-success/90"
                                    onClick={() => {
                                      supabase.from("loans").update({ status: 'awaiting_approval' }).eq("id", loan.id)
                                        .then(() => { toast.success("Moved to final approval"); fetchData(); });
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Ready for Approval
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleSendToOperations(loan.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send to Operations
                                  </Button>
                                )}
                              </>
                            )}
                          </>
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  Awaiting Final Approval
                </CardTitle>
                <CardDescription>Loans ready for Credit Admin approval and contract generation</CardDescription>
              </CardHeader>
              <CardContent>
                {awaitingApprovalLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No loans awaiting final approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {awaitingApprovalLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        actions={
                          canManage && (
                            <Button 
                              size="sm" 
                              className="bg-success hover:bg-success/90"
                              onClick={() => handleFinalApproval(loan.id)}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Approve & Print Contract
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

          <TabsContent value="active" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Active Loans
                </CardTitle>
                <CardDescription>Monitor active loans and collections</CardDescription>
              </CardHeader>
              <CardContent>
                {activeLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active loans.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeLoans.slice(0, 10).map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        actions={
                          loan.missed_payments && loan.missed_payments >= 3 ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              At Risk
                            </Badge>
                          ) : null
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <InquiryEditDialog
          inquiry={editingInquiry}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveInquiry}
        />

        <LoanApplicationDialog
          open={isApplicationOpen}
          onOpenChange={setIsApplicationOpen}
          inquiry={applicationInquiry}
          userId={user?.id || ""}
          onSuccess={() => {
            fetchData();
            setApplicationInquiry(null);
          }}
        />

        <RecordPerformanceDialog
          open={isPerformanceDialogOpen}
          onOpenChange={setIsPerformanceDialogOpen}
          department="credit_collection"
          officers={officers}
          userId={user?.id || ""}
          onSuccess={fetchData}
        />

        {/* Contract Print Dialog */}
        <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asset Financing Contract</DialogTitle>
            </DialogHeader>
            {contractData && contractData.loan.client && contractData.loan.asset && (
              <>
                <div ref={contractRef}>
                  <LoanContract
                    loan={contractData.loan}
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
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={handlePrintContract}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Contract
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CreditCollection;
