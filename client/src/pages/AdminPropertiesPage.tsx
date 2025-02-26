import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocations, getProperties } from "@/lib/data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image, 
  Eye 
} from "lucide-react";

import { Property, Location, InsertProperty } from "@shared/schema";

// Form schema based on InsertProperty but with additional validation
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  price: z.coerce.number().min(500, "Price must be at least $500"),
  bedrooms: z.coerce.number().min(0, "Must be 0 or more"),
  bathrooms: z.coerce.number().min(0, "Must be 0 or more"),
  sqft: z.coerce.number().min(200, "Size must be at least 200 sq. ft."),
  locationId: z.coerce.number().int().positive("Please select a location"),
  imageUrl: z.string().url("Must be a valid URL"),
  latitude: z.coerce.number().min(-90).max(90, "Must be between -90 and 90"),
  longitude: z.coerce.number().min(-180).max(180, "Must be between -180 and 180"),
});

type FormValues = z.infer<typeof formSchema>;

const AdminPropertiesPage = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const { toast } = useToast();
  
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });
  
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations,
  });
  
  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowDialog(true);
  };
  
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowDialog(true);
  };
  
  const handleDeleteProperty = (id: number) => {
    // This would be connected to an API endpoint
    toast({
      title: "Property deleted",
      description: `Property ID ${id} has been removed.`,
    });
  };
  
  const PropertyForm = ({ property, onSave }: { property?: Property, onSave: (data: any) => void }) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: property ? {
        ...property
      } : {
        name: "",
        description: "",
        address: "",
        price: 1500,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 800,
        locationId: 0,
        imageUrl: "https://i.imgur.com/JfcBN2B.jpg",
        latitude: 0,
        longitude: 0
      }
    });
    
    function onSubmit(data: FormValues) {
      onSave(data);
    }
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Midtown Heights" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <select 
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="0">Select Location</option>
                      {locations.map((location: Location) => (
                        <option 
                          key={location.id} 
                          value={location.id}
                        >
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field}
                    placeholder="A beautiful apartment in the heart of Midtown..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123 Peachtree St NE, Atlanta, GA 30308" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($/month)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathrooms</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="sqft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Square Feet</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://example.com/image.jpg" />
                </FormControl>
                <FormDescription>
                  Provide a URL to an image for this property
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {property ? "Update Property" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };
  
  const handleSaveProperty = (data: any) => {
    const isUpdating = !!editingProperty;
    
    // This would be connected to an API endpoint
    toast({
      title: isUpdating ? "Property updated" : "Property added",
      description: `${data.name} has been ${isUpdating ? "updated" : "added"} successfully.`,
    });
    
    setShowDialog(false);
  };
  
  if (isLoadingProperties || isLoadingLocations) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading properties...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-gray-500">Manage your rental properties</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Add New Property"}
              </DialogTitle>
              <DialogDescription>
                {editingProperty 
                  ? "Update the details for this property" 
                  : "Fill in the details to add a new property"
                }
              </DialogDescription>
            </DialogHeader>
            <PropertyForm 
              property={editingProperty || undefined} 
              onSave={handleSaveProperty} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Property Listings</CardTitle>
          <CardDescription>
            You have {properties.length} properties in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Beds/Baths</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property: Property) => {
                  const propertyLocation = locations.find(
                    loc => loc.id === property.locationId
                  );
                  
                  return (
                    <tr key={property.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="relative h-12 w-12 rounded overflow-hidden">
                          <img 
                            src={property.imageUrl} 
                            alt={property.name}
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {property.name}
                      </td>
                      <td className="px-6 py-4">
                        {propertyLocation?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        ${property.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {property.bedrooms} bd / {property.bathrooms} ba
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/properties/${property.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditProperty(property)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteProperty(property.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminPropertiesPage;