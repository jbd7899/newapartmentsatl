import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { GalleryImage } from './PropertyGallery';
import { getImageUrl } from '@/lib/image-utils';

interface UnitGalleryProps {
  images: GalleryImage[];
  onClose: () => void;
  unitNumber: string;
  propertyName: string;
}

// Define types for our gallery
interface GalleryRow {
  images: GalleryImage[];
  pattern: number[];
}

const UnitGallery: React.FC<UnitGalleryProps> = ({ 
  images, 
  onClose, 
  unitNumber,
  propertyName 
}) => {
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Handle escape key press to close the gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalImage) {
          setModalImage(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalImage, onClose]);

  // Create a balanced row layout for the gallery
  const createBalancedRows = (galleryImages: GalleryImage[]): GalleryRow[] => {
    // Define possible row patterns
    const patterns: number[][] = [
      [1, 1, 1],  // Three equal columns
      [1, 2],     // Small, large
      [2, 1]      // Large, small
    ];

    const rows: GalleryRow[] = [];
    let remainingImages = [...galleryImages];
    let lastUsedPattern: number[] | null = null;
    
    while (remainingImages.length > 0) {
      // Choose a random pattern, avoiding repeating the same pattern
      const availablePatterns = patterns.filter(pattern => 
        !lastUsedPattern || JSON.stringify(pattern) !== JSON.stringify(lastUsedPattern)
      );
      
      const patternIndex = Math.floor(Math.random() * availablePatterns.length);
      const selectedPattern = availablePatterns[patternIndex];
      lastUsedPattern = selectedPattern;
      
      // Create a row with the chosen pattern
      const rowImages: GalleryImage[] = [];
      const patternSum = selectedPattern.reduce((sum, val) => sum + val, 0);
      const imagesToTake = Math.min(patternSum, remainingImages.length);
      
      for (let i = 0; i < imagesToTake; i++) {
        if (remainingImages.length > 0) {
          const image = remainingImages.shift();
          if (image) rowImages.push(image);
        }
      }
      
      if (rowImages.length > 0) {
        // Adjust pattern if we don't have enough images
        const adjustedPattern = selectedPattern.slice(
          0, 
          Math.ceil(rowImages.length / (patternSum / selectedPattern.length))
        );
        rows.push({ images: rowImages, pattern: adjustedPattern });
      }
    }
    
    return rows;
  };

  const rows = createBalancedRows(images);

  // Function to get optimized image URL for different sizes
  const getOptimizedImageUrl = (originalUrl: string, width: number): string => {
    // Handle object storage URLs using our utility function
    return getImageUrl(originalUrl);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="relative">
        {/* Back Button */}
        <button 
          className="fixed bottom-8 left-8 z-20 px-4 py-2 bg-black/80 text-white rounded-full flex items-center gap-2 hover:bg-black/90 transition-colors"
          onClick={onClose}
        >
          <ArrowLeft size={18} />
          Back to Unit Details
        </button>

        {/* Gallery Content */}
        <div className="gallery max-w-7xl mx-auto px-4 py-20">
          <h1 className="text-3xl font-bold text-white mb-2">{propertyName}</h1>
          <h2 className="text-xl text-white/80 mb-8">Unit {unitNumber} Gallery</h2>
          
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="gallery-row flex gap-4 mb-4 flex-wrap md:flex-nowrap">
              {row.images.map((image, imgIndex) => {
                const flexValue = row.pattern[imgIndex % row.pattern.length] || 1;
                return (
                  <div 
                    key={`${rowIndex}-${imgIndex}`} 
                    className={`gallery-item flex-${flexValue} mb-4 md:mb-0 w-full md:w-auto overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.02]`}
                    style={{ flex: flexValue }}
                    onClick={() => setModalImage(image.objectKey || image.url)}
                  >
                    <img 
                      src={getOptimizedImageUrl(image.objectKey || image.url, flexValue === 1 ? 400 : 800)} 
                      alt={image.alt} 
                      className="w-full h-full object-cover transition-transform hover:scale-[1.05]"
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Modal for Full Image View */}
        {modalImage && (
          <div 
            className="fixed inset-0 bg-black/95 z-30 flex items-center justify-center"
            onClick={() => setModalImage(null)}
          >
            <button 
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setModalImage(null);
              }}
            >
              <X size={28} />
            </button>
            <img 
              src={getOptimizedImageUrl(modalImage, 1200)} 
              alt="Full size view" 
              className="max-w-[90%] max-h-[90vh] object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitGallery;