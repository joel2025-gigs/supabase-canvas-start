import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  FileWarning,
  CheckCircle,
  TrendingDown,
  Users,
  Target,
  UserPlus,
  Percent,
  RefreshCw
} from "lucide-react";
import { DepartmentStatsCard } from "@/components/departments/DepartmentStatsCard";
import { OfficerManagement } from "@/components/departments/OfficerManagement";
import { RecordPerformanceDialog } from "@/components/departments/RecordPerformanceDialog";

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

interface DefaultedLoan {
  id: string;
  loan_number: string;
  principal_amount: number;
  total_amount: number;
  loan_balance: number;
  missed_payments: number;
  consecutive_missed: number;
  status: string;
  start_date: string;
  last_payment_date: string | null;
  recovery_initiated_at: string | null;
  recovery_notes: string | null;
  client: {
    full_name: string;
    phone: string;
    address: string;
    district: string;
  } | null;
  asset: {
    asset_type: string;
    brand: string;
    model: string;
    registration_number: string | null;
    gps_device_id: string | null;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const Recovery = () => {
  const { user, loading: authLoading, hasAnyRole, isAdmin, roles } = useAuth();
  const navigate = useNavigate();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [target, setTarget] = useState<DepartmentTarget | null>(null);
  const [atRiskLoans, setAtRiskLoans] = useState<DefaultedLoan[]>([]);
  const [defaultedLoans, setDefaultedLoans] = useState<DefaultedLoan[]>([]);
  const [recoveredLoans, setRecoveredLoans] = useState<DefaultedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<DefaultedLoan | null>(null);
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    recoveryRate: 0,
    totalRecovered: 0,
  });
  const [stats, setStats] = useState({
    atRisk: 0,
    defaulted: 0,
    recovered: 0,
    totalAtRisk: 0,
  });

  const canManage = hasAnyRole(['super_admin', 'admin', 'recovery_admin']);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAnyRole(['super_admin', 'admin', 'recovery_admin', 'recovery_officer'])) {
      fetchData();
    }
  }, [user, roles]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchOfficers(), fetchTarget(), fetchLoans(), fetchPerformance()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from("department_officers")
        .select("*")
        .eq("department", "recovery")
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
        .eq("department", "recovery")
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
        .select("recovery_rate, total_recovered_amount")
        .eq("department", "recovery")
        .gte("period_start", weekStart.toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setPerformanceStats({
          recoveryRate: data[0].recovery_rate || 0,
          totalRecovered: data[0].total_recovered_amount || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching performance:", error);
    }
  };

  const fetchLoans = async () => {
    try {
      const { data: atRisk, error: atRiskError } = await supabase
        .from("loans")
        .select(`
          id, loan_number, principal_amount, total_amount, loan_balance,
          missed_payments, consecutive_missed, status, start_date, 
          last_payment_date, recovery_initiated_at, recovery_notes,
          client:clients(full_name, phone, address, district),
          asset:assets(asset_type, brand, model, registration_number, gps_device_id)
        `)
        .eq("status", "active")
        .gte("consecutive_missed", 3)
        .is("deleted_at", null)
        .order("consecutive_missed", { ascending: false });

      if (atRiskError) throw atRiskError;

      const { data: defaulted, error: defaultedError } = await supabase
        .from("loans")
        .select(`
          id, loan_number, principal_amount, total_amount, loan_balance,
          missed_payments, consecutive_missed, status, start_date,
          last_payment_date, recovery_initiated_at, recovery_notes,
          client:clients(full_name, phone, address, district),
          asset:assets(asset_type, brand, model, registration_number, gps_device_id)
        `)
        .eq("status", "defaulted")
        .is("deleted_at", null)
        .order("recovery_initiated_at", { ascending: false });

      if (defaultedError) throw defaultedError;

      const { data: recovered, error: recoveredError } = await supabase
        .from("loans")
        .select(`
          id, loan_number, principal_amount, total_amount, loan_balance,
          missed_payments, consecutive_missed, status, start_date,
          last_payment_date, recovery_initiated_at, recovery_notes,
          client:clients(full_name, phone, address, district),
          asset:assets(asset_type, brand, model, registration_number, gps_device_id)
        `)
        .eq("status", "recovered")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (recoveredError) throw recoveredError;

      setAtRiskLoans(atRisk || []);
      setDefaultedLoans(defaulted || []);
      setRecoveredLoans(recovered || []);

      const totalAtRisk = (atRisk || []).reduce((sum, loan) => sum + Number(loan.loan_balance), 0) +
                          (defaulted || []).reduce((sum, loan) => sum + Number(loan.loan_balance), 0);

      setStats({
        atRisk: atRisk?.length || 0,
        defaulted: defaulted?.length || 0,
        recovered: recovered?.length || 0,
        totalAtRisk,
      });
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load recovery data");
    }
  };

  const handleInitiateRecovery = async () => {
    if (!selectedLoan) return;
    
    try {
      const { error } = await supabase
        .from("loans")
        .update({ 
          status: 'defaulted',
          recovery_initiated_at: new Date().toISOString(),
          recovery_notes: recoveryNotes
        })
        .eq("id", selectedLoan.id);

      if (error) throw error;
      
      toast.success("Recovery initiated for loan " + selectedLoan.loan_number);
      setShowRecoveryDialog(false);
      setSelectedLoan(null);
      setRecoveryNotes("");
      fetchLoans();
    } catch (error) {
      console.error("Error initiating recovery:", error);
      toast.error("Failed to initiate recovery");
    }
  };

  const handleMarkRecovered = async (loanId: string) => {
    try {
      const loan = defaultedLoans.find(l => l.id === loanId);
      
      const { error: loanError } = await supabase
        .from("loans")
        .update({ status: 'recovered' })
        .eq("id", loanId);

      if (loanError) throw loanError;

      if (loan?.asset) {
        await supabase
          .from("assets")
          .update({ status: 'recovered' })
          .eq("id", loanId);
      }
      
      toast.success("Loan marked as recovered - asset available for reassignment");
      fetchLoans();
    } catch (error) {
      console.error("Error marking as recovered:", error);
      toast.error("Failed to mark as recovered");
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

  if (!hasAnyRole(['super_admin', 'admin', 'recovery_admin', 'recovery_officer'])) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access Recovery.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const targetValue = target?.target_value || 95;
  const isBelowTarget = performanceStats.recoveryRate < targetValue;

  const LoanCard = ({ loan, type }: { loan: DefaultedLoan; type: 'at-risk' | 'defaulted' | 'recovered' }) => (
    <div className={`border rounded-lg p-4 ${
      type === 'at-risk' ? 'border-warning/30 bg-warning/5' : 
      type === 'defaulted' ? 'border-destructive/30 bg-destructive/5' : 
      'border-success/30 bg-success/5'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{loan.loan_number}</h3>
            <Badge variant={type === 'recovered' ? 'default' : 'destructive'}>
              {loan.consecutive_missed} missed payments
            </Badge>
            {loan.asset?.gps_device_id && (
              <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                <MapPin className="h-3 w-3 mr-1" />
                GPS Tracked
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              {loan.client?.full_name || 'Unknown'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {loan.client?.phone}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {loan.client?.address}, {loan.client?.district}
            </div>
            {loan.last_payment_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Last paid: {new Date(loan.last_payment_date).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm pt-2">
            <span>
              <span className="font-medium">Asset:</span>{' '}
              {loan.asset?.brand} {loan.asset?.model} ({loan.asset?.asset_type})
            </span>
            {loan.asset?.registration_number && (
              <span>
                <span className="font-medium">Reg:</span> {loan.asset.registration_number}
              </span>
            )}
            <span>
              <span className="font-medium">Balance:</span> {formatCurrency(loan.loan_balance)}
            </span>
          </div>

          {loan.recovery_notes && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              Notes: {loan.recovery_notes}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {type === 'at-risk' && canManage && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                setSelectedLoan(loan);
                setShowRecoveryDialog(true);
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Initiate Recovery
            </Button>
          )}
          {type === 'defaulted' && canManage && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleMarkRecovered(loan.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Recovered
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recovery Department</h1>
          <p className="text-muted-foreground">Manage recovery officers and track collection rates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DepartmentStatsCard
            title="Recovery Rate"
            value={`${performanceStats.recoveryRate.toFixed(1)}%`}
            target={targetValue}
            showProgress
            subtitle={`Target: ${targetValue}%`}
            icon={TrendingDown}
            iconBgColor="bg-warning/10"
            valueColor={isBelowTarget ? "text-destructive" : "text-success"}
            isBelowTarget={isBelowTarget}
          />
          <DepartmentStatsCard
            title="Total Recovered"
            value={formatCurrency(performanceStats.totalRecovered)}
            subtitle="This week"
            icon={DollarSign}
            iconBgColor="bg-success/10"
            valueColor="text-foreground"
          />
          <DepartmentStatsCard
            title="Recovery Officers"
            value={officers.length}
            subtitle=""
            icon={Users}
            iconBgColor="bg-success/10"
            valueColor="text-foreground"
          />
          <DepartmentStatsCard
            title="Target"
            value={`${targetValue}%`}
            subtitle="Weekly recovery target"
            icon={Target}
            iconBgColor="bg-success/10"
            valueColor="text-success"
          />
        </div>

        {/* Action Buttons */}
        {canManage && (
          <div className="flex gap-3">
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Recovery Officer
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
          department="recovery"
          officers={officers}
          maxOfficers={target?.max_officers || 4}
          canManage={canManage}
          onRefresh={fetchOfficers}
          userId={user?.id || ""}
        />

        {/* At Risk Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Clock className="h-5 w-5" />
              At-Risk Loans (3+ Missed Payments)
            </CardTitle>
            <CardDescription>These loans require immediate attention before default</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskLoans.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">No at-risk loans. Great job on collections!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {atRiskLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} type="at-risk" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defaulted Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <FileWarning className="h-5 w-5" />
              Defaulted Loans - Pending Recovery
            </CardTitle>
            <CardDescription>Assets pending physical recovery</CardDescription>
          </CardHeader>
          <CardContent>
            {defaultedLoans.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">No loans in default status.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {defaultedLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} type="defaulted" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Recovered */}
        {recoveredLoans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <Shield className="h-5 w-5" />
                Recently Recovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recoveredLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} type="recovered" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recovery Dialog */}
        <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Recovery</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to initiate recovery for loan <strong>{selectedLoan?.loan_number}</strong>.
                This will mark the loan as defaulted and flag the asset for recovery.
              </p>
              <div>
                <label className="text-sm font-medium mb-2 block">Recovery Notes</label>
                <Textarea
                  placeholder="Add notes about the recovery case..."
                  value={recoveryNotes}
                  onChange={(e) => setRecoveryNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRecoveryDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleInitiateRecovery}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Initiate Recovery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Performance Dialog */}
        <RecordPerformanceDialog
          open={isPerformanceDialogOpen}
          onOpenChange={setIsPerformanceDialogOpen}
          department="recovery"
          officers={officers}
          userId={user?.id || ""}
          onSuccess={fetchData}
        />
      </div>
    </DashboardLayout>
  );
};

export default Recovery;
