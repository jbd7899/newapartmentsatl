import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocations, getProperties } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Location, Property } from "@shared/schema";

const ApartmentFinderPage = () => {
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [bedroomsFilter, setBedroomsFilter] = useState<string>("");
  const [maxRent, setMaxRent] = useState<number>(2500);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties
  });

  // Filter properties when filters or properties change
  useEffect(() => {
    if (!properties) return;

    let filtered = [...properties];

    if (locationFilter) {
      filtered = filtered.filter(property => {
        const location = locations.find((loc: Location) => loc.id === property.locationId);
        return location?.slug === locationFilter;
      });
    }

    if (bedroomsFilter) {
      filtered = filtered.filter(property => property.bedrooms.toString() === bedroomsFilter);
    }

    if (maxRent) {
      filtered = filtered.filter(property => property.rent <= maxRent);
    }

    setFilteredProperties(filtered);
  }, [locationFilter, bedroomsFilter, maxRent, properties, locations]);

  if (isLoadingLocations || isLoadingProperties) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-heading font-bold text-4xl text-center mb-12">Apartment Finder</h1>
        <div className="h-60 bg-gray-200 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-heading font-bold text-4xl text-center mb-12">Apartment Finder</h1>
      
      {/* Filters */}
      <Card className="mb-12">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={locationFilter}
                onValueChange={(value) => setLocationFilter(value)}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {locations.map((location: Location) => (
                    <SelectItem key={location.id} value={location.slug}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Select
                value={bedroomsFilter}
                onValueChange={(value) => setBedroomsFilter(value)}
              >
                <SelectTrigger id="bedrooms">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <Label>Max Rent: ${maxRent}</Label>
              <Slider
                value={[maxRent]}
                min={500}
                max={3500}
                step={100}
                onValueChange={(value) => setMaxRent(value[0])}
                className="mt-4"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => {
                setLocationFilter("");
                setBedroomsFilter("");
                setMaxRent(2500);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Property Results */}
      <div>
        <h2 className="font-heading font-bold text-2xl mb-6">
          {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'} Found
        </h2>
        
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const location = locations.find((loc: Location) => loc.id === property.locationId);
              
              return (
                <Card key={property.id} className="overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-60">
                    <img 
                      src={property.imageUrl} 
                      alt={property.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-heading font-bold text-xl mb-1">{property.name}</h3>
                    <p className="text-[hsl(var(--brand-gray))] text-sm mb-3">
                      {location?.name}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mb-4 text-sm">
                      <div className="flex items-center">
                        <i className="fas fa-bed text-[hsl(var(--brand-orange))] mr-1"></i>
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-bath text-[hsl(var(--brand-orange))] mr-1"></i>
                        <span>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-ruler-combined text-[hsl(var(--brand-orange))] mr-1"></i>
                        <span>{property.sqft} sq ft</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-semibold">${property.rent}/month</div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <i className="fas fa-home text-4xl text-[hsl(var(--brand-gray))] mb-3"></i>
            <h3 className="font-heading font-bold text-xl mb-2">No properties match your search</h3>
            <p className="text-[hsl(var(--brand-gray))] mb-4">Try adjusting your filters to find more properties</p>
            <Button
              onClick={() => {
                setLocationFilter("");
                setBedroomsFilter("");
                setMaxRent(2500);
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentFinderPage;
