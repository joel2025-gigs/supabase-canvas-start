import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Bike, Loader2, Edit, MapPin } from "lucide-react";
import { ASSET_TYPES, ASSET_STATUSES } from "@/lib/constants";
import type { Asset, Branch } from "@/lib/types";
import { z } from "zod";

const assetSchema = z.object({
  asset_type: z.enum(["motorcycle", "tricycle"]),
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().optional(),
  chassis_number: z.string().min(5, "Chassis number is required"),
  engine_number: z.string().optional(),
  registration_number: z.string().optional(),
  color: z.string().optional(),
  purchase_price: z.number().min(1, "Purchase price is required"),
  selling_price: z.number().min(1, "Selling price is required"),
});

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { user, profile, isAuthenticated, loading: authLoading, isStaff } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    asset_type: "motorcycle" as "motorcycle" | "tricycle",
    brand: "",
    model: "",
    year: "",
    chassis_number: "",
    engine_number: "",
    registration_number: "",
    color: "",
    purchase_price: "",
    selling_price: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isStaff()) {
      fetchAssets();
      fetchBranches();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, isStaff()]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*, branch:branches(name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data as Asset[]);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("is_active", true);
    setBranches(data || []);
  };

  const resetForm = () => {
    setFormData({
      asset_type: "motorcycle",
      brand: "",
      model: "",
      year: "",
      chassis_number: "",
      engine_number: "",
      registration_number: "",
      color: "",
      purchase_price: "",
      selling_price: "",
      notes: "",
    });
    setFormErrors({});
    setEditingAsset(null);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_type: asset.asset_type,
      brand: asset.brand,
      model: asset.model,
      year: asset.year?.toString() || "",
      chassis_number: asset.chassis_number,
      engine_number: asset.engine_number || "",
      registration_number: asset.registration_number || "",
      color: asset.color || "",
      purchase_price: asset.purchase_price.toString(),
      selling_price: asset.selling_price.toString(),
      notes: asset.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const dataToValidate = {
      ...formData,
      year: formData.year ? Number(formData.year) : undefined,
      purchase_price: Number(formData.purchase_price),
      selling_price: Number(formData.selling_price),
    };

    const result = assetSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const assetData = {
        asset_type: formData.asset_type,
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? Number(formData.year) : null,
        chassis_number: formData.chassis_number,
        engine_number: formData.engine_number || null,
        registration_number: formData.registration_number || null,
        color: formData.color || null,
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        notes: formData.notes || null,
        branch_id: profile?.branch_id || branches[0]?.id,
        registered_by: user?.id,
      };

      if (editingAsset) {
        const { error } = await supabase
          .from("assets")
          .update(assetData)
          .eq("id", editingAsset.id);
        if (error) throw error;
        toast.success("Asset updated successfully");
      } else {
        const { error } = await supabase.from("assets").insert(assetData);
        if (error) throw error;
        toast.success("Asset registered successfully");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchAssets();
    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast.error(error.message || "Failed to save asset");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.chassis_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || asset.status === selectedStatus;
    const matchesType = selectedType === "all" || asset.asset_type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isStaff()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Bike className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Assets</h1>
            <p className="text-muted-foreground">Manage motorcycles and tricycles inventory</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAsset ? "Edit Asset" : "Register New Asset"}</DialogTitle>
                <DialogDescription>
                  {editingAsset ? "Update asset information" : "Enter asset details to add to inventory"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Asset Type *</Label>
                    <Select value={formData.asset_type} onValueChange={(v: "motorcycle" | "tricycle") => setFormData({ ...formData, asset_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">🏍️ Motorcycle</SelectItem>
                        <SelectItem value="tricycle">🛺 Tricycle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Bajaj, TVS, Honda"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className={formErrors.brand ? "border-destructive" : ""}
                    />
                    {formErrors.brand && <p className="text-sm text-destructive">{formErrors.brand}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      placeholder="e.g., Boxer 150"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className={formErrors.model ? "border-destructive" : ""}
                    />
                    {formErrors.model && <p className="text-sm text-destructive">{formErrors.model}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2024"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">Chassis Number *</Label>
                    <Input
                      id="chassis_number"
                      value={formData.chassis_number}
                      onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                      className={formErrors.chassis_number ? "border-destructive" : ""}
                    />
                    {formErrors.chassis_number && <p className="text-sm text-destructive">{formErrors.chassis_number}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="engine_number">Engine Number</Label>
                    <Input
                      id="engine_number"
                      value={formData.engine_number}
                      onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      placeholder="UAX 123A"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price (UGX) *</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className={formErrors.purchase_price ? "border-destructive" : ""}
                    />
                    {formErrors.purchase_price && <p className="text-sm text-destructive">{formErrors.purchase_price}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price (UGX) *</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      className={formErrors.selling_price ? "border-destructive" : ""}
                    />
                    {formErrors.selling_price && <p className="text-sm text-destructive">{formErrors.selling_price}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {editingAsset ? "Update Asset" : "Register Asset"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(ASSET_STATUSES).map(([key, value]) => {
            const count = assets.filter((a) => a.status === key).length;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardDescription className="capitalize">{value.label}</CardDescription>
                  <CardTitle className="text-2xl">{count}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, model, chassis, or registration..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="tricycle">Tricycle</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(ASSET_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Inventory</CardTitle>
            <CardDescription>{filteredAssets.length} assets found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{asset.asset_type === "motorcycle" ? "🏍️" : "🛺"}</span>
                          <div>
                            <div className="font-medium">{asset.brand} {asset.model}</div>
                            <div className="text-sm text-muted-foreground">{asset.year || "—"} • {asset.color || "—"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{asset.chassis_number}</TableCell>
                      <TableCell>{asset.registration_number || "—"}</TableCell>
                      <TableCell>{formatCurrency(asset.selling_price)}</TableCell>
                      <TableCell>
                        <Badge className={ASSET_STATUSES[asset.status]?.color || ""}>
                          {ASSET_STATUSES[asset.status]?.label || asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.gps_status === "installed" ? "default" : "secondary"}>
                          {asset.gps_status?.replace("_", " ") || "Not installed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAssets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No assets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Assets;
