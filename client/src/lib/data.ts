import { Location, Property, Feature, Inquiry, InsertInquiry, PropertyImage, InsertPropertyImage, Neighborhood, PropertyUnit, InsertPropertyUnit, UnitImage, InsertUnitImage } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Data fetching functions for client
export async function getLocations(): Promise<Location[]> {
  const response = await fetch('/api/locations');
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

export async function getLocationBySlug(slug: string): Promise<Location> {
  const response = await fetch(`/api/locations/${slug}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch location: ${slug}`);
  }
  return response.json();
}

export async function getPropertiesByLocation(slug: string): Promise<Property[]> {
  const response = await fetch(`/api/locations/${slug}/properties`);
  if (!response.ok) {
    throw new Error(`Failed to fetch properties for location: ${slug}`);
  }
  return response.json();
}

export async function getNeighborhoodByLocation(slug: string): Promise<Neighborhood> {
  const response = await fetch(`/api/locations/${slug}/neighborhood`);
  if (!response.ok) {
    throw new Error(`Failed to fetch neighborhood information for location: ${slug}`);
  }
  return response.json();
}

export async function getProperties(): Promise<Property[]> {
  const response = await fetch('/api/properties');
  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }
  return response.json();
}

export async function getProperty(id: number): Promise<Property> {
  const response = await fetch(`/api/properties/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch property: ${id}`);
  }
  return response.json();
}

export async function getFeatures(): Promise<Feature[]> {
  const response = await fetch('/api/features');
  if (!response.ok) {
    throw new Error('Failed to fetch features');
  }
  return response.json();
}

export async function getInquiries(): Promise<Inquiry[]> {
  const response = await fetch('/api/inquiries');
  if (!response.ok) {
    throw new Error('Failed to fetch inquiries');
  }
  return response.json();
}

export async function createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
  return apiRequest<Inquiry>({
    url: '/api/inquiries',
    method: 'POST',
    body: inquiry,
  });
}

export async function updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
  return apiRequest<Inquiry>({
    url: `/api/inquiries/${id}/status`,
    method: 'PATCH',
    body: { status },
  });
}

// Property Images
export async function getPropertyImages(page = 1, limit = 20): Promise<{
  data: PropertyImage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const response = await fetch(`/api/property-images?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch property images');
  }
  
  // Get the data
  const data = await response.json();
  
  // Get pagination data from headers
  const total = parseInt(response.headers.get('X-Total-Count') || '0');
  const currentPage = parseInt(response.headers.get('X-Page') || '1');
  const pageLimit = parseInt(response.headers.get('X-Limit') || '20');
  const totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');
  
  return {
    data,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages
    }
  };
}

export async function getPropertyImagesByProperty(propertyId: number): Promise<PropertyImage[]> {
  const response = await fetch(`/api/properties/${propertyId}/images`);
  if (!response.ok) {
    throw new Error(`Failed to fetch images for property: ${propertyId}`);
  }
  return response.json();
}

export async function createPropertyImage(image: InsertPropertyImage & { data?: string }): Promise<PropertyImage> {
  return apiRequest<PropertyImage>({
    url: '/api/property-images',
    method: 'POST',
    body: image,
  });
}

export async function updatePropertyImageOrder(id: number, displayOrder: number): Promise<PropertyImage> {
  return apiRequest<PropertyImage>({
    url: `/api/property-images/${id}/order`,
    method: 'PATCH',
    body: { displayOrder },
  });
}

export async function updatePropertyImageFeatured(id: number, isFeatured: boolean): Promise<PropertyImage> {
  return apiRequest<PropertyImage>({
    url: `/api/property-images/${id}/featured`,
    method: 'PATCH',
    body: { isFeatured },
  });
}

export async function deletePropertyImage(id: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/property-images/${id}`,
    method: 'DELETE',
  });
}

// Neighborhood functions
export async function createNeighborhood(slug: string, data: any): Promise<Neighborhood> {
  return apiRequest<Neighborhood>({
    url: `/api/locations/${slug}/neighborhood`,
    method: 'POST',
    body: data,
  });
}

export async function updateNeighborhood(slug: string, data: any): Promise<Neighborhood> {
  return apiRequest<Neighborhood>({
    url: `/api/locations/${slug}/neighborhood`,
    method: 'PATCH',
    body: data,
  });
}

// Property Units functions
export async function getPropertyUnits(propertyId: number): Promise<PropertyUnit[]> {
  const response = await fetch(`/api/properties/${propertyId}/units`);
  if (!response.ok) {
    throw new Error(`Failed to fetch units for property: ${propertyId}`);
  }
  return response.json();
}

export async function getPropertyUnit(id: number): Promise<PropertyUnit> {
  const response = await fetch(`/api/property-units/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch property unit: ${id}`);
  }
  return response.json();
}

export async function createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit> {
  return apiRequest<PropertyUnit>({
    url: '/api/property-units',
    method: 'POST',
    body: unit,
  });
}

export async function updatePropertyUnit(id: number, data: Partial<InsertPropertyUnit>): Promise<PropertyUnit> {
  return apiRequest<PropertyUnit>({
    url: `/api/property-units/${id}`,
    method: 'PATCH',
    body: data,
  });
}

export async function deletePropertyUnit(id: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/property-units/${id}`,
    method: 'DELETE',
  });
}

// Unit Images functions
export async function getUnitImages(unitId: number): Promise<UnitImage[]> {
  const response = await fetch(`/api/property-units/${unitId}/images`);
  if (!response.ok) {
    throw new Error(`Failed to fetch images for unit: ${unitId}`);
  }
  return response.json();
}

export async function createUnitImage(image: InsertUnitImage & { data?: string }): Promise<UnitImage> {
  return apiRequest<UnitImage>({
    url: '/api/unit-images',
    method: 'POST',
    body: image,
  });
}

export async function updateUnitImageOrder(id: number, displayOrder: number): Promise<UnitImage> {
  return apiRequest<UnitImage>({
    url: `/api/unit-images/${id}/order`,
    method: 'PATCH',
    body: { displayOrder },
  });
}

export async function updateUnitImageFeatured(id: number, isFeatured: boolean): Promise<UnitImage> {
  return apiRequest<UnitImage>({
    url: `/api/unit-images/${id}/featured`,
    method: 'PATCH',
    body: { isFeatured },
  });
}

export async function deleteUnitImage(id: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/unit-images/${id}`,
    method: 'DELETE',
  });
}

// Object Storage API functions
export async function listStorageImages(): Promise<string[]> {
  console.log("Fetching images from object storage...");
  const response = await fetch('/api/images');
  if (!response.ok) {
    console.error("Failed to fetch images from object storage:", response.status, response.statusText);
    throw new Error('Failed to fetch images from object storage');
  }
  const data = await response.json();
  console.log("Received object storage images:", data);
  return data.images || [];
}

export async function deleteStorageImage(objectKey: string): Promise<void> {
  const response = await fetch(`/api/images/${encodeURIComponent(objectKey)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete image: ${objectKey}`);
  }
}
