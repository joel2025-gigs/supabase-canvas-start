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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Shield, Loader2, MoreHorizontal, UserPlus, Pencil, Trash2, KeyRound } from "lucide-react";
import { USER_ROLES, DEPARTMENTS, ROLE_DEPARTMENT_MAP } from "@/lib/constants";
import type { Profile, Branch, AppRole, Department } from "@/lib/types";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "operations_admin", "accountant", "staff"]),
  branch_id: z.string().optional(),
  department: z.string().optional(),
});

const editUserSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "operations_admin", "accountant", "staff"]),
  branch_id: z.string().optional(),
  department: z.string().optional(),
  is_active: z.boolean(),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface UserWithRole extends Profile {
  roles: AppRole[];
}

const Users = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { user, isAuthenticated, loading: authLoading, isSuperAdmin, roles } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "staff" as AppRole,
    branch_id: "",
    department: "" as string,
  });

  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    role: "staff" as AppRole,
    branch_id: "",
    department: "" as string,
    is_active: true,
  });

  const [passwordFormData, setPasswordFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin()) {
      fetchUsers();
      fetchBranches();
    } else if (isAuthenticated && !authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, roles]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*, branch:branches(name)")
        .is("deleted_at", null)
        .order("full_name");

      if (profilesError) throw profilesError;

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = (profilesData || []).map((profile: any) => ({
        ...profile,
        roles: (rolesData || [])
          .filter((r: any) => r.user_id === profile.id)
          .map((r: any) => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
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
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "staff",
      branch_id: "",
      department: "",
    });
    setFormErrors({});
  };

  const resetEditForm = () => {
    setEditFormData({
      full_name: "",
      phone: "",
      role: "staff",
      branch_id: "",
      department: "",
      is_active: true,
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const resetPasswordForm = () => {
    setPasswordFormData({
      password: "",
      confirmPassword: "",
    });
    setFormErrors({});
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = userSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    if (formData.role !== "super_admin" && !formData.branch_id) {
      setFormErrors({ branch_id: "Branch is required for this role" });
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with branch and department
      const updateData: any = {};
      if (formData.branch_id) updateData.branch_id = formData.branch_id;
      if (formData.department) updateData.department = formData.department;
      
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", authData.user.id);
      }

      // Set the role (remove default 'staff' role first)
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", authData.user.id);

      await supabase
        .from("user_roles")
        .insert({ user_id: authData.user.id, role: formData.role, assigned_by: user?.id });

      toast.success("User created successfully");
      resetForm();
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (userToEdit: UserWithRole) => {
    setEditingUser(userToEdit);
    setEditFormData({
      full_name: userToEdit.full_name,
      phone: userToEdit.phone || "",
      role: userToEdit.roles[0] || "staff",
      branch_id: userToEdit.branch_id || "",
      department: userToEdit.department || "",
      is_active: userToEdit.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormErrors({});

    const result = editUserSchema.safeParse(editFormData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    if (editFormData.role !== "super_admin" && !editFormData.branch_id) {
      setFormErrors({ branch_id: "Branch is required for this role" });
      return;
    }

    setSubmitting(true);

    try {
      // Update profile
      const updateData: Record<string, any> = {
        full_name: editFormData.full_name,
        phone: editFormData.phone || null,
        branch_id: editFormData.branch_id || null,
        is_active: editFormData.is_active,
      };
      
      // Only include department if it's a valid value
      if (editFormData.department && ['sales', 'credit_collection', 'recovery', 'operations'].includes(editFormData.department)) {
        updateData.department = editFormData.department;
      } else {
        updateData.department = null;
      }
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      // Update role if changed
      const currentRole = editingUser.roles[0];
      if (currentRole !== editFormData.role) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", editingUser.id);

        await supabase
          .from("user_roles")
          .insert({ user_id: editingUser.id, role: editFormData.role, assigned_by: user?.id });
      }

      toast.success("User updated successfully");
      resetEditForm();
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPasswordDialog = (userToEdit: UserWithRole) => {
    setEditingUser(userToEdit);
    setPasswordFormData({ password: "", confirmPassword: "" });
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormErrors({});

    const result = passwordSchema.safeParse(passwordFormData);
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
      // Use admin API to update user password
      const { error } = await supabase.auth.admin.updateUserById(editingUser.id, {
        password: passwordFormData.password,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      resetPasswordForm();
      setIsPasswordDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password. Admin API access required.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    setSubmitting(true);

    try {
      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    try {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole, assigned_by: user?.id });

      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchesRole = selectedRole === "all" || u.roles.includes(selectedRole as AppRole);
    return matchesSearch && matchesRole;
  });

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
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only Super Admins can manage users.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage staff accounts and roles</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new staff member to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={formErrors.email ? "border-destructive" : ""}
                  />
                  {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={formErrors.password ? "border-destructive" : ""}
                  />
                  {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(v: AppRole) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_ROLES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.role !== "super_admin" && (
                  <div className="space-y-2">
                    <Label>Branch *</Label>
                    <Select value={formData.branch_id} onValueChange={(v) => setFormData({ ...formData, branch_id: v })}>
                      <SelectTrigger className={formErrors.branch_id ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.branch_id && <p className="text-sm text-destructive">{formErrors.branch_id}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.department || "none"} onValueChange={(v) => setFormData({ ...formData, department: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.entries(DEPARTMENTS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetEditForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Full Name *</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className={formErrors.full_name ? "border-destructive" : ""}
                />
                {formErrors.full_name && <p className="text-sm text-destructive">{formErrors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={editFormData.role} onValueChange={(v: AppRole) => setEditFormData({ ...editFormData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(USER_ROLES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editFormData.role !== "super_admin" && (
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={editFormData.branch_id} onValueChange={(v) => setEditFormData({ ...editFormData, branch_id: v })}>
                    <SelectTrigger className={formErrors.branch_id ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.branch_id && <p className="text-sm text-destructive">{formErrors.branch_id}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={editFormData.department || "none"} onValueChange={(v) => setEditFormData({ ...editFormData, department: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.entries(DEPARTMENTS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editFormData.is_active ? "active" : "inactive"} 
                  onValueChange={(v) => setEditFormData({ ...editFormData, is_active: v === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); resetEditForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Update User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => { setIsPasswordDialogOpen(open); if (!open) { resetPasswordForm(); setEditingUser(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Set a new password for {editingUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password *</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordFormData.password}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, password: e.target.value })}
                  className={formErrors.password ? "border-destructive" : ""}
                />
                {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  className={formErrors.confirmPassword ? "border-destructive" : ""}
                />
                {formErrors.confirmPassword && <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsPasswordDialogOpen(false); resetPasswordForm(); setEditingUser(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Change Password
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {editingUser?.full_name}? This action will deactivate the user account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEditingUser(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stats by Role */}
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(USER_ROLES).map(([key, value]) => {
            const count = users.filter(u => u.roles.includes(key as AppRole)).length;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardDescription>{value.label}s</CardDescription>
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
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(USER_ROLES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>{filteredUsers.length} users found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email || "—"}</TableCell>
                      <TableCell>{u.phone || "—"}</TableCell>
                      <TableCell>{(u as any).branch?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {USER_ROLES[u.roles[0] as keyof typeof USER_ROLES]?.label || u.roles[0] || "No role"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "secondary"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(u)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenPasswordDialog(u)}>
                              <KeyRound className="h-4 w-4 mr-2" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setEditingUser(u); setDeleteDialogOpen(true); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
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

export default Users;
