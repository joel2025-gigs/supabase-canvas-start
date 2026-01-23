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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, FileText, Bike, DollarSign } from "lucide-react";
import { DISTRICTS, REPAYMENT_FREQUENCIES, INTEREST_RATE } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import type { InquiryWithDetails } from "./InquiryCard";
import type { Branch } from "@/lib/types";

interface ProductCatalogItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  asset_type: string;
  down_payment_percent: number;
  interest_rate: number | null;
  loan_duration_months: number | null;
  image_url: string | null;
}

const applicationSchema = z.object({
  // KYC - Personal
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+256|0)[0-9]{9}$/, "Invalid Ugandan phone number"),
  phone_secondary: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  national_id: z.string().min(5, "National ID is required for KYC"),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  // KYC - Address
  address: z.string().min(5, "Address is required"),
  district: z.string().min(2, "District is required"),
  village: z.string().optional(),
  // KYC - Next of Kin
  next_of_kin_name: z.string().min(2, "Next of kin name is required"),
  next_of_kin_phone: z.string().regex(/^(\+256|0)[0-9]{9}$/, "Invalid phone number"),
  next_of_kin_relationship: z.string().optional(),
  // KYC - Employment
  occupation: z.string().min(2, "Occupation is required"),
  employer_name: z.string().optional(),
  monthly_income: z.number().min(100000, "Monthly income must be at least 100,000 UGX"),
  // Loan Details
  asset_id: z.string().min(1, "Asset selection is required"),
  down_payment: z.number().min(0),
  repayment_frequency: z.enum(["daily", "weekly"]),
});

interface LoanApplicationDialogProps {
  inquiry: InquiryWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  userBranchId?: string;
}

export const LoanApplicationDialog = ({
  inquiry,
  open,
  onOpenChange,
  onSuccess,
  userId,
  userBranchId,
}: LoanApplicationDialogProps) => {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("personal");

  const [formData, setFormData] = useState<{
    full_name: string;
    phone: string;
    phone_secondary: string;
    email: string;
    national_id: string;
    date_of_birth: string;
    gender: string;
    address: string;
    district: string;
    village: string;
    next_of_kin_name: string;
    next_of_kin_phone: string;
    next_of_kin_relationship: string;
    occupation: string;
    employer_name: string;
    monthly_income: string;
    asset_id: string;
    down_payment: string;
    repayment_frequency: "daily" | "weekly";
    branch_id: string;
  }>({
    // Personal
    full_name: "",
    phone: "",
    phone_secondary: "",
    email: "",
    national_id: "",
    date_of_birth: "",
    gender: "",
    // Address
    address: "",
    district: "",
    village: "",
    // Next of Kin
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    // Employment
    occupation: "",
    employer_name: "",
    monthly_income: "",
    // Loan
    asset_id: "",
    down_payment: "",
    repayment_frequency: "daily",
    branch_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchBranches();
    }
  }, [open]);

  useEffect(() => {
    if (inquiry) {
      setFormData((prev) => ({
        ...prev,
        full_name: inquiry.full_name || "",
        phone: inquiry.phone || "",
        email: inquiry.email || "",
        district: inquiry.district || "",
        occupation: inquiry.occupation || "",
        monthly_income: inquiry.monthly_income
          ? inquiry.monthly_income.replace(/[^0-9]/g, "")
          : "",
      }));
    }
  }, [inquiry]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("product_catalog")
      .select("id, name, brand, model, price, asset_type, down_payment_percent, interest_rate, loan_duration_months, image_url")
      .eq("status", "approved")
      .is("deleted_at", null)
      .order("brand", { ascending: true });
    setProducts(data || []);
  };

  const fetchBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null);
    setBranches(data || []);
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    setFormData((prev) => ({ ...prev, asset_id: productId }));
  };

  const calculateLoan = () => {
    if (!selectedProduct) return null;
    const principal = selectedProduct.price;
    const downPayment = Number(formData.down_payment) || 0;
    const loanAmount = principal - downPayment;
    const productInterestRate = selectedProduct.interest_rate || INTEREST_RATE;
    const interestAmount = loanAmount * (productInterestRate / 100);
    const totalAmount = loanAmount + interestAmount;
    const frequency = REPAYMENT_FREQUENCIES[formData.repayment_frequency];
    const durationMonths = selectedProduct.loan_duration_months || 12;
    const durationDays = durationMonths * 30;
    const totalInstallments = Math.ceil(durationDays / frequency.daysPerPeriod);
    const installmentAmount = Math.ceil(totalAmount / totalInstallments);

    return {
      principal,
      downPayment,
      loanAmount,
      interestAmount,
      totalAmount,
      totalInstallments,
      installmentAmount,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const dataToValidate = {
      ...formData,
      monthly_income: formData.monthly_income ? Number(formData.monthly_income) : 0,
      down_payment: formData.down_payment ? Number(formData.down_payment) : 0,
    };

    const result = applicationSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);

      // Navigate to first tab with error
      if (
        errors.full_name ||
        errors.phone ||
        errors.national_id ||
        errors.email ||
        errors.date_of_birth ||
        errors.gender
      ) {
        setActiveTab("personal");
      } else if (errors.address || errors.district || errors.village) {
        setActiveTab("address");
      } else if (
        errors.next_of_kin_name ||
        errors.next_of_kin_phone ||
        errors.next_of_kin_relationship
      ) {
        setActiveTab("kin");
      } else if (errors.occupation || errors.monthly_income) {
        setActiveTab("employment");
      } else {
        setActiveTab("loan");
      }
      return;
    }

    const calculation = calculateLoan();
    if (!calculation || !selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    setSubmitting(true);

    try {
      const branchId = formData.branch_id || userBranchId || branches[0]?.id;
      if (!branchId) {
        toast.error("No branch available. Please contact administrator.");
        return;
      }

      // 1. Create asset from selected product
      const { data: assetData, error: assetError } = await supabase
        .from("assets")
        .insert({
          asset_type: selectedProduct.asset_type,
          brand: selectedProduct.brand,
          model: selectedProduct.model,
          chassis_number: `PENDING-${Date.now()}`, // Placeholder until actual chassis is registered
          purchase_price: selectedProduct.price,
          selling_price: selectedProduct.price,
          status: "assigned",
          branch_id: branchId,
          registered_by: userId,
          notes: `Created from product catalog: ${selectedProduct.name}`,
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // 2. Create client record
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          full_name: formData.full_name,
          phone: formData.phone,
          phone_secondary: formData.phone_secondary || null,
          national_id: formData.national_id,
          address: formData.address,
          district: formData.district,
          village: formData.village || null,
          next_of_kin_name: formData.next_of_kin_name,
          next_of_kin_phone: formData.next_of_kin_phone,
          occupation: formData.occupation,
          monthly_income: Number(formData.monthly_income),
          asset_id: assetData.id,
          branch_id: branchId,
          registered_by: userId,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 3. Generate loan number and create loan
      const { data: loanNumberData, error: loanNumberError } = await supabase.rpc(
        "generate_loan_number"
      );
      if (loanNumberError) throw loanNumberError;

      const startDate = new Date();
      const durationMonths = selectedProduct.loan_duration_months || 12;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationMonths * 30);

      const productInterestRate = selectedProduct.interest_rate || INTEREST_RATE;

      const { error: loanError } = await supabase.from("loans").insert({
        loan_number: loanNumberData,
        client_id: clientData.id,
        asset_id: assetData.id,
        branch_id: branchId,
        principal_amount: calculation.loanAmount,
        interest_rate: productInterestRate,
        total_amount: calculation.totalAmount,
        down_payment: calculation.downPayment,
        loan_balance: calculation.totalAmount,
        repayment_frequency: formData.repayment_frequency,
        installment_amount: calculation.installmentAmount,
        total_installments: calculation.totalInstallments,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        status: "pending",
        created_by: userId,
      });

      if (loanError) throw loanError;

      // 4. Update inquiry status to converted
      if (inquiry) {
        await supabase
          .from("inquiries")
          .update({ status: "converted" })
          .eq("id", inquiry.id);
      }

      toast.success("Loan application created successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating loan application:", error);
      toast.error(error.message || "Failed to create loan application");
    } finally {
      setSubmitting(false);
    }
  };

  const calculation = calculateLoan();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Loan Application
          </DialogTitle>
          <DialogDescription>
            Complete KYC verification and loan details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">
                <User className="h-4 w-4 mr-1 hidden sm:inline" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="kin">Next of Kin</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="loan">
                <DollarSign className="h-4 w-4 mr-1 hidden sm:inline" />
                Loan
              </TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className={formErrors.full_name ? "border-destructive" : ""}
                    />
                    {formErrors.full_name && (
                      <p className="text-sm text-destructive">{formErrors.full_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="national_id">National ID *</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) =>
                        setFormData({ ...formData, national_id: e.target.value })
                      }
                      className={formErrors.national_id ? "border-destructive" : ""}
                    />
                    {formErrors.national_id && (
                      <p className="text-sm text-destructive">{formErrors.national_id}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      placeholder="+256 or 0..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={formErrors.phone ? "border-destructive" : ""}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-destructive">{formErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_secondary">Secondary Phone</Label>
                    <Input
                      id="phone_secondary"
                      value={formData.phone_secondary}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_secondary: e.target.value })
                      }
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
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({ ...formData, date_of_birth: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => setFormData({ ...formData, gender: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address */}
            <TabsContent value="address" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Address Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Physical Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className={formErrors.address ? "border-destructive" : ""}
                    />
                    {formErrors.address && (
                      <p className="text-sm text-destructive">{formErrors.address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(v) => setFormData({ ...formData, district: v })}
                    >
                      <SelectTrigger
                        className={formErrors.district ? "border-destructive" : ""}
                      >
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
                    {formErrors.district && (
                      <p className="text-sm text-destructive">{formErrors.district}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="village">Village/LC1</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) =>
                        setFormData({ ...formData, village: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Next of Kin */}
            <TabsContent value="kin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next of Kin (Guarantor)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_name">Full Name *</Label>
                    <Input
                      id="next_of_kin_name"
                      value={formData.next_of_kin_name}
                      onChange={(e) =>
                        setFormData({ ...formData, next_of_kin_name: e.target.value })
                      }
                      className={formErrors.next_of_kin_name ? "border-destructive" : ""}
                    />
                    {formErrors.next_of_kin_name && (
                      <p className="text-sm text-destructive">
                        {formErrors.next_of_kin_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_phone">Phone *</Label>
                    <Input
                      id="next_of_kin_phone"
                      placeholder="+256 or 0..."
                      value={formData.next_of_kin_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, next_of_kin_phone: e.target.value })
                      }
                      className={formErrors.next_of_kin_phone ? "border-destructive" : ""}
                    />
                    {formErrors.next_of_kin_phone && (
                      <p className="text-sm text-destructive">
                        {formErrors.next_of_kin_phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                    <Select
                      value={formData.next_of_kin_relationship}
                      onValueChange={(v) =>
                        setFormData({ ...formData, next_of_kin_relationship: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employment */}
            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employment & Income</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation *</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) =>
                        setFormData({ ...formData, occupation: e.target.value })
                      }
                      className={formErrors.occupation ? "border-destructive" : ""}
                    />
                    {formErrors.occupation && (
                      <p className="text-sm text-destructive">{formErrors.occupation}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer_name">Employer/Business Name</Label>
                    <Input
                      id="employer_name"
                      value={formData.employer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, employer_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_income">Monthly Income (UGX) *</Label>
                    <Input
                      id="monthly_income"
                      type="number"
                      value={formData.monthly_income}
                      onChange={(e) =>
                        setFormData({ ...formData, monthly_income: e.target.value })
                      }
                      className={formErrors.monthly_income ? "border-destructive" : ""}
                    />
                    {formErrors.monthly_income && (
                      <p className="text-sm text-destructive">
                        {formErrors.monthly_income}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loan Details */}
            <TabsContent value="loan" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bike className="h-5 w-5" />
                    Asset Selection & Loan Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Select Product *</Label>
                    <Select
                      value={formData.asset_id}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger
                        className={formErrors.asset_id ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            No products available
                          </div>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center gap-2">
                                <Bike className="h-4 w-4" />
                                <span>
                                  {product.brand} {product.model}
                                </span>
                                <span className="text-muted-foreground">
                                  ({product.asset_type})
                                </span>
                                <span className="font-medium">
                                  UGX {product.price.toLocaleString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.asset_id && (
                      <p className="text-sm text-destructive">{formErrors.asset_id}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="down_payment">Down Payment (UGX)</Label>
                    <Input
                      id="down_payment"
                      type="number"
                      value={formData.down_payment}
                      onChange={(e) =>
                        setFormData({ ...formData, down_payment: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Repayment Frequency</Label>
                    <Select
                      value={formData.repayment_frequency}
                      onValueChange={(v: "daily" | "weekly") =>
                        setFormData({ ...formData, repayment_frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {branches.length > 1 && (
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Select
                        value={formData.branch_id || userBranchId}
                        onValueChange={(v) =>
                          setFormData({ ...formData, branch_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Loan Summary */}
              {calculation && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Loan Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Product Price</p>
                        <p className="font-semibold">
                          UGX {calculation.principal.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Down Payment</p>
                        <p className="font-semibold">
                          UGX {calculation.downPayment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Loan Amount + Interest ({selectedProduct?.interest_rate || INTEREST_RATE}%)
                        </p>
                        <p className="font-semibold text-primary">
                          UGX {calculation.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {formData.repayment_frequency === "daily"
                            ? "Daily Payment"
                            : "Weekly Payment"}
                        </p>
                        <p className="font-semibold text-primary">
                          UGX {calculation.installmentAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
