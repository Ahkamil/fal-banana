'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Palette, Upload, Image as ImageIcon, Smile, Eye, Scissors, Key, Info } from 'lucide-react';
import { LogoIcon } from './LogoIcon';
import { BananaRain } from './BananaRain';
// FAL API calls are handled through server-side routes for security

interface TransformedPortrait {
  url: string;
  style: string;
  timestamp: number;
}

interface PortraitSelection {
  hair?: string;
  hairColor?: string;
  faceFeatures?: string[];
  expression?: string;
  style?: string;
  age?: string;
}

const PortraitTab = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [transformedImages, setTransformedImages] = useState<TransformedPortrait[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [rateLimits, setRateLimits] = useState<{ hourly: number; daily: number } | null>(null);
  const [selections, setSelections] = useState<PortraitSelection>({ faceFeatures: [] });
  const [showBananaRain, setShowBananaRain] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
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

  // Portrait Categories
  const categories = {
    hair: {
      title: 'Hair Style',
      icon: Scissors,
      color: 'bg-amber-500/20',
      iconColor: 'text-amber-600',
      options: [
        { id: 'short', label: 'Short', prompt: 'short hair style' },
        { id: 'long', label: 'Long', prompt: 'long flowing hair' },
        { id: 'curly', label: 'Curly', prompt: 'curly hair style' },
        { id: 'straight', label: 'Straight', prompt: 'straight hair style' },
        { id: 'wavy', label: 'Wavy', prompt: 'wavy hair style' },
        { id: 'bald', label: 'Bald', prompt: 'bald head' },
        { id: 'braided', label: 'Braided', prompt: 'braided hair style' }
      ]
    },
    hairColor: {
      title: 'Hair Color',
      icon: Palette,
      color: 'bg-pink-500/20',
      iconColor: 'text-pink-500',
      options: [
        { id: 'black', label: 'Black', prompt: 'black hair' },
        { id: 'brown', label: 'Brown', prompt: 'brown hair' },
        { id: 'blonde', label: 'Blonde', prompt: 'blonde hair' },
        { id: 'red', label: 'Red', prompt: 'red hair' },
        { id: 'gray', label: 'Gray', prompt: 'gray hair' },
        { id: 'white', label: 'White', prompt: 'white hair' }
      ]
    },
    faceFeatures: {
      title: 'Face Features',
      icon: Eye,
      color: 'bg-blue-500/20', 
      iconColor: 'text-blue-500',
      multiSelect: true,
      options: [
        { id: 'beard', label: 'Beard', prompt: 'full beard', conflicts: ['mustache-only', 'clean-shaven'] },
        { id: 'mustache-only', label: 'Mustache', prompt: 'mustache', conflicts: ['beard', 'clean-shaven'] },
        { id: 'clean-shaven', label: 'Clean Shaven', prompt: 'clean shaven face', conflicts: ['beard', 'mustache-only'] },
        { id: 'glasses', label: 'Glasses', prompt: 'wearing glasses', conflicts: ['sunglasses'] },
        { id: 'sunglasses', label: 'Sunglasses', prompt: 'wearing sunglasses', conflicts: ['glasses'] },
        { id: 'freckles', label: 'Freckles', prompt: 'face with freckles' },
        { id: 'dimples', label: 'Dimples', prompt: 'dimples when smiling' },
        { id: 'piercing', label: 'Piercing', prompt: 'facial piercing' },
        { id: 'scar', label: 'Scar', prompt: 'facial scar' }
      ]
    },
    expression: {
      title: 'Expression',
      icon: Smile,
      color: 'bg-green-500/20',
      iconColor: 'text-green-500',
      options: [
        { id: 'smiling', label: 'Smiling', prompt: 'happy smiling expression' },
        { id: 'serious', label: 'Serious', prompt: 'serious neutral expression' },
        { id: 'laughing', label: 'Laughing', prompt: 'laughing joyful expression' },
        { id: 'surprised', label: 'Surprised', prompt: 'surprised shocked expression' },
        { id: 'confident', label: 'Confident', prompt: 'confident determined expression' },
        { id: 'thoughtful', label: 'Thoughtful', prompt: 'thoughtful contemplative expression' },
        { id: 'angry', label: 'Angry', prompt: 'angry upset expression' },
        { id: 'sad', label: 'Sad', prompt: 'sad melancholic expression' },
        { id: 'winking', label: 'Winking', prompt: 'playful winking expression' },
        { id: 'excited', label: 'Excited', prompt: 'excited enthusiastic expression' },
        { id: 'skeptical', label: 'Skeptical', prompt: 'skeptical doubtful expression' },
        { id: 'proud', label: 'Proud', prompt: 'proud satisfied expression' },
        { id: 'flirty', label: 'Flirty', prompt: 'flirty charming expression' },
        { id: 'worried', label: 'Worried', prompt: 'worried anxious expression' },
        { id: 'peaceful', label: 'Peaceful', prompt: 'peaceful serene expression' },
        { id: 'disgusted', label: 'Disgusted', prompt: 'disgusted repulsed expression' },
        { id: 'embarrassed', label: 'Embarrassed', prompt: 'embarrassed shy expression' },
        { id: 'mischievous', label: 'Mischievous', prompt: 'mischievous playful expression' }
      ]
    },
    style: {
      title: 'Art Style',
      icon: Palette,
      color: 'bg-purple-500/20',
      iconColor: 'text-purple-500',
      options: [
        { id: 'realistic', label: 'Realistic', prompt: 'photorealistic style' },
        { id: 'cartoon', label: 'Cartoon', prompt: 'cartoon animated style' },
        { id: 'oil-painting', label: 'Oil Painting', prompt: 'oil painting artistic style' },
        { id: 'sketch', label: 'Sketch', prompt: 'pencil sketch drawing style' },
        { id: 'watercolor', label: 'Watercolor', prompt: 'watercolor painting style' },
        { id: 'anime', label: 'Anime', prompt: 'anime manga style' },
        { id: 'pixar', label: 'Pixar', prompt: '3D Pixar animation style' },
        { id: 'pop-art', label: 'Pop Art', prompt: 'pop art Andy Warhol style' },
        { id: 'renaissance', label: 'Renaissance', prompt: 'Renaissance classical painting style' },
        { id: 'digital-art', label: 'Digital Art', prompt: 'modern digital art style' },
        { id: 'comic-book', label: 'Comic Book', prompt: 'comic book illustration style' },
        { id: 'impressionist', label: 'Impressionist', prompt: 'impressionist Claude Monet style' },
        { id: 'surrealist', label: 'Surrealist', prompt: 'surrealist Salvador Dali style' },
        { id: 'cyberpunk', label: 'Cyberpunk', prompt: 'cyberpunk futuristic neon style' },
        { id: 'steampunk', label: 'Steampunk', prompt: 'steampunk Victorian era style' },
        { id: 'minimalist', label: 'Minimalist', prompt: 'minimalist simple clean style' },
        { id: 'vintage', label: 'Vintage', prompt: 'vintage retro photograph style' },
        { id: 'fantasy', label: 'Fantasy', prompt: 'fantasy magical ethereal style' },
        { id: 'noir', label: 'Film Noir', prompt: 'film noir black and white dramatic style' },
        { id: 'graffiti', label: 'Graffiti', prompt: 'street art graffiti urban style' }
      ]
    },
    age: {
      title: 'Age',
      icon: User,
      color: 'bg-orange-500/20',
      iconColor: 'text-orange-500',
      options: [
        { id: 'child', label: 'Child', prompt: 'young child appearance' },
        { id: 'teenager', label: 'Teenager', prompt: 'teenage appearance' },
        { id: 'young-adult', label: 'Young Adult', prompt: 'young adult appearance' },
        { id: 'middle-aged', label: 'Middle Aged', prompt: 'middle-aged appearance' },
        { id: 'elderly', label: 'Elderly', prompt: 'elderly wise appearance' }
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
    if (category === 'faceFeatures') {
      setSelections(prev => {
        const currentFeatures = prev.faceFeatures || [];
        const categoryData = categories.faceFeatures;
        const selectedOption = categoryData.options.find(opt => opt.id === optionId);
        
        let newFeatures = [...currentFeatures];
        
        if (currentFeatures.includes(optionId)) {
          // Remove the option
          newFeatures = newFeatures.filter(id => id !== optionId);
        } else {
          // Add the option, but first remove conflicting options
          if (selectedOption?.conflicts) {
            newFeatures = newFeatures.filter(id => !selectedOption.conflicts!.includes(id));
          }
          newFeatures.push(optionId);
        }
        
        return { ...prev, faceFeatures: newFeatures };
      });
    } else {
      setSelections(prev => ({
        ...prev,
        [category]: prev[category as keyof PortraitSelection] === optionId ? undefined : optionId
      } as PortraitSelection));
    }
  };

  const buildPrompt = () => {
    const prompts: string[] = ['Transform this portrait to have'];
    
    Object.entries(selections).forEach(([category, value]) => {
      if (category === 'faceFeatures' && Array.isArray(value) && value.length > 0) {
        const cat = categories.faceFeatures;
        value.forEach(featureId => {
          const option = cat.options.find(o => o.id === featureId);
          if (option?.prompt) {
            prompts.push(option.prompt);
          }
        });
      } else if (value && typeof value === 'string') {
        const cat = categories[category as keyof typeof categories];
        const option = cat?.options.find(o => o.id === value);
        if (option?.prompt) {
          prompts.push(option.prompt);
        }
      }
    });

    const finalPrompt = prompts.length > 1 
      ? prompts.join(', ') + '. Keep the person recognizable but apply the changes naturally.'
      : '';
    
    return finalPrompt;
  };

  const generateInitialImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGenerating(true);
    setShowBananaRain(true);
    // Clear current image to show white placeholder
    setOriginalImage(null);
    setCurrentImage(null);
    setBeforeImage(null);
    
    try {
      const portraitPrompt = `Portrait of ${imagePrompt}, professional headshot, high quality`;
      
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
            prompt: portraitPrompt,
            num_images: 1
          },
          ...(customApiKey && { customApiKey })
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate portrait');
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
          setOriginalImage(originalImage);
          setCurrentImage(originalImage);
        }
      }
    } catch (error) {
      alert('Failed to generate portrait. Please try again.');
      // Restore previous image if any
      if (originalImage) {
        setOriginalImage(originalImage);
        setCurrentImage(originalImage);
      }
    } finally {
      setIsGenerating(false);
      setShowBananaRain(false);
    }
  };

  const transformPortrait = async () => {
    if (!originalImage) {
      alert('Please upload a portrait first!');
      return;
    }
    
    const hasSelections = Object.entries(selections).some(([key, value]) => {
      if (key === 'faceFeatures') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value !== '';
    });
    
    if (!hasSelections) {
      alert('Please select at least one portrait option!');
      return;
    }
    
    setIsTransforming(true);
    setShowBananaRain(true);
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
          prompt: prompt,
          image_url: originalImage,
          num_images: 1,
          ...(customApiKey && { customApiKey })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.error?.includes('FAL_KEY')) {
          alert('FAL API key not configured. Please set FAL_KEY environment variable in .env.local file.');
        } else if (errorData.error?.includes('rate limit')) {
          alert('Rate limit exceeded. Please try again later.');
        } else {
          alert(`Error: ${errorData.error || 'Failed to transform portrait'}`);
        }
        return;
      }
      
      const result = await response.json();
      
      if (result?.limits) {
        setRateLimits({
          hourly: result.limits.hourly.remaining,
          daily: result.limits.daily.remaining
        });
      }
      
      if (result?.images?.[0]) {
        const transformedUrl = result.images[0].url || result.images[0];
        setBeforeImage(currentImage || originalImage);
        setCurrentImage(transformedUrl);
        setShowBefore(false);
        
        const newTransformed: TransformedPortrait = {
          url: transformedUrl,
          style: 'Custom Style',
          timestamp: Date.now()
        };
        
        setTransformedImages(prev => [newTransformed, ...prev.slice(0, 4)]);
      } else {
        alert('Failed to generate transformed portrait. Please try again.');
      }
    } catch (error) {
      alert('An error occurred while transforming the portrait. Please check the console for details.');
    } finally {
      setIsTransforming(false);
      setShowBananaRain(false);
    }
  };

  const clearAll = () => {
    setOriginalImage(null);
    setCurrentImage(null);
    setBeforeImage(null);
    setTransformedImages([]);
    setSelections({ faceFeatures: [] });
  };

  const clearSelections = () => {
    setSelections({ faceFeatures: [] });
  };

  return (
    <>
      <BananaRain isActive={showBananaRain} duration={3000} />
      <div className="flex flex-col gap-6 w-full">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-black flex items-center justify-center gap-3">
          Portrait Transform
          <img src="/banana.png" alt="Transform" className="w-12 h-12 object-contain" />
        </h1>
        <p className="text-lg text-content-strong font-hal max-w-2xl mx-auto mt-4">
          Transform any portrait with custom styles and features
        </p>
        {/* API Key Status Display */}
        {hasCustomKey ? (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Key className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Using Custom API Key</span>
            <Info className="w-3.5 h-3.5 text-green-600" />
          </div>
        ) : (
          rateLimits && (
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
        {/* Left Column - Image Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded border h-full transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-base font-medium text-black">Portrait Canvas</p>
            </div>
            {originalImage && (
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
              
              {!originalImage ? (
                <div 
                  className="flex flex-col items-center justify-center h-full p-6 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Drop portrait here or click to upload</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP • Max 10MB</p>
                </div>
              ) : (isTransforming || isGenerating) ? (
                <div className="relative w-full h-full bg-white">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <LogoIcon className="h-12 w-12 text-purple-500 animate-spin" />
                    <span className="text-gray-600">
                      {isGenerating ? 'AI is generating your portrait...' : 'AI is transforming your portrait...'}
                    </span>
                    <span className="text-xs text-gray-500">This may take a few moments</span>
                  </div>
                </div>
              ) : (
                // Image View with Toggle
                <div className="relative w-full h-full">
                  <img 
                    src={showBefore && beforeImage ? beforeImage : (currentImage || originalImage)} 
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

            {/* Generate Portrait Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-black">Or Generate a Portrait</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the person you want to create..."
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

        {/* Right Column - Portrait Options (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-base font-medium text-black">Portrait Options</p>
              </div>
              {(Object.entries(selections).some(([key, value]) => {
                if (key === 'faceFeatures') return Array.isArray(value) && value.length > 0;
                return value && value !== '';
              })) && (
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
                
                // Skip hair color if bald is selected
                if (categoryKey === 'hairColor' && selections.hair === 'bald') {
                  return null;
                }
                
                return (
                  <div key={categoryKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${category.iconColor}`} />
                      <span className="text-sm font-medium text-gray-700">{category.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.options.map((option) => {
                        const isSelected = categoryKey === 'faceFeatures' 
                          ? (selections.faceFeatures || []).includes(option.id)
                          : selections[categoryKey as keyof PortraitSelection] === option.id;
                          
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleCategorySelect(categoryKey, option.id)}
                            className={`px-2.5 py-1 text-xs rounded-sm transition-all ${
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {/* Transform Button */}
              <button
                onClick={transformPortrait}
                disabled={isTransforming || !originalImage || !Object.entries(selections).some(([key, value]) => {
                  if (key === 'faceFeatures') return Array.isArray(value) && value.length > 0;
                  return value && value !== '';
                })}
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
                    <span>Apply Changes</span>
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
                    <img src={img.url} alt={img.style} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default PortraitTab;