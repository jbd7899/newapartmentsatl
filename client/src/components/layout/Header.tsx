import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-[hsl(var(--brand-orange))] font-heading font-bold text-3xl">
          ApartmentsATL
        </Link>
        <nav className="hidden md:flex space-x-6 items-center">
          <Link 
            href="/" 
            className={`font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition ${
              location === "/" ? "text-[hsl(var(--brand-orange))]" : ""
            }`}
          >
            Home
          </Link>
          <a 
            href="#locations" 
            className="font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition"
          >
            Locations
          </a>
          <a 
            href="#features" 
            className="font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition"
          >
            Our Properties
          </a>
          <Link 
            href="/apartment-finder" 
            className={`font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition ${
              location === "/apartment-finder" ? "text-[hsl(var(--brand-orange))]" : ""
            }`}
          >
            Apartment Finder
          </Link>
          <Link href="/portal" className="ml-4">
            <Button className="bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))] hover:opacity-90">
              Resident Portal
            </Button>
          </Link>
        </nav>
        <button 
          className="md:hidden text-[hsl(var(--brand-orange))] text-2xl"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white py-4 shadow-lg absolute w-full z-10`}>
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          <Link 
            href="/" 
            className={`font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition ${
              location === "/" ? "text-[hsl(var(--brand-orange))]" : ""
            }`}
            onClick={closeMobileMenu}
          >
            Home
          </Link>
          <a 
            href="#locations" 
            className="font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition"
            onClick={closeMobileMenu}
          >
            Locations
          </a>
          <a 
            href="#features" 
            className="font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition"
            onClick={closeMobileMenu}
          >
            Our Properties
          </a>
          <Link 
            href="/apartment-finder" 
            className={`font-heading font-medium hover:text-[hsl(var(--brand-orange))] transition ${
              location === "/apartment-finder" ? "text-[hsl(var(--brand-orange))]" : ""
            }`}
            onClick={closeMobileMenu}
          >
            Apartment Finder
          </Link>
          <Link href="/portal" onClick={closeMobileMenu}>
            <Button className="w-full bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))] hover:opacity-90">
              Resident Portal
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
