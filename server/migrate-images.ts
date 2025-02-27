/**
 * Migration Utility for Moving Images to Object Storage
 * 
 * This utility scans the uploads directory for existing images,
 * uploads them to Replit Object Storage, and updates database records
 * with the new object storage URLs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { uploadImage, getImageUrl } from './object-storage';
import { storage } from './storage';

// Path to uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Scan the uploads directory for images
 * @returns Array of image file paths
 */
async function scanUploadsDirectory(): Promise<string[]> {
  console.log(`Scanning uploads directory: ${UPLOADS_DIR}`);
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('Uploads directory does not exist');
    return [];
  }
  
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    console.log(`Found ${files.length} files in uploads directory`);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} image files`);
    return imageFiles;
  } catch (error) {
    console.error('Error scanning uploads directory:', error);
    return [];
  }
}

/**
 * Upload an image to object storage
 * @param filename The filename of the image
 * @returns The object key of the uploaded image
 */
async function uploadImageToStorage(filename: string): Promise<string | null> {
  try {
    const filePath = path.join(UPLOADS_DIR, filename);
    console.log(`Uploading ${filePath} to object storage`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to object storage
    const objectKey = await uploadImage(fileBuffer, filename);
    console.log(`Uploaded ${filename} to object storage with key: ${objectKey}`);
    
    return objectKey;
  } catch (error) {
    console.error(`Error uploading ${filename} to object storage:`, error);
    return null;
  }
}

/**
 * Update database records with new object storage URLs
 * @param oldUrl The old URL (e.g., /uploads/image.jpg)
 * @param objectKey The new object storage key
 */
async function updateDatabaseRecords(oldUrl: string, objectKey: string): Promise<void> {
  console.log(`Updating database records for ${oldUrl} to ${objectKey}`);
  
  try {
    // Get all property images
    const propertyImages = await storage.getPropertyImages();
    
    // Update property images
    for (const image of propertyImages) {
      if (image.url === `/uploads/${path.basename(oldUrl)}`) {
        console.log(`Updating property image ${image.id} URL`);
        await storage.updatePropertyImageUrl(image.id, objectKey);
      }
    }
    
    // Get all unit images
    const allPropertyUnits = await storage.getAllPropertyUnits();
    
    for (const unit of allPropertyUnits) {
      const unitImages = await storage.getUnitImages(unit.id);
      
      // Update unit images
      for (const image of unitImages) {
        if (image.url === `/uploads/${path.basename(oldUrl)}`) {
          console.log(`Updating unit image ${image.id} URL`);
          await storage.updateUnitImageUrl(image.id, objectKey);
        }
      }
    }
    
    console.log(`Database records updated for ${oldUrl}`);
  } catch (error) {
    console.error(`Error updating database records for ${oldUrl}:`, error);
  }
}

/**
 * Main migration function
 */
async function migrateImages(): Promise<void> {
  console.log('Starting image migration to object storage');
  
  // Scan uploads directory
  const imageFiles = await scanUploadsDirectory();
  
  if (imageFiles.length === 0) {
    console.log('No images found to migrate');
    return;
  }
  
  // Process each image
  for (const filename of imageFiles) {
    // Upload to object storage
    const objectKey = await uploadImageToStorage(filename);
    
    if (objectKey) {
      // Update database records
      await updateDatabaseRecords(filename, objectKey);
      
      // Optionally, remove the file from the uploads directory
      // fs.unlinkSync(path.join(UPLOADS_DIR, filename));
    }
  }
  
  console.log('Image migration completed');
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateImages()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateImages, scanUploadsDirectory, uploadImageToStorage, updateDatabaseRecords }; 