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
  const imageUrl = featuredImage ? featuredImage.url : placeholderImage;

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-all hover:shadow-lg">
      {/* Unit image */}
      <div className="relative aspect-video overflow-hidden bg-muted cursor-pointer"
        onClick={() => onShowGallery && onShowGallery(unit.id)}>
        <img 
          src={imageUrl} 
          alt={`Unit ${unit.unitNumber}`}
          className="object-cover w-full h-full"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={unit.available ? "default" : "destructive"} className="font-medium">
            {unit.available ? (
              <><Check className="h-3 w-3 mr-1" /> Available</>
            ) : (
              <><X className="h-3 w-3 mr-1" /> Unavailable</>
            )}
          </Badge>
        </div>
        {unitImages.length > 0 && (
          <Badge variant="outline" className="absolute bottom-2 right-2 bg-white/80 text-black font-medium">
            <ImageIcon className="h-3 w-3 mr-1" /> {unitImages.length} Photos
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 flex-grow">
        {/* Unit details */}
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight mb-1">Unit {unit.unitNumber}</h3>
          
          <div className="flex gap-4 mb-3 mt-2 text-sm text-gray-700">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1 text-primary" />
              <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1 text-primary" />
              <span>{unit.bathrooms} {unit.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>
            <div className="flex items-center">
              <Home className="h-4 w-4 mr-1 text-primary" />
              <span>{unit.sqft} sqft</span>
            </div>
          </div>
          
          {unit.rent && (
            <div className="mb-3 text-lg font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-primary" />
              {formatCurrency(unit.rent)}<span className="text-sm font-normal">/month</span>
            </div>
          )}
          
          <p className="text-sm mt-2 text-gray-600 line-clamp-3">{unit.description}</p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 gap-2 flex-wrap justify-between">
        {unit.available && onScheduleTour && (
          <Button 
            size="sm" 
            onClick={() => onScheduleTour(unit.id)}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" /> Schedule Tour
          </Button>
        )}
        
        {onRequestInfo && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onRequestInfo(unit.id)}
            className="flex-1"
          >
            More Info
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}