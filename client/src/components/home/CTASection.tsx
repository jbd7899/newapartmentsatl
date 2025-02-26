import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="finder" className="py-16 bg-[hsl(var(--brand-orange))]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading font-bold text-3xl text-white mb-6">
          Interested in one of our apartments?
        </h2>
        <Link href="/apartment-finder">
          <Button className="bg-white text-[hsl(var(--brand-orange))] hover:bg-white hover:bg-opacity-90 px-8 py-3 h-auto text-base font-heading font-semibold rounded-lg">
            Apartment Finder
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
