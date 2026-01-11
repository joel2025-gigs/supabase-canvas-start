import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Bike, Truck } from "lucide-react";
import motorcycle1 from "@/assets/motorcycle-1.png";
import motorcycle2 from "@/assets/motorcycle-2.png";
import motorcycle3 from "@/assets/motorcycle-3.png";

const products = [
  {
    name: "Boxer 150cc",
    type: "Motorcycle",
    image: motorcycle1,
    price: "UGX 4,500,000",
    downPayment: "UGX 900,000",
    monthlyPayment: "UGX 200,000",
    features: ["Fuel efficient", "Durable engine", "Easy maintenance", "2-year warranty"],
  },
  {
    name: "TVS Apache 160",
    type: "Motorcycle",
    image: motorcycle2,
    price: "UGX 5,200,000",
    downPayment: "UGX 1,040,000",
    monthlyPayment: "UGX 230,000",
    features: ["Powerful performance", "Digital display", "Disc brakes", "2-year warranty"],
  },
  {
    name: "Bajaj Pulsar 150",
    type: "Motorcycle",
    image: motorcycle3,
    price: "UGX 4,800,000",
    downPayment: "UGX 960,000",
    monthlyPayment: "UGX 215,000",
    features: ["Sporty design", "Twin spark engine", "Comfortable ride", "2-year warranty"],
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
              Quality motorcycles and tricycles available on flexible financing terms. 
              Start your boda-boda business with as little as 20% down payment.
            </p>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-12 bg-muted/50">
          <div className="section-container">
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bike className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>Motorcycles</CardTitle>
                  <CardDescription>
                    Popular brands including Boxer, TVS, Bajaj, and Honda
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle>Tricycles</CardTitle>
                  <CardDescription>
                    Three-wheelers for cargo and passenger transport
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16">
          <div className="section-container">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Motorcycles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cash Price:</span>
                          <span className="font-semibold">{product.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Down Payment (20%):</span>
                          <span className="font-semibold text-primary">{product.downPayment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly (18 months):</span>
                          <span className="font-semibold text-accent">{product.monthlyPayment}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {product.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
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
