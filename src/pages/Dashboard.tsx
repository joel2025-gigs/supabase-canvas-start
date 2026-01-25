import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Bike, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Package,
  FileText,
  Truck,
  UserCheck,
  Shield
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";

// Quick Action Card Component
const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  count,
  variant = 'default' 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  href: string; 
  count?: number;
  variant?: 'default' | 'warning' | 'success' | 'destructive';
}) => {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    success: 'bg-success/10 text-success border-success/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <Link to={href}>
      <Card className={`glass-card hover:border-primary/50 transition-all duration-300 cursor-pointer group ${variantStyles[variant]} border`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{title}</h3>
                {count !== undefined && count > 0 && (
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
};

// Admin Dashboard - Full system overview
const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workflowStats, setWorkflowStats] = useState({
    newInquiries: 0,
    qualifiedLeads: 0,
    pendingKYC: 0,
    awaitingAsset: 0,
    awaitingApproval: 0,
    activeLoans: 0,
    atRiskLoans: 0,
    defaultedLoans: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile, hasAnyRole } = useAuth();

  const isSuperAdmin = hasAnyRole(['super_admin']);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          clientsResult,
          loansResult,
          assetsResult,
          paymentsResult,
          inquiriesResult,
        ] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact" }).is("deleted_at", null),
          supabase.from("loans").select("*").is("deleted_at", null),
          supabase.from("assets").select("id, status").is("deleted_at", null),
          supabase.from("payments").select("amount, status"),
          supabase.from("inquiries").select("status"),
        ]);

        const loans = loansResult.data || [];
        const assets = assetsResult.data || [];
        const payments = paymentsResult.data || [];
        const inquiries = inquiriesResult.data || [];

        // Calculate workflow stats
        const newInquiries = inquiries.filter(i => i.status === 'new').length;
        const qualifiedLeads = inquiries.filter(i => i.status === 'qualified').length;
        const pendingKYC = loans.filter(l => ['pending', 'under_review'].includes(l.status)).length;
        const awaitingAsset = loans.filter(l => l.status === 'awaiting_asset').length;
        const awaitingApproval = loans.filter(l => l.status === 'awaiting_approval').length;
        const activeLoans = loans.filter(l => l.status === 'active').length;
        const atRiskLoans = loans.filter(l => l.consecutive_missed >= 2 && l.status === 'active').length;
        const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

        setWorkflowStats({
          newInquiries,
          qualifiedLeads,
          pendingKYC,
          awaitingAsset,
          awaitingApproval,
          activeLoans,
          atRiskLoans,
          defaultedLoans,
        });

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
          overdueLoans: atRiskLoans,
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
        {/* Header with Role Badge */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "Admin"}</span>
              </h1>
              <Badge variant="outline" className="border-primary/30 text-primary">
                <Shield className="h-3 w-3 mr-1" />
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
            <p className="text-muted-foreground">System overview and workflow management</p>
          </div>
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
                <span className="text-sm">{stats?.activeLoans || 0} active loans</span>
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

        {/* Workflow Pipeline */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Loan Pipeline</CardTitle>
            <CardDescription>Current workflow status across all departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <Link to="/departments/sales" className="text-center p-3 rounded-lg bg-info/10 hover:bg-info/20 transition-colors">
                <div className="text-2xl font-bold text-info">{workflowStats.newInquiries}</div>
                <div className="text-xs text-muted-foreground">New Leads</div>
              </Link>
              <Link to="/departments/sales" className="text-center p-3 rounded-lg bg-info/10 hover:bg-info/20 transition-colors">
                <div className="text-2xl font-bold text-info">{workflowStats.qualifiedLeads}</div>
                <div className="text-xs text-muted-foreground">Qualified</div>
              </Link>
              <Link to="/departments/credit-collection" className="text-center p-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors">
                <div className="text-2xl font-bold text-warning">{workflowStats.pendingKYC}</div>
                <div className="text-xs text-muted-foreground">Pending KYC</div>
              </Link>
              <Link to="/departments/operations" className="text-center p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                <div className="text-2xl font-bold text-accent">{workflowStats.awaitingAsset}</div>
                <div className="text-xs text-muted-foreground">Asset Queue</div>
              </Link>
              <Link to="/departments/credit-collection" className="text-center p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-colors">
                <div className="text-2xl font-bold text-success">{workflowStats.awaitingApproval}</div>
                <div className="text-xs text-muted-foreground">Final Approval</div>
              </Link>
              <Link to="/loans" className="text-center p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="text-2xl font-bold text-primary">{workflowStats.activeLoans}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </Link>
              <Link to="/departments/recovery" className="text-center p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors">
                <div className="text-2xl font-bold text-destructive">{workflowStats.atRiskLoans}</div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </Link>
              <Link to="/departments/recovery" className="text-center p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors">
                <div className="text-2xl font-bold text-destructive">{workflowStats.defaultedLoans}</div>
                <div className="text-xs text-muted-foreground">Defaulted</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              title="New Leads"
              description="Process incoming inquiries"
              icon={FileText}
              href="/departments/sales"
              count={workflowStats.newInquiries}
              variant="default"
            />
            <QuickActionCard
              title="Pending KYC"
              description="Review loan applications"
              icon={UserCheck}
              href="/departments/credit-collection"
              count={workflowStats.pendingKYC}
              variant="warning"
            />
            <QuickActionCard
              title="Asset Assignment"
              description="Assign assets to approved loans"
              icon={Truck}
              href="/departments/operations"
              count={workflowStats.awaitingAsset}
              variant="default"
            />
            <QuickActionCard
              title="Final Approvals"
              description="Approve and activate loans"
              icon={CheckCircle}
              href="/departments/credit-collection"
              count={workflowStats.awaitingApproval}
              variant="success"
            />
            <QuickActionCard
              title="At-Risk Accounts"
              description="Handle overdue accounts"
              icon={AlertTriangle}
              href="/departments/recovery"
              count={workflowStats.atRiskLoans}
              variant="destructive"
            />
            {isSuperAdmin && (
              <QuickActionCard
                title="User Management"
                description="Manage staff accounts"
                icon={Users}
                href="/users"
                variant="default"
              />
            )}
          </div>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
              <Users className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalClients || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Assets</CardTitle>
              <Bike className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.availableAssets || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.pendingPayments || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Defaulted</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.defaultedLoans || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Field Officer Dashboard - Focused on their work
const FieldOfficerDashboard = () => {
  const [stats, setStats] = useState({
    myClients: 0,
    pendingCollections: 0,
    overdueToday: 0,
    newLeads: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [clientsResult, loansResult, inquiriesResult] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact" }).is("deleted_at", null),
          supabase.from("loans").select("id, next_payment_date, status").eq("status", "active").is("deleted_at", null),
          supabase.from("inquiries").select("id", { count: "exact" }).eq("status", "new"),
        ]);

        const loans = loansResult.data || [];
        const overdueToday = loans.filter(l => l.next_payment_date && l.next_payment_date <= today).length;

        setStats({
          myClients: clientsResult.count || 0,
          pendingCollections: loans.length,
          overdueToday,
          newLeads: inquiriesResult.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "Agent"}</span>
          </h1>
          <Badge variant="outline" className="border-accent/30 text-accent">
            Field Officer
          </Badge>
        </div>

        {/* Today's Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card border-info/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Clients</CardTitle>
              <Users className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.myClients}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.pendingCollections}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-destructive/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Due Today</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.overdueToday}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-success/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
              <FileText className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.newLeads}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <QuickActionCard
              title="Process Leads"
              description="Follow up on new inquiries"
              icon={FileText}
              href="/departments/sales"
              count={stats.newLeads}
              variant="default"
            />
            <QuickActionCard
              title="Daily Collections"
              description="Collect payments from clients"
              icon={DollarSign}
              href="/departments/credit-collection"
              count={stats.overdueToday}
              variant={stats.overdueToday > 0 ? 'destructive' : 'success'}
            />
            <QuickActionCard
              title="Register Client"
              description="Add a new client to the system"
              icon={UserCheck}
              href="/clients"
              variant="default"
            />
            <QuickActionCard
              title="Record Payment"
              description="Record client payments"
              icon={CreditCard}
              href="/payments"
              variant="default"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Accountant Dashboard - Financial focus
const AccountantDashboard = () => {
  const [stats, setStats] = useState({
    pendingReconciliation: 0,
    totalCollectedToday: 0,
    totalOutstanding: 0,
    activeLoans: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [paymentsResult, loansResult, todayPaymentsResult] = await Promise.all([
          supabase.from("payments").select("id, status, amount"),
          supabase.from("loans").select("loan_balance, status").eq("status", "active").is("deleted_at", null),
          supabase.from("payments").select("amount").gte("received_at", today).in("status", ["confirmed", "reconciled"]),
        ]);

        const payments = paymentsResult.data || [];
        const loans = loansResult.data || [];
        const todayPayments = todayPaymentsResult.data || [];

        const pendingReconciliation = payments.filter(p => p.status === 'pending').length;
        const totalCollectedToday = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.loan_balance), 0);

        setStats({
          pendingReconciliation,
          totalCollectedToday,
          totalOutstanding,
          activeLoans: loans.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "Accountant"}</span>
          </h1>
          <Badge variant="outline" className="border-success/30 text-success">
            Accountant
          </Badge>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card border-success/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardDescription className="text-success">Collected Today</CardDescription>
              <CardTitle className="text-3xl text-foreground">{formatCurrency(stats.totalCollectedToday)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card border-primary/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardHeader className="pb-2 relative">
              <CardDescription className="text-primary">Total Outstanding</CardDescription>
              <CardTitle className="text-3xl text-foreground">{formatCurrency(stats.totalOutstanding)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reconciliation</CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.pendingReconciliation}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activeLoans}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              title="Reconcile Payments"
              description="Verify and reconcile pending payments"
              icon={CheckCircle}
              href="/payments"
              count={stats.pendingReconciliation}
              variant={stats.pendingReconciliation > 0 ? 'warning' : 'success'}
            />
            <QuickActionCard
              title="Financial Reports"
              description="View and generate reports"
              icon={FileText}
              href="/reports"
              variant="default"
            />
            <QuickActionCard
              title="Audit Logs"
              description="Review system activity"
              icon={Package}
              href="/audit-logs"
              variant="default"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Client Dashboard - Loan tracking
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
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!clientData) {
          setLoading(false);
          return;
        }

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

          const [scheduleResult, paymentsResult] = await Promise.all([
            supabase.from("repayment_schedule").select("*").eq("loan_id", loanData.id).order("due_date", { ascending: true }),
            supabase.from("payments").select("*").eq("loan_id", loanData.id).order("received_at", { ascending: false }),
          ]);

          setSchedule(scheduleResult.data || []);
          setPayments(paymentsResult.data || []);
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
  const progressPercent = schedule.length > 0 ? (paidInstallments / schedule.length) * 100 : 0;

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

        {/* Upcoming Payments & History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Upcoming Payments</CardTitle>
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

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Payment History</CardTitle>
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
      </div>
    </DashboardLayout>
  );
};

const Dashboard = () => {
  const { loading, isAuthenticated, hasAnyRole, hasRole } = useAuth();
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

  // Show role-specific dashboard
  if (hasAnyRole(['super_admin', 'admin'])) {
    return <AdminDashboard />;
  }

  // Department admins, officers, and generic staff get staff dashboard
  if (hasAnyRole(['operations_admin', 'sales_admin', 'credit_admin', 'recovery_admin', 'sales_officer', 'credit_officer', 'recovery_officer', 'operations_officer', 'staff'])) {
    return <FieldOfficerDashboard />;
  }

  if (hasRole('accountant')) {
    return <AccountantDashboard />;
  }

  // Only clients get the client dashboard
  return <ClientDashboard />;
};

export default Dashboard;
