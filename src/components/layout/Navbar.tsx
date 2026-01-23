import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/nawap-logo.png";

/**
 * Public website navbar - completely independent of auth state.
 * Staff access the admin dashboard via /auth/login directly.
 * This navbar always shows the same links for all visitors.
 */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "About", path: "/about" },
    { name: "Careers", path: "/careers" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="bg-background border-b sticky top-0 z-50 shadow-sm">
      <div className="section-container">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="NAWAP General Trading" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA - Always show Get Started */}
          <div className="hidden md:flex items-center">
            <Link to="/get-started">
              <Button size="sm" className="gradient-accent">Get Started</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t animate-slide-in">
          <div className="section-container py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-2 text-foreground hover:text-accent transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t">
              <Link to="/get-started" onClick={() => setIsOpen(false)}>
                <Button className="w-full gradient-accent" size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
