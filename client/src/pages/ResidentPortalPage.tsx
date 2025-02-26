import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Maintenance request schema
const maintenanceSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  unit: z.string().min(1, { message: "Unit number is required" }),
  issue: z.string().min(5, { message: "Please describe the issue" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
});

const ResidentPortalPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Maintenance form
  const maintenanceForm = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      name: "",
      unit: "",
      issue: "",
      phone: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    // Simulate login
    setTimeout(() => {
      setIsLoggedIn(true);
      toast({
        title: "Login Successful",
        description: "Welcome to your resident portal",
      });
    }, 1000);
  };

  const onMaintenanceSubmit = (values: z.infer<typeof maintenanceSchema>) => {
    toast({
      title: "Maintenance Request Submitted",
      description: "We'll contact you soon regarding your request",
    });
    maintenanceForm.reset();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    loginForm.reset();
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-heading font-bold text-4xl text-center mb-12">Resident Portal</h1>
      
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Login to Your Account</CardTitle>
              <CardDescription>
                Access your account to pay rent, submit maintenance requests, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full bg-[hsl(var(--brand-orange))]" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? "Logging In..." : "Login"}
                  </Button>
                  
                  <div className="text-center">
                    <a href="#" className="text-sm text-[hsl(var(--brand-orange))] hover:underline">
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Welcome, Resident</CardTitle>
                <CardDescription>
                  Manage your apartment and services
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="dashboard">
                <TabsList className="mb-6">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Current Rent:</span>
                            <span className="font-semibold">$1,750.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Due Date:</span>
                            <span>1st of every month</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="text-green-600 font-semibold">Paid</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4">Make a Payment</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          <li className="flex justify-between">
                            <span>Rent Payment</span>
                            <span className="text-[hsl(var(--brand-gray))]">Apr 1, 2023</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Maintenance Request</span>
                            <span className="text-[hsl(var(--brand-gray))]">Mar 15, 2023</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Rent Payment</span>
                            <span className="text-[hsl(var(--brand-gray))]">Mar 1, 2023</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="payments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-semibold">April 2023 Rent</div>
                            <div className="text-sm text-[hsl(var(--brand-gray))]">April 1, 2023</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">$1,750.00</div>
                            <div className="text-sm text-green-600">Paid</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-semibold">March 2023 Rent</div>
                            <div className="text-sm text-[hsl(var(--brand-gray))]">March 1, 2023</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">$1,750.00</div>
                            <div className="text-sm text-green-600">Paid</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-semibold">February 2023 Rent</div>
                            <div className="text-sm text-[hsl(var(--brand-gray))]">February 1, 2023</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">$1,750.00</div>
                            <div className="text-sm text-green-600">Paid</div>
                          </div>
                        </div>
                      </div>
                      <Button className="mt-6">Make a Payment</Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="maintenance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submit a Maintenance Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...maintenanceForm}>
                        <form onSubmit={maintenanceForm.handleSubmit(onMaintenanceSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={maintenanceForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={maintenanceForm.control}
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Unit #" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={maintenanceForm.control}
                            name="issue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Issue Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Describe the issue..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={maintenanceForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="bg-[hsl(var(--brand-orange))]">
                            Submit Request
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents & Forms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>Lease Agreement</div>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>Community Guidelines</div>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>Move-Out Checklist</div>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>Parking Information</div>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResidentPortalPage;
