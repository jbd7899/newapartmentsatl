# PostgreSQL Database Integration

This application has been updated to use a PostgreSQL database instead of in-memory storage. This README provides instructions on how to set up and use the PostgreSQL database.

## Database Connection

The application uses the following PostgreSQL database:

- **Host**: ep-shiny-frost-a4fq5jvj.us-east-1.aws.neon.tech
- **Database**: neondb
- **User**: neondb_owner
- **Password**: npg_R1LfZB3PsHdp
- **Connection URL**: `postgresql://neondb_owner:npg_R1LfZB3PsHdp@ep-shiny-frost-a4fq5jvj.us-east-1.aws.neon.tech/neondb?sslmode=require`

## Setup Instructions

1. **Set the DATABASE_URL environment variable**:
   ```bash
   source set-db-env.sh
   ```

2. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Migrate data from in-memory storage to PostgreSQL** (optional):
   ```bash
   npm run db:migrate-data
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

## Implementation Details

The PostgreSQL integration includes:

1. **Database Connection** (`server/db.ts`):
   - Sets up the connection to the PostgreSQL database using Drizzle ORM

2. **PostgreSQL Storage Implementation** (`server/pg-storage.ts`):
   - Implements the `IStorage` interface using PostgreSQL

3. **Database Migration** (`server/migrate.ts`):
   - Creates the necessary database tables

4. **Data Migration** (`server/migrate-data.ts`):
   - Transfers data from in-memory storage to PostgreSQL

5. **Server Integration** (`server/index.ts`):
   - Replaces the in-memory storage with PostgreSQL storage

## Switching Between Storage Implementations

To switch between in-memory storage and PostgreSQL:

1. **Use PostgreSQL** (default):
   - Make sure the `(global as any).storage = new PgStorage();` line in `server/index.ts` is uncommented

2. **Use In-Memory Storage**:
   - Comment out the `(global as any).storage = new PgStorage();` line in `server/index.ts`

## Database Operations

The application supports the following database operations:

- **Creating Properties**: Properties can be created and stored in the PostgreSQL database
- **Editing Properties**: Properties can be edited and updated in the PostgreSQL database
- **Storing Images**: Images can be stored in the PostgreSQL database
- **Managing Units**: Property units can be managed in the PostgreSQL database

## Troubleshooting

If you encounter any issues with the PostgreSQL connection:

1. **Check the DATABASE_URL environment variable**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Verify the database connection**:
   ```bash
   npm run db:migrate
   ```

3. **Check the server logs for any database-related errors** 