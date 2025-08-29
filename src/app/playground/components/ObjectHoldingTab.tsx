'use client';

import { useState, useRef } from 'react';
import { Package, User, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import { LogoIcon } from './LogoIcon';
import { compressImage, getImageSizeInMB, compressImageToSize } from '../utils/imageCompression';
import { usePlaygroundContext } from '../context/PlaygroundContext';
// FAL API calls are handled through server-side routes for security

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

const ObjectHoldingTab = () => {
  const { objectHoldingState, setObjectHoldingState, rateLimits, setRateLimits } = usePlaygroundContext();
  
  // Use state from context
  const { 
    personImage, 
    objectImage, 
    currentImage, 
    beforeImage, 
    generatedImages, 
    generatedPrompt,
    personPrompt,
    objectPrompt
  } = objectHoldingState;
  
  // Local state for UI-only states
  const [showBefore, setShowBefore] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPerson, setIsGeneratingPerson] = useState(false);
  const [isGeneratingObject, setIsGeneratingObject] = useState(false);
  
  // Helper functions to update context
  const setPersonImage = (image: string | null) => {
    setObjectHoldingState(prev => ({ ...prev, personImage: image }));
  };
  const setObjectImage = (image: string | null) => {
    setObjectHoldingState(prev => ({ ...prev, objectImage: image }));
  };
  const setCurrentImage = (image: string | null) => {
    setObjectHoldingState(prev => ({ ...prev, currentImage: image }));
  };
  const setBeforeImage = (image: string | null) => {
    setObjectHoldingState(prev => ({ ...prev, beforeImage: image }));
  };
  const setGeneratedImages = (images: GeneratedImage[] | ((prev: GeneratedImage[]) => GeneratedImage[])) => {
    if (typeof images === 'function') {
      setObjectHoldingState(prev => ({ ...prev, generatedImages: images(prev.generatedImages) }));
    } else {
      setObjectHoldingState(prev => ({ ...prev, generatedImages: images }));
    }
  };
  const setGeneratedPrompt = (prompt: string) => {
    setObjectHoldingState(prev => ({ ...prev, generatedPrompt: prompt }));
  };
  const setPersonPrompt = (prompt: string) => {
    setObjectHoldingState(prev => ({ ...prev, personPrompt: prompt }));
  };
  const setObjectPrompt = (prompt: string) => {
    setObjectHoldingState(prev => ({ ...prev, objectPrompt: prompt }));
  };
  const personInputRef = useRef<HTMLInputElement>(null);
  const objectInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, type: 'person' | 'object') => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let imageUrl = e.target?.result as string;
        
        // Compress image to stay under 4MB limit
        const sizeInMB = getImageSizeInMB(imageUrl);
        if (sizeInMB > 3.8) {  // Use 3.8MB as target to leave some buffer
          try {
            imageUrl = await compressImageToSize(imageUrl, 3.8);
          } catch {
            // Fallback to aggressive compression
            try {
              imageUrl = await compressImage(imageUrl, 800, 800, 0.5);
            } catch {
            }
          }
        }
        
        if (type === 'person') {
          setPersonImage(imageUrl);
        } else {
          setObjectImage(imageUrl);
        }
        // Reset generated content when new images are uploaded
        setGeneratedPrompt('');
        setCurrentImage(null);
        setBeforeImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, 'person');
  };

  const handleObjectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, 'object');
  };

  const handlePersonDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file, 'person');
  };

  const handleObjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file, 'object');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const generatePersonImage = async () => {
    if (!personPrompt.trim()) return;
    
    setIsGeneratingPerson(true);
    
    try {

      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "fal-ai/gemini-25-flash-image",
          input: {
            prompt: personPrompt,
            num_images: 1
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate person image');
      }
      
      const result = await response.json();

      
      if (result.data?.images?.[0]) {
        const imageUrl = result.data.images[0].url || result.data.images[0];
        setPersonImage(imageUrl);
        setGeneratedPrompt('');
        setCurrentImage(null);
        setBeforeImage(null);
      }
    } catch {
      alert('Failed to generate person image. Please try again.');
    } finally {
      setIsGeneratingPerson(false);
    }
  };

  const generateObjectImage = async () => {
    if (!objectPrompt.trim()) return;
    
    setIsGeneratingObject(true);
    
    try {

      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "fal-ai/gemini-25-flash-image",
          input: {
            prompt: objectPrompt,
            num_images: 1
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate object image');
      }
      
      const result = await response.json();

      
      if (result.data?.images?.[0]) {
        const imageUrl = result.data.images[0].url || result.data.images[0];
        setObjectImage(imageUrl);
        setGeneratedPrompt('');
        setCurrentImage(null);
        setBeforeImage(null);
      }
    } catch {
      alert('Failed to generate object image. Please try again.');
    } finally {
      setIsGeneratingObject(false);
    }
  };

  const analyzeAndGenerate = async () => {
    if (!personImage || !objectImage) {
      alert('Please upload both person and object images first!');
      return;
    }

    // Get custom API key from localStorage
    const customApiKey = localStorage.getItem('fal_api_key');
    
    setIsAnalyzing(true);
    
    try {
      // Step 1: First, upload both images to FAL storage
      
      const uploadPersonResponse = await fetch('/api/fal-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: personImage })
      });
      
      const uploadObjectResponse = await fetch('/api/fal-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: objectImage })
      });

      if (!uploadPersonResponse.ok || !uploadObjectResponse.ok) {
        throw new Error('Failed to upload images');
      }

      const personUpload = await uploadPersonResponse.json();
      const objectUpload = await uploadObjectResponse.json();


      // Step 2: Use vision LLM to analyze the images and generate prompt
      const analyzeResponse = await fetch('/api/merge-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageUrl: personImage, // Use original base64 data URL
          objectImageUrl: objectImage, // Use original base64 data URL
          personFalUrl: personUpload.url, // Keep FAL URL for reference
          objectFalUrl: objectUpload.url  // Keep FAL URL for reference
        })
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Failed to analyze images');
      }

      const analyzeResult = await analyzeResponse.json();
      const prompt = analyzeResult.prompt || 'Person holding the object in a natural pose';
      
      setGeneratedPrompt(prompt);

      // Step 3: Immediately generate the image using the prompt
      setIsGenerating(true);
      
      const generateResponse = await fetch('/api/fal-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "fal-ai/gemini-25-flash-image/edit",
          prompt: prompt,
          image_url: personImage, // Primary image (person)
          object_image_url: objectImage, // Secondary image (object)
          num_images: 1,
          ...(customApiKey && { customApiKey })
        })
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        if (generateResponse.status === 413) {
          throw new Error(`Image size too large: ${errorData.error}. ${errorData.tip || ''}`);
        }
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const generateResult = await generateResponse.json();
      
      if (generateResult?.images?.[0]) {
        const generatedUrl = generateResult.images[0].url || generateResult.images[0];
        setBeforeImage(currentImage);
        setCurrentImage(generatedUrl);
        setShowBefore(false);
        
        const newGenerated: GeneratedImage = {
          url: generatedUrl,
          prompt: prompt,
          timestamp: Date.now()
        };
        
        setGeneratedImages(prev => [newGenerated, ...prev]);
        
        if (generateResult.limits) {
          setRateLimits({
            hourly: generateResult.limits.hourly.remaining,
            daily: generateResult.limits.daily.remaining
          });
        }
      } else {
        throw new Error('No images generated');
      }

    } catch {
      alert('Failed to process images. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };


  const clearAll = () => {
    setPersonImage(null);
    setObjectImage(null);
    setCurrentImage(null);
    setBeforeImage(null);
    setGeneratedPrompt('');
    setGeneratedImages([]);
    setPersonPrompt('');
    setObjectPrompt('');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-black flex items-center justify-center gap-3">
          Object Holding
          <img src="/banana.png" alt="Transform" className="w-12 h-12 object-contain" />
        </h1>
        <p className="text-lg text-content-strong font-hal max-w-2xl mx-auto mt-4">
          Combine person and object images to create natural holding/using scenes
        </p>
        {/* Rate Limit Display - Only show if not 999 (development mode) */}
        {rateLimits && rateLimits.hourly !== 999 && (
          <div className="mt-4 inline-flex items-center gap-4 px-4 py-2 bg-gray-100 rounded-lg text-sm">
            <span className="text-gray-600">Remaining:</span>
            <span className={`font-semibold ${rateLimits.hourly <= 2 ? 'text-orange-600' : 'text-gray-800'}`}>
              {rateLimits.hourly}/10 hourly
            </span>
            <span className="text-gray-400">•</span>
            <span className={`font-semibold ${rateLimits.daily <= 5 ? 'text-orange-600' : 'text-gray-800'}`}>
              {rateLimits.daily}/40 daily
            </span>
          </div>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Image Generation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Input Images Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person Image Upload */}
            <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
              <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-black">Person Image</p>
                </div>
              </div>
              
              <div className="p-4">
                <div 
                  className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all hover:border-blue-400"
                  style={{ height: '200px' }}
                  onDrop={handlePersonDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    ref={personInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePersonInputChange}
                    className="hidden"
                  />
                  
                  {!personImage ? (
                    <div 
                      className="flex flex-col items-center justify-center h-full p-4 text-center cursor-pointer"
                      onClick={() => personInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs font-semibold text-gray-700 mb-1">Upload person</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full group">
                      <img src={personImage} alt="Person" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => personInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                      >
                        Replace
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Or Generate Person */}
              <div className="px-4 pb-4">
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Or Generate with Gemini Flash:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={personPrompt}
                      onChange={(e) => setPersonPrompt(e.target.value)}
                      placeholder="Describe person to generate..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={generatePersonImage}
                      disabled={isGeneratingPerson || !personPrompt.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGeneratingPerson ? (
                        <>
                          <LogoIcon className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <LogoIcon className="w-3 h-3" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Object Image Upload */}
            <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
              <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-sm font-medium text-black">Object Image</p>
                </div>
              </div>
              
              <div className="p-4">
                <div 
                  className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all hover:border-orange-400"
                  style={{ height: '200px' }}
                  onDrop={handleObjectDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    ref={objectInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleObjectInputChange}
                    className="hidden"
                  />
                  
                  {!objectImage ? (
                    <div 
                      className="flex flex-col items-center justify-center h-full p-4 text-center cursor-pointer"
                      onClick={() => objectInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs font-semibold text-gray-700 mb-1">Upload object</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full group">
                      <img src={objectImage} alt="Object" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => objectInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                      >
                        Replace
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Or Generate Object */}
              <div className="px-4 pb-4">
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Or Generate with Gemini Flash:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={objectPrompt}
                      onChange={(e) => setObjectPrompt(e.target.value)}
                      placeholder="Describe object to generate..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={generateObjectImage}
                      disabled={isGeneratingObject || !objectPrompt.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGeneratingObject ? (
                        <>
                          <LogoIcon className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <LogoIcon className="w-3 h-3" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result Image */}
          <div className="flex flex-col rounded border h-full transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-base font-medium text-black">Generated Scene</p>
              </div>
              {(personImage || objectImage || currentImage) && (
                <button
                  onClick={clearAll}
                  className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="flex-1 p-6 pt-0 space-y-4">
              <div 
                className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all"
                style={{ height: '400px' }}
              >
                {!currentImage ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <LogoIcon className="h-16 w-16 opacity-40 mb-4" />
                    <p className="text-sm">Upload images and click &quot;Create Object Holding Scene&quot; to start</p>
                  </div>
                ) : isGenerating ? (
                  <div className="relative w-full h-full">
                    <img src={currentImage} alt="Generating" className="w-full h-full object-contain opacity-30" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                      <LogoIcon className="h-12 w-12 text-purple-500 animate-spin" />
                      <span className="text-gray-600">AI is generating the scene...</span>
                      <span className="text-xs text-gray-500">This may take a few moments</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={showBefore && beforeImage ? beforeImage : currentImage} 
                      alt={showBefore ? "Previous" : "Current"} 
                      className="w-full h-full object-contain" 
                    />
                    
                    {/* Toggle Button - Bottom Right */}
                    {beforeImage && (
                      <button
                        onClick={() => setShowBefore(!showBefore)}
                        className="absolute bottom-4 right-4 p-2 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 hover:border-purple-500 transition-all shadow-lg"
                      >
                        <img 
                          src={showBefore ? '/rotten-banana.png' : '/banana.png'} 
                          alt={showBefore ? 'Show After' : 'Show Before'}
                          className="w-8 h-8 object-contain"
                        />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Controls (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Analysis Section */}
          <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-base font-medium text-black">Generate</p>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Combined Analyze & Generate Button */}
              <button
                onClick={analyzeAndGenerate}
                disabled={(isAnalyzing || isGenerating) || !personImage || !objectImage}
                className="w-full py-2.5 bg-primary text-white rounded hover:bg-primary/90 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing || isGenerating ? (
                  <>
                    <LogoIcon className="w-4 h-4 animate-spin" />
                    <span>{isAnalyzing ? 'Analyzing...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <LogoIcon className="w-4 h-4" />
                    <span>Create Object Holding Scene</span>
                  </>
                )}
              </button>

              {/* Generated Prompt (for reference only) */}
              {generatedPrompt && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Generated Prompt:</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700">
                    {generatedPrompt}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Generation History */}
          {generatedImages.length > 0 && (
            <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">History</h3>
              <div className="grid grid-cols-2 gap-2">
                {generatedImages.slice(0, 4).map((img) => (
                  <button
                    key={img.timestamp}
                    onClick={() => {
                      setCurrentImage(img.url);
                      setGeneratedPrompt(img.prompt);
                      setBeforeImage(null);
                      setShowBefore(false);
                    }}
                    className="relative aspect-square rounded overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <img src={img.url} alt="Generated" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectHoldingTab;