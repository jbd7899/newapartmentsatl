import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import PropertySearch from "@/components/PropertySearch";

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
        <Link href="/" className="text-[hsl(var(--brand-orange))] font-heading font-bold text-2xl md:text-3xl">
          ApartmentsATL
        </Link>
        
        <div className="hidden md:flex items-center space-x-4 flex-1 max-w-xl mx-auto">
          <PropertySearch />
        </div>
        
        <nav className="hidden md:flex items-center">
          <Link href="/portal">
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
          <div className="py-2">
            <PropertySearch />
          </div>
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
