/**
 * Object Storage Service for Image Management
 * 
 * Changes:
 * - Added listImages function to retrieve all images from storage
 * - Added getImageUrl function to generate URLs for stored images
 * - Added support for checking if an image exists
 * - Improved error handling and logging
 */

import { Client } from '@replit/object-storage';
import path from 'path';
import crypto from 'crypto';

// Initialize the Replit Object Storage client
const client = new Client();

// Your bucket ID from .replit file
const BUCKET_ID = 'replit-objstore-8f3f1a22-cdd2-4088-9bff-f7887f5d323d';

// Function to generate a unique filename to avoid collisions
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${originalFilename}-${timestamp}`).digest('hex');
  const ext = path.extname(originalFilename);
  return `${hash}${ext}`;
}

// Upload an image from binary data
export async function uploadImage(fileBuffer: Buffer, originalFilename: string): Promise<string> {
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const objectKey = `images/${uniqueFilename}`;
  
  try {
    const { ok, error } = await client.uploadFromBytes(objectKey, fileBuffer);
    
    if (!ok) {
      console.error("Error uploading to object storage:", error);
      throw new Error(`Failed to upload image: ${error?.message}`);
    }
    
    // Return the full path to the image that can be stored in the database
    return objectKey;
  } catch (error) {
    console.error("Error uploading to object storage:", error);
    throw error;
  }
}

// Delete an image by its key
export async function deleteImage(objectKey: string): Promise<boolean> {
  try {
    const { ok, error } = await client.delete(objectKey);
    
    if (!ok) {
      console.error("Error deleting from object storage:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting from object storage:", error);
    return false;
  }
}

// Get image data for download
export async function getImageData(objectKey: string): Promise<Buffer | null> {
  try {
    const { ok, value, error } = await client.downloadAsBytes(objectKey);
    
    if (!ok || !value) {
      console.error("Error downloading from object storage:", error);
      return null;
    }
    
    // Convert to unknown first to satisfy TypeScript
    return (value as unknown) as Buffer;
  } catch (error) {
    console.error("Error downloading from object storage:", error);
    return null;
  }
}

// List all images in the storage
export async function listImages(): Promise<string[]> {
  try {
    console.log("Listing all images in object storage...");
    const { ok, value, error } = await client.list();
    
    if (!ok || !value) {
      console.error("Error listing objects in storage:", error);
      return [];
    }
    
    console.log("Raw objects from storage:", value);
    
    // Process and properly format each object name
    const objectKeys = value.map(obj => {
      // Extract the actual key from the object (which might have a 'name' property)
      const objKey = obj.name ? obj.name : String(obj);
      return objKey;
    });
    
    console.log("Object keys extracted:", objectKeys);
    
    // Filter to only include image files
    const imageFiles = objectKeys.filter(key => {
      const ext = path.extname(key).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    console.log("Filtered image files:", imageFiles);
    return imageFiles;
  } catch (error) {
    console.error("Error listing images in storage:", error);
    return [];
  }
}

// Check if an image exists in storage
export async function imageExists(objectKey: string): Promise<boolean> {
  try {
    const { ok } = await client.downloadAsBytes(objectKey);
    return ok;
  } catch (error) {
    return false;
  }
}

// Extract the filename from a full object key
export function getFilenameFromObjectKey(objectKey: string): string {
  return path.basename(objectKey);
}

// Check if the storage service is properly configured
export async function checkStorageConfig(): Promise<boolean> {
  try {
    // Try listing objects to check connectivity
    const { ok } = await client.list();
    return ok;
  } catch (error) {
    console.error("Failed to connect to object storage:", error);
    return false;
  }
}

/**
 * Generate a URL for an image stored in object storage
 * 
 * @param objectKey - The key of the image in object storage
 * @param useApiProxy - Whether to use the API proxy endpoint (default: true)
 * @returns The URL to access the image
 */
export function getImageUrl(objectKey: string, useApiProxy: boolean = true): string {
  if (!objectKey) {
    return '';
  }
  
  // If the URL is already a full URL (e.g., https://...), return it as is
  if (objectKey.startsWith('http')) {
    return objectKey;
  }
  
  // If using the API proxy (recommended for production)
  if (useApiProxy) {
    return `/api/images/${encodeURIComponent(objectKey)}`;
  }
  
  // Direct URL to the object storage (not recommended for production)
  return `https://object-storage.${process.env.REPL_SLUG}.repl.co/${BUCKET_ID}/${objectKey}`;
}

/**
 * Check if a URL is an object storage key
 * 
 * @param url - The URL to check
 * @returns True if the URL is an object storage key
 */
export function isObjectStorageKey(url: string): boolean {
  if (!url) {
    return false;
  }
  
  // If it's a full URL, it's not an object storage key
  if (url.startsWith('http')) {
    return false;
  }
  
  // If it starts with 'images/', it's likely an object storage key
  return url.startsWith('images/');
}