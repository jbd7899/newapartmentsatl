/**
 * Main server entry point
 * 
 * Changes:
 * - Updated to use PostgreSQL storage instead of in-memory storage
 * - Added support for object storage for images
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { PgStorage } from "./pg-storage";
import { storage } from "./storage";
import cors from 'cors';
import path from 'path';
import { getImageData } from './storage-utils'; // Import the object storage utilities

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Use PostgreSQL storage instead of in-memory storage
// This will be the primary storage interface used by the application
export const pgStorage = new PgStorage();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// API Routes

// Locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await pgStorage.getLocations();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.get('/api/locations/:slug', async (req, res) => {
  try {
    const location = await pgStorage.getLocationBySlug(req.params.slug);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Neighborhoods
app.get('/api/neighborhoods/:locationId', async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const neighborhood = await pgStorage.getNeighborhoodByLocationId(locationId);
    if (!neighborhood) {
      return res.status(404).json({ error: 'Neighborhood not found' });
    }
    res.json(neighborhood);
  } catch (error) {
    console.error('Error fetching neighborhood:', error);
    res.status(500).json({ error: 'Failed to fetch neighborhood' });
  }
});

// Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await pgStorage.getProperties();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/location/:locationId', async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const properties = await pgStorage.getPropertiesByLocation(locationId);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties by location:', error);
    res.status(500).json({ error: 'Failed to fetch properties by location' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const property = await pgStorage.getProperty(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Features
app.get('/api/features', async (req, res) => {
  try {
    const features = await pgStorage.getFeatures();
    res.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// Inquiries
app.get('/api/inquiries', async (req, res) => {
  try {
    const inquiries = await pgStorage.getInquiries();
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const inquiry = await pgStorage.createInquiry(req.body);
    res.status(201).json(inquiry);
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

app.patch('/api/inquiries/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updatedInquiry = await pgStorage.updateInquiryStatus(id, status);
    if (!updatedInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json(updatedInquiry);
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// Property Images
app.get('/api/property-images', async (req, res) => {
  try {
    const images = await pgStorage.getPropertyImages();
    res.json(images);
  } catch (error) {
    console.error('Error fetching property images:', error);
    res.status(500).json({ error: 'Failed to fetch property images' });
  }
});

app.get('/api/property-images/:propertyId', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const images = await pgStorage.getPropertyImagesByProperty(propertyId);
    res.json(images);
  } catch (error) {
    console.error('Error fetching property images by property:', error);
    res.status(500).json({ error: 'Failed to fetch property images by property' });
  }
});

// Property Units
app.get('/api/property-units/:propertyId', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const units = await pgStorage.getPropertyUnits(propertyId);
    res.json(units);
  } catch (error) {
    console.error('Error fetching property units:', error);
    res.status(500).json({ error: 'Failed to fetch property units' });
  }
});

app.get('/api/property-units/unit/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const unit = await pgStorage.getPropertyUnit(id);
    if (!unit) {
      return res.status(404).json({ error: 'Property unit not found' });
    }
    res.json(unit);
  } catch (error) {
    console.error('Error fetching property unit:', error);
    res.status(500).json({ error: 'Failed to fetch property unit' });
  }
});

// Unit Images
app.get('/api/unit-images/:unitId', async (req, res) => {
  try {
    const unitId = parseInt(req.params.unitId);
    const images = await pgStorage.getUnitImages(unitId);
    res.json(images);
  } catch (error) {
    console.error('Error fetching unit images:', error);
    res.status(500).json({ error: 'Failed to fetch unit images' });
  }
});

// Image API endpoint to serve images from object storage
app.get('/api/images/:objectKey', async (req, res) => {
  try {
    const objectKey = decodeURIComponent(req.params.objectKey);
    
    // Get image data from object storage
    const imageData = await getImageData(objectKey);
    
    if (!imageData) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Determine content type based on file extension
    const ext = path.extname(objectKey).toLowerCase();
    let contentType = 'image/jpeg'; // Default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    
    // Set content type and send image data
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(imageData);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
