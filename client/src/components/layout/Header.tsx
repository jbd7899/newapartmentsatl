import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import PropertySearch from "@/components/PropertySearch";
import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
        
        <div className="hidden md:flex items-center space-x-6">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 border-2 border-gray-200 hover:border-[hsl(var(--brand-orange))] hover:bg-orange-50 rounded-full px-4 py-2 shadow-sm transition-all"
              >
                <Search className="h-5 w-5 text-[hsl(var(--brand-orange))]" />
                <span className="text-gray-700 font-medium">Search</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0 shadow-lg border-2" align="end">
              <div className="p-4">
                <h3 className="font-medium mb-2">Find a property</h3>
                <PropertySearch onSelect={() => setSearchOpen(false)} />
              </div>
            </PopoverContent>
          </Popover>
        
          <a href="https://apartmentsatl.appfolio.com/connect/users/sign_in" target="_blank" rel="noopener noreferrer">
            <Button className="bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))] hover:opacity-90">
              Resident Portal
            </Button>
          </a>
        </div>
        <button 
          className="md:hidden flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Search className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
          <span className="text-sm font-medium text-gray-700">Menu</span>
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white py-4 shadow-lg absolute w-full z-10`}>
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-lg">Menu</h3>
            <button 
              onClick={closeMobileMenu}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-100">
            <div className="flex items-center mb-2">
              <Search className="h-5 w-5 text-[hsl(var(--brand-orange))] mr-2" />
              <h3 className="font-medium">Find a property</h3>
            </div>
            <PropertySearch onSelect={closeMobileMenu} />
          </div>
          
          <a href="https://apartmentsatl.appfolio.com/connect/users/sign_in" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu}>
            <Button className="w-full bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))] hover:opacity-90">
              Resident Portal
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
