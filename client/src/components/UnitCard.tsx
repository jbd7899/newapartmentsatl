import { useState } from "react";
import { useLocation } from "wouter";
import { PropertyUnit, UnitImage } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bed, 
  Bath, 
  Home, 
  Calendar, 
  DollarSign,
  Check, 
  X, 
  Image as ImageIcon 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-utils";

interface UnitCardProps {
  unit: PropertyUnit;
  unitImages?: UnitImage[];
  onShowGallery?: (unitId: number) => void;
  onRequestInfo?: (unitId: number) => void;
  onScheduleTour?: (unitId: number) => void;
}

export default function UnitCard({ 
  unit, 
  unitImages = [], 
  onShowGallery, 
  onRequestInfo,
  onScheduleTour
}: UnitCardProps) {
  const [, setLocation] = useLocation();
  
  // Find featured image or use the first image
  const featuredImage = unitImages.find(img => img.isFeatured) || unitImages[0];
  
  // Default placeholder image if no images are available
  const placeholderImage = "https://res.cloudinary.com/dlbgrsaal/image/upload/v1736907976/6463_Trammel_Dr_1_vdvnqs.jpg";
  
  // Get the appropriate image URL
  const rawImageUrl = featuredImage ? featuredImage.url : placeholderImage;
  
  // Optimize Cloudinary URLs for cards
  const getOptimizedCardImage = (url: string): string => {
    if (url && url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Optimize for card display
        return `${parts[0]}/upload/c_fill,w_600,h_400,q_auto/${parts[1]}`;
      }
    }
    return getImageUrl(url);
  };
  
  const imageUrl = getOptimizedCardImage(rawImageUrl);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="relative cursor-pointer" onClick={() => onShowGallery && onShowGallery(unit.id)}>
        <img 
          src={imageUrl} 
          alt={`Unit ${unit.unitNumber}`}
          className="w-full h-48 object-cover transition-transform hover:scale-105 duration-500"
        />
        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold uppercase ${unit.available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          {unit.available ? 'Available' : 'Unavailable'}
        </div>
        {unitImages.length > 0 && (
          <Badge variant="outline" className="absolute bottom-3 right-3 bg-white/80 text-black font-medium">
            <ImageIcon className="h-3 w-3 mr-1" /> {unitImages.length} Photos
          </Badge>
        )}
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold">Unit {unit.unitNumber}</h3>
          {unit.rent && (
            <div className="text-xl font-bold text-orange-500">
              ${formatCurrency(unit.rent)}
              <span className="text-sm text-gray-500 font-normal">/mo</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-4 py-3 border-y border-gray-100 mb-4">
          <div className="flex items-center text-gray-700">
            <Bed className="h-4 w-4 mr-1 text-orange-500" />
            <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Bath className="h-4 w-4 mr-1 text-orange-500" />
            <span>{unit.bathrooms} {unit.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Home className="h-4 w-4 mr-1 text-orange-500" />
            <span>{unit.sqft} sqft</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{unit.description}</p>
        
        <div className="mt-auto flex gap-2">
          {unit.available && onScheduleTour && (
            <Button 
              onClick={() => onScheduleTour(unit.id)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" /> Schedule Tour
            </Button>
          )}
          
          {onRequestInfo && (
            <Button 
              variant="outline" 
              onClick={() => onRequestInfo(unit.id)}
              className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50"
              size="sm"
            >
              More Info
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}