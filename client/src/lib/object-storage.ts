/**
 * Client-side Object Storage Utilities
 * 
 * This file contains utility functions for working with Replit Object Storage
 * on the client side, including URL generation and validation.
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
 * Generate a URL for an image stored in object storage
 * 
 * @param objectKey - The key of the image in object storage
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
  
  // Split by '/' and get the last part
  const parts = objectKey.split('/');
  return parts[parts.length - 1];
}

/**
 * Check if an image URL is from object storage or external
 * 
 * @param url - The image URL to check
 * @returns 'object-storage', 'legacy', or 'external'
 */
export function getImageSourceType(url: string): 'object-storage' | 'legacy' | 'external' {
  if (!url) {
    return 'external';
  }
  
  if (isObjectStorageKey(url)) {
    return 'object-storage';
  }
  
  if (url.startsWith('/uploads/')) {
    return 'legacy';
  }
  
  return 'external';
} 