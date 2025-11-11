import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, TrendingUp, Handshake, Building2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobManagement from "@/components/admin/JobManagement";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { CreditApplicationForm } from "@/components/credit/CreditApplicationForm";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loanTerm, setLoanTerm] = useState<number>(12);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("name");
      
      if (!error && data) {
        setProducts(data);
      }
      setLoadingProducts(false);
    };

    const checkAdmin = async () => {
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!data);
      }
    };

    if (user) {
      fetchProducts();
      checkAdmin();
    }
  }, [user]);

  const calculateMonthlyPayment = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product || !product.credit_price) return 0;
    
    const interestRate = 0.15; // 15% annual interest
    const monthlyRate = interestRate / 12;
    const principal = product.credit_price;
    
    // Calculate monthly payment using amortization formula
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / 
                          (Math.pow(1 + monthlyRate, loanTerm) - 1);
    
    return monthlyPayment;
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-background to-muted/20">
        <div className="section-container py-12">
          <h1 className="text-4xl font-bold mb-8">Welcome, {user.email}</h1>
          
          <Tabs defaultValue="loan" className="space-y-8">
            <TabsList className={`grid w-full max-w-2xl ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="loan">Get Motorcycle Loan</TabsTrigger>
              <TabsTrigger value="investor">Become an Investor</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Manage Jobs</TabsTrigger>}
            </TabsList>

            <TabsContent value="loan" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bike className="w-6 h-6" />
                    Motorcycle Loan Calculator
                  </CardTitle>
                  <CardDescription>
                    Select a motorcycle and loan period to calculate your monthly payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="product">Select Motorcycle</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Choose a motorcycle" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - UGX {product.credit_price?.toLocaleString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProductData && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cash Price:</span>
                        <span className="font-semibold">UGX {selectedProductData.cash_price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Credit Price:</span>
                        <span className="font-semibold">UGX {selectedProductData.credit_price?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Loan Period</Label>
                      <span className="text-sm font-medium">{loanTerm} months</span>
                    </div>
                    <Slider
                      value={[loanTerm]}
                      onValueChange={(value) => setLoanTerm(value[0])}
                      min={6}
                      max={36}
                      step={6}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>6 months</span>
                      <span>36 months</span>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                        <p className="text-3xl font-bold text-primary">
                          UGX {calculateMonthlyPayment().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: UGX {(calculateMonthlyPayment() * loanTerm).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    size="lg" 
                    disabled={!selectedProduct}
                    onClick={() => setShowApplicationForm(true)}
                  >
                    Apply for Loan
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investor" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      Investment Opportunities
                    </CardTitle>
                    <CardDescription>
                      Partner with us to finance motorcycle purchases
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      Join our investment program and earn returns by financing motorcycle purchases for qualified buyers.
                    </p>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• Competitive returns on investment</li>
                      <li>• Secured financing with collateral</li>
                      <li>• Flexible investment terms</li>
                      <li>• Regular income streams</li>
                    </ul>
                    <Button className="w-full">Learn More</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Handshake className="w-6 h-6 text-primary" />
                      Partnership Options
                    </CardTitle>
                    <CardDescription>
                      Strategic partnerships for business growth
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="w-5 h-5 mt-0.5 text-primary" />
                        <div>
                          <h4 className="font-semibold text-sm">Financing SMEs</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Partner with us to provide financing solutions for small and medium enterprises
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Building2 className="w-5 h-5 mt-0.5 text-primary" />
                        <div>
                          <h4 className="font-semibold text-sm">Corporate Financing</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Large-scale corporate financing solutions for fleet purchases and business expansion
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full">Contact Us</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <JobManagement />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />

      {selectedProduct && user && (
        <CreditApplicationForm
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
          productId={selectedProduct}
          loanTerm={loanTerm}
          userId={user.id}
          productName={selectedProductData?.name || ""}
        />
      )}
    </div>
  );
};

export default Dashboard;
