# Database Migration Guide

This guide explains how to migrate data from in-memory storage to PostgreSQL database and move all images to object storage.

## Overview

The migration process involves:

1. Moving all data from in-memory storage to PostgreSQL database
2. Uploading all images to object storage
3. Updating image references in the database
4. Switching the application to use PostgreSQL storage instead of in-memory storage

## Prerequisites

Before running the migration, make sure you have:

1. PostgreSQL database set up and running
2. Object storage service configured (Replit Object Storage)
3. All required environment variables set:
   - `DATABASE_URL`: PostgreSQL connection string
   - Replit Object Storage credentials (automatically configured in Replit environment)

## Running the Migration

To run the migration, follow these steps:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the migration script:
   ```bash
   npx ts-node server/run-migration.ts
   ```

3. Verify the migration:
   - Check the database to ensure all data has been migrated
   - Check the object storage to ensure all images have been uploaded
   - Start the application and verify that everything works as expected

## Switching to PostgreSQL Storage

The application has been updated to use PostgreSQL storage by default. The changes include:

1. Using `PgStorage` instead of `MemStorage` in `server/index.ts`
2. Updating image URLs to use object storage in the client

## Troubleshooting

If you encounter any issues during the migration:

1. Check the logs for error messages
2. Verify database connection settings
3. Verify object storage configuration
4. Run the migration script with the `--debug` flag for more detailed logs:
   ```bash
   npx ts-node server/run-migration.ts --debug
   ```

## Rollback

If you need to rollback the migration:

1. The application can still use in-memory storage by modifying `server/index.ts`
2. No data will be lost from the in-memory storage as it's still available

## Data Validation

After migration, you should validate:

1. All locations, properties, and other entities are correctly migrated
2. All images are accessible through object storage
3. All relationships between entities are preserved

## Additional Notes

- The migration process is idempotent and can be run multiple times without duplicating data
- The migration script clears existing data in the database before inserting new data
- All images are uploaded to object storage with unique filenames to avoid collisions 