import { pgTable, text, serial, integer, boolean, varchar } from "drizzle-orm/pg-core";
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
  rent: integer("rent").notNull(),
  available: boolean("available").notNull().default(true),
  locationId: integer("location_id").notNull(),
  imageUrl: text("image_url").notNull(),
  features: text("features").notNull(),
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

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
