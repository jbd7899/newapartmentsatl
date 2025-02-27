import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize S3 client using Replit's object storage credentials
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.REPLIT_ACCOUNT_ID}.id.repl.co`,
  credentials: {
    accessKeyId: process.env.OBJECT_STORAGE_KEY || '',
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET || ''
  }
});

const BUCKET_NAME = process.env.OBJECT_STORAGE_BUCKET || 'property-images';

// Function to generate a unique filename to avoid collisions
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${originalFilename}-${timestamp}`).digest('hex');
  const ext = path.extname(originalFilename);
  return `${hash}${ext}`;
}

// Upload a file to S3 storage
export async function uploadFile(fileBuffer: Buffer, originalFilename: string, contentType: string): Promise<string> {
  const uniqueFilename = generateUniqueFilename(originalFilename);
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: uniqueFilename,
    Body: fileBuffer,
    ContentType: contentType
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return uniqueFilename;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

// Delete a file from S3 storage
export async function deleteFile(filename: string): Promise<void> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: filename
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
}

// Generate a signed URL for temporary access to a file
export async function getSignedFileUrl(filename: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
}

// Extract the filename from a full URL
export function getFilenameFromUrl(url: string): string {
  const urlObj = new URL(url);
  return path.basename(urlObj.pathname);
}

// Check if the storage service is properly configured
export async function checkStorageConfig(): Promise<boolean> {
  if (!process.env.OBJECT_STORAGE_KEY || !process.env.OBJECT_STORAGE_SECRET) {
    console.error("Object storage credentials not configured");
    return false;
  }
  
  try {
    // Try listing some objects to check connectivity
    await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'test-connection'
    }));
    return true;
  } catch (error: any) {
    // 404 is expected for a non-existent file, which still confirms connectivity
    if (error.$metadata?.httpStatusCode === 404) {
      return true;
    }
    console.error("Failed to connect to object storage:", error);
    return false;
  }
}