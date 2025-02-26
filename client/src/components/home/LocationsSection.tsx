import { useQuery } from "@tanstack/react-query";
import PropertyCard from "../PropertyCard";
import { getLocations } from "@/lib/data";
import { Location } from "@shared/schema";

const LocationsSection = () => {
  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations
  });

  if (isLoading) {
    return (
      <section id="locations" className="py-16 bg-[hsl(var(--brand-light))]">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">Our Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !locations) {
    return (
      <section id="locations" className="py-16 bg-[hsl(var(--brand-light))]">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">Our Locations</h2>
          <p className="text-center text-red-500">Error loading locations. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="locations" className="py-16 bg-[hsl(var(--brand-light))]">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl text-center mb-12">Our Locations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {locations.map((location: Location) => (
            <PropertyCard key={location.id} location={location} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
