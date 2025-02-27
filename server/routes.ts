import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
// Use the global storage instance which can be either in-memory or PostgreSQL
const storage = (global as any).storage || await import('./storage').then(m => m.storage);
import { z } from "zod";
import { 
  insertInquirySchema, 
  insertPropertyImageSchema, 
  insertNeighborhoodSchema, 
  insertPropertyUnitSchema, 
  insertUnitImageSchema,
  type PropertyImage,
  type UnitImage,
  type ImageStorage
} from "@shared/schema";
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
  
  // Serve images directly from database storage
  app.get('/api/db-images/:objectKey', async (req: Request, res: Response) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`Serving image from database: ${objectKey}`);
      
      if (!objectKey) {
        console.log('No object key provided');
        return res.status(404).send('Image not found');
      }
      
      // Get the image data from database storage
      const imageData = await storage.getImageDataByObjectKey(objectKey);
      
      if (!imageData) {
        console.log(`Image not found in database: ${objectKey}`);
        
        // If this is an object storage key, try to get it from object storage
        if (isObjectStorageKey(objectKey)) {
          console.log(`Trying object storage for: ${objectKey}`);
          const imageBuffer = await getImageData(objectKey);
          
          if (imageBuffer) {
            // Determine MIME type based on filename
            const filename = getFilenameFromObjectKey(objectKey);
            let mimeType = 'image/jpeg';
            if (filename.endsWith('.png')) mimeType = 'image/png';
            else if (filename.endsWith('.gif')) mimeType = 'image/gif';
            else if (filename.endsWith('.webp')) mimeType = 'image/webp';
            else if (filename.endsWith('.svg')) mimeType = 'image/svg+xml';
            
            res.contentType(mimeType);
            return res.send(imageBuffer);
          }
        }
        
        return res.status(404).send('Image not found');
      }
      
      // Extract base64 data and convert to buffer
      const buffer = Buffer.from(imageData.data, 'base64');
      
      // Set proper content type
      res.contentType(imageData.mimeType);
      console.log(`Serving image from database, size: ${buffer.length} bytes`);
      
      return res.send(buffer);
    } catch (error) {
      console.error('Error serving image from database:', error);
      return res.status(500).send('Error processing image');
    }
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
    
    // If the URL is already a database image URL, return it as is
    if (url.startsWith('/api/db-images/')) {
      console.log(`URL is already a database image URL: ${url}`);
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
      
      // Generate a filename/objectKey for the image
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(4).toString('hex');
      const objectKey = `dbimg_${timestamp}_${randomStr}${extension}`;
      console.log(`Generated new object key: ${objectKey}`);
      
      // Calculate size
      const bufferSize = Buffer.from(base64Data, 'base64').length;
      
      // Store image in database
      await storage.saveImageData({
        objectKey,
        mimeType,
        data: base64Data,
        size: bufferSize
      });
      
      console.log(`Stored image in database with key: ${objectKey}`);
      
      // Return the path to the image with our API endpoint
      return `/api/db-images/${objectKey}`;
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
      
      // Prepare the image object with the integrated storage approach
      let imageData: any = {
        ...restOfBody,
        url: req.body.url
      };
      
      // If image data is provided, process it
      if (data && typeof data === 'string') {
        const dataMatches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (dataMatches && dataMatches.length === 3) {
          const mimeType = dataMatches[1];
          const base64Data = dataMatches[2];
          
          // Determine file extension based on MIME type
          let extension = '.jpg';
          if (mimeType === 'image/png') extension = '.png';
          else if (mimeType === 'image/gif') extension = '.gif';
          else if (mimeType === 'image/webp') extension = '.webp';
          else if (mimeType === 'image/svg+xml') extension = '.svg';
          
          // Generate a unique object key
          const timestamp = Date.now();
          const randomStr = crypto.randomBytes(4).toString('hex');
          const objectKey = `prop_img_${timestamp}_${randomStr}${extension}`;
          
          // Calculate size
          const bufferSize = Buffer.from(base64Data, 'base64').length;
          
          // Create a URL that references the object key
          const url = `/api/property-images/${objectKey}`;
          
          // Update the image data with storage information
          imageData = {
            ...imageData,
            url,
            objectKey,
            mimeType,
            size: bufferSize,
            imageData: base64Data,
            storageType: "database"
          };
        }
      }
      
      // Validate request body
      const validationResult = insertPropertyImageSchema.safeParse(imageData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Verify property exists
      const property = await storage.getProperty(imageData.propertyId);
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
      
      // Check if this is a database-stored image
      if (image.url && image.url.startsWith('/api/db-images/')) {
        try {
          // Extract object key from URL
          const objectKey = image.url.split('/api/db-images/')[1];
          if (objectKey) {
            // Delete from database storage
            await storage.deleteImageDataByObjectKey(objectKey);
            console.log(`Deleted image from database storage: ${objectKey}`);
          }
        } catch (error) {
          console.error(`Failed to delete image from database storage: ${image.url}`, error);
          // Continue with deletion from database even if storage deletion fails
        }
      }
      // If the image URL is an object storage key (not an external URL), delete it from storage
      else if (image.url && !image.url.startsWith('http')) {
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
      
      // Prepare the image object with the integrated storage approach
      let imageData: any = {
        ...restOfBody,
        url: req.body.url
      };
      
      // If image data is provided, process it
      if (data && typeof data === 'string') {
        const dataMatches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (dataMatches && dataMatches.length === 3) {
          const mimeType = dataMatches[1];
          const base64Data = dataMatches[2];
          
          // Determine file extension based on MIME type
          let extension = '.jpg';
          if (mimeType === 'image/png') extension = '.png';
          else if (mimeType === 'image/gif') extension = '.gif';
          else if (mimeType === 'image/webp') extension = '.webp';
          else if (mimeType === 'image/svg+xml') extension = '.svg';
          
          // Generate a unique object key
          const timestamp = Date.now();
          const randomStr = crypto.randomBytes(4).toString('hex');
          const objectKey = `unit_img_${timestamp}_${randomStr}${extension}`;
          
          // Calculate size
          const bufferSize = Buffer.from(base64Data, 'base64').length;
          
          // Create a URL that references the object key
          const url = `/api/unit-images/${objectKey}`;
          
          // Update the image data with storage information
          imageData = {
            ...imageData,
            url,
            objectKey,
            mimeType,
            size: bufferSize,
            imageData: base64Data,
            storageType: "database"
          };
        }
      }
      
      // Validate request body
      const validationResult = insertUnitImageSchema.safeParse(imageData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Verify unit exists
      const unit = await storage.getPropertyUnit(imageData.unitId);
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
      
      // Check if this is a database-stored image
      if (image.url && image.url.startsWith('/api/db-images/')) {
        try {
          // Extract object key from URL
          const objectKey = image.url.split('/api/db-images/')[1];
          if (objectKey) {
            // Delete from database storage
            await storage.deleteImageDataByObjectKey(objectKey);
            console.log(`Deleted image from database storage: ${objectKey}`);
          }
        } catch (error) {
          console.error(`Failed to delete image from database storage: ${image.url}`, error);
          // Continue with deletion from database even if storage deletion fails
        }
      }
      // If the image URL is an object storage key (not an external URL), delete it from storage
      else if (image.url && !image.url.startsWith('http')) {
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
      // Get images from both storage systems
      const objectStorageImages = await listImages();
      const dbImages = await storage.getAllStoredImages();
      
      // Format database images to match the expected output
      const formattedDbImages = dbImages.map((img: ImageStorage) => ({
        key: img.objectKey,
        url: `/api/db-images/${img.objectKey}`,
        size: img.size,
        type: img.mimeType,
        source: 'database'
      }));
      
      // Format object storage images
      const formattedObjectStorageImages = objectStorageImages.map(key => ({
        key,
        url: `/api/images/${key}`,
        source: 'object-storage'
      }));
      
      res.json({ 
        images: [...formattedDbImages, ...formattedObjectStorageImages],
        counts: {
          database: formattedDbImages.length,
          objectStorage: formattedObjectStorageImages.length,
          total: formattedDbImages.length + formattedObjectStorageImages.length
        }
      });
    } catch (error) {
      console.error('Error listing images:', error);
      res.status(500).json({ message: "Failed to list images" });
    }
  });
  
  // Serve property images with integrated storage
  app.get('/api/property-images/:objectKey(*)', async (req: Request, res: Response) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`Serving property image with objectKey: ${objectKey}`);
      
      // Find property image with this objectKey
      const images = await storage.getPropertyImages();
      const image = images.find((img: PropertyImage) => img.objectKey === objectKey);
      
      if (!image) {
        return res.status(404).send('Property image not found');
      }
      
      // If image has data directly stored, serve it
      if (image.imageData) {
        // Determine content type
        const mimeType = image.mimeType || 'image/jpeg';
        
        // Convert base64 to buffer and serve
        const buffer = Buffer.from(image.imageData, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        return res.send(buffer);
      }
      
      return res.status(404).send('Image data not found');
    } catch (error) {
      console.error('Error serving property image:', error);
      res.status(500).send('Error serving image');
    }
  });
  
  // Serve unit images with integrated storage
  app.get('/api/unit-images/:objectKey(*)', async (req: Request, res: Response) => {
    try {
      const objectKey = req.params.objectKey;
      console.log(`Serving unit image with objectKey: ${objectKey}`);
      
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
      
      // If image has data directly stored, serve it
      if (unitImage.imageData) {
        // Determine content type
        const mimeType = unitImage.mimeType || 'image/jpeg';
        
        // Convert base64 to buffer and serve
        const buffer = Buffer.from(unitImage.imageData, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        return res.send(buffer);
      }
      
      return res.status(404).send('Image data not found');
    } catch (error) {
      console.error('Error serving unit image:', error);
      res.status(500).send('Error serving image');
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
