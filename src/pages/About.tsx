import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/messaging/ChatWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Award, TrendingUp, User } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To bridge the financial gap between potential and opportunity by providing accessible financing solutions and quality products.",
    },
    {
      icon: Users,
      title: "Community Focus",
      description: "We invest in educating and empowering communities to utilize available resources for sustainable wealth creation.",
    },
    {
      icon: Award,
      title: "Quality Products",
      description: "Authorized distributor of premium motorcycle brands, ensuring reliability and performance for all our customers.",
    },
    {
      icon: TrendingUp,
      title: "Financial Growth",
      description: "We've helped hundreds of Ugandans start income-generating activities and achieve financial stability through our programs.",
    },
  ];

  const teamMembers = [
    {
      name: "Brahim Nangoli",
      title: "CEO",
    },
    {
      name: "Julius Wamoyo",
      title: "Co-Founder",
    },
    {
      name: "Allen",
      title: "General Manager",
    },
    {
      name: "Kim",
      title: "Marketing Manager",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-12 lg:py-20 bg-gradient-hero">
        <div className="section-container">
          <h1 className="text-4xl lg:text-5xl font-bold text-center text-primary mb-4">
            About NAWAP General Trading
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto text-lg">
            Bridging the Gap Between Potential and Opportunity
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-3xl font-bold text-primary">Who We Are</h2>
            <p className="text-lg text-muted-foreground">
              Nawap General Trading Ltd is a Ugandan-based company committed to bridging the financial gap between potential and opportunity. We focus on investing, financing, and educating communities to utilize available resources for sustainable wealth creation.
            </p>
            <p className="text-lg text-muted-foreground">
              As an authorized distributor of Haujoe and Honda motorcycles, we provide flexible financing options that allow riders to acquire motorcycles through manageable installments. Through this initiative, we have empowered hundreds of young Ugandans to start income-generating activities and achieve financial stability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-primary">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-primary text-primary-foreground">
        <div className="section-container text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Our Impact</h2>
          <p className="max-w-2xl mx-auto text-lg opacity-90">
            At Nawap, success is measured by the lives we touch. Many of our clients began with little to no income, but through our motorcycle financing program, they now earn steady incomes and have built better futures for their families.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <p className="text-5xl font-bold">500+</p>
              <p className="text-lg opacity-90 mt-2">Happy Customers</p>
            </div>
            <div>
              <p className="text-5xl font-bold">1000+</p>
              <p className="text-lg opacity-90 mt-2">Motorcycles Financed</p>
            </div>
            <div>
              <p className="text-5xl font-bold">100%</p>
              <p className="text-lg opacity-90 mt-2">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">Our Leadership Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the passionate individuals driving NAWAP's mission forward
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="shadow-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">{member.name}</h3>
                    <p className="text-muted-foreground">{member.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ChatWidget />
      <Footer />
    </div>
  );
};

export default About;
