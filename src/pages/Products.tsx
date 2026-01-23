import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Bike, Truck, Banknote, Shield, Clock, Calculator } from "lucide-react";
import motorcycle1 from "@/assets/motorcycle-1.png";
import motorcycle2 from "@/assets/motorcycle-2.png";
import motorcycle3 from "@/assets/motorcycle-3.png";
import motorcycle4 from "@/assets/motorcycle-4.png";
import motorcycle5 from "@/assets/motorcycle-5.png";
import motorcycle6 from "@/assets/motorcycle-6.png";

const motorcycles = [
  {
    name: "Bajaj Boxer",
    brand: "Bajaj",
    image: motorcycle1,
    price: "9,000,000",
    downPayment: "1,800,000",
    monthlyPayment: "400,000",
    features: ["Fuel efficient", "Durable engine", "Easy maintenance", "2-year warranty"],
  },
  {
    name: "Bajaj CT",
    brand: "Bajaj",
    image: motorcycle3,
    price: "20,000,000",
    downPayment: "4,000,000",
    monthlyPayment: "888,000",
    features: ["Powerful performance", "Digital display", "Disc brakes", "2-year warranty"],
  },
  {
    name: "Haojue Xpress",
    brand: "Haojue",
    image: motorcycle5,
    price: "6,000,000",
    downPayment: "1,200,000",
    monthlyPayment: "266,000",
    features: ["Compact design", "Low fuel consumption", "Reliable", "2-year warranty"],
  },
  {
    name: "ZongZhen",
    brand: "ZongZhen",
    image: motorcycle4,
    price: "13,000,000",
    downPayment: "2,600,000",
    monthlyPayment: "577,000",
    features: ["Sporty design", "High power", "Comfortable ride", "2-year warranty"],
  },
  {
    name: "Evakuga",
    brand: "Evakuga",
    image: motorcycle2,
    price: "8,000,000",
    downPayment: "1,600,000",
    monthlyPayment: "355,000",
    features: ["Modern styling", "Efficient engine", "Low maintenance", "2-year warranty"],
  },
  {
    name: "Haojue Xpress Plus",
    brand: "Haojue",
    image: motorcycle6,
    price: "12,500,000",
    downPayment: "2,500,000",
    monthlyPayment: "555,000",
    features: ["Enhanced features", "Better mileage", "Premium build", "2-year warranty"],
  },
  {
    name: "Haojue TR300",
    brand: "Haojue",
    image: motorcycle1,
    price: "15,000,000",
    downPayment: "3,000,000",
    monthlyPayment: "666,000",
    features: ["Heavy duty", "Long range", "Commercial grade", "2-year warranty"],
  },
];

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
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="section-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Quality motorcycles from trusted brands, available for cash purchase or through 
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
                  <CardDescription>
                    Premium brands including Bajaj, Haojue, Honda, and more. Perfect for boda boda 
                    business or personal transportation.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle>Tricycles</CardTitle>
                  <CardDescription>
                    Three-wheelers for cargo and passenger transport. Ideal for logistics 
                    businesses and commercial operations.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Motorcycles Grid */}
        <section className="py-16">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Motorcycle Inventory</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse our selection of quality motorcycles. All prices shown include our standard 
                financing terms with 20% down payment and 18-month repayment period.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {motorcycles.map((product, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-elegant transition-shadow">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                      {product.brand}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle>{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Cash Price:</span>
                          <span className="font-semibold">UGX {product.price}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Down Payment (20%):</span>
                          <span className="font-semibold text-primary">UGX {product.downPayment}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Monthly (18 months):</span>
                          <span className="font-semibold text-accent">UGX {product.monthlyPayment}</span>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        {product.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Link to="/auth/signup">
                        <Button className="w-full gradient-accent">Apply Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Financing Section */}
        <section className="py-16 bg-secondary">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Financing Options</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Can't pay the full amount upfront? Our financing program makes motorcycle ownership 
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
                      <span>Choose your motorcycle and apply online or at any branch</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                      <span>Submit required documents and pay your down payment (min 20%)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                      <span>Receive your motorcycle and start your daily/weekly payments</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">4</span>
                      <span>Complete all payments and own your motorcycle outright</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Distribution Section */}
        <section className="py-16">
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
                      "Genuine manufacturer warranties on all motorcycles",
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
            <h2 className="text-3xl font-bold mb-4">Ready to Own Your Motorcycle?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Visit any of our branches or apply online. Our team will guide you through the process.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/auth/signup">
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
