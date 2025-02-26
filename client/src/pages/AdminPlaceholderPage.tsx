import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

const AdminPlaceholderPage = () => {
  const [location] = useLocation();
  const pageName = location.split("/").pop() || "page";
  const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center py-12">
        <Construction className="h-16 w-16 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-2">{formattedPageName} Management</h1>
        <p className="text-gray-500 text-center max-w-md mb-6">
          This part of the admin dashboard is under construction. 
          Come back soon to manage your {pageName.toLowerCase()}.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminPlaceholderPage;