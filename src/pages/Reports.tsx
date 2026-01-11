import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("this_month");
  const [reportData, setReportData] = useState<any>(null);
  const [overdueLoans, setOverdueLoans] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);

  const { isAuthenticated, loading: authLoading, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  const canViewReports = hasAnyRole(['super_admin', 'admin', 'accountant']);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && canViewReports) {
      fetchReportData();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, canViewReports, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "last_7_days":
        return { start: format(subDays(now, 7), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "this_month":
        return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: format(startOfMonth(lastMonth), "yyyy-MM-dd"), end: format(endOfMonth(lastMonth), "yyyy-MM-dd") };
      case "last_3_months":
        return { start: format(subMonths(now, 3), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      default:
        return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch all data in parallel
      const [
        loansResult,
        paymentsResult,
        clientsResult,
        assetsResult,
      ] = await Promise.all([
        supabase.from("loans").select("*").is("deleted_at", null),
        supabase.from("payments").select("*").gte("received_at", start).lte("received_at", end + "T23:59:59"),
        supabase.from("clients").select("*", { count: "exact" }).is("deleted_at", null),
        supabase.from("assets").select("*").is("deleted_at", null),
      ]);

      const loans = loansResult.data || [];
      const payments = paymentsResult.data || [];
      const assets = assetsResult.data || [];

      // Calculate metrics
      const activeLoans = loans.filter(l => l.status === 'active');
      const completedLoans = loans.filter(l => l.status === 'completed');
      const defaultedLoans = loans.filter(l => l.status === 'defaulted');
      const pendingLoans = loans.filter(l => l.status === 'pending');

      const totalDisbursed = activeLoans.reduce((sum, l) => sum + Number(l.total_amount), 0) +
                            completedLoans.reduce((sum, l) => sum + Number(l.total_amount), 0);
      
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.loan_balance), 0);
      
      const confirmedPayments = payments.filter(p => p.status === 'confirmed' || p.status === 'reconciled');
      const totalCollected = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      const pendingPayments = payments.filter(p => p.status === 'pending');
      const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const availableAssets = assets.filter(a => a.status === 'available').length;
      const assignedAssets = assets.filter(a => a.status === 'assigned').length;

      // Collection rate
      const expectedCollection = activeLoans.reduce((sum, l) => sum + Number(l.installment_amount), 0);
      const collectionRate = expectedCollection > 0 ? (totalCollected / expectedCollection) * 100 : 0;

      // Overdue loans
      const overdue = activeLoans.filter(l => l.consecutive_missed > 0);
      setOverdueLoans(overdue);

      // Top paying clients (simplified)
      const clientPayments: Record<string, number> = {};
      confirmedPayments.forEach(p => {
        clientPayments[p.client_id] = (clientPayments[p.client_id] || 0) + Number(p.amount);
      });
      
      const topClientIds = Object.entries(clientPayments)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      if (topClientIds.length > 0) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id, full_name, phone")
          .in("id", topClientIds);
        
        setTopClients(
          topClientIds.map(id => ({
            ...(clientData?.find(c => c.id === id) || {}),
            totalPaid: clientPayments[id]
          }))
        );
      }

      setReportData({
        totalClients: clientsResult.count || 0,
        activeLoans: activeLoans.length,
        completedLoans: completedLoans.length,
        defaultedLoans: defaultedLoans.length,
        pendingLoans: pendingLoans.length,
        totalDisbursed,
        totalOutstanding,
        totalCollected,
        totalPending,
        collectionRate,
        availableAssets,
        assignedAssets,
        totalPayments: payments.length,
        overdueCount: overdue.length,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    toast.info(`Exporting to ${type.toUpperCase()}... (Feature coming soon)`);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canViewReports) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view reports.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Financial and operational insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-100">Total Disbursed</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(reportData?.totalDisbursed || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-green-100 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>All active & completed loans</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100">Collected ({dateRange.replace("_", " ")})</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(reportData?.totalCollected || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-blue-100 text-sm">
                <DollarSign className="h-4 w-4" />
                <span>{reportData?.totalPayments || 0} payments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-orange-100">Outstanding Balance</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(reportData?.totalOutstanding || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-orange-100 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>{reportData?.activeLoans || 0} active loans</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-purple-100">Collection Rate</CardDescription>
              <CardTitle className="text-2xl">{(reportData?.collectionRate || 0).toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-purple-100 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>This period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Approval</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{reportData?.pendingLoans || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Loans</CardDescription>
              <CardTitle className="text-2xl text-green-600">{reportData?.activeLoans || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{reportData?.completedLoans || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-2xl text-orange-600">{reportData?.overdueCount || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Defaulted</CardDescription>
              <CardTitle className="text-2xl text-red-600">{reportData?.defaultedLoans || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Overdue Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Overdue Loans
              </CardTitle>
              <CardDescription>Loans with missed payments</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueLoans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Missed</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueLoans.slice(0, 5).map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono">{loan.loan_number}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${loan.consecutive_missed >= 4 ? 'text-red-600' : 'text-orange-600'}`}>
                            {loan.consecutive_missed} payments
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(loan.loan_balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No overdue loans</p>
              )}
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Top Paying Clients
              </CardTitle>
              <CardDescription>Highest payments this period</CardDescription>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.map((client, i) => (
                      <TableRow key={client.id || i}>
                        <TableCell>
                          <div className="font-medium">{client.full_name}</div>
                          <div className="text-sm text-muted-foreground">{client.phone}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(client.totalPaid)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No payments in this period</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Asset Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{reportData?.availableAssets || 0}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{reportData?.assignedAssets || 0}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold">{reportData?.totalClients || 0}</div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{formatCurrency(reportData?.totalPending || 0)}</div>
                <div className="text-sm text-muted-foreground">Pending Confirmation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
