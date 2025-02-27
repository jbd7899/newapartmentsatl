/**
 * Database connection setup using Drizzle ORM
 * Created to connect the application to the Replit PostgreSQL database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Use the DATABASE_URL from environment variables or fallback to the provided URL
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_R1LfZB3PsHdp@ep-shiny-frost-a4fq5jvj.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Create a postgres client with the connection string
const client = postgres(connectionString, { max: 10 });

// Create a drizzle instance with the client and schema
export const db = drizzle(client, { schema });

// Export the schema for use in other files
export { schema }; 