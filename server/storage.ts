import { 
  locations, properties, features, inquiries, propertyImages, neighborhoods,
  propertyUnits, unitImages,
  type Location, type InsertLocation, 
  type Property, type InsertProperty,
  type Feature, type InsertFeature,
  type Inquiry, type InsertInquiry,
  type PropertyImage, type InsertPropertyImage,
  type Neighborhood, type InsertNeighborhood,
  type PropertyUnit, type InsertPropertyUnit,
  type UnitImage, type InsertUnitImage
} from "@shared/schema";

// Storage Interface
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
  updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined>;
  
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
  
  // Property Units
  getPropertyUnits(propertyId: number): Promise<PropertyUnit[]>;
  getPropertyUnit(id: number): Promise<PropertyUnit | undefined>;
  createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit>;
  updatePropertyUnit(id: number, data: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined>;
  deletePropertyUnit(id: number): Promise<boolean>;
  
  // Unit Images
  getUnitImages(unitId: number): Promise<UnitImage[]>;
  createUnitImage(image: InsertUnitImage): Promise<UnitImage>;
  updateUnitImageOrder(id: number, displayOrder: number): Promise<UnitImage | undefined>;
  updateUnitImageFeatured(id: number, isFeatured: boolean): Promise<UnitImage | undefined>;
  deleteUnitImage(id: number): Promise<boolean>;

  // Add method to get a single property image by ID
  getPropertyImage(id: number): Promise<PropertyImage | undefined>;

  // Add method to get a single unit image by ID
  getUnitImage(id: number): Promise<UnitImage | undefined>;

  // Add method to get all property units
  getAllPropertyUnits(): Promise<PropertyUnit[]>;
  
  // Image Storage (Object Storage Integration)
  saveImageData(data: InsertImageStorage): Promise<ImageStorage>;
  getImageDataByObjectKey(objectKey: string): Promise<ImageStorage | undefined>;
  deleteImageDataByObjectKey(objectKey: string): Promise<boolean>;
  getAllStoredImages(): Promise<ImageStorage[]>;
  
  // Update methods to use objectKey instead of URL
  updatePropertyImageObjectKey(id: number, objectKey: string): Promise<PropertyImage | undefined>;
  updateUnitImageObjectKey(id: number, objectKey: string): Promise<UnitImage | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private locationsData: Map<number, Location>;
  private propertiesData: Map<number, Property>;
  private featuresData: Map<number, Feature>;
  private inquiriesData: Map<number, Inquiry>;
  private propertyImagesData: Map<number, PropertyImage>;
  private neighborhoodsData: Map<number, Neighborhood>;
  private propertyUnitsData: Map<number, PropertyUnit>;
  private unitImagesData: Map<number, UnitImage>;
  private nextInquiryId: number = 1;
  private nextPropertyImageId: number = 1;
  private nextNeighborhoodId: number = 1;
  private nextPropertyUnitId: number = 1;
  private nextUnitImageId: number = 1;

  constructor() {
    this.locationsData = new Map();
    this.propertiesData = new Map();
    this.featuresData = new Map();
    this.inquiriesData = new Map();
    this.propertyImagesData = new Map();
    this.neighborhoodsData = new Map();
    this.propertyUnitsData = new Map();
    this.unitImagesData = new Map();
    
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
      objectKey: image.objectKey,
      alt: image.alt,
      displayOrder: image.displayOrder ?? 0,
      isFeatured: image.isFeatured ?? false,
      mimeType: image.mimeType ?? null,
      size: image.size ?? null,
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
  
  async updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.propertiesData.get(id);
    if (!property) return undefined;
    
    const updatedProperty: Property = {
      ...property,
      ...data
    };
    
    this.propertiesData.set(id, updatedProperty);
    return updatedProperty;
  }
  
  // Property Units methods
  async getPropertyUnits(propertyId: number): Promise<PropertyUnit[]> {
    return Array.from(this.propertyUnitsData.values())
      .filter(unit => unit.propertyId === propertyId)
      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
  }
  
  async getPropertyUnit(id: number): Promise<PropertyUnit | undefined> {
    return this.propertyUnitsData.get(id);
  }
  
  async createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit> {
    const id = this.nextPropertyUnitId++;
    const createdAt = new Date();
    
    const newUnit: PropertyUnit = {
      id,
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      sqft: unit.sqft,
      rent: unit.rent ?? null,
      available: unit.available ?? true,
      description: unit.description || "",
      features: unit.features || "",
      createdAt
    };
    
    this.propertyUnitsData.set(id, newUnit);
    return newUnit;
  }
  
  async updatePropertyUnit(id: number, data: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined> {
    const unit = this.propertyUnitsData.get(id);
    if (!unit) return undefined;
    
    const updatedUnit: PropertyUnit = {
      ...unit,
      ...data
    };
    
    this.propertyUnitsData.set(id, updatedUnit);
    return updatedUnit;
  }
  
  async deletePropertyUnit(id: number): Promise<boolean> {
    // Delete associated unit images first
    Array.from(this.unitImagesData.values())
      .filter(image => image.unitId === id)
      .forEach(image => this.unitImagesData.delete(image.id));
    
    return this.propertyUnitsData.delete(id);
  }
  
  // Unit Images methods
  async getUnitImages(unitId: number): Promise<UnitImage[]> {
    return Array.from(this.unitImagesData.values())
      .filter(image => image.unitId === unitId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }
  
  async createUnitImage(image: InsertUnitImage): Promise<UnitImage> {
    const id = this.nextUnitImageId++;
    const createdAt = new Date();
    
    const newImage: UnitImage = {
      id,
      unitId: image.unitId,
      objectKey: image.objectKey,
      alt: image.alt,
      displayOrder: image.displayOrder ?? 0,
      isFeatured: image.isFeatured ?? false,
      mimeType: image.mimeType ?? null,
      size: image.size ?? null,
      createdAt
    };
    
    this.unitImagesData.set(id, newImage);
    return newImage;
  }
  
  async updateUnitImageOrder(id: number, displayOrder: number): Promise<UnitImage | undefined> {
    const image = this.unitImagesData.get(id);
    if (!image) return undefined;
    
    const updatedImage: UnitImage = {
      ...image,
      displayOrder
    };
    
    this.unitImagesData.set(id, updatedImage);
    return updatedImage;
  }
  
  async updateUnitImageFeatured(id: number, isFeatured: boolean): Promise<UnitImage | undefined> {
    const image = this.unitImagesData.get(id);
    if (!image) return undefined;
    
    // If setting as featured, unset any other featured image for this unit
    if (isFeatured) {
      Array.from(this.unitImagesData.values())
        .filter(img => img.unitId === image.unitId && img.isFeatured && img.id !== id)
        .forEach(img => {
          this.unitImagesData.set(img.id, {
            ...img,
            isFeatured: false
          });
        });
    }
    
    const updatedImage: UnitImage = {
      ...image,
      isFeatured
    };
    
    this.unitImagesData.set(id, updatedImage);
    return updatedImage;
  }
  
  async deleteUnitImage(id: number): Promise<boolean> {
    return this.unitImagesData.delete(id);
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
    // Initialize collections
    this.propertyImagesData = new Map();
    this.propertyUnitsData = new Map();
    this.unitImagesData = new Map();
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
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/O9Fu46o.png",
        features: "Hardwood floors, updated appliances, large windows, central AC",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 4
      },
      {
        id: 2,
        name: "965 Myrtle St NE",
        description: "Historic building with modern comforts. Located on tree-lined Myrtle Street, walking distance to the Atlanta Botanical Garden and Piedmont Park. Minutes from Georgia Tech campus and Midtown MARTA station.",
        address: "965 Myrtle St NE, Atlanta, GA 30309",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 850,
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/9L78Ghe.png",
        features: "Historic details, updated kitchen, period moldings, high ceilings",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 4
      },
      {
        id: 3,
        name: "903 Myrtle St NE",
        description: "Quiet living in the heart of Midtown. Perfectly positioned between Piedmont Park and Georgia Tech, with easy access to the Midtown Arts District. Steps from popular restaurants and the 10th Street MARTA station.",
        address: "903 Myrtle St NE, Atlanta, GA 30309",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/Qt30zdg.png",
        features: "Renovated bathroom, original details, shared garden, quiet street",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 4
      },
      {
        id: 4,
        name: "721 Argonne Ave NE",
        description: "Spacious apartments with modern upgrades. Situated on peaceful Argonne Avenue, just blocks from Piedmont Park and the Atlanta BeltLine's Eastside Trail. Quick access to both Tech Square and the Fox Theatre entertainment district.",
        address: "721 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1100,
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/eFdi7sd.jpg",
        features: "Updated kitchen, modern appliances, spacious closets, pet-friendly",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 6
      },
      {
        id: 5,
        name: "717 Argonne Ave NE",
        description: "Cozy apartments in a lively neighborhood. Located on charming Argonne Avenue, walking distance to Piedmont Park's recreational amenities and events. Minutes from Midtown's arts venues and Ponce City Market.",
        address: "717 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 800,
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/ASrp6Cl.jpg",
        features: "Cozy layout, on-site laundry, hardwood floors, exposed brick",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 8
      },
      {
        id: 6,
        name: "718 Argonne Ave NE",
        description: "Historic charm meets modern living. Nestled on quiet Argonne Avenue, steps from the Midtown Arts District and numerous coffee shops. Easy access to both the BeltLine and Piedmont Park's weekend farmers market.",
        address: "718 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/DI66TQ0.png",
        features: "Historic building, renovated interior, original woodwork, large windows",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 4
      },
      {
        id: 7,
        name: "769 Argonne Ave NE",
        description: "Comfortable apartments near local hotspots. Located on tree-lined Argonne Avenue, close to Piedmont Park's active lifestyle amenities and cultural events. Walking distance to the High Museum and Atlanta Symphony Orchestra.",
        address: "769 Argonne Ave NE, Atlanta, GA 30308",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 775,
        rent: 0,
        available: true,
        locationId: 1,
        imageUrl: "https://i.imgur.com/CGq20NX.png",
        features: "Recently updated, bright spaces, outdoor patio, community garden",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 6
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
        rent: 0,
        available: true,
        locationId: 2,
        imageUrl: "https://i.imgur.com/OWMqzbK.png",
        features: "Classic architectural details, modern kitchen, hardwood floors, large windows",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 9,
        name: "869 St Charles Ave NE",
        description: "Historic architecture with modern comforts. Nestled on quiet St. Charles Avenue, just two blocks from the renowned Murphy's restaurant and Virginia Highland's boutique shopping. Minutes from both Freedom Park Trail and the Carter Center.",
        address: "869 St Charles Ave NE, Atlanta, GA 30306",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 900,
        rent: 0,
        available: true,
        locationId: 2,
        imageUrl: "https://i.imgur.com/Qqrynp5.png",
        features: "Historic building, renovated interior, high ceilings, restored details",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 4
      },
      {
        id: 10,
        name: "823 Greenwood Ave NE",
        description: "Peaceful living steps from local dining. Located on charming Greenwood Avenue, walking distance to Ponce City Market and the Atlanta BeltLine. Easy access to Virginia Highland's coffee shops and parks, with quick commutes to Emory and downtown.",
        address: "823 Greenwood Ave NE, Atlanta, GA 30306",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1150,
        rent: 0,
        available: true,
        locationId: 2,
        imageUrl: "https://i.imgur.com/GQPUMr8.png",
        features: "Newly renovated, spacious layout, private patio, pet-friendly",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
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
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/psQEwWF.jpg",
        features: "Modern finishes, open concept, stainless appliances, hardwood floors",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 8
      },
      {
        id: 12,
        name: "6212 Martel Ave",
        description: "Charming home in a peaceful neighborhood. Situated in the desirable M Streets area, known for its historic Tudor-style homes and tree-lined streets. Minutes from SMU campus and the shops and restaurants along Greenville Avenue.",
        address: "6212 Martel Ave, Dallas, TX 75214",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1450,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/gsremPD.jpg",
        features: "Tudor-style architecture, updated interior, backyard, garage parking",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 13,
        name: "6463 Trammel Dr",
        description: "Charming home in a peaceful neighborhood. Located in the historic Wilshire Heights area, known for its charming architecture and close-knit community. Just minutes from Knox-Henderson and Mockingbird Station, with easy access to US-75.",
        address: "6463 Trammel Dr, Dallas, TX 75214",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1250,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/GmGrXBV.jpg",
        features: "Original hardwoods, updated kitchen, fenced yard, covered porch",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 14,
        name: "4417 Sycamore St",
        description: "Historic charm with modern amenities. Nestled in the heart of Old East Dallas, walking distance to popular Munger Place Historic District and Peak's Addition. Minutes from Baylor Medical Center and downtown Dallas via I-30.",
        address: "4417 Sycamore St, Dallas, TX 75204",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1000,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/P62glux.jpg",
        features: "Historic character, modern updates, energy-efficient appliances, large porch",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 15,
        name: "6236 Winton St",
        description: "Beautiful home with contemporary design. Located in the family-friendly Greenville Avenue area, just blocks from trendy Lower Greenville's restaurants and nightlife. Quick access to US-75 and Mockingbird Station make commuting simple.",
        address: "6236 Winton St, Dallas, TX 75214",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/Pw0RRJ6.jpg",
        features: "Contemporary design, open floor plan, modern kitchen, outdoor space",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 16,
        name: "6646 E Lovers Ln",
        description: "Elegant living near shopping and dining. Situated in the desirable Lakewood/Lake Highlands area, minutes from White Rock Lake and the Dallas Arboretum. Convenient access to Northwest Highway and Skillman Street for easy commuting.",
        address: "6646 E Lovers Ln, Dallas, TX 75214",
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 1800,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/5QfQiJD.png",
        features: "Upscale finishes, gourmet kitchen, private yard, garage",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 17,
        name: "5503 Winton St",
        description: "Charming home with modern upgrades. Located in the heart of the M Streets neighborhood, walking distance to Greenville Avenue's best restaurants and bars. Just minutes from both SMU campus and White Rock Lake recreational areas.",
        address: "5503 Winton St, Dallas, TX 75206",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/ZC9OEET.jpg",
        features: "Character-rich details, updated systems, mature landscaping, sunroom",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 18,
        name: "5501 Winton St",
        description: "Comfortable living in a prime location. Situated in the popular M Streets area, known for its charming architecture and community feel. Minutes from Knox-Henderson's boutique shopping and dining scene.",
        address: "5501 Winton St, Dallas, TX 75206",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1100,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/KyxXN2C.jpg",
        features: "Original woodwork, updated bathroom, eat-in kitchen, front porch",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 19,
        name: "1015 Cameron Ave",
        description: "Spacious home with contemporary finishes. Steps from Hollywood Heights and the Santa Fe Trail, with Tennyson Park right around the corner. Easy access to White Rock Lake and the vibrant Lakewood shopping district.",
        address: "1015 Cameron Ave, Dallas, TX 75223",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1650,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/kQrkgX6.jpg",
        features: "Modern finishes, open concept, large windows, outdoor entertainment area",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 20,
        name: "615 Parkview Ave",
        description: "Cozy near local parks and bustling Dallas districts. Steps from Hollywood Heights and the Santa Fe Trail, with easy access to Tennyson Park and its recreational amenities. Minutes from both White Rock Lake and the Lakewood shopping district.",
        address: "615 Parkview Ave, Dallas, TX 75223",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/eER5hbA.jpg",
        features: "Cozy layout, updated kitchen, private backyard, walking distance to parks",
        propertyType: "house",
        isMultifamily: false,
        unitCount: null
      },
      {
        id: 21,
        name: "915 Grigsby Ave",
        description: "Modern living in a quiet neighborhood. Ideally situated near the historic Swiss Avenue District, just steps from bustling Lower Greenville's restaurants and entertainment. Minutes from Baylor Medical Center and downtown Dallas, with easy access to I-75 and Live Oak Street's direct route to the city center.",
        address: "915 Grigsby Ave, Dallas, TX 75204",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1250,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/Mzh4Dn2.jpg",
        features: "Completely renovated, premium finishes, open floor plan, private patio",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 4
      },
      {
        id: 22,
        name: "1900 Lucille Ave",
        description: "Contemporary living in a prime location. Situated in the vibrant East Village neighborhood, walking distance to both Knox-Henderson and Lower Greenville's entertainment districts. Minutes from Cityplace/Uptown Station with easy access to downtown Dallas.",
        address: "1900 Lucille Ave, Dallas, TX 75214",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1150,
        rent: 0,
        available: true,
        locationId: 3,
        imageUrl: "https://i.imgur.com/cOicEI4.png",
        features: "Contemporary design, energy-efficient, gourmet kitchen, private balcony",
        propertyType: "apartment",
        isMultifamily: true,
        unitCount: 6
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

    // Neighborhoods data
    const neighborhoods: Neighborhood[] = [
      {
        id: 1,
        locationId: 1, // Midtown
        mapImageUrl: "https://i.imgur.com/rXMUihK.png", // Example map image
        highlights: "Midtown Atlanta is a vibrant, urban district known for its mix of business headquarters, cultural attractions, and residential communities. It's often regarded as Atlanta's 'heart of the arts' with numerous theaters, galleries, and museums.",
        attractions: "Piedmont Park, High Museum of Art, Atlanta Botanical Garden, Fox Theatre, The Center for Puppetry Arts, Margaret Mitchell House, Colony Square, Federal Reserve Bank of Atlanta",
        transportationInfo: "Midtown is served by MARTA's North-South rail line with stations at North Avenue, Midtown, and Arts Center. Multiple bus routes connect throughout the area. The Atlanta Streetcar connects to Downtown, and the neighborhood is bisected by the Atlanta BeltLine's Eastside Trail.",
        diningOptions: "South City Kitchen, Empire State South, The Varsity, Mary Mac's Tea Room, Ecco, Lure, The Lawrence, Cypress Street Pint & Plate, The Canteen, Tabla, Poor Calvin's, Bon Ton, and numerous other restaurants spanning all cuisines and price points.",
        schoolsInfo: "Public schools include Springdale Park Elementary, Morningside Elementary, and Midtown High School. Private options include The Children's School and Paideia. Georgia Tech and SCAD Atlanta provide higher education.",
        parksAndRecreation: "Piedmont Park (189 acres) is the crown jewel with sports facilities, trails, and Lake Clara Meer. The Atlanta BeltLine's Eastside Trail runs along the eastern edge of Midtown. Also features Renaissance Park and Central Park.",
        historicalInfo: "Originally a residential district of mansions built by Atlanta's elite in the early 1900s, Midtown experienced decline after WWII. A renaissance began in the 1980s transforming it into a prime commercial and cultural district while preserving many historic buildings. The area includes the Midtown Historic District and several other listings on the National Register of Historic Places.",
        exploreDescription: "Midtown Atlanta is the heart of the city's arts and culture scene, offering a perfect blend of urban sophistication and creative energy. With its walkable streets, world-class cultural venues, and innovative dining scene, Midtown represents Atlanta's dynamic future while honoring its rich cultural heritage.",
        exploreMapUrl: "https://www.google.com/maps/d/u/0/embed?mid=1XLv06Buip8bENLqmPSeiPE9ehpdzfQY&ehbc=2E312F&noprof=1",
        exploreHotspots: JSON.stringify([
          {
            name: "High Museum of Art",
            description: "Southeast's premier art museum featuring classic and contemporary exhibitions.",
            distance: "0.4 miles from center",
            imageUrl: "https://i.imgur.com/sdHC6Hr.jpg",
            link: "https://high.org"
          },
          {
            name: "Piedmont Park",
            description: "Atlanta's central park offering green spaces, recreational facilities, and city views.",
            distance: "0.2 miles from center",
            imageUrl: "https://i.imgur.com/bAy8idc.jpg",
            link: "https://piedmontpark.org"
          },
          {
            name: "Atlanta Botanical Garden",
            description: "Urban oasis featuring stunning plant collections and seasonal exhibitions.",
            distance: "0.5 miles from center",
            imageUrl: "https://i.imgur.com/xq6r9MA.jpg",
            link: "https://atlantabg.org"
          }
        ]),
        createdAt: new Date()
      },
      {
        id: 2,
        locationId: 2, // Virginia-Highland
        mapImageUrl: "https://i.imgur.com/3PNfb3a.png",
        highlights: "Virginia-Highland (often shortened to 'Va-Hi') is known for its historic bungalows, craftsman homes, and walkable village areas with boutique shopping and local restaurants. It's one of Atlanta's most pedestrian-friendly neighborhoods with a relaxed community atmosphere.",
        attractions: "John Howell Park, Orme Park, Murphy's Restaurant, Highland Row Antiques, Virginia-Highland shops and boutiques, access to the Atlanta BeltLine",
        transportationInfo: "Served by MARTA bus routes connecting to the Midtown MARTA station. The neighborhood is highly walkable with easy access to the BeltLine's Eastside Trail.",
        diningOptions: "Murphy's, Highland Tap, Atkins Park, La Tavola, Fontaine's, DBA Barbecue, Paolo's Gelato, Taco Mac, Yeah! Burger, Osteria 832, and several coffee shops including Dancing Goats and San Francisco Coffee.",
        schoolsInfo: "Served by Atlanta Public Schools including Springdale Park Elementary, Inman Middle School, and Midtown High School. Several private schools are also nearby.",
        parksAndRecreation: "John Howell Park, Orme Park, and easy access to Piedmont Park and the Atlanta BeltLine's Eastside Trail for walking, running, and cycling.",
        historicalInfo: "Developed primarily in the early 1900s, Virginia-Highland was named for the intersection of Virginia and Highland Avenues. The neighborhood architecture includes Craftsman bungalows, Tudor Revival, and Colonial Revival homes. It was at the center of highway revolts in the 1970s that prevented I-485 from cutting through the neighborhood, helping preserve its historic character.",
        exploreDescription: "The vibrant Virginia Highland neighborhood offers a perfect blend of historic charm and modern amenities. Ideal for those who want to live in one of Atlanta's most sought-after areas, with easy access to dining, shopping, and entertainment.",
        exploreMapUrl: "https://www.google.com/maps/d/u/0/embed?mid=1mLjD6MgRd5Cq3tRresLx63wYe01d600&ehbc=2E312F&noprof=1",
        exploreHotspots: JSON.stringify([
          {
            name: "Ponce City Market",
            description: "Historic marketplace with dining, shopping, and entertainment.",
            distance: "1.2 miles from neighborhood center",
            imageUrl: "https://i.imgur.com/1zBCVnO.jpg",
            link: "http://poncecitymarket.com"
          },
          {
            name: "Virginia Highland Shopping District",
            description: "Boutique shopping and local businesses in a charming setting.",
            distance: "In the heart of the neighborhood",
            imageUrl: "https://i.imgur.com/mmnSr5n.jpg",
            link: "https://www.virginiahighlanddistrict.com"
          },
          {
            name: "Piedmont Park",
            description: "Atlanta's premier green space with walking trails and events.",
            distance: "0.8 miles from neighborhood center",
            imageUrl: "https://i.imgur.com/toEfT5z.jpg",
            link: "https://piedmontpark.org"
          }
        ]),
        createdAt: new Date()
      },
      {
        id: 3,
        locationId: 3, // Dallas
        mapImageUrl: "https://i.imgur.com/GGXMOqb.png",
        highlights: "We offer properties in several historic and desirable neighborhoods of Dallas, including the M Streets, Lower Greenville, and Old East Dallas areas. These neighborhoods feature a mix of historic and updated homes in tree-lined residential areas with convenient access to dining, entertainment, and downtown Dallas.",
        attractions: "Lower Greenville entertainment district, Granada Theater, White Rock Lake, Dallas Arboretum, Deep Ellum, Knox-Henderson shopping district, SMU campus",
        transportationInfo: "Major thoroughfares include Greenville Avenue, Skillman Street, and US-75 (Central Expressway). DART light rail stations at Mockingbird and SMU provide public transit access.",
        diningOptions: "Lower Greenville and Knox-Henderson areas offer numerous dining options including Gemma, HG Sply Co., Rapscallion, Truck Yard, Knife, Chelsea Corner, and The Old Monk.",
        schoolsInfo: "Dallas Independent School District serves the area with several well-regarded elementary, middle, and high schools. SMU and Richland College provide higher education options.",
        parksAndRecreation: "White Rock Lake Park offers 1,015 acres of outdoor recreation including a 9.3-mile trail. Glencoe Park, Tietze Park, and Cole Park provide neighborhood green spaces.",
        historicalInfo: "The M Streets (formally Greenland Hills) is known for its Tudor-style homes from the 1920s. Lower Greenville developed as a streetcar suburb in the early 1900s. Old East Dallas was originally a separate city before being annexed by Dallas in 1890 and contains several historic districts including Swiss Avenue, Munger Place, and Peak's Suburban Addition.",
        exploreDescription: "Dallas combines Southern charm with modern urban sophistication, offering residents a dynamic mix of cultural attractions, outdoor spaces, and entertainment districts. From serene lakes to vibrant arts scenes, Dallas provides an exceptional quality of life with amenities for every lifestyle.",
        exploreMapUrl: "https://www.google.com/maps/d/u/0/embed?mid=1v6kgd00ViRSvEjteA1vY0_iVvggVB_0&ehbc=2E312F&noprof=1",
        exploreHotspots: JSON.stringify([
          {
            name: "White Rock Lake",
            description: "Urban oasis featuring a 9.3-mile trail, water activities, and stunning skyline views.",
            distance: "1.2 miles from center",
            imageUrl: "https://i.imgur.com/GkYyI2f.jpg",
            link: "https://www.dallasparks.org/235/White-Rock-Lake-Park"
          },
          {
            name: "Deep Ellum",
            description: "Historic entertainment district known for live music, street art, and eclectic dining.",
            distance: "3.5 miles from center",
            imageUrl: "https://i.imgur.com/vSWSMob.jpg",
            link: "https://deepellumtexas.com"
          },
          {
            name: "Klyde Warren Park",
            description: "Urban green space built over a freeway, featuring food trucks, events, and community activities.",
            distance: "4.2 miles from center",
            imageUrl: "https://i.imgur.com/HhD5VJM.jpg",
            link: "https://www.klydewarrenpark.org"
          }
        ]),
        createdAt: new Date()
      }
    ];
    
    // Create property units for multifamily property
    const propertyUnits: PropertyUnit[] = [
      {
        id: 1,
        propertyId: 1,
        unitNumber: "101",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 750,
        rent: 1500,
        available: true,
        description: "Modern 1 bedroom unit with great natural light and hardwood floors throughout.",
        features: "Stainless steel appliances, quartz countertops, walk-in closet, in-unit washer/dryer",
        createdAt: new Date()
      },
      {
        id: 2,
        propertyId: 1,
        unitNumber: "102",
        bedrooms: 2,
        bathrooms: 1,
        sqft: 950,
        rent: 1950,
        available: false,
        description: "Spacious 2 bedroom corner unit with bright windows and updated fixtures.",
        features: "Open floor plan, granite countertops, ceiling fans, large balcony, pet-friendly",
        createdAt: new Date()
      },
      {
        id: 3,
        propertyId: 1,
        unitNumber: "201",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1100,
        rent: 2200,
        available: true,
        description: "Luxury 2 bedroom, 2 bath unit with premium finishes and spacious living area.",
        features: "Waterfall quartz countertops, stainless appliances, smart home features, walk-in shower, soaking tub",
        createdAt: new Date()
      },
      // Add units for property ID 2
      {
        id: 4,
        propertyId: 2,
        unitNumber: "101",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 650,
        rent: 1200,
        available: true,
        description: "Cozy one-bedroom apartment with modern finishes and great natural light.",
        features: "Stainless steel appliances, Hardwood floors, In-unit laundry, Central AC",
        createdAt: new Date()
      },
      {
        id: 5,
        propertyId: 2,
        unitNumber: "102",
        bedrooms: 2,
        bathrooms: 1.5,
        sqft: 850,
        rent: 1500,
        available: true,
        description: "Spacious two-bedroom apartment with an open floor plan and updated kitchen.",
        features: "Granite countertops, Walk-in closets, Balcony, Pet-friendly",
        createdAt: new Date()
      },
      {
        id: 6,
        propertyId: 2,
        unitNumber: "201",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 950,
        rent: 1700,
        available: true,
        description: "Luxury two-bedroom apartment with two full bathrooms and a large living area.",
        features: "Quartz countertops, Stainless steel appliances, In-unit laundry, Smart home features",
        createdAt: new Date()
      },
      {
        id: 7,
        propertyId: 2,
        unitNumber: "202",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1200,
        rent: 2100,
        available: false,
        description: "Premium three-bedroom corner unit with abundant natural light and city views.",
        features: "Floor-to-ceiling windows, Hardwood floors, Walk-in closets, Balcony, In-unit laundry",
        createdAt: new Date()
      }
    ];
    
    // Create unit images
    const unitImages: UnitImage[] = [
      {
        id: 1,
        unitId: 1,
        url: "https://i.imgur.com/O9Fu46o.png",
        alt: "Living room of Unit 101",
        displayOrder: 0,
        isFeatured: true,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      },
      {
        id: 2,
        unitId: 1,
        url: "https://i.imgur.com/THKfFjB.png",
        alt: "Kitchen of Unit 101",
        displayOrder: 1,
        isFeatured: false,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      },
      {
        id: 3,
        unitId: 2,
        url: "https://i.imgur.com/9L78Ghe.png",
        alt: "Living room of Unit 102",
        displayOrder: 0,
        isFeatured: true,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      },
      {
        id: 4,
        unitId: 2,
        url: "https://i.imgur.com/Qt30zdg.png",
        alt: "Kitchen of Unit 102",
        displayOrder: 1,
        isFeatured: false,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      },
      {
        id: 5,
        unitId: 3,
        url: "https://i.imgur.com/eFdi7sd.jpg",
        alt: "Living room of Unit 201",
        displayOrder: 0,
        isFeatured: true,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      },
      {
        id: 6,
        unitId: 3,
        url: "https://i.imgur.com/ASrp6Cl.jpg",
        alt: "Kitchen of Unit 201",
        displayOrder: 1,
        isFeatured: false,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      },
      {
        id: 7,
        unitId: 3,
        url: "https://i.imgur.com/DI66TQ0.png",
        alt: "Bathroom of Unit 201",
        displayOrder: 2,
        isFeatured: false,
        createdAt: new Date(),
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external"
      }
    ];

    // Populate data maps
    locations.forEach(location => this.locationsData.set(location.id, location));
    features.forEach(feature => this.featuresData.set(feature.id, feature));
    // Add missing propertyType, isMultifamily, and unitCount properties to all properties
    properties.forEach(property => {
      // Add missing fields if not present
      if (!('propertyType' in property)) {
        (property as any).propertyType = 'single-family';
      }
      if (!('isMultifamily' in property)) {
        (property as any).isMultifamily = false;
      }
      if (!('unitCount' in property)) {
        (property as any).unitCount = null;
      }
      
      this.propertiesData.set(property.id, property as Property);
    });
    inquiries.forEach(inquiry => this.inquiriesData.set(inquiry.id, inquiry));
    neighborhoods.forEach(neighborhood => this.neighborhoodsData.set(neighborhood.id, neighborhood));
    propertyUnits.forEach(unit => this.propertyUnitsData.set(unit.id, unit));
    unitImages.forEach(image => this.unitImagesData.set(image.id, image));
    
    // Seed property images
    const propertyImages: PropertyImage[] = [
      // Property 1 images
      {
        id: 1,
        propertyId: 1,
        url: "https://i.imgur.com/O9Fu46o.png",
        alt: "Main exterior view of 253 14th St NE",
        displayOrder: 0,
        isFeatured: true,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      {
        id: 2,
        propertyId: 1,
        url: "https://i.imgur.com/THKfFjB.png",
        alt: "Living room of 253 14th St NE",
        displayOrder: 1,
        isFeatured: false,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      {
        id: 3,
        propertyId: 1,
        url: "https://i.imgur.com/Qt30zdg.png",
        alt: "Kitchen of 253 14th St NE",
        displayOrder: 2,
        isFeatured: false,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      
      // Property 2 images
      {
        id: 4,
        propertyId: 2,
        url: "https://i.imgur.com/9L78Ghe.png",
        alt: "Main exterior view of 965 Myrtle St NE",
        displayOrder: 0,
        isFeatured: true,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      {
        id: 5,
        propertyId: 2,
        url: "https://i.imgur.com/DI66TQ0.png",
        alt: "Bedroom of 965 Myrtle St NE",
        displayOrder: 1,
        isFeatured: false,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      
      // Property 3 images
      {
        id: 6,
        propertyId: 3,
        url: "https://i.imgur.com/Qt30zdg.png",
        alt: "Main exterior view of 903 Myrtle St NE",
        displayOrder: 0,
        isFeatured: true,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      {
        id: 7,
        propertyId: 3,
        url: "https://i.imgur.com/ASrp6Cl.jpg",
        alt: "Living room of 903 Myrtle St NE",
        displayOrder: 1,
        isFeatured: false,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      },
      {
        id: 8,
        propertyId: 3,
        url: "https://i.imgur.com/CGq20NX.png",
        alt: "Bathroom of 903 Myrtle St NE",
        displayOrder: 2,
        isFeatured: false,
        objectKey: null,
        mimeType: null,
        size: null,
        imageData: null,
        storageType: "external",
        createdAt: new Date()
      }
    ];
    
    // Add the storage fields to the other property images
    propertyImages.forEach(image => {
      // Add storage fields if they're missing
      const typedImage = image as Partial<PropertyImage>;
      
      if (!typedImage.objectKey) {
        typedImage.objectKey = null;
      }
      if (!typedImage.mimeType) {
        typedImage.mimeType = null;
      }
      if (!typedImage.size) {
        typedImage.size = null;
      }
      if (!typedImage.imageData) {
        typedImage.imageData = null;
      }
      if (!typedImage.storageType) {
        typedImage.storageType = "external";
      }
      
      this.propertyImagesData.set(typedImage.id as number, typedImage as PropertyImage);
    });
    
    this.nextPropertyImageId = Math.max(...propertyImages.map(image => image.id)) + 1;
    
    // Also add storage fields to unit images if needed
    unitImages.forEach(image => {
      // Add storage fields if they're missing
      const typedImage = image as Partial<UnitImage>;
      
      if (!typedImage.objectKey) {
        typedImage.objectKey = null;
      }
      if (!typedImage.mimeType) {
        typedImage.mimeType = null;
      }
      if (!typedImage.size) {
        typedImage.size = null;
      }
      if (!typedImage.imageData) {
        typedImage.imageData = null;
      }
      if (!typedImage.storageType) {
        typedImage.storageType = "external";
      }
      
      this.unitImagesData.set(typedImage.id as number, typedImage as UnitImage);
    });
  }

  // Add method to get a single property image by ID
  async getPropertyImage(id: number): Promise<PropertyImage | undefined> {
    return this.propertyImagesData.get(id);
  }

  // Add method to get a single unit image by ID
  async getUnitImage(id: number): Promise<UnitImage | undefined> {
    return this.unitImagesData.get(id);
  }

  // Update property image URL
  async updatePropertyImageObjectKey(id: number, objectKey: string): Promise<PropertyImage | undefined> {
    const image = this.propertyImagesData.get(id);
    if (!image) return undefined;
    
    const updatedImage: PropertyImage = {
      ...image,
      objectKey
    };
    
    this.propertyImagesData.set(id, updatedImage);
    return updatedImage;
  }
  
  // Update unit image URL
  async updateUnitImageObjectKey(id: number, objectKey: string): Promise<UnitImage | undefined> {
    const image = this.unitImagesData.get(id);
    if (!image) return undefined;
    
    const updatedImage: UnitImage = {
      ...image,
      objectKey
    };
    
    this.unitImagesData.set(id, updatedImage);
    return updatedImage;
  }
  
  // Get all property units
  async getAllPropertyUnits(): Promise<PropertyUnit[]> {
    return Array.from(this.propertyUnitsData.values());
  }

  // Image Storage methods for storing images directly in the database
  private imageStorageData: Map<number, ImageStorage> = new Map();
  private nextImageId: number = 1;

  // Save image data to database
  async saveImageData(data: InsertImageStorage): Promise<ImageStorage> {
    const id = this.nextImageId++;
    const createdAt = new Date();
    
    const newImage: ImageStorage = {
      id,
      objectKey: data.objectKey,
      mimeType: data.mimeType,
      data: data.data,
      size: data.size,
      createdAt
    };
    
    this.imageStorageData.set(id, newImage);
    return newImage;
  }
  
  // Get image data by object key
  async getImageDataByObjectKey(objectKey: string): Promise<ImageStorage | undefined> {
    return Array.from(this.imageStorageData.values()).find(
      image => image.objectKey === objectKey
    );
  }
  
  // Delete image data by object key
  async deleteImageDataByObjectKey(objectKey: string): Promise<boolean> {
    const image = Array.from(this.imageStorageData.values()).find(
      image => image.objectKey === objectKey
    );
    
    if (image) {
      return this.imageStorageData.delete(image.id);
    }
    
    return false;
  }
  
  // Get all stored images
  async getAllStoredImages(): Promise<ImageStorage[]> {
    return Array.from(this.imageStorageData.values()).sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

// Export an instance for use throughout the application
export const storage = new MemStorage();
