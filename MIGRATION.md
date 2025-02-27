# Database Migration Guide

This document provides detailed instructions for migrating the Real Estate Property Management System from in-memory storage to PostgreSQL, while simultaneously moving all images to Replit Object Storage.

## Overview

The migration process involves two main steps:
1. **Schema Migration**: Create or update the necessary database tables in PostgreSQL
2. **Data Migration**: Move data from in-memory storage to PostgreSQL and upload images to object storage

## Prerequisites

Before running the migration, ensure you have:

- PostgreSQL database set up and configured (the DATABASE_URL environment variable is set)
- Replit Object Storage configured and accessible
- Node.js and npm/npx installed
- All project dependencies installed (`npm install`)

## Running the Migration

### Automatic Migration (Recommended)

The easiest way to run the complete migration is using the provided shell script:

```bash
# Make the script executable
chmod +x run-migration.sh

# Run the migration
./run-migration.sh
```

This script will:
1. Run the database schema migration
2. Run the data migration from in-memory storage to PostgreSQL
3. Upload all images to object storage
4. Update image references in the database

### Manual Migration Steps

If you prefer to run the migration steps manually:

1. **Schema Migration**:
   ```bash
   npx tsx server/migrate.ts
   ```

2. **Data Migration**:
   ```bash
   npx tsx server/run-migration.ts
   ```

## Migration Details

The migration process performs the following steps:

1. **Schema Setup**:
   - Creates or updates necessary database tables
   - Adds required columns to existing tables
   - Sets up appropriate constraints and defaults

2. **Data Migration**:
   - Extracts all entities from in-memory storage
   - Preserves all IDs and relationships
   - Migrates locations, neighborhoods, properties, features, inquiries, property units, etc.

3. **Image Migration**:
   - Downloads images from external URLs
   - Uploads images to Replit Object Storage
   - Stores object storage keys in the database
   - Updates image references to use object storage keys

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Symptom**: Error connecting to PostgreSQL database

**Solution**:
- Verify the DATABASE_URL environment variable is set correctly
- Ensure the PostgreSQL database is running and accessible
- Check network connectivity to the database server

#### Object Storage Issues

**Symptom**: Errors uploading or accessing images in object storage

**Solution**:
- Verify object storage configuration
- Check Replit object storage access permissions
- Ensure all required environment variables for object storage are set

#### Migration Failures

**Symptom**: Migration script fails with errors

**Solution**:
- Check the error message for specific issues
- Verify the database is accessible
- Check for missing tables or columns
- Run the schema migration before the data migration

### Rollback Procedure

If you need to rollback the migration:

1. **Database Rollback**:
   ```sql
   -- Delete data from migrated tables
   TRUNCATE TABLE properties CASCADE;
   TRUNCATE TABLE locations CASCADE;
   TRUNCATE TABLE neighborhoods CASCADE;
   TRUNCATE TABLE features CASCADE;
   TRUNCATE TABLE inquiries CASCADE;
   TRUNCATE TABLE property_images CASCADE;
   TRUNCATE TABLE property_units CASCADE;
   TRUNCATE TABLE unit_images CASCADE;
   TRUNCATE TABLE image_storage CASCADE;
   ```

2. **Code Rollback**:
   - Switch the storage implementation back to in-memory storage in `server/index.ts`
   - Update client code to handle image URLs instead of object keys

## Verification

After migration, verify that:

1. All data has been properly migrated
2. All images are accessible via object storage
3. All entity relationships are preserved
4. The application functions correctly with the new storage backend

## Support

If you encounter any issues during the migration process, please:

1. Check the console logs for specific error messages
2. Verify all prerequisites are met
3. Try running the migration script again (it's designed to be idempotent)
4. Contact the development team if issues persist