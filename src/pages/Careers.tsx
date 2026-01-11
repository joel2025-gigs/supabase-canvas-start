import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const openings = [
  {
    title: "Field Officer",
    department: "Operations",
    location: "Multiple Locations",
    type: "Full-time",
    description: "Manage client relationships, collect payments, and support loan recovery in assigned areas.",
  },
  {
    title: "Branch Manager",
    department: "Management",
    location: "Kampala",
    type: "Full-time",
    description: "Lead branch operations, manage staff, and ensure targets are met.",
  },
  {
    title: "Accountant",
    department: "Finance",
    location: "Head Office",
    type: "Full-time",
    description: "Handle financial records, reconciliations, and reporting.",
  },
  {
    title: "Customer Service Representative",
    department: "Customer Support",
    location: "Multiple Locations",
    type: "Full-time",
    description: "Provide excellent customer service and handle client inquiries.",
  },
];

const benefits = [
  "Competitive salary and commissions",
  "Health insurance coverage",
  "Professional development opportunities",
  "Friendly work environment",
  "Growth opportunities",
  "Performance bonuses",
];

const Careers = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="section-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Build your career with NAWAP and help transform lives across Uganda
            </p>
          </div>
        </section>

        {/* Why Join */}
        <section className="py-16">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Why Work With Us?</h2>
                <p className="text-muted-foreground mb-8">
                  At NAWAP, we believe our people are our greatest asset. We foster a culture 
                  of growth, innovation, and teamwork. Join us and be part of a team that's 
                  making a real difference in people's lives.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-muted rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-4">Our Culture</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>✓ Collaborative and supportive environment</li>
                  <li>✓ Regular training and skill development</li>
                  <li>✓ Open communication across all levels</li>
                  <li>✓ Recognition for hard work and achievements</li>
                  <li>✓ Work-life balance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 bg-muted/50">
          <div className="section-container">
            <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {openings.map((job, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>{job.department}</CardDescription>
                      </div>
                      <Badge variant="secondary">{job.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </div>
                    </div>
                    <Link to="/contact">
                      <Button variant="outline" className="w-full">Apply Now</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="section-container text-center">
            <h2 className="text-3xl font-bold mb-4">Don't See a Suitable Position?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              We're always looking for talented individuals. Send us your CV and we'll 
              keep you in mind for future opportunities.
            </p>
            <Link to="/contact">
              <Button size="lg" className="gradient-accent">Submit Your CV</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
