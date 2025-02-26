import { useQuery } from "@tanstack/react-query";
import { getFeatures } from "@/lib/data";
import { Feature } from "@shared/schema";

const FeaturesSection = () => {
  const { data: features, isLoading, error } = useQuery({
    queryKey: ['/api/features'],
    queryFn: getFeatures
  });

  if (isLoading) {
    return (
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">Our Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[200px] bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !features) {
    return (
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-center mb-12">Our Properties</h2>
          <p className="text-center text-red-500">Error loading features. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl text-center mb-12">Our Properties</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature: Feature) => (
            <div key={feature.id} className="text-center p-6">
              <div className="text-[hsl(var(--brand-orange))] text-4xl mb-4">
                <i className={`fas ${feature.icon}`}></i>
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">{feature.title}</h3>
              <p className="text-[hsl(var(--brand-gray))]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
