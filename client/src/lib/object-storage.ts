/**
 * Client-side Object Storage Utilities
 * 
 * This file contains utility functions for working with Object Storage
 * on the client side, including URL generation and validation.
 * Simplified to use only Replit's Object Storage for all images.
 */

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

/**
 * Check if a URL is a property-specific image URL 
 * (these will still work but are now backed by Object Storage)
 * 
 * @param url - The URL to check
 * @returns True if the URL is a property or unit image URL
 */
export function isPropertyImageUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  
  // Property/unit images use these endpoints
  return url.startsWith('/api/property-images/') || 
         url.startsWith('/api/unit-images/') ||
         url.startsWith('propimg_') || 
         url.startsWith('unitimg_');
}

/**
 * Generate a URL for an image stored in object storage or property/unit images
 * 
 * @param objectKey - The key of the image or image URL
 * @param type - Optional type hint ('property' or 'unit') for property/unit images
 * @returns The URL to access the image
 */
export function getImageUrl(objectKey: string, type?: 'property' | 'unit'): string {
  if (!objectKey) {
    return '';
  }
  
  // If the URL is already a full URL (e.g., https://...), return it as is
  if (objectKey.startsWith('http')) {
    return objectKey;
  }
  
  // If it's a legacy URL starting with /uploads/, return it as is
  if (objectKey.startsWith('/uploads/')) {
    return objectKey;
  }
  
  // If it's already an API image URL, return it as is
  if (objectKey.startsWith('/api/property-images/') || 
      objectKey.startsWith('/api/unit-images/')) {
    return objectKey;
  }
  
  // If it's a property image with type hint
  if (type === 'property') {
    return `/api/property-images/${encodeURIComponent(objectKey)}`;
  }
  
  // If it's a unit image with type hint
  if (type === 'unit') {
    return `/api/unit-images/${encodeURIComponent(objectKey)}`;
  }
  
  // If it's a property image key without the full path
  if (objectKey.startsWith('propimg_')) {
    return `/api/property-images/${objectKey}`;
  }
  
  // If it's a unit image key without the full path
  if (objectKey.startsWith('unitimg_')) {
    return `/api/unit-images/${objectKey}`;
  }
  
  // If it's an object storage key or any other key, use the object storage API endpoint
  return `/api/images/${encodeURIComponent(objectKey)}`;
}

/**
 * Extract the filename from an object key
 * 
 * @param objectKey - The object storage key
 * @returns The filename portion of the key
 */
export function getFilenameFromObjectKey(objectKey: string): string {
  if (!objectKey) {
    return '';
  }
  
  // For database images that include the path
  if (objectKey.startsWith('/api/db-images/')) {
    objectKey = objectKey.split('/api/db-images/')[1];
  }
  
  // Split by '/' and get the last part
  const parts = objectKey.split('/');
  return parts[parts.length - 1];
}

/**
 * Check if an image URL is from database, object storage, or external
 * 
 * @param url - The image URL to check
 * @returns 'database', 'object-storage', 'property-image', 'unit-image', 'legacy', or 'external'
 */
export function getImageSourceType(url: string): 'database' | 'object-storage' | 'property-image' | 'unit-image' | 'legacy' | 'external' {
  if (!url) {
    return 'external';
  }
  
  if (url.startsWith('/api/property-images/')) {
    return 'property-image';
  }
  
  if (url.startsWith('/api/unit-images/')) {
    return 'unit-image';
  }
  
  if (url.startsWith('/api/db-images/') || url.startsWith('dbimg_')) {
    return 'database';
  }
  
  if (isObjectStorageKey(url)) {
    return 'object-storage';
  }
  
  if (url.startsWith('/uploads/')) {
    return 'legacy';
  }
  
  return 'external';
} 