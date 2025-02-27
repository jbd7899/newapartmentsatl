#!/bin/bash

# Migration shell script to run the database schema migration and data migration

# Print header
echo "===================================================="
echo "  Real Estate Property Management System Migration"
echo "===================================================="
echo ""

# Step 1: Run database schema migration 
echo "Step 1: Running database schema migration..."
npx tsx server/migrate.ts

# Check if migration was successful
if [ $? -ne 0 ]; then
  echo "Database schema migration failed. Exiting."
  exit 1
fi

echo ""
echo "Schema migration completed successfully!"
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