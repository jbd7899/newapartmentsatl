import { Location, Property, Feature, Neighborhood, Inquiry, PropertyImage, 
  InsertLocation, InsertNeighborhood, InsertProperty, InsertFeature, InsertInquiry, InsertPropertyImage } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Locations
  getLocations(): Promise<Location[]>;
  getLocationBySlug(slug: string): Promise<Location | undefined>;
  
  // Neighborhoods
  getNeighborhoodByLocationId(locationId: number): Promise<Neighborhood | undefined>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  updateNeighborhood(id: number, data: Partial<InsertNeighborhood>): Promise<Neighborhood | undefined>;
  
  // Properties
  getProperties(): Promise<Property[]>;
  getPropertiesByLocation(locationId: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  
  // Features
  getFeatures(): Promise<Feature[]>;
  
  // Inquiries
  getInquiries(): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined>;
  
  // Property Images
  getPropertyImages(): Promise<PropertyImage[]>;
  getPropertyImagesByProperty(propertyId: number): Promise<PropertyImage[]>;
  createPropertyImage(image: InsertPropertyImage): Promise<PropertyImage>;
  updatePropertyImageOrder(id: number, displayOrder: number): Promise<PropertyImage | undefined>;
  updatePropertyImageFeatured(id: number, isFeatured: boolean): Promise<PropertyImage | undefined>;
  deletePropertyImage(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private locationsData: Map<number, Location>;
  private propertiesData: Map<number, Property>;
  private featuresData: Map<number, Feature>;
  private inquiriesData: Map<number, Inquiry>;
  private propertyImagesData: Map<number, PropertyImage>;
  private neighborhoodsData: Map<number, Neighborhood>;
  private nextInquiryId: number = 1;
  private nextPropertyImageId: number = 1;
  private nextNeighborhoodId: number = 1;

  constructor() {
    this.locationsData = new Map();
    this.propertiesData = new Map();
    this.featuresData = new Map();
    this.inquiriesData = new Map();
    this.propertyImagesData = new Map();
    this.neighborhoodsData = new Map();
    
    // Seed initial data
    this.seedData();
  }
  
  // Property Image methods
  async getPropertyImages(): Promise<PropertyImage[]> {
    return Array.from(this.propertyImagesData.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getPropertyImagesByProperty(propertyId: number): Promise<PropertyImage[]> {
    return Array.from(this.propertyImagesData.values())
      .filter(image => image.propertyId === propertyId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createPropertyImage(image: InsertPropertyImage): Promise<PropertyImage> {
    const id = this.nextPropertyImageId++;
    const createdAt = new Date();
    
    const newImage: PropertyImage = {
      id,
      propertyId: image.propertyId,
      url: image.url,
      alt: image.alt,
      displayOrder: image.displayOrder ?? 0,
      isFeatured: image.isFeatured ?? false,
      createdAt
    };
    
    this.propertyImagesData.set(id, newImage);
    return newImage;
  }

  async updatePropertyImageOrder(id: number, displayOrder: number): Promise<PropertyImage | undefined> {
    const image = this.propertyImagesData.get(id);
    if (!image) return undefined;
    
    const updatedImage: PropertyImage = {
      ...image,
      displayOrder
    };
    
    this.propertyImagesData.set(id, updatedImage);
    return updatedImage;
  }

  async updatePropertyImageFeatured(id: number, isFeatured: boolean): Promise<PropertyImage | undefined> {
    const image = this.propertyImagesData.get(id);
    if (!image) return undefined;
    
    // If setting as featured, unset any other featured image for this property
    if (isFeatured) {
      Array.from(this.propertyImagesData.values())
        .filter(img => img.propertyId === image.propertyId && img.isFeatured && img.id !== id)
        .forEach(img => {
          this.propertyImagesData.set(img.id, {
            ...img,
            isFeatured: false
          });
        });
    }
    
    const updatedImage: PropertyImage = {
      ...image,
      isFeatured
    };
    
    this.propertyImagesData.set(id, updatedImage);
    return updatedImage;
  }

  async deletePropertyImage(id: number): Promise<boolean> {
    return this.propertyImagesData.delete(id);
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
  
  // Neighborhood methods
  async getNeighborhoodByLocationId(locationId: number): Promise<Neighborhood | undefined> {
    return Array.from(this.neighborhoodsData.values()).find(
      neighborhood => neighborhood.locationId === locationId
    );
  }
  
  async createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const id = this.nextNeighborhoodId++;
    const createdAt = new Date();
    
    const newNeighborhood: Neighborhood = {
      id,
      locationId: neighborhood.locationId,
      mapImageUrl: neighborhood.mapImageUrl || null,
      highlights: neighborhood.highlights || null,
      attractions: neighborhood.attractions || null,
      transportationInfo: neighborhood.transportationInfo || null,
      diningOptions: neighborhood.diningOptions || null,
      schoolsInfo: neighborhood.schoolsInfo || null,
      parksAndRecreation: neighborhood.parksAndRecreation || null,
      historicalInfo: neighborhood.historicalInfo || null,
      // Explore section
      exploreDescription: neighborhood.exploreDescription || null,
      exploreMapUrl: neighborhood.exploreMapUrl || null,
      exploreHotspots: neighborhood.exploreHotspots || null,
      createdAt
    };
    
    this.neighborhoodsData.set(id, newNeighborhood);
    return newNeighborhood;
  }
  
  async updateNeighborhood(id: number, data: Partial<InsertNeighborhood>): Promise<Neighborhood | undefined> {
    const neighborhood = this.neighborhoodsData.get(id);
    if (!neighborhood) return undefined;
    
    const updatedNeighborhood: Neighborhood = {
      ...neighborhood,
      ...data
    };
    
    this.neighborhoodsData.set(id, updatedNeighborhood);
    return updatedNeighborhood;
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

  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiriesData.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.nextInquiryId++;
    const createdAt = new Date();
    
    const newInquiry: Inquiry = {
      id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || null,
      message: inquiry.message,
      propertyId: inquiry.propertyId || null,
      propertyName: inquiry.propertyName || null,
      createdAt,
      status: inquiry.status || "new"
    };
    
    this.inquiriesData.set(id, newInquiry);
    return newInquiry;
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined> {
    const inquiry = this.inquiriesData.get(id);
    if (!inquiry) return undefined;
    
    const updatedInquiry: Inquiry = {
      ...inquiry,
      status
    };
    
    this.inquiriesData.set(id, updatedInquiry);
    return updatedInquiry;
  }

  // Seed method to populate initial data
  private seedData() {
    // Locations
    const locations: Location[] = [
      {
        id: 1,
        slug: "midtown",
        name: "Midtown, Atlanta",
        description: "Experience the heart of Atlanta's cultural scene with walkable streets, iconic museums, and vibrant entertainment.",
        imageUrl: "https://i.imgur.com/Mje87Pl.jpg",
        linkText: "Explore Midtown"
      },
      {
        id: 2,
        slug: "virginia-highland",
        name: "Virginia-Highland, Atlanta",
        description: "Discover charming tree-lined streets with historic homes and a vibrant village atmosphere of shops and restaurants.",
        imageUrl: "https://i.imgur.com/9vYJtfa.jpg",
        linkText: "Explore Virginia-Highland"
      },
      {
        id: 3,
        slug: "dallas",
        name: "Dallas, Texas",
        description: "Experience urban living with Texas charm in one of America's most dynamic and growing metropolitan areas.",
        imageUrl: "https://i.imgur.com/1NRwYIo.jpg",
        linkText: "Explore Dallas"
      }
    ];
    
    for (const location of locations) {
      this.locationsData.set(location.id, location);
    }
    
    // Features
    const features: Feature[] = [
      {
        id: 1,
        title: "Historic Character",
        description: "Our properties maintain their historic charm while providing modern comfort.",
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
    
    for (const feature of features) {
      this.featuresData.set(feature.id, feature);
    }
    
    // Properties - all with null rent values
    const properties: Property[] = [
      // Midtown Properties
      {
        id: 1,
        name: "253 14th St NE",
        description: "Charming apartments near Piedmont Park. Prime location on quiet 14th Street, just steps from Atlanta's largest greenspace and the bustling Midtown Mile. Walking distance to the High Museum and Colony Square's shopping and dining.",
        address: "253 14th St NE, Atlanta, GA 30309",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1000,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/O9Fu46o.png",
        features: "Hardwood floors, updated appliances, large windows, central AC"
      },
      {
        id: 2,
        name: "965 Myrtle St NE",
        description: "Historic building with modern comforts. Located on tree-lined Myrtle Street, walking distance to the Atlanta Botanical Garden and Piedmont Park. Minutes from Georgia Tech campus and Midtown MARTA station.",
        address: "965 Myrtle St NE, Atlanta, GA 30309",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 850,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/9L78Ghe.png",
        features: "Historic details, updated kitchen, period moldings, high ceilings"
      },
      {
        id: 3,
        name: "903 Myrtle St NE",
        description: "Quiet living in the heart of Midtown. Perfectly positioned between Piedmont Park and Georgia Tech, with easy access to the Midtown Arts District. Steps from popular restaurants and the 10th Street MARTA station.",
        address: "903 Myrtle St NE, Atlanta, GA 30309",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/Qt30zdg.png",
        features: "Renovated bathroom, original details, shared garden, quiet street"
      },
      {
        id: 4,
        name: "721 Argonne Ave NE",
        description: "Spacious apartments with modern upgrades. Situated on peaceful Argonne Avenue, just blocks from Piedmont Park and the Atlanta BeltLine's Eastside Trail. Quick access to both Tech Square and the Fox Theatre entertainment district.",
        address: "721 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1100,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/eFdi7sd.jpg",
        features: "Updated kitchen, modern appliances, spacious closets, pet-friendly"
      },
      {
        id: 5,
        name: "717 Argonne Ave NE",
        description: "Cozy apartments in a lively neighborhood. Located on charming Argonne Avenue, walking distance to Piedmont Park's recreational amenities and events. Minutes from Midtown's arts venues and Ponce City Market.",
        address: "717 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 800,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/ASrp6Cl.jpg",
        features: "Cozy layout, on-site laundry, hardwood floors, exposed brick"
      },
      {
        id: 6,
        name: "718 Argonne Ave NE",
        description: "Historic charm meets modern living. Nestled on quiet Argonne Avenue, steps from the Midtown Arts District and numerous coffee shops. Easy access to both the BeltLine and Piedmont Park's weekend farmers market.",
        address: "718 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/DI66TQ0.png",
        features: "Historic building, renovated interior, original woodwork, large windows"
      },
      {
        id: 7,
        name: "769 Argonne Ave NE",
        description: "Comfortable apartments near local hotspots. Located on tree-lined Argonne Avenue, close to Piedmont Park's active lifestyle amenities and cultural events. Walking distance to the High Museum and Atlanta Symphony Orchestra.",
        address: "769 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 775,
        rent: null,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/CGq20NX.png",
        features: "Recently updated, bright spaces, outdoor patio, community garden"
      },
      
      // Virginia-Highland Properties
      {
        id: 8,
        name: "1031 Lanier Blvd NE",
        description: "Classic style in the heart of Virginia Highland. Located on tree-lined Lanier Boulevard, just steps from the vibrant N. Highland Avenue shopping and dining district. Walking distance to Piedmont Park and the Atlanta BeltLine's Eastside Trail.",
        address: "1031 Lanier Blvd NE, Atlanta, GA 30306",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1050,
        rent: null,
        available: true,
        locationId: 2,
        imageUrl: "https://i.imgur.com/OWMqzbK.png",
        features: "Classic architectural details, modern kitchen, hardwood floors, large windows"
      },
      {
        id: 9,
        name: "869 St Charles Ave NE",
        description: "Historic architecture with modern comforts. Nestled on quiet St. Charles Avenue, just two blocks from the renowned Murphy's restaurant and Virginia Highland's boutique shopping. Minutes from both Freedom Park Trail and the Carter Center.",
        address: "869 St Charles Ave NE, Atlanta, GA 30306",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 900,
        rent: null,
        available: true,
        locationId: 2,
        imageUrl: "https://i.imgur.com/Qqrynp5.png",
        features: "Historic building, renovated interior, high ceilings, restored details"
      },
      {
        id: 10,
        name: "823 Greenwood Ave NE",
        description: "Peaceful living steps from local dining. Located on charming Greenwood Avenue, walking distance to Ponce City Market and the Atlanta BeltLine. Easy access to Virginia Highland's coffee shops and parks, with quick commutes to Emory and downtown.",
        address: "823 Greenwood Ave NE, Atlanta, GA 30306",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1150,
        rent: null,
        available: true,
        locationId: 2,
        imageUrl: "https://i.imgur.com/GQPUMr8.png",
        features: "Newly renovated, spacious layout, private patio, pet-friendly"
      },
      
      // Dallas Properties
      {
        id: 11,
        name: "4806 Live Oak St",
        description: "Modern living in the heart of Dallas. Located in the historic Bryan Place neighborhood, walking distance to Deep Ellum's entertainment district and the Dallas Farmers Market. Easy access to both I-75 and I-30 makes commuting a breeze.",
        address: "4806 Live Oak St, Dallas, TX 75214",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1100,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/psQEwWF.jpg",
        features: "Modern finishes, open concept, stainless appliances, hardwood floors"
      },
      {
        id: 12,
        name: "6212 Martel Ave",
        description: "Charming home in a peaceful neighborhood. Situated in the desirable M Streets area, known for its historic Tudor-style homes and tree-lined streets. Minutes from SMU campus and the shops and restaurants along Greenville Avenue.",
        address: "6212 Martel Ave, Dallas, TX 75214",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1450,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/gsremPD.jpg",
        features: "Tudor-style architecture, updated interior, backyard, garage parking"
      },
      {
        id: 13,
        name: "6463 Trammel Dr",
        description: "Charming home in a peaceful neighborhood. Located in the historic Wilshire Heights area, known for its charming architecture and close-knit community. Just minutes from Knox-Henderson and Mockingbird Station, with easy access to US-75.",
        address: "6463 Trammel Dr, Dallas, TX 75214",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1250,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/GmGrXBV.jpg",
        features: "Original hardwoods, updated kitchen, fenced yard, covered porch"
      },
      {
        id: 14,
        name: "4417 Sycamore St",
        description: "Historic charm with modern amenities. Nestled in the heart of Old East Dallas, walking distance to popular Munger Place Historic District and Peak's Addition. Minutes from Baylor Medical Center and downtown Dallas via I-30.",
        address: "4417 Sycamore St, Dallas, TX 75204",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1000,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/P62glux.jpg",
        features: "Historic character, modern updates, energy-efficient appliances, large porch"
      },
      {
        id: 15,
        name: "6236 Winton St",
        description: "Beautiful home with contemporary design. Located in the family-friendly Greenville Avenue area, just blocks from trendy Lower Greenville's restaurants and nightlife. Quick access to US-75 and Mockingbird Station make commuting simple.",
        address: "6236 Winton St, Dallas, TX 75214",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/Pw0RRJ6.jpg",
        features: "Contemporary design, open floor plan, modern kitchen, outdoor space"
      },
      {
        id: 16,
        name: "6646 E Lovers Ln",
        description: "Elegant living near shopping and dining. Situated in the desirable Lakewood/Lake Highlands area, minutes from White Rock Lake and the Dallas Arboretum. Convenient access to Northwest Highway and Skillman Street for easy commuting.",
        address: "6646 E Lovers Ln, Dallas, TX 75214",
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 1800,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/5QfQiJD.png",
        features: "Upscale finishes, gourmet kitchen, private yard, garage"
      },
      {
        id: 17,
        name: "5503 Winton St",
        description: "Charming home with modern upgrades. Located in the heart of the M Streets neighborhood, walking distance to Greenville Avenue's best restaurants and bars. Just minutes from both SMU campus and White Rock Lake recreational areas.",
        address: "5503 Winton St, Dallas, TX 75206",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/ZC9OEET.jpg",
        features: "Character-rich details, updated systems, mature landscaping, sunroom"
      },
      {
        id: 18,
        name: "5501 Winton St",
        description: "Comfortable living in a prime location. Situated in the popular M Streets area, known for its charming architecture and community feel. Minutes from Knox-Henderson's boutique shopping and dining scene.",
        address: "5501 Winton St, Dallas, TX 75206",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1100,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/KyxXN2C.jpg",
        features: "Original woodwork, updated bathroom, eat-in kitchen, front porch"
      },
      {
        id: 19,
        name: "1015 Cameron Ave",
        description: "Spacious home with contemporary finishes. Steps from Hollywood Heights and the Santa Fe Trail, with Tennyson Park right around the corner. Easy access to White Rock Lake and the vibrant Lakewood shopping district.",
        address: "1015 Cameron Ave, Dallas, TX 75223",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1650,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/kQrkgX6.jpg",
        features: "Modern finishes, open concept, large windows, outdoor entertainment area"
      },
      {
        id: 20,
        name: "615 Parkview Ave",
        description: "Cozy near local parks and bustling Dallas districts. Steps from Hollywood Heights and the Santa Fe Trail, with easy access to Tennyson Park and its recreational amenities. Minutes from both White Rock Lake and the Lakewood shopping district.",
        address: "615 Parkview Ave, Dallas, TX 75223",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/eER5hbA.jpg",
        features: "Cozy layout, updated kitchen, private backyard, walking distance to parks"
      },
      {
        id: 21,
        name: "915 Grigsby Ave",
        description: "Modern living in a quiet neighborhood. Ideally situated near the historic Swiss Avenue District, just steps from bustling Lower Greenville's restaurants and entertainment. Minutes from Baylor Medical Center and downtown Dallas, with easy access to I-75 and Live Oak Street's direct route to the city center.",
        address: "915 Grigsby Ave, Dallas, TX 75204",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1250,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/Mzh4Dn2.jpg",
        features: "Completely renovated, premium finishes, open floor plan, private patio"
      },
      {
        id: 22,
        name: "1900 Lucille Ave",
        description: "Contemporary living in a prime location. Situated in the vibrant East Village neighborhood, walking distance to both Knox-Henderson and Lower Greenville's entertainment districts. Minutes from Cityplace/Uptown Station with easy access to downtown Dallas.",
        address: "1900 Lucille Ave, Dallas, TX 75214",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1150,
        rent: null,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/cOicEI4.png",
        features: "Contemporary design, energy-efficient, gourmet kitchen, private balcony"
      }
    ];
    
    for (const property of properties) {
      this.propertiesData.set(property.id, property);
    }
    
    // Sample inquiries for demo
    const inquiries: Inquiry[] = [
      {
        id: 1,
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "404-555-1234",
        message: "I'm interested in the 253 14th St NE property. Is it still available for the first week of next month?",
        propertyId: 1,
        propertyName: "253 14th St NE",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: "new"
      },
      {
        id: 2,
        name: "Emily Johnson",
        email: "emily.johnson@example.com",
        phone: "404-555-6789",
        message: "Hello, I'd like to schedule a viewing of the property on Myrtle St. Is it possible to see it this weekend?",
        propertyId: 2,
        propertyName: "965 Myrtle St NE",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: "contacted"
      },
      {
        id: 3,
        name: "Michael Brown",
        email: "michael.brown@example.com",
        phone: "214-555-4321",
        message: "I have questions about the pet policy for the Dallas property on Live Oak St. Do you allow small dogs?",
        propertyId: 11,
        propertyName: "4806 Live Oak St",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: "new"
      },
      {
        id: 4,
        name: "Sarah Davis",
        email: "sarah.davis@example.com",
        phone: "404-555-8765",
        message: "I'm relocating to Atlanta next month and interested in the Virginia Highland neighborhood. Can you tell me more about the available properties there?",
        propertyId: null,
        propertyName: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: "resolved"
      },
      {
        id: 5,
        name: "David Wilson",
        email: "david.wilson@example.com",
        phone: "214-555-9876",
        message: "Hi, I'm interested in the Martel Ave property. What utilities are included in the rent?",
        propertyId: 12,
        propertyName: "6212 Martel Ave",
        createdAt: new Date(), // today
        status: "new"
      }
    ];
    
    for (const inquiry of inquiries) {
      this.inquiriesData.set(inquiry.id, inquiry);
    }
    
    // Set the next inquiry ID based on our seed data
    this.nextInquiryId = inquiries.length + 1;
    
    // Neighborhoods data
    const neighborhoods: Neighborhood[] = [
      {
        id: 1,
        locationId: 1, // Midtown
        mapImageUrl: "https://i.imgur.com/rXMUihK.png", // Example map image
        highlights: "Midtown Atlanta is known for its vibrant arts scene, walkable streets, and iconic skyline views. Home to the Fox Theatre, High Museum of Art, and Piedmont Park.",
        attractions: "High Museum of Art, Fox Theatre, Atlanta Botanical Garden, Piedmont Park, Margaret Mitchell House, Center for Puppetry Arts",
        transportationInfo: "Served by MARTA with stations at Midtown, Arts Center, and North Avenue. Multiple bus routes and access to the Atlanta BeltLine's Eastside Trail. Bike-friendly streets and scooter rentals available throughout the area.",
        diningOptions: "Diverse dining scene from casual cafes to upscale restaurants. Notable spots include Empire State South, The Varsity, South City Kitchen, and numerous international cuisine options along Juniper Street and Peachtree Street.",
        schoolsInfo: "Served by Atlanta Public Schools. Notable institutions include Centennial Academy and Midtown International School. Georgia Tech's campus borders the western edge of Midtown.",
        parksAndRecreation: "Piedmont Park offers 185 acres of green space with walking trails, sports facilities, and frequent events. Atlanta Botanical Garden showcases unique plant collections and seasonal exhibitions.",
        historicalInfo: "Originally developed in the early 20th century, Midtown fell into decline in the 1970s before experiencing revitalization beginning in the 1990s. Historic landmarks include the Fox Theatre (1929) and Margaret Mitchell House.",
        exploreDescription: "Midtown Atlanta offers the perfect blend of culture, dining, and recreation. Explore the area's top attractions, green spaces, and local hotspots.",
        exploreMapUrl: "https://www.google.com/maps/d/u/0/embed?mid=1XLv06Buip8bENLqmPSeiPE9ehpdzfQY&ehbc=2E312F&noprof=1",
        exploreHotspots: JSON.stringify([
          {
            name: "High Museum of Art",
            description: "Renowned museum featuring a diverse collection of classic and contemporary art.",
            location: { lat: 33.7901, lng: -84.3851 },
            imageUrl: "https://i.imgur.com/sdHC6Hr.jpg"
          },
          {
            name: "Piedmont Park",
            description: "Atlanta's premier green space offering trails, recreational facilities, and stunning city views.",
            location: { lat: 33.7851, lng: -84.3736 },
            imageUrl: "https://i.imgur.com/bAy8idc.jpg"
          },
          {
            name: "Fox Theatre",
            description: "Historic venue hosting concerts, Broadway shows, and cultural performances.",
            location: { lat: 33.7726, lng: -84.3857 },
            imageUrl: "https://i.imgur.com/Hxs8rIi.jpg"
          }
        ]),
        createdAt: new Date()
      },
      {
        id: 2,
        locationId: 2, // Virginia-Highland
        mapImageUrl: "https://i.imgur.com/SRYHIcL.jpg", // Example map image
        highlights: "Virginia-Highland is characterized by its charming bungalows, tree-lined streets, and walkable village centers with boutique shopping and local restaurants.",
        attractions: "John Howell Park, Virginia-Highland commercial district, Callanwolde Fine Arts Center, Jimmy Carter Presidential Library, Plaza Theatre",
        transportationInfo: "Closest MARTA stations are Midtown and Lindbergh Center. Multiple bus routes serve the area. Very walkable neighborhood with easy access to the Atlanta BeltLine's Eastside Trail.",
        diningOptions: "Known for its eclectic dining scene. Popular spots include Murphy's, La Tavola, Atkins Park, and numerous casual cafes and pubs clustered around the Virginia and Highland Avenue intersection.",
        schoolsInfo: "Served by Atlanta Public Schools, including Springdale Park Elementary and Inman Middle School. Several private school options nearby.",
        parksAndRecreation: "John Howell Park features recreational fields and a playground. Close proximity to Piedmont Park and the Atlanta BeltLine. Orme Park offers a quieter green space with a creek and walking paths.",
        historicalInfo: "Developed primarily in the early 20th century as a streetcar suburb. Named for the intersection of Virginia and Highland Avenues. Many homes date to the 1910s-1930s and showcase Craftsman architecture.",
        exploreDescription: "Virginia-Highland combines historic charm with modern amenities. Discover local shops, parks, and dining in this walkable Atlanta neighborhood.",
        exploreMapUrl: "https://www.google.com/maps/d/u/0/embed?mid=1mLjD6MgRd5Cq3tRresLx63wYe01d600&ehbc=2E312F&noprof=1",
        exploreHotspots: JSON.stringify([
          {
            name: "Murphy's Restaurant",
            description: "Neighborhood institution serving upscale comfort food in a cozy setting.",
            location: { lat: 33.7806, lng: -84.3526 },
            imageUrl: "https://i.imgur.com/Ml1Ld5k.jpg"
          },
          {
            name: "Virginia Highland Shopping District",
            description: "Charming collection of boutiques, restaurants, and local businesses.",
            location: { lat: 33.7814, lng: -84.3520 },
            imageUrl: "https://i.imgur.com/mmnSr5n.jpg"
          },
          {
            name: "John Howell Park",
            description: "Neighborhood green space with athletic fields and community events.",
            location: { lat: 33.7828, lng: -84.3535 },
            imageUrl: "https://i.imgur.com/oJc1dRE.jpg"
          }
        ]),
        createdAt: new Date()
      }
    ];
    
    for (const neighborhood of neighborhoods) {
      this.neighborhoodsData.set(neighborhood.id, neighborhood);
    }
    
    // Set the next neighborhood ID based on our seed data
    this.nextNeighborhoodId = neighborhoods.length + 1;
    
    // Property Images
    const propertyImages: PropertyImage[] = [
      // Property 1 images
      {
        id: 1,
        propertyId: 1,
        url: "https://i.imgur.com/O9Fu46o.png",
        alt: "Front view of 253 14th St NE",
        displayOrder: 0,
        isFeatured: true,
        createdAt: new Date()
      },
      {
        id: 2,
        propertyId: 1,
        url: "https://i.imgur.com/F8elHoj.jpg",
        alt: "Living room of 253 14th St NE",
        displayOrder: 1,
        isFeatured: false,
        createdAt: new Date()
      },
      {
        id: 3,
        propertyId: 1,
        url: "https://i.imgur.com/qR3CzRz.jpg",
        alt: "Kitchen of 253 14th St NE",
        displayOrder: 2,
        isFeatured: false,
        createdAt: new Date()
      },
      
      // Property 2 images
      {
        id: 4,
        propertyId: 2,
        url: "https://i.imgur.com/9L78Ghe.png",
        alt: "Front view of 965 Myrtle St NE",
        displayOrder: 0,
        isFeatured: true,
        createdAt: new Date()
      },
      {
        id: 5,
        propertyId: 2,
        url: "https://i.imgur.com/GFtN8CD.jpg",
        alt: "Bedroom of 965 Myrtle St NE",
        displayOrder: 1,
        isFeatured: false,
        createdAt: new Date()
      }
    ];
    
    for (const image of propertyImages) {
      this.propertyImagesData.set(image.id, image);
    }
    
    // Set the next property image ID based on our seed data
    this.nextPropertyImageId = propertyImages.length + 1;
  }
}

export const storage = new MemStorage();