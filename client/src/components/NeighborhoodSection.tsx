import { useQuery } from "@tanstack/react-query";
import { Neighborhood } from "@shared/schema";
import { getNeighborhoodByLocation } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapIcon, UtensilsIcon, TrainIcon, School, PalmtreeIcon, LandmarkIcon, Building2Icon } from "lucide-react";
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
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl text-center mb-4">Discover {locationName}</h2>
        <p className="text-center text-slate-600 max-w-4xl mx-auto mb-12">
          {neighborhood.highlights}
        </p>

        {neighborhood.mapImageUrl && (
          <div className="mb-12 shadow-md rounded-lg overflow-hidden">
            <img 
              src={neighborhood.mapImageUrl} 
              alt={`Map of ${locationName}`} 
              className="w-full h-auto"
            />
          </div>
        )}

        <Tabs defaultValue="attractions" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto">
            <TabsTrigger value="attractions" className="flex flex-col items-center py-3">
              <LandmarkIcon className="h-5 w-5 mb-1" />
              <span>Attractions</span>
            </TabsTrigger>
            <TabsTrigger value="transportation" className="flex flex-col items-center py-3">
              <TrainIcon className="h-5 w-5 mb-1" />
              <span>Transportation</span>
            </TabsTrigger>
            <TabsTrigger value="dining" className="flex flex-col items-center py-3">
              <UtensilsIcon className="h-5 w-5 mb-1" />
              <span>Dining</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex flex-col items-center py-3">
              <School className="h-5 w-5 mb-1" />
              <span>Education</span>
            </TabsTrigger>
            <TabsTrigger value="parks" className="flex flex-col items-center py-3">
              <PalmtreeIcon className="h-5 w-5 mb-1" />
              <span>Parks & Rec</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col items-center py-3">
              <Building2Icon className="h-5 w-5 mb-1" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attractions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LandmarkIcon className="h-5 w-5 mr-2" />
                  Popular Attractions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {neighborhood.attractions}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transportation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrainIcon className="h-5 w-5 mr-2" />
                  Transportation & Accessibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {neighborhood.transportationInfo}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dining" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UtensilsIcon className="h-5 w-5 mr-2" />
                  Dining & Entertainment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {neighborhood.diningOptions}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schools" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  Schools & Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {neighborhood.schoolsInfo}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="parks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PalmtreeIcon className="h-5 w-5 mr-2" />
                  Parks & Recreation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {neighborhood.parksAndRecreation}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2Icon className="h-5 w-5 mr-2" />
                  Historical Background
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {neighborhood.historicalInfo}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default NeighborhoodSection;