/**
 * Client-side Object Storage Utilities
 * 
 * This file contains utility functions for working with image storage
 * on the client side, including URL generation and validation.
 * Updated to support database storage of images.
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
 * Check if a URL is a database image URL
 * 
 * @param url - The URL to check
 * @returns True if the URL is a database image URL
 */
export function isDatabaseImageUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  
  // Database images use the /api/db-images/ endpoint
  return url.startsWith('/api/db-images/') || url.startsWith('dbimg_');
}

/**
 * Generate a URL for an image stored in object storage or database
 * 
 * @param objectKey - The key of the image or image URL
 * @returns The URL to access the image
 */
export function getImageUrl(objectKey: string): string {
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
  
  // If it's already a database image URL, return it as is
  if (objectKey.startsWith('/api/db-images/')) {
    return objectKey;
  }
  
  // If it's a database image key without the full path
  if (objectKey.startsWith('dbimg_')) {
    return `/api/db-images/${objectKey}`;
  }
  
  // If it's an object storage key, use the API endpoint
  if (isObjectStorageKey(objectKey)) {
    return `/api/images/${encodeURIComponent(objectKey)}`;
  }
  
  // Default case - return the original key
  return objectKey;
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
 * @returns 'database', 'object-storage', 'legacy', or 'external'
 */
export function getImageSourceType(url: string): 'database' | 'object-storage' | 'legacy' | 'external' {
  if (!url) {
    return 'external';
  }
  
  if (isDatabaseImageUrl(url)) {
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