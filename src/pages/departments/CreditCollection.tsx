import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  User
} from "lucide-react";

interface LoanWithDetails {
  id: string;
  loan_number: string;
  principal_amount: number;
  total_amount: number;
  loan_balance: number;
  installment_amount: number;
  status: string;
  start_date: string;
  next_payment_date: string | null;
  missed_payments: number;
  client: {
    full_name: string;
    phone: string;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const CreditCollection = () => {
  const { user, loading: authLoading, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [activeLoans, setActiveLoans] = useState<LoanWithDetails[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalPending: 0,
    totalOutstanding: 0,
    todaysDue: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAnyRole(['super_admin', 'admin', 'field_officer', 'accountant'])) {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      // Fetch active loans for collection
      const { data: active, error: activeError } = await supabase
        .from("loans")
        .select(`
          id, loan_number, principal_amount, total_amount, loan_balance,
          installment_amount, status, start_date, next_payment_date, missed_payments,
          client:clients(full_name, phone)
        `)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("next_payment_date", { ascending: true });

      if (activeError) throw activeError;

      // Fetch pending loans for approval
      const { data: pending, error: pendingError } = await supabase
        .from("loans")
        .select(`
          id, loan_number, principal_amount, total_amount, loan_balance,
          installment_amount, status, start_date, next_payment_date, missed_payments,
          client:clients(full_name, phone)
        `)
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;

      setActiveLoans(active || []);
      setPendingLoans(pending || []);

      // Calculate stats
      const totalOutstanding = (active || []).reduce((sum, loan) => sum + Number(loan.loan_balance), 0);
      const today = new Date().toISOString().split('T')[0];
      const todaysDue = (active || []).filter(loan => 
        loan.next_payment_date && loan.next_payment_date <= today
      ).length;

      setStats({
        totalActive: active?.length || 0,
        totalPending: pending?.length || 0,
        totalOutstanding,
        todaysDue,
      });
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from("loans")
        .update({ 
          status: 'active',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", loanId);

      if (error) throw error;
      
      toast.success("Loan approved successfully");
      fetchLoans();
    } catch (error) {
      console.error("Error approving loan:", error);
      toast.error("Failed to approve loan");
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit & Collection</h1>
          <p className="text-muted-foreground">Manage loan approvals and daily collections</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalActive}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalPending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalOutstanding)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <AlertTriangle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold text-foreground">{stats.todaysDue}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        {pendingLoans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Loan Approvals
              </CardTitle>
              <CardDescription>Review and approve new loan applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <div key={loan.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{loan.loan_number}</h3>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                            Pending
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {loan.client?.full_name || 'Unknown'} • {loan.client?.phone}
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">Amount:</span> {formatCurrency(loan.total_amount)}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Daily:</span> {formatCurrency(loan.installment_amount)}
                        </p>
                      </div>
                      <Button onClick={() => handleApproveLoan(loan.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Loans - Collection */}
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
                    <div key={loan.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-accent/30 bg-accent/5' : ''}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{loan.loan_number}</h3>
                            {isOverdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                            {loan.missed_payments > 0 && (
                              <Badge variant="outline" className="text-orange-600">
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
                              <span className="font-medium">Daily:</span> {formatCurrency(loan.installment_amount)}
                            </span>
                            {loan.next_payment_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Next: {new Date(loan.next_payment_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/payments?loan=${loan.id}`)}>
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
      </div>
    </DashboardLayout>
  );
};

export default CreditCollection;