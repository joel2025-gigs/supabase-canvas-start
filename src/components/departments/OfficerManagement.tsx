import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  UserPlus, 
  Users, 
  Phone, 
  User,
  Trash2,
  ShoppingCart,
  CreditCard,
  RefreshCw
} from "lucide-react";
import type { Department } from "@/lib/types";

interface Officer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface OfficerManagementProps {
  department: Department;
  officers: Officer[];
  maxOfficers?: number;
  canManage: boolean;
  onRefresh: () => void;
  userId: string;
}

const departmentConfig = {
  sales: {
    title: "Sales Officers",
    icon: ShoppingCart,
    roleLabel: "Sales Officer",
    addLabel: "Add Sales Officer",
  },
  credit_collection: {
    title: "Credit Officers",
    icon: CreditCard,
    roleLabel: "Credit Officer",
    addLabel: "Add Credit Officer",
  },
  recovery: {
    title: "Recovery Officers",
    icon: RefreshCw,
    roleLabel: "Recovery Officer",
    addLabel: "Add Recovery Officer",
  },
  operations: {
    title: "Operations Officers",
    icon: Users,
    roleLabel: "Operations Officer",
    addLabel: "Add Operations Officer",
  },
};

export const OfficerManagement = ({
  department,
  officers,
  maxOfficers = 10,
  canManage,
  onRefresh,
  userId,
}: OfficerManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  const config = departmentConfig[department];
  const Icon = config.icon;

  const handleAddOfficer = async () => {
    if (!formData.phone || !formData.full_name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Create officer record without user_id - will be linked when they sign in with OTP
      const { error } = await supabase.from("department_officers").insert({
        department,
        phone: formData.phone,
        full_name: formData.full_name,
        added_by: userId,
      });

      if (error) throw error;

      toast.success(`${config.roleLabel} added successfully`);
      setIsDialogOpen(false);
      setFormData({ full_name: "", phone: "" });
      onRefresh();
    } catch (error: any) {
      console.error("Error adding officer:", error);
      toast.error(error.message || "Failed to add officer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOfficer = async (officerId: string) => {
    try {
      const { error } = await supabase
        .from("department_officers")
        .update({ is_active: false })
        .eq("id", officerId);

      if (error) throw error;

      toast.success("Officer removed successfully");
      onRefresh();
    } catch (error) {
      console.error("Error removing officer:", error);
      toast.error("Failed to remove officer");
    }
  };

  const activeOfficers = officers.filter((o) => o.is_active);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5" />
            {config.title} ({activeOfficers.length}/{maxOfficers})
          </CardTitle>
          {canManage && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={activeOfficers.length >= maxOfficers}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {config.addLabel}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activeOfficers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No {config.title.toLowerCase()} found. Add one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOfficers.map((officer) => (
                <div
                  key={officer.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{officer.full_name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {officer.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      Active
                    </Badge>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveOfficer(officer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Officer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config.addLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Enter officer's full name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="256xxxxxxxxx"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                The officer will use this phone number to sign in with OTP verification.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOfficer} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Officer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
