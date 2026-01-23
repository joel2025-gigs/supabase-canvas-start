import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Building2, Loader2, Edit, MapPin } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Branch } from "@/lib/types";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(3, "Code must be at least 3 characters").max(10),
  location: z.string().optional(),
  district: z.string().min(2, "District is required"),
});

const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { isAuthenticated, loading: authLoading, isSuperAdmin, roles } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    district: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchBranches();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, roles]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      setBranches(data as Branch[]);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", location: "", district: "" });
    setFormErrors({});
    setEditingBranch(null);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      location: branch.location || "",
      district: branch.district || "",
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const { error } = await supabase
        .from("branches")
        .update({ is_active: !branch.is_active })
        .eq("id", branch.id);

      if (error) throw error;
      toast.success(`Branch ${branch.is_active ? "deactivated" : "activated"}`);
      fetchBranches();
    } catch (error: any) {
      toast.error(error.message || "Failed to update branch");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = branchSchema.safeParse(formData);
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
      const branchData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        location: formData.location || null,
        district: formData.district,
      };

      if (editingBranch) {
        const { error } = await supabase
          .from("branches")
          .update(branchData)
          .eq("id", editingBranch.id);
        if (error) throw error;
        toast.success("Branch updated successfully");
      } else {
        const { error } = await supabase.from("branches").insert(branchData);
        if (error) throw error;
        toast.success("Branch created successfully");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchBranches();
    } catch (error: any) {
      console.error("Error saving branch:", error);
      toast.error(error.message || "Failed to save branch");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only Super Admins can manage branches.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Branches</h1>
            <p className="text-muted-foreground">Manage NAWAP branch locations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBranch ? "Edit Branch" : "Create New Branch"}</DialogTitle>
                <DialogDescription>
                  {editingBranch ? "Update branch information" : "Add a new branch location"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Kampala Main"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., KLA001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={formErrors.code ? "border-destructive" : ""}
                    maxLength={10}
                  />
                  {formErrors.code && <p className="text-sm text-destructive">{formErrors.code}</p>}
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
                  <Label htmlFor="location">Location Details</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Plot 123, Main Street"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {editingBranch ? "Update Branch" : "Create Branch"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Branches</CardDescription>
              <CardTitle className="text-3xl">{branches.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Branches</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {branches.filter(b => b.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inactive Branches</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {branches.filter(b => !b.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Branches Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Branches</CardTitle>
            <CardDescription>{branches.length} branches configured</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell className="font-mono">{branch.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {branch.district || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {branch.location || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={branch.is_active}
                          onCheckedChange={() => handleToggleActive(branch)}
                        />
                        <Badge variant={branch.is_active ? "default" : "secondary"}>
                          {branch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(branch)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {branches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No branches configured. Add your first branch to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Branches;
