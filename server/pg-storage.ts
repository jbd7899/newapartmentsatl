/**
 * PostgreSQL storage implementation
 * Created to replace the in-memory storage with a PostgreSQL database implementation
 */

import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from './db';
import { IStorage } from './storage';
import { 
  type Location, type InsertLocation, 
  type Property, type InsertProperty,
  type Feature, type InsertFeature,
  type Inquiry, type InsertInquiry,
  type PropertyImage, type InsertPropertyImage,
  type Neighborhood, type InsertNeighborhood,
  type PropertyUnit, type InsertPropertyUnit,
  type UnitImage, type InsertUnitImage,
  type ImageStorage, type InsertImageStorage
} from "@shared/schema";

export class PgStorage implements IStorage {
  // Locations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(schema.locations);
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    const results = await db.select().from(schema.locations).where(eq(schema.locations.slug, slug));
    return results[0];
  }
  
  // Neighborhoods
  async getNeighborhoodByLocationId(locationId: number): Promise<Neighborhood | undefined> {
    const results = await db.select().from(schema.neighborhoods).where(eq(schema.neighborhoods.locationId, locationId));
    return results[0];
  }

  async createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const results = await db.insert(schema.neighborhoods).values(neighborhood).returning();
    return results[0];
  }

  async updateNeighborhood(id: number, data: Partial<InsertNeighborhood>): Promise<Neighborhood | undefined> {
    const results = await db.update(schema.neighborhoods).set(data).where(eq(schema.neighborhoods.id, id)).returning();
    return results[0];
  }
  
  // Properties
  async getProperties(): Promise<Property[]> {
    return await db.select().from(schema.properties);
  }

  async getPropertiesByLocation(locationId: number): Promise<Property[]> {
    return await db.select().from(schema.properties).where(eq(schema.properties.locationId, locationId));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const results = await db.select().from(schema.properties).where(eq(schema.properties.id, id));
    return results[0];
  }

  async updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const results = await db.update(schema.properties).set(data).where(eq(schema.properties.id, id)).returning();
    return results[0];
  }
  
  // Features
  async getFeatures(): Promise<Feature[]> {
    return await db.select().from(schema.features);
  }
  
  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt));
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const results = await db.insert(schema.inquiries).values(inquiry).returning();
    return results[0];
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined> {
    const results = await db.update(schema.inquiries).set({ status }).where(eq(schema.inquiries.id, id)).returning();
    return results[0];
  }
  
  // Property Images
  async getPropertyImages(): Promise<PropertyImage[]> {
    return await db.select().from(schema.propertyImages);
  }

  async getPropertyImagesByProperty(propertyId: number): Promise<PropertyImage[]> {
    return await db.select().from(schema.propertyImages)
      .where(eq(schema.propertyImages.propertyId, propertyId))
      .orderBy(schema.propertyImages.displayOrder);
  }

  async createPropertyImage(image: InsertPropertyImage): Promise<PropertyImage> {
    const results = await db.insert(schema.propertyImages).values(image).returning();
    return results[0];
  }

  async updatePropertyImageOrder(id: number, displayOrder: number): Promise<PropertyImage | undefined> {
    const results = await db.update(schema.propertyImages)
      .set({ displayOrder })
      .where(eq(schema.propertyImages.id, id))
      .returning();
    return results[0];
  }

  async updatePropertyImageFeatured(id: number, isFeatured: boolean): Promise<PropertyImage | undefined> {
    // First, unset featured for all images of this property
    if (isFeatured) {
      const image = await this.getPropertyImage(id);
      if (image) {
        await db.update(schema.propertyImages)
          .set({ isFeatured: false })
          .where(eq(schema.propertyImages.propertyId, image.propertyId));
      }
    }
    
    // Then set the featured status for this image
    const results = await db.update(schema.propertyImages)
      .set({ isFeatured })
      .where(eq(schema.propertyImages.id, id))
      .returning();
    return results[0];
  }

  async deletePropertyImage(id: number): Promise<boolean> {
    const results = await db.delete(schema.propertyImages).where(eq(schema.propertyImages.id, id)).returning();
    return results.length > 0;
  }
  
  // Property Units
  async getPropertyUnits(propertyId: number): Promise<PropertyUnit[]> {
    return await db.select().from(schema.propertyUnits).where(eq(schema.propertyUnits.propertyId, propertyId));
  }

  async getPropertyUnit(id: number): Promise<PropertyUnit | undefined> {
    const results = await db.select().from(schema.propertyUnits).where(eq(schema.propertyUnits.id, id));
    return results[0];
  }

  async createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit> {
    const results = await db.insert(schema.propertyUnits).values(unit).returning();
    return results[0];
  }

  async updatePropertyUnit(id: number, data: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined> {
    const results = await db.update(schema.propertyUnits).set(data).where(eq(schema.propertyUnits.id, id)).returning();
    return results[0];
  }

  async deletePropertyUnit(id: number): Promise<boolean> {
    const results = await db.delete(schema.propertyUnits).where(eq(schema.propertyUnits.id, id)).returning();
    return results.length > 0;
  }
  
  // Unit Images
  async getUnitImages(unitId: number): Promise<UnitImage[]> {
    return await db.select().from(schema.unitImages)
      .where(eq(schema.unitImages.unitId, unitId))
      .orderBy(schema.unitImages.displayOrder);
  }

  async createUnitImage(image: InsertUnitImage): Promise<UnitImage> {
    const results = await db.insert(schema.unitImages).values(image).returning();
    return results[0];
  }

  async updateUnitImageOrder(id: number, displayOrder: number): Promise<UnitImage | undefined> {
    const results = await db.update(schema.unitImages)
      .set({ displayOrder })
      .where(eq(schema.unitImages.id, id))
      .returning();
    return results[0];
  }

  async updateUnitImageFeatured(id: number, isFeatured: boolean): Promise<UnitImage | undefined> {
    // First, unset featured for all images of this unit
    if (isFeatured) {
      const image = await this.getUnitImage(id);
      if (image) {
        await db.update(schema.unitImages)
          .set({ isFeatured: false })
          .where(eq(schema.unitImages.unitId, image.unitId));
      }
    }
    
    // Then set the featured status for this image
    const results = await db.update(schema.unitImages)
      .set({ isFeatured })
      .where(eq(schema.unitImages.id, id))
      .returning();
    return results[0];
  }

  async deleteUnitImage(id: number): Promise<boolean> {
    const results = await db.delete(schema.unitImages).where(eq(schema.unitImages.id, id)).returning();
    return results.length > 0;
  }

  // Get a single property image by ID
  async getPropertyImage(id: number): Promise<PropertyImage | undefined> {
    const results = await db.select().from(schema.propertyImages).where(eq(schema.propertyImages.id, id));
    return results[0];
  }

  // Get a single unit image by ID
  async getUnitImage(id: number): Promise<UnitImage | undefined> {
    const results = await db.select().from(schema.unitImages).where(eq(schema.unitImages.id, id));
    return results[0];
  }

  // Update property image URL
  async updatePropertyImageUrl(id: number, url: string): Promise<PropertyImage | undefined> {
    const results = await db.update(schema.propertyImages)
      .set({ url })
      .where(eq(schema.propertyImages.id, id))
      .returning();
    return results[0];
  }

  // Update unit image URL
  async updateUnitImageUrl(id: number, url: string): Promise<UnitImage | undefined> {
    const results = await db.update(schema.unitImages)
      .set({ url })
      .where(eq(schema.unitImages.id, id))
      .returning();
    return results[0];
  }
  
  // Get all property units
  async getAllPropertyUnits(): Promise<PropertyUnit[]> {
    return await db.select().from(schema.propertyUnits);
  }
  
  // Image Storage - Database Binary Storage
  async saveImageData(data: InsertImageStorage): Promise<ImageStorage> {
    const results = await db.insert(schema.imageStorage).values(data).returning();
    return results[0];
  }

  async getImageDataByObjectKey(objectKey: string): Promise<ImageStorage | undefined> {
    const results = await db.select().from(schema.imageStorage).where(eq(schema.imageStorage.objectKey, objectKey));
    return results[0];
  }

  async deleteImageDataByObjectKey(objectKey: string): Promise<boolean> {
    const results = await db.delete(schema.imageStorage).where(eq(schema.imageStorage.objectKey, objectKey)).returning();
    return results.length > 0;
  }

  async getAllStoredImages(): Promise<ImageStorage[]> {
    return await db.select().from(schema.imageStorage).orderBy(desc(schema.imageStorage.createdAt));
  }
} 