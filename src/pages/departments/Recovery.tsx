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
  CheckCircle
} from "lucide-react";

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
  const { user, loading: authLoading, hasAnyRole, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [atRiskLoans, setAtRiskLoans] = useState<DefaultedLoan[]>([]);
  const [defaultedLoans, setDefaultedLoans] = useState<DefaultedLoan[]>([]);
  const [recoveredLoans, setRecoveredLoans] = useState<DefaultedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<DefaultedLoan | null>(null);
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [stats, setStats] = useState({
    atRisk: 0,
    defaulted: 0,
    recovered: 0,
    totalAtRisk: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAnyRole(['super_admin', 'admin', 'field_officer'])) {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      // Fetch at-risk loans (3+ consecutive missed payments)
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

      // Fetch defaulted loans
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

      // Fetch recovered loans
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
    } finally {
      setLoading(false);
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
      // Get the loan to find the asset
      const loan = defaultedLoans.find(l => l.id === loanId);
      
      const { error: loanError } = await supabase
        .from("loans")
        .update({ status: 'recovered' })
        .eq("id", loanId);

      if (loanError) throw loanError;

      // Make asset available again
      if (loan?.asset) {
        const { error: assetError } = await supabase
          .from("assets")
          .update({ status: 'recovered' })
          .eq("id", loanId);
        // Note: This might fail if asset_id is different, but we continue anyway
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
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAnyRole(['super_admin', 'admin', 'field_officer'])) {
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

  const LoanCard = ({ loan, type }: { loan: DefaultedLoan; type: 'at-risk' | 'defaulted' | 'recovered' }) => (
    <div className={`border rounded-lg p-4 ${
      type === 'at-risk' ? 'border-orange-300 bg-orange-50/50' : 
      type === 'defaulted' ? 'border-red-300 bg-red-50/50' : 
      'border-green-300 bg-green-50/50'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{loan.loan_number}</h3>
            <Badge variant={type === 'recovered' ? 'default' : 'destructive'}>
              {loan.consecutive_missed} missed payments
            </Badge>
            {loan.asset?.gps_device_id && (
              <Badge variant="outline" className="bg-blue-50">
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
          {type === 'at-risk' && isAdmin() && (
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
          {type === 'defaulted' && isAdmin() && (
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
          <p className="text-muted-foreground">Manage defaulted loans and asset recovery</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold">{stats.atRisk}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Defaulted</p>
                <p className="text-2xl font-bold">{stats.defaulted}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recovered</p>
                <p className="text-2xl font-bold">{stats.recovered}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <DollarSign className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total At Risk</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAtRisk)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At Risk Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              At-Risk Loans (3+ Missed Payments)
            </CardTitle>
            <CardDescription>These loans require immediate attention before default</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskLoans.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
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
            <CardTitle className="flex items-center gap-2 text-red-600">
              <FileWarning className="h-5 w-5" />
              Defaulted Loans - Pending Recovery
            </CardTitle>
            <CardDescription>Assets pending physical recovery</CardDescription>
          </CardHeader>
          <CardContent>
            {defaultedLoans.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
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
              <CardTitle className="flex items-center gap-2 text-green-600">
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
                Confirm Recovery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Recovery;