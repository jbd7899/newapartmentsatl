import { Location, Property, Feature, Inquiry, InsertInquiry } from "@shared/schema";
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
