import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { getLocations, getProperties } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
// We'll implement a simpler date input for now
// import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { Location, Property } from "@shared/schema";
// import { Calendar } from "lucide-react";

// Schema for the apartment finder form
const formSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().min(10, { message: "Please enter a valid phone number" })
  }),
  locationPrefs: z.object({
    areas: z.array(z.string()).min(1, { message: "Please select at least one area" }),
    priceRange: z.string().min(1, { message: "Please enter your price range" }),
    moveInDate: z.date({
      required_error: "Please select a move-in date",
    })
  }),
  amenities: z.object({
    desiredAmenities: z.string().min(1, { message: "Please enter desired amenities" }),
    hasPets: z.enum(["Yes", "No"], {
      required_error: "Please select an option",
    }),
    petDetails: z.string().optional(),
    hasCar: z.enum(["Yes", "No"], {
      required_error: "Please select an option",
    }),
    additionalComments: z.string().optional()
  })
});

type FormValues = z.infer<typeof formSchema>;

const ApartmentFinderPage = () => {
  const { toast } = useToast();
  const [hasPetsValue, setHasPetsValue] = useState("No");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations
  });

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      locationPrefs: {
        areas: [],
        priceRange: "",
        moveInDate: undefined
      },
      amenities: {
        desiredAmenities: "",
        hasPets: "No",
        petDetails: "",
        hasCar: "No",
        additionalComments: ""
      }
    }
  });

  // Handler for form submission
  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Form Submitted",
      description: "Thank you for your interest! We'll be in touch shortly.",
    });
    setFormSubmitted(true);
  };
  
  // Update pet details requirements based on selection
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "amenities.hasPets") {
        const hasPets = form.getValues("amenities.hasPets");
        setHasPetsValue(hasPets);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch]);

  if (isLoadingLocations) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-heading font-bold text-4xl text-center mb-12">Find Your Perfect Apartment</h1>
        <div className="h-60 bg-gray-200 animate-pulse rounded-lg mb-8"></div>
      </div>
    );
  }

  if (formSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-heading">Thank You!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your apartment finder request has been submitted. Our team will review your preferences and contact you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-6 pb-8">
            <div className="rounded-full bg-green-100 p-6 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-center text-gray-600 mb-6">
              We appreciate your interest in our properties and look forward to helping you find your ideal home.
            </p>
            <Button onClick={() => setFormSubmitted(false)}>Submit Another Request</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-heading font-bold text-4xl text-center mb-4">Find Your Perfect Apartment</h1>
      <p className="text-center text-[hsl(var(--brand-gray))] mb-12 max-w-3xl mx-auto">
        Fill out our apartment finder form and we'll match you with available properties that meet your needs.
      </p>
      
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="font-heading font-semibold text-xl">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="personalInfo.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="personalInfo.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="personalInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="personalInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(123) 456-7890" 
                            {...field} 
                            onChange={e => {
                              // Format phone number as user types
                              const value = e.target.value.replace(/\D/g, '');
                              const formattedValue = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                              field.onChange(formattedValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Location Preferences Section */}
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="font-heading font-semibold text-xl">Location Preferences</h2>
                </div>
                
                <FormField
                  control={form.control}
                  name="locationPrefs.areas"
                  render={() => (
                    <FormItem>
                      <div className="mb-3">
                        <FormLabel>Preferred Areas *</FormLabel>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {locations.map((location) => (
                          <FormField
                            key={location.id}
                            control={form.control}
                            name="locationPrefs.areas"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={location.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(location.slug)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, location.slug])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== location.slug
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {location.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        <FormField
                          control={form.control}
                          name="locationPrefs.areas"
                          render={({ field }) => {
                            return (
                              <FormItem
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes("no-preference")}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, "no-preference"])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== "no-preference"
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  No Preference
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="locationPrefs.priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Range * (Minimum $1450)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $1500-2000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="locationPrefs.moveInDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Desired Move-in Date *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            onChange={(e) => {
                              field.onChange(e.target.valueAsDate);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Amenities and Details Section */}
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="font-heading font-semibold text-xl">Amenities and Additional Details</h2>
                </div>
                
                <FormField
                  control={form.control}
                  name="amenities.desiredAmenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Amenities *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hardwood floors, washer/dryer, parking" {...field} />
                      </FormControl>
                      <FormDescription>
                        List any specific amenities or features that are important to you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amenities.hasPets"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Do you have any pets? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Yes" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Yes
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="No" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              No
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {hasPetsValue === "Yes" && (
                  <FormField
                    control={form.control}
                    name="amenities.petDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pet Details *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Dog, 2 years, 25 lbs, Golden Retriever" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Please include type, age, weight, and breed of your pet(s).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="amenities.hasCar"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Do you have a car? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Yes" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Yes
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="No" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              No
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amenities.additionalComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any other requirements or questions?" 
                          className="resize-none min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Share any additional information that might help us find your perfect apartment.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  className="bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))] hover:opacity-90 px-8 py-6 h-auto text-lg font-heading font-semibold"
                >
                  Submit Form
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApartmentFinderPage;
