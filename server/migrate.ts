/**
 * Database Migration Script
 * 
 * This script applies database schema migrations.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration() {
  console.log('Running database migrations...');
  
  // Create a postgres client for migrations
  const migrationClient = postgres(databaseUrl as string, { max: 1 });
  
  try {
    // Run the migrations
    await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the client
    await migrationClient.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error running migrations:', error);
      process.exit(1);
    });
}

export default runMigration;