import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { getLocationBySlug, getPropertiesByLocation } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Property } from "@shared/schema";
import { MapIcon, Building, Bike, ParkingCircle, Utensils, Library } from "lucide-react";

interface LocationPageProps {
  location: string;
}

// Location-specific hotspots data
const locationHotspots = {
  "virginia-highland": [
    {
      name: "Ponce City Market",
      description: "Historic marketplace with dining, shopping, and entertainment.",
      distance: "1.2 miles from neighborhood center",
      imageUrl: "https://i.imgur.com/1zBCVnO.jpg",
      link: "http://poncecitymarket.com"
    },
    {
      name: "Virginia highland Shopping District",
      description: "Boutique shopping and local businesses in a charming setting.",
      distance: "In the heart of the neighborhood",
      imageUrl: "https://i.imgur.com/mmnSr5n.jpg",
      link: "https://www.virginiahighlanddistrict.com"
    },
    {
      name: "Piedmont Park",
      description: "Atlanta's premier green space with walking trails and events.",
      distance: "0.8 miles from neighborhood center",
      imageUrl: "https://i.imgur.com/toEfT5z.jpg",
      link: "https://piedmontpark.org"
    },
    {
      name: "BeltLine Eastside Trail",
      description: "A vibrant trail for walking, biking, and exploring Atlanta's art and culture.",
      distance: "0.5 miles from neighborhood center",
      imageUrl: "https://i.imgur.com/JCWiLYZ.jpg",
      link: "https://beltline.org/visit/"
    },
    {
      name: "The Carter Center",
      description: "A museum and library dedicated to the life and work of President Jimmy Carter.",
      distance: "1.5 miles from neighborhood center",
      imageUrl: "https://i.imgur.com/F3t727G.jpg",
      link: "https://www.cartercenter.org"
    }
  ],
  "midtown": [
    {
      name: "High Museum of Art",
      description: "Southeast's premier art museum featuring classic and contemporary exhibitions.",
      distance: "0.4 miles from center",
      imageUrl: "https://i.imgur.com/sdHC6Hr.jpg",
      link: "https://high.org"
    },
    {
      name: "Piedmont Park",
      description: "Atlanta's central park offering green spaces, recreational facilities, and city views.",
      distance: "0.2 miles from center",
      imageUrl: "https://i.imgur.com/bAy8idc.jpg",
      link: "https://piedmontpark.org"
    },
    {
      name: "Atlanta Botanical Garden",
      description: "Urban oasis featuring stunning plant collections and seasonal exhibitions.",
      distance: "0.5 miles from center",
      imageUrl: "https://i.imgur.com/xq6r9MA.jpg",
      link: "https://atlantabg.org"
    },
    {
      name: "Fox Theatre",
      description: "Historic venue hosting Broadway shows, concerts, and cultural performances.",
      distance: "0.8 miles from center",
      imageUrl: "https://i.imgur.com/Hxs8rIi.jpg",
      link: "https://foxtheatre.org"
    },
    {
      name: "Colony Square",
      description: "Mixed-use development featuring dining, retail, and entertainment options.",
      distance: "0.6 miles from center",
      imageUrl: "https://i.imgur.com/SqPtiqU.jpg",
      link: "https://colonysquare.com"
    },
    {
      name: "Georgia Institute of Technology",
      description: "World-renowned research university known for innovation and engineering excellence.",
      distance: "1.0 mile from center",
      imageUrl: "https://i.imgur.com/MauN8ck.png",
      link: "https://www.gatech.edu"
    }
  ],
  "dallas": [
    {
      name: "White Rock Lake",
      description: "Urban oasis featuring a 9.3-mile trail, water activities, and stunning skyline views.",
      distance: "1.2 miles from center",
      imageUrl: "https://i.imgur.com/GkYyI2f.jpg",
      link: "https://www.dallasparks.org/235/White-Rock-Lake-Park"
    },
    {
      name: "Deep Ellum",
      description: "Historic entertainment district known for live music, street art, and eclectic dining.",
      distance: "3.5 miles from center",
      imageUrl: "https://i.imgur.com/vSWSMob.jpg",
      link: "https://deepellumtexas.com"
    },
    {
      name: "George W. Bush Presidential Library",
      description: "Presidential museum and research center on SMU's campus showcasing American history.",
      distance: "1.8 miles from center",
      imageUrl: "https://i.imgur.com/UaLvmd3.png",
      link: "https://www.georgewbushlibrary.gov"
    },
    {
      name: "Klyde Warren Park",
      description: "Urban green space built over a freeway, featuring food trucks, events, and community activities.",
      distance: "4.2 miles from center",
      imageUrl: "https://i.imgur.com/HhD5VJM.jpg",
      link: "https://www.klydewarrenpark.org"
    },
    {
      name: "Dallas Museum of Art",
      description: "World-class art museum in the heart of the Arts District with free general admission.",
      distance: "4.0 miles from center",
      imageUrl: "https://i.imgur.com/RHoRAju.jpg",
      link: "https://dma.org"
    }
  ]
};

// Location descriptions
const locationDescriptions = {
  "virginia-highland": "The vibrant Virginia Highland neighborhood offers a perfect blend of historic charm and modern amenities. Ideal for those who want to live in one of Atlanta's most sought-after areas, with easy access to dining, shopping, and entertainment.",
  "midtown": "Midtown Atlanta is the heart of the city's arts and culture scene, offering a perfect blend of urban sophistication and creative energy. With its walkable streets, world-class cultural venues, and innovative dining scene, Midtown represents Atlanta's dynamic future while honoring its rich cultural heritage.",
  "dallas": "Dallas combines Southern charm with modern urban sophistication, offering residents a dynamic mix of cultural attractions, outdoor spaces, and entertainment districts. From serene lakes to vibrant arts scenes, Dallas provides an exceptional quality of life with amenities for every lifestyle."
};

// Maps for each location
const locationMaps = {
  "virginia-highland": "https://www.google.com/maps/d/u/0/embed?mid=1mLjD6MgRd5Cq3tRresLx63wYe01d600&ehbc=2E312F&noprof=1",
  "midtown": "https://www.google.com/maps/d/u/0/embed?mid=1XLv06Buip8bENLqmPSeiPE9ehpdzfQY&ehbc=2E312F&noprof=1",
  "dallas": "https://www.google.com/maps/d/u/0/embed?mid=1v6kgd00ViRSvEjteA1vY0_iVvggVB_0&ehbc=2E312F&noprof=1"
};



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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  // Get custom data for this location
  const locationHotspot = locationHotspots[location as keyof typeof locationHotspots] || [];
  const locationDescription = locationDescriptions[location as keyof typeof locationDescriptions] || "";
  const mapUrl = locationMaps[location as keyof typeof locationMaps] || "";

  return (
    <>
      {/* Location Hero Section */}
      <div 
        className="relative py-32 bg-cover bg-center" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${locationData.imageUrl})` 
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="font-heading font-bold text-5xl mb-6">{locationData.name}</h1>
          <p className="text-xl max-w-3xl mx-auto">{locationData.description}</p>
        </div>
      </div>

      {/* Property Listings Section */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">Our {locationData.name} Properties</h2>
          
          {properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property: Property) => (
                <Card key={property.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow group">
                  <div className="relative h-64">
                    <img 
                      src={property.imageUrl} 
                      alt={property.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-heading font-bold text-xl mb-2">{property.name}</h3>
                    <p className="text-slate-600 mb-4 line-clamp-3">{property.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center text-slate-700">
                        <Building className="h-4 w-4 mr-2 text-primary" />
                        <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                      </div>
                      <div className="flex items-center text-slate-700">
                        <ParkingCircle className="h-4 w-4 mr-2 text-primary" />
                        <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                      </div>
                      <div className="flex items-center text-slate-700">
                        <MapIcon className="h-4 w-4 mr-2 text-primary" />
                        <span>{property.sqft} sq ft</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-semibold">${property.rent}/month</div>
                      <Link to={`/properties/${property.id}`} className="text-primary font-medium inline-flex items-center group-hover:underline">
                        View Property
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600">
              No properties available in this location at the moment. Please check back soon!
            </p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-3xl text-white mb-6">Ready to Live in {locationData.name}?</h2>
          <Button size="lg" className="bg-white text-primary hover:bg-slate-100" asChild>
            <Link to="/apartment-finder">Apartment Finder</Link>
          </Button>
        </div>
      </section>

      {/* Explore Location Section */}
      {locationHotspot.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-bold text-3xl text-center mb-4">Explore {locationData.name}</h2>
            <p className="text-center text-slate-600 max-w-4xl mx-auto mb-12">
              {locationDescription}
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Map Column */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-[600px]">
                <iframe 
                  src={mapUrl}
                  style={{ border: 0 }}
                  className="w-full h-full"
                  title={`${locationData.name} Properties Map`}
                  loading="lazy"
                ></iframe>
              </div>

              {/* Hotspots Column */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 overflow-y-auto max-h-[600px]">
                  {locationHotspot.map((spot, index) => (
                    <a 
                      key={index} 
                      href={spot.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex gap-4 p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                        <img src={spot.imageUrl} alt={spot.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-lg mb-1">{spot.name}</h3>
                        <p className="text-slate-600 text-sm mb-2">{spot.description}</p>
                        <span className="text-xs text-slate-500">{spot.distance}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default LocationPage;
