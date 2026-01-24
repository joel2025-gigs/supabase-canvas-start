import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Percent, Hash } from "lucide-react";
import type { Department } from "@/lib/types";

interface Officer {
  id: string;
  full_name: string;
}

interface RecordPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  officers: Officer[];
  userId: string;
  onSuccess: () => void;
}

export const RecordPerformanceDialog = ({
  open,
  onOpenChange,
  department,
  officers,
  userId,
  onSuccess,
}: RecordPerformanceDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    officer_id: "",
    cash_sales_count: 0,
    loan_sales_count: 0,
    total_sales_amount: 0,
    amount_disbursed: 0,
    collection_rate: 0,
    default_rate: 0,
    at_risk_loans_count: 0,
    total_recovered_amount: 0,
    recovery_rate: 0,
    notes: "",
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { error } = await supabase.from("department_performance").insert({
        department,
        officer_id: formData.officer_id || null,
        period_start: weekStart.toISOString().split("T")[0],
        period_end: weekEnd.toISOString().split("T")[0],
        cash_sales_count: formData.cash_sales_count,
        loan_sales_count: formData.loan_sales_count,
        total_sales_amount: formData.total_sales_amount,
        amount_disbursed: formData.amount_disbursed,
        collection_rate: formData.collection_rate,
        default_rate: formData.default_rate,
        at_risk_loans_count: formData.at_risk_loans_count,
        total_recovered_amount: formData.total_recovered_amount,
        recovery_rate: formData.recovery_rate,
        notes: formData.notes,
        recorded_by: userId,
      });

      if (error) throw error;

      toast.success("Performance recorded successfully");
      onOpenChange(false);
      setFormData({
        officer_id: "",
        cash_sales_count: 0,
        loan_sales_count: 0,
        total_sales_amount: 0,
        amount_disbursed: 0,
        collection_rate: 0,
        default_rate: 0,
        at_risk_loans_count: 0,
        total_recovered_amount: 0,
        recovery_rate: 0,
        notes: "",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error recording performance:", error);
      toast.error(error.message || "Failed to record performance");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDepartmentFields = () => {
    switch (department) {
      case "sales":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cash_sales_count">Cash Sales</Label>
                <Input
                  id="cash_sales_count"
                  type="number"
                  min={0}
                  value={formData.cash_sales_count}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cash_sales_count: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_sales_count">Loan Sales</Label>
                <Input
                  id="loan_sales_count"
                  type="number"
                  min={0}
                  value={formData.loan_sales_count}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      loan_sales_count: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_sales_amount">Total Sales Amount (UGX)</Label>
              <Input
                id="total_sales_amount"
                type="number"
                min={0}
                value={formData.total_sales_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    total_sales_amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </>
        );

      case "credit_collection":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="amount_disbursed">Amount Disbursed (UGX)</Label>
              <Input
                id="amount_disbursed"
                type="number"
                min={0}
                value={formData.amount_disbursed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount_disbursed: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collection_rate">Collection Rate (%)</Label>
                <Input
                  id="collection_rate"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.collection_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      collection_rate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rate">Default Rate (%)</Label>
                <Input
                  id="default_rate"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.default_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      default_rate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </>
        );

      case "recovery":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="at_risk_loans_count">At-Risk Loans</Label>
                <Input
                  id="at_risk_loans_count"
                  type="number"
                  min={0}
                  value={formData.at_risk_loans_count}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      at_risk_loans_count: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recovery_rate">Recovery Rate (%)</Label>
                <Input
                  id="recovery_rate"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.recovery_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recovery_rate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_recovered_amount">
                Total Recovered Amount (UGX)
              </Label>
              <Input
                id="total_recovered_amount"
                type="number"
                min={0}
                value={formData.total_recovered_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    total_recovered_amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {department === "sales" ? (
              <Hash className="h-5 w-5" />
            ) : (
              <Percent className="h-5 w-5" />
            )}
            Record Performance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {officers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="officer">Officer (Optional)</Label>
              <Select
                value={formData.officer_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, officer_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select officer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Team Total</SelectItem>
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {renderDepartmentFields()}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Performance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
