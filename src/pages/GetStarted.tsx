import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Bike } from "lucide-react";
import LoanCalculator from "@/components/loans/LoanCalculator";

const inquirySchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  district: z.string().trim().max(100, "District name is too long").optional(),
  occupation: z.string().trim().max(100, "Occupation is too long").optional(),
  product_interest: z.string().optional(),
  monthly_income: z.string().optional(),
  message: z.string().trim().max(500, "Message is too long").optional(),
  sale_type: z.enum(["cash", "loan"]),
});

const GetStarted = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    district: "",
    occupation: "",
    product_interest: "",
    monthly_income: "",
    message: "",
    sale_type: "loan" as "cash" | "loan",
  });

  // Pre-fill product from URL query param
  useEffect(() => {
    const product = searchParams.get("product");
    if (product) {
      setFormData(prev => ({ ...prev, product_interest: product }));
    }
  }, [searchParams]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = inquirySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("inquiries").insert({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        district: formData.district.trim() || null,
        occupation: formData.occupation.trim() || null,
        product_interest: formData.product_interest || null,
        monthly_income: formData.monthly_income || null,
        message: formData.message.trim() || null,
        sale_type: formData.sale_type,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Thank you! We'll contact you soon.");

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16">
          <Card className="max-w-md mx-4 text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Thank You!</h2>
              <p className="text-muted-foreground">
                Your inquiry has been submitted successfully. One of our team members will contact you shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to home page...
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-elegant">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bike className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Get Started with NAWAP</CardTitle>
                <CardDescription>
                  Fill in your details below and our team will contact you to discuss motorcycle financing options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Personal Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          placeholder="Enter your full name"
                          className={errors.full_name ? "border-destructive" : ""}
                        />
                        {errors.full_name && (
                          <p className="text-sm text-destructive">{errors.full_name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="e.g. 0771234567"
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="your@email.com"
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) => handleChange("district", e.target.value)}
                          placeholder="e.g. Kampala"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => handleChange("occupation", e.target.value)}
                        placeholder="e.g. Boda Boda Rider, Business Owner"
                      />
                    </div>
                  </div>

                  {/* Purchase Type */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      How would you like to purchase?
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleChange("sale_type", "cash")}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.sale_type === "cash"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold">Cash Purchase</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay full amount upfront
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange("sale_type", "loan")}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.sale_type === "loan"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold">Loan Financing</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay in installments over time
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Interest Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      What are you interested in?
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product_interest">Product Interest</Label>
                        <Select
                          value={formData.product_interest}
                          onValueChange={(v) => handleChange("product_interest", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bajaj Boxer">Bajaj Boxer</SelectItem>
                            <SelectItem value="Bajaj CT">Bajaj CT</SelectItem>
                            <SelectItem value="Haojue Xpress">Haojue Xpress</SelectItem>
                            <SelectItem value="Haojue Xpress Plus">Haojue Xpress Plus</SelectItem>
                            <SelectItem value="Haojue TR300">Haojue TR300</SelectItem>
                            <SelectItem value="ZongZhen">ZongZhen</SelectItem>
                            <SelectItem value="Evakuga">Evakuga</SelectItem>
                            <SelectItem value="Tricycle">Tricycle</SelectItem>
                            <SelectItem value="Not Sure">Not Sure Yet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthly_income">Estimated Monthly Income</Label>
                        <Select
                          value={formData.monthly_income}
                          onValueChange={(v) => handleChange("monthly_income", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Below 500,000">Below UGX 500,000</SelectItem>
                            <SelectItem value="500,000 - 1,000,000">UGX 500,000 - 1,000,000</SelectItem>
                            <SelectItem value="1,000,000 - 2,000,000">UGX 1,000,000 - 2,000,000</SelectItem>
                            <SelectItem value="Above 2,000,000">Above UGX 2,000,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Message (Optional)</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        placeholder="Any specific questions or requirements?"
                        rows={3}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-accent"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Inquiry"
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting, you agree to be contacted by our team regarding motorcycle financing options.
                  </p>
                </form>
              </CardContent>
            </Card>
            
            {/* Loan Calculator */}
            <div className="lg:sticky lg:top-8 h-fit">
              <LoanCalculator />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GetStarted;
