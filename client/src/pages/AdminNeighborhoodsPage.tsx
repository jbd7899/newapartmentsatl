import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLocations, getNeighborhoodByLocation, updateNeighborhood, createNeighborhood } from "@/lib/data";
import AdminLayout from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LandmarkIcon, UtensilsIcon, TrainIcon, School, PalmtreeIcon, Building2Icon, AlertCircle, Loader2, MapPinIcon, CompassIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Location, Neighborhood, insertNeighborhoodSchema } from "@shared/schema";

const AdminNeighborhoodsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTab, setActiveTab] = useState<string>("explore");

  // Create a schema for the form validation
  const formSchema = z.object({
    highlights: z.string().optional().nullable(),
    attractions: z.string().optional().nullable(),
    transportationInfo: z.string().optional().nullable(),
    diningOptions: z.string().optional().nullable(), 
    schoolsInfo: z.string().optional().nullable(),
    parksAndRecreation: z.string().optional().nullable(),
    historicalInfo: z.string().optional().nullable(),
    // Explore section fields
    exploreDescription: z.string().optional().nullable(),
    exploreMapUrl: z.string().optional().nullable(),
    exploreHotspots: z.string().optional().nullable(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Fetch all locations
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations,
  });

  // Fetch neighborhood data when a location is selected
  const { 
    data: neighborhood, 
    isLoading: isLoadingNeighborhood,
    error: neighborhoodError,
    isError: isNeighborhoodError,
  } = useQuery({
    queryKey: ['/api/locations', selectedLocation?.slug, 'neighborhood'],
    queryFn: () => selectedLocation ? getNeighborhoodByLocation(selectedLocation.slug) : null,
    enabled: !!selectedLocation,
  });

  // Form handling with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      highlights: '',
      attractions: '',
      transportationInfo: '',
      diningOptions: '',
      schoolsInfo: '',
      parksAndRecreation: '',
      historicalInfo: '',
      exploreDescription: '',
      exploreMapUrl: '',
      exploreHotspots: '',
    },
  });

  // Update form values when neighborhood data changes
  useEffect(() => {
    if (neighborhood) {
      form.reset({
        highlights: neighborhood.highlights || '',
        attractions: neighborhood.attractions || '',
        transportationInfo: neighborhood.transportationInfo || '',
        diningOptions: neighborhood.diningOptions || '',
        schoolsInfo: neighborhood.schoolsInfo || '',
        parksAndRecreation: neighborhood.parksAndRecreation || '',
        historicalInfo: neighborhood.historicalInfo || '',
        exploreDescription: neighborhood.exploreDescription || '',
        exploreMapUrl: neighborhood.exploreMapUrl || '',
        exploreHotspots: neighborhood.exploreHotspots || '',
      });
    } else if (selectedLocation) {
      // Reset form when no neighborhood data
      form.reset({
        highlights: '',
        attractions: '',
        transportationInfo: '',
        diningOptions: '',
        schoolsInfo: '',
        parksAndRecreation: '',
        historicalInfo: '',
        exploreDescription: '',
        exploreMapUrl: '',
        exploreHotspots: '',
      });
    }
  }, [neighborhood, selectedLocation, form]);

  // Create neighborhood mutation
  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!selectedLocation) throw new Error("No location selected");
      return createNeighborhood(selectedLocation.slug, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Neighborhood information created successfully",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/locations', selectedLocation?.slug, 'neighborhood'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create neighborhood information",
        variant: "destructive",
      });
      console.error("Error creating neighborhood:", error);
    },
  });

  // Update neighborhood mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!selectedLocation) throw new Error("No location selected");
      return updateNeighborhood(selectedLocation.slug, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Neighborhood information updated successfully",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/locations', selectedLocation?.slug, 'neighborhood'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update neighborhood information",
        variant: "destructive",
      });
      console.error("Error updating neighborhood:", error);
    },
  });

  const onSubmit = (data: FormValues) => {
    // Clean up empty strings to null for the database
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key as keyof FormValues] = value === '' ? null : value;
      return acc;
    }, {} as FormValues);

    if (neighborhood) {
      // Update existing neighborhood
      updateMutation.mutate(cleanData);
    } else {
      // Create new neighborhood
      createMutation.mutate(cleanData);
    }
  };

  // Helper function to get tab icon
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "highlights": return null;
      case "attractions": return <LandmarkIcon className="h-4 w-4 mr-2" />;
      case "transportation": return <TrainIcon className="h-4 w-4 mr-2" />;
      case "dining": return <UtensilsIcon className="h-4 w-4 mr-2" />;
      case "schools": return <School className="h-4 w-4 mr-2" />;
      case "parks": return <PalmtreeIcon className="h-4 w-4 mr-2" />;
      case "history": return <Building2Icon className="h-4 w-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Neighborhood Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {locations.map((location: Location) => (
                    <Button
                      key={location.id}
                      variant={selectedLocation?.id === location.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedLocation(location)}
                    >
                      {location.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            {!selectedLocation ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <LandmarkIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <h2 className="text-xl font-medium mb-2">No Location Selected</h2>
                    <p className="text-gray-500 text-center max-w-md mb-4">
                      Please select a location from the sidebar to manage its neighborhood information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : isLoadingNeighborhood ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                    <p>Loading neighborhood information...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Editing: {selectedLocation.name}</span>
                    {isNeighborhoodError ? (
                      <Badge variant="outline" className="text-amber-500 border-amber-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No Data (Create New)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Editing Existing
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full h-auto">
                          <TabsTrigger value="explore" className="flex items-center">
                            <CompassIcon className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">Explore</span>
                            <span className="md:hidden">Expl.</span>
                          </TabsTrigger>
                          <TabsTrigger value="highlights">Highlights</TabsTrigger>
                          <TabsTrigger value="attractions" className="flex items-center">
                            <LandmarkIcon className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">Attractions</span>
                            <span className="md:hidden">Attr.</span>
                          </TabsTrigger>
                          <TabsTrigger value="transportation" className="flex items-center">
                            <TrainIcon className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">Transport</span>
                            <span className="md:hidden">Trans.</span>
                          </TabsTrigger>
                          <TabsTrigger value="dining" className="flex items-center">
                            <UtensilsIcon className="h-4 w-4 mr-1" />
                            <span>Dining</span>
                          </TabsTrigger>
                          <TabsTrigger value="schools" className="flex items-center">
                            <School className="h-4 w-4 mr-1" />
                            <span>Schools</span>
                          </TabsTrigger>
                          <TabsTrigger value="parks" className="flex items-center">
                            <PalmtreeIcon className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">Parks & Rec</span>
                            <span className="md:hidden">Parks</span>
                          </TabsTrigger>
                          <TabsTrigger value="history" className="flex items-center">
                            <Building2Icon className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">History</span>
                            <span className="md:hidden">Hist.</span>
                          </TabsTrigger>
                        </TabsList>
                        
                        {/* Highlights Tab */}
                        <TabsContent value="highlights" className="pt-4">
                          <FormField
                            control={form.control}
                            name="highlights"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Neighborhood Highlights</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter a brief overview of the neighborhood..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* Attractions Tab */}
                        <TabsContent value="attractions" className="pt-4">
                          <FormField
                            control={form.control}
                            name="attractions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attractions & Points of Interest</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe popular attractions, landmarks, and points of interest..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* Transportation Tab */}
                        <TabsContent value="transportation" className="pt-4">
                          <FormField
                            control={form.control}
                            name="transportationInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Transportation & Accessibility</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe public transit options, walkability, bike lanes, major highways, etc..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* Dining Tab */}
                        <TabsContent value="dining" className="pt-4">
                          <FormField
                            control={form.control}
                            name="diningOptions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dining & Entertainment</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe restaurants, cafes, bars, nightlife, and entertainment options..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* Schools Tab */}
                        <TabsContent value="schools" className="pt-4">
                          <FormField
                            control={form.control}
                            name="schoolsInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Schools & Education</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="List schools, educational institutions, and learning resources in the area..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* Parks Tab */}
                        <TabsContent value="parks" className="pt-4">
                          <FormField
                            control={form.control}
                            name="parksAndRecreation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parks & Recreation</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe parks, green spaces, sports facilities, and recreational activities..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* History Tab */}
                        <TabsContent value="history" className="pt-4">
                          <FormField
                            control={form.control}
                            name="historicalInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Historical Background</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the neighborhood's history, notable events, and historical significance..."
                                    className="min-h-32"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>

                        {/* Explore Tab */}
                        <TabsContent value="explore" className="pt-4">
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="exploreDescription"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Neighborhood Explorer Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter an engaging description for the neighborhood explorer section..."
                                      className="min-h-24"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="exploreMapUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Interactive Map URL</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter URL for an interactive map (e.g., Google Maps embed URL)..."
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs">
                                    Use a Google Maps embed URL or similar interactive map service
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="exploreHotspots"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Neighborhood Hotspots</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder={`Enter hotspots in JSON format, for example:
[
  {
    "name": "Central Park",
    "description": "Urban oasis with trails and lake",
    "distance": "0.5 miles from center",
    "imageUrl": "https://example.com/image.jpg",
    "link": "https://park-website.com"
  },
  {
    "name": "Art Museum",
    "description": "Contemporary art museum with rotating exhibits",
    "distance": "1.2 miles from center",
    "imageUrl": "https://example.com/museum.jpg",
    "link": "https://museum-website.com"
  }
]`}
                                      className="min-h-64 font-mono text-sm"
                                      {...field}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs">
                                    Enter hotspots as a JSON array with name, description, distance, imageUrl, and link properties
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {form.watch("exploreMapUrl") && (
                              <div className="mt-4 border rounded-md overflow-hidden">
                                <p className="p-2 text-sm bg-muted">Map Preview:</p>
                                <iframe 
                                  src={form.watch("exploreMapUrl") || ''} 
                                  className="w-full h-64 border-0"
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  title="Neighborhood Map"
                                ></iframe>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          disabled={
                            createMutation.isPending || 
                            updateMutation.isPending || 
                            isLoadingNeighborhood
                          }
                          className="min-w-32"
                        >
                          {(createMutation.isPending || updateMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isNeighborhoodError ? 'Create' : 'Update'} Neighborhood
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNeighborhoodsPage;