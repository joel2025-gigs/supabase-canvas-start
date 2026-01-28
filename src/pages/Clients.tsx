import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSync } from "@/hooks/useOfflineSync";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Phone, MapPin, User, Loader2, Edit, Eye, Bike, Navigation, Banknote, CheckCircle, Package } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import type { Client, Branch, Asset } from "@/lib/types";
import { z } from "zod";

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

const clientSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+256|0)[0-9]{9}$/, "Invalid Ugandan phone number"),
  phone_secondary: z.string().optional(),
  national_id: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  district: z.string().min(2, "District is required"),
  village: z.string().optional(),
  next_of_kin_name: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
  occupation: z.string().optional(),
  monthly_income: z.number().optional(),
  asset_id: z.string().optional(),
});

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [cashSales, setCashSales] = useState<CashSaleInquiry[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("registered");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [assigningAsset, setAssigningAsset] = useState<string | null>(null);
  
  const { user, profile, isAuthenticated, loading: authLoading, isStaff, hasAnyRole, roles } = useAuth();
  const { isOnline, addToSyncQueue, saveLocally } = useOfflineSync();
  const navigate = useNavigate();

  const canManage = hasAnyRole(['super_admin', 'admin', 'operations_admin']);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    phone_secondary: "",
    national_id: "",
    address: "",
    district: "",
    village: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    occupation: "",
    monthly_income: "",
    asset_id: "",
    latitude: "",
    longitude: "",
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isStaff()) {
      fetchClients();
      fetchCashSales();
      fetchBranches();
      fetchAvailableAssets();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, roles]);

  const fetchCashSales = async () => {
    try {
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
    }
  };

  const fetchAvailableAssets = async () => {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("status", "available")
      .is("deleted_at", null)
      .order("brand", { ascending: true });
    setAssets((data as Asset[]) || []);
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*, branch:branches(name), asset:assets(id, asset_type, brand, model, chassis_number, registration_number)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data as Client[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null);
    setBranches(data || []);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      phone_secondary: "",
      national_id: "",
      address: "",
      district: "",
      village: "",
      next_of_kin_name: "",
      next_of_kin_phone: "",
      occupation: "",
      monthly_income: "",
      asset_id: "",
      latitude: "",
      longitude: "",
    });
    setFormErrors({});
    setEditingClient(null);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8),
        }));
        toast.success("Location captured successfully");
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please enable location services.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name,
      phone: client.phone,
      phone_secondary: client.phone_secondary || "",
      national_id: client.national_id || "",
      address: client.address,
      district: client.district,
      village: client.village || "",
      next_of_kin_name: client.next_of_kin_name || "",
      next_of_kin_phone: client.next_of_kin_phone || "",
      occupation: client.occupation || "",
      monthly_income: client.monthly_income?.toString() || "",
      asset_id: client.asset_id || "",
      latitude: client.latitude?.toString() || "",
      longitude: client.longitude?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const dataToValidate = {
      ...formData,
      monthly_income: formData.monthly_income ? Number(formData.monthly_income) : undefined,
    };

    const result = clientSchema.safeParse(dataToValidate);
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
      const clientData = {
        full_name: formData.full_name,
        phone: formData.phone,
        phone_secondary: formData.phone_secondary || null,
        national_id: formData.national_id || null,
        address: formData.address,
        district: formData.district,
        village: formData.village || null,
        next_of_kin_name: formData.next_of_kin_name || null,
        next_of_kin_phone: formData.next_of_kin_phone || null,
        occupation: formData.occupation || null,
        monthly_income: formData.monthly_income ? Number(formData.monthly_income) : null,
        asset_id: formData.asset_id || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        branch_id: profile?.branch_id || branches[0]?.id,
        registered_by: user?.id,
      };

      if (editingClient) {
        // Update existing client
        if (isOnline) {
          const { error } = await supabase
            .from("clients")
            .update(clientData)
            .eq("id", editingClient.id);
          if (error) throw error;
        } else {
          await addToSyncQueue("clients", "UPDATE", editingClient.id, { id: editingClient.id, ...clientData });
        }
        toast.success("Client updated successfully");
      } else {
        // Create new client
        if (isOnline) {
          const { error } = await supabase.from("clients").insert(clientData);
          if (error) throw error;
        } else {
          const localId = await saveLocally("clients", clientData);
          await addToSyncQueue("clients", "INSERT", localId!, clientData);
        }
        const successMsg = formData.asset_id 
          ? "Client registered & loan created successfully!" 
          : isOnline 
            ? "Client registered successfully" 
            : "Client saved locally. Will sync when online.";
        toast.success(successMsg);
      }

      resetForm();
      setIsDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast.error(error.message || "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.national_id?.includes(searchTerm) ||
      client.asset?.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.asset?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === "all" || client.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const filteredCashSales = cashSales.filter((sale) => {
    const matchesSearch =
      sale.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.phone.includes(searchTerm);
    const matchesDistrict = selectedDistrict === "all" || sale.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const handleAssignAsset = async (inquiry: CashSaleInquiry, assetId: string) => {
    if (!canManage) {
      toast.error("You don't have permission to assign assets");
      return;
    }
    
    setAssigningAsset(inquiry.id);
    try {
      // Get asset details
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .single();

      if (assetError || !asset) throw new Error("Asset not found");

      // Create client from inquiry
      const clientData = {
        full_name: inquiry.full_name,
        phone: inquiry.phone,
        address: inquiry.district || "N/A",
        district: inquiry.district || "Kampala",
        occupation: inquiry.occupation || null,
        asset_id: assetId,
        branch_id: profile?.branch_id || branches[0]?.id,
        registered_by: user?.id,
      };

      const { error: clientError } = await supabase
        .from("clients")
        .insert(clientData);

      if (clientError) throw clientError;

      // Mark asset as assigned
      await supabase
        .from("assets")
        .update({ status: "assigned" })
        .eq("id", assetId);

      // Update inquiry status to closed
      await supabase
        .from("inquiries")
        .update({ 
          status: "closed",
          notes: `${inquiry.notes || ""}\n[${new Date().toLocaleDateString()}] Asset assigned - Cash sale completed`.trim()
        })
        .eq("id", inquiry.id);

      toast.success("Asset assigned successfully! Client created.");
      fetchCashSales();
      fetchClients();
      fetchAvailableAssets();
    } catch (error: any) {
      console.error("Error assigning asset:", error);
      toast.error(error.message || "Failed to assign asset");
    } finally {
      setAssigningAsset(null);
    }
  };

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
          <User className="h-16 w-16 text-muted-foreground mb-4" />
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
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Manage borrower registrations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Edit Client" : "Register New Client"}</DialogTitle>
                <DialogDescription>
                  {editingClient ? "Update client information" : "Enter borrower details to register a new client"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className={formErrors.full_name ? "border-destructive" : ""}
                    />
                    {formErrors.full_name && <p className="text-sm text-destructive">{formErrors.full_name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+256 or 0..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={formErrors.phone ? "border-destructive" : ""}
                    />
                    {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_secondary">Secondary Phone</Label>
                    <Input
                      id="phone_secondary"
                      value={formData.phone_secondary}
                      onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={formErrors.address ? "border-destructive" : ""}
                    />
                    {formErrors.address && <p className="text-sm text-destructive">{formErrors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v })}>
                      <SelectTrigger className={formErrors.district ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.district && <p className="text-sm text-destructive">{formErrors.district}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="village">Village/LC1</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_name">Next of Kin Name</Label>
                    <Input
                      id="next_of_kin_name"
                      value={formData.next_of_kin_name}
                      onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_phone">Next of Kin Phone</Label>
                    <Input
                      id="next_of_kin_phone"
                      value={formData.next_of_kin_phone}
                      onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_income">Monthly Income (UGX)</Label>
                    <Input
                      id="monthly_income"
                      type="number"
                      value={formData.monthly_income}
                      onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      GPS Coordinates
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                        <Input
                          id="latitude"
                          placeholder="e.g., 0.31628200"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          readOnly
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                        <Input
                          id="longitude"
                          placeholder="e.g., 32.58219100"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          readOnly
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGetLocation}
                          disabled={gettingLocation}
                        >
                          {gettingLocation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click the button to capture customer's current location for field visits.
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Assign Asset (Plate/Chassis)</Label>
                    <Select 
                      value={formData.asset_id || "none"} 
                      onValueChange={(v) => setFormData({ ...formData, asset_id: v === "none" ? "" : v })}
                      disabled={!!editingClient?.asset_id}
                    >
                      <SelectTrigger className={!editingClient?.asset_id && assets.length > 0 ? "" : ""}>
                        <SelectValue placeholder="Select an available asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Asset</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div className="flex items-center gap-2">
                              <Bike className="h-4 w-4" />
                              <span>{asset.brand} {asset.model}</span>
                              <span className="text-muted-foreground">
                                {asset.registration_number || asset.chassis_number}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingClient?.asset_id ? (
                      <p className="text-xs text-muted-foreground">Asset already assigned. Cannot change once linked.</p>
                    ) : assets.length === 0 ? (
                      <p className="text-xs text-warning">No available assets in inventory.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Select an available asset to assign to this client.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {editingClient ? "Update Client" : "Register Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Clients */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="registered" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Registered Clients
              <Badge variant="secondary" className="ml-1">{filteredClients.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pending Assignment
              <Badge variant="secondary" className="ml-1 bg-warning/20 text-warning">{filteredCashSales.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Registered Clients Tab */}
          <TabsContent value="registered">
            <Card>
              <CardHeader>
                <CardTitle>Registered Clients</CardTitle>
                <CardDescription>{filteredClients.length} clients found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="font-medium">{client.full_name}</div>
                            {client.national_id && (
                              <div className="text-sm text-muted-foreground">ID: {client.national_id}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.asset ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-primary flex items-center gap-1">
                                  <Bike className="h-3 w-3" />
                                  {client.asset.brand} {client.asset.model}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {client.asset.registration_number || client.asset.chassis_number}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {client.district}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.is_active ? "default" : "secondary"}>
                              {client.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredClients.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No clients found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Assignment (Cash Sales) Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-success" />
                  Cash Sales - Pending Asset Assignment
                </CardTitle>
                <CardDescription>
                  Qualified cash sale leads awaiting asset assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCashSales.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No cash sales pending asset assignment.</p>
                    <p className="text-sm text-muted-foreground mt-1">When Sales sends cash sales, they'll appear here for processing.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCashSales.map((sale) => (
                      <div key={sale.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{sale.full_name}</h3>
                              <Badge className="bg-success text-success-foreground">
                                <Banknote className="h-3 w-3 mr-1" />
                                Cash Sale
                              </Badge>
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
                          <div className="flex items-center gap-2">
                            {canManage && assets.length > 0 && (
                              <Select 
                                onValueChange={(assetId) => handleAssignAsset(sale, assetId)}
                                disabled={assigningAsset === sale.id}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Assign Asset" />
                                </SelectTrigger>
                                <SelectContent>
                                  {assets.map((asset) => (
                                    <SelectItem key={asset.id} value={asset.id}>
                                      <div className="flex items-center gap-2">
                                        <Bike className="h-4 w-4" />
                                        <span>{asset.brand} {asset.model}</span>
                                        <span className="text-muted-foreground text-xs">
                                          {asset.registration_number || asset.chassis_number}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {assigningAsset === sale.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {assets.length === 0 && (
                              <Badge variant="outline" className="text-warning border-warning">
                                No assets available
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Clients;
