# Database and Object Storage Migration Documentation

## Overview

This document outlines the process for migrating the real estate property management application from in-memory storage to PostgreSQL database and moving all images to Replit Object Storage.

## Prerequisites

Before running the migration, ensure that:

1. PostgreSQL database is properly configured and accessible
2. Replit Object Storage is configured and accessible
3. All required environment variables are set:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REPLIT_DB_URL` - Replit Database URL (if using)
   - `REPLIT_OBJECT_STORAGE_BUCKET` - Replit Object Storage bucket name

## Migration Process

The migration occurs in two main steps:

1. **Schema Updates**: Creating or updating the necessary database tables
2. **Data Migration**: Moving data from in-memory storage to PostgreSQL and images to Object Storage

### Step 1: Schema Updates

The schema updates ensure that:
- All required tables exist in the PostgreSQL database
- Tables have the correct columns and constraints
- Data types are appropriate (e.g., bathrooms field uses decimal type)
- Property tables have the necessary columns for property type and multifamily support

### Step 2: Data Migration

The data migration process:
1. Extracts all data from in-memory storage
2. Downloads images from external URLs
3. Uploads images to object storage
4. Stores object storage keys in the database
5. Preserves all relationships between entities

## Running the Migration

To run the migration:

```bash
./run-migration.sh
```

This script will:
1. Create or update the database schema
2. Migrate all data from in-memory storage to PostgreSQL
3. Download external images and upload them to object storage
4. Update image references to use object storage keys

## Validation

After migration, you should verify:

1. All properties, locations, and neighborhoods appear correctly in the application
2. All images are displayed properly
3. Property relationships are maintained
4. Units and inquiries are correctly associated with properties

## Rollback Procedure

If the migration fails or data is corrupted:

1. Stop the application
2. Restore the database from backup (if available)
3. Revert to using in-memory storage by updating `server/index.ts`
4. Restart the application

## Troubleshooting

### Common Issues

#### Database Connection Issues
- Verify the `DATABASE_URL` environment variable is set correctly
- Check that the PostgreSQL service is running
- Ensure your IP has access to the database

#### Object Storage Issues
- Verify the Object Storage configuration
- Check access permissions to the storage bucket
- Ensure the application has the necessary permissions

#### Image Migration Issues
- If some images fail to migrate, check the URLs are accessible
- Verify content types are supported
- Check for any connection issues when downloading external images

## Post-Migration

After successful migration:
1. The application will use PostgreSQL for all data storage
2. Images will be served from Replit Object Storage
3. The client will handle both legacy URLs and object storage keys
4. Performance should be improved with proper database indexing

## Technical Details

### Storage Implementation

- `server/pg-storage.ts` implements the `IStorage` interface for PostgreSQL
- `server/object-storage.ts` provides utilities for working with Object Storage
- `client/src/lib/image-utils.ts` handles image URL conversion on the client side

### Image Handling

During migration, images are:
1. Downloaded from external URLs
2. Uploaded to object storage with unique filenames
3. Referenced in the database using object keys
4. Served via the `/api/images/:objectKey` endpoint

The client automatically detects object storage keys and converts them to proper URLs for display.