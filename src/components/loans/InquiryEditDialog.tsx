import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import type { InquiryWithDetails } from "./InquiryCard";

interface InquiryEditDialogProps {
  inquiry: InquiryWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<InquiryWithDetails>) => Promise<void>;
}

const INCOME_RANGES = [
  "Below 500,000 UGX",
  "500,000 - 1,000,000 UGX",
  "1,000,000 - 2,000,000 UGX",
  "Above 2,000,000 UGX",
];

const PRODUCT_OPTIONS = [
  "Motorcycle",
  "Tricycle (Tuk-tuk)",
  "Both",
  "Not sure yet",
];

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "closed"];

export const InquiryEditDialog = ({
  inquiry,
  open,
  onOpenChange,
  onSave,
}: InquiryEditDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    district: "",
    occupation: "",
    product_interest: "",
    monthly_income: "",
    message: "",
    status: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (inquiry) {
      setFormData({
        full_name: inquiry.full_name || "",
        phone: inquiry.phone || "",
        email: inquiry.email || "",
        district: inquiry.district || "",
        occupation: inquiry.occupation || "",
        product_interest: inquiry.product_interest || "",
        monthly_income: inquiry.monthly_income || "",
        message: inquiry.message || "",
        status: inquiry.status || "new",
        notes: inquiry.notes || "",
      });
    }
  }, [inquiry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry) return;

    setSubmitting(true);
    try {
      await onSave(inquiry.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
        district: formData.district || null,
        occupation: formData.occupation || null,
        product_interest: formData.product_interest || null,
        monthly_income: formData.monthly_income || null,
        message: formData.message || null,
        status: formData.status,
        notes: formData.notes || null,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inquiry</DialogTitle>
          <DialogDescription>
            Update inquiry details and add notes from your follow-up
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select
                value={formData.district}
                onValueChange={(v) => setFormData({ ...formData, district: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="product_interest">Product Interest</Label>
              <Select
                value={formData.product_interest}
                onValueChange={(v) => setFormData({ ...formData, product_interest: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_income">Monthly Income</Label>
              <Select
                value={formData.monthly_income}
                onValueChange={(v) => setFormData({ ...formData, monthly_income: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_RANGES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add notes from follow-up calls, due diligence, etc."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
