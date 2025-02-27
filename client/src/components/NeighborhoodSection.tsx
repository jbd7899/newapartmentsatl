import { useQuery } from "@tanstack/react-query";
import { Neighborhood } from "@shared/schema";
import { getNeighborhoodByLocation } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapIcon, UtensilsIcon, TrainIcon, School, PalmtreeIcon, LandmarkIcon, Building2Icon, CompassIcon, ExternalLinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NeighborhoodSectionProps {
  locationSlug: string;
  locationName: string;
}

const NeighborhoodSection = ({ locationSlug, locationName }: NeighborhoodSectionProps) => {
  const { data: neighborhood, isLoading, error } = useQuery({
    queryKey: [`/api/locations/${locationSlug}/neighborhood`],
    queryFn: () => getNeighborhoodByLocation(locationSlug),
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="h-12 bg-gray-200 animate-pulse rounded-lg w-1/3 mx-auto mb-8"></div>
          <div className="h-8 bg-gray-200 animate-pulse rounded-lg w-2/3 mx-auto mb-12"></div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </section>
    );
  }

  if (error || !neighborhood) {
    return null; // Don't show section if there's an error or no data
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Discover {locationName}</h2>
        <p className="text-gray-600 max-w-4xl mb-8 leading-relaxed">
          {neighborhood.highlights}
        </p>

        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full h-auto bg-white rounded-lg p-1 shadow-sm border border-gray-100">
            <TabsTrigger value="explore" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <CompassIcon className="h-4 w-4" />
              <span>Explore</span>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <LandmarkIcon className="h-4 w-4" />
              <span>Attractions</span>
            </TabsTrigger>
            <TabsTrigger value="transportation" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <TrainIcon className="h-4 w-4" />
              <span>Transit</span>
            </TabsTrigger>
            <TabsTrigger value="dining" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <UtensilsIcon className="h-4 w-4" />
              <span>Dining</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <School className="h-4 w-4" />
              <span>Schools</span>
            </TabsTrigger>
            <TabsTrigger value="parks" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <PalmtreeIcon className="h-4 w-4" />
              <span>Parks</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-500 rounded-md">
              <Building2Icon className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attractions" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <LandmarkIcon className="h-5 w-5 mr-2" />
                Popular Attractions
              </h3>
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p className="whitespace-pre-line">
                  {neighborhood.attractions}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="transportation" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <TrainIcon className="h-5 w-5 mr-2" />
                Transportation & Accessibility
              </h3>
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p className="whitespace-pre-line">
                  {neighborhood.transportationInfo}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="dining" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <UtensilsIcon className="h-5 w-5 mr-2" />
                Dining & Entertainment
              </h3>
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p className="whitespace-pre-line">
                  {neighborhood.diningOptions}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schools" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <School className="h-5 w-5 mr-2" />
                Schools & Education
              </h3>
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p className="whitespace-pre-line">
                  {neighborhood.schoolsInfo}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="parks" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <PalmtreeIcon className="h-5 w-5 mr-2" />
                Parks & Recreation
              </h3>
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p className="whitespace-pre-line">
                  {neighborhood.parksAndRecreation}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <Building2Icon className="h-5 w-5 mr-2" />
                Historical Background
              </h3>
              <div className="text-gray-700 space-y-4 leading-relaxed">
                <p className="whitespace-pre-line">
                  {neighborhood.historicalInfo}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="explore" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-600">
                <CompassIcon className="h-5 w-5 mr-2" />
                Explore {locationName}
              </h3>
              
              {neighborhood.exploreDescription && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-3 text-gray-800">About the Area</h4>
                  <p className="whitespace-pre-line text-gray-600 leading-relaxed">
                    {neighborhood.exploreDescription}
                  </p>
                </div>
              )}
              
              {neighborhood.exploreMapUrl && (
                <div className="mb-10">
                  <h4 className="text-lg font-medium mb-3 text-gray-800">Interactive Map</h4>
                  <div className="rounded-lg overflow-hidden h-72 w-full shadow-sm border border-gray-100">
                    <iframe 
                      src={neighborhood.exploreMapUrl} 
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Interactive map of ${locationName}`}
                    ></iframe>
                  </div>
                </div>
              )}
              
              {neighborhood.exploreHotspots && (
                <div>
                  <h4 className="text-lg font-medium mb-4 text-gray-800">Local Hotspots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      try {
                        const hotspots = JSON.parse(neighborhood.exploreHotspots);
                        return hotspots.map((hotspot: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg overflow-hidden flex flex-col shadow-sm border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-md">
                            {hotspot.imageUrl && (
                              <div className="h-48 relative">
                                <img 
                                  src={hotspot.imageUrl}
                                  alt={hotspot.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x250?text=No+Image';
                                  }}
                                />
                              </div>
                            )}
                            <div className="p-4 flex-grow">
                              <h3 className="font-semibold text-lg text-gray-800 mb-1">{hotspot.name}</h3>
                              {hotspot.distance && (
                                <p className="text-xs text-orange-500 font-medium mb-2">{hotspot.distance}</p>
                              )}
                              <p className="text-sm text-gray-600 mb-3">{hotspot.description}</p>
                              {hotspot.link && (
                                <a 
                                  href={hotspot.link}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-orange-500 inline-flex items-center text-sm hover:underline"
                                >
                                  Visit website <ExternalLinkIcon className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </div>
                          </div>
                        ));
                      } catch (e) {
                        return (
                          <div className="col-span-3 text-gray-500 italic">
                            Unable to display hotspots information
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NeighborhoodSection;