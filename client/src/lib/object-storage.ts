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
  
  // If it starts with these paths, it's not an object storage key
  if (url.startsWith('/uploads/') || 
      url.startsWith('/api/property-images/') || 
      url.startsWith('/api/unit-images/')) {
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
  return url.startsWith('/api/property-images/') || 
         url.startsWith('/api/unit-images/');
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
    return '/placeholder-image.jpg';
  }
  
  // If it's already a full URL, return it as is
  if (objectKey.startsWith('http')) {
    return objectKey;
  }
  
  // If it's a legacy URL path from /uploads/
  if (objectKey.startsWith('/uploads/')) {
    return objectKey;
  }
  
  // If it's already formatted as a property or unit image URL
  if (objectKey.startsWith('/api/property-images/') || 
      objectKey.startsWith('/api/unit-images/')) {
    return objectKey;
  }
  
  // If type is specified, use the appropriate endpoint
  if (type === 'property') {
    return `/api/property-images/${encodeURIComponent(objectKey)}`;
  } else if (type === 'unit') {
    return `/api/unit-images/${encodeURIComponent(objectKey)}`;
  }
  
  // Default to the generic images endpoint
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
  
  // Extract the filename from the object key
  const parts = objectKey.split('/');
  return parts[parts.length - 1];
}

/**
 * Check if an image URL is from object storage, property/unit images, or external
 * 
 * @param url - The image URL to check
 * @returns 'object-storage', 'property-image', 'unit-image', 'legacy', or 'external'
 */
export function getImageSourceType(url: string): 'object-storage' | 'property-image' | 'unit-image' | 'legacy' | 'external' {
  if (!url) {
    return 'external';
  }
  
  if (url.startsWith('http')) {
    return 'external';
  }
  
  if (url.startsWith('/uploads/')) {
    return 'legacy';
  }
  
  if (url.startsWith('/api/property-images/')) {
    return 'property-image';
  }
  
  if (url.startsWith('/api/unit-images/')) {
    return 'unit-image';
  }
  
  if (url.startsWith('images/')) {
    return 'object-storage';
  }
  
  return 'external';
}