/**
 * Database Migration Script
 * 
 * This script applies database schema migrations.
 */
import { db, schema } from './db';
import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres';
import { migrate } from 'drizzle-orm/postgres/migrator';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Running database schema migration...');

  try {
    // Add new columns to properties table
    console.log('Adding new columns to properties table...');
    await db.execute(sql`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'apartment',
      ADD COLUMN IF NOT EXISTS is_multifamily BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS unit_count INTEGER DEFAULT 0
    `);
    console.log('Added property_type, is_multifamily, and unit_count columns to properties table');

    // Check if property_images table exists, create if not
    console.log('Creating property_images table if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS property_images (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        object_key TEXT NOT NULL,
        alt TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        mime_type TEXT,
        size INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Ensured property_images table exists');

    // Check if property_units table exists, create if not
    console.log('Creating property_units table if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS property_units (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        unit_number TEXT NOT NULL,
        bedrooms INTEGER NOT NULL,
        bathrooms INTEGER NOT NULL,
        sqft INTEGER NOT NULL,
        rent INTEGER,
        available BOOLEAN NOT NULL DEFAULT true,
        description TEXT NOT NULL DEFAULT '',
        features TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Ensured property_units table exists');

    // Check if unit_images table exists, create if not
    console.log('Creating unit_images table if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS unit_images (
        id SERIAL PRIMARY KEY,
        unit_id INTEGER NOT NULL,
        object_key TEXT NOT NULL,
        alt TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        mime_type TEXT,
        size INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Ensured unit_images table exists');

    // Check if image_storage table exists, create if not
    console.log('Creating image_storage table if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS image_storage (
        id SERIAL PRIMARY KEY,
        object_key TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Ensured image_storage table exists');

    console.log('Database schema migration completed successfully!');
  } catch (error) {
    console.error('Database schema migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });