/**
 * Script to upload images to a property unit
 * Usage: node upload-unit-images.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Client } from '@replit/object-storage';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Property and unit information
const UNIT_ID = 4; // ID of the unit we created
const ALT_TEXT = '965 Myrtle St Apartment 1';

// Initialize the Replit Object Storage client
const client = new Client();

// The bucket ID is automatically detected by the Replit Object Storage client

// Function to generate a unique filename to avoid collisions
function generateUniqueFilename(originalFilename) {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${originalFilename}-${timestamp}`).digest('hex');
  const ext = path.extname(originalFilename);
  return `${hash}${ext}`;
}

// Upload an image from file
async function uploadImageFromFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const uniqueFilename = generateUniqueFilename(filename);
  const objectKey = `images/${uniqueFilename}`;
  
  try {
    const { ok, error } = await client.uploadFromBytes(objectKey, fileBuffer);
    
    if (!ok) {
      console.error("Error uploading to object storage:", error);
      throw new Error(`Failed to upload image: ${error?.message}`);
    }
    
    console.log(`Successfully uploaded ${filename} to ${objectKey}`);
    return objectKey;
  } catch (error) {
    console.error("Error uploading to object storage:", error);
    throw error;
  }
}

// Create unit image record in database
async function createUnitImage(unitId, objectKey, alt, displayOrder, isFeatured) {
  console.log(`Creating unit image record for Unit ID: ${unitId}, Object Key: ${objectKey}`);
  
  try {
    const response = await fetch('http://localhost:5000/api/unit-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unitId,
        objectKey, // Send only objectKey, not URL
        alt,
        displayOrder,
        isFeatured,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from API: ${errorText}`);
      throw new Error(`Failed to create unit image: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully created unit image with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`Error creating unit image record: ${error.message}`);
    throw error;
  }
}

// Process a directory of images
async function processImages(directoryPath, unitId) {
  try {
    // Get list of image files in the directory
    const files = fs.readdirSync(directoryPath)
      .filter(file => file.toLowerCase().endsWith('.jpg') || 
                      file.toLowerCase().endsWith('.jpeg') || 
                      file.toLowerCase().endsWith('.png'));
    
    if (files.length === 0) {
      console.log('No image files found in the directory');
      return;
    }
    
    console.log(`Found ${files.length} image files to process`);
    
    // Upload each image and create DB record
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(directoryPath, file);
      
      console.log(`Processing file ${i+1}/${files.length}: ${file}`);
      
      // Upload to object storage
      const objectKey = await uploadImageFromFile(filePath);
      
      // Create unit image record in database
      const isFeatured = i === 0; // Make first image the featured one
      const unitImage = await createUnitImage(
        unitId, 
        objectKey, 
        `${ALT_TEXT} - ${file}`, 
        i, 
        isFeatured
      );
      
      console.log(`Created unit image record with ID: ${unitImage.id}`);
    }
    
    console.log('All images processed successfully');
  } catch (error) {
    console.error('Error processing images:', error);
  }
}

// Main function
async function main() {
  // Directory where images are located
  const imagesDirectory = 'attached_assets';
  
  console.log(`Starting upload process for unit ID: ${UNIT_ID}`);
  await processImages(imagesDirectory, UNIT_ID);
  console.log('Process completed');
}

// Run the main function
main().catch(console.error);