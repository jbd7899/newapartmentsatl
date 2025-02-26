import { Route, Switch } from "wouter";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/midtown" component={() => <LocationPage location="midtown" />} />
      <Route path="/virginia-highland" component={() => <LocationPage location="virginia-highland" />} />
      <Route path="/dallas" component={() => <LocationPage location="dallas" />} />
      <Route path="/apartment-finder" component={ApartmentFinderPage} />
      <Route path="/portal" component={ResidentPortalPage} />
      <Route path="/properties/:id">{(params) => <PropertyPage id={params.id} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
