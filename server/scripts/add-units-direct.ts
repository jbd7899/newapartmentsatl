// Script to add property units directly to the database
import { db } from '../db';
import { propertyUnits, properties } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log('Connected to PostgreSQL database');
    
    // Check if property ID 2 exists
    const property = await db.select().from(properties).where(eq(properties.id, 2));
    
    if (property.length === 0) {
      console.log('Property ID 2 does not exist in the database');
      return;
    }
    
    console.log('Property ID 2 details:', property[0]);
    
    // Check for existing units for property ID 2
    const existingUnits = await db.select().from(propertyUnits).where(eq(propertyUnits.propertyId, 2));
    
    console.log(`Found ${existingUnits.length} existing units for property ID 2`);
    
    if (existingUnits.length > 0) {
      console.log('Existing units:', existingUnits);
    }
    
    // If no units exist, add some sample units
    if (existingUnits.length === 0) {
      console.log('Adding sample units for property ID 2...');
      
      const sampleUnits = [
        {
          propertyId: 2,
          unitNumber: '101',
          bedrooms: 1,
          bathrooms: '1.0',
          sqft: 650,
          rent: 1200,
          available: true,
          description: 'Cozy one-bedroom apartment with modern finishes and great natural light.',
          features: 'Stainless steel appliances, Hardwood floors, In-unit laundry, Central AC'
        },
        {
          propertyId: 2,
          unitNumber: '102',
          bedrooms: 2,
          bathrooms: '1.5',
          sqft: 850,
          rent: 1500,
          available: true,
          description: 'Spacious two-bedroom apartment with an open floor plan and updated kitchen.',
          features: 'Granite countertops, Walk-in closets, Balcony, Pet-friendly'
        },
        {
          propertyId: 2,
          unitNumber: '201',
          bedrooms: 2,
          bathrooms: '2.0',
          sqft: 950,
          rent: 1700,
          available: true,
          description: 'Luxury two-bedroom apartment with two full bathrooms and a large living area.',
          features: 'Quartz countertops, Stainless steel appliances, In-unit laundry, Smart home features'
        },
        {
          propertyId: 2,
          unitNumber: '202',
          bedrooms: 3,
          bathrooms: '2.0',
          sqft: 1200,
          rent: 2100,
          available: false,
          description: 'Premium three-bedroom corner unit with abundant natural light and city views.',
          features: 'Floor-to-ceiling windows, Hardwood floors, Walk-in closets, Balcony, In-unit laundry'
        }
      ];
      
      // Insert the sample units
      for (const unit of sampleUnits) {
        await db.insert(propertyUnits).values(unit);
      }
      
      console.log(`Added ${sampleUnits.length} sample units for property ID 2`);
      
      // Verify the units were added
      const newUnits = await db.select().from(propertyUnits).where(eq(propertyUnits.propertyId, 2));
      console.log('New units:', newUnits);
      
      // Update the unit count on the property and set isMultifamily to true
      await db.update(properties)
        .set({ 
          unitCount: sampleUnits.length,
          isMultifamily: true 
        })
        .where(eq(properties.id, 2));
      
      console.log(`Updated property ID 2 with unit count: ${sampleUnits.length} and set isMultifamily to true`);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 