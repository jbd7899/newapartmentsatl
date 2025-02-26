import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Location } from "@shared/schema";

interface PropertyCardProps {
  location: Location;
}

const PropertyCard = ({ location }: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-60">
        <img 
          src={location.imageUrl} 
          alt={location.name} 
          className="w-full h-full object-cover"
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
          <i className="fas fa-arrow-right ml-2"></i>
        </Link>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
