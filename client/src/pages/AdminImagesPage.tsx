import { useState, useCallback, useMemo, useRef } from "react";
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
  UploadCloud, 
  FileImage, 
  RefreshCw, 
  Trash2,
  Check,
  X,
  Star,
  ArrowUp,
  ArrowDown,
  Plus,
  Image as ImageIcon,
  FolderOpen,
  FilePlus2,
  ImagePlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Property, PropertyImage } from "@shared/schema";

// File Upload Form component
const FileUploadForm = ({ onUpload, properties }: { onUpload: (data: any) => void, properties: Property[] }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [alt, setAlt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);
  
  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  // Process the selected files
  const handleFiles = (selectedFiles: File[]) => {
    // Filter for image files only
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select image files only (jpg, png, gif, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "Error",
        description: `${oversizedFiles.length} file(s) exceed the maximum size of 10MB`,
        variant: "destructive",
      });
      
      // Continue with files that are within size limit
      const validFiles = imageFiles.filter(file => file.size <= MAX_FILE_SIZE);
      if (validFiles.length === 0) return;
      
      // Add the valid files to the existing files
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Generate previews for the images
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } else {
      // All files are valid, add them to the existing files
      setFiles(prevFiles => [...prevFiles, ...imageFiles]);
      
      // Generate previews for the images
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  // Remove an image from the upload list
  const removeImage = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };
  
  // Handle property selection
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPropertyId = e.target.value;
    setPropertyId(selectedPropertyId);
    
    // Set default alt text based on property name
    if (selectedPropertyId && !alt) {
      const propertyName = properties.find(
        (p) => p.id.toString() === selectedPropertyId
      )?.name;
      if (propertyName) {
        setAlt(`Image of ${propertyName}`);
      }
    }
  };
  
  // Convert files to URLs and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one image",
        variant: "destructive",
      });
      return;
    }
    
    if (!propertyId) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // We need to convert the File objects to URLs that can be stored
      // In a real app, this would upload to a storage service, but we'll use data URLs here
      const imageUrls = previews;
      
      onUpload({
        imageUrls,
        propertyId,
        alt: alt || `Property images`
      });
      
      // Reset form after successful upload
      setFiles([]);
      setPreviews([]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process images",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-property">Property</Label>
        <select 
          id="file-property"
          value={propertyId}
          onChange={handlePropertyChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">-- Select Property --</option>
          {properties.map((property: Property) => (
            <option key={property.id} value={property.id.toString()}>
              {property.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file-alt">Image Description</Label>
        <Input 
          id="file-alt" 
          value={alt} 
          onChange={(e) => setAlt(e.target.value)} 
          placeholder="Description of the images"
          required 
        />
        <p className="text-xs text-gray-500">Provide a descriptive text for the images.</p>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <ImagePlus className="h-10 w-10 mx-auto mb-4 text-gray-400" />
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-medium">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-gray-400">
          PNG, JPG, GIF up to 10MB
        </p>
      </div>
      
      {previews.length > 0 && (
        <div className="space-y-4">
          <Label>Selected Images ({previews.length})</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="relative h-24 rounded-md overflow-hidden border">
                  <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <DialogFooter>
        <Button
          type="submit"
          className="flex items-center"
          disabled={isProcessing || files.length === 0}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload {files.length > 0 ? `${files.length} Images` : 'Images'}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

const AdminImagesPage = () => {
  const [activeTab, setActiveTab] = useState("gallery");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [viewImageDialog, setViewImageDialog] = useState<{open: boolean, image: PropertyImage | null}>({
    open: false, 
    image: null
  });
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch properties data
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });
  
  // Fetch property images data
  const { data: propertyImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/property-images'],
    queryFn: getPropertyImages,
  });
  
  // Fetch images for a specific property when selected
  const { data: selectedPropertyImages = [] } = useQuery({
    queryKey: ['/api/properties', selectedProperty, 'images'],
    queryFn: () => selectedProperty ? getPropertyImagesByProperty(selectedProperty) : Promise.resolve([]),
    enabled: !!selectedProperty,
  });
  
  // Create image mutation
  const createImageMutation = useMutation({
    mutationFn: createPropertyImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'images'] });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      setIsUploadDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  });
  
  // Update image order mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, displayOrder }: { id: number, displayOrder: number }) => 
      updatePropertyImageOrder(id, displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'images'] });
    },
  });
  
  // Toggle featured image mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: number, isFeatured: boolean }) => 
      updatePropertyImageFeatured(id, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'images'] });
      toast({
        title: "Success",
        description: "Featured image updated",
      });
    },
  });
  
  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: deletePropertyImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'images'] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  });

  // Filter images based on tab and search query
  const filteredImages = useMemo(() => {
    const images = selectedProperty ? selectedPropertyImages : propertyImages;
    
    let filtered = images;
    if (activeTab === "featured") {
      filtered = images.filter((img: PropertyImage) => img.isFeatured);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((img: PropertyImage) => {
        const property = properties.find(p => p.id === img.propertyId);
        const propertyName = property?.name?.toLowerCase() || '';
        return propertyName.includes(query) || img.alt.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [propertyImages, selectedPropertyImages, selectedProperty, activeTab, searchQuery, properties]);
  
  // Group images by property for organized display
  const imagesByProperty = useMemo(() => {
    const grouped: Record<number, PropertyImage[]> = {};
    
    filteredImages.forEach((image: PropertyImage) => {
      if (!grouped[image.propertyId]) {
        grouped[image.propertyId] = [];
      }
      grouped[image.propertyId].push(image);
    });
    
    // Sort images by display order within each property
    Object.keys(grouped).forEach(propId => {
      grouped[Number(propId)].sort((a: PropertyImage, b: PropertyImage) => a.displayOrder - b.displayOrder);
    });
    
    return grouped;
  }, [filteredImages]);
  
  const handleUploadImage = (formData: {
    imageUrls: string[];
    propertyId: string;
    alt: string;
  }) => {
    const propertyId = parseInt(formData.propertyId);
    if (isNaN(propertyId)) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return;
    }
    
    // Get highest order for this property's images
    const existingImages = propertyImages.filter(img => img.propertyId === propertyId);
    const highestOrder = existingImages.length > 0 
      ? Math.max(...existingImages.map(img => img.displayOrder))
      : -1;
    
    // Upload each image with incremental display order
    formData.imageUrls.forEach((url, index) => {
      createImageMutation.mutate({
        propertyId,
        url,
        alt: formData.alt || `Image of ${properties.find(p => p.id === propertyId)?.name}`,
        displayOrder: highestOrder + index + 1,
        isFeatured: existingImages.length === 0 && index === 0 // Make first image featured if no existing images
      });
    });
  };
  
  const handleMoveImage = (image: PropertyImage, direction: 'up' | 'down') => {
    const propertyImages = filteredImages.filter((img: PropertyImage) => img.propertyId === image.propertyId)
      .sort((a: PropertyImage, b: PropertyImage) => a.displayOrder - b.displayOrder);
    
    const currentIndex = propertyImages.findIndex((img: PropertyImage) => img.id === image.id);
    if (currentIndex === -1) return;
    
    let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (targetIndex < 0 || targetIndex >= propertyImages.length) return;
    
    const targetImage = propertyImages[targetIndex];
    
    // Swap display orders
    updateOrderMutation.mutate({ 
      id: image.id, 
      displayOrder: targetImage.displayOrder 
    });
    
    updateOrderMutation.mutate({ 
      id: targetImage.id, 
      displayOrder: image.displayOrder 
    });
  };
  
  const handleToggleFeatured = (image: PropertyImage) => {
    toggleFeaturedMutation.mutate({
      id: image.id,
      isFeatured: !image.isFeatured
    });
  };
  
  const handleDeleteImage = (id: number) => {
    if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      deleteImageMutation.mutate(id);
    }
  };
  
  const PropertyImageGrid = () => {
    return (
      <div className="space-y-8">
        {Object.keys(imagesByProperty).map(propertyIdString => {
          const propertyId = parseInt(propertyIdString);
          const property = properties.find(p => p.id === propertyId);
          const images = imagesByProperty[propertyId];
          
          return (
            <div key={propertyId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{property?.name || 'Unknown Property'}</h3>
                <Badge variant="outline" className="px-2">
                  {images.length} {images.length === 1 ? 'image' : 'images'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <img 
                        src={image.url} 
                        alt={image.alt} 
                        className="w-full h-full object-cover"
                        onClick={() => setViewImageDialog({ open: true, image })}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex flex-col gap-2 p-2">
                        <div className="flex items-center justify-center gap-2 flex-grow">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => setViewImageDialog({ open: true, image })}
                          >
                            <FileImage className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-1 w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`${image.isFeatured ? 'bg-yellow-100' : ''}`}
                            onClick={() => handleToggleFeatured(image)}
                            title={image.isFeatured ? "Unset as featured" : "Set as featured"}
                          >
                            <Star className={`h-4 w-4 ${image.isFeatured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleMoveImage(image, 'up')}
                            disabled={image.displayOrder === 0}
                            title="Move up in order"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleMoveImage(image, 'down')}
                            title="Move down in order"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewImageDialog({ open: true, image })}
                            title="View details"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {image.isFeatured && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          Featured
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="text-sm font-medium truncate">
                        {image.alt}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Order: {image.displayOrder}</span>
                        <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {Object.keys(imagesByProperty).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileImage className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No images found for the selected criteria</p>
          </div>
        )}
      </div>
    );
  };
  
  const MultipleUploadForm = ({ onUpload }: { onUpload: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      imageUrls: [""],
      propertyId: "",
      alt: ""
    });
    
    const handleChange = (field: string, value: string | string[]) => {
      setFormData({
        ...formData,
        [field]: value
      });
    };
    
    const handleUrlChange = (index: number, value: string) => {
      const newUrls = [...formData.imageUrls];
      newUrls[index] = value;
      handleChange("imageUrls", newUrls);
    };
    
    const addUrlField = () => {
      handleChange("imageUrls", [...formData.imageUrls, ""]);
    };
    
    const removeUrlField = (index: number) => {
      if (formData.imageUrls.length <= 1) return;
      const newUrls = formData.imageUrls.filter((_, i) => i !== index);
      handleChange("imageUrls", newUrls);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Filter out empty URLs
      const filteredData = {
        ...formData,
        imageUrls: formData.imageUrls.filter(url => url.trim() !== "")
      };
      
      if (filteredData.imageUrls.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one image URL",
          variant: "destructive",
        });
        return;
      }
      
      onUpload(filteredData);
    };
    
    const handlePropertyChange = (property: string) => {
      handleChange("propertyId", property);
      
      // Set default alt text based on property name
      if (property) {
        const propertyName = properties.find(p => p.id.toString() === property)?.name;
        if (propertyName && !formData.alt) {
          handleChange("alt", `Image of ${propertyName}`);
        }
      }
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="property">Property</Label>
          <select 
            id="property"
            value={formData.propertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">-- Select Property --</option>
            {properties.map((property: Property) => (
              <option key={property.id} value={property.id.toString()}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="alt">Image Description</Label>
          <Input 
            id="alt" 
            value={formData.alt} 
            onChange={(e) => handleChange("alt", e.target.value)} 
            placeholder="Description of the image"
            required 
          />
          <p className="text-xs text-gray-500">Provide a descriptive text for the image.</p>
        </div>
        
        <div className="space-y-2">
          <Label>Image URLs</Label>
          {formData.imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input 
                value={url} 
                onChange={(e) => handleUrlChange(index, e.target.value)} 
                placeholder="https://example.com/image.jpg"
                required 
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => removeUrlField(index)}
                disabled={formData.imageUrls.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addUrlField}
            className="w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Image URL
          </Button>
          <p className="text-xs text-gray-500">Enter URLs to existing images.</p>
        </div>
        
        <DialogFooter>
          <Button type="submit" className="flex items-center">
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload Images
          </Button>
        </DialogFooter>
      </form>
    );
  };
  
  if (propertiesLoading || imagesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading image data...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Property Image Gallery</h1>
          <p className="text-gray-500">Upload, organize, and manage all your property images</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Images</DialogTitle>
              <DialogDescription>
                Add multiple images to a property in one go.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="url" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL Upload</TabsTrigger>
                <TabsTrigger value="file">File Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="mt-4">
                <MultipleUploadForm onUpload={handleUploadImage} />
              </TabsContent>
              
              <TabsContent value="file" className="mt-4">
                <FileUploadForm onUpload={handleUploadImage} properties={properties} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Image Library</CardTitle>
              <CardDescription>
                Manage all your property images in one place
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <select 
                  value={selectedProperty ? selectedProperty.toString() : ""}
                  onChange={(e) => setSelectedProperty(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex h-10 min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Properties</option>
                  {properties.map((property: Property) => (
                    <option key={property.id} value={property.id.toString()}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <Input 
                  className="w-48" 
                  placeholder="Search images..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/property-images'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'images'] });
                }}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="gallery">
                All Images ({filteredImages.length})
              </TabsTrigger>
              <TabsTrigger value="featured">
                Featured Images ({filteredImages.filter((img: PropertyImage) => img.isFeatured).length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="gallery">
              <PropertyImageGrid />
            </TabsContent>
            
            <TabsContent value="featured">
              <PropertyImageGrid />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold">{propertyImages.length}</div>
                <div className="text-sm text-gray-500">Total Images</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {propertyImages.filter((img: PropertyImage) => img.isFeatured).length}
                </div>
                <div className="text-sm text-gray-500">Featured Images</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-500">
                  {Object.keys(
                    propertyImages.reduce((acc: Record<number, boolean>, img: PropertyImage) => {
                      acc[img.propertyId] = true;
                      return acc;
                    }, {} as Record<number, boolean>)
                  ).length}
                </div>
                <div className="text-sm text-gray-500">Properties with Images</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Image Viewer Dialog */}
      <Dialog open={viewImageDialog.open} onOpenChange={(open) => setViewImageDialog({ ...viewImageDialog, open })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewImageDialog.image && (
            <>
              <DialogHeader>
                <DialogTitle>Image Details</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative rounded-md overflow-hidden">
                  <img 
                    src={viewImageDialog.image.url} 
                    alt={viewImageDialog.image.alt}
                    className="w-full h-auto object-contain"
                  />
                  {viewImageDialog.image.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Property</h3>
                    <p className="mt-1 text-lg">
                      {properties.find(p => p.id === viewImageDialog.image?.propertyId)?.name || 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1">{viewImageDialog.image.alt}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Display Order</h3>
                    <p className="mt-1">{viewImageDialog.image.displayOrder}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Added on</h3>
                    <p className="mt-1">{new Date(viewImageDialog.image.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Image URL</h3>
                    <p className="mt-1 text-xs break-all">{viewImageDialog.image.url}</p>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-2">
                    <Button 
                      variant={viewImageDialog.image.isFeatured ? "default" : "outline"}
                      onClick={() => {
                        if (viewImageDialog.image) {
                          handleToggleFeatured(viewImageDialog.image);
                          setViewImageDialog({
                            ...viewImageDialog,
                            image: {
                              ...viewImageDialog.image,
                              isFeatured: !viewImageDialog.image.isFeatured
                            }
                          });
                        }
                      }}
                    >
                      <Star className={`h-4 w-4 mr-2 ${viewImageDialog.image.isFeatured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                      {viewImageDialog.image.isFeatured ? 'Unmark Featured' : 'Mark as Featured'}
                    </Button>
                    
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
                          deleteImageMutation.mutate(viewImageDialog.image?.id as number);
                          setViewImageDialog({ open: false, image: null });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Image
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminImagesPage;