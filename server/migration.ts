/**
 * Migration Script
 * 
 * This script migrates data from in-memory storage to PostgreSQL database
 * and moves all images to object storage.
 * 
 * Changes:
 * - Migrates all data from MemStorage to PgStorage
 * - Uploads all images to object storage
 * - Updates image references in the database
 */

import { storage as memStorage } from './storage';
import { PgStorage } from './pg-storage';
import { db, schema } from './db';
import { uploadImage, getImageUrl } from './storage-utils';
import axios from 'axios';
import { eq } from 'drizzle-orm';

// Create a new instance of PgStorage
const pgStorage = new PgStorage();

// Function to download image from URL
async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    throw error;
  }
}

// Main migration function
export async function migrateData(): Promise<void> {
  console.log('Starting migration from in-memory storage to PostgreSQL database...');
  
  try {
    // Step 1: Migrate locations
    await migrateLocations();
    
    // Step 2: Migrate neighborhoods
    await migrateNeighborhoods();
    
    // Step 3: Migrate properties
    await migrateProperties();
    
    // Step 4: Migrate features
    await migrateFeatures();
    
    // Step 5: Migrate inquiries
    await migrateInquiries();
    
    // Step 6: Migrate property units
    await migratePropertyUnits();
    
    // Step 7: Migrate property images
    await migratePropertyImages();
    
    // Step 8: Migrate unit images
    await migrateUnitImages();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Migrate locations
async function migrateLocations(): Promise<void> {
  console.log('Migrating locations...');
  
  // Get all locations from in-memory storage
  const locations = await memStorage.getLocations();
  
  // Clear existing locations in the database
  await db.delete(schema.locations);
  
  // Insert each location into the database
  for (const location of locations) {
    // Download and upload the image to object storage
    let imageUrl = location.imageUrl;
    
    // Only process URLs that are not already in object storage
    if (imageUrl && imageUrl.startsWith('http')) {
      try {
        const imageBuffer = await downloadImage(imageUrl);
        const objectKey = await uploadImage(imageBuffer, `location_${location.id}.jpg`);
        imageUrl = objectKey;
      } catch (error) {
        console.error(`Failed to migrate image for location ${location.id}:`, error);
        // Keep the original URL if migration fails
      }
    }
    
    // Insert the location with the new image URL
    await db.insert(schema.locations).values({
      id: location.id,
      slug: location.slug,
      name: location.name,
      description: location.description,
      imageUrl: imageUrl,
      linkText: location.linkText
    });
  }
  
  console.log(`Migrated ${locations.length} locations`);
}

// Migrate neighborhoods
async function migrateNeighborhoods(): Promise<void> {
  console.log('Migrating neighborhoods...');
  
  // Get all neighborhoods from in-memory storage
  const neighborhoods = await Promise.all(
    (await memStorage.getLocations()).map(async location => 
      await memStorage.getNeighborhoodByLocationId(location.id)
    )
  ).then(results => results.filter(Boolean));
  
  // Clear existing neighborhoods in the database
  await db.delete(schema.neighborhoods);
  
  // Insert each neighborhood into the database
  for (const neighborhood of neighborhoods) {
    if (!neighborhood) continue;
    
    // Download and upload the map image to object storage
    let mapImageUrl = neighborhood.mapImageUrl;
    
    // Only process URLs that are not already in object storage
    if (mapImageUrl && mapImageUrl.startsWith('http')) {
      try {
        const imageBuffer = await downloadImage(mapImageUrl);
        const objectKey = await uploadImage(imageBuffer, `neighborhood_map_${neighborhood.id}.jpg`);
        mapImageUrl = objectKey;
      } catch (error) {
        console.error(`Failed to migrate map image for neighborhood ${neighborhood.id}:`, error);
        // Keep the original URL if migration fails
      }
    }
    
    // Process exploreHotspots to update image URLs
    let exploreHotspots = neighborhood.exploreHotspots;
    if (exploreHotspots) {
      try {
        const hotspots = JSON.parse(exploreHotspots);
        
        // Update image URLs in hotspots
        for (let i = 0; i < hotspots.length; i++) {
          const hotspot = hotspots[i];
          if (hotspot.imageUrl && hotspot.imageUrl.startsWith('http')) {
            try {
              const imageBuffer = await downloadImage(hotspot.imageUrl);
              const objectKey = await uploadImage(imageBuffer, `hotspot_${neighborhood.id}_${i}.jpg`);
              hotspot.imageUrl = objectKey;
            } catch (error) {
              console.error(`Failed to migrate hotspot image for neighborhood ${neighborhood.id}:`, error);
              // Keep the original URL if migration fails
            }
          }
        }
        
        exploreHotspots = JSON.stringify(hotspots);
      } catch (error) {
        console.error(`Failed to process exploreHotspots for neighborhood ${neighborhood.id}:`, error);
        // Keep the original JSON if processing fails
      }
    }
    
    // Insert the neighborhood with the new image URLs
    await db.insert(schema.neighborhoods).values({
      id: neighborhood.id,
      locationId: neighborhood.locationId,
      mapImageUrl: mapImageUrl,
      highlights: neighborhood.highlights,
      attractions: neighborhood.attractions,
      transportationInfo: neighborhood.transportationInfo,
      diningOptions: neighborhood.diningOptions,
      schoolsInfo: neighborhood.schoolsInfo,
      parksAndRecreation: neighborhood.parksAndRecreation,
      historicalInfo: neighborhood.historicalInfo,
      exploreDescription: neighborhood.exploreDescription,
      exploreMapUrl: neighborhood.exploreMapUrl,
      exploreHotspots: exploreHotspots,
      createdAt: neighborhood.createdAt
    });
  }
  
  console.log(`Migrated ${neighborhoods.length} neighborhoods`);
}

// Migrate properties
async function migrateProperties(): Promise<void> {
  console.log('Migrating properties...');
  
  // Get all properties from in-memory storage
  const properties = await memStorage.getProperties();
  
  // Clear existing properties in the database
  await db.delete(schema.properties);
  
  // Insert each property into the database
  for (const property of properties) {
    // Download and upload the image to object storage
    let imageUrl = property.imageUrl;
    
    // Only process URLs that are not already in object storage
    if (imageUrl && imageUrl.startsWith('http')) {
      try {
        const imageBuffer = await downloadImage(imageUrl);
        const objectKey = await uploadImage(imageBuffer, `property_${property.id}.jpg`);
        imageUrl = objectKey;
      } catch (error) {
        console.error(`Failed to migrate image for property ${property.id}:`, error);
        // Keep the original URL if migration fails
      }
    }
    
    // Insert the property with the new image URL
    await db.insert(schema.properties).values({
      id: property.id,
      name: property.name,
      description: property.description,
      address: property.address,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      rent: property.rent,
      available: property.available,
      locationId: property.locationId,
      imageUrl: imageUrl,
      features: property.features,
      propertyType: property.propertyType || 'apartment',
      isMultifamily: property.isMultifamily || false,
      unitCount: property.unitCount || null
    });
  }
  
  console.log(`Migrated ${properties.length} properties`);
}

// Migrate features
async function migrateFeatures(): Promise<void> {
  console.log('Migrating features...');
  
  // Get all features from in-memory storage
  const features = await memStorage.getFeatures();
  
  // Clear existing features in the database
  await db.delete(schema.features);
  
  // Insert each feature into the database
  for (const feature of features) {
    await db.insert(schema.features).values({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      icon: feature.icon
    });
  }
  
  console.log(`Migrated ${features.length} features`);
}

// Migrate inquiries
async function migrateInquiries(): Promise<void> {
  console.log('Migrating inquiries...');
  
  // Get all inquiries from in-memory storage
  const inquiries = await memStorage.getInquiries();
  
  // Clear existing inquiries in the database
  await db.delete(schema.inquiries);
  
  // Insert each inquiry into the database
  for (const inquiry of inquiries) {
    await db.insert(schema.inquiries).values({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      propertyId: inquiry.propertyId,
      propertyName: inquiry.propertyName,
      createdAt: inquiry.createdAt,
      status: inquiry.status
    });
  }
  
  console.log(`Migrated ${inquiries.length} inquiries`);
}

// Migrate property units
async function migratePropertyUnits(): Promise<void> {
  console.log('Migrating property units...');
  
  // Get all property units from in-memory storage
  const propertyUnits = await memStorage.getAllPropertyUnits();
  
  // Clear existing property units in the database
  await db.delete(schema.propertyUnits);
  
  // Insert each property unit into the database
  for (const unit of propertyUnits) {
    await db.insert(schema.propertyUnits).values({
      id: unit.id,
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      sqft: unit.sqft,
      rent: unit.rent,
      available: unit.available,
      description: unit.description,
      features: unit.features,
      createdAt: unit.createdAt
    });
  }
  
  console.log(`Migrated ${propertyUnits.length} property units`);
}

// Migrate property images
async function migratePropertyImages(): Promise<void> {
  console.log('Migrating property images...');
  
  // Get all property images from in-memory storage
  const propertyImages = await memStorage.getPropertyImages();
  
  // Clear existing property images in the database
  await db.delete(schema.propertyImages);
  
  // Insert each property image into the database
  for (const image of propertyImages) {
    // Download and upload the image to object storage if it's a URL
    let objectKey = image.objectKey;
    
    // @ts-ignore - Handle URL legacy field from MemStorage
    if (!objectKey && image.url && image.url.startsWith('http')) {
      try {
        // @ts-ignore - Handle URL legacy field from MemStorage
        const imageBuffer = await downloadImage(image.url);
        objectKey = await uploadImage(imageBuffer, `property_image_${image.id}.jpg`);
      } catch (error) {
        console.error(`Failed to migrate image for property image ${image.id}:`, error);
        // Skip this image if migration fails
        continue;
      }
    }
    
    // Skip if we don't have an object key
    if (!objectKey) {
      console.warn(`Skipping property image ${image.id} because it has no objectKey`);
      continue;
    }
    
    // Insert the property image with the object key
    await db.insert(schema.propertyImages).values({
      id: image.id,
      propertyId: image.propertyId,
      objectKey: objectKey,
      alt: image.alt || `Image of property ${image.propertyId}`,
      displayOrder: image.displayOrder || 0,
      isFeatured: image.isFeatured || false,
      mimeType: image.mimeType || 'image/jpeg',
      size: image.size || 0,
      createdAt: image.createdAt
    });
  }
  
  console.log(`Migrated ${propertyImages.length} property images`);
}

// Migrate unit images
async function migrateUnitImages(): Promise<void> {
  console.log('Migrating unit images...');
  
  // Get all property units from in-memory storage
  const propertyUnits = await memStorage.getAllPropertyUnits();
  
  // Get all unit images for each unit
  let unitImages: any[] = [];
  for (const unit of propertyUnits) {
    const images = await memStorage.getUnitImages(unit.id);
    unitImages = [...unitImages, ...images];
  }
  
  // Clear existing unit images in the database
  await db.delete(schema.unitImages);
  
  // Insert each unit image into the database
  for (const image of unitImages) {
    // Download and upload the image to object storage if it's a URL
    let objectKey = image.objectKey;
    
    if (!objectKey && image.url && image.url.startsWith('http')) {
      try {
        const imageBuffer = await downloadImage(image.url);
        objectKey = await uploadImage(imageBuffer, `unit_image_${image.id}.jpg`);
      } catch (error) {
        console.error(`Failed to migrate image for unit image ${image.id}:`, error);
        // Skip this image if migration fails
        continue;
      }
    }
    
    // Skip if we don't have an object key
    if (!objectKey) {
      console.warn(`Skipping unit image ${image.id} because it has no objectKey`);
      continue;
    }
    
    // Insert the unit image with the object key
    await db.insert(schema.unitImages).values({
      id: image.id,
      unitId: image.unitId,
      objectKey: objectKey,
      alt: image.alt || `Image of unit ${image.unitId}`,
      displayOrder: image.displayOrder || 0,
      isFeatured: image.isFeatured || false,
      mimeType: image.mimeType || 'image/jpeg',
      size: image.size || 0,
      createdAt: image.createdAt
    });
  }
  
  console.log(`Migrated ${unitImages.length} unit images`);
}

// In ESM, we don't use require.main === module check
// The run-migration.ts file will call migrateData directly 