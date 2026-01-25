import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import logo from "@/assets/nawap-logo.png";
import { Phone, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const OfficerLogin = () => {
  const [searchParams] = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";
  const department = searchParams.get("department") || "";
  
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    // Ensure it starts with 256
    if (digits.startsWith("0")) {
      return "256" + digits.slice(1);
    }
    if (!digits.startsWith("256") && digits.length > 0) {
      return "256" + digits;
    }
    return digits;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedPhone = formatPhoneNumber(phone);
    
    if (formattedPhone.length < 12) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    
    try {
      // Check if this phone number is registered as an officer
      const { data: officer, error: officerError } = await supabase
        .from("department_officers")
        .select("id, full_name, department")
        .eq("phone", formattedPhone)
        .eq("is_active", true)
        .maybeSingle();

      if (officerError) throw officerError;

      if (!officer) {
        toast.error("Phone number not registered as an officer. Please contact your department admin.");
        setLoading(false);
        return;
      }

      // Send OTP via Supabase phone auth
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+${formattedPhone}`,
      });

      if (error) {
        // If phone auth is not enabled, show helpful message
        if (error.message.includes("Phone") || error.message.includes("provider")) {
          toast.error("Phone authentication is being set up. Please use email login for now or contact admin.");
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      toast.success(`OTP sent to +${formattedPhone}`);
      setPhone(formattedPhone);
      setStep("otp");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+${phone}`,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      if (data.user) {
        // Link this user to the officer record
        const { error: updateError } = await supabase
          .from("department_officers")
          .update({ user_id: data.user.id })
          .eq("phone", phone)
          .eq("is_active", true);

        if (updateError) {
          console.error("Error linking officer:", updateError);
        }

        toast.success("Welcome! Redirecting to dashboard...");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentLabel = (dept: string) => {
    const labels: Record<string, string> = {
      sales: "Sales",
      credit_collection: "Credit & Collection",
      recovery: "Recovery",
      operations: "Operations",
    };
    return labels[dept] || dept;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="NAWAP" className="h-16 w-auto mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Officer Login
            </CardTitle>
            <CardDescription className="mt-2">
              {department && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {getDepartmentLabel(department)} Department
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="256xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your registered phone number to receive a verification code
                </p>
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to<br />
                  <span className="font-medium text-foreground">+{phone}</span>
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Use different number
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Staff with email accounts?{" "}
              <Link to="/auth/login" className="text-accent hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficerLogin;
