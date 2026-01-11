import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Heart, Users, Award, TrendingUp } from "lucide-react";

const values = [
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Customer First",
    description: "We prioritize our customers' success and work to make asset ownership accessible to all.",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Integrity",
    description: "We operate with transparency and honesty in all our dealings.",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Community",
    description: "We believe in empowering communities through economic opportunities.",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Growth",
    description: "We are committed to continuous improvement and innovation.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="section-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About NAWAP</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Empowering Ugandans with accessible asset financing since 2020
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    NAWAP General Trading Company Limited was founded with a simple mission: 
                    to make motorcycle and tricycle ownership accessible to hardworking Ugandans 
                    who need reliable transportation for their livelihoods.
                  </p>
                  <p>
                    We recognized that many boda-boda riders were trapped in expensive rental 
                    arrangements, paying high daily fees without ever owning their means of income. 
                    Our asset financing model changes this by offering affordable payment plans 
                    that lead to full ownership.
                  </p>
                  <p>
                    Today, we operate across multiple districts in Uganda, having helped thousands 
                    of riders become proud owners of their motorcycles and tricycles.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">5+</div>
                    <div className="text-muted-foreground">Years in Business</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">10+</div>
                    <div className="text-muted-foreground">Branches</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">5,000+</div>
                    <div className="text-muted-foreground">Clients Served</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-primary mb-2">95%</div>
                    <div className="text-muted-foreground">Repayment Rate</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted/50">
          <div className="section-container">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    To provide accessible and affordable asset financing solutions that empower 
                    individuals and small businesses to achieve financial independence through 
                    productive asset ownership.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    To be the leading asset financing company in East Africa, known for 
                    transforming lives through innovative and customer-centric financing solutions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="section-container">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      {value.icon}
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
