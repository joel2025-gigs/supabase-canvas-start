import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Bike, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";

const StaffDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [
          clientsResult,
          loansResult,
          assetsResult,
          paymentsResult,
        ] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact" }).is("deleted_at", null),
          supabase.from("loans").select("*").is("deleted_at", null),
          supabase.from("assets").select("id, status").is("deleted_at", null),
          supabase.from("payments").select("amount, status"),
        ]);

        const loans = loansResult.data || [];
        const assets = assetsResult.data || [];
        const payments = paymentsResult.data || [];

        const activeLoans = loans.filter(l => l.status === 'active').length;
        const overdueLoans = loans.filter(l => l.consecutive_missed > 0 && l.status === 'active').length;
        const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;
        const totalDisbursed = loans
          .filter(l => ['active', 'completed'].includes(l.status))
          .reduce((sum, l) => sum + Number(l.total_amount), 0);
        const totalCollected = payments
          .filter(p => p.status === 'confirmed' || p.status === 'reconciled')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        const availableAssets = assets.filter(a => a.status === 'available').length;

        setStats({
          totalClients: clientsResult.count || 0,
          activeLoans,
          totalDisbursed,
          totalCollected,
          pendingPayments,
          overdueLoans,
          defaultedLoans,
          availableAssets,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Clients", value: stats?.totalClients || 0, icon: Users, color: "text-info" },
    { label: "Active Loans", value: stats?.activeLoans || 0, icon: CreditCard, color: "text-success" },
    { label: "Available Assets", value: stats?.availableAssets || 0, icon: Bike, color: "text-primary" },
    { label: "Pending Payments", value: stats?.pendingPayments || 0, icon: Clock, color: "text-warning" },
    { label: "Overdue Loans", value: stats?.overdueLoans || 0, icon: AlertTriangle, color: "text-accent" },
    { label: "Defaulted Loans", value: stats?.defaultedLoans || 0, icon: AlertTriangle, color: "text-destructive" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "User"}</span></h1>
          <p className="text-muted-foreground">Here's an overview of your branch operations.</p>
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card border-success/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardDescription className="text-success">Total Disbursed</CardDescription>
              <CardTitle className="text-3xl text-foreground">{formatCurrency(stats?.totalDisbursed || 0)}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm">Active loan portfolio</span>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardDescription className="text-primary">Total Collected</CardDescription>
              <CardTitle className="text-3xl text-foreground">{formatCurrency(stats?.totalCollected || 0)}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">Confirmed payments</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="glass-card hover:border-primary/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

const ClientDashboard = () => {
  const [loan, setLoan] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    const fetchClientData = async () => {
      if (!user) return;

      try {
        // Find client record linked to this user
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!clientData) {
          setLoading(false);
          return;
        }

        // Fetch active loan
        const { data: loanData } = await supabase
          .from("loans")
          .select("*, asset:assets(*)")
          .eq("client_id", clientData.id)
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (loanData) {
          setLoan(loanData);

          // Fetch repayment schedule
          const { data: scheduleData } = await supabase
            .from("repayment_schedule")
            .select("*")
            .eq("loan_id", loanData.id)
            .order("due_date", { ascending: true });

          setSchedule(scheduleData || []);

          // Fetch payment history
          const { data: paymentData } = await supabase
            .from("payments")
            .select("*")
            .eq("loan_id", loanData.id)
            .order("received_at", { ascending: false });

          setPayments(paymentData || []);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!loan) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Loan</h2>
          <p className="text-muted-foreground max-w-md">
            You don't have an active loan yet. Visit one of our branches or contact a field officer to apply for asset financing.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const nextPayment = schedule.find(s => !s.is_paid);
  const paidInstallments = schedule.filter(s => s.is_paid).length;
  const progressPercent = (paidInstallments / schedule.length) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "Client"}</span></h1>
          <p className="text-muted-foreground">Your loan dashboard</p>
        </div>

        {/* Loan Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card border-primary/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardDescription className="text-primary">Loan Balance</CardDescription>
              <CardTitle className="text-3xl text-foreground">{formatCurrency(loan.loan_balance)}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-sm text-muted-foreground">
                of {formatCurrency(loan.total_amount)} total
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-warning/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-warning">Next Payment</CardDescription>
              <CardTitle className="text-2xl text-foreground">
                {nextPayment ? formatCurrency(nextPayment.amount_due) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {nextPayment ? `Due: ${new Date(nextPayment.due_date).toLocaleDateString()}` : "All paid!"}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-success/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-success">Progress</CardDescription>
              <CardTitle className="text-2xl text-foreground">{paidInstallments} / {schedule.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-success to-primary h-2 rounded-full transition-all" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Your Asset</CardTitle>
            <CardDescription>Details of your financed asset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize text-foreground">{loan.asset?.asset_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Brand/Model</span>
                  <span className="font-medium text-foreground">{loan.asset?.brand} {loan.asset?.model}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Registration</span>
                  <span className="font-medium text-primary">{loan.asset?.registration_number || "Pending"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">GPS Status</span>
                  <span className="font-medium capitalize text-foreground">{loan.asset?.gps_status?.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Loan Status</span>
                  <span className="font-medium capitalize text-success">{loan.status}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Repayment</span>
                  <span className="font-medium capitalize text-foreground">{loan.repayment_frequency}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Payments</CardTitle>
            <CardDescription>Your next scheduled payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.filter(s => !s.is_paid).slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <div className="font-medium text-foreground">Installment #{item.installment_number}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-primary">{formatCurrency(item.amount_due)}</div>
                    {item.is_overdue && (
                      <div className="text-sm text-destructive">{item.days_overdue} days overdue</div>
                    )}
                  </div>
                </div>
              ))}
              {schedule.filter(s => !s.is_paid).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  All payments completed!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Payment History</CardTitle>
            <CardDescription>Your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <div className="font-medium text-foreground">{payment.payment_reference}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(payment.received_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">{formatCurrency(payment.amount)}</div>
                    <div className={`text-sm capitalize ${
                      payment.status === 'confirmed' ? 'text-success' : 
                      payment.status === 'pending' ? 'text-warning' : 'text-muted-foreground'
                    }`}>
                      {payment.status}
                    </div>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No payments yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const Dashboard = () => {
  const { loading, isAuthenticated, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Show different dashboard based on role
  if (isStaff()) {
    return <StaffDashboard />;
  }

  return <ClientDashboard />;
};

export default Dashboard;
