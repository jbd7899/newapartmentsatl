import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import LocationPage from "./pages/LocationPage";
import PropertyPage from "./pages/PropertyPage";
import ApartmentFinderPage from "./pages/ApartmentFinderPage";
import ResidentPortalPage from "./pages/ResidentPortalPage";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminPropertiesPage from "./pages/AdminPropertiesPage";
import AdminImagesPage from "./pages/AdminImagesPage";
import AdminPlaceholderPage from "./pages/AdminPlaceholderPage";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/midtown" component={() => <LocationPage location="midtown" />} />
      <Route path="/virginia-highland" component={() => <LocationPage location="virginia-highland" />} />
      <Route path="/dallas" component={() => <LocationPage location="dallas" />} />
      <Route path="/apartment-finder" component={ApartmentFinderPage} />
      <Route path="/portal" component={ResidentPortalPage} />
      <Route path="/properties/:id">{(params) => <PropertyPage id={params.id} />}</Route>
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/properties" component={AdminPropertiesPage} />
      <Route path="/admin/images" component={AdminImagesPage} />
      <Route path="/admin/users" component={AdminPlaceholderPage} />
      <Route path="/admin/settings" component={AdminPlaceholderPage} />
      
      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        {!isAdminRoute && <Header />}
        <main className={`flex-grow ${!isAdminRoute ? '' : 'bg-gray-100'}`}>
          <Router />
        </main>
        {!isAdminRoute && <Footer />}
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
