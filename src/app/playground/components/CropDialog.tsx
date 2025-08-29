'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface CropDialogProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (croppedImageUrl: string, newWidth: number, newHeight: number) => void;
}

export default function CropDialog({ imageUrl, isOpen, onClose, onApply }: CropDialogProps) {
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCropBox, setInitialCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen && imageRef.current) {
      const img = new Image();
      // Set crossOrigin before setting src to avoid tainted canvas
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        // Set initial crop box to 80% of image
        const initialWidth = img.width * 0.8;
        const initialHeight = img.height * 0.8;
        setCropBox({
          x: img.width * 0.1,
          y: img.height * 0.1,
          width: initialWidth,
          height: initialHeight
        });
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cropBox]);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCropBox({ ...cropBox });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      let newX = initialCropBox.x;
      let newY = initialCropBox.y;
      let newWidth = initialCropBox.width;
      let newHeight = initialCropBox.height;
      
      const containerRect = containerRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();
      
      if (!containerRect || !imageRect) return;
      
      const scaleX = imageSize.width / imageRect.width;
      const scaleY = imageSize.height / imageRect.height;
      
      switch(dragHandle) {
        case 'move':
          newX = Math.max(0, Math.min(imageSize.width - initialCropBox.width, initialCropBox.x + deltaX * scaleX));
          newY = Math.max(0, Math.min(imageSize.height - initialCropBox.height, initialCropBox.y + deltaY * scaleY));
          break;
        case 'nw':
          const nwDelta = Math.min(deltaX * scaleX, deltaY * scaleY);
          newX = Math.max(0, initialCropBox.x + nwDelta);
          newY = Math.max(0, initialCropBox.y + nwDelta);
          newWidth = initialCropBox.width - nwDelta;
          newHeight = initialCropBox.height - nwDelta;
          break;
        case 'ne':
          const neDelta = Math.min(deltaX * scaleX, -deltaY * scaleY);
          newY = Math.max(0, initialCropBox.y - neDelta);
          newWidth = Math.max(50, initialCropBox.width + neDelta);
          newHeight = Math.max(50, initialCropBox.height + neDelta);
          break;
        case 'sw':
          const swDelta = Math.min(-deltaX * scaleX, deltaY * scaleY);
          newX = Math.max(0, initialCropBox.x - swDelta);
          newWidth = Math.max(50, initialCropBox.width + swDelta);
          newHeight = Math.max(50, initialCropBox.height + swDelta);
          break;
        case 'se':
          const seDelta = Math.min(deltaX * scaleX, deltaY * scaleY);
          newWidth = Math.max(50, initialCropBox.width + seDelta);
          newHeight = Math.max(50, initialCropBox.height + seDelta);
          break;
      }
      
      // Keep aspect ratio for corner handles
      if (dragHandle !== 'move') {
        const aspectRatio = initialCropBox.width / initialCropBox.height;
        if (newWidth / newHeight > aspectRatio) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      
      setCropBox({
        x: newX,
        y: newY,
        width: Math.min(newWidth, imageSize.width - newX),
        height: Math.min(newHeight, imageSize.height - newY)
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialCropBox, dragHandle, imageSize]);

  const handleApplyCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropBox.width;
    canvas.height = cropBox.height;

    const img = new Image();
    // Set crossOrigin before setting src to avoid tainted canvas
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        ctx.drawImage(
          img,
          cropBox.x,
          cropBox.y,
          cropBox.width,
          cropBox.height,
          0,
          0,
          cropBox.width,
          cropBox.height
        );

        // For base64 images, we can use the cropped data directly
        if (imageUrl.startsWith('data:')) {
          const croppedImageUrl = canvas.toDataURL('image/png');
          onApply(croppedImageUrl, cropBox.width, cropBox.height);
          onClose();
        } else {
          // For external URLs, we'll still try to get the data URL
          // but if it fails due to CORS, we'll use the original URL with crop info
          try {
            const croppedImageUrl = canvas.toDataURL('image/png');
            onApply(croppedImageUrl, cropBox.width, cropBox.height);
            onClose();
          } catch {
            // You could pass crop coordinates back instead
            onApply(imageUrl, cropBox.width, cropBox.height);
            onClose();
          }
        }
      } catch (error) {
        console.error('Error cropping image:', error);
        // Fallback: return original image
        onApply(imageUrl, cropBox.width, cropBox.height);
        onClose();
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for cropping');
      onClose();
    };
    
    img.src = imageUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Crop Image</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Crop Area */}
        <div 
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
          style={{ maxWidth: '100%', maxHeight: '60vh' }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop"
            crossOrigin="anonymous"
            className="max-w-full max-h-[60vh] mx-auto block"
            style={{ display: 'block' }}
          />
          
          {/* Dark overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <mask id="cropMask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect 
                  x={`${(cropBox.x / imageSize.width) * 100}%`}
                  y={`${(cropBox.y / imageSize.height) * 100}%`}
                  width={`${(cropBox.width / imageSize.width) * 100}%`}
                  height={`${(cropBox.height / imageSize.height) * 100}%`}
                  fill="black"
                />
              </mask>
            </defs>
            <rect 
              x="0" 
              y="0" 
              width="100%" 
              height="100%" 
              fill="black" 
              fillOpacity="0.5" 
              mask="url(#cropMask)"
            />
          </svg>
          
          {/* Crop box */}
          <div
            className="absolute border-2 border-[#8553FF] cursor-move shadow-lg"
            style={{
              left: `${(cropBox.x / imageSize.width) * 100}%`,
              top: `${(cropBox.y / imageSize.height) * 100}%`,
              width: `${(cropBox.width / imageSize.width) * 100}%`,
              height: `${(cropBox.height / imageSize.height) * 100}%`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-[#8553FF]/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-[#8553FF]/30" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-[#8553FF]/30" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-[#8553FF]/30" />
            </div>
            
            {/* Corner handles */}
            <div
              className="absolute -top-2 -left-2 w-4 h-4 bg-[#8553FF] border-2 border-white rounded-full cursor-nw-resize shadow-md"
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              className="absolute -top-2 -right-2 w-4 h-4 bg-[#8553FF] border-2 border-white rounded-full cursor-ne-resize shadow-md"
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#8553FF] border-2 border-white rounded-full cursor-sw-resize shadow-md"
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#8553FF] border-2 border-white rounded-full cursor-se-resize shadow-md"
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
            
            {/* Size indicator */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {Math.round(cropBox.width)} × {Math.round(cropBox.height)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Drag</kbd>
              to adjust
              <span className="mx-1">•</span>
              <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd>
              to apply
              <span className="mx-1">•</span>
              <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Esc</kbd>
              to cancel
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center whitespace-nowrap rounded border font-medium transition-all disabled:pointer-events-none disabled:opacity-50 gap-1.5 bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100 h-10 px-4"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCrop}
              className="inline-flex items-center justify-center whitespace-nowrap rounded border font-medium transition-all disabled:pointer-events-none disabled:opacity-50 gap-1.5 bg-[#8553FF] text-white hover:bg-[#7642FF] border-[#7642FF] h-10 px-4"
            >
              <Check className="h-5 w-5" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}