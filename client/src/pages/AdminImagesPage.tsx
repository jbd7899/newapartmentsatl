import { useState, useCallback } from "react";
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
  Image,
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Property, PropertyImage } from "@shared/schema";

const AdminImagesPage = () => {
  const [activeTab, setActiveTab] = useState("gallery");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });
  
  // Mock data for the image gallery
  const galleryImages = properties.map(property => ({
    id: property.id,
    url: property.imageUrl,
    propertyName: property.name,
    dateAdded: new Date().toLocaleDateString(),
    size: "1.2 MB",
    dimensions: "1200x800",
    isUsed: true
  }));
  
  // Mock additional images not yet associated with properties
  const additionalImages = [
    {
      id: 101,
      url: "https://i.imgur.com/JfcBN2B.jpg",
      propertyName: null,
      dateAdded: new Date().toLocaleDateString(),
      size: "0.9 MB",
      dimensions: "1200x800",
      isUsed: false
    },
    {
      id: 102,
      url: "https://i.imgur.com/QfCvGpm.jpg",
      propertyName: null,
      dateAdded: new Date().toLocaleDateString(),
      size: "1.4 MB",
      dimensions: "1400x900",
      isUsed: false
    },
    {
      id: 103,
      url: "https://i.imgur.com/Lcj9JLV.jpg",
      propertyName: null,
      dateAdded: new Date().toLocaleDateString(),
      size: "1.1 MB",
      dimensions: "1200x800",
      isUsed: false
    }
  ];
  
  const allImages = [...galleryImages, ...additionalImages];
  
  const handleUploadImage = (formData: any) => {
    console.log("Uploading image:", formData);
    setIsUploadDialogOpen(false);
  };
  
  const PropertyImageGrid = ({ images }: { images: any[] }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative h-48">
              <img 
                src={image.url} 
                alt={`Property ${image.propertyName || 'Image'}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" className="h-8 px-2">
                  <FileImage className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="destructive" size="sm" className="h-8 px-2">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
              {image.isUsed && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Used
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <div className="text-sm font-medium truncate">
                {image.propertyName || 'Unused Image'}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{image.dimensions}</span>
                <span>{image.size}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const UploadForm = ({ onUpload }: { onUpload: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      imageUrl: "",
      property: ""
    });
    
    const handleChange = (field: string, value: string) => {
      setFormData({
        ...formData,
        [field]: value
      });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onUpload(formData);
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input 
            id="imageUrl" 
            value={formData.imageUrl} 
            onChange={(e) => handleChange("imageUrl", e.target.value)} 
            placeholder="https://example.com/image.jpg"
            required 
          />
          <p className="text-xs text-gray-500">Enter a URL to an existing image.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="property">Associate with Property (Optional)</Label>
          <select 
            id="property"
            value={formData.property}
            onChange={(e) => handleChange("property", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- No Property --</option>
            {properties.map((property: Property) => (
              <option key={property.id} value={property.id.toString()}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        
        <DialogFooter>
          <Button type="submit" className="flex items-center">
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </DialogFooter>
      </form>
    );
  };
  
  if (isLoading) {
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
          <h1 className="text-3xl font-bold">Image Gallery</h1>
          <p className="text-gray-500">Manage property images</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Image</DialogTitle>
              <DialogDescription>
                Add a new image to your gallery.
              </DialogDescription>
            </DialogHeader>
            <UploadForm onUpload={handleUploadImage} />
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
            <div className="flex items-center space-x-2">
              <Input 
                className="w-64" 
                placeholder="Search images..." 
              />
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="gallery">All Images ({allImages.length})</TabsTrigger>
              <TabsTrigger value="used">In Use ({galleryImages.length})</TabsTrigger>
              <TabsTrigger value="unused">Unused ({additionalImages.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gallery">
              <PropertyImageGrid images={allImages} />
            </TabsContent>
            
            <TabsContent value="used">
              <PropertyImageGrid images={galleryImages} />
            </TabsContent>
            
            <TabsContent value="unused">
              {additionalImages.length > 0 ? (
                <PropertyImageGrid images={additionalImages} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileImage className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No unused images found</p>
                </div>
              )}
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
                <div className="text-3xl font-bold">{allImages.length}</div>
                <div className="text-sm text-gray-500">Total Images</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {galleryImages.length}
                </div>
                <div className="text-sm text-gray-500">Images In Use</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-orange-500">
                  {additionalImages.length}
                </div>
                <div className="text-sm text-gray-500">Unused Images</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminImagesPage;