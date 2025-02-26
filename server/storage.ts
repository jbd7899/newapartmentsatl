import { 
  locations, properties, features,
  type Location, type InsertLocation, 
  type Property, type InsertProperty,
  type Feature, type InsertFeature 
} from "@shared/schema";

// Storage Interface
export interface IStorage {
  // Locations
  getLocations(): Promise<Location[]>;
  getLocationBySlug(slug: string): Promise<Location | undefined>;
  
  // Properties
  getProperties(): Promise<Property[]>;
  getPropertiesByLocation(locationId: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  
  // Features
  getFeatures(): Promise<Feature[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private locationsData: Map<number, Location>;
  private propertiesData: Map<number, Property>;
  private featuresData: Map<number, Feature>;

  constructor() {
    this.locationsData = new Map();
    this.propertiesData = new Map();
    this.featuresData = new Map();
    
    // Seed initial data
    this.seedData();
  }

  // Location methods
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locationsData.values());
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    return Array.from(this.locationsData.values()).find(
      location => location.slug === slug
    );
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    return Array.from(this.propertiesData.values());
  }

  async getPropertiesByLocation(locationId: number): Promise<Property[]> {
    return Array.from(this.propertiesData.values()).filter(
      property => property.locationId === locationId
    );
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.propertiesData.get(id);
  }

  // Feature methods
  async getFeatures(): Promise<Feature[]> {
    return Array.from(this.featuresData.values());
  }

  // Seed data for demo
  private seedData() {
    // Locations
    const locations: Location[] = [
      {
        id: 1,
        slug: "midtown",
        name: "Midtown, Atlanta",
        description: "Walk to parks, restaurants, and cultural attractions from our carefully preserved historic properties.",
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        linkText: "View Midtown Properties"
      },
      {
        id: 2,
        slug: "virginia-highland",
        name: "Virginia-Highland, Atlanta",
        description: "Experience the charm of Atlanta's most walkable neighborhood in our character-rich homes.",
        imageUrl: "https://images.unsplash.com/photo-1559329645-f27af53910c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        linkText: "View Va-Hi Properties"
      },
      {
        id: 3,
        slug: "dallas",
        name: "Dallas, Texas",
        description: "Explore our growing collection of distinctive properties in Dallas's most desirable areas.",
        imageUrl: "https://images.unsplash.com/photo-1545566239-0c4f2986d38a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        linkText: "View Dallas Properties"
      }
    ];

    // Features
    const features: Feature[] = [
      {
        id: 1,
        title: "Historic Character",
        description: "Preserved architectural details, high ceilings, and unique features that tell a story.",
        icon: "fa-landmark"
      },
      {
        id: 2,
        title: "Responsive Management",
        description: "We are a small family-owned business, providing attentive management and quick responses.",
        icon: "fa-headset"
      },
      {
        id: 3,
        title: "Modern Amenities",
        description: "Updated interiors with modern conveniences and online resident services including rent payment, applications, and leases.",
        icon: "fa-wifi"
      },
      {
        id: 4,
        title: "Prime Locations",
        description: "Walkable neighborhoods close to dining, shopping, and entertainment.",
        icon: "fa-map-marker-alt"
      }
    ];

    // Properties
    const properties: Property[] = [
      {
        id: 1,
        name: "Piedmont Park Lofts",
        description: "Historic loft apartments with original hardwood floors and exposed brick walls.",
        address: "123 Piedmont Ave, Atlanta, GA 30308",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        rent: 1800,
        available: true,
        locationId: 1,
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        features: "High ceilings, hardwood floors, exposed brick, stainless appliances"
      },
      {
        id: 2,
        name: "Highland View Apartments",
        description: "Charming 1920s building with modern updates in the heart of Virginia-Highland.",
        address: "456 N Highland Ave NE, Atlanta, GA 30306",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 850,
        rent: 1500,
        available: true,
        locationId: 2,
        imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        features: "Original moldings, updated kitchen, walk-in closet, courtyard"
      },
      {
        id: 3,
        name: "Deep Ellum Flats",
        description: "Modern apartments in a vibrant Dallas neighborhood with artsy vibes.",
        address: "789 Main St, Dallas, TX 75226",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1050,
        rent: 1650,
        available: true,
        locationId: 3,
        imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        features: "Concrete floors, open concept, balcony, fitness center"
      }
    ];

    // Populate data maps
    locations.forEach(location => this.locationsData.set(location.id, location));
    features.forEach(feature => this.featuresData.set(feature.id, feature));
    properties.forEach(property => this.propertiesData.set(property.id, property));
  }
}

// Export an instance for use throughout the application
export const storage = new MemStorage();
