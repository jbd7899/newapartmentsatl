#!/bin/bash

# Migration shell script to run the database schema migration and data migration

# Print header
echo "===================================================="
echo "  Real Estate Property Management System Migration"
echo "===================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Please make sure your database is configured correctly."
  exit 1
fi

# Step 1: Create necessary schema tables directly with SQL
echo "Step 1: Creating or updating necessary database tables..."

# Properties table - add missing columns if needed
echo "Updating properties table schema..."
cat << EOF | psql $DATABASE_URL
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'apartment',
ADD COLUMN IF NOT EXISTS is_multifamily BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS unit_count INTEGER DEFAULT 0;
EOF

# Create image_storage table if it doesn't exist
echo "Creating image_storage table if it doesn't exist..."
cat << EOF | psql $DATABASE_URL
CREATE TABLE IF NOT EXISTS image_storage (
  id SERIAL PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
EOF

echo "Schema updates completed successfully!"
echo ""

# Step 2: Run data migration from in-memory to PostgreSQL
echo "Step 2: Running data migration from in-memory to PostgreSQL..."
npx tsx server/run-migration.ts

# Check if migration was successful
if [ $? -ne 0 ]; then
  echo "Data migration failed. Exiting."
  exit 1
fi

echo ""
echo "===================================================="
echo "  Migration completed successfully!"
echo "===================================================="
echo ""
echo "Your application has been successfully migrated to PostgreSQL"
echo "and all images have been moved to object storage."
echo ""
echo "To verify the migration:"
echo "1. Check that all properties appear correctly in the application"
echo "2. Verify that all images are displayed properly"
echo "3. Confirm that property relationships are maintained"
echo ""