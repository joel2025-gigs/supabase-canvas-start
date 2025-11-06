import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Globe, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      value: "Jinja Highway, Mukono, Uganda",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+256200901875",
      link: "tel:+256200901875",
    },
    {
      icon: Mail,
      title: "Email",
      value: "info@nawap.net",
      link: "mailto:info@nawap.net",
    },
    {
      icon: Globe,
      title: "Website",
      value: "nawap.net",
      link: "https://nawap.net",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-12 lg:py-20 bg-gradient-hero">
        <div className="section-container">
          <h1 className="text-4xl lg:text-5xl font-bold text-center text-primary mb-4">
            Contact Us
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Get in touch with us. We're here to answer your questions and help you get started.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-primary mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
                    <Input placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                    <Input type="email" placeholder="john@example.com" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                    <Input type="tel" placeholder="+256 XXX XXXXXX" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                    <Textarea placeholder="How can we help you?" rows={6} required />
                  </div>
                  <Button type="submit" className="w-full gradient-accent">Send Message</Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Contact Information</h2>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <Card key={index} className="shadow-card">
                      <CardContent className="p-4 flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center flex-shrink-0">
                          <info.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary">{info.title}</h3>
                          {info.link ? (
                            <a href={info.link} className="text-muted-foreground hover:text-accent transition-colors">
                              {info.value}
                            </a>
                          ) : (
                            <p className="text-muted-foreground">{info.value}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="shadow-card bg-accent text-accent-foreground">
                <CardContent className="p-6 text-center space-y-4">
                  <MessageCircle className="w-12 h-12 mx-auto" />
                  <h3 className="text-xl font-bold">Chat with us on WhatsApp</h3>
                  <p className="opacity-90">Get instant responses to your questions</p>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => window.open("https://wa.me/256200901875", "_blank")}
                  >
                    Open WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
