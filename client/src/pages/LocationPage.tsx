import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLocationBySlug, getPropertiesByLocation } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LocationPageProps {
  location: string;
}

const LocationPage = ({ location }: LocationPageProps) => {
  const [, setLocation] = useLocation();
  
  const { data: locationData, isLoading: isLoadingLocation, error: locationError } = useQuery({
    queryKey: [`/api/locations/${location}`],
    queryFn: () => getLocationBySlug(location)
  });

  const { data: properties, isLoading: isLoadingProperties, error: propertiesError } = useQuery({
    queryKey: [`/api/locations/${location}/properties`],
    queryFn: () => getPropertiesByLocation(location),
    enabled: !!locationData
  });

  // If invalid location, redirect to 404
  useEffect(() => {
    if (locationError) {
      setLocation("/not-found");
    }
  }, [locationError, setLocation]);

  if (isLoadingLocation || isLoadingProperties) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-40 bg-gray-200 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!locationData || propertiesError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-bold text-3xl mb-4">Error loading location</h1>
        <p className="mb-8">Something went wrong. Please try again later.</p>
        <Button onClick={() => setLocation("/")}>
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Location Header */}
      <div 
        className="relative py-24 bg-cover bg-center" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${locationData.imageUrl})` 
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="font-heading font-bold text-4xl mb-4">{locationData.name}</h1>
          <p className="text-xl max-w-2xl mx-auto">{locationData.description}</p>
        </div>
      </div>

      {/* Property Listings */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="font-heading font-bold text-3xl text-center mb-12">Available Properties</h2>
        
        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="relative h-64">
                  <img 
                    src={property.imageUrl} 
                    alt={property.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold text-xl mb-2">{property.name}</h3>
                  <p className="text-[hsl(var(--brand-gray))] mb-4">{property.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-bed text-[hsl(var(--brand-orange))] mr-2"></i>
                      <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-bath text-[hsl(var(--brand-orange))] mr-2"></i>
                      <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-ruler-combined text-[hsl(var(--brand-orange))] mr-2"></i>
                      <span>{property.sqft} sq ft</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-semibold">${property.rent}/month</div>
                    <Button>View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-[hsl(var(--brand-gray))]">
            No properties available in this location at the moment. Please check back soon!
          </p>
        )}
      </div>
    </>
  );
};

export default LocationPage;
