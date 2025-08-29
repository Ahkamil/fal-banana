'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for each tab's state
interface PortraitTabState {
  originalImage: string | null;
  currentImage: string | null;
  beforeImage: string | null;
  transformedImages: Array<{
    url: string;
    style: string;
    timestamp: number;
  }>;
  selections: {
    hair?: string;
    hairColor?: string;
    faceFeatures?: string[];
    expression?: string;
    style?: string;
    age?: string;
  };
}

interface WeatherTabState {
  originalImage: string | null;
  currentImage: string | null;
  beforeImage: string | null;
  transformedImages: Array<{
    url: string;
    weather: string;
    timestamp: number;
  }>;
  selections: {
    season?: string;
    weather?: string;
    timeOfDay?: string;
    lighting?: string;
  };
}

interface ObjectHoldingTabState {
  personImage: string | null;
  objectImage: string | null;
  currentImage: string | null;
  beforeImage: string | null;
  generatedImages: Array<{
    url: string;
    prompt: string;
    timestamp: number;
  }>;
  generatedPrompt: string;
  personPrompt: string;
  objectPrompt: string;
}

interface PlaygroundContextType {
  // Portrait tab state
  portraitState: PortraitTabState;
  setPortraitState: React.Dispatch<React.SetStateAction<PortraitTabState>>;
  
  // Weather tab state
  weatherState: WeatherTabState;
  setWeatherState: React.Dispatch<React.SetStateAction<WeatherTabState>>;
  
  // Object holding tab state
  objectHoldingState: ObjectHoldingTabState;
  setObjectHoldingState: React.Dispatch<React.SetStateAction<ObjectHoldingTabState>>;
  
  // Shared rate limits
  rateLimits: { hourly: number; daily: number } | null;
  setRateLimits: React.Dispatch<React.SetStateAction<{ hourly: number; daily: number } | null>>;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export const PlaygroundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Portrait tab state
  const [portraitState, setPortraitState] = useState<PortraitTabState>({
    originalImage: null,
    currentImage: null,
    beforeImage: null,
    transformedImages: [],
    selections: { faceFeatures: [] }
  });
  
  // Weather tab state
  const [weatherState, setWeatherState] = useState<WeatherTabState>({
    originalImage: null,
    currentImage: null,
    beforeImage: null,
    transformedImages: [],
    selections: {}
  });
  
  // Object holding tab state
  const [objectHoldingState, setObjectHoldingState] = useState<ObjectHoldingTabState>({
    personImage: null,
    objectImage: null,
    currentImage: null,
    beforeImage: null,
    generatedImages: [],
    generatedPrompt: '',
    personPrompt: '',
    objectPrompt: ''
  });
  
  // Shared rate limits
  const [rateLimits, setRateLimits] = useState<{ hourly: number; daily: number } | null>(null);
  
  return (
    <PlaygroundContext.Provider 
      value={{
        portraitState,
        setPortraitState,
        weatherState,
        setWeatherState,
        objectHoldingState,
        setObjectHoldingState,
        rateLimits,
        setRateLimits
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
};

export const usePlaygroundContext = () => {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error('usePlaygroundContext must be used within a PlaygroundProvider');
  }
  return context;
};