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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Building2, Loader2, Save } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import type { Branch } from "@/lib/types";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const { user, profile, isAuthenticated, loading: authLoading, isAdmin, refetch, roles } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address: "",
    district: "",
    national_id: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        district: profile.district || "",
        national_id: profile.national_id || "",
      });
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      fetchBranches();
    }
  }, [isAuthenticated, roles]);

  const fetchBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("is_active", true);
    setBranches(data || []);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          district: profileData.district,
          national_id: profileData.national_id,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID</Label>
                <Input
                  id="national_id"
                  value={profileData.national_id}
                  onChange={(e) => setProfileData({ ...profileData, national_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={profileData.district} onValueChange={(v) => setProfileData({ ...profileData, district: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>Your account details (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={user?.id.slice(0, 8) + "..." || ""} disabled className="bg-muted font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={profile?.branch?.name || "Not assigned"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input 
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        {isAdmin() && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>System Settings</CardTitle>
              </div>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Interest Rate</div>
                    <div className="text-sm text-muted-foreground">Fixed interest rate for all loans</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">30%</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Default Threshold</div>
                    <div className="text-sm text-muted-foreground">Consecutive missed payments before default</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">4 weeks</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Active Branches</div>
                    <div className="text-sm text-muted-foreground">Number of operational branches</div>
                  </div>
                  <div className="text-2xl font-bold">{branches.length}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-4">
                System-wide settings like interest rate and default threshold are configured at the application level. 
                Contact your system administrator to modify these values.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-muted-foreground">Sign out of your account on this device</div>
              </div>
              <Button variant="outline" onClick={() => navigate("/auth/login")}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
