import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Location } from "@shared/schema";
import { getImageUrl } from "@/lib/image-utils";
import { ArrowRight } from "lucide-react";

interface PropertyCardProps {
  location: Location;
}

const PropertyCard = ({ location }: PropertyCardProps) => {
  // Function to optimize Cloudinary URLs for property cards
  const getOptimizedImageUrl = (url: string | null | undefined): string => {
    if (!url) return '/placeholder-image.jpg';
    
    // For Cloudinary URLs, optimize with their URL parameters for better performance
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Add optimization parameters: c_fill (crop mode), w_600 (width), q_auto (quality)
        return `${parts[0]}/upload/c_fill,w_600,h_360,q_auto/${parts[1]}`;
      }
    }
    
    // For non-Cloudinary URLs, use the standard image utility
    return getImageUrl(url);
  };

  return (
    <Card className="overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-60">
        <img 
          src={getOptimizedImageUrl(location.imageUrl)} 
          alt={location.name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="font-heading font-bold text-xl mb-2">{location.name}</h3>
        <p className="text-[hsl(var(--brand-gray))] mb-4">{location.description}</p>
        <Link 
          href={`/${location.slug}`} 
          className="text-[hsl(var(--brand-orange))] font-heading font-semibold hover:underline flex items-center"
        >
          {location.linkText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
