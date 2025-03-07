import { pgTable, text, serial, integer, boolean, varchar, timestamp, decimal } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/sqlite-core";
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
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
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

// Property Images table - using both URLs and object storage
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  url: text("url"),                // External URL to the image (legacy)
  objectKey: text("object_key"),   // Object storage key
  alt: text("alt").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  mimeType: text("mime_type"),     // MIME type for object storage
  size: integer("size"),           // File size in bytes
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
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  sqft: integer("sqft").notNull(),
  rent: integer("rent"),
  available: boolean("available").notNull().default(true),
  description: text("description").notNull().default(""),
  features: text("features").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyUnitSchema = createInsertSchema(propertyUnits)
.omit({
  id: true,
  createdAt: true
})
.extend({
  bathrooms: z.coerce.number() // This will coerce strings to numbers
});

// Unit Images table - using both URLs and object storage
export const unitImages = pgTable("unit_images", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  url: text("url"),                // External URL to the image (legacy)
  objectKey: text("object_key"),   // Object storage key
  alt: text("alt").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  mimeType: text("mime_type"),     // MIME type for object storage
  size: integer("size"),           // File size in bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUnitImageSchema = createInsertSchema(unitImages).omit({
  id: true,
  createdAt: true
});

export type UnitImage = typeof unitImages.$inferSelect;
export type InsertUnitImage = z.infer<typeof insertUnitImageSchema>;

// Image storage tracking table - for object storage metadata
export const imageStorage = pgTable("image_storage", {
  id: serial("id").primaryKey(),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertImageStorageSchema = createInsertSchema(imageStorage).omit({
  id: true,
  createdAt: true
});

export type ImageStorage = typeof imageStorage.$inferSelect;
export type InsertImageStorage = z.infer<typeof insertImageStorageSchema>;
