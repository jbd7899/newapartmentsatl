import { pgTable, text, serial, integer, boolean, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  linkText: text("link_text").notNull(),
});

// Neighborhood information
export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().unique(),
  mapImageUrl: text("map_image_url"),
  highlights: text("highlights"),
  attractions: text("attractions"),
  transportationInfo: text("transportation_info"),
  diningOptions: text("dining_options"),
  schoolsInfo: text("schools_info"),
  parksAndRecreation: text("parks_and_recreation"),
  historicalInfo: text("historical_info"),
  // Explore section
  exploreDescription: text("explore_description"),
  exploreMapUrl: text("explore_map_url"),
  exploreHotspots: text("explore_hotspots"), // JSON string of hotspots
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({
  id: true,
  createdAt: true
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  sqft: integer("sqft").notNull(),
  rent: integer("rent"),
  available: boolean("available").notNull().default(true),
  locationId: integer("location_id").notNull(),
  imageUrl: text("image_url").notNull(),
  features: text("features").notNull(),
  propertyType: text("property_type").notNull().default("multi-family"), // single-family, multi-family, townhome
  isMultifamily: boolean("is_multifamily").notNull().default(false),
  unitCount: integer("unit_count").default(0),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true
});

// Features table
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true
});

// Type definitions
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;

// Inquiries table
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  propertyId: integer("property_id"),
  propertyName: text("property_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("new") // "new", "contacted", "resolved"
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

// Property Images table with integrated storage
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  // Storage fields
  objectKey: text("object_key"),  // Storage key (used when image is stored in object storage)
  mimeType: text("mime_type"),    // MIME type of the image
  size: integer("size"),          // Size in bytes
  imageData: text("image_data"),  // Base64 encoded image data for database storage
  storageType: text("storage_type").default("external"), // "external", "object-storage", or "database"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyImageSchema = createInsertSchema(propertyImages).omit({
  id: true,
  createdAt: true
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = z.infer<typeof insertPropertyImageSchema>;

// Property Units table
export const propertyUnits = pgTable("property_units", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  unitNumber: text("unit_number").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  sqft: integer("sqft").notNull(),
  rent: integer("rent"),
  available: boolean("available").notNull().default(true),
  description: text("description").notNull().default(""),
  features: text("features").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyUnitSchema = createInsertSchema(propertyUnits).omit({
  id: true,
  createdAt: true
});

export type PropertyUnit = typeof propertyUnits.$inferSelect;
export type InsertPropertyUnit = z.infer<typeof insertPropertyUnitSchema>;

// Unit Images table with integrated storage
export const unitImages = pgTable("unit_images", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  // Storage fields (same as property images)
  objectKey: text("object_key"),  // Storage key (used when image is stored in object storage)
  mimeType: text("mime_type"),    // MIME type of the image
  size: integer("size"),          // Size in bytes
  imageData: text("image_data"),  // Base64 encoded image data for database storage
  storageType: text("storage_type").default("external"), // "external", "object-storage", or "database"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUnitImageSchema = createInsertSchema(unitImages).omit({
  id: true,
  createdAt: true
});

export type UnitImage = typeof unitImages.$inferSelect;
export type InsertUnitImage = z.infer<typeof insertUnitImageSchema>;

// Image Storage table for storing binary data
export const imageStorage = pgTable("image_storage", {
  id: serial("id").primaryKey(),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // Base64 encoded image data
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertImageStorageSchema = createInsertSchema(imageStorage).omit({
  id: true,
  createdAt: true
});

export type ImageStorage = typeof imageStorage.$inferSelect;
export type InsertImageStorage = z.infer<typeof insertImageStorageSchema>;
