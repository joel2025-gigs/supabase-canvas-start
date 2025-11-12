import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, Facebook, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/nawap-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <img src={logo} alt="NAWAP" className="h-12 w-auto brightness-0 invert" />
            <p className="text-sm opacity-90">
              Join hands with us today. Let's empower the next generation together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm opacity-90 hover:opacity-100 hover:text-accent transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-sm opacity-90 hover:opacity-100 hover:text-accent transition-colors">Products</Link></li>
              <li><Link to="/about" className="text-sm opacity-90 hover:opacity-100 hover:text-accent transition-colors">About</Link></li>
              <li><Link to="/careers" className="text-sm opacity-90 hover:opacity-100 hover:text-accent transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-sm opacity-90 hover:opacity-100 hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start text-sm opacity-90">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Jinja Highway, Mukono, Uganda</span>
              </li>
              <li className="flex items-center text-sm opacity-90">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>+256200901875</span>
              </li>
              <li className="flex items-center text-sm opacity-90">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>info@nawap.net</span>
              </li>
              <li className="flex items-center text-sm opacity-90">
                <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>nawap.net</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Newsletter</h3>
            <p className="text-sm opacity-90 mb-4">Subscribe now to get daily updates.</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-primary-light border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
              <Button variant="secondary" size="sm">Subscribe</Button>
            </div>
            <div className="flex gap-3 mt-4">
              <a href="#" className="opacity-90 hover:opacity-100 hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="opacity-90 hover:opacity-100 hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="opacity-90 hover:opacity-100 hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-90">
          <p>&copy; {new Date().getFullYear()} NAWAP General Trading Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
