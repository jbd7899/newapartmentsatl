import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertInquirySchema, insertPropertyImageSchema, insertNeighborhoodSchema, insertPropertyUnitSchema, insertUnitImageSchema } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { uploadImage, deleteImage, getImageData, getFilenameFromObjectKey, imageExists, listImages, isObjectStorageKey } from "./object-storage";
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
  
  // Process image data and save to store
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
      const buffer = Buffer.from(matches[2], 'base64');
      
      // Determine file extension based on MIME type
      let extension = '.jpg';
      if (mimeType === 'image/png') extension = '.png';
      else if (mimeType === 'image/gif') extension = '.gif';
      else if (mimeType === 'image/webp') extension = '.webp';
      else if (mimeType === 'image/svg+xml') extension = '.svg';
      
      // Generate a filename for the image
      let filename;
      if (url.startsWith('/uploads/')) {
        // Extract the filename from the URL
        filename = url.split('/uploads/')[1];
        console.log(`Extracted filename from URL: ${filename}`);
        
        // Sanitize the filename to remove path separators and other invalid characters
        filename = filename.replace(/[\/\\?%*:|"<>]/g, '_');
      } else {
        // Generate a new filename
        const timestamp = Date.now();
        const randomStr = crypto.randomBytes(4).toString('hex');
        filename = `image_${timestamp}_${randomStr}${extension}`;
        console.log(`Generated new filename: ${filename}`);
      }
      
      // Upload to object storage
      const objectKey = await uploadImage(buffer, filename);
      console.log(`Uploaded image to object storage with key: ${objectKey}`);
      
      // Return the object key as the URL
      return objectKey;
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

  // Add a new property image
  app.post("/api/property-images", async (req: Request, res: Response) => {
    try {
      // Check if we're getting data URL along with the URL
      const { data, ...restOfBody } = req.body;
      
      // Process the URL if needed (convert data URLs to file URLs)
      let processedUrl = req.body.url;
      if (data && typeof data === 'string') {
        processedUrl = await processImageData(req.body.url, data);
      }
      
      // Prepare the body with the processed URL
      const bodyWithProcessedUrl = {
        ...restOfBody,
        url: processedUrl
      };
      
      // Validate request body
      const validationResult = insertPropertyImageSchema.safeParse(bodyWithProcessedUrl);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Verify property exists
      const property = await storage.getProperty(bodyWithProcessedUrl.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
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

  // Delete property image
  app.delete("/api/property-images/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      // Get the image first to get its URL
      const image = await storage.getPropertyImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // If the image URL is an object storage key (not an external URL), delete it from storage
      if (image.url && !image.url.startsWith('http')) {
        try {
          // Delete from object storage
          await deleteImage(image.url);
          console.log(`Deleted image from object storage: ${image.url}`);
        } catch (error) {
          console.error(`Failed to delete image from object storage: ${image.url}`, error);
          // Continue with deletion from database even if storage deletion fails
        }
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
  
  // Add a new unit image
  app.post("/api/unit-images", async (req: Request, res: Response) => {
    try {
      // Check if we're getting data URL along with the URL
      const { data, ...restOfBody } = req.body;
      
      // Process the URL if needed (convert data URLs to file URLs)
      let processedUrl = req.body.url;
      if (data && typeof data === 'string') {
        processedUrl = await processImageData(req.body.url, data);
      }
      
      // Prepare the body with the processed URL
      const bodyWithProcessedUrl = {
        ...restOfBody,
        url: processedUrl
      };
      
      // Validate request body
      const validationResult = insertUnitImageSchema.safeParse(bodyWithProcessedUrl);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Verify unit exists
      const unit = await storage.getPropertyUnit(bodyWithProcessedUrl.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
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
  
  // Delete unit image
  app.delete("/api/unit-images/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      // Get the image first to get its URL
      const image = await storage.getUnitImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // If the image URL is an object storage key (not an external URL), delete it from storage
      if (image.url && !image.url.startsWith('http')) {
        try {
          // Delete from object storage
          await deleteImage(image.url);
          console.log(`Deleted image from object storage: ${image.url}`);
        } catch (error) {
          console.error(`Failed to delete image from object storage: ${image.url}`, error);
          // Continue with deletion from database even if storage deletion fails
        }
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

  // Serve images from object storage
  app.get('/api/images/:objectKey(*)', async (req, res) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`Serving image from object storage: ${objectKey}`);
      
      // Get the image data from object storage
      const imageData = await getImageData(objectKey);
      
      if (!imageData) {
        console.log(`Image not found in object storage: ${objectKey}`);
        return res.status(404).send('Image not found');
      }
      
      // Determine content type based on file extension
      const ext = path.extname(objectKey).toLowerCase();
      let contentType = 'image/jpeg'; // Default
      
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      // Set cache headers (cache for 1 day)
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', contentType);
      
      return res.send(imageData);
    } catch (error) {
      console.error('Error serving image from object storage:', error);
      return res.status(500).send('Error serving image');
    }
  });
  
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
      const images = await listImages();
      res.json({ images });
    } catch (error) {
      console.error('Error listing images:', error);
      res.status(500).json({ message: "Failed to list images" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
