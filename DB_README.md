# Database Setup and Migration

This document outlines the database structure and migration process for the Real Estate Property Management System.

## Database Schema

The system uses the following tables:

1. **locations** - Geographic locations (cities, neighborhoods)
2. **neighborhoods** - Detailed information about neighborhoods
3. **properties** - Real estate properties
4. **features** - Property features and amenities
5. **inquiries** - Customer inquiries about properties
6. **property_images** - Images associated with properties
7. **property_units** - Units within multifamily properties
8. **unit_images** - Images associated with property units
9. **image_storage** - Metadata for images stored in object storage

## Migration Process

The migration process involves:

1. **Schema Migration**: Creating or updating database tables
2. **Data Migration**: Transferring data from in-memory storage to PostgreSQL
3. **Image Migration**: Moving images from external URLs to object storage

## Running the Migration

To execute the migration:

```bash
# Make the migration script executable
chmod +x run-migration.sh

# Run the migration
./run-migration.sh
```

## Tables and Columns

### locations
- id (SERIAL PRIMARY KEY)
- slug (TEXT UNIQUE NOT NULL)
- name (TEXT NOT NULL)
- description (TEXT)
- imageUrl (TEXT)
- linkText (TEXT)

### neighborhoods
- id (SERIAL PRIMARY KEY)
- locationId (INTEGER REFERENCES locations(id))
- mapImageUrl (TEXT)
- highlights (TEXT)
- attractions (TEXT)
- transportationInfo (TEXT)
- diningOptions (TEXT)
- schoolsInfo (TEXT)
- parksAndRecreation (TEXT)
- historicalInfo (TEXT)
- exploreDescription (TEXT)
- exploreMapUrl (TEXT)
- exploreHotspots (TEXT)
- createdAt (TIMESTAMP WITH TIME ZONE)

### properties
- id (SERIAL PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- address (TEXT)
- bedrooms (INTEGER)
- bathrooms (INTEGER)
- sqft (INTEGER)
- rent (INTEGER)
- available (BOOLEAN DEFAULT true)
- locationId (INTEGER REFERENCES locations(id))
- imageUrl (TEXT)
- features (TEXT)
- propertyType (TEXT DEFAULT 'apartment')
- isMultifamily (BOOLEAN DEFAULT false)
- unitCount (INTEGER DEFAULT 0)

### features
- id (SERIAL PRIMARY KEY)
- title (TEXT NOT NULL)
- description (TEXT)
- icon (TEXT)

### inquiries
- id (SERIAL PRIMARY KEY)
- name (TEXT NOT NULL)
- email (TEXT NOT NULL)
- phone (TEXT)
- message (TEXT)
- propertyId (INTEGER REFERENCES properties(id))
- propertyName (TEXT)
- createdAt (TIMESTAMP WITH TIME ZONE)
- status (TEXT DEFAULT 'new')

### property_images
- id (SERIAL PRIMARY KEY)
- propertyId (INTEGER REFERENCES properties(id))
- objectKey (TEXT NOT NULL)
- alt (TEXT)
- displayOrder (INTEGER DEFAULT 0)
- isFeatured (BOOLEAN DEFAULT false)
- mimeType (TEXT)
- size (INTEGER)
- createdAt (TIMESTAMP WITH TIME ZONE)

### property_units
- id (SERIAL PRIMARY KEY)
- propertyId (INTEGER REFERENCES properties(id))
- unitNumber (TEXT NOT NULL)
- bedrooms (INTEGER)
- bathrooms (INTEGER)
- sqft (INTEGER)
- rent (INTEGER)
- available (BOOLEAN DEFAULT true)
- description (TEXT)
- features (TEXT)
- createdAt (TIMESTAMP WITH TIME ZONE)

### unit_images
- id (SERIAL PRIMARY KEY)
- unitId (INTEGER REFERENCES property_units(id))
- objectKey (TEXT NOT NULL)
- alt (TEXT)
- displayOrder (INTEGER DEFAULT 0)
- isFeatured (BOOLEAN DEFAULT false)
- mimeType (TEXT)
- size (INTEGER)
- createdAt (TIMESTAMP WITH TIME ZONE)

### image_storage
- id (SERIAL PRIMARY KEY)
- objectKey (TEXT UNIQUE NOT NULL)
- filename (TEXT NOT NULL)
- mimeType (TEXT NOT NULL)
- size (INTEGER NOT NULL)
- createdAt (TIMESTAMP WITH TIME ZONE)