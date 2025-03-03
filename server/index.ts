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
import { getImageData, client } from './object-storage'; // Import the object storage utilities and client
import multer from 'multer';

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

// Simple image serving endpoint using Replit Object Storage
app.get('/api/images/:key(*)', async (req, res) => {
  // Get the key parameter from the URL
  const key = req.params.key;
  
  console.log(`[Image API] Requested image with key: "${key}"`);
  
  try {
    // Use the Replit client directly to download the image as bytes
    const { ok, value, error } = await client.downloadAsBytes(key);
    
    // If download failed
    if (!ok || !value) {
      console.error(`[Image API] Failed to get image: ${error}`);
      return res.status(404).send('Image not found');
    }
    
    // Determine content type based on file extension
    const ext = path.extname(key).toLowerCase();
    let contentType = 'application/octet-stream'; // Default for binary data
    
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    console.log(`[Image API] Serving image with content type: ${contentType}, size: ${value.length} bytes`);
    
    // Set basic headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', value.length);
    
    // Send the raw binary data directly
    res.end(value);
  } catch (error) {
    console.error(`[Image API] Server error: ${error}`);
    res.status(500).send('Server error');
  }
});

// Debug endpoint for testing image loading
app.get('/api/debug/image-test', async (req, res) => {
  const key = req.query.key as string;
  
  if (!key) {
    return res.status(400).json({
      error: "Missing key parameter",
      message: "Please provide an image key to test"
    });
  }
  
  console.log(`[DEBUG] Testing direct image loading for: "${key}"`);
  
  try {
    // Attempt to list all objects first to check what's available
    const listResult = await client.list();
    const availableObjects = listResult.ok && listResult.value ? 
      listResult.value.map(obj => obj.name || String(obj)) : [];
    
    console.log(`[DEBUG] Available objects (${availableObjects.length}):`);
    console.log(availableObjects.slice(0, 10)); // Show first 10 for brevity
    
    // Try to download the requested key
    console.log(`[DEBUG] Attempting to download: "${key}"`);
    const result = await client.downloadAsBytes(key);
    
    // Return detailed information about the result
    return res.json({
      requestedKey: key,
      success: result.ok,
      error: result.error ? String(result.error) : null,
      dataSize: result.value ? result.value.length : 0,
      availableObjectCount: availableObjects.length,
      sampleObjects: availableObjects.slice(0, 5),
      keyExists: availableObjects.includes(key),
      similarKeys: availableObjects.filter(obj => 
        obj.includes(key) || key.includes(obj)
      ).slice(0, 5)
    });
  } catch (error) {
    console.error(`[DEBUG] Error in debug endpoint:`, error);
    return res.status(500).json({
      error: String(error),
      message: "An error occurred during testing"
    });
  }
});

// Import multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Test upload endpoint
app.post('/api/debug/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  try {
    const filename = req.file.originalname;
    const buffer = req.file.buffer;
    
    console.log(`[DEBUG] Uploading test file: ${filename}, size: ${buffer.length} bytes`);
    
    // Get a clean filename
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Upload file with direct key (no folder structure)
    const { ok, error } = await client.uploadFromBytes(cleanFilename, buffer);
    
    if (!ok) {
      console.error(`[DEBUG] Upload failed:`, error);
      return res.status(500).json({
        success: false,
        message: `Upload failed: ${error}`
      });
    }
    
    console.log(`[DEBUG] Upload successful: ${cleanFilename}`);
    
    // Return the uploaded file information
    return res.json({
      success: true,
      filename: cleanFilename,
      size: buffer.length,
      url: `/api/images/${cleanFilename}`
    });
  } catch (error) {
    console.error(`[DEBUG] Upload error:`, error);
    return res.status(500).json({
      success: false,
      message: String(error)
    });
  }
});

// Simple HTML test page for direct image viewing
app.get('/test-image', (req, res) => {
  const imageName = req.query.image || 'Test.png';
  
  // Create a simple HTML page with the image
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Image Test Page</title>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      .image-container { margin: 20px 0; border: 1px solid #ccc; padding: 10px; }
      .error { color: red; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <h1>Image Test Page</h1>
    <p>Testing direct image loading from Object Storage</p>
    
    <h2>Test Image</h2>
    <div class="image-container">
      <p>Image URL: <code>/api/images/${imageName}</code></p>
      <img 
        src="/api/images/${imageName}" 
        alt="Test Image" 
        style="max-width: 100%;"
        onerror="document.getElementById('error').style.display='block'"
      />
      <div id="error" class="error" style="display:none; margin-top: 10px;">
        Error: Image failed to load
      </div>
    </div>
    
    <h2>Try Another Image</h2>
    <form>
      <label for="image">Image name or path:</label>
      <input type="text" id="image" name="image" value="${imageName}" style="width: 300px; padding: 5px;">
      <button type="submit">Test Image</button>
    </form>
    
    <h2>Raw Image Response</h2>
    <p>Open this URL directly to see raw response:</p>
    <pre><a href="/api/images/${imageName}" target="_blank">/api/images/${imageName}</a></pre>
  </body>
  </html>
  `;
  
  res.send(html);
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
