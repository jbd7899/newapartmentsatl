import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="hero-section py-20 md:py-32">
      <div className="container mx-auto px-4 text-center text-white">
        <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4 leading-tight">
          Unique and architecturally charming urban living - <br className="hidden md:block" />
          Locally owned and managed.
        </h1>
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
          <Link href="/apartment-finder">
            <Button className="w-full md:w-auto bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))] hover:opacity-90 px-6 py-3 h-auto text-base font-heading font-semibold">
              Apartment Finder
            </Button>
          </Link>
          <a href="#locations">
            <Button variant="outline" className="w-full md:w-auto border-2 border-white text-white hover:bg-white hover:text-[hsl(var(--brand-dark))] px-6 py-3 h-auto text-base font-heading font-semibold bg-black/30 backdrop-blur-sm">
              View Properties
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
