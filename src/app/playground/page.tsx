'use client';

import { useState } from 'react';
import PlaygroundHeader from './components/PlaygroundHeader';
import WeatherChangeTab from './components/WeatherChangeTab';
import PortraitTab from './components/PortraitTab';
import ObjectHoldingTab from './components/ObjectHoldingTab';
import { BananaDialog } from './components/BananaDialog';
import { SettingsDialog } from './components/SettingsDialog';

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState('weather-change');
  const [showDialog, setShowDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-white min-h-screen text-content-strong font-focal relative overflow-hidden flex flex-col">
      {/* Decorative elements */}
      <svg width="332" height="209" viewBox="0 0 332 209" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute left-[235px] top-[40px] hidden lg:block">
        <path d="M167.01 47.7147L30.3829 158.403L301.547 98.772" stroke="#3B82F6" strokeWidth="59.5056" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42.4192 30.5587L280.114 155.909" stroke="#60A5FA" strokeWidth="59.5056" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      
      <svg width="263" height="472" viewBox="0 0 263 472" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute right-0 top-[250px] hidden lg:block">
        <path d="M204.727 441.572L118.595 187.027" stroke="#3B82F6" strokeWidth="59.5056" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M368.876 145.251L100.651 161.58" stroke="#60A5FA" strokeWidth="59.5056" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <PlaygroundHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 flex-1 flex flex-col">
        {activeTab === 'weather-change' && <WeatherChangeTab />}
        {activeTab === 'portrait' && <PortraitTab />}
        {activeTab === 'object-holding' && <ObjectHoldingTab />}
      </div>

      {/* GPU Rich Banana Mascot - Clickable for dialog */}
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-4 right-4 w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 xl:w-72 xl:h-72 2xl:w-80 2xl:h-80 z-20 cursor-pointer hover:scale-110 transition-transform"
        title="Click for a special offer!"
      >
        <img
          src="/gpu-rich-banana-min.png"
          alt="GPU Rich Banana"
          className="w-full h-full object-contain animate-bounce opacity-90"
          style={{
            animationDuration: '3s',
            animationDelay: '1s'
          }}
        />
      </button>

      {/* Banana Dialog */}
      <BananaDialog 
        isOpen={showDialog} 
        onClose={() => setShowDialog(false)} 
      />
      
      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Footer */}
      <footer className="w-full py-6 px-4 bg-white border-t border-gray-200 relative z-10">
        <div className="container mx-auto text-center space-y-2">
          <p className="text-sm font-medium text-gray-800">
            ⚡ Powered by FAL.ai
          </p>
          <p className="text-xs text-gray-600 mb-1">
            Using Gemini 2.5 Flash Image (aka nano-banana) model
          </p>
          <p className="text-xs text-gray-600">
            Explore more AI models and build amazing applications at{' '}
            <a 
              href="https://fal.ai" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              fal.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}