import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bike, 
  Package,
  CheckCircle,
  Clock,
  User,
  Truck,
  Settings,
  ArrowRight
} from "lucide-react";

interface LoanAwaitingAsset {
  id: string;
  loan_number: string;
  principal_amount: number;
  total_amount: number;
  repayment_frequency: string;
  client: {
    id: string;
    full_name: string;
    phone: string;
    district: string;
  } | null;
  asset: {
    id: string;
    asset_type: string;
    brand: string;
    model: string;
    chassis_number: string;
    engine_number: string | null;
    registration_number: string | null;
    color: string | null;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const Operations = () => {
  const { user, loading: authLoading, hasAnyRole, roles } = useAuth();
  const navigate = useNavigate();
  const [loansAwaitingAsset, setLoansAwaitingAsset] = useState<LoanAwaitingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningLoan, setAssigningLoan] = useState<LoanAwaitingAsset | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assetDetails, setAssetDetails] = useState({
    chassis_number: '',
    engine_number: '',
    registration_number: '',
    color: '',
    gps_device_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    awaitingAsset: 0,
    assignedToday: 0,
    totalAssigned: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAnyRole(['super_admin', 'admin', 'field_officer'])) {
      fetchData();
    }
  }, [user, roles]);

  const fetchData = async () => {
    try {
      // Fetch loans awaiting asset assignment
      const { data, error } = await supabase
        .from("loans")
        .select(`
          id, loan_number, principal_amount, total_amount, repayment_frequency,
          client:clients(id, full_name, phone, district),
          asset:assets(id, asset_type, brand, model, chassis_number, engine_number, registration_number, color)
        `)
        .eq("status", "awaiting_asset")
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLoansAwaitingAsset(data || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      
      // Count assigned today
      const { count: assignedToday } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("status", "awaiting_approval")
        .gte("updated_at", today);

      // Count total active/assigned
      const { count: totalActive } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "awaiting_approval"]);

      setStats({
        awaitingAsset: data?.length || 0,
        assignedToday: assignedToday || 0,
        totalAssigned: totalActive || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignDialog = (loan: LoanAwaitingAsset) => {
    setAssigningLoan(loan);
    // Pre-fill with existing asset data if available
    if (loan.asset) {
      setAssetDetails({
        chassis_number: loan.asset.chassis_number || '',
        engine_number: loan.asset.engine_number || '',
        registration_number: loan.asset.registration_number || '',
        color: loan.asset.color || '',
        gps_device_id: '',
      });
    } else {
      setAssetDetails({
        chassis_number: '',
        engine_number: '',
        registration_number: '',
        color: '',
        gps_device_id: '',
      });
    }
    setIsAssignDialogOpen(true);
  };

  const handleAssignAsset = async () => {
    if (!assigningLoan || !assetDetails.chassis_number || !assetDetails.registration_number) {
      toast.error("Chassis number and registration number are required");
      return;
    }

    setSubmitting(true);
    try {
      // Update the asset with physical details
      if (assigningLoan.asset) {
        const { error: assetError } = await supabase
          .from("assets")
          .update({
            chassis_number: assetDetails.chassis_number,
            engine_number: assetDetails.engine_number || null,
            registration_number: assetDetails.registration_number,
            color: assetDetails.color || null,
            gps_device_id: assetDetails.gps_device_id || null,
            gps_status: assetDetails.gps_device_id ? 'installed' : 'not_installed',
          })
          .eq("id", assigningLoan.asset.id);

        if (assetError) throw assetError;
      }

      // Update loan status to awaiting_approval
      const { error: loanError } = await supabase
        .from("loans")
        .update({ 
          status: 'awaiting_approval',
          updated_at: new Date().toISOString()
        })
        .eq("id", assigningLoan.id);

      if (loanError) throw loanError;

      toast.success("Asset assigned successfully! Sent to Credit for final approval.");
      setIsAssignDialogOpen(false);
      setAssigningLoan(null);
      fetchData();
    } catch (error) {
      console.error("Error assigning asset:", error);
      toast.error("Failed to assign asset");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
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
            <p className="text-muted-foreground">You don't have permission to access Operations.</p>
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
          <h1 className="text-2xl font-bold text-foreground">Operations - Asset Disbursement</h1>
          <p className="text-muted-foreground">Assign physical assets to approved loans and send for final approval</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Assignment</p>
                <p className="text-2xl font-bold text-foreground">{stats.awaitingAsset}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <Truck className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Today</p>
                <p className="text-2xl font-bold text-foreground">{stats.assignedToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Bike className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalAssigned}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loans Awaiting Asset Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              Loans Awaiting Asset Assignment
            </CardTitle>
            <CardDescription>
              These loans have completed KYC and need physical asset details before final approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loansAwaitingAsset.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No loans awaiting asset assignment.</p>
                <p className="text-sm text-muted-foreground mt-1">They'll appear here from the Credit department.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loansAwaitingAsset.map((loan) => (
                  <div key={loan.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{loan.loan_number}</h3>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                            Awaiting Asset
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {loan.client?.full_name || 'Unknown'} • {loan.client?.phone} • {loan.client?.district}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span>
                            <span className="font-medium">Loan:</span> {formatCurrency(loan.total_amount)}
                          </span>
                          <span>
                            <span className="font-medium">Frequency:</span>{' '}
                            <span className="capitalize">{loan.repayment_frequency}</span>
                          </span>
                          {loan.asset && (
                            <span>
                              <span className="font-medium">Product:</span>{' '}
                              {loan.asset.brand} {loan.asset.model} ({loan.asset.asset_type})
                            </span>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => handleOpenAssignDialog(loan)} className="shrink-0">
                        <Settings className="h-4 w-4 mr-2" />
                        Assign Asset
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Asset Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Physical Asset</DialogTitle>
            <DialogDescription>
              Enter the physical asset details for {assigningLoan?.client?.full_name}'s loan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Loan Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Number:</span>
                <span className="font-medium">{assigningLoan?.loan_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">
                  {assigningLoan?.asset?.brand} {assigningLoan?.asset?.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">{formatCurrency(assigningLoan?.total_amount || 0)}</span>
              </div>
            </div>

            {/* Asset Details Form */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chassis_number">Chassis Number *</Label>
                  <Input
                    id="chassis_number"
                    placeholder="e.g., ABC123456789"
                    value={assetDetails.chassis_number}
                    onChange={(e) => setAssetDetails(prev => ({ ...prev, chassis_number: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine_number">Engine Number</Label>
                  <Input
                    id="engine_number"
                    placeholder="e.g., ENG123456"
                    value={assetDetails.engine_number}
                    onChange={(e) => setAssetDetails(prev => ({ ...prev, engine_number: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Plate Number *</Label>
                  <Input
                    id="registration_number"
                    placeholder="e.g., UBE 123A"
                    value={assetDetails.registration_number}
                    onChange={(e) => setAssetDetails(prev => ({ ...prev, registration_number: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Red"
                    value={assetDetails.color}
                    onChange={(e) => setAssetDetails(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gps_device_id">GPS Device ID (Optional)</Label>
                <Input
                  id="gps_device_id"
                  placeholder="e.g., GPS001234"
                  value={assetDetails.gps_device_id}
                  onChange={(e) => setAssetDetails(prev => ({ ...prev, gps_device_id: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">If GPS is installed, enter the device tracking ID</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAsset} disabled={submitting}>
              {submitting ? "Assigning..." : "Assign & Send to Credit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Operations;
