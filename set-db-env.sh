#!/bin/bash
# Script to set the DATABASE_URL environment variable for the application

# Set the DATABASE_URL environment variable
export DATABASE_URL="postgresql://neondb_owner:npg_R1LfZB3PsHdp@ep-shiny-frost-a4fq5jvj.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Print confirmation
echo "DATABASE_URL environment variable set successfully"
echo "You can now run the application with: npm run dev"
echo "Or run database migrations with: npm run db:migrate" 