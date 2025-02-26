import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Image as ImageIcon, 
  Home, 
  Users, 
  Settings, 
  LogOut,
  MessageSquare,
  LandmarkIcon,
  Layers
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [, navigate] = useLocation();
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Home className="w-5 h-5 mr-3" />,
      link: "/admin"
    },
    {
      title: "Properties",
      icon: <Building className="w-5 h-5 mr-3" />,
      link: "/admin/properties"
    },
    {
      title: "Images",
      icon: <ImageIcon className="w-5 h-5 mr-3" />,
      link: "/admin/images"
    },
    {
      title: "Neighborhoods",
      icon: <LandmarkIcon className="w-5 h-5 mr-3" />,
      link: "/admin/neighborhoods"
    },
    {
      title: "Inquiries",
      icon: <MessageSquare className="w-5 h-5 mr-3" />,
      link: "/admin/inquiries"
    },
    {
      title: "Users",
      icon: <Users className="w-5 h-5 mr-3" />,
      link: "/admin/users"
    },
    {
      title: "Settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      link: "/admin/settings"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* Sidebar */}
      <div className="lg:w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <Link href="/" className="text-[hsl(var(--brand-orange))] font-heading font-bold text-xl block">
            ApartmentsATL <span className="text-sm font-normal text-gray-500">Admin</span>
          </Link>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.link} 
                  className={`flex items-center py-2 px-4 rounded-md w-full hover:bg-gray-100 transition-colors ${
                    location === item.link ? "bg-gray-100 text-[hsl(var(--brand-orange))]" : "text-gray-700"
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-4 border-t">
            <Button 
              variant="ghost"
              className="flex items-center py-2 px-4 rounded-md w-full hover:bg-gray-100 justify-start font-normal"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Exit Admin
            </Button>
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              View Site
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;