#!/bin/bash

# Update all properties to have rent: 0
sed -i 's/rent: [0-9]\+,/rent: 0,/g' server/storage.ts

echo "Updated all property rent values to 0"