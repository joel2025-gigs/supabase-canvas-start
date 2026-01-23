import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Package,
  Calculator
} from "lucide-react";

type ProductStatus = "draft" | "pending_review" | "approved" | "rejected";

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  description: string | null;
  asset_type: string;
  price: number;
  down_payment_percent: number;
  loan_duration_months: number;
  interest_rate: number;
  image_url: string | null;
  features: string[];
  status: ProductStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Edit },
  pending_review: { label: "Pending Review", color: "bg-warning/20 text-warning", icon: Clock },
  approved: { label: "Approved", color: "bg-primary/20 text-primary", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const ProductManagement = () => {
  const { loading: authLoading, isAuthenticated, isAdmin, isStaff, user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    description: "",
    asset_type: "motorcycle",
    price: "",
    down_payment_percent: "20",
    loan_duration_months: "18",
    interest_rate: "30",
    image_url: "",
    features: "",
    is_featured: false,
    display_order: "0",
  });

  // Calculate loan details
  const loanCalculation = useMemo(() => {
    const price = parseFloat(formData.price) || 0;
    const downPaymentPercent = parseFloat(formData.down_payment_percent) || 0;
    const interestRate = parseFloat(formData.interest_rate) || 0;
    const duration = parseInt(formData.loan_duration_months) || 1;

    const downPayment = price * (downPaymentPercent / 100);
    const loanAmount = price - downPayment;
    const interestAmount = loanAmount * (interestRate / 100);
    const totalLoan = loanAmount + interestAmount;
    const monthlyPayment = totalLoan / duration;

    return {
      downPayment,
      loanAmount,
      interestAmount,
      totalLoan,
      monthlyPayment,
    };
  }, [formData.price, formData.down_payment_percent, formData.interest_rate, formData.loan_duration_months]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isStaff()) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("product_catalog")
        .select("*")
        .is("deleted_at", null)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      model: "",
      description: "",
      asset_type: "motorcycle",
      price: "",
      down_payment_percent: "20",
      loan_duration_months: "18",
      interest_rate: "30",
      image_url: "",
      features: "",
      is_featured: false,
      display_order: "0",
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      brand: product.brand,
      model: product.model,
      description: product.description || "",
      asset_type: product.asset_type,
      price: product.price.toString(),
      down_payment_percent: product.down_payment_percent.toString(),
      loan_duration_months: (product.loan_duration_months || 18).toString(),
      interest_rate: (product.interest_rate || 30).toString(),
      image_url: product.image_url || "",
      features: product.features.join(", "),
      is_featured: product.is_featured,
      display_order: product.display_order.toString(),
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.model || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const productData = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        description: formData.description || null,
        asset_type: formData.asset_type,
        price: parseFloat(formData.price),
        down_payment_percent: parseFloat(formData.down_payment_percent),
        loan_duration_months: parseInt(formData.loan_duration_months),
        interest_rate: parseFloat(formData.interest_rate),
        image_url: formData.image_url || null,
        features: formData.features.split(",").map((f) => f.trim()).filter(Boolean),
        is_featured: formData.is_featured,
        display_order: parseInt(formData.display_order),
        created_by: user?.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("product_catalog")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("product_catalog")
          .insert({ ...productData, status: "draft" });

        if (error) throw error;
        toast.success("Product created as draft");
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleSubmitForReview = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("product_catalog")
        .update({
          status: "pending_review",
          submitted_at: new Date().toISOString(),
          submitted_by: user?.id,
        })
        .eq("id", product.id);

      if (error) throw error;
      toast.success("Product submitted for review");
      fetchProducts();
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error("Failed to submit product");
    }
  };

  const handleApprove = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("product_catalog")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", product.id);

      if (error) throw error;
      toast.success("Product approved and published");
      setReviewDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error approving product:", error);
      toast.error("Failed to approve product");
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { error } = await supabase
        .from("product_catalog")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;
      toast.success("Product rejected");
      setReviewDialogOpen(false);
      setRejectionReason("");
      fetchProducts();
    } catch (error) {
      console.error("Error rejecting product:", error);
      toast.error("Failed to reject product");
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("product_catalog")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", product.id);

      if (error) throw error;
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: products.length,
    draft: products.filter((p) => p.status === "draft").length,
    pending_review: products.filter((p) => p.status === "pending_review").length,
    approved: products.filter((p) => p.status === "approved").length,
    rejected: products.filter((p) => p.status === "rejected").length,
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isStaff()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = (product: Product) => {
    if (isAdmin()) return true;
    return product.created_by === user?.id && product.status === "draft";
  };

  const canDelete = () => isAdmin();
  const canApprove = () => isAdmin();
  const canSubmitForReview = (product: Product) => product.status === "draft";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
            <p className="text-muted-foreground">
              {isAdmin() ? "Manage and approve products for the public website" : "Create and submit products for review"}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gradient-accent">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(statusCounts).map(([status, count]) => {
            const config = status === "all" 
              ? { label: "All Products", color: "bg-secondary text-secondary-foreground", icon: Package }
              : statusConfig[status as ProductStatus];
            const Icon = config.icon;
            return (
              <Card
                key={status}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === status ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setStatusFilter(status)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${status === "all" ? "text-muted-foreground" : ""}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cash Price</TableHead>
                    <TableHead>Loan Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const StatusIcon = statusConfig[product.status].icon;
                    const downPayment = product.price * (product.down_payment_percent / 100);
                    const loanAmount = product.price - downPayment;
                    const totalLoan = loanAmount * (1 + (product.interest_rate || 30) / 100);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.brand} - {product.model}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {product.asset_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <p><span className="text-muted-foreground">Down:</span> {product.down_payment_percent}%</p>
                            <p><span className="text-muted-foreground">Rate:</span> {product.interest_rate || 30}%</p>
                            <p><span className="text-muted-foreground">Duration:</span> {product.loan_duration_months || 18}mo</p>
                            <p className="font-medium text-primary">Total: {formatCurrency(totalLoan)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[product.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[product.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canEdit(product) && (
                                <DropdownMenuItem onClick={() => handleEdit(product)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canSubmitForReview(product) && (
                                <DropdownMenuItem onClick={() => handleSubmitForReview(product)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Submit for Review
                                </DropdownMenuItem>
                              )}
                              {canApprove() && product.status === "pending_review" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setReviewDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Review
                                </DropdownMenuItem>
                              )}
                              {canDelete() && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(product)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details" : "Create a new product. It will be saved as a draft."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Bajaj Boxer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Bajaj"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. Boxer 150cc"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asset_type">Asset Type</Label>
                    <Select
                      value={formData.asset_type}
                      onValueChange={(v) => setFormData({ ...formData, asset_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="tricycle">Tricycle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pricing & Loan Terms */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Pricing & Loan Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Cash Price (UGX) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 9000000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="down_payment">Down Payment (%)</Label>
                    <Input
                      id="down_payment"
                      type="number"
                      value={formData.down_payment_percent}
                      onChange={(e) => setFormData({ ...formData, down_payment_percent: e.target.value })}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan_duration">Loan Duration (Months)</Label>
                    <Input
                      id="loan_duration"
                      type="number"
                      value={formData.loan_duration_months}
                      onChange={(e) => setFormData({ ...formData, loan_duration_months: e.target.value })}
                      min="1"
                      max="36"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Loan Calculation Preview */}
                {parseFloat(formData.price) > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4 text-primary" />
                        <span className="font-medium">Loan Calculation Preview</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Down Payment</p>
                          <p className="font-semibold">{formatCurrency(loanCalculation.downPayment)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Loan Amount</p>
                          <p className="font-semibold">{formatCurrency(loanCalculation.loanAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest</p>
                          <p className="font-semibold">{formatCurrency(loanCalculation.interestAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Loan</p>
                          <p className="font-semibold text-primary">{formatCurrency(loanCalculation.totalLoan)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-muted-foreground text-sm">Monthly Payment</p>
                        <p className="text-xl font-bold text-accent">{formatCurrency(loanCalculation.monthlyPayment)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Additional Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (comma-separated)</Label>
                  <Input
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Fuel efficient, Durable engine, 2-year warranty"
                  />
                </div>
              </div>

              {/* Admin Options */}
              {isAdmin() && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Admin Options</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="is_featured">Featured Product</Label>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingProduct ? "Update Product" : "Create Draft"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Review Dialog (Admin only) */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Product</DialogTitle>
              <DialogDescription>
                Review and approve or reject this product submission.
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold">{selectedProduct.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.brand} - {selectedProduct.model}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <p><span className="text-muted-foreground">Price:</span> {formatCurrency(selectedProduct.price)}</p>
                    <p><span className="text-muted-foreground">Type:</span> {selectedProduct.asset_type}</p>
                    <p><span className="text-muted-foreground">Down:</span> {selectedProduct.down_payment_percent}%</p>
                    <p><span className="text-muted-foreground">Rate:</span> {selectedProduct.interest_rate || 30}%</p>
                    <p><span className="text-muted-foreground">Duration:</span> {selectedProduct.loan_duration_months || 18} months</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rejection Reason (required if rejecting)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                  />
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button className="gradient-primary" onClick={() => handleApprove(selectedProduct)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Publish
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ProductManagement;