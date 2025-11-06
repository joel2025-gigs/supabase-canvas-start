import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Index = () => {
  const services = [
    {
      icon: DollarSign,
      title: "Motorcycle Financing",
      description: "We provide flexible financing options for clients who cannot afford to purchase motorcycles outright. Our model allows riders to acquire a motorcycle, pay in manageable installments, and eventually own the asset.",
    },
    {
      icon: Target,
      title: "Motorcycle Distribution & Sales",
      description: "As an authorized distributor of Haujoe and Honda motorcycles, Nawap General Trading offers durable, efficient, and affordable motorcycles for both commercial (boda boda) and personal transportation needs.",
    },
  ];

  const products = [
    { price: "9,000,000", image: "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Motorcycle+1" },
    { price: "20,000,000", image: "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Motorcycle+2" },
    { price: "6,000,000", image: "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Motorcycle+3" },
    { price: "13,000,000", image: "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Motorcycle+4" },
    { price: "8,000,000", image: "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Motorcycle+5" },
    { price: "12,500,000", image: "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Motorcycle+6" },
  ];

  const testimonials = [
    {
      name: "John",
      location: "Kampala",
      role: "Boda Boda Rider",
      quote: "Through Nawap, I was able to get my first motorcycle. Today, I ride with most of the apps including SafeBoda, Faras and Ride now in Kampala.",
    },
    {
      name: "Bondo",
      location: "Luweero",
      role: "House wife",
      quote: "My sister advised me to pick a bike from Nawap, because she knew the advantage, as they say the rest are history. Nawap helped us become financially independent.",
    },
    {
      name: "Kato",
      location: "Lugazi",
      role: "Food Delivery Rider",
      quote: "My first bike I started riding with Nawap's financing program. Now, I opened a small saloon using the income I earn. Nawap helped me become financially independent.",
    },
  ];

  const values = [
    { icon: TrendingUp, title: "Empowering" },
    { icon: Users, title: "Transforming" },
    { icon: Target, title: "Unlocking Opportunities" },
    { icon: DollarSign, title: "Creating Wealth" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="section-container">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold text-primary">
              Nawap General Trading
            </h1>
            <p className="text-2xl lg:text-3xl font-medium text-foreground italic">
              Bridging the Gap
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nawap General Trading Ltd is a Ugandan-based company committed to bridging the financial gap between potential and opportunity. We focus on investing, financing, and educating communities to utilize available resources for sustainable wealth creation.
            </p>
            <Link to="/products">
              <Button size="lg" className="gradient-accent text-lg px-8">
                Let's Go!
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="section-container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 text-primary">
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="shadow-card hover:shadow-elegant transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <service.icon className="w-12 h-12 text-accent" />
                  <h3 className="text-2xl font-semibold text-primary">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                  <Link to="/products">
                    <Button variant="outline" className="mt-4">Learn More</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section className="py-16 lg:py-24 bg-secondary">
        <div className="section-container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 text-primary">
            What You Will Get
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            We proudly offer a selection of high-quality motorcycles designed for performance, durability, and fuel efficiency.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Card key={index} className="shadow-card hover:shadow-elegant transition-shadow">
                <CardContent className="p-0">
                  <img src={product.image} alt={`Motorcycle ${index + 1}`} className="w-full h-48 object-cover rounded-t-lg" />
                  <div className="p-4">
                    <p className="text-2xl font-bold text-primary">UGX {product.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" className="gradient-primary">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="section-container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 text-primary">
            They Talk About Us
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            At Nawap, success is measured by the lives we touch. Many of our clients began with little to no income, but through our motorcycle financing program, they now earn steady incomes and have built better futures for their families.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 bg-primary-lighter rounded-full mx-auto"></div>
                  <h4 className="font-semibold text-lg text-center text-primary">
                    {testimonial.name}, {testimonial.location}
                  </h4>
                  <p className="text-sm text-center text-accent">{testimonial.role}</p>
                  <p className="text-muted-foreground italic text-center">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-secondary">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="text-center space-y-3">
                <value.icon className="w-12 h-12 mx-auto text-accent" />
                <h3 className="font-semibold text-primary">{value.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="section-container text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Join us today — let's bridge the gap together.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/credit-application">
              <Button size="lg" variant="secondary">Apply for Financing</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Apply for Partnership
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
