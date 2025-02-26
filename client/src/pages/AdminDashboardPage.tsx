import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocations, getProperties } from "@/lib/data";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Home, 
  Users, 
  MessageSquare, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Badge
} from "lucide-react";

const AdminDashboardPage = () => {
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getLocations,
  });
  
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });
  
  // Generate some mock data for the dashboard
  const stats = [
    {
      title: "Total Properties",
      value: properties.length,
      description: "Active rental properties",
      icon: <Home className="h-5 w-5" />,
      change: 2,
      changeType: "increase" as const,
    },
    {
      title: "Total Locations",
      value: locations.length,
      description: "Available locations",
      icon: <Badge className="h-5 w-5" />,
      change: 0,
      changeType: "neutral" as const,
    },
    {
      title: "User Inquiries",
      value: 24,
      description: "In the last 30 days",
      icon: <MessageSquare className="h-5 w-5" />,
      change: 12,
      changeType: "increase" as const,
    },
    {
      title: "Total Revenue",
      value: "$142,500",
      description: "Last month's earnings",
      icon: <DollarSign className="h-5 w-5" />,
      change: 3.2,
      changeType: "decrease" as const,
    },
  ];
  
  // Mock data for the area chart
  const chartData = [
    { name: "Jan", inquiries: 65, views: 1400 },
    { name: "Feb", inquiries: 59, views: 1200 },
    { name: "Mar", inquiries: 80, views: 1600 },
    { name: "Apr", inquiries: 81, views: 1700 },
    { name: "May", inquiries: 56, views: 1500 },
    { name: "Jun", inquiries: 55, views: 1400 },
    { name: "Jul", inquiries: 40, views: 1200 },
  ];
  
  // Pie chart data for property distribution by location
  const locationData = locations.map(location => ({
    name: location.name,
    value: properties.filter(property => property.locationId === location.id).length
  }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];
  
  const ChangeIndicator = ({ type, value }: { type: 'increase' | 'decrease' | 'neutral', value: number }) => {
    return (
      <div className="flex items-center space-x-1">
        {type === 'increase' ? (
          <>
            <ArrowUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500 text-xs">{value}%</span>
          </>
        ) : type === 'decrease' ? (
          <>
            <ArrowDown className="h-3 w-3 text-red-500" />
            <span className="text-red-500 text-xs">{value}%</span>
          </>
        ) : (
          <>
            <ArrowRight className="h-3 w-3 text-gray-500" />
            <span className="text-gray-500 text-xs">{value}%</span>
          </>
        )}
      </div>
    );
  };
  
  if (isLoadingLocations || isLoadingProperties) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-500">Welcome to your property management dashboard</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className="bg-gray-100 p-2 rounded-md">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <ChangeIndicator 
                    type={stat.changeType}
                    value={stat.change}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Inquiries & Property Views</CardTitle>
              <CardDescription>Monthly performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="inquiries" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorInquiries)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Pie Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Properties by Location</CardTitle>
              <CardDescription>Distribution across Atlanta areas</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "New Inquiry",
                  description: "Someone is interested in Midtown Heights",
                  time: "10 minutes ago",
                },
                {
                  title: "Property Updated",
                  description: "Virginia Lofts price was updated",
                  time: "2 hours ago",
                },
                {
                  title: "New User Registration",
                  description: "A new user signed up for the resident portal",
                  time: "Yesterday",
                },
              ].map((item, index) => (
                <div key={index} className="flex items-start pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Badge className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;