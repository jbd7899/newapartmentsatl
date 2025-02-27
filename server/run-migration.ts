/**
 * Migration Runner
 * 
 * This script runs the migration from in-memory storage to PostgreSQL database.
 * It also uploads all images to object storage.
 */

import { migrateData } from './migration';

// Run the migration
console.log('Starting migration process...');

migrateData()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 