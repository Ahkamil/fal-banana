'use client';

import { useState, useRef, useEffect } from 'react';
import { Cloud, Sun, Upload, Image as ImageIcon, Clock, Palette, Key, AlertCircle, X, Info } from 'lucide-react';
import { LogoIcon } from './LogoIcon';
import { usePlaygroundContext } from '../context/PlaygroundContext';
// FAL API calls are handled through server-side routes for security

interface TransformedImage {
  url: string;
  weather: string;
  timestamp: number;
}

interface WeatherSelection {
  season?: string;
  weather?: string;
  timeOfDay?: string;
  lighting?: string;
}

const WeatherChangeTab = () => {
  const { weatherState, setWeatherState, rateLimits, setRateLimits } = usePlaygroundContext();
  
  // Use state from context
  const { 
    originalImage, 
    currentImage, 
    beforeImage, 
    transformedImages, 
    selections 
  } = weatherState;
  
  // Local state for UI-only states
  const [showBefore, setShowBefore] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Helper functions to update context
  const setOriginalImage = (image: string | null) => {
    setWeatherState(prev => ({ ...prev, originalImage: image }));
  };
  const setCurrentImage = (image: string | null) => {
    setWeatherState(prev => ({ ...prev, currentImage: image }));
  };
  const setBeforeImage = (image: string | null) => {
    setWeatherState(prev => ({ ...prev, beforeImage: image }));
  };
  const setTransformedImages = (images: TransformedImage[] | ((prev: TransformedImage[]) => TransformedImage[])) => {
    if (typeof images === 'function') {
      setWeatherState(prev => ({ ...prev, transformedImages: images(prev.transformedImages) }));
    } else {
      setWeatherState(prev => ({ ...prev, transformedImages: images }));
    }
  };
  const setSelections = (sel: WeatherSelection | ((prev: WeatherSelection) => WeatherSelection)) => {
    if (typeof sel === 'function') {
      setWeatherState(prev => ({ ...prev, selections: sel(prev.selections) }));
    } else {
      setWeatherState(prev => ({ ...prev, selections: sel }));
    }
  };
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check for custom API key on mount and listen for changes
  useEffect(() => {
    const checkCustomKey = () => {
      const customKey = localStorage.getItem('fal_api_key');
      setHasCustomKey(!!customKey);
    };
    
    checkCustomKey();
    
    // Listen for storage changes
    window.addEventListener('storage', checkCustomKey);
    
    // Also listen for custom event that SettingsDialog might dispatch
    const handleKeyUpdate = () => checkCustomKey();
    window.addEventListener('fal-key-updated', handleKeyUpdate);
    
    return () => {
      window.removeEventListener('storage', checkCustomKey);
      window.removeEventListener('fal-key-updated', handleKeyUpdate);
    };
  }, []);

  // Weather Categories - Simplified
  const categories = {
    season: {
      title: 'Season',
      icon: Palette,
      color: 'bg-green-500/20',
      iconColor: 'text-green-500',
      options: [
        { id: 'spring', label: 'Spring', prompt: 'spring season with blooming flowers' },
        { id: 'summer', label: 'Summer', prompt: 'hot summer season' },
        { id: 'autumn', label: 'Autumn', prompt: 'autumn with orange and red leaves' },
        { id: 'winter', label: 'Winter', prompt: 'cold winter with snow' }
      ]
    },
    weather: {
      title: 'Weather',
      icon: Cloud,
      color: 'bg-blue-500/20', 
      iconColor: 'text-blue-500',
      options: [
        { id: 'sunny', label: 'Sunny', prompt: 'bright sunny weather' },
        { id: 'cloudy', label: 'Cloudy', prompt: 'cloudy overcast sky' },
        { id: 'rainy', label: 'Rainy', prompt: 'heavy rain with wet surfaces' },
        { id: 'snowy', label: 'Snowy', prompt: 'heavy snowfall' },
        { id: 'stormy', label: 'Stormy', prompt: 'thunderstorm with lightning' },
        { id: 'foggy', label: 'Foggy', prompt: 'thick fog' }
      ]
    },
    timeOfDay: {
      title: 'Time of Day',
      icon: Clock,
      color: 'bg-purple-500/20',
      iconColor: 'text-purple-500',
      options: [
        { id: 'sunrise', label: 'Sunrise', prompt: 'sunrise with golden sky' },
        { id: 'morning', label: 'Morning', prompt: 'bright morning light' },
        { id: 'noon', label: 'Noon', prompt: 'midday sun' },
        { id: 'sunset', label: 'Sunset', prompt: 'sunset with red sky' },
        { id: 'night', label: 'Night', prompt: 'dark night time' }
      ]
    },
    lighting: {
      title: 'Lighting',
      icon: Sun,
      color: 'bg-yellow-500/20',
      iconColor: 'text-yellow-500',
      options: [
        { id: 'soft', label: 'Soft', prompt: 'soft diffused lighting' },
        { id: 'dramatic', label: 'Dramatic', prompt: 'dramatic lighting' },
        { id: 'cinematic', label: 'Cinematic', prompt: 'cinematic lighting' },
        { id: 'golden', label: 'Golden Hour', prompt: 'golden hour lighting' },
        { id: 'moody', label: 'Moody', prompt: 'moody dark lighting' }
      ]
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setOriginalImage(imageUrl);
        setCurrentImage(imageUrl);
        setBeforeImage(null);
        setTransformedImages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCategorySelect = (category: string, optionId: string) => {
    setSelections(prev => ({
      ...prev,
      [category]: prev[category as keyof WeatherSelection] === optionId ? undefined : optionId
    } as WeatherSelection));
  };

  const buildPrompt = () => {
    const prompts: string[] = ['Transform this image to show'];
    
    Object.entries(selections).forEach(([category, optionId]) => {
      if (optionId) {
        const cat = categories[category as keyof typeof categories];
        const option = cat?.options.find(o => o.id === optionId);
        if (option?.prompt) {
          prompts.push(option.prompt);
        }
      }
    });

    const finalPrompt = prompts.length > 1 
      ? prompts.join(', ') + '. Make the transformation realistic and cohesive.'
      : '';
    
    return finalPrompt;
  };

  const generateInitialImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGenerating(true);
    // Clear current image to show white placeholder
    setCurrentImage(null);
    setBeforeImage(null);
    
    try {
      // Get custom API key from localStorage
      const customApiKey = localStorage.getItem('fal_api_key');
      setHasCustomKey(!!customApiKey);

      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "fal-ai/gemini-25-flash-image",
          input: {
            prompt: imagePrompt,
            num_images: 1
          },
          ...(customApiKey && { customApiKey })
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image');
      }
      
      const result = await response.json();
      
      // Update rate limits if available
      if (result?.limits) {
        setRateLimits({
          hourly: result.limits.hourly.remaining,
          daily: result.limits.daily.remaining
        });
      }
      
      if (result.data?.images?.[0]) {
        const imageUrl = result.data.images[0].url || result.data.images[0];
        setOriginalImage(imageUrl);
        setCurrentImage(imageUrl);
        setBeforeImage(null);
        setTransformedImages([]);
      } else {
        // If generation failed, restore previous image if any
        if (originalImage) {
          setCurrentImage(originalImage);
        }
      }
    } catch {
      alert('Failed to generate image. Please try again.');
      // Restore previous image if any
      if (originalImage) {
        setCurrentImage(originalImage);
      }
    } finally {
      setIsGenerating(false);
      // Stop banana rain when generation completes
    }
  };

  const transformWeather = async () => {
    if (!originalImage || !currentImage) {
      alert('Please upload an image first!');
      return;
    }
    
    if (Object.keys(selections).length === 0) {
      alert('Please select at least one weather option!');
      return;
    }
    
    setIsTransforming(true);
    
    try {
      const prompt = buildPrompt();
      
      // Get custom API key from localStorage
      const customApiKey = localStorage.getItem('fal_api_key');
      setHasCustomKey(!!customApiKey);
      
      const response = await fetch('/api/fal-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "fal-ai/gemini-25-flash-image/edit",
          prompt: prompt,
          image_url: originalImage, // Send base64 or URL
          num_images: 1,
          ...(customApiKey && { customApiKey })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show user-friendly error message
        if (errorData.error?.includes('FAL_KEY')) {
          alert('FAL API key not configured. Please set FAL_KEY environment variable in .env.local file.');
        } else if (errorData.error?.includes('rate limit')) {
          alert('Rate limit exceeded. Please try again later.');
        } else {
          alert(`Error: ${errorData.error || 'Failed to transform image'}`);
        }
        return;
      }
      
      const result = await response.json();
      
      // Update rate limits if available
      if (result?.limits) {
        setRateLimits({
          hourly: result.limits.hourly.remaining,
          daily: result.limits.daily.remaining
        });
      }
      
      if (result?.images?.[0]) {
        const transformedUrl = result.images[0].url || result.images[0];
        // Store before image and update current (keep original intact)
        setBeforeImage(currentImage);
        setCurrentImage(transformedUrl);
        setShowBefore(false);
        
        // Add to history
        const newTransformed: TransformedImage = {
          url: transformedUrl,
          weather: 'Custom Mix',
          timestamp: Date.now()
        };
        
        setTransformedImages(prev => [newTransformed, ...prev.slice(0, 4)]);
      } else {
        alert('Failed to generate transformed image. Please try again.');
      }
    } catch {
      alert('An error occurred while transforming the image.');
    } finally {
      setIsTransforming(false);
      // Stop banana rain when transformation completes
    }
  };


  const clearAll = () => {
    setOriginalImage(null);
    setCurrentImage(null);
    setBeforeImage(null);
    setTransformedImages([]);
    setSelections({});
  };

  const clearSelections = () => {
    setSelections({});
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-black flex items-center justify-center gap-3">
          Weather Transform
          <img src="/banana.png" alt="Transform" className="w-12 h-12 object-contain" />
        </h1>
        <p className="text-lg text-content-strong font-hal max-w-2xl mx-auto mt-4">
          Transform any image with custom weather conditions
        </p>
        {/* API Key Status Display */}
        {hasCustomKey ? (
          <button
            onClick={() => setShowApiKeyDialog(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Key className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Using Custom API Key</span>
            <Info className="w-3.5 h-3.5 text-green-600" />
          </button>
        ) : (
          rateLimits && rateLimits.hourly !== 999 && (
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
          )
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Image Generation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded border h-full transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-base font-medium text-black">Image Canvas</p>
            </div>
            {currentImage && (
              <button
                onClick={clearAll}
                className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex-1 p-6 pt-0 space-y-4">
            {/* Image Display/Upload Area */}
            <div 
              className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all hover:border-blue-400"
              style={{ height: '400px' }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              
              {!currentImage ? (
                <div 
                  className="flex flex-col items-center justify-center h-full p-6 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Drop image here or click to upload</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP • Max 10MB</p>
                </div>
              ) : (isTransforming || isGenerating) ? (
                <div className="relative w-full h-full bg-white">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <LogoIcon className="h-12 w-12 text-purple-500 animate-spin" />
                    <span className="text-gray-600">
                      {isGenerating ? 'AI is generating your image...' : 'AI is transforming your image...'}
                    </span>
                    <span className="text-xs text-gray-500">This may take a few moments</span>
                  </div>
                </div>
              ) : (
                // Image View with Toggle
                <div className="relative w-full h-full">
                  <img 
                    src={showBefore && beforeImage ? beforeImage : currentImage} 
                    alt={showBefore ? "Before" : "Current"} 
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

            {/* Generate Image Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-black">Or Generate an Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={generateInitialImage}
                  disabled={isGenerating || !imagePrompt.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <LogoIcon className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <LogoIcon className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Weather Options (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <LogoIcon className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-base font-medium text-black">Weather Options</p>
              </div>
              {Object.keys(selections).length > 0 && (
                <button
                  onClick={clearSelections}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="p-4 space-y-3">
              {Object.entries(categories).map(([categoryKey, category]) => {
                const Icon = category.icon;
                const selectedOption = selections[categoryKey as keyof WeatherSelection];
                
                return (
                  <div key={categoryKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${category.iconColor}`} />
                      <span className="text-sm font-medium text-gray-700">{category.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCategorySelect(categoryKey, option.id)}
                          className={`px-2.5 py-1 text-xs rounded-sm transition-all ${
                            selectedOption === option.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Transform Button */}
              <button
                onClick={transformWeather}
                disabled={isTransforming || !currentImage || Object.keys(selections).length === 0}
                className="w-full mt-4 py-2.5 bg-primary text-white rounded hover:bg-primary/90 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTransforming ? (
                  <>
                    <LogoIcon className="w-4 h-4 animate-spin" />
                    <span>Transforming...</span>
                  </>
                ) : (
                  <>
                    <LogoIcon className="w-4 h-4" />
                    <span>Apply Weather</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Transformation History */}
          {transformedImages.length > 0 && (
            <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">History</h3>
              <div className="grid grid-cols-2 gap-2">
                {transformedImages.slice(0, 4).map((img) => (
                  <button
                    key={img.timestamp}
                    onClick={() => {
                      setCurrentImage(img.url);
                      setBeforeImage(null);
                      setShowBefore(false);
                    }}
                    className="relative aspect-square rounded overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <img src={img.url} alt={img.weather} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* API Key Info Dialog */}
      {showApiKeyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative animate-in fade-in duration-200">
            <button
              onClick={() => setShowApiKeyDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Custom API Key Active</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="mb-2">You are using your own FAL API key. All usage charges will be billed to your FAL account.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Security Recommendation:</p>
                  <p>For your security, we recommend revoking this API key from your FAL Dashboard after use to prevent unauthorized access.</p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <a
                  href="https://fal.ai/dashboard/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to FAL Dashboard →
                </a>
              </div>
            </div>
            
            <button
              onClick={() => setShowApiKeyDialog(false)}
              className="w-full mt-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherChangeTab;