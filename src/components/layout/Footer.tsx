import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/nawap-logo.png";

// Custom X (Twitter) icon
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const socialLinks = [
  { 
    icon: Facebook, 
    href: "https://www.facebook.com/profile.php?id=61584655846518",
    label: "Facebook"
  },
  { 
    icon: XIcon, 
    href: "#",
    label: "X"
  },
  { 
    icon: Instagram, 
    href: "https://www.instagram.com/nawapgeneraltrading",
    label: "Instagram"
  },
  { 
    icon: Linkedin, 
    href: "https://www.linkedin.com/company/nawap-general-trading-u-limited/?viewAsMember=true",
    label: "LinkedIn"
  },
  { 
    icon: Youtube, 
    href: "https://www.youtube.com/@NawapGeneralTrading",
    label: "YouTube"
  },
  { 
    icon: TikTokIcon, 
    href: "https://www.tiktok.com/@houjoexpress?_r=1&_t=ZS-93K21GWUck9",
    label: "TikTok"
  },
];

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
                <span>+256200911380</span>
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
            <div className="flex flex-wrap gap-3 mt-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-90 hover:opacity-100 hover:text-accent transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
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
