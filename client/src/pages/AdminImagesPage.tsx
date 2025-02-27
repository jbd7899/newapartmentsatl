import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProperties, getPropertyImages, getPropertyImagesByProperty, createPropertyImage, updatePropertyImageOrder, updatePropertyImageFeatured, deletePropertyImage } from "@/lib/data";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Property, PropertyImage } from "@shared/schema";
import { getImageUrl } from "@/lib/image-utils";

// External URL Input Form component
const ExternalUrlForm = ({ onUpload, properties }: { onUpload: (data: any) => void, properties: Property[] }) => {
  const [propertyId, setPropertyId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [alt, setAlt] = useState("");
  const { toast } = useToast();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyId) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      toast({
        title: "Error",
        description: "Please enter a valid image URL (must start with http)",
        variant: "destructive",
      });
      return;
    }
    
    // Upload the image URL
    onUpload({
      propertyId: parseInt(propertyId),
      alt: alt || `Property Image`,
      url: imageUrl,
      displayOrder: 0,
      isFeatured: true // Mark as featured by default
    });
    
    // Reset form
    setImageUrl("");
    setAlt("");
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="property">Property</Label>
        <select 
          id="property"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="">Select a property</option>
          {properties.map((property: Property) => (
            <option key={property.id} value={property.id}>{property.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid w-full gap-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">Enter an external image URL (must start with http)</p>
      </div>
      
      <div className="grid w-full gap-1.5">
        <Label htmlFor="alt">Alt Text</Label>
        <Input
          id="alt"
          placeholder="Description of image"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">Description for accessibility</p>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Add External Image
        </Button>
      </div>
    </form>
  );
};

const AdminImagesPage = () => {
  const [selectedTab, setSelectedTab] = useState("property");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });
  
  // Get all property images
  const { data: images = [], isLoading: isLoadingImages } = useQuery({
    queryKey: ['/api/property-images'],
    queryFn: async () => {
      const response = await getPropertyImages();
      return response.data;
    },
  });
  
  // Mutation for creating property images
  const { mutate: createImage, isPending: isCreatingImage } = useMutation({
    mutationFn: createPropertyImage,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      
      // Also invalidate specific property images
      for (const property of properties) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'images'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add image. " + error.toString(),
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a property image
  const { mutate: deleteImage, isPending: isDeletingImage } = useMutation({
    mutationFn: deletePropertyImage,
    onSuccess: (_, id) => {
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      
      // Also invalidate specific property images
      for (const property of properties) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'images'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete image. " + error.toString(),
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating image order
  const { mutate: updateOrder, isPending: isUpdatingOrder } = useMutation({
    mutationFn: (params: { id: number, displayOrder: number }) => 
      updatePropertyImageOrder(params.id, params.displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      
      // Also invalidate specific property images
      for (const property of properties) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'images'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update image order. " + error.toString(),
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating featured status
  const { mutate: updateFeatured, isPending: isUpdatingFeatured } = useMutation({
    mutationFn: (params: { id: number, isFeatured: boolean }) => 
      updatePropertyImageFeatured(params.id, params.isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      
      // Also invalidate specific property images
      for (const property of properties) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'images'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update featured status. " + error.toString(),
        variant: "destructive",
      });
    }
  });
  
  // Filter images based on the selected filter
  const filteredImages = useMemo(() => {
    let filtered = [...images];
    
    if (selectedFilter === "featured") {
      filtered = images.filter((img: PropertyImage) => img.isFeatured);
    }
    
    if (selectedFilter.startsWith("property-")) {
      const propId = selectedFilter.split("property-")[1];
      filtered = filtered.filter((img: PropertyImage) => {
        return img.propertyId === parseInt(propId);
      });
    }
    
    return filtered;
  }, [images, selectedFilter]);
  
  // Group images by property for display
  const groupedImages = useMemo(() => {
    const grouped: Record<number, PropertyImage[]> = {};
    
    filteredImages.forEach((image: PropertyImage) => {
      const propId = image.propertyId;
      if (!grouped[propId]) {
        grouped[propId] = [];
      }
      grouped[propId].push(image);
    });
    
    // Sort images by display order
    Object.keys(grouped).forEach((propId) => {
      grouped[Number(propId)].sort((a: PropertyImage, b: PropertyImage) => a.displayOrder - b.displayOrder);
    });
    
    return grouped;
  }, [filteredImages]);
  
  // Handle image reordering
  const handleMoveImage = (image: PropertyImage, direction: 'up' | 'down') => {
    const propertyImages = filteredImages.filter((img: PropertyImage) => img.propertyId === image.propertyId)
      .sort((a: PropertyImage, b: PropertyImage) => a.displayOrder - b.displayOrder);
    
    const currentIndex = propertyImages.findIndex((img: PropertyImage) => img.id === image.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevImage = propertyImages[currentIndex - 1];
      updateOrder({ id: image.id, displayOrder: prevImage.displayOrder });
      updateOrder({ id: prevImage.id, displayOrder: image.displayOrder });
    } else if (direction === 'down' && currentIndex < propertyImages.length - 1) {
      const nextImage = propertyImages[currentIndex + 1];
      updateOrder({ id: image.id, displayOrder: nextImage.displayOrder });
      updateOrder({ id: nextImage.id, displayOrder: image.displayOrder });
    }
  };
  
  // Handle setting an image as featured
  const handleToggleFeatured = (image: PropertyImage) => {
    updateFeatured({ 
      id: image.id, 
      isFeatured: !image.isFeatured
    });
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Property Images</h1>
        
        <Tabs defaultValue="view" className="mb-8">
          <TabsList>
            <TabsTrigger value="view">View Images</TabsTrigger>
            <TabsTrigger value="add">Add External Images</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>View and manage property images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Filter Images</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={selectedFilter === "all" ? "default" : "outline"}
                      onClick={() => setSelectedFilter("all")}
                      size="sm"
                    >
                      All Images
                    </Button>
                    <Button 
                      variant={selectedFilter === "featured" ? "default" : "outline"}
                      onClick={() => setSelectedFilter("featured")}
                      size="sm"
                    >
                      Featured Only
                    </Button>
                    {properties.map((property: Property) => (
                      <Button 
                        key={property.id}
                        variant={selectedFilter === `property-${property.id}` ? "default" : "outline"}
                        onClick={() => setSelectedFilter(`property-${property.id}`)}
                        size="sm"
                      >
                        {property.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {isLoadingImages ? (
                  <div>Loading images...</div>
                ) : filteredImages.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No images found</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedFilter !== "all" 
                        ? "Try changing your filter selection" 
                        : "Add some images using the 'Add External Images' tab"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.keys(groupedImages).map((propertyId) => {
                      const property = properties.find(p => p.id === parseInt(propertyId));
                      return (
                        <div key={propertyId} className="border rounded-lg p-4">
                          <h3 className="text-lg font-bold mb-4">{property?.name || `Property ID: ${propertyId}`}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {groupedImages[parseInt(propertyId)].map((image: PropertyImage) => (
                              <div key={image.id} className="border rounded-lg overflow-hidden">
                                <div className="relative aspect-video bg-muted">
                                  <img 
                                    src={getImageUrl(image.url)} 
                                    alt={image.alt || "Property image"}
                                    className="object-cover w-full h-full"
                                  />
                                  {image.isFeatured && (
                                    <div className="absolute top-2 left-2">
                                      <Badge variant="default" className="bg-yellow-500">
                                        <Star className="h-3 w-3 mr-1" /> Featured
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-3">
                                  <div className="text-sm text-muted-foreground mb-2 truncate">
                                    {image.alt || "No description"}
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <div className="flex space-x-1">
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleMoveImage(image, 'up')}
                                        disabled={isUpdatingOrder}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => handleMoveImage(image, 'down')}
                                        disabled={isUpdatingOrder}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant={image.isFeatured ? "default" : "outline"} 
                                        size="icon"
                                        onClick={() => handleToggleFeatured(image)}
                                        disabled={isUpdatingFeatured}
                                      >
                                        <Star className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    <Button 
                                      variant="destructive" 
                                      size="icon"
                                      onClick={() => {
                                        if (window.confirm("Are you sure you want to delete this image?")) {
                                          deleteImage(image.id);
                                        }
                                      }}
                                      disabled={isDeletingImage}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add External Images</CardTitle>
                <CardDescription>Add images from external URLs to your properties</CardDescription>
              </CardHeader>
              <CardContent>
                <ExternalUrlForm 
                  onUpload={(data) => createImage(data)}
                  properties={properties}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminImagesPage;