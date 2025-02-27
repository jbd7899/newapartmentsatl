/**
 * Image Utilities
 * 
 * This file contains utility functions for handling images in the client.
 * It provides functions to get image URLs from object storage keys.
 */

/**
 * Get the URL for an image from its object key or URL
 * 
 * @param objectKeyOrUrl - The object key or URL of the image
 * @param options - Optional parameters for image processing (width, height, quality)
 * @returns The URL to display the image
 */
export function getImageUrl(
  objectKeyOrUrl: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string {
  if (!objectKeyOrUrl) {
    return '/placeholder-image.jpg'; // Default placeholder image
  }
  
  // If it's a Cloudinary URL, apply transformations for optimization
  if (objectKeyOrUrl.startsWith('http') && objectKeyOrUrl.includes('cloudinary.com')) {
    const parts = objectKeyOrUrl.split('/upload/');
    if (parts.length === 2) {
      // Build transformation parameters based on provided options
      const transformations = [];
      
      // Default to fill crop if dimensions are specified
      if (options?.width || options?.height) {
        transformations.push('c_fill');
      }
      
      // Add width if specified
      if (options?.width) {
        transformations.push(`w_${options.width}`);
      }
      
      // Add height if specified
      if (options?.height) {
        transformations.push(`h_${options.height}`);
      }
      
      // Add quality (default to auto if not specified)
      transformations.push(`q_${options?.quality || 'auto'}`);
      
      // If no transformations, return original URL
      if (transformations.length === 0) {
        return objectKeyOrUrl;
      }
      
      // Apply transformations
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }
    return objectKeyOrUrl;
  }
  
  // If it's already a full URL but not Cloudinary, return it as is
  if (objectKeyOrUrl.startsWith('http')) {
    return objectKeyOrUrl;
  }
  
  // If it's a legacy URL path from /uploads/
  if (objectKeyOrUrl.startsWith('/uploads/')) {
    return objectKeyOrUrl;
  }
  
  // Special handling for property or unit image endpoints
  if (objectKeyOrUrl.startsWith('/api/property-images/') || 
      objectKeyOrUrl.startsWith('/api/unit-images/')) {
    return objectKeyOrUrl;
  }
  
  // If it's an object storage key, use the API endpoint
  return `/api/images/${encodeURIComponent(objectKeyOrUrl)}`;
}

/**
 * Check if a URL is an object storage key
 * 
 * @param url - The URL to check
 * @returns True if the URL is an object storage key
 */
export function isObjectStorageKey(url: string | null | undefined): boolean {
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
 * Determine the type of image URL
 * 
 * @param url - The URL to check
 * @returns The type of URL ('external', 'legacy', 'property', 'unit', or 'object-storage')
 */
export function getImageUrlType(url: string | null | undefined): 'external' | 'legacy' | 'property' | 'unit' | 'object-storage' | 'unknown' {
  if (!url) {
    return 'unknown';
  }
  
  if (url.startsWith('http')) {
    return 'external';
  }
  
  if (url.startsWith('/uploads/')) {
    return 'legacy';
  }
  
  if (url.startsWith('/api/property-images/')) {
    return 'property';
  }
  
  if (url.startsWith('/api/unit-images/')) {
    return 'unit';
  }
  
  if (url.startsWith('images/')) {
    return 'object-storage';
  }
  
  return 'unknown';
}

/**
 * Get the filename from an object key
 * 
 * @param objectKey - The object key
 * @returns The filename
 */
export function getFilenameFromObjectKey(objectKey: string): string {
  if (!objectKey) {
    return '';
  }
  
  // Extract the filename from the object key
  const parts = objectKey.split('/');
  return parts[parts.length - 1];
} 