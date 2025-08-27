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
      <footer className="w-full py-4 px-4 bg-white border-t border-gray-200 relative z-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center">
          <p className="text-xs text-gray-700 flex items-center gap-1">
            ⚡ Powered by <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">FAL.ai</a>
          </p>
          <span className="text-xs text-gray-400 hidden md:inline">•</span>
          <p className="text-xs text-gray-600">
            Using Gemini 2.5 Flash Image (nano-banana)
          </p>
          <span className="text-xs text-gray-400 hidden md:inline">•</span>
          <a 
            href="https://github.com/fal-ai-community/fal-banana" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1 font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}