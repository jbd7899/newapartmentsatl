
import { Client } from '@replit/object-storage';
import path from 'path';
import crypto from 'crypto';

// Initialize the Object Storage client
const client = new Client();

// Generate a unique filename to avoid collisions
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${originalFilename}-${timestamp}`).digest('hex');
  const ext = path.extname(originalFilename) || '.jpg';
  return `${hash}${ext}`;
}

// Upload an image from binary data or base64
export async function uploadImage(
  fileData: Buffer | string, 
  originalFilename: string = 'image.jpg',
  prefix: string = 'images'
): Promise<string> {
  // Handle base64 data
  let fileBuffer: Buffer;
  if (typeof fileData === 'string' && fileData.includes('base64')) {
    // Extract base64 data from data URL
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data format');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    fileBuffer = Buffer.from(base64Data, 'base64');
    
    // Update filename extension based on mimetype if needed
    if (mimeType === 'image/png') originalFilename = 'image.png';
    else if (mimeType === 'image/gif') originalFilename = 'image.gif';
    else if (mimeType === 'image/webp') originalFilename = 'image.webp';
  } else if (Buffer.isBuffer(fileData)) {
    fileBuffer = fileData;
  } else {
    throw new Error('Invalid file data format');
  }
  
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const objectKey = `${prefix}/${uniqueFilename}`;
  
  try {
    const { ok, error } = await client.uploadFromBytes(objectKey, fileBuffer);
    
    if (!ok) {
      console.error("Error uploading to object storage:", error);
      throw new Error(`Failed to upload image: ${error?.message}`);
    }
    
    // Return the object key
    return objectKey;
  } catch (error) {
    console.error("Error uploading to object storage:", error);
    throw error;
  }
}

// Get an image URL for client display
export function getImageUrl(objectKey: string): string {
  if (!objectKey) return '';
  
  // External URLs should be returned as-is
  if (objectKey.startsWith('http')) {
    return objectKey;
  }
  
  // Object storage URLs should use the API proxy
  return `/api/images/${encodeURIComponent(objectKey)}`;
}

// Get image data for download
export async function getImageData(objectKey: string): Promise<Buffer | null> {
  if (!objectKey || objectKey.startsWith('http')) {
    return null;
  }
  
  try {
    const { ok, value, error } = await client.downloadAsBytes(objectKey);
    
    if (!ok || !value) {
      console.error("Error downloading from object storage:", error);
      return null;
    }
    
    return value as unknown as Buffer;
  } catch (error) {
    console.error("Error downloading from object storage:", error);
    return null;
  }
}

// Delete an image
export async function deleteImage(objectKey: string): Promise<boolean> {
  if (!objectKey || objectKey.startsWith('http')) {
    return false;
  }
  
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

// List all images
export async function listImages(prefix: string = 'images'): Promise<string[]> {
  try {
    const { ok, value, error } = await client.list({ prefix });
    
    if (!ok || !value) {
      console.error("Error listing objects in storage:", error);
      return [];
    }
    
    return value.map(obj => obj.name ? obj.name : String(obj));
  } catch (error) {
    console.error("Error listing images in storage:", error);
    return [];
  }
}
