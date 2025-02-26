import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/layout/AdminLayout";
import { 
  getProperties, 
  getPropertyUnits, 
  getUnitImages, 
  createPropertyUnit, 
  updatePropertyUnit, 
  deletePropertyUnit,
  createUnitImage,
  updateUnitImageOrder,
  updateUnitImageFeatured,
  deleteUnitImage 
} from "@/lib/data";
import { 
  Property, 
  PropertyUnit, 
  UnitImage,
  insertPropertyUnitSchema 
} from "@shared/schema";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  Pencil,
  Trash2,
  Plus,
  Image as ImageIcon,
  ArrowUpDown,
  Check,
  Star,
} from "lucide-react";

// Define the form validation schema extending the insert schema
const formSchema = insertPropertyUnitSchema.extend({
  propertyId: z.number().min(1, "Please select a property"),
});

type FormValues = z.infer<typeof formSchema>;

const AdminPropertyUnitsPage = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });

  // Get property units for selected property
  const { data: propertyUnits = [], isLoading: isLoadingUnits } = useQuery({
    queryKey: ['/api/properties', selectedProperty, 'units'],
    queryFn: () => selectedProperty ? getPropertyUnits(selectedProperty) : Promise.resolve([]),
    enabled: !!selectedProperty,
  });

  // Get unit images for selected unit
  const { data: unitImages = [], isLoading: isLoadingImages } = useQuery({
    queryKey: ['/api/property-units', selectedUnit, 'images'],
    queryFn: () => selectedUnit ? getUnitImages(selectedUnit) : Promise.resolve([]),
    enabled: !!selectedUnit,
  });

  // Filter multifamily properties
  const multifamilyProperties = properties.filter(
    (property: Property) => property.isMultifamily
  );

  // Create unit mutation
  const createUnitMutation = useMutation({
    mutationFn: (data: FormValues) => createPropertyUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'units'] });
      toast({
        title: "Unit created",
        description: "The unit has been successfully created.",
      });
      setShowDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormValues> }) => updatePropertyUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'units'] });
      toast({
        title: "Unit updated",
        description: "The unit has been successfully updated.",
      });
      setShowDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: (id: number) => deletePropertyUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', selectedProperty, 'units'] });
      toast({
        title: "Unit deleted",
        description: "The unit has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unit image mutations
  const createImageMutation = useMutation({
    mutationFn: (data: { unitId: number, url: string, alt: string, displayOrder: number, isFeatured: boolean, data?: string }) => 
      createUnitImage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-units', selectedUnit, 'images'] });
      toast({
        title: "Image uploaded",
        description: "The image has been successfully uploaded.",
      });
      setShowImageUpload(false);
      setImageData(null);
      setImageFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateImageOrderMutation = useMutation({
    mutationFn: ({ id, displayOrder }: { id: number; displayOrder: number }) => 
      updateUnitImageOrder(id, displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-units', selectedUnit, 'images'] });
    },
  });

  const updateImageFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: number; isFeatured: boolean }) => 
      updateUnitImageFeatured(id, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-units', selectedUnit, 'images'] });
      toast({
        title: "Featured image updated",
        description: "The featured image has been updated.",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: number) => deleteUnitImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-units', selectedUnit, 'images'] });
      toast({
        title: "Image deleted",
        description: "The image has been successfully deleted.",
      });
    },
  });

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle adding new unit
  const handleAddUnit = () => {
    setEditingUnit(null);
    setShowDialog(true);
  };

  // Handle edit unit
  const handleEditUnit = (unit: PropertyUnit) => {
    setEditingUnit(unit);
    setShowDialog(true);
  };

  // Handle view unit images
  const handleViewUnitImages = (unitId: number) => {
    setSelectedUnit(unitId);
  };

  // Handle delete unit
  const handleDeleteUnit = (id: number) => {
    if (confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      deleteUnitMutation.mutate(id);
    }
  };

  // Handle image order change
  const handleMoveImage = (image: UnitImage, direction: 'up' | 'down') => {
    const sortedImages = [...unitImages].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedImages.findIndex(img => img.id === image.id);
    
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === sortedImages.length - 1)
    ) {
      return;
    }
    
    const newOrderIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetImage = sortedImages[newOrderIndex];
    
    if (targetImage) {
      updateImageOrderMutation.mutate({ 
        id: image.id, 
        displayOrder: targetImage.displayOrder 
      });
      updateImageOrderMutation.mutate({ 
        id: targetImage.id, 
        displayOrder: image.displayOrder 
      });
    }
  };

  // Handle set featured image
  const handleSetFeatured = (image: UnitImage) => {
    // If this image is already featured, do nothing
    if (image.isFeatured) return;
    
    // Find the currently featured image and unfeature it
    const featuredImage = unitImages.find(img => img.isFeatured);
    if (featuredImage) {
      updateImageFeaturedMutation.mutate({ 
        id: featuredImage.id, 
        isFeatured: false 
      });
    }
    
    // Set the new image as featured
    updateImageFeaturedMutation.mutate({ 
      id: image.id, 
      isFeatured: true 
    });
  };

  // Handle delete image
  const handleDeleteImage = (id: number) => {
    if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      deleteImageMutation.mutate(id);
    }
  };

  // Handle upload image
  const handleUploadImage = () => {
    if (!selectedUnit || !imageData || !imageFile) return;
    
    const unit = propertyUnits.find(unit => unit.id === selectedUnit);
    if (!unit) return;
    
    const newOrder = unitImages.length > 0 
      ? Math.max(...unitImages.map(img => img.displayOrder)) + 1 
      : 0;
    
    createImageMutation.mutate({
      unitId: selectedUnit,
      url: imageFile.name,  // This will be processed by the server
      alt: `${unit.unitNumber} - Unit Image`,
      displayOrder: newOrder,
      isFeatured: unitImages.length === 0, // Make it featured if it's the first image
      data: imageData,
    });
  };

  // Unit form component
  const UnitForm = ({ unit, onSave }: { unit?: PropertyUnit, onSave: (data: FormValues) => void }) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: unit ? {
        ...unit
      } : {
        propertyId: selectedProperty || 0,
        unitNumber: "",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 750,
        rent: 1500,
        available: true,
        description: "",
        features: "",
      },
    });

    // Submit form handler
    function onSubmit(data: FormValues) {
      onSave(data);
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property</FormLabel>
                <Select
                  disabled={!!unit} // Disable changing property for existing units
                  value={String(field.value)}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {multifamilyProperties.map((property: Property) => (
                      <SelectItem key={property.id} value={String(property.id)}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 101, A1, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Available</FormLabel>
                    <FormDescription>
                      Check if this unit is available for rent
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                    />
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
                    <Input type="number" {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sqft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Square Feet</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="rent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Rent ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe this unit..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Features</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="List features, separated by commas..." />
                </FormControl>
                <FormDescription>
                  Enter features separated by commas (e.g., "Stainless appliances, Hardwood floors, In-unit laundry")
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={createUnitMutation.isPending || updateUnitMutation.isPending}>
              {unit ? 'Update Unit' : 'Create Unit'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Property Units</h1>
          <Button onClick={handleAddUnit}>
            <Plus className="mr-2 h-4 w-4" /> Add Unit
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Property</CardTitle>
            <CardDescription>
              Choose a multifamily property to manage its units
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProperties ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : multifamilyProperties.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-500">No multifamily properties found.</p>
                <p className="text-sm text-slate-400 mt-2">
                  Add multifamily properties to manage their units.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {multifamilyProperties.map((property: Property) => (
                  <Button
                    key={property.id}
                    variant={selectedProperty === property.id ? "default" : "outline"}
                    className="justify-start h-auto py-3"
                    onClick={() => setSelectedProperty(property.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{property.name}</div>
                      <div className="text-xs text-slate-500">{property.address}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedProperty && (
          <Tabs defaultValue="units" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="units">Units</TabsTrigger>
              {selectedUnit && <TabsTrigger value="images">Unit Images</TabsTrigger>}
            </TabsList>

            <TabsContent value="units">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {properties.find((p: Property) => p.id === selectedProperty)?.name} - Units
                  </CardTitle>
                  <CardDescription>
                    Manage units for this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUnits ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : propertyUnits.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No units found for this property.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={handleAddUnit}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add First Unit
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Beds/Baths</TableHead>
                          <TableHead>Sq Ft</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {propertyUnits.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                            <TableCell>{unit.bedrooms} bd / {unit.bathrooms} ba</TableCell>
                            <TableCell>{unit.sqft}</TableCell>
                            <TableCell>{unit.rent ? formatCurrency(unit.rent) : 'N/A'}</TableCell>
                            <TableCell>
                              {unit.available ? (
                                <Badge variant="default">Available</Badge>
                              ) : (
                                <Badge variant="secondary">Unavailable</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => handleEditUnit(unit)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => handleViewUnitImages(unit.id)}
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => handleDeleteUnit(unit.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {selectedUnit && (
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Unit {propertyUnits.find(u => u.id === selectedUnit)?.unitNumber} - Images
                    </CardTitle>
                    <CardDescription>
                      Manage images for this unit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end mb-6">
                      <Button onClick={() => setShowImageUpload(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Upload Image
                      </Button>
                    </div>

                    {isLoadingImages ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                      </div>
                    ) : unitImages.length === 0 ? (
                      <div className="text-center py-12 border border-dashed rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto text-slate-300" />
                        <p className="mt-4 text-slate-500">No images for this unit</p>
                        <p className="text-sm text-slate-400 mt-2">
                          Upload images to showcase this unit.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {unitImages
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-video overflow-hidden rounded-lg border">
                                <img 
                                  src={image.url} 
                                  alt={image.alt} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="absolute bottom-2 left-2">
                                {image.isFeatured && (
                                  <Badge className="bg-yellow-500 border-yellow-500">
                                    <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="icon" 
                                  variant="secondary"
                                  onClick={() => handleMoveImage(image, 'up')}
                                  disabled={image.displayOrder === 0}
                                  className="h-8 w-8"
                                >
                                  <ArrowUpDown className="h-4 w-4 rotate-90" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="secondary"
                                  onClick={() => handleMoveImage(image, 'down')}
                                  className="h-8 w-8"
                                >
                                  <ArrowUpDown className="h-4 w-4 -rotate-90" />
                                </Button>
                                {!image.isFeatured && (
                                  <Button 
                                    size="icon" 
                                    variant="secondary"
                                    onClick={() => handleSetFeatured(image)}
                                    className="h-8 w-8"
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  size="icon" 
                                  variant="secondary"
                                  onClick={() => handleDeleteImage(image.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Image Upload Dialog */}
                    <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Unit Image</DialogTitle>
                          <DialogDescription>
                            Upload an image for Unit {propertyUnits.find(u => u.id === selectedUnit)?.unitNumber}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div className="w-full max-w-md">
                              {imageData ? (
                                <div className="relative aspect-video">
                                  <img
                                    src={imageData}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                      setImageData(null);
                                      setImageFile(null);
                                    }}
                                  >
                                    Change
                                  </Button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500">
                                      <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      PNG, JPG or WEBP (MAX. 10MB)
                                    </p>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          <DialogFooter>
                            <Button 
                              onClick={handleUploadImage} 
                              disabled={!imageData || createImageMutation.isPending}
                            >
                              {createImageMutation.isPending ? "Uploading..." : "Upload Image"}
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* Add/Edit Unit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? `Edit Unit ${editingUnit.unitNumber}` : "Add New Unit"}
            </DialogTitle>
            <DialogDescription>
              {editingUnit 
                ? "Update the details for this unit." 
                : "Enter the details for the new unit."}
            </DialogDescription>
          </DialogHeader>
          
          <UnitForm 
            unit={editingUnit || undefined} 
            onSave={(data) => {
              if (editingUnit) {
                updateUnitMutation.mutate({ id: editingUnit.id, data });
              } else {
                createUnitMutation.mutate(data);
              }
            }} 
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPropertyUnitsPage;