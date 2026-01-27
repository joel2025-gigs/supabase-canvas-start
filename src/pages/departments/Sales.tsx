import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingDown, 
  Users, 
  Target, 
  Hash,
  UserPlus,
  ShoppingCart
} from "lucide-react";
import { DepartmentStatsCard } from "@/components/departments/DepartmentStatsCard";
import { OfficerManagement } from "@/components/departments/OfficerManagement";
import { RecordPerformanceDialog } from "@/components/departments/RecordPerformanceDialog";
import { InquiryCard, type InquiryWithDetails } from "@/components/loans/InquiryCard";
import { InquiryEditDialog } from "@/components/loans/InquiryEditDialog";

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

const Sales = () => {
  const { user, loading: authLoading, isStaff, hasAnyRole, roles } = useAuth();
  const navigate = useNavigate();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [target, setTarget] = useState<DepartmentTarget | null>(null);
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInquiry, setEditingInquiry] = useState<InquiryWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    cashSales: 0,
    loanSales: 0,
    officerCount: 0,
  });

  const canManage = hasAnyRole(['super_admin', 'admin', 'sales_admin']);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isStaff()) {
      fetchData();
    }
  }, [user, roles]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchOfficers(), fetchTarget(), fetchInquiries(), fetchPerformance()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from("department_officers")
        .select("*")
        .eq("department", "sales")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOfficers(data || []);
      setStats(prev => ({ ...prev, officerCount: data?.length || 0 }));
    } catch (error) {
      console.error("Error fetching officers:", error);
    }
  };

  const fetchTarget = async () => {
    try {
      const { data, error } = await supabase
        .from("department_targets")
        .select("target_value, max_officers, per_officer_target")
        .eq("department", "sales")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setTarget(data);
    } catch (error) {
      console.error("Error fetching target:", error);
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    }
  };

  const fetchPerformance = async () => {
    try {
      // Get current week's performance
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const { data, error } = await supabase
        .from("department_performance")
        .select("cash_sales_count, loan_sales_count, total_sales_amount")
        .eq("department", "sales")
        .gte("period_start", weekStart.toISOString().split("T")[0]);

      if (error) throw error;

      const totals = (data || []).reduce(
        (acc, curr) => ({
          cashSales: acc.cashSales + (curr.cash_sales_count || 0),
          loanSales: acc.loanSales + (curr.loan_sales_count || 0),
          totalSales: acc.totalSales + (curr.cash_sales_count || 0) + (curr.loan_sales_count || 0),
        }),
        { cashSales: 0, loanSales: 0, totalSales: 0 }
      );

      setStats(prev => ({
        ...prev,
        ...totals,
      }));
    } catch (error) {
      console.error("Error fetching performance:", error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ 
          status: newStatus,
          followed_up_at: newStatus === 'contacted' ? new Date().toISOString() : undefined,
          followed_up_by: newStatus === 'contacted' ? user?.id : undefined
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Status updated to ${newStatus}`);
      fetchInquiries();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSendToOperations = async (inquiry: InquiryWithDetails) => {
    try {
      // For cash sales, mark as converted and ready for Operations
      const { error } = await supabase
        .from("inquiries")
        .update({ 
          status: "converted",
          notes: `${inquiry.notes || ""}\n[${new Date().toLocaleDateString()}] Cash sale - Sent to Operations for asset assignment`.trim()
        })
        .eq("id", inquiry.id);

      if (error) throw error;
      
      toast.success("Cash sale sent to Operations for asset assignment");
      fetchInquiries();
    } catch (error) {
      console.error("Error sending to operations:", error);
      toast.error("Failed to send to operations");
    }
  };

  const handleSendToCredit = async (inquiry: InquiryWithDetails) => {
    try {
      // For loan sales, mark as qualified and ready for Credit department
      const { error } = await supabase
        .from("inquiries")
        .update({ 
          status: "converted",
          notes: `${inquiry.notes || ""}\n[${new Date().toLocaleDateString()}] Loan sale - Sent to Credit for loan processing`.trim()
        })
        .eq("id", inquiry.id);

      if (error) throw error;
      
      toast.success("Loan application sent to Credit department");
      fetchInquiries();
    } catch (error) {
      console.error("Error sending to credit:", error);
      toast.error("Failed to send to credit");
    }
  };

  const handleEditInquiry = (inquiry: InquiryWithDetails) => {
    setEditingInquiry(inquiry);
    setIsEditDialogOpen(true);
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

  if (!hasAnyRole(['super_admin', 'admin', 'sales_admin', 'sales_officer'])) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access Sales.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const targetValue = target?.target_value || 100;
  const isBelowTarget = stats.totalSales < targetValue;
  const toGo = Math.max(0, targetValue - stats.totalSales);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Department</h1>
          <p className="text-muted-foreground">Manage sales officers and track weekly sales</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DepartmentStatsCard
            title="Total Sales"
            value={stats.totalSales}
            target={targetValue}
            showProgress
            subtitle={`Target: ${targetValue}${toGo > 0 ? ` • ${toGo} to go` : ''}`}
            icon={TrendingDown}
            iconBgColor="bg-warning/10"
            valueColor={isBelowTarget ? "text-destructive" : "text-success"}
            isBelowTarget={isBelowTarget}
          />
          <DepartmentStatsCard
            title="Sales Officers"
            value={`${stats.officerCount}/${target?.max_officers || 4}`}
            subtitle={`Maximum ${target?.max_officers || 4} officers`}
            icon={Users}
            iconBgColor="bg-success/10"
            valueColor="text-foreground"
          />
          <DepartmentStatsCard
            title="Weekly Target"
            value={targetValue}
            subtitle="Team sales target"
            icon={Target}
            iconBgColor="bg-success/10"
            valueColor="text-success"
          />
          <DepartmentStatsCard
            title="Per Officer"
            value={target?.per_officer_target || 25}
            subtitle="Individual target"
            icon={Hash}
            iconBgColor="bg-muted"
            valueColor="text-foreground"
          />
        </div>

        {/* Action Button */}
        {canManage && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-success text-success hover:bg-success/10"
              onClick={() => setIsPerformanceDialogOpen(true)}
            >
              <Hash className="h-4 w-4 mr-2" />
              Record Sales
            </Button>
          </div>
        )}

        {/* Officers List */}
        <OfficerManagement
          department="sales"
          officers={officers}
          maxOfficers={target?.max_officers || 4}
          canManage={canManage}
          onRefresh={fetchOfficers}
          userId={user?.id || ""}
        />

        {/* Lead Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No leads yet. They'll appear here when visitors submit the Get Started form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.slice(0, 10).map((inquiry) => (
                  <InquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    onEdit={canManage ? handleEditInquiry : undefined}
                    onUpdateStatus={canManage ? handleUpdateStatus : undefined}
                    onSendToOperations={canManage ? handleSendToOperations : undefined}
                    onSendToCredit={canManage ? handleSendToCredit : undefined}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <InquiryEditDialog
          inquiry={editingInquiry}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveInquiry}
        />

        {/* Performance Dialog */}
        <RecordPerformanceDialog
          open={isPerformanceDialogOpen}
          onOpenChange={setIsPerformanceDialogOpen}
          department="sales"
          officers={officers}
          userId={user?.id || ""}
          onSuccess={fetchData}
        />
      </div>
    </DashboardLayout>
  );
};

export default Sales;
