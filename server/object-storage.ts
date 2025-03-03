/**
 * Object Storage Service for Image Management
 * 
 * Changes:
 * - Updated implementation to follow Replit Object Storage best practices
 * - Enhanced error handling and logging
 * - Added support for streaming operations
 * - Improved path normalization and fallback mechanisms
 * - Added detailed documentation for each function
 */

import { Client } from '@replit/object-storage';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import fs from 'fs/promises';

// Create a client instance
const BUCKET_ID = process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || '';
console.log(`[Object Storage] Using bucket ID: ${BUCKET_ID}`);

// Export the client for use in other modules
export const client = new Client();

/**
 * Generate a unique filename to avoid collisions
 * 
 * @param originalFilename - The original filename
 * @returns A unique filename with the same extension
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${originalFilename}-${timestamp}`).digest('hex');
  const ext = path.extname(originalFilename);
  return `${hash}${ext}`;
}

/**
 * Normalize an object key to ensure consistent format
 * 
 * @param objectKey - The object key to normalize
 * @returns The normalized object key
 */
function normalizeObjectKey(objectKey: string): string {
  // Remove any duplicate 'images/' prefixes
  let normalizedKey = objectKey;
  
  if (normalizedKey.startsWith('images/images/')) {
    normalizedKey = normalizedKey.replace('images/images/', 'images/');
  }
  
  // Ensure the key starts with 'images/'
  if (!normalizedKey.startsWith('images/')) {
    normalizedKey = `images/${normalizedKey}`;
  }
  
  return normalizedKey;
}

/**
 * Upload an image from binary data
 * 
 * @param fileBuffer - The file buffer to upload
 * @param originalFilename - The original filename
 * @returns The object key of the uploaded image
 * @throws Error if the upload fails
 */
export async function uploadImage(fileBuffer: Buffer, originalFilename: string): Promise<string> {
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const objectKey = `images/${uniqueFilename}`;
  
  try {
    console.log(`[uploadImage] Uploading image: ${objectKey}`);
    const { ok, error } = await client.uploadFromBytes(objectKey, fileBuffer);
    
    if (!ok) {
      console.error("[uploadImage] Error uploading to object storage:", error);
      throw new Error(`Failed to upload image: ${error?.message || 'Unknown error'}`);
    }
    
    console.log(`[uploadImage] Successfully uploaded image: ${objectKey}`);
    // Return the full path to the image that can be stored in the database
    return objectKey;
  } catch (error) {
    console.error("[uploadImage] Error uploading to object storage:", error);
    throw error;
  }
}

/**
 * Upload an image from a file path
 * 
 * @param filePath - The path to the file to upload
 * @param customKey - Optional custom key to use instead of generating one
 * @returns The object key of the uploaded image
 * @throws Error if the upload fails
 */
export async function uploadImageFromFile(filePath: string, customKey?: string): Promise<string> {
  try {
    const filename = path.basename(filePath);
    const objectKey = customKey || `images/${generateUniqueFilename(filename)}`;
    
    console.log(`[uploadImageFromFile] Uploading image from file: ${filePath} to ${objectKey}`);
    const { ok, error } = await client.uploadFromFilename(objectKey, filePath);
    
    if (!ok) {
      console.error("[uploadImageFromFile] Error uploading to object storage:", error);
      throw new Error(`Failed to upload image from file: ${error?.message || 'Unknown error'}`);
    }
    
    console.log(`[uploadImageFromFile] Successfully uploaded image: ${objectKey}`);
    return objectKey;
  } catch (error) {
    console.error("[uploadImageFromFile] Error uploading to object storage:", error);
    throw error;
  }
}

/**
 * Delete an image by its key
 * 
 * @param objectKey - The key of the image to delete
 * @returns True if the deletion was successful, false otherwise
 */
export async function deleteImage(objectKey: string): Promise<boolean> {
  try {
    console.log(`[deleteImage] Deleting image: ${objectKey}`);
    const normalizedKey = normalizeObjectKey(objectKey);
    const { ok, error } = await client.delete(normalizedKey);
    
    if (!ok) {
      console.error("[deleteImage] Error deleting from object storage:", error);
      return false;
    }
    
    console.log(`[deleteImage] Successfully deleted image: ${normalizedKey}`);
    return true;
  } catch (error) {
    console.error("[deleteImage] Error deleting from object storage:", error);
    return false;
  }
}

/**
 * Get image data from object storage
 * 
 * @param objectKey - The key of the image to download
 * @returns The image data as a buffer, or null if the download fails
 */
export async function getImageData(objectKey: string): Promise<Buffer | null> {
  try {
    console.log(`[getImageData] Attempting to download image data for: ${objectKey}`);
    
    // Try to normalize the path
    let normalizedKey = normalizeObjectKey(objectKey);
    console.log(`[getImageData] Normalized key: ${normalizedKey}`);
    
    // Create an array of paths to try, starting with direct bucket access
    const pathsToTry = [];
    
    // Add the direct paths with highest priority
    pathsToTry.push(objectKey); // Try exactly what was requested first
    pathsToTry.push(normalizedKey);
    
    // Direct bucket access paths
    pathsToTry.push(`${BUCKET_ID}/${normalizedKey}`);
    pathsToTry.push(`${BUCKET_ID}/${objectKey}`);
    
    // If the path has a filename, try direct access with just the filename
    const filename = path.basename(objectKey);
    if (filename !== objectKey) {
      pathsToTry.push(`${BUCKET_ID}/${filename}`);
      pathsToTry.push(`${BUCKET_ID}/images/${filename}`);
      pathsToTry.push(filename);
      pathsToTry.push(`images/${filename}`);
    }
    
    // Try without the 'images/' prefix if it exists
    if (objectKey.startsWith('images/')) {
      const keyWithoutPrefix = objectKey.substring(7);
      pathsToTry.push(keyWithoutPrefix);
    }
    
    // Log all paths we're going to try
    console.log(`[getImageData] Will try these paths:`, pathsToTry);
    
    // Try each path until we find the image
    for (const path of pathsToTry) {
      console.log(`[getImageData] Trying path: ${path}`);
      try {
        const result = await client.downloadAsBytes(path);
        if (result.ok && result.value) {
          console.log(`[getImageData] Successfully retrieved image data for ${path}, size: ${result.value.length} bytes`);
          
          // Handle buffer conversion with a more reliable approach
          let data: Buffer;
          
          try {
            // First try to directly use it if it's already a Buffer
            if (Buffer.isBuffer(result.value)) {
              data = result.value;
              console.log(`[getImageData] Using existing Buffer`);
            } else {
              // Use a safer conversion method that works with many formats
              const tempBuffer = Buffer.alloc(result.value.length);
              
              // Copy bytes manually to ensure we're getting the right data
              for (let i = 0; i < result.value.length; i++) {
                tempBuffer[i] = result.value[i];
              }
              
              data = tempBuffer;
              console.log(`[getImageData] Converted data to Buffer using manual copy`);
            }
          } catch (e) {
            console.error(`[getImageData] Error during Buffer conversion: ${e}`);
            
            // Last resort - try again with a different approach
            try {
              // For some result types this might be the only viable method
              data = Buffer.from(String(result.value));
              console.log(`[getImageData] Fallback to string-based conversion`);
            } catch (e2) {
              console.error(`[getImageData] All Buffer conversion methods failed: ${e2}`);
              // Return empty buffer as we can't proceed
              data = Buffer.alloc(0);
            }
          }
          
          console.log(`[getImageData] Converted to proper Buffer, is Buffer: ${Buffer.isBuffer(data)}, size: ${data.length} bytes`);
          return data;
        }
      } catch (error: any) {
        console.log(`[getImageData] Failed with path ${path}: ${error.message}`);
        // Continue to the next path
      }
    }
    
    // If all attempts failed, try listing all objects to find similar keys
    console.log(`[getImageData] All attempts failed, listing all objects to find similar keys...`);
    const listResult = await client.list();
    if (listResult.ok && listResult.value) {
      const allKeys = listResult.value.map(obj => obj.name || String(obj));
      
      // Try to find similar keys
      const similarKeys = allKeys.filter(key => 
        key.includes(filename) || 
        filename.includes(path.basename(key))
      );
      
      if (similarKeys.length > 0) {
        console.log(`[getImageData] Found similar keys:`, similarKeys);
        
        // Try each similar key
        for (const similarKey of similarKeys) {
          console.log(`[getImageData] Trying similar key: ${similarKey}`);
          try {
            const result = await client.downloadAsBytes(similarKey);
            if (result.ok && result.value) {
              console.log(`[getImageData] Successfully retrieved image data using similar key: ${similarKey}, size: ${result.value.length} bytes`);
              
              // Convert the retrieved data to a proper Buffer
              let data: Buffer;
              
              // Simplify the handling - use Buffer.from with a string if needed
              try {
                if (Buffer.isBuffer(result.value)) {
                  // Already a Buffer, use it directly
                  data = result.value;
                } else if (Array.isArray(result.value)) {
                  // For array data, JSON stringify and parse to get a proper array
                  const bytes = JSON.parse(JSON.stringify(result.value));
                  data = Buffer.from(bytes);
                } else if (typeof result.value === 'string') {
                  // String data can be directly converted
                  data = Buffer.from(result.value);
                } else {
                  // Try generic buffer conversion
                  data = Buffer.from(String(result.value));
                }
              } catch (e) {
                console.error(`[getImageData] Error converting to Buffer: ${e}`);
                // As a last resort, convert to string
                data = Buffer.from(String(result.value));
              }
              
              console.log(`[getImageData] Converted similar key data to proper Buffer, is Buffer: ${Buffer.isBuffer(data)}, size: ${data.length} bytes`);
              return data;
            }
          } catch (error: any) {
            console.log(`[getImageData] Failed with similar key ${similarKey}: ${error.message}`);
            // Continue to the next similar key
          }
        }
      } else {
        console.log(`[getImageData] No similar keys found`);
      }
    }
    
    console.log(`[getImageData] All attempts to retrieve image data failed for ${objectKey}`);
    return null;
  } catch (error: any) {
    console.error(`[getImageData] Error downloading from object storage:`, error);
    return null;
  }
}

/**
 * Get image data as a stream
 * 
 * @param objectKey - The key of the image to download
 * @returns The image data as a stream, or null if the download fails
 */
export async function getImageStream(objectKey: string): Promise<Readable | null> {
  try {
    console.log(`[getImageStream] Attempting to download image stream for: ${objectKey}`);
    
    // Try to normalize the path
    let normalizedKey = normalizeObjectKey(objectKey);
    console.log(`[getImageStream] Normalized key: ${normalizedKey}`);
    
    // Try with the normalized key first
    try {
      console.log(`[getImageStream] Trying normalized key: ${normalizedKey}`);
      const stream = await client.downloadAsStream(normalizedKey);
      console.log(`[getImageStream] Successfully retrieved image stream for ${normalizedKey}`);
      return stream;
    } catch (error: any) {
      console.log(`[getImageStream] Failed with normalized key: ${error.message}`);
      
      // If that fails, try with the original key
      if (normalizedKey !== objectKey) {
        try {
          console.log(`[getImageStream] Trying original key: ${objectKey}`);
          const stream = await client.downloadAsStream(objectKey);
          console.log(`[getImageStream] Successfully retrieved image stream for ${objectKey}`);
          return stream;
        } catch (error: any) {
          console.log(`[getImageStream] Failed with original key: ${error.message}`);
        }
      }
      
      // If that fails too, try without the 'images/' prefix
      if (objectKey.startsWith('images/')) {
        const keyWithoutPrefix = objectKey.substring(7);
        try {
          console.log(`[getImageStream] Trying without images/ prefix: ${keyWithoutPrefix}`);
          const stream = await client.downloadAsStream(keyWithoutPrefix);
          console.log(`[getImageStream] Successfully retrieved image stream for ${keyWithoutPrefix}`);
          return stream;
        } catch (error: any) {
          console.log(`[getImageStream] Failed without images/ prefix: ${error.message}`);
        }
      }
      
      // If all previous attempts failed, try with just the filename
      const filename = path.basename(objectKey);
      try {
        console.log(`[getImageStream] Trying with just filename with prefix: images/${filename}`);
        const stream = await client.downloadAsStream(`images/${filename}`);
        console.log(`[getImageStream] Successfully retrieved image stream for images/${filename}`);
        return stream;
      } catch (error: any) {
        console.log(`[getImageStream] Failed with images/${filename}: ${error.message}`);
        
        try {
          console.log(`[getImageStream] Trying with just filename: ${filename}`);
          const stream = await client.downloadAsStream(filename);
          console.log(`[getImageStream] Successfully retrieved image stream for ${filename}`);
          return stream;
        } catch (error: any) {
          console.log(`[getImageStream] Failed with ${filename}: ${error.message}`);
        }
      }
      
      // Try direct access with bucket ID for various path formats
      const directPaths = [
        `${BUCKET_ID}/${normalizedKey}`,
        `${BUCKET_ID}/${objectKey}`,
        `${BUCKET_ID}/images/${path.basename(objectKey)}`,
        `${BUCKET_ID}/${path.basename(objectKey)}`
      ];
      
      for (const directPath of directPaths) {
        try {
          console.log(`[getImageStream] Trying direct bucket access: ${directPath}`);
          const stream = await client.downloadAsStream(directPath);
          console.log(`[getImageStream] Successfully retrieved image stream with direct bucket access: ${directPath}`);
          return stream;
        } catch (error: any) {
          console.log(`[getImageStream] Failed with direct bucket access ${directPath}: ${error.message}`);
        }
      }
      
      // If we get here, all attempts failed
      console.error(`[getImageStream] All attempts to get image stream failed for ${objectKey}`);
      return null;
    }
  } catch (error) {
    console.error(`[getImageStream] Error downloading stream from object storage:`, error);
    return null;
  }
}

/**
 * Download an image to a file
 * 
 * @param objectKey - The key of the image to download
 * @param destFilename - The destination filename
 * @returns True if the download was successful, false otherwise
 */
export async function downloadImageToFile(objectKey: string, destFilename: string): Promise<boolean> {
  try {
    console.log(`[downloadImageToFile] Downloading image to file: ${objectKey} -> ${destFilename}`);
    const normalizedKey = normalizeObjectKey(objectKey);
    
    const { ok, error } = await client.downloadToFilename(normalizedKey, destFilename);
    
    if (!ok) {
      console.error(`[downloadImageToFile] Error downloading to file:`, error);
      return false;
    }
    
    console.log(`[downloadImageToFile] Successfully downloaded image to file: ${destFilename}`);
    return true;
  } catch (error) {
    console.error(`[downloadImageToFile] Error downloading to file:`, error);
    return false;
  }
}

/**
 * List all images in the storage
 * 
 * @returns An array of object keys
 */
export async function listImages(): Promise<string[]> {
  try {
    console.log("[listImages] Listing all images in object storage...");
    const { ok, value, error } = await client.list();
    
    if (!ok || !value) {
      console.error("[listImages] Error listing objects in storage:", error);
      return [];
    }
    
    // Process and properly format each object name
    const objectKeys = value.map(obj => {
      // Extract the actual key from the object (which might have a 'name' property)
      const objKey = obj.name ? obj.name : String(obj);
      return objKey;
    });
    
    console.log(`[listImages] Found ${objectKeys.length} objects in storage`);
    return objectKeys;
  } catch (error) {
    console.error("[listImages] Error listing images in storage:", error);
    return [];
  }
}

/**
 * Check if an image exists in storage
 * 
 * @param objectKey - The key of the image to check
 * @returns True if the image exists, false otherwise
 */
export async function imageExists(objectKey: string): Promise<boolean> {
  try {
    console.log(`[imageExists] Checking if image exists: ${objectKey}`);
    const normalizedKey = normalizeObjectKey(objectKey);
    const { ok } = await client.downloadAsBytes(normalizedKey);
    
    console.log(`[imageExists] Image ${normalizedKey} exists: ${ok}`);
    return ok;
  } catch (error) {
    console.error(`[imageExists] Error checking if image exists:`, error);
    return false;
  }
}

/**
 * Check if an image exists in object storage with multiple path variations
 * 
 * @param objectKey - The key of the image to check
 * @returns True if the image exists in any of the path variations, false otherwise
 */
export async function imageExistsWithVariations(objectKey: string): Promise<boolean> {
  try {
    console.log(`[imageExistsWithVariations] Checking if image exists: ${objectKey}`);
    
    // Try with the normalized key first
    let normalizedKey = normalizeObjectKey(objectKey);
    console.log(`[imageExistsWithVariations] Normalized key: ${normalizedKey}`);
    
    // Create an array of paths to try
    const pathsToTry = [
      normalizedKey,
      objectKey,
    ];
    
    // Try without the 'images/' prefix if it exists
    if (objectKey.startsWith('images/')) {
      const keyWithoutPrefix = objectKey.substring(7);
      pathsToTry.push(keyWithoutPrefix);
    }
    
    // Try with just the filename
    const filename = path.basename(objectKey);
    pathsToTry.push(filename);
    pathsToTry.push(`images/${filename}`);
    
    // Try direct access with bucket ID
    pathsToTry.push(`${BUCKET_ID}/${normalizedKey}`);
    pathsToTry.push(`${BUCKET_ID}/${objectKey}`);
    pathsToTry.push(`${BUCKET_ID}/images/${filename}`);
    pathsToTry.push(`${BUCKET_ID}/${filename}`);
    
    // Try each path
    for (const path of pathsToTry) {
      console.log(`[imageExistsWithVariations] Checking path: ${path}`);
      const exists = await imageExists(path);
      if (exists) {
        console.log(`[imageExistsWithVariations] Image exists at path: ${path}`);
        return true;
      }
    }
    
    console.log(`[imageExistsWithVariations] Image does not exist in any path variation`);
    return false;
  } catch (error: any) {
    console.error(`[imageExistsWithVariations] Error checking if image exists:`, error);
    return false;
  }
}

/**
 * Extract the filename from a full object key
 * 
 * @param objectKey - The object key
 * @returns The filename
 */
export function getFilenameFromObjectKey(objectKey: string): string {
  return path.basename(objectKey);
}

/**
 * Check if the object storage is properly configured
 * 
 * @returns True if the object storage is properly configured, false otherwise
 */
export async function checkStorageConfig(): Promise<boolean> {
  try {
    console.log(`[checkStorageConfig] Checking if object storage is properly configured`);
    
    // Try to list objects to check if the client is properly configured
    const result = await client.list();
    
    if (!result.ok) {
      console.error(`[checkStorageConfig] Error listing objects:`, result.error);
      return false;
    }
    
    // Try to access the bucket directly
    try {
      const bucketResult = await client.list({ prefix: BUCKET_ID });
      console.log(`[checkStorageConfig] Direct bucket access result:`, bucketResult);
    } catch (error: any) {
      console.log(`[checkStorageConfig] Direct bucket access error (this is expected):`, error.message);
      // This is expected to fail, but we're just checking if we can access the API
    }
    
    console.log(`[checkStorageConfig] Object storage is properly configured`);
    return true;
  } catch (error: any) {
    console.error(`[checkStorageConfig] Error checking object storage configuration:`, error);
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