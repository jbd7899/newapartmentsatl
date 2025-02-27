import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProperties, getPropertyImages, getPropertyImagesByProperty, createPropertyImage, updatePropertyImageOrder, updatePropertyImageFeatured, deletePropertyImage, listStorageImages, deleteStorageImage } from "@/lib/data";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowLeft,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  FolderOpen,
  FilePlus2,
  ImagePlus,
  Sparkles,
  Database,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Property, PropertyImage } from "@shared/schema";
import imageCompression from "browser-image-compression";
import { isObjectStorageKey, getImageUrl } from "@/lib/object-storage";

// Define the preview type
interface ImagePreview {
  fullDataUrl: string;
  storageUrl: string;
  data: string;
}

// File Upload Form component
const FileUploadForm = ({ onUpload, properties }: { onUpload: (data: any) => void, properties: Property[] }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [alt, setAlt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressImages, setCompressImages] = useState(true);
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
  const handleFiles = async (selectedFiles: File[]) => {
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
    
    if (compressImages) {
      toast({
        title: "Processing",
        description: "Compressing images...",
      });
    }
    
    // Process all images
    try {
      // For each file
      for (const file of imageFiles) {
        // Start with the original file
        let processedFile = file;
        
        // If compression is enabled and the file is too large, compress it
        if (compressImages && file.size > MAX_FILE_SIZE) {
          try {
            // Compression options
            const options = {
              maxSizeMB: 1,             // Compress to max 1MB
              maxWidthOrHeight: 1920,   // Limit width/height to 1920px
              useWebWorker: true,
              fileType: file.type,      // Maintain original file type
            };
            
            // Compress the file
            processedFile = await imageCompression(file, options);
            
            // Log compression results
            console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
            
            // Show compression success toast for large files
            if (file.size > MAX_FILE_SIZE) {
              const originalSize = (file.size / 1024 / 1024).toFixed(1);
              const newSize = (processedFile.size / 1024 / 1024).toFixed(1);
              const reductionPercent = (100 - (processedFile.size / file.size * 100)).toFixed(0);
              
              toast({
                title: "Image Compressed",
                description: `Reduced: ${originalSize}MB → ${newSize}MB (${reductionPercent}% smaller)`,
              });
            }
          } catch (err) {
            console.error("Image compression failed:", err);
            // If compression fails and file is too large, skip it
            if (file.size > MAX_FILE_SIZE) {
              toast({
                title: "Warning",
                description: `Skipping ${file.name} - too large and could not be compressed`,
                variant: "destructive",
              });
              continue; // Skip this file
            }
          }
        } else if (!compressImages && file.size > MAX_FILE_SIZE) {
          // If compression is disabled but file is too large
          toast({
            title: "Warning",
            description: `${file.name} is large (${(file.size / 1024 / 1024).toFixed(1)}MB). Enable compression for better performance.`,
            variant: "destructive",
          });
        }
        
        // Add the processed file
        setFiles(prevFiles => [...prevFiles, processedFile]);
        
        // Generate short preview to display in the UI
        const reader = new FileReader();
        reader.onloadend = () => {
          const fullDataUrl = reader.result as string;
          
          // Create a more storage-efficient version for the database
          // Generate a filename based on the current timestamp and a random string
          const timestamp = new Date().getTime();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          
          // Get just the base64 data without the data URL prefix
          const base64Data = fullDataUrl.split(',')[1];
          // Calculate a short hash of the base64 data for uniqueness
          // Make sure to remove any characters that could be interpreted as path separators
          const shortHash = base64Data.substring(0, 8).replace(/[\/\\?%*:|"<>]/g, '_');
          
          // Create a filename in the format: image_timestamp_random_hash.ext
          const filename = `image_${timestamp}_${randomStr}_${shortHash}.${fileExt}`;
          
          // Instead of storing the full data URL, we'll use this generated filename
          // In a real application, we would upload the file to a storage service
          // and store the URL to that file. For this demo, we'll use the data URL
          // but we'll add metadata to make it more manageable.
          
          // Set a shorter preview using a thumbnail version of the image
          setPreviews(prev => [...prev, { 
            fullDataUrl,
            // Store the filename as the URL for the database
            storageUrl: `/uploads/${filename}`,
            // We'll include the full data as a property for now, but in production
            // this would be uploaded to storage and not stored in the database
            data: fullDataUrl
          }]);
        };
        reader.readAsDataURL(processedFile);
      }
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description: "There was a problem processing your images",
        variant: "destructive",
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
    
    // Show a loading toast for large uploads
    if (files.length > 2) {
      toast({
        title: "Processing Images",
        description: `Uploading ${files.length} images. This may take a moment...`,
      });
    }
    
    try {
      // We need to convert the File objects to URLs that can be stored
      // Pass both the storage URL and full data URL to the upload handler
      onUpload({
        imageUrls: previews.map(preview => ({
          // Use the storage URL for the database reference
          url: preview.storageUrl,
          // Pass the full data URL for the actual image data
          data: preview.data
        })),
        propertyId,
        alt: alt || `Property images`
      });
      
      // Reset form after successful upload
      setFiles([]);
      setPreviews([]);
      
      toast({
        title: "Success",
        description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded and saved to permanent storage.`,
      });
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
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="compress-images" 
            checked={compressImages}
            onCheckedChange={(checked) => setCompressImages(checked as boolean)}
          />
          <Label 
            htmlFor="compress-images" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
          >
            <Sparkles className="h-4 w-4 text-yellow-500 mr-1" />
            Automatically compress large images
          </Label>
        </div>
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
                  <img src={preview.fullDataUrl} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {preview.storageUrl.split('/').pop()}
                  </div>
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

// Add this updated component for storage management
const StorageManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch all images from storage systems
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/images'],
    queryFn: listStorageImages
  });
  
  const storageData = data || { images: [], counts: { database: 0, objectStorage: 0, total: 0 } };
  
  console.log("Storage data from query:", storageData);
  
  // Mutation to delete an image from storage
  const deleteImageMutation = useMutation({
    mutationFn: deleteStorageImage,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image deleted from storage",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete image: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle image deletion
  const handleDeleteImage = (objectKey: string) => {
    if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      deleteImageMutation.mutate(objectKey);
    }
  };
  
  // Get image type badge
  const getImageTypeBadge = (image: any) => {
    if (image.source === 'database') {
      return <Badge variant="outline" className="bg-blue-50">Database</Badge>;
    } else if (image.source === 'object-storage') {
      return <Badge variant="outline" className="bg-green-50">Object Storage</Badge>;
    } else if (image.url && image.url.startsWith('/uploads/')) {
      return <Badge variant="outline" className="bg-yellow-50">Legacy</Badge>;
    } else {
      return <Badge variant="outline">External</Badge>;
    }
  };
  
  // Format file size
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Image Storage Management
        </CardTitle>
        <CardDescription>
          Manage all images stored in the database and object storage
        </CardDescription>
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-blue-50">Database: {storageData.counts.database}</Badge>
            <Badge variant="outline" className="bg-green-50">Object Storage: {storageData.counts.objectStorage}</Badge>
            <Badge variant="secondary">Total: {storageData.counts.total}</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4">
            Error loading images: {String(error)}
          </div>
        ) : !storageData.images || storageData.images.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            No images found in storage
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storageData.images.map((image: any) => (
              <div 
                key={image.key} 
                className="border rounded-md overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-muted">
                  <img 
                    src={image.url}
                    alt={image.key}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                    }}
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-sm font-medium truncate mb-1" title={image.key || ''}>
                    {image.key ? (image.key.split('/').pop() || image.key) : 'Unnamed Image'}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      {getImageTypeBadge(image)}
                      {image.size && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(image.size)}
                        </span>
                      )}
                    </div>
                    {image.type && (
                      <div className="text-xs text-muted-foreground">
                        Type: {image.type}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(image.key);
                        toast({
                          title: "Copied",
                          description: "Image key copied to clipboard",
                        });
                      }}
                    >
                      Copy Key
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteImage(image.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
  
  // Fetch property images data with pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20; // Limit number of images per page
  
  const { data: propertyImagesResponse, isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/property-images', page],
    queryFn: async ({ queryKey }) => {
      const pageParam = queryKey[1] as number;
      return getPropertyImages(pageParam, PAGE_SIZE);
    },
    staleTime: 300000, // 5 minutes - reduce unnecessary refetches
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  // Extract images and pagination data
  const propertyImages = propertyImagesResponse?.data || [];
  const pagination = propertyImagesResponse?.pagination || { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  
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
    imageUrls: Array<{url: string, data: string}>;
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
    formData.imageUrls.forEach((imageData, index) => {
      // Pass both the URL and the full data to the server
      createImageMutation.mutate({
        propertyId,
        url: imageData.url,
        data: imageData.data, // Pass the full image data
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
      const filteredUrls = formData.imageUrls.filter(url => url.trim() !== "");
      
      if (filteredUrls.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one image URL",
          variant: "destructive",
        });
        return;
      }
      
      // For URL upload, convert strings to the same format as file upload
      const processedUrls = filteredUrls.map(url => {
        // Extract a filename for better display
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const filename = path.split('/').pop() || `image_${Date.now()}`;
        
        return {
          url: url,
          data: url // For URL uploads, the data is the same as the URL
        };
      });
      
      onUpload({
        ...formData,
        imageUrls: processedUrls
      });
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
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Image Management</h1>
        </div>
        
        <Tabs defaultValue="property-images">
          <TabsList className="mb-4">
            <TabsTrigger value="property-images" className="flex items-center gap-1">
              <FileImage className="h-4 w-4" />
              Property Images
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <UploadCloud className="h-4 w-4" />
              Upload Images
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Image Storage
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="property-images">
            <PropertyImageGrid />
          </TabsContent>
          
          <TabsContent value="upload">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5" />
                    Upload New Images
                  </CardTitle>
                  <CardDescription>
                    Upload images for properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadForm onUpload={handleUploadImage} properties={properties || []} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FilePlus2 className="h-5 w-5" />
                    Add External Images
                  </CardTitle>
                  <CardDescription>
                    Add images from external URLs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MultipleUploadForm onUpload={handleUploadImage} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="storage">
            <StorageManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminImagesPage;