import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProperty, getLocations, getPropertyImagesByProperty, getPropertyUnits, getUnitImages } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, MapPin, ParkingCircle, Home, Check, Image as ImageIcon, Bed, Bath } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Property, Location, PropertyImage, PropertyUnit, UnitImage } from "@shared/schema";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import PropertyGallery, { GalleryImage } from "@/components/PropertyGallery";
import UnitCard from "@/components/UnitCard";
import UnitGallery from "@/components/UnitGallery";

interface PropertyPageProps {
  id: string;
}

const PropertyPage = ({ id }: PropertyPageProps) => {
  const [, setLocation] = useLocation();
  const [showGallery, setShowGallery] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  
  const { data: property, isLoading: isLoadingProperty, error: propertyError } = useQuery({
    queryKey: [`/api/properties/${id}`],
    queryFn: () => getProperty(parseInt(id))
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations
  });
  
  // Fetch property images from the API
  const { data: propertyImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/properties', parseInt(id), 'images'],
    queryFn: () => getPropertyImagesByProperty(parseInt(id)),
    enabled: !!property
  });
  
  // Fetch property units if this is a multifamily property
  const { data: propertyUnits = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['/api/properties', parseInt(id), 'units'],
    queryFn: () => getPropertyUnits(parseInt(id)),
    enabled: !!property && !!property.isMultifamily
  });
  
  // Create a map to store unit images for each unit
  const [unitImagesMap, setUnitImagesMap] = useState<Record<number, UnitImage[]>>({});
  
  // Fetch unit images for each unit
  useEffect(() => {
    const fetchUnitImages = async () => {
      if (propertyUnits.length > 0) {
        const imagesMap: Record<number, UnitImage[]> = {};
        
        for (const unit of propertyUnits) {
          try {
            const images = await getUnitImages(unit.id);
            imagesMap[unit.id] = images;
          } catch (error) {
            console.error(`Failed to fetch images for unit ${unit.id}:`, error);
            imagesMap[unit.id] = [];
          }
        }
        
        setUnitImagesMap(imagesMap);
      }
    };
    
    if (propertyUnits.length > 0) {
      fetchUnitImages();
    }
  }, [propertyUnits]);
  
  // Convert property images to gallery format, sorted by display order
  const galleryImages: GalleryImage[] = propertyImages
    .sort((a: PropertyImage, b: PropertyImage) => a.displayOrder - b.displayOrder)
    .map((image: PropertyImage) => ({
      url: image.url,
      alt: image.alt || property?.name || 'Property image'
    }));
  
  // Use sample images as fallback if no images are found
  const sampleImages = [
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907976/6463_Trammel_Dr_1_vdvnqs.jpg', alt: 'Living Room' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907981/6463_Trammel_Dr_10_usc1cr.jpg', alt: 'Kitchen' },
    { url: 'https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907981/6463_Trammel_Dr_11_ticwqa.jpg', alt: 'Bathroom' },
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
  
  // Get featured image from property images or use property image URL as fallback
  const featuredImage = propertyImages.find((img: PropertyImage) => img.isFeatured)?.url || property.imageUrl;

  return (
    <>
      {/* Property Hero */}
      <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url(${featuredImage})` }}>
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
                
                {property.isMultifamily ? (
                  <div className="grid grid-cols-1 gap-4 mb-8">
                    <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                      <Building className="h-6 w-6 text-primary mr-3" />
                      <div>
                        <div className="text-sm text-slate-500">Property Type</div>
                        <div className="font-semibold">
                          Multi-family Property • {property.unitCount || 0} {property.unitCount === 1 ? 'Unit' : 'Units'}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="text-blue-700">
                        This is a multi-family property. For details on bedrooms, bathrooms, square footage, and pricing, 
                        please see the individual units listed below.
                      </p>
                    </div>
                  </div>
                ) : (
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
                )}

                {!property.isMultifamily && (
                  <>
                    <h3 className="font-heading font-bold text-2xl mb-4">Features & Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                      {featuresList.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                {property.isMultifamily ? (
                  <div className="text-center mb-6">
                    <div className="text-lg font-medium text-slate-700">Multiple unit options</div>
                    <div className="text-slate-500">See unit details below</div>
                  </div>
                ) : property.rent ? (
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary">${property.rent}</div>
                    <div className="text-slate-500">per month</div>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <div className="text-lg font-medium text-slate-700">Contact for Pricing</div>
                    <div className="text-slate-500">Pricing details available on request</div>
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
                    <span className="font-semibold capitalize">
                      {property.propertyType ? property.propertyType.replace('-', ' ') : 'Multi Family'}
                    </span>
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
      
      {/* Display available units if this is a multifamily property */}
      {property.isMultifamily && (
        <div className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-3xl mb-4">Available Units</h2>
            <p className="text-slate-700">
              {propertyUnits.filter(unit => unit.available).length} unit{propertyUnits.filter(unit => unit.available).length !== 1 ? 's' : ''} available at {property.name}
            </p>
          </div>
          
          {unitsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : propertyUnits.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No Units Available</h3>
              <p className="text-slate-600">Check back soon for new availability.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {propertyUnits.map((unit) => (
                <UnitCard 
                  key={unit.id}
                  unit={unit}
                  unitImages={unitImagesMap[unit.id] || []}
                  onShowGallery={() => setSelectedUnitId(unit.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Filtering options for units */}
      {property.isMultifamily && propertyUnits.length > 0 && (
        <div className="container mx-auto px-4 pb-16">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-bold text-xl mb-6">Filter Available Units</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-500 mb-2">Bedrooms</div>
                  <div className="flex gap-2">
                    {propertyUnits
                        .map(unit => unit.bedrooms)
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .sort()
                        .map((bedCount) => (
                          <Badge key={bedCount} variant="outline" className="px-3 py-1 cursor-pointer hover:bg-primary hover:text-white">
                            <Bed className="h-3 w-3 mr-1" /> {bedCount}
                          </Badge>
                        ))
                    }
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-500 mb-2">Bathrooms</div>
                  <div className="flex gap-2">
                    {Array.from(new Set(propertyUnits.map(unit => unit.bathrooms))).sort().map((bathCount) => (
                      <Badge key={bathCount} variant="outline" className="px-3 py-1 cursor-pointer hover:bg-primary hover:text-white">
                        <Bath className="h-3 w-3 mr-1" /> {bathCount}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-500 mb-2">Availability</div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-green-500 hover:text-white">
                      Available Now
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-primary hover:text-white">
                      All Units
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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
          images={galleryImages.length > 0 ? galleryImages : sampleImages}
          onClose={() => setShowGallery(false)}
          propertyName={property.name}
        />
      )}
      
      {/* Unit Gallery Modal */}
      {selectedUnitId !== null && (
        <UnitGallery
          images={
            unitImagesMap[selectedUnitId]?.map(img => ({
              url: img.url,
              alt: img.alt || `Unit Image`
            })) || sampleImages
          }
          onClose={() => setSelectedUnitId(null)}
          unitNumber={propertyUnits.find(unit => unit.id === selectedUnitId)?.unitNumber || ''}
          propertyName={property.name}
        />
      )}
    </>
  );
};

export default PropertyPage;