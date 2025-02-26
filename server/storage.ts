import { 
  locations, properties, features, inquiries,
  type Location, type InsertLocation, 
  type Property, type InsertProperty,
  type Feature, type InsertFeature,
  type Inquiry, type InsertInquiry
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
  
  // Inquiries
  getInquiries(): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private locationsData: Map<number, Location>;
  private propertiesData: Map<number, Property>;
  private featuresData: Map<number, Feature>;
  private inquiriesData: Map<number, Inquiry>;
  private nextInquiryId: number = 1;

  constructor() {
    this.locationsData = new Map();
    this.propertiesData = new Map();
    this.featuresData = new Map();
    this.inquiriesData = new Map();
    
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
  
  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiriesData.values()).sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.nextInquiryId++;
    const createdAt = new Date();
    
    // Ensure all required fields are present with proper defaults
    const newInquiry: Inquiry = {
      id,
      name: inquiry.name,
      email: inquiry.email,
      message: inquiry.message,
      phone: inquiry.phone || null,
      propertyId: inquiry.propertyId || null,
      propertyName: inquiry.propertyName || null,
      status: inquiry.status || "new",
      createdAt
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

  // Seed data for demo
  private seedData() {
    // Locations
    const locations: Location[] = [
      {
        id: 1,
        slug: "midtown",
        name: "Midtown, Atlanta",
        description: "Walk to parks, restaurants, and cultural attractions from our carefully preserved historic properties.",
        imageUrl: "https://i.imgur.com/THKfFjB.png",
        linkText: "View Midtown Properties"
      },
      {
        id: 2,
        slug: "virginia-highland",
        name: "Virginia-Highland, Atlanta",
        description: "Experience the charm of Atlanta's most walkable neighborhood in our character-rich homes.",
        imageUrl: "https://i.imgur.com/xHkf2HL.jpg",
        linkText: "View Va-Hi Properties"
      },
      {
        id: 3,
        slug: "dallas",
        name: "Dallas, Texas",
        description: "Explore our growing collection of distinctive properties in Dallas's most desirable areas.",
        imageUrl: "https://i.imgur.com/dMU0oEE.jpg",
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
      // Midtown Properties
      {
        id: 1,
        name: "253 14th St NE",
        description: "Charming apartments near Piedmont Park. Prime location on quiet 14th Street, just steps from Atlanta's largest greenspace and the bustling Midtown Mile. Walking distance to the High Museum and Colony Square's shopping and dining.",
        address: "253 14th St NE, Atlanta, GA 30309",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1000,
        rent: 1750,
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
        rent: 1550,
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
        rent: 1650,
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
        rent: 1850,
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
        rent: 1500,
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
        rent: 1650,
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
        rent: 1475,
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
        rent: 1800,
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
        rent: 1600,
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
        rent: 1900,
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
        rent: 1750,
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
        rent: 2200,
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
        rent: 1950,
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
        rent: 1700,
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
        rent: 2300,
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
        rent: 2600,
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
        rent: 1850,
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
        rent: 1750,
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
        rent: 2400,
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
        rent: 1600,
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
        rent: 1950,
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
        rent: 1850,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/cOicEI4.png",
        features: "Contemporary design, energy-efficient, gourmet kitchen, private balcony"
      }
    ];

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
    
    // Set the next inquiry ID based on our seed data
    this.nextInquiryId = inquiries.length + 1;

    // Populate data maps
    locations.forEach(location => this.locationsData.set(location.id, location));
    features.forEach(feature => this.featuresData.set(feature.id, feature));
    properties.forEach(property => this.propertiesData.set(property.id, property));
    inquiries.forEach(inquiry => this.inquiriesData.set(inquiry.id, inquiry));
  }
}

// Export an instance for use throughout the application
export const storage = new MemStorage();
