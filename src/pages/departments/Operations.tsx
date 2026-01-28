import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Package, 
  Users, 
  Truck,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle
} from "lucide-react";
import { DepartmentStatsCard } from "@/components/departments/DepartmentStatsCard";

interface CashSaleInquiry {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  occupation: string | null;
  product_interest: string | null;
  notes: string | null;
  created_at: string;
}

const Operations = () => {
  const { user, loading: authLoading, isStaff, hasAnyRole, roles } = useAuth();
  const navigate = useNavigate();
  const [cashSales, setCashSales] = useState<CashSaleInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = hasAnyRole(['super_admin', 'admin', 'operations_admin']);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isStaff()) {
      fetchCashSales();
    }
  }, [user, roles]);

  const fetchCashSales = async () => {
    try {
      setLoading(true);
      // Fetch cash sales that have been converted (sent from Sales to Operations)
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .eq("sale_type", "cash")
        .eq("status", "converted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCashSales(data || []);
    } catch (error) {
      console.error("Error fetching cash sales:", error);
      toast.error("Failed to load cash sales");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (inquiry: CashSaleInquiry) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ 
          status: "closed",
          notes: `${inquiry.notes || ""}\n[${new Date().toLocaleDateString()}] Asset assigned - Sale completed by Operations`.trim()
        })
        .eq("id", inquiry.id);

      if (error) throw error;
      
      toast.success("Asset assignment completed!");
      fetchCashSales();
    } catch (error) {
      console.error("Error completing assignment:", error);
      toast.error("Failed to complete assignment");
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAnyRole(['super_admin', 'admin', 'operations_admin', 'operations_officer'])) {
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
          <h1 className="text-2xl font-bold text-foreground">Operations Department</h1>
          <p className="text-muted-foreground">Manage asset assignments for cash sales</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DepartmentStatsCard
            title="Pending Assignments"
            value={cashSales.length}
            subtitle="Cash sales awaiting assets"
            icon={Package}
            iconBgColor="bg-warning/10"
            valueColor="text-warning"
          />
          <DepartmentStatsCard
            title="Ready for Pickup"
            value={0}
            subtitle="Assets prepared"
            icon={Truck}
            iconBgColor="bg-success/10"
            valueColor="text-success"
          />
          <DepartmentStatsCard
            title="Completed Today"
            value={0}
            subtitle="Assignments done"
            icon={CheckCircle}
            iconBgColor="bg-primary/10"
            valueColor="text-primary"
          />
        </div>

        {/* Cash Sales Awaiting Asset Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cash Sales - Awaiting Asset Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cashSales.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No cash sales pending asset assignment.</p>
                <p className="text-sm text-muted-foreground mt-1">When Sales sends cash sales here, they'll appear for processing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cashSales.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{sale.full_name}</h3>
                          <Badge className="bg-success text-success-foreground">Cash Sale</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {sale.phone}
                          </span>
                          {sale.district && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {sale.district}
                            </span>
                          )}
                          {sale.occupation && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {sale.occupation}
                            </span>
                          )}
                        </div>
                        {sale.product_interest && (
                          <p className="text-sm">
                            <span className="font-medium">Product:</span> {sale.product_interest}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Received: {new Date(sale.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {canManage && (
                          <Button size="sm" onClick={() => handleCompleteAssignment(sale)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete Assignment
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Operations;
