/**
 * AdminObjectStoragePage.tsx
 * 
 * Changes:
 * - Created a new admin page for object storage management
 * - Implemented file and folder view with hierarchical structure
 * - Added ability to view, delete, and organize images
 * - Added image preview functionality
 * - Added folder navigation and breadcrumb trail
 */

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listStorageImages, deleteStorageImage } from "@/lib/data";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trash2,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  FileIcon,
  ChevronRight,
  Home,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getFilenameFromObjectKey } from "@/lib/object-storage";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Type for image object
interface StorageImage {
  key: string;
  url: string;
  size?: number;
  type?: string;
  source: 'database' | 'object-storage' | 'external';
}

// Type for folder structure
interface FolderItem {
  id?: string;
  name: string;
  path: string;
  isFolder?: boolean;
  type?: 'folder' | 'file';
  children?: FolderItem[];
  url?: string;
  size?: number;
  fileType?: string;
  source?: string;
}

// Constants
const BUCKET_ID = 'replit-objstore-8f3f1a22-cdd2-4088-9bff-f7887f5d323d';

// Function to organize images into folder structure
export function organizeIntoFolders(images: StorageImage[]): FolderItem[] {
  console.log("Organizing images into folders:", images.length);
  
  // Extract root folder items
  const rootItems: FolderItem[] = [];
  
  // Process each image by its file path
  images.forEach(image => {
    // Ensure the key is a valid string
    if (!image.key || typeof image.key !== 'string') {
      console.warn("Invalid image key:", image);
      return;
    }
    
    // Clean up the key for display
    const key = image.key;
    
    // Create a folder item for this file
    const fileItem: FolderItem = {
      id: key,
      name: key.split('/').pop() || key,
      path: key,
      isFolder: false,
      type: 'file',
      url: `/api/images/${key}`,
      size: image.size,
      fileType: 'image',
      source: image.source
    };
    
    rootItems.push(fileItem);
  });
  
  console.log("Organized items:", rootItems.length);
  return rootItems;
}

// Helper function to get file type from name
const getFileTypeFromName = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  if (imageExtensions.includes(extension)) {
    return 'image';
  }
  
  return extension;
};

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined) return 'Unknown size';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Image Preview Component
function ImagePreview({ imagePath }: { imagePath: string }) {
  // Simplest possible implementation - direct image element
  return (
    <div className="flex flex-col items-center p-4">
      <div className="text-xs text-gray-500 mb-2">
        Image path: {imagePath}
      </div>
      
      <img
        src={`/api/images/${imagePath}`}
        alt={`Image ${imagePath}`}
        className="max-w-full h-auto border rounded"
        onError={(e) => {
          console.error(`Failed to load image: ${imagePath}`);
          // Set a fallback image or message on error
          e.currentTarget.insertAdjacentHTML('afterend', '<div class="text-red-500 mt-2">Image failed to load</div>');
        }}
      />
    </div>
  );
}

// Main component
const AdminObjectStoragePage = () => {
  // Updated: Added debug state to help diagnose image rendering issues
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<FolderItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<FolderItem | null>(null);
  const [testResults, setTestResults] = useState<{url: string, status: number, unencodedStatus?: number} | null>(null);
  const [isStorageConfigValid, setIsStorageConfigValid] = useState<boolean | null>(null);
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<{valid: boolean; message: string} | null>(null);
  
  // New: Debug state for viewing raw API data
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [rawApiImages, setRawApiImages] = useState<StorageImage[]>([]);
  
  // Add this state near the other state declarations
  const [debugTestPath, setDebugTestPath] = useState('Test.png');
  const [debugResult, setDebugResult] = useState<any>(null);
  
  // At the top where other states are defined
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Function to check storage configuration
  const checkStorageConfig = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/storage/check-config');
      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error checking storage configuration:', error);
      return false;
    }
  };
  
  // Function to test image URL directly
  const testImageUrl = async (url: string | undefined, path?: string) => {
    if (!url) {
      toast({
        title: "Error",
        description: "No URL provided",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Test the encoded URL
      const encodedResponse = await fetch(url, { method: 'HEAD' });
      
      // If path is provided, also test the unencoded URL
      let unencodedResponse = null;
      if (path) {
        const unencodedUrl = `/api/images/${path}`;
        unencodedResponse = await fetch(unencodedUrl, { method: 'HEAD' });
      }
      
      setTestResults({
        url,
        status: encodedResponse.status,
        unencodedStatus: unencodedResponse?.status
      });
      
      toast({
        title: `Image URL Test`,
        description: `Encoded: ${encodedResponse.status}${unencodedResponse ? `, Unencoded: ${unencodedResponse.status}` : ''}`,
        variant: encodedResponse.ok || (unencodedResponse && unencodedResponse.ok) ? "default" : "destructive",
      });
      
      return encodedResponse.ok || (unencodedResponse && unencodedResponse.ok);
    } catch (error) {
      console.error('Error testing image URL:', error);
      setTestResults({
        url,
        status: 0
      });
      
      toast({
        title: "Error Testing URL",
        description: String(error),
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  // Fetch all images from storage
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['storageImages'],
    queryFn: listStorageImages
  });
  
  // Store raw API data for debugging when data changes
  useEffect(() => {
    if (data?.images) {
      setRawApiImages(data.images);
      console.log('Updated raw API images data:', data.images);
    }
  }, [data?.images]);
  
  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStorageImage,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['storageImages'] });
      setIsDeleteDialogOpen(false);
      setImageToDelete(null);
      setSelectedImage(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete image: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Organize images into folder structure
  const folderStructure = useMemo(() => {
    if (!data?.images) return [];
    
    // Log the raw data for debugging
    console.log('Raw image data from API:', data.images);
    
    return organizeIntoFolders(data.images);
  }, [data?.images]);
  
  // Get current folder contents based on path
  const currentFolderContents = useMemo(() => {
    let current = folderStructure;
    
    // Navigate to current path
    for (const pathPart of currentPath) {
      const folder = current.find(item => item.name === pathPart && item.type === 'folder');
      if (folder && folder.children) {
        current = folder.children;
      } else {
        return [];
      }
    }
    
    // Apply search filter if needed
    if (searchQuery) {
      return current.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return current;
  }, [folderStructure, currentPath, searchQuery]);
  
  // Handle folder click
  const handleFolderClick = (folder: FolderItem) => {
    setCurrentPath([...currentPath, folder.name]);
    setSelectedImage(null);
  };
  
  // Handle file click
  const handleFileClick = (file: FolderItem) => {
    setSelectedImage(file);
  };
  
  // Handle navigation to specific path
  const navigateToPath = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedImage(null);
  };
  
  // Handle going to root
  const goToRoot = () => {
    setCurrentPath([]);
    setSelectedImage(null);
  };
  
  // Handle delete image
  const handleDeleteImage = (image: FolderItem) => {
    setImageToDelete(image);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete image
  const confirmDeleteImage = () => {
    if (imageToDelete) {
      deleteMutation.mutate(imageToDelete.path);
    }
  };
  
  // Handle test storage configuration
  const handleTestStorageConfig = async () => {
    setIsTestingConfig(true);
    try {
      const isValid = await checkStorageConfig();
      setConfigStatus({valid: isValid, message: isValid ? "Storage configured correctly" : "Storage configuration issue"});
    } catch (error) {
      console.error('Error testing storage configuration:', error);
      setConfigStatus({valid: false, message: String(error)});
    } finally {
      setIsTestingConfig(false);
    }
  };
  
  // Add this function near the other handler functions
  const handleDebugTest = async () => {
    try {
      console.log(`Testing image path: ${debugTestPath}`);
      
      // Properly encode the key
      const encodedKey = encodeURIComponent(debugTestPath);
      console.log(`Encoded key: ${encodedKey}`);
      
      // Use a try-catch specifically for the network request
      let response;
      try {
        console.log(`Sending request to: /api/debug/image-test?key=${encodedKey}`);
        response = await fetch(`/api/debug/image-test?key=${encodedKey}`);
      } catch (fetchError: any) {
        console.error("Fetch operation failed:", fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      console.log("Debug API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server returned error:", response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Parse the response
      let data;
      try {
        data = await response.json();
        console.log("Debug test result:", data);
      } catch (parseError: any) {
        console.error("Failed to parse response:", parseError);
        const rawText = await response.text();
        console.log("Raw response:", rawText);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }
      
      setDebugResult(data);
      
      toast({
        title: data.success ? "Image found" : "Image not found",
        description: data.success 
          ? `Found image with size: ${data.dataSize} bytes` 
          : `Error: ${data.error || "Image not found"}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Debug test error:", error);
      
      // Set a user-friendly error result
      setDebugResult({ 
        error: String(error),
        requestedKey: debugTestPath
      });
      
      toast({
        title: "Test Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };
  
  // Add this function near the other handler functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // Add more debug info
    console.log("Starting file upload...");
    console.log("File details:", {
      name: uploadFile.name,
      type: uploadFile.type,
      size: uploadFile.size,
    });
    
    try {
      setIsUploading(true);
      
      // Create a simplified form with just the file and minimal data
      const formData = new FormData();
      
      // Log the FormData creation
      console.log("Creating FormData object");
      
      // Add the file with explicit name and filename
      const safeFileName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      console.log(`Adding file to FormData as 'file' with name: ${safeFileName}`);
      formData.append('file', uploadFile, safeFileName);
      
      // Check FormData after appending
      console.log("FormData created:", formData);
      
      // Use a try-catch specifically for the network request
      console.log("Sending fetch request to /api/debug/upload");
      
      let response;
      try {
        response = await fetch('/api/debug/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (fetchError: any) {
        console.error("Fetch operation failed:", fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      console.log("Fetch request completed with status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server returned error:", response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      // Parse the response
      let result;
      try {
        result = await response.json();
        console.log("Response parsed successfully:", result);
      } catch (parseError: any) {
        console.error("Failed to parse response:", parseError);
        const rawText = await response.text();
        console.log("Raw response:", rawText);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }
      
      setUploadResult(result);
      
      // Update debug test path to the newly uploaded file
      if (result.success) {
        setDebugTestPath(result.filename);
        
        toast({
          title: "Upload successful",
          description: `Uploaded ${result.filename} (${formatFileSize(result.size)})`,
        });
        
        // Refresh the image list
        refetch();
      } else {
        throw new Error(result.message || "Upload failed without a specific error message");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Error",
        description: String(error),
        variant: "destructive",
      });
      
      // Set a basic error result for display
      setUploadResult({
        success: false,
        error: String(error)
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Object Storage Explorer</h1>
            <p className="text-muted-foreground">
              Explore and manage images in object storage
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestStorageConfig} disabled={isTestingConfig}>
              {isTestingConfig ? 'Testing...' : 'Test Storage Config'}
            </Button>
            <Button onClick={() => refetch()}>
              Refresh
            </Button>
            
            {/* Add debug toggle button */}
            <Button 
              variant="outline"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </Button>
          </div>
        </div>
        
        {/* Debug information panel */}
        {showDebugInfo && (
          <div className="mb-6 border rounded-md p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
            <p className="text-sm text-gray-500 mb-4">This panel shows raw API response data to help diagnose image rendering issues.</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium">API Response Summary</h3>
                <p className="text-sm">Total images: {rawApiImages.length}</p>
                <p className="text-sm">
                  Sources: {
                    Object.entries(
                      rawApiImages.reduce((acc, img) => {
                        acc[img.source] = (acc[img.source] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([source, count]) => `${source}: ${count}`).join(', ')
                  }
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-medium">Raw Image Data (First 3)</h3>
                <div className="max-h-60 overflow-y-auto mt-2">
                  {rawApiImages.slice(0, 3).map((img, index) => (
                    <div key={index} className="p-2 border-b text-xs font-mono">
                      <div><strong>Key:</strong> "{img.key}"</div>
                      <div><strong>URL:</strong> "{img.url}"</div>
                      <div><strong>Source:</strong> {img.source}</div>
                      <div><strong>Size:</strong> {img.size}</div>
                      <div><strong>Type:</strong> {img.type}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium">Image Keys Analysis</h3>
                <div className="text-xs space-y-1 mt-2">
                  <p><strong>Keys with folder structure:</strong> {rawApiImages.filter(img => img.key.includes('/')).length}</p>
                  <p><strong>Keys with 'images/' prefix:</strong> {rawApiImages.filter(img => img.key.startsWith('images/')).length}</p>
                  <p><strong>Keys sample patterns:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    {Array.from(new Set(rawApiImages.map(img => {
                      const parts = img.key.split('/');
                      return parts.length > 1 ? `${parts[0]}/.../${parts[parts.length - 1]}` : img.key;
                    })))
                      .slice(0, 5)
                      .map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Storage Configuration Info */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Storage Configuration</h2>
          <p className="text-sm mb-2">
            <span className="font-medium">Bucket ID:</span> {BUCKET_ID}
          </p>
          <div className="flex space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTestStorageConfig}
              disabled={isTestingConfig}
            >
              {isTestingConfig ? 'Testing...' : 'Test Storage Config'}
            </Button>
            
            {configStatus && (
              <Alert variant={configStatus.valid ? "default" : "destructive"} className="h-9 py-1 px-3">
                <AlertTitle className="text-xs">
                  {configStatus.valid ? 'Storage configured correctly' : 'Storage configuration issue'}
                </AlertTitle>
              </Alert>
            )}
          </div>
        </div>
        
        {isStorageConfigValid === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Storage Configuration Error</AlertTitle>
            <AlertDescription>
              The object storage configuration is invalid. Please check your Replit Object Storage setup.
            </AlertDescription>
          </Alert>
        )}
        
        {isStorageConfigValid === true && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Storage Configuration Valid</AlertTitle>
            <AlertDescription>
              The object storage is properly configured and working.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.counts?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Object Storage Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.counts?.objectStorage || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium truncate">
                {currentPath.length > 0 ? `/${currentPath.join('/')}` : '/'}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and navigation */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={goToRoot}>
                    <Home className="h-4 w-4 mr-1" />
                    Root
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentPath.map((path, index) => {
                  return [
                    <BreadcrumbSeparator key={`sep-${index}`}>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>,
                    <BreadcrumbItem key={`item-${index}`}>
                      <BreadcrumbLink onClick={() => navigateToPath(index)}>
                        {path}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  ];
                }).flat()}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* File browser */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Files and Folders</CardTitle>
              <CardDescription>
                Browse and manage your object storage files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading...</p>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">Error loading files: {String(error)}</p>
                </div>
              ) : currentFolderContents.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No files or folders found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    {currentFolderContents
                      .sort((a, b) => {
                        // Folders first, then files
                        if (a.type !== b.type) {
                          return a.type === 'folder' ? -1 : 1;
                        }
                        // Alphabetical within each type
                        return a.name.localeCompare(b.name);
                      })
                      .map((item, index) => (
                        <div 
                          key={index}
                          className={`flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer ${
                            selectedImage?.path === item.path ? 'bg-gray-100' : ''
                          }`}
                          onClick={() => item.type === 'folder' ? handleFolderClick(item) : handleFileClick(item)}
                        >
                          {item.type === 'folder' ? (
                            <Folder className="h-5 w-5 mr-2 text-blue-500" />
                          ) : item.fileType === 'image' ? (
                            <ImageIcon className="h-5 w-5 mr-2 text-green-500" />
                          ) : (
                            <FileIcon className="h-5 w-5 mr-2 text-gray-500" />
                          )}
                          <div className="flex-grow">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.size && (
                              <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                            )}
                          </div>
                          {item.type === 'file' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(item);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Preview panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {selectedImage ? selectedImage.name : 'Select a file to preview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedImage ? (
                selectedImage.fileType === 'image' ? (
                  <ImagePreview imagePath={selectedImage.path} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">{selectedImage.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedImage.size)}</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p>No file selected</p>
                </div>
              )}
              
              {/* Debug information */}
              {testResults && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
                  <h4 className="font-medium mb-1">Debug Information</h4>
                  <p><span className="font-medium">URL:</span> {testResults.url}</p>
                  <p><span className="font-medium">Status:</span> {testResults.status}</p>
                  <p><span className="font-medium">Unencoded Status:</span> {testResults.unencodedStatus}</p>
                  <p><span className="font-medium">Time:</span> {new Date().toLocaleTimeString()}</p>
                </div>
              )}
            </CardContent>
            {selectedImage && (
              <CardFooter className="flex justify-between flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedImage.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedImage.url && testImageUrl(selectedImage.url, selectedImage.path)}
                >
                  Test URLs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const unencodedUrl = `/api/images/${selectedImage.path}`;
                    window.open(unencodedUrl, '_blank');
                  }}
                >
                  Try Unencoded
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteImage(selectedImage)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {imageToDelete && (
              <div className="flex items-center">
                {imageToDelete.fileType === 'image' ? (
                  <ImageIcon className="h-8 w-8 mr-4 text-green-500" />
                ) : (
                  <FileIcon className="h-8 w-8 mr-4 text-gray-500" />
                )}
                <div>
                  <p className="font-medium">{imageToDelete.name}</p>
                  <p className="text-sm text-gray-500">{imageToDelete.path}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteImage}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showDebugInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Image Debug Tester</CardTitle>
            <CardDescription>Test image loading directly from storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input 
                value={debugTestPath} 
                onChange={(e) => setDebugTestPath(e.target.value)}
                placeholder="Enter image path to test"
                className="flex-grow"
              />
              <Button onClick={handleDebugTest}>Test</Button>
            </div>
            
            {debugResult && (
              <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="font-semibold">Test Results:</h3>
                <div className="mt-2 text-sm space-y-1">
                  <p>Requested Key: <code>{debugResult.requestedKey}</code></p>
                  <p>Success: <span className={debugResult.success ? "text-green-600" : "text-red-600"}>{String(debugResult.success)}</span></p>
                  {debugResult.error && <p>Error: <span className="text-red-600">{debugResult.error}</span></p>}
                  {debugResult.success && <p>Data Size: {debugResult.dataSize} bytes</p>}
                  
                  <div className="mt-4">
                    <h4 className="font-medium">Available Objects: {debugResult.availableObjectCount}</h4>
                    <div className="mt-1">
                      <h5 className="text-xs font-medium">Sample Objects:</h5>
                      <ul className="list-disc list-inside text-xs ml-2">
                        {debugResult.sampleObjects?.map((obj: string, i: number) => (
                          <li key={i}><code>{obj}</code></li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-2">
                      <h5 className="text-xs font-medium">Key Exists in Storage: {String(debugResult.keyExists)}</h5>
                    </div>
                    
                    {debugResult.similarKeys?.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium">Similar Keys:</h5>
                        <ul className="list-disc list-inside text-xs ml-2">
                          {debugResult.similarKeys.map((key: string, i: number) => (
                            <li key={i}><code>{key}</code></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Test File Upload</h3>
              <div className="flex gap-2 items-center mb-4">
                <Input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              
              {uploadResult && uploadResult.success && (
                <div className="p-3 border rounded-md bg-green-50 text-green-800 mb-4">
                  <h4 className="font-semibold">Upload Successful</h4>
                  <p>Filename: {uploadResult.filename}</p>
                  <p>Size: {formatFileSize(uploadResult.size)}</p>
                  <div className="mt-2">
                    <img 
                      src={uploadResult.url} 
                      alt={uploadResult.filename}
                      className="max-h-32 max-w-full"
                      onError={() => console.error(`Failed to load uploaded image: ${uploadResult.url}`)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">API Testing</h3>
              <div className="p-4 bg-gray-100 rounded-md">
                <h4 className="text-sm font-medium mb-2">Direct API Commands:</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-700 mb-1">Test image fetch with curl:</p>
                    <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
                      curl -v "http://localhost:5000/api/images/{debugTestPath}"
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 mb-1">List all objects in storage:</p>
                    <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
                      curl "http://localhost:5000/api/images"
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 mb-1">Debug endpoint:</p>
                    <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
                      curl "http://localhost:5000/api/debug/image-test?key={encodeURIComponent(debugTestPath)}"
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminObjectStoragePage; 