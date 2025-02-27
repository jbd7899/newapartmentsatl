#!/bin/bash

# This script makes the migration scripts executable

echo "Making migration scripts executable..."

chmod +x run-migration.sh
chmod +x set-db-env.sh

echo "Migration scripts are now executable!"