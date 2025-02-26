import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--brand-dark-gray))] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:apartmentsatl@gmail.com" className="hover:text-[hsl(var(--brand-orange))] transition">
                  apartmentsatl@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:7702562787" className="hover:text-[hsl(var(--brand-orange))] transition">
                  (770) 256-2787
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">Locations</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/midtown" className="hover:text-[hsl(var(--brand-orange))] transition">
                  Midtown, Atlanta
                </Link>
              </li>
              <li>
                <Link href="/virginia-highland" className="hover:text-[hsl(var(--brand-orange))] transition">
                  Virginia-Highland, Atlanta
                </Link>
              </li>
              <li>
                <Link href="/dallas" className="hover:text-[hsl(var(--brand-orange))] transition">
                  Dallas, Texas
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/apartment-finder" className="hover:text-[hsl(var(--brand-orange))] transition">
                  Apartment Finder
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[hsl(var(--brand-orange))] transition">
                  Resident Portal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[hsl(var(--brand-orange))] transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[hsl(var(--brand-orange))] transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ApartmentsATL. Family-owned and operated for over 20 years.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
