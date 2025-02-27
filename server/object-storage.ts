import { Client } from '@replit/object-storage';
import path from 'path';
import crypto from 'crypto';

// Initialize the Replit Object Storage client
const client = new Client();

// Your bucket ID
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
    
    return value;
  } catch (error) {
    console.error("Error downloading from object storage:", error);
    return null;
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