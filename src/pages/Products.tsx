import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { CheckCircle2, Bike, Truck, Banknote, Shield, Clock, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import motorcycle1 from "@/assets/motorcycle-1.png";
import motorcycle2 from "@/assets/motorcycle-2.png";
import motorcycle3 from "@/assets/motorcycle-3.png";
import motorcycle4 from "@/assets/motorcycle-4.png";
import motorcycle5 from "@/assets/motorcycle-5.png";
import motorcycle6 from "@/assets/motorcycle-6.png";

// Fallback images mapping
const fallbackImages: Record<string, string> = {
  "Bajaj Boxer": motorcycle1,
  "Bajaj CT": motorcycle3,
  "Haojue Xpress": motorcycle5,
  "ZongZhen": motorcycle4,
  "Evakuga": motorcycle2,
  "Haojue Xpress Plus": motorcycle6,
  "Haojue TR300": motorcycle1,
};

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  description: string | null;
  asset_type: string;
  price: number;
  down_payment_percent: number;
  loan_duration_months: number;
  interest_rate: number;
  image_url: string | null;
  features: string[];
  is_featured: boolean;
  display_order: number;
}

const financingFeatures = [
  {
    icon: Banknote,
    title: "Low Down Payment",
    description: "Start with as little as 20% down payment on any motorcycle.",
  },
  {
    icon: Clock,
    title: "Flexible Terms",
    description: "Choose payment terms from 12 to 24 months based on your budget.",
  },
  {
    icon: Calculator,
    title: "Transparent Pricing",
    description: "No hidden fees. Know exactly what you'll pay from day one.",
  },
  {
    icon: Shield,
    title: "Full Ownership",
    description: "Own your motorcycle outright after completing all payments.",
  },
];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedProducts();
  }, []);

  const fetchApprovedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("product_catalog")
        .select("*")
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (product: Product) => {
    if (product.image_url) return product.image_url;
    return fallbackImages[product.name] || motorcycle1;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMonthlyPayment = (product: Product) => {
    const downPayment = product.price * (product.down_payment_percent / 100);
    const remaining = product.price - downPayment;
    const interestRate = (product.interest_rate || 30) / 100;
    const totalWithInterest = remaining * (1 + interestRate);
    const duration = product.loan_duration_months || 18;
    return Math.round(totalWithInterest / duration);
  };

  const calculateTotalLoan = (product: Product) => {
    const downPayment = product.price * (product.down_payment_percent / 100);
    const remaining = product.price - downPayment;
    const interestRate = (product.interest_rate || 30) / 100;
    return Math.round(remaining * (1 + interestRate));
  };

  // Separate products by type
  const motorcycles = products.filter(p => p.asset_type === "motorcycle");
  const tricycles = products.filter(p => p.asset_type === "tricycle");

  const renderProductGrid = (productList: Product[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (productList.length === 0) {
      return (
        <div className="text-center py-12">
          <Bike className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">
            Check back soon for our latest offerings.
          </p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {productList.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-elegant transition-shadow">
            <div className="aspect-video bg-muted relative overflow-hidden">
              <img 
                src={getProductImage(product)} 
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                {product.brand}
              </div>
              {product.is_featured && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded">
                  Featured
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle>{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.model}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Cash Price:</span>
                    <span className="font-semibold">UGX {formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Down Payment ({product.down_payment_percent}%):</span>
                    <span className="font-semibold text-primary">
                      UGX {formatCurrency(product.price * (product.down_payment_percent / 100))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Loan ({product.interest_rate || 30}% interest):</span>
                    <span className="font-semibold">
                      UGX {formatCurrency(calculateTotalLoan(product))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Monthly ({product.loan_duration_months || 18} months):</span>
                    <span className="font-semibold text-accent">
                      UGX {formatCurrency(calculateMonthlyPayment(product))}
                    </span>
                  </div>
                </div>
                {product.features && product.features.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {product.features.slice(0, 4).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/get-started">
                  <Button className="w-full gradient-accent">Apply Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="section-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Quality motorcycles and tricycles from trusted brands, available for cash purchase or through 
              our flexible financing program. Start your journey to ownership today.
            </p>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-12 bg-muted/50">
          <div className="section-container">
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <Card className="text-center hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bike className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>Motorcycles</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    Premium brands including Bajaj, Haojue, Honda, and more. Perfect for boda boda 
                    business or personal transportation.
                  </p>
                </CardHeader>
              </Card>
              <Card className="text-center hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle>Tricycles</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    Three-wheelers for cargo and passenger transport. Ideal for logistics 
                    businesses and commercial operations.
                  </p>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Motorcycles Section */}
        <section className="py-16">
          <div className="section-container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <Bike className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold">Motorcycles</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse our selection of quality motorcycles. All prices shown include financing terms 
                with the displayed down payment and repayment period.
              </p>
            </div>
            {renderProductGrid(motorcycles, "No Motorcycles Available")}
          </div>
        </section>

        {/* Tricycles Section */}
        <section className="py-16 bg-secondary">
          <div className="section-container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <Truck className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-bold">Tricycles</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three-wheelers for cargo and passenger transport. Perfect for logistics 
                businesses and commercial operations.
              </p>
            </div>
            {renderProductGrid(tricycles, "No Tricycles Available")}
          </div>
        </section>

        {/* Financing Section */}
        <section className="py-16">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Financing Options</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Can't pay the full amount upfront? Our financing program makes ownership 
                accessible with flexible payment plans tailored to your income.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financingFeatures.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Card className="inline-block max-w-2xl">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-4">How Financing Works</h3>
                  <ol className="text-left space-y-3 text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
                      <span>Choose your vehicle and apply online or at any branch</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                      <span>Submit required documents and pay your down payment</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                      <span>Receive your vehicle and start your daily/weekly payments</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">4</span>
                      <span>Complete all payments and own your vehicle outright</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Distribution Section */}
        <section className="py-16 bg-muted/50">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Dealership & Distribution</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    NAWAP General Trading is an authorized distributor of leading motorcycle brands 
                    in Uganda. We source directly from manufacturers to ensure quality and competitive pricing.
                  </p>
                  <p>
                    Whether you're a bulk buyer, dealership, or individual customer, we offer:
                  </p>
                  <ul className="space-y-3 mt-4">
                    {[
                      "Genuine manufacturer warranties on all vehicles",
                      "Spare parts availability and after-sales support",
                      "Bulk pricing for fleet purchases",
                      "Nationwide delivery to all districts",
                      "Technical training for riders and mechanics",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/contact">
                  <Button className="mt-6">Inquire About Bulk Orders</Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Bajaj</div>
                  <div className="text-muted-foreground text-sm">Authorized Dealer</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Haojue</div>
                  <div className="text-muted-foreground text-sm">Authorized Dealer</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Honda</div>
                  <div className="text-muted-foreground text-sm">Authorized Dealer</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">ZongZhen</div>
                  <div className="text-muted-foreground text-sm">Authorized Dealer</div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="section-container text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Own Your Vehicle?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Visit any of our branches or apply online. Our team will guide you through the process.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/get-started">
                <Button size="lg" variant="secondary">Apply Online</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Products;