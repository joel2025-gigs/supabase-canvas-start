import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, Shield, Banknote, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import heroBackground from "@/assets/motorcycle-2.png";

const Index = () => {
  const highlights = [
    {
      icon: Bike,
      title: "Authorized Distributor",
      description: "Official distributor of Haojue, Honda, and Bajaj motorcycles in Uganda.",
    },
    {
      icon: Banknote,
      title: "Flexible Financing",
      description: "Affordable payment plans that lead to full motorcycle ownership.",
    },
    {
      icon: Shield,
      title: "Trusted Partner",
      description: "5+ years serving thousands of clients across Uganda.",
    },
    {
      icon: Users,
      title: "Community Focus",
      description: "Empowering riders to build sustainable livelihoods.",
    },
  ];

  const stats = [
    { value: "5+", label: "Years in Business" },
    { value: "10+", label: "Branches Nationwide" },
    { value: "5,000+", label: "Clients Served" },
    { value: "95%", label: "Repayment Rate" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative py-24 lg:py-40 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.4)), url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="section-container relative z-10">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium">
              <Bike className="w-4 h-4" />
              Uganda's Trusted Motorcycle Partner
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              Bridging the Gap to <span className="text-accent">Motorcycle Ownership</span>
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              NAWAP General Trading Ltd provides premium motorcycle distribution and flexible financing 
              solutions, helping Ugandans access reliable transportation for their livelihoods.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/get-started">
                <Button size="lg" className="gradient-accent text-lg px-8 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="secondary" className="text-lg px-8 w-full sm:w-auto">
                  View Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-primary-foreground/80 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Your Partner in <span className="text-primary">Mobility & Finance</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              We combine motorcycle distribution with accessible financing to help riders 
              transition from renters to proud owners, creating sustainable economic opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <Card key={index} className="shadow-card hover:shadow-elegant transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 lg:py-24 bg-secondary">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Why Choose <span className="text-primary">NAWAP?</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                We understand the challenges faced by aspiring motorcycle owners. Our solutions 
                are designed to make ownership accessible, affordable, and sustainable.
              </p>
              <ul className="space-y-4">
                {[
                  "Official distributor of top motorcycle brands",
                  "Flexible payment plans from 12-24 months",
                  "No hidden fees or complicated terms",
                  "Nationwide branch network for support",
                  "Path to full ownership, not endless rentals",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/about">
                <Button variant="outline" className="mt-4">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-6">
                <div className="text-4xl font-bold text-primary mb-2">20%</div>
                <div className="text-muted-foreground text-sm">Minimum Down Payment</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-4xl font-bold text-primary mb-2">24</div>
                <div className="text-muted-foreground text-sm">Max Months to Pay</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-4xl font-bold text-primary mb-2">7</div>
                <div className="text-muted-foreground text-sm">Motorcycle Models</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground text-sm">Ownership at End</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="section-container text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Whether you're looking to purchase a motorcycle or explore financing options, 
            we're here to help you take the first step toward ownership.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/get-started">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Today
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
