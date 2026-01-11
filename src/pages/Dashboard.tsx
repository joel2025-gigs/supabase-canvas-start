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
    { label: "Total Clients", value: stats?.totalClients || 0, icon: Users, color: "text-blue-500" },
    { label: "Active Loans", value: stats?.activeLoans || 0, icon: CreditCard, color: "text-green-500" },
    { label: "Available Assets", value: stats?.availableAssets || 0, icon: Bike, color: "text-purple-500" },
    { label: "Pending Payments", value: stats?.pendingPayments || 0, icon: Clock, color: "text-yellow-500" },
    { label: "Overdue Loans", value: stats?.overdueLoans || 0, icon: AlertTriangle, color: "text-orange-500" },
    { label: "Defaulted Loans", value: stats?.defaultedLoans || 0, icon: AlertTriangle, color: "text-red-500" },
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
          <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] || "User"}</h1>
          <p className="text-muted-foreground">Here's an overview of your branch operations.</p>
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-100">Total Disbursed</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(stats?.totalDisbursed || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-100">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Active loan portfolio</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100">Total Collected</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(stats?.totalCollected || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-blue-100">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Confirmed payments</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
          <h1 className="text-2xl font-bold">Welcome, {profile?.full_name?.split(" ")[0] || "Client"}</h1>
          <p className="text-muted-foreground">Your loan dashboard</p>
        </div>

        {/* Loan Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary to-primary-light text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary-foreground/70">Loan Balance</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(loan.loan_balance)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-primary-foreground/70">
                of {formatCurrency(loan.total_amount)} total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Next Payment</CardDescription>
              <CardTitle className="text-2xl">
                {nextPayment ? formatCurrency(nextPayment.amount_due) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {nextPayment ? `Due: ${new Date(nextPayment.due_date).toLocaleDateString()}` : "All paid!"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Progress</CardDescription>
              <CardTitle className="text-2xl">{paidInstallments} / {schedule.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Asset</CardTitle>
            <CardDescription>Details of your financed asset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{loan.asset?.asset_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand/Model</span>
                  <span className="font-medium">{loan.asset?.brand} {loan.asset?.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration</span>
                  <span className="font-medium">{loan.asset?.registration_number || "Pending"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPS Status</span>
                  <span className="font-medium capitalize">{loan.asset?.gps_status?.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Status</span>
                  <span className="font-medium capitalize">{loan.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repayment</span>
                  <span className="font-medium capitalize">{loan.repayment_frequency}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Your next scheduled payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.filter(s => !s.is_paid).slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">Installment #{item.installment_number}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.amount_due)}</div>
                    {item.is_overdue && (
                      <div className="text-sm text-red-500">{item.days_overdue} days overdue</div>
                    )}
                  </div>
                </div>
              ))}
              {schedule.filter(s => !s.is_paid).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  All payments completed!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{payment.payment_reference}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(payment.received_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    <div className={`text-sm capitalize ${
                      payment.status === 'confirmed' ? 'text-green-500' : 
                      payment.status === 'pending' ? 'text-yellow-500' : 'text-muted-foreground'
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
