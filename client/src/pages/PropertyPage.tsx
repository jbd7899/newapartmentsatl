import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProperty, getLocations } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, MapPin, ParkingCircle, Home, Check, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Property, Location } from "@shared/schema";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import PropertyGallery, { GalleryImage } from "@/components/PropertyGallery";

interface PropertyPageProps {
  id: string;
}

const PropertyPage = ({ id }: PropertyPageProps) => {
  const [, setLocation] = useLocation();
  const [showGallery, setShowGallery] = useState(false);
  
  const { data: property, isLoading: isLoadingProperty, error: propertyError } = useQuery({
    queryKey: [`/api/properties/${id}`],
    queryFn: () => getProperty(parseInt(id))
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations
  });

  // Sample images for the gallery - these would normally come from the backend
  const sampleImages = [
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907976/6463_Trammel_Dr_1_vdvnqs.jpg', alt: 'Living Room' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907981/6463_Trammel_Dr_10_usc1cr.jpg', alt: 'Kitchen' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907981/6463_Trammel_Dr_11_ticwqa.jpg', alt: 'Bathroom' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907981/6463_Trammel_Dr_12_oznyvr.jpg', alt: 'Bedroom' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907982/6463_Trammel_Dr_13_a12ish.jpg', alt: 'Exterior' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907982/6463_Trammel_Dr_14_mslsbf.jpg', alt: 'Dining Room' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907983/6463_Trammel_Dr_15_cxskq9.jpg', alt: 'Office' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907984/6463_Trammel_Dr_16_s4uqdv.jpg', alt: 'Living Room 2' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907984/6463_Trammel_Dr_17_xyivml.jpg', alt: 'Bedroom 2' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907985/6463_Trammel_Dr_18_k9qy7g.jpg', alt: 'Bathroom 2' },
  ];

  // If invalid property ID, redirect to 404
  useEffect(() => {
    if (propertyError) {
      setLocation("/not-found");
    }
  }, [propertyError, setLocation]);

  if (isLoadingProperty) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-80 bg-gray-200 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-60 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-60 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-bold text-3xl mb-4">Property Not Found</h1>
        <p className="mb-8">The property you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation("/")}>
          Return Home
        </Button>
      </div>
    );
  }

  // Find the location for this property
  const propertyLocation = locations.find((loc: Location) => loc.id === property.locationId);

  // Format features from string to array
  const featuresList = property.features.split(", ");

  return (
    <>
      {/* Property Hero */}
      <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url(${property.imageUrl})` }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">{property.name}</h1>
            <p className="text-xl max-w-2xl mx-auto mb-6">{property.address}</p>
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {propertyLocation && (
                <Badge className="px-4 py-2 text-lg" variant="secondary">
                  {propertyLocation.name}
                </Badge>
              )}
              <Button 
                variant="secondary" 
                className="font-semibold bg-white text-black hover:bg-white/90"
                onClick={() => setShowGallery(true)}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                View All Photos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-bold text-3xl mb-6">About This Property</h2>
                <p className="text-lg text-slate-700 mb-8">{property.description}</p>
                
                <h3 className="font-heading font-bold text-2xl mb-4">Property Highlights</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                    <Building className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <div className="text-sm text-slate-500">Bedrooms</div>
                      <div className="font-semibold">{property.bedrooms}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                    <ParkingCircle className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <div className="text-sm text-slate-500">Bathrooms</div>
                      <div className="font-semibold">{property.bathrooms}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                    <Home className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <div className="text-sm text-slate-500">Square Footage</div>
                      <div className="font-semibold">{property.sqft} sq ft</div>
                    </div>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-2xl mb-4">Features & Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                  {featuresList.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                {property.rent ? (
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary">${property.rent}</div>
                    <div className="text-slate-500">per month</div>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <div className="text-lg font-medium text-slate-700">Contact for Pricing</div>
                    <div className="text-slate-500">Multiple units available</div>
                  </div>
                )}
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Status</span>
                    <span className="font-semibold">
                      {property.available ? 
                        <span className="text-green-600">Available</span> : 
                        <span className="text-red-600">Unavailable</span>
                      }
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Property Type</span>
                    <span className="font-semibold">Apartment</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Year Built</span>
                    <span className="font-semibold">1930 (Renovated)</span>
                  </div>
                </div>
                
                <Button className="w-full mb-3">Schedule a Tour</Button>
                <Button variant="outline" className="w-full mb-3">Request Info</Button>
                <Button 
                  variant="secondary" 
                  className="w-full flex items-center justify-center"
                  onClick={() => setShowGallery(true)}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  View Property Gallery
                </Button>
              </CardContent>
            </Card>

            {propertyLocation && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold text-xl mb-4">
                    <MapPin className="inline-block h-5 w-5 mr-2 text-primary" />
                    Neighborhood
                  </h3>
                  <p className="text-slate-700 mb-4">
                    This property is located in {propertyLocation.name}, a desirable area known for its charm and amenities.
                  </p>
                  <Button variant="link" onClick={() => setLocation(`/${propertyLocation.slug}`)}>
                    Explore {propertyLocation.name}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Neighborhood Section */}
      {propertyLocation && (
        <NeighborhoodSection 
          locationSlug={propertyLocation.slug} 
          locationName={propertyLocation.name} 
        />
      )}

      {/* Property Gallery Modal */}
      {showGallery && (
        <PropertyGallery
          images={sampleImages}
          onClose={() => setShowGallery(false)}
          propertyName={property.name}
        />
      )}
    </>
  );
};

export default PropertyPage;