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
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface InquiryWithDetails {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  occupation: string | null;
  product_interest: string | null;
  monthly_income: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const Sales = () => {
  const { user, loading: authLoading, isStaff, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isStaff()) {
      fetchInquiries();
    }
  }, [user, isStaff]);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInquiries(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const newCount = data?.filter(i => i.status === 'new').length || 0;
      const contacted = data?.filter(i => i.status === 'contacted').length || 0;
      const converted = data?.filter(i => i.status === 'converted').length || 0;
      
      setStats({ total, new: newCount, contacted, converted });
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-purple-500';
      case 'converted': return 'bg-green-500';
      case 'closed': return 'bg-muted';
      default: return 'bg-muted';
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
            <p className="text-muted-foreground">You don't have permission to access Sales.</p>
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
          <h1 className="text-2xl font-bold text-foreground">Sales Department</h1>
          <p className="text-muted-foreground">Manage leads and new client acquisitions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Inquiries</p>
                <p className="text-2xl font-bold">{stats.new}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Phone className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold">{stats.contacted}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold">{stats.converted}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inquiries List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
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
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{inquiry.full_name}</h3>
                          <Badge className={`${getStatusColor(inquiry.status)} text-white`}>
                            {inquiry.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {inquiry.phone}
                          </span>
                          {inquiry.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {inquiry.email}
                            </span>
                          )}
                          {inquiry.district && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {inquiry.district}
                            </span>
                          )}
                        </div>
                        {inquiry.product_interest && (
                          <p className="text-sm">
                            <span className="font-medium">Interest:</span> {inquiry.product_interest}
                          </p>
                        )}
                        {inquiry.message && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {inquiry.status === 'new' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(inquiry.id, 'contacted')}>
                            Mark Contacted
                          </Button>
                        )}
                        {inquiry.status === 'contacted' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(inquiry.id, 'qualified')}>
                            Mark Qualified
                          </Button>
                        )}
                        {inquiry.status === 'qualified' && (
                          <Button size="sm" variant="default" onClick={() => handleUpdateStatus(inquiry.id, 'converted')}>
                            Convert to Client
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

export default Sales;