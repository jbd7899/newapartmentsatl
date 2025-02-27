import React, { useEffect, useState } from "react";
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
  const [activeTab, setActiveTab] = useState('overview');
  
  // References for scrolling to sections
  const overviewRef = React.useRef<HTMLDivElement>(null);
  const unitsRef = React.useRef<HTMLDivElement>(null);
  const neighborhoodRef = React.useRef<HTMLDivElement>(null);
  
  // Function to scroll to section
  const scrollToSection = (section: string) => {
    setActiveTab(section);
    
    setTimeout(() => {
      if (section === 'overview' && overviewRef.current) {
        overviewRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'units' && unitsRef.current) {
        unitsRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'neighborhood' && neighborhoodRef.current) {
        neighborhoodRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
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
      {/* Property Hero - Updated with modern design */}
      <div className="relative h-64 md:h-[50vh] bg-gray-300 bg-center bg-cover" style={{ backgroundImage: `url(${featuredImage})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center mb-2">
              {property.available && (
                <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold mr-2 mb-2">
                  Available Now
                </span>
              )}
              {propertyLocation && (
                <span className="flex items-center px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-sm mr-2 mb-2">
                  <MapPin size={14} className="mr-1" /> {propertyLocation.name}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-md">
              {property.name}
            </h1>
            
            <p className="text-lg mb-2 drop-shadow-sm">
              {property.address}
            </p>
            
            <div className="mt-4">
              <Button 
                onClick={() => setShowGallery(true)}
                className="bg-white/90 text-black hover:bg-white font-medium"
                size="sm"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                View Photos
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Info Tabs */}
      <section className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto">
            <button 
              className={`px-6 py-4 text-sm font-medium border-b-2 flex-1 text-center whitespace-nowrap
                ${activeTab === 'overview' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-orange-500'}`}
              onClick={() => scrollToSection('overview')}
            >
              Overview
            </button>
            {property.isMultifamily && (
              <button 
                className={`px-6 py-4 text-sm font-medium border-b-2 flex-1 text-center whitespace-nowrap
                  ${activeTab === 'units' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-orange-500'}`}
                onClick={() => scrollToSection('units')}
              >
                Units
              </button>
            )}
            {propertyLocation && (
              <button 
                className={`px-6 py-4 text-sm font-medium border-b-2 flex-1 text-center whitespace-nowrap
                  ${activeTab === 'neighborhood' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-orange-500'}`}
                onClick={() => scrollToSection('neighborhood')}
              >
                Neighborhood
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Property Details - Overview Section */}
      <div ref={overviewRef} className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200">About This Property</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">{property.description}</p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="text-xl font-bold mb-4">Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Property Type</p>
                    <p className="font-semibold capitalize">
                      {property.propertyType ? property.propertyType.replace('-', ' ') : 'Multi Family'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Year Built</p>
                    <p className="font-semibold">1930 (Renovated)</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Units</p>
                    <p className="font-semibold">{property.isMultifamily ? `${property.unitCount || 0} Units` : 'Single Family'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Status</p>
                    <p className="font-semibold text-green-600">{property.available ? 'Available' : 'Unavailable'}</p>
                  </div>
                </div>
              </div>
              
              {!property.isMultifamily && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Features & Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                    {featuresList.map((feature, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {property.isMultifamily ? (
                <div className="mb-4">
                  <div className="text-xl font-semibold text-gray-700 mb-1">Multiple Unit Options</div>
                  <div className="text-gray-500 mb-3">See unit details below</div>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-2"
                    onClick={() => scrollToSection('units')}
                  >
                    View Available Units
                  </Button>
                </div>
              ) : property.rent ? (
                <div className="mb-4">
                  <div className="text-3xl font-bold text-orange-500 mb-1">${property.rent}</div>
                  <div className="text-gray-500 mb-3">per month</div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-2">
                    Schedule a Tour
                  </Button>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-xl font-semibold text-gray-700 mb-1">Contact for Pricing</div>
                  <div className="text-gray-500 mb-3">Pricing details available on request</div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-2">
                    Request Information
                  </Button>
                </div>
              )}
              
              <div className="space-y-4 mb-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold">
                    {property.available ? 
                      <span className="text-green-600">Available Now</span> : 
                      <span className="text-red-600">Unavailable</span>
                    }
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-gray-500">Property Type</span>
                  <span className="font-semibold capitalize">
                    {property.propertyType ? property.propertyType.replace('-', ' ') : 'Multi Family'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="text-gray-500">Year Built</span>
                  <span className="font-semibold">1930 (Renovated)</span>
                </div>
              </div>
            </div>

            {/* Image Gallery Card */}
            {!property.isMultifamily && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img 
                    src={featuredImage} 
                    alt={property.name} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">Photo Gallery</h3>
                  <p className="text-gray-500 mb-3">View all {galleryImages.length} photos of this property</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                    onClick={() => setShowGallery(true)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    View All Photos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Display available units if this is a multifamily property */}
      {property.isMultifamily && (
        <div ref={unitsRef} className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">Available Units</h2>
              <p className="text-gray-700 mb-6">
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
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">No Units Available</h3>
                <p className="text-gray-600">Check back soon for new availability.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertyUnits.map((unit) => (
                  <UnitCard 
                    key={unit.id}
                    unit={unit}
                    unitImages={unitImagesMap[unit.id] || []}
                    onShowGallery={() => setSelectedUnitId(unit.id)}
                    onRequestInfo={() => {}}
                    onScheduleTour={() => {}}
                  />
                ))}
              </div>
            )}
            
            {propertyUnits.length > 0 && (
              <div className="mt-10 text-center">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Contact Agent for More Information
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Neighborhood Section */}
      {propertyLocation && (
        <div ref={neighborhoodRef} className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">Discover {propertyLocation.name}</h2>
              <p className="text-gray-700 mb-6">
                This property is located in {propertyLocation.name}, a desirable area known for its charm and amenities.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <NeighborhoodSection 
                locationSlug={propertyLocation.slug} 
                locationName={propertyLocation.name} 
              />
            </div>
          </div>
        </div>
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