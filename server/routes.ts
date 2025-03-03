import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
// Import storage module
import { storage as defaultStorage } from './storage';
// Use the global storage instance which can be either in-memory or PostgreSQL
const storage = (global as any).storage || defaultStorage;
import { z } from "zod";
import { 
  insertInquirySchema, 
  insertPropertyImageSchema, 
  insertNeighborhoodSchema, 
  insertPropertyUnitSchema, 
  insertUnitImageSchema,
  type PropertyImage,
  type UnitImage
} from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { uploadImage, deleteImage, getImageData, getFilenameFromObjectKey, imageExists, listImages, isObjectStorageKey, checkStorageConfig, imageExistsWithVariations } from "./object-storage";
import { client } from "./object-storage";
import { upload, handleUploadErrors } from "./upload-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // In-memory map to store image data for base64 images
  const imageDataStore = new Map<string, string>();

  // Function to load images from disk to memory
  const loadImagesFromDisk = () => {
    console.log('Loading images from disk to memory cache...');
    try {
      // Check if uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        console.log('Uploads directory does not exist, skipping image loading');
        return;
      }

      // Read all files in the uploads directory
      const files = fs.readdirSync(uploadsDir);
      console.log(`Found ${files.length} files in uploads directory`);

      // Load each file into memory
      files.forEach(filename => {
        try {
          const filePath = path.join(uploadsDir, filename);
          const stats = fs.statSync(filePath);

          // Only process files (not directories)
          if (stats.isFile()) {
            console.log(`Loading file: ${filename}`);
            const fileData = fs.readFileSync(filePath);
            const base64Data = fileData.toString('base64');

            // Determine MIME type based on file extension
            let mimeType = 'image/jpeg'; // Default
            if (filename.endsWith('.png')) mimeType = 'image/png';
            if (filename.endsWith('.gif')) mimeType = 'image/gif';
            if (filename.endsWith('.webp')) mimeType = 'image/webp';

            // Store in memory
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            imageDataStore.set(filename, dataUrl);
            console.log(`Loaded ${filename} into memory cache (${fileData.length} bytes)`);
          }
        } catch (error) {
          console.error(`Error loading file ${filename}:`, error);
        }
      });

      console.log(`Successfully loaded ${imageDataStore.size} images into memory cache`);
    } catch (error) {
      console.error('Error loading images from disk:', error);
    }
  };

  // Load images from disk on server start
  loadImagesFromDisk();

  // Serve files from uploads directory
  app.get('/uploads/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    console.log(`Serving image: ${filename}`);

    if (!filename) {
      console.log('No filename provided');
      return res.status(404).send('File not found');
    }

    // Try to get the image data from the in-memory store first
    const imageData = imageDataStore.get(filename);
    console.log(`Image in memory store: ${imageData ? 'Yes' : 'No'}`);

    if (imageData) {
      try {
        // Extract the MIME type from the data URL
        const mimeMatch = imageData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        console.log(`Extracted MIME type: ${mime}`);

        // Extract the base64 data
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Set proper content type
        res.contentType(mime);
        console.log(`Serving image from memory, size: ${buffer.length} bytes`);
        return res.send(buffer);
      } catch (error) {
        console.error('Error processing in-memory image:', error);
      }
    }

    // If not in memory, try to read from the file system
    const filePath = path.join(uploadsDir, filename);
    console.log(`Looking for file at: ${filePath}`);

    if (fs.existsSync(filePath)) {
      console.log(`File exists on disk, serving: ${filePath}`);
      return res.sendFile(filePath);
    }

    console.log(`Image not found: ${filename}`);
    return res.status(404).send('File not found');
  });

  // Note: Database image storage has been removed in favor of object storage only

  // Process image data and save to object storage
  const processImageData = async (url: string, data?: string): Promise<string> => {
    console.log(`Processing image data. URL: ${url?.substring(0, 30)}..., Data provided: ${!!data}`);

    // For external URLs (http/https), just return them as is
    if (url.startsWith('http')) {
      console.log(`External URL, returning as is: ${url.substring(0, 30)}...`);
      return url;
    }

    // If the URL is already an object storage key, return it as is
    if (isObjectStorageKey(url)) {
      console.log(`URL is already an object storage key: ${url}`);
      return url;
    }

    // If the URL is already a property/unit image URL, return it as is
    if (url.startsWith('/api/property-images/') || url.startsWith('/api/unit-images/')) {
      console.log(`URL is already a property/unit image URL: ${url}`);
      return url;
    }

    // If no data is provided, return the URL as is
    if (!data) {
      return url;
    }

    try {
      // Convert data URL to buffer
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        console.error('Invalid data URL format');
        return url;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Determine file extension based on MIME type
      let extension = '.jpg';
      if (mimeType === 'image/png') extension = '.png';
      else if (mimeType === 'image/gif') extension = '.gif';
      else if (mimeType === 'image/webp') extension = '.webp';
      else if (mimeType === 'image/svg+xml') extension = '.svg';

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate a filename for the image
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(4).toString('hex');
      const filename = `img_${timestamp}_${randomStr}${extension}`;
      
      // Upload to object storage
      const objectKey = await uploadImage(buffer, filename);
      
      console.log(`Uploaded image to object storage with key: ${objectKey}`);

      // Return the path to the image with our API endpoint
      return `/api/images/${objectKey}`;
    } catch (error) {
      console.error('Error processing image data:', error);
      return url;
    }
  };

  // API routes with /api prefix

  // Get all locations
  app.get("/api/locations", async (req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Get location by slug
  app.get("/api/locations/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const location = await storage.getLocationBySlug(slug);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Get properties by location
  app.get("/api/locations/:slug/properties", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const location = await storage.getLocationBySlug(slug);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      const properties = await storage.getPropertiesByLocation(location.id);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get neighborhood information by location
  app.get("/api/locations/:slug/neighborhood", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const location = await storage.getLocationBySlug(slug);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      const neighborhood = await storage.getNeighborhoodByLocationId(location.id);

      if (!neighborhood) {
        return res.status(404).json({ message: "Neighborhood information not found" });
      }

      res.json(neighborhood);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch neighborhood information" });
    }
  });

  // Get all properties
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get property by id
  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Get all features
  app.get("/api/features", async (req: Request, res: Response) => {
    try {
      const features = await storage.getFeatures();
      res.json(features);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch features" });
    }
  });

  // Get all inquiries
  app.get("/api/inquiries", async (req: Request, res: Response) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Create new inquiry
  app.post("/api/inquiries", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertInquirySchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid inquiry data", 
          errors: validationResult.error.format() 
        });
      }

      // Get property details if propertyId is provided
      let propertyName = req.body.propertyName;
      if (req.body.propertyId && !propertyName) {
        const property = await storage.getProperty(req.body.propertyId);
        if (property) {
          propertyName = property.name;
        }
      }

      // Create the inquiry
      const inquiry = await storage.createInquiry({
        ...validationResult.data,
        propertyName
      });

      res.status(201).json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Update inquiry status
  app.patch("/api/inquiries/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      const { status } = req.body;

      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }

      if (!['new', 'contacted', 'resolved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedInquiry = await storage.updateInquiryStatus(id, status);

      if (!updatedInquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      res.json(updatedInquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });

  // Get all property images
  app.get("/api/property-images", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get all images
      const allImages = await storage.getPropertyImages();

      // Calculate total
      const total = allImages.length;

      // Apply pagination - in a real app, this would be done at the database level
      const paginatedImages = allImages.slice(offset, offset + limit);

      // Add pagination metadata in response headers
      res.set('X-Total-Count', total.toString());
      res.set('X-Page', page.toString());
      res.set('X-Limit', limit.toString());
      res.set('X-Total-Pages', Math.ceil(total / limit).toString());

      // Return the paginated results
      res.json(paginatedImages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property images" });
    }
  });

  // Get property images by property ID
  app.get("/api/properties/:id/images", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const images = await storage.getPropertyImagesByProperty(propertyId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property images" });
    }
  });

  // Property image endpoint - only accepts external URLs
  app.post("/api/property-images", async (req: Request, res: Response) => {
    try {
      const { propertyId, url, alt, displayOrder, isFeatured } = req.body;

      // Verify property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Validate URL
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ message: "A valid external image URL is required" });
      }

      // Create the property image in the database
      const imageData = {
        propertyId,
        url,
        objectKey: url, // Store the URL as objectKey too for consistent display
        alt: alt || '',
        displayOrder: displayOrder || 0,
        isFeatured: isFeatured || false
      };

      // Validate request body
      const validationResult = insertPropertyImageSchema.safeParse(imageData);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: validationResult.error.format() 
        });
      }

      const image = await storage.createPropertyImage(validationResult.data);
      res.status(201).json(image);
    } catch (error) {
      console.error('Error creating property image:', error);
      res.status(500).json({ message: "Failed to create property image" });
    }
  });

  // Update property image order
  app.patch("/api/property-images/:id/order", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      const { displayOrder } = req.body;

      if (displayOrder === undefined || typeof displayOrder !== 'number') {
        return res.status(400).json({ message: "Display order is required and must be a number" });
      }

      const updatedImage = await storage.updatePropertyImageOrder(id, displayOrder);

      if (!updatedImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image order" });
    }
  });

  // Update property image featured status
  app.patch("/api/property-images/:id/featured", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      const { isFeatured } = req.body;

      if (isFeatured === undefined || typeof isFeatured !== 'boolean') {
        return res.status(400).json({ message: "Featured status is required and must be a boolean" });
      }

      const updatedImage = await storage.updatePropertyImageFeatured(id, isFeatured);

      if (!updatedImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image featured status" });
    }
  });

  // Delete property image - only for external URLs
  app.delete("/api/property-images/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      // Get the image first
      const image = await storage.getPropertyImage(id);

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete from database
      const result = await storage.deletePropertyImage(id);

      if (!result) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Create neighborhood information for a location
  app.post("/api/locations/:slug/neighborhood", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const location = await storage.getLocationBySlug(slug);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Check if neighborhood already exists
      const existingNeighborhood = await storage.getNeighborhoodByLocationId(location.id);
      if (existingNeighborhood) {
        return res.status(409).json({ message: "Neighborhood information already exists for this location" });
      }

      // Validate request body
      const validationResult = insertNeighborhoodSchema.safeParse({
        ...req.body,
        locationId: location.id
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid neighborhood data", 
          errors: validationResult.error.format() 
        });
      }

      const neighborhood = await storage.createNeighborhood(validationResult.data);
      res.status(201).json(neighborhood);
    } catch (error) {
      res.status(500).json({ message: "Failed to create neighborhood information" });
    }
  });

  // Update neighborhood information for a location
  app.patch("/api/locations/:slug/neighborhood", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const location = await storage.getLocationBySlug(slug);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Get existing neighborhood
      const neighborhood = await storage.getNeighborhoodByLocationId(location.id);

      if (!neighborhood) {
        return res.status(404).json({ message: "Neighborhood information not found" });
      }

      // Validate request body against partial schema
      const partialSchema = insertNeighborhoodSchema.partial();
      const validationResult = partialSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid neighborhood data", 
          errors: validationResult.error.format() 
        });
      }

      const updatedNeighborhood = await storage.updateNeighborhood(
        neighborhood.id, 
        validationResult.data
      );

      res.json(updatedNeighborhood);
    } catch (error) {
      res.status(500).json({ message: "Failed to update neighborhood information" });
    }
  });

  // ----- Property Units Routes -----

  // Get all units for a property
  app.get("/api/properties/:id/units", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Get all units for this property
      const units = await storage.getPropertyUnits(propertyId);
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property units" });
    }
  });

  // Get single unit by ID
  app.get("/api/property-units/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid unit ID" });
      }

      const unit = await storage.getPropertyUnit(id);

      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
      }

      res.json(unit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property unit" });
    }
  });

  // Create a new property unit
  app.post("/api/property-units", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertPropertyUnitSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid property unit data", 
          errors: validationResult.error.format() 
        });
      }

      // Verify property exists and is multifamily
      const property = await storage.getProperty(validationResult.data.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!property.isMultifamily) {
        return res.status(400).json({ message: "Cannot add units to non-multifamily property" });
      }

      const unit = await storage.createPropertyUnit(validationResult.data);
      res.status(201).json(unit);
    } catch (error) {
      res.status(500).json({ message: "Failed to create property unit" });
    }
  });

  // Update a property unit
  app.patch("/api/property-units/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid unit ID" });
      }

      // Get existing unit
      const unit = await storage.getPropertyUnit(id);

      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
      }

      // Validate request body against partial schema
      const partialSchema = insertPropertyUnitSchema.partial();
      const validationResult = partialSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid property unit data", 
          errors: validationResult.error.format() 
        });
      }

      const updatedUnit = await storage.updatePropertyUnit(id, validationResult.data);
      res.json(updatedUnit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update property unit" });
    }
  });

  // Delete a property unit
  app.delete("/api/property-units/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid unit ID" });
      }

      const unit = await storage.getPropertyUnit(id);

      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
      }

      const success = await storage.deletePropertyUnit(id);

      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete property unit" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property unit" });
    }
  });

  // ----- Unit Images Routes -----

  // Get all images for a unit
  app.get("/api/property-units/:id/images", async (req: Request, res: Response) => {
    try {
      const unitId = parseInt(req.params.id);

      if (isNaN(unitId)) {
        return res.status(400).json({ message: "Invalid unit ID" });
      }

      const unit = await storage.getPropertyUnit(unitId);

      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
      }

      const images = await storage.getUnitImages(unitId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unit images" });
    }
  });

  // Add a new unit image - accepts objectKey for object storage or external URLs
  app.post("/api/unit-images", async (req: Request, res: Response) => {
    try {
      const { unitId, url, objectKey, alt, displayOrder, isFeatured } = req.body;

      // Verify unit exists
      const unit = await storage.getPropertyUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
      }

      // Either URL or objectKey must be provided
      if ((!url || typeof url !== 'string') && (!objectKey || typeof objectKey !== 'string')) {
        return res.status(400).json({ message: "Either a valid URL or objectKey is required" });
      }

      // Create the image data object
      const imageData = {
        unitId,
        url: url || null,
        objectKey: objectKey || url, // If objectKey is provided, use it; otherwise use URL
        alt: alt || '',
        displayOrder: displayOrder || 0,
        isFeatured: isFeatured || false
      };

      // Validate request body
      const validationResult = insertUnitImageSchema.safeParse(imageData);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: validationResult.error.format() 
        });
      }

      const image = await storage.createUnitImage(validationResult.data);
      res.status(201).json(image);
    } catch (error) {
      console.error('Error creating unit image:', error);
      res.status(500).json({ message: "Failed to create unit image" });
    }
  });

  // Update unit image order
  app.patch("/api/unit-images/:id/order", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      const { displayOrder } = req.body;

      if (displayOrder === undefined || typeof displayOrder !== 'number') {
        return res.status(400).json({ message: "Display order is required and must be a number" });
      }

      const updatedImage = await storage.updateUnitImageOrder(id, displayOrder);

      if (!updatedImage) {
        return res.status(404).json({ message: "Unit image not found" });
      }

      res.json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update unit image order" });
    }
  });

  // Set image as featured
  app.patch("/api/unit-images/:id/featured", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      const { isFeatured } = req.body;

      if (isFeatured === undefined || typeof isFeatured !== 'boolean') {
        return res.status(400).json({ message: "Featured status is required and must be a boolean" });
      }

      const updatedImage = await storage.updateUnitImageFeatured(id, isFeatured);

      if (!updatedImage) {
        return res.status(404).json({ message: "Unit image not found" });
      }

      res.json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update unit image featured status" });
    }
  });

  // Delete unit image - only for external URLs
  app.delete("/api/unit-images/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      // Get the image first
      const image = await storage.getUnitImage(id);

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete from database
      const result = await storage.deleteUnitImage(id);

      if (!result) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Simplified image serving endpoint - only from object storage
  // THIS ROUTE IS DEPRECATED - USE /api/direct-images/ INSTEAD
  app.get('/api/images_old/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      // Log the raw object key for debugging
      console.log(`[Image API] Requested image with key: "${objectKey}"`);
      console.log(`[Image API] Request URL: ${req.url}`);
      
      // Try to decode the object key if it's encoded
      try {
        // Decode multiple times to handle double-encoding scenarios
        let decodedKey = objectKey;
        let previousKey;
        
        do {
          previousKey = decodedKey;
          decodedKey = decodeURIComponent(previousKey);
        } while (decodedKey !== previousKey);
        
        if (decodedKey !== objectKey) {
          console.log(`[Image API] Decoded object key: ${decodedKey}`);
          objectKey = decodedKey;
        }
      } catch (e) {
        console.log(`[Image API] Error decoding object key: ${e}`);
        // Continue with the original key if decoding fails
      }
      
      console.log(`[Image API] Attempting to serve image from object storage: ${objectKey}`);

      // Create an array of possible paths to try
      const BUCKET_ID = 'replit-objstore-8f3f1a22-cdd2-4088-9bff-f7887f5d323d';
      const pathsToTry = [
        objectKey,
        objectKey.startsWith('images/') ? objectKey : `images/${objectKey}`,
        objectKey.startsWith('images/') ? objectKey.substring(7) : objectKey,
        // Direct bucket access paths
        `${BUCKET_ID}/${objectKey}`,
        `${BUCKET_ID}/images/${objectKey}`,
      ];
      
      // If the path has multiple segments, also try with different separators
      if (objectKey.includes('/')) {
        // Try with URL-encoded slashes
        pathsToTry.push(objectKey.replace(/\//g, '%2F'));
        
        // Try with the last segment only (the filename)
        const filename = objectKey.split('/').pop() || '';
        pathsToTry.push(filename);
        pathsToTry.push(`images/${filename}`);
        
        // Direct bucket access with just the filename
        pathsToTry.push(`${BUCKET_ID}/${filename}`);
        pathsToTry.push(`${BUCKET_ID}/images/${filename}`);
      }
      
      // Log all paths we're going to try
      console.log(`[Image API] Will try these paths:`, pathsToTry);
      
      // Try each path directly with the client instead of using getImageData
      let imageBuffer: Buffer | null = null;
      let successPath = null;
      
      for (const path of pathsToTry) {
        console.log(`[Image API] Trying path: ${path}`);
        try {
          const result = await client.downloadAsBytes(path);
          
          if (result.ok && result.value) {
            console.log(`[Image API] Found image at path: ${path}, size: ${result.value.length} bytes`);
            console.log(`[Image API] Data type: ${typeof result.value}, isArray: ${Array.isArray(result.value)}, isBuffer: ${Buffer.isBuffer(result.value)}`);
            
            // DIRECT BUFFER CONVERSION
            if (Buffer.isBuffer(result.value)) {
              imageBuffer = result.value;
              console.log('[Image API] Already a Buffer');
            } else if (Array.isArray(result.value)) {
              // Convert using Uint8Array - the cleanest way to handle array of bytes
              const uint8Array = new Uint8Array(result.value.length);
              for (let i = 0; i < result.value.length; i++) {
                uint8Array[i] = result.value[i];
              }
              imageBuffer = Buffer.from(uint8Array);
              console.log(`[Image API] Converted Array to Buffer via Uint8Array, length: ${imageBuffer.length}`);
            } else {
              // Fallback for other types
              imageBuffer = Buffer.from(String(result.value));
              console.log(`[Image API] Converted to Buffer via string, length: ${imageBuffer.length}`);
            }
            
            successPath = path;
            break;
          }
        } catch (error: any) {
          console.log(`[Image API] Error trying path ${path}: ${error.message}`);
          // Continue to next path
        }
      }

      // If all direct attempts failed, try listing all objects to find similar keys
      if (!imageBuffer) {
        console.log(`[Image API] Image not found after trying all paths, listing all objects...`);
        const listResult = await client.list();
        
        if (listResult.ok && listResult.value) {
          const allKeys = listResult.value.map(obj => obj.name || String(obj));
          
          // Try to find similar keys
          const filename = path.basename(objectKey);
          const similarKeys = allKeys.filter(key => 
            key.includes(filename) || 
            filename.includes(path.basename(key))
          );
          
          if (similarKeys.length > 0) {
            console.log(`[Image API] Found similar keys:`, similarKeys);
            
            // Try the first similar key as a last resort
            if (similarKeys.length > 0) {
              const similarKey = similarKeys[0];
              console.log(`[Image API] Trying similar key: ${similarKey}`);
              
              try {
                const result = await client.downloadAsBytes(similarKey);
                
                if (result.ok && result.value) {
                  console.log(`[Image API] Found image with similar key: ${similarKey}, size: ${result.value.length} bytes`);
                  
                  // DIRECT BUFFER CONVERSION
                  if (Buffer.isBuffer(result.value)) {
                    imageBuffer = result.value;
                  } else if (Array.isArray(result.value)) {
                    const uint8Array = new Uint8Array(result.value.length);
                    for (let i = 0; i < result.value.length; i++) {
                      uint8Array[i] = result.value[i];
                    }
                    imageBuffer = Buffer.from(uint8Array);
                  } else {
                    imageBuffer = Buffer.from(String(result.value));
                  }
                  
                  successPath = similarKey;
                }
              } catch (error: any) {
                console.log(`[Image API] Error trying similar key ${similarKey}: ${error.message}`);
              }
            }
          }
        }
      }

      if (!imageBuffer) {
        console.log(`[Image API] Image not found after trying all paths`);
        return res.status(404).send('Image not found');
      }

      console.log(`[Image API] Successfully found image at path: ${successPath}, sending response`);
      
      // Set appropriate MIME type
      const ext = path.extname(successPath || objectKey).toLowerCase();
      let contentType = 'image/jpeg'; // Default
      
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      // Set response headers directly
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      // Send the buffer directly
      console.log(`[Image API] Serving image with content type: ${contentType}, size: ${imageBuffer.length} bytes`);
      return res.send(imageBuffer);
    } catch (error) {
      console.error('[Image API] Error serving image:', error);
      return res.status(500).send('Error serving image');
    }
  });
  
  // Helper function to send image response with proper headers
  function sendImageResponse(res: Response, objectKey: string, imageData: any) {
    try {
      // Ensure imageData is a proper Buffer
      let processedData: Buffer;
      
      if (Buffer.isBuffer(imageData)) {
        // Already a Buffer, use it directly
        processedData = imageData;
        console.log(`[sendImageResponse] Using existing Buffer for image data`);
      } else if (Array.isArray(imageData)) {
        // Handle array data by converting to Buffer
        console.log(`[sendImageResponse] Converting array data to Buffer, length: ${imageData.length}`);
        
        // Manual copy to a new Buffer to ensure proper conversion
        const tempBuffer = Buffer.alloc(imageData.length);
        for (let i = 0; i < imageData.length; i++) {
          tempBuffer[i] = imageData[i];
        }
        processedData = tempBuffer;
        console.log(`[sendImageResponse] Converted array to Buffer using manual copy`);
      } else if (typeof imageData === 'string') {
        // Handle string data
        processedData = Buffer.from(imageData);
        console.log(`[sendImageResponse] Converted string to Buffer`);
      } else {
        // Try to convert to a string first as a fallback
        console.log(`[sendImageResponse] Unknown data type, using String conversion fallback`);
        processedData = Buffer.from(String(imageData));
      }

      // Determine content type based on file extension
      const ext = path.extname(objectKey).toLowerCase();
      let contentType = 'image/jpeg'; // Default

      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';

      // Log detailed information about the image data
      console.log(`[sendImageResponse] Sending image response for: ${objectKey}`);
      console.log(`[sendImageResponse] Content type: ${contentType}`);
      console.log(`[sendImageResponse] Image data size: ${processedData.length} bytes`);
      console.log(`[sendImageResponse] Image data buffer valid: ${Buffer.isBuffer(processedData)}`);
      
      if (processedData.length < 100) {
        // If the image data is suspiciously small, log the actual data
        console.log(`[sendImageResponse] WARNING: Image data is very small (${processedData.length} bytes)`);
        console.log(`[sendImageResponse] Image data (hex): ${processedData.toString('hex')}`);
      }

      // Set cache headers (cache for 1 day)
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', processedData.length);

      return res.send(processedData);
    } catch (error) {
      console.error(`[Image API] Server error:`, error);
      return res.status(500).send('Error processing image data');
    }
  }

  // Delete an image from object storage
  app.delete('/api/images/:objectKey(*)', async (req, res) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`Deleting image from object storage: ${objectKey}`);

      // Check if the image exists first
      const exists = await imageExists(objectKey);

      if (!exists) {
        console.log(`Image not found in object storage: ${objectKey}`);
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete the image from object storage
      const success = await deleteImage(objectKey);

      if (!success) {
        return res.status(500).json({ message: "Failed to delete image from storage" });
      }

      console.log(`Successfully deleted image from object storage: ${objectKey}`);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting image from object storage:', error);
      return res.status(500).json({ message: "Failed to delete image from storage" });
    }
  });

  // List all images in storage
  app.get("/api/images", async (req: Request, res: Response) => {
    try {
      console.log("Listing all images in object storage...");
      // Get images from object storage only
      const objectStorageImages = await listImages();
      console.log("Raw objects from storage:", objectStorageImages);

      // Format object storage images
      const formattedObjectStorageImages = objectStorageImages.map(key => ({
        key,
        url: `/api/images/${key}`,
        source: 'object-storage'
      }));

      console.log("Object keys extracted:", objectStorageImages);
      console.log("All image files:", formattedObjectStorageImages);

      res.json({ 
        images: formattedObjectStorageImages,
        counts: {
          database: 0, // We don't use database storage anymore
          objectStorage: formattedObjectStorageImages.length,
          total: formattedObjectStorageImages.length
        }
      });
    } catch (error) {
      console.error('Error listing images:', error);
      res.status(500).json({ message: "Failed to list images" });
    }
  });

  // Check if the object storage is properly configured
  app.get("/api/storage/check-config", async (req: Request, res: Response) => {
    try {
      console.log("[API] Checking object storage configuration...");
      const isValid = await checkStorageConfig();
      
      console.log(`[API] Object storage configuration is ${isValid ? 'valid' : 'invalid'}`);
      
      res.json({
        isValid,
        message: isValid 
          ? "Object storage is properly configured and working" 
          : "Object storage configuration is invalid. Please check your Replit Object Storage setup."
      });
    } catch (error) {
      console.error("[API] Error checking object storage configuration:", error);
      res.status(500).json({
        isValid: false,
        message: `Error checking object storage configuration: ${error}`
      });
    }
  });
  
  // NEW DIRECT IMAGE SERVING ENDPOINT
  // This endpoint uses the most direct approach possible to serve images from object storage
  app.get('/api/images/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      console.log(`[Direct API] Serving image with objectKey: ${objectKey}`);
      
      try {
        const result = await client.downloadAsBytes(objectKey);
        
        if (!result.ok || !result.value) {
          // Try with 'images/' prefix if not already there
          if (!objectKey.startsWith('images/')) {
            const withPrefix = `images/${objectKey}`;
            console.log(`[Direct API] Trying with images/ prefix: ${withPrefix}`);
            const prefixResult = await client.downloadAsBytes(withPrefix);
            
            if (prefixResult.ok && prefixResult.value) {
              // Successfully retrieved with prefix
              const bufferData = Buffer.from(prefixResult.value);
              console.log(`[Direct API] Retrieved image with prefix, size: ${bufferData.length} bytes`);
              
              // Set MIME type
              const ext = path.extname(objectKey).toLowerCase();
              let contentType = 'image/jpeg'; // Default
              if (ext === '.png') contentType = 'image/png';
              else if (ext === '.gif') contentType = 'image/gif';
              else if (ext === '.webp') contentType = 'image/webp';
              else if (ext === '.svg') contentType = 'image/svg+xml';
              
              res.setHeader('Content-Type', contentType);
              res.setHeader('Content-Length', bufferData.length);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              
              return res.end(bufferData);
            }
          }
          
          console.log(`[Direct API] Image not found: ${objectKey}`);
          return res.status(404).send('Image not found');
        }
        
        // Convert the result.value to Buffer explicitly
        const bufferData = Buffer.from(result.value);
        console.log(`[Direct API] Retrieved image, size: ${bufferData.length} bytes`);
        
        // Set MIME type
        const ext = path.extname(objectKey).toLowerCase();
        let contentType = 'image/jpeg'; // Default
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', bufferData.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        return res.end(bufferData);
      } catch (error) {
        console.error(`[Direct API] Error serving image: ${error}`);
        return res.status(500).send('Error serving image');
      }
    } catch (error) {
      console.error(`[Direct API] Server error: ${error}`);
      return res.status(500).send('Server error');
    }
  });

  // Serve property images from object storage - direct approach
  app.get('/api/property-images/:objectKey(*)', async (req: Request, res: Response) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`[Property Images API] Serving property image with objectKey: ${objectKey}`);

      // Find property image with this objectKey
      const images = await storage.getPropertyImages();
      const image = images.find((img: PropertyImage) => img.objectKey === objectKey);

      if (!image) {
        return res.status(404).send('Property image not found');
      }

      // Direct download from object storage
      try {
        console.log(`[Property Images API] Downloading image data directly for: ${objectKey}`);
        const result = await client.downloadAsBytes(objectKey);
        
        if (!result.ok || !result.value) {
          console.log(`[Property Images API] Direct download failed, error: ${result.error}`);
          return res.status(404).send('Image data not found in object storage');
        }
        
        console.log(`[Property Images API] Successfully downloaded image data, size: ${result.value.length} bytes`);
        console.log(`[Property Images API] Data type: ${typeof result.value}, isArray: ${Array.isArray(result.value)}, isBuffer: ${Buffer.isBuffer(result.value)}`);
        
        // DIRECT BUFFER CONVERSION
        let imageBuffer: Buffer;
        
        if (Buffer.isBuffer(result.value)) {
          imageBuffer = result.value;
          console.log('[Property Images API] Already a Buffer');
        } else if (Array.isArray(result.value)) {
          // Convert using Uint8Array for array of bytes
          const uint8Array = new Uint8Array(result.value.length);
          for (let i = 0; i < result.value.length; i++) {
            uint8Array[i] = result.value[i];
          }
          imageBuffer = Buffer.from(uint8Array);
          console.log(`[Property Images API] Converted Array to Buffer via Uint8Array, length: ${imageBuffer.length}`);
        } else {
          // Fallback for other types
          imageBuffer = Buffer.from(String(result.value));
          console.log(`[Property Images API] Converted to Buffer via string, length: ${imageBuffer.length}`);
        }
        
        // Verify buffer is valid
        console.log(`[Property Images API] Final Buffer valid: ${Buffer.isBuffer(imageBuffer)}, length: ${imageBuffer.length}`);
        
        // Set appropriate MIME type
        const ext = path.extname(objectKey).toLowerCase();
        let contentType = 'image/jpeg'; // Default
        
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        
        // Set response headers directly
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        // Send the buffer directly
        console.log(`[Property Images API] Serving image with content type: ${contentType}, size: ${imageBuffer.length} bytes`);
        return res.send(imageBuffer);
      } catch (error: any) {
        console.error(`[Property Images API] Error downloading image: ${error.message}`);
        return res.status(500).send(`Error downloading image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error serving property image:', error);
      res.status(500).send('Error serving image');
    }
  });

  // Serve unit images from object storage - direct approach
  app.get('/api/unit-images/:objectKey(*)', async (req: Request, res: Response) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`[Unit Images API] Serving unit image with objectKey: ${objectKey}`);

      // Find unit image with this objectKey
      const allUnits = await storage.getAllPropertyUnits();
      let unitImage = null;

      for (const unit of allUnits) {
        const images = await storage.getUnitImages(unit.id);
        const image = images.find((img: UnitImage) => img.objectKey === objectKey);
        if (image) {
          unitImage = image;
          break;
        }
      }

      if (!unitImage) {
        return res.status(404).send('Unit image not found');
      }

      // Direct download from object storage
      try {
        console.log(`[Unit Images API] Downloading image data directly for: ${objectKey}`);
        const result = await client.downloadAsBytes(objectKey);
        
        if (!result.ok || !result.value) {
          console.log(`[Unit Images API] Direct download failed, error: ${result.error}`);
          return res.status(404).send('Image data not found in object storage');
        }
        
        console.log(`[Unit Images API] Successfully downloaded image data, size: ${result.value.length} bytes`);
        console.log(`[Unit Images API] Data type: ${typeof result.value}, isArray: ${Array.isArray(result.value)}, isBuffer: ${Buffer.isBuffer(result.value)}`);
        
        // DIRECT BUFFER CONVERSION
        let imageBuffer: Buffer;
        
        if (Buffer.isBuffer(result.value)) {
          imageBuffer = result.value;
          console.log('[Unit Images API] Already a Buffer');
        } else if (Array.isArray(result.value)) {
          // Convert using Uint8Array for array of bytes
          const uint8Array = new Uint8Array(result.value.length);
          for (let i = 0; i < result.value.length; i++) {
            uint8Array[i] = result.value[i];
          }
          imageBuffer = Buffer.from(uint8Array);
          console.log(`[Unit Images API] Converted Array to Buffer via Uint8Array, length: ${imageBuffer.length}`);
        } else {
          // Fallback for other types
          imageBuffer = Buffer.from(String(result.value));
          console.log(`[Unit Images API] Converted to Buffer via string, length: ${imageBuffer.length}`);
        }
        
        // Verify buffer is valid
        console.log(`[Unit Images API] Final Buffer valid: ${Buffer.isBuffer(imageBuffer)}, length: ${imageBuffer.length}`);
        
        // Set appropriate MIME type
        const ext = path.extname(objectKey).toLowerCase();
        let contentType = 'image/jpeg'; // Default
        
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        
        // Set response headers directly
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        // Send the buffer directly
        console.log(`[Unit Images API] Serving image with content type: ${contentType}, size: ${imageBuffer.length} bytes`);
        return res.send(imageBuffer);
      } catch (error: any) {
        console.error(`[Unit Images API] Error downloading image: ${error.message}`);
        return res.status(500).send(`Error downloading image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error serving unit image:', error);
      res.status(500).send('Error serving image');
    }
  });

  // Direct bucket access endpoint for images
  app.get('/api/direct-images/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      // Log the raw object key for debugging
      console.log(`[Direct Image API] Raw object key from request: ${objectKey}`);
      
      // Try to decode the object key if it's encoded
      try {
        // Decode multiple times to handle double-encoding scenarios
        let decodedKey = objectKey;
        let previousKey;
        
        do {
          previousKey = decodedKey;
          decodedKey = decodeURIComponent(previousKey);
        } while (decodedKey !== previousKey);
        
        if (decodedKey !== objectKey) {
          console.log(`[Direct Image API] Decoded object key: ${decodedKey}`);
          objectKey = decodedKey;
        }
      } catch (e) {
        console.log(`[Direct Image API] Error decoding object key: ${e}`);
        // Continue with the original key if decoding fails
      }
      
      console.log(`[Direct Image API] Attempting to serve image directly from bucket: ${objectKey}`);

      // Use the bucket ID directly
      const BUCKET_ID = 'replit-objstore-8f3f1a22-cdd2-4088-9bff-f7887f5d323d';
      
      // Try direct access with the bucket ID
      const directPath = `${BUCKET_ID}/${objectKey}`;
      console.log(`[Direct Image API] Trying direct bucket access: ${directPath}`);
      
      try {
        // Try to download directly using the client
        const result = await client.downloadAsBytes(directPath);
        
        if (result.ok && result.value) {
          console.log(`[Direct Image API] Successfully retrieved image with direct bucket access: ${directPath}, size: ${result.value.length} bytes`);
          return sendImageResponse(res, directPath, result.value as unknown as Buffer);
        } else {
          console.log(`[Direct Image API] Failed to retrieve image with direct bucket access: ${directPath}`);
        }
      } catch (error: any) {
        console.log(`[Direct Image API] Error with direct bucket access: ${error.message}`);
      }
      
      // If direct access failed, try with just the filename
      const filename = path.basename(objectKey);
      const filenameDirectPath = `${BUCKET_ID}/${filename}`;
      console.log(`[Direct Image API] Trying direct bucket access with filename: ${filenameDirectPath}`);
      
      try {
        const result = await client.downloadAsBytes(filenameDirectPath);
        
        if (result.ok && result.value) {
          console.log(`[Direct Image API] Successfully retrieved image with filename direct access: ${filenameDirectPath}, size: ${result.value.length} bytes`);
          return sendImageResponse(res, filenameDirectPath, result.value as unknown as Buffer);
        } else {
          console.log(`[Direct Image API] Failed to retrieve image with filename direct access: ${filenameDirectPath}`);
        }
      } catch (error: any) {
        console.log(`[Direct Image API] Error with filename direct access: ${error.message}`);
      }
      
      // If all direct attempts failed, fall back to the standard getImageData function
      console.log(`[Direct Image API] Direct attempts failed, falling back to getImageData`);
      const imageData = await getImageData(objectKey);
      
      if (!imageData) {
        console.log(`[Direct Image API] Image not found after trying all paths`);
        return res.status(404).send('Image not found');
      }

      console.log(`[Direct Image API] Successfully found image using fallback method`);
      return sendImageResponse(res, objectKey, imageData);
    } catch (error) {
      console.error('[Direct Image API] Error serving image:', error);
      return res.status(500).send('Error serving image');
    }
  });
  
  // Endpoint to check if an image exists with multiple path variations
  app.get('/api/images/exists/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      // Log the raw object key for debugging
      console.log(`[Image Exists API] Raw object key from request: ${objectKey}`);
      
      // Try to decode the object key if it's encoded
      try {
        // Decode multiple times to handle double-encoding scenarios
        let decodedKey = objectKey;
        let previousKey;
        
        do {
          previousKey = decodedKey;
          decodedKey = decodeURIComponent(previousKey);
        } while (decodedKey !== previousKey);
        
        if (decodedKey !== objectKey) {
          console.log(`[Image Exists API] Decoded object key: ${decodedKey}`);
          objectKey = decodedKey;
        }
      } catch (e) {
        console.log(`[Image Exists API] Error decoding object key: ${e}`);
        // Continue with the original key if decoding fails
      }
      
      console.log(`[Image Exists API] Checking if image exists: ${objectKey}`);
      
      // Check if the image exists with multiple path variations
      const exists = await imageExistsWithVariations(objectKey);
      
      return res.json({ exists, objectKey });
    } catch (error) {
      console.error('[Image Exists API] Error checking if image exists:', error);
      return res.status(500).json({ error: 'Error checking if image exists' });
    }
  });

  // Raw bucket access endpoint for images with direct buffer conversion
  app.get('/api/raw-images/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      // Log the raw object key for debugging
      console.log(`[Raw Image API] Raw object key from request: ${objectKey}`);
      
      // Try to decode the object key if it's encoded
      try {
        // Decode multiple times to handle double-encoding scenarios
        let decodedKey = objectKey;
        let previousKey;
        
        do {
          previousKey = decodedKey;
          decodedKey = decodeURIComponent(previousKey);
        } while (decodedKey !== previousKey);
        
        if (decodedKey !== objectKey) {
          console.log(`[Raw Image API] Decoded object key: ${decodedKey}`);
          objectKey = decodedKey;
        }
      } catch (e) {
        console.log(`[Raw Image API] Error decoding object key: ${e}`);
        // Continue with the original key if decoding fails
      }
      
      console.log(`[Raw Image API] Attempting to serve image directly from client: ${objectKey}`);

      // Try to download directly using the client
      try {
        const result = await client.downloadAsBytes(objectKey);
        
        if (result.ok && result.value) {
          console.log(`[Raw Image API] Successfully retrieved image: ${objectKey}, size: ${result.value.length} bytes`);
          console.log(`[Raw Image API] Data type: ${typeof result.value}, isArray: ${Array.isArray(result.value)}, isBuffer: ${Buffer.isBuffer(result.value)}`);
          
          // DIRECT BUFFER CONVERSION - Using Node's Buffer.from with explicit type handling
          let imageBuffer: Buffer;
          
          if (Buffer.isBuffer(result.value)) {
            imageBuffer = result.value;
            console.log('[Raw Image API] Already a Buffer');
          } else if (Array.isArray(result.value)) {
            // Convert using Uint8Array first - the cleanest way to handle an array of bytes
            const uint8Array = new Uint8Array(result.value.length);
            for (let i = 0; i < result.value.length; i++) {
              uint8Array[i] = result.value[i];
            }
            imageBuffer = Buffer.from(uint8Array);
            console.log(`[Raw Image API] Converted Array to Buffer via Uint8Array, length: ${imageBuffer.length}`);
          } else {
            // Fallback for other types
            imageBuffer = Buffer.from(String(result.value));
            console.log(`[Raw Image API] Converted to Buffer via string, length: ${imageBuffer.length}`);
          }
          
          // Verify buffer is valid
          console.log(`[Raw Image API] Final Buffer valid: ${Buffer.isBuffer(imageBuffer)}, length: ${imageBuffer.length}`);
          
          // Set appropriate MIME type
          const ext = path.extname(objectKey).toLowerCase();
          let contentType = 'image/jpeg'; // Default
          
          if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          else if (ext === '.svg') contentType = 'image/svg+xml';
          
          // Set response headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', imageBuffer.length);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          
          // Send the buffer directly
          return res.send(imageBuffer);
        } else {
          console.log(`[Raw Image API] Failed to retrieve image: ${objectKey}, error: ${result.error}`);
          return res.status(404).send('Image not found');
        }
      } catch (error: any) {
        console.log(`[Raw Image API] Error retrieving image: ${error.message}`);
        return res.status(500).send(`Error retrieving image: ${error.message}`);
      }
    } catch (error: any) {
      console.error('[Raw Image API] Error serving image:', error);
      return res.status(500).send(`Error serving image: ${error.message}`);
    }
  });

  // Direct bucket ID endpoint for images
  app.get('/api/bucket/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      // Log the raw object key for debugging
      console.log(`[Bucket API] Raw object key from request: ${objectKey}`);
      
      // Try to decode the object key if it's encoded
      try {
        // Decode multiple times to handle double-encoding scenarios
        let decodedKey = objectKey;
        let previousKey;
        
        do {
          previousKey = decodedKey;
          decodedKey = decodeURIComponent(previousKey);
        } while (decodedKey !== previousKey);
        
        if (decodedKey !== objectKey) {
          console.log(`[Bucket API] Decoded object key: ${decodedKey}`);
          objectKey = decodedKey;
        }
      } catch (e) {
        console.log(`[Bucket API] Error decoding object key: ${e}`);
        // Continue with the original key if decoding fails
      }
      
      // Prepend the bucket ID to the object key
      const BUCKET_ID = 'replit-objstore-8f3f1a22-cdd2-4088-9bff-f7887f5d323d';
      const fullKey = `${BUCKET_ID}/${objectKey}`;
      
      console.log(`[Bucket API] Attempting to serve image with bucket ID: ${fullKey}`);
      
      // Try to download directly using the client
      try {
        const result = await client.downloadAsBytes(fullKey);
        
        if (result.ok && result.value) {
          console.log(`[Bucket API] Successfully retrieved image: ${fullKey}, size: ${result.value.length} bytes`);
          return sendImageResponse(res, fullKey, result.value as unknown as Buffer);
        } else {
          console.log(`[Bucket API] Failed to retrieve image: ${fullKey}, error: ${result.error}`);
          
          // Try with just the filename as a fallback
          const filename = path.basename(objectKey);
          const filenameKey = `${BUCKET_ID}/${filename}`;
          
          console.log(`[Bucket API] Trying with just filename: ${filenameKey}`);
          const filenameResult = await client.downloadAsBytes(filenameKey);
          
          if (filenameResult.ok && filenameResult.value) {
            console.log(`[Bucket API] Successfully retrieved image with filename: ${filenameKey}, size: ${filenameResult.value.length} bytes`);
            return sendImageResponse(res, filenameKey, filenameResult.value as unknown as Buffer);
          } else {
            console.log(`[Bucket API] Failed to retrieve image with filename: ${filenameKey}, error: ${filenameResult.error}`);
            return res.status(404).send('Image not found');
          }
        }
      } catch (error: any) {
        console.log(`[Bucket API] Error retrieving image: ${error.message}`);
        return res.status(500).send(`Error retrieving image: ${error.message}`);
      }
    } catch (error: any) {
      console.error('[Bucket API] Error serving image:', error);
      return res.status(500).send(`Error serving image: ${error.message}`);
    }
  });

  // List all objects in the bucket
  app.get('/api/bucket/list', async (req, res) => {
    try {
      console.log(`[Bucket List API] Listing all objects in the bucket`);
      
      const result = await client.list();
      
      if (result.ok && result.value) {
        const objects = result.value.map(obj => ({
          name: obj.name || '',
        }));
        
        console.log(`[Bucket List API] Found ${objects.length} objects`);
        return res.json({ success: true, objects });
      } else {
        console.log(`[Bucket List API] Failed to list objects: ${result.error}`);
        return res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      console.error('[Bucket List API] Error listing objects:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // Check if an image exists in the bucket with the bucket ID
  app.get('/api/bucket/exists/:objectKey(*)', async (req, res) => {
    try {
      // Get the object key from the request params
      let objectKey = req.params.objectKey;
      
      // Log the raw object key for debugging
      console.log(`[Bucket Exists API] Raw object key from request: ${objectKey}`);
      
      // Try to decode the object key if it's encoded
      try {
        // Decode multiple times to handle double-encoding scenarios
        let decodedKey = objectKey;
        let previousKey;
        
        do {
          previousKey = decodedKey;
          decodedKey = decodeURIComponent(previousKey);
        } while (decodedKey !== previousKey);
        
        if (decodedKey !== objectKey) {
          console.log(`[Bucket Exists API] Decoded object key: ${decodedKey}`);
          objectKey = decodedKey;
        }
      } catch (e) {
        console.log(`[Bucket Exists API] Error decoding object key: ${e}`);
        // Continue with the original key if decoding fails
      }
      
      // Prepend the bucket ID to the object key
      const BUCKET_ID = 'replit-objstore-8f3f1a22-cdd2-4088-9bff-f7887f5d323d';
      const fullKey = `${BUCKET_ID}/${objectKey}`;
      
      console.log(`[Bucket Exists API] Checking if image exists with bucket ID: ${fullKey}`);
      
      // Try to check if the object exists
      try {
        const exists = await imageExists(fullKey);
        console.log(`[Bucket Exists API] Image exists check result for ${fullKey}: ${exists}`);
        
        // If the full path doesn't exist, try with just the filename
        if (!exists) {
          const filename = path.basename(objectKey);
          const filenameKey = `${BUCKET_ID}/${filename}`;
          
          console.log(`[Bucket Exists API] Checking with just filename: ${filenameKey}`);
          const filenameExists = await imageExists(filenameKey);
          console.log(`[Bucket Exists API] Image exists check result for ${filenameKey}: ${filenameExists}`);
          
          if (filenameExists) {
            return res.json({ exists: true, key: filenameKey });
          }
        } else {
          return res.json({ exists, key: fullKey });
        }
        
        // If we get here, the image doesn't exist with either path
        return res.json({ exists: false });
      } catch (error: any) {
        console.log(`[Bucket Exists API] Error checking if image exists: ${error.message}`);
        return res.status(500).json({ exists: false, error: error.message });
      }
    } catch (error: any) {
      console.error('[Bucket Exists API] Error checking if image exists:', error);
      return res.status(500).json({ exists: false, error: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}