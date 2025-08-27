'use client';

import { useState, useEffect } from 'react';
import { Key, Check, ExternalLink } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [isCustomKeyActive, setIsCustomKeyActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load saved API key from localStorage
      const savedKey = localStorage.getItem('fal_api_key');
      if (savedKey) {
        setApiKey(savedKey);
        setIsCustomKeyActive(true);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('fal_api_key', apiKey.trim());
      setIsCustomKeyActive(true);
    } else {
      localStorage.removeItem('fal_api_key');
      setIsCustomKeyActive(false);
    }
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('fal-key-updated'));
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('fal_api_key');
    setApiKey('');
    setIsCustomKeyActive(false);
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('fal-key-updated'));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Dialog - Centered Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        <div className="w-full max-w-md animate-slideUpCenter">
          {/* Main Card - Using exact PortraitTab style */}
          <div className="flex flex-col rounded border transition-all duration-300 bg-white/80 border-gray-200 shadow-sm">
            {/* Header - Same as PortraitTab */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-base font-medium text-black">API Settings</p>
              </div>
              <button
                onClick={onClose}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Content - Same padding and spacing as PortraitTab */}
            <div className="p-4 space-y-3">
              {/* Status Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isCustomKeyActive ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {isCustomKeyActive ? 'BYOK Mode' : 'Free Mode'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <div className={`px-2.5 py-1 text-xs rounded-sm ${
                    isCustomKeyActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {isCustomKeyActive ? 'Using your FAL account' : '10 hourly / 40 daily'}
                  </div>
                </div>
              </div>

              {/* API Key Input Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Your FAL.ai API Key</span>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="fal_xxxxxxxx..."
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <div className="flex items-center justify-between">
                  <a
                    href="https://fal.ai/dashboard/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Get your API key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {isCustomKeyActive && (
                    <button
                      onClick={handleRemoveKey}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove key
                    </button>
                  )}
                </div>
              </div>
              
              {/* Save Button - Same style as Transform Button in PortraitTab */}
              <button
                onClick={handleSave}
                className="w-full mt-4 py-2.5 bg-primary text-white rounded hover:bg-primary/90 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Save API Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUpCenter {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUpCenter {
          animation: slideUpCenter 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  );
};