#!/bin/bash

# This script sets up the database environment variables
# from Replit secrets for running migrations

echo "Setting up database environment variables..."

# Check if DATABASE_URL is already set
if [ -n "$DATABASE_URL" ]; then
  echo "✅ DATABASE_URL is already set"
else
  echo "❌ DATABASE_URL is not set"
  echo "Please make sure your Replit database is properly configured"
  exit 1
fi

# Make the database URL available to the script
export DATABASE_URL

echo "Environment variables set up successfully!"