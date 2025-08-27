'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BananaDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FloatingBanana {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

export const BananaDialog = ({ isOpen, onClose }: BananaDialogProps) => {
  const [floatingBananas, setFloatingBananas] = useState<FloatingBanana[]>([]);
  const couponUrl = "https://fal.ai/coupon-claim/NANO-BANANA?redirect_to=/models/fal-ai/nano-banana/edit";

  useEffect(() => {
    if (isOpen) {
      // Generate LOTS of floating bananas!
      const bananas: FloatingBanana[] = [];
      for (let i = 0; i < 25; i++) { // Much more bananas!
        bananas.push({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 3, // Faster start
          duration: 10 + Math.random() * 15, // Varied duration
          size: 25 + Math.random() * 30, // Varied sizes
        });
      }
      setFloatingBananas(bananas);
    } else {
      setFloatingBananas([]);
    }
  }, [isOpen]);

  const handleRedeem = () => {
    window.open(couponUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-md z-[100] animate-fadeIn"
        onClick={onClose}
      >
        {/* Floating Bananas */}
        {floatingBananas.map((banana) => (
          <div
            key={banana.id}
            className="absolute opacity-40"
            style={{
              left: `${banana.left}%`,
              top: `${banana.top}%`,
              animation: `float ${banana.duration}s ease-in-out ${banana.delay}s infinite`,
            }}
          >
            <img
              src="/banana.png"
              alt=""
              className="animate-spin"
              style={{
                width: `${banana.size}px`,
                height: `${banana.size}px`,
                animationDuration: '6s',
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Dialog - Animated from bottom, responsive positioning */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[101] p-4 md:p-0">
        <div className="relative bg-white/95 backdrop-blur-xl rounded-t-2xl md:rounded-2xl animate-slideUpBottom md:animate-slideUpCenter">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* Content - Banner Image */}
          <div className="p-8">
            {/* Clickable Banner */}
            <button
              onClick={handleRedeem}
              className="group cursor-pointer transition-transform hover:scale-105 block"
            >
              <img 
                src="/gpu-rich-banana-min.png" 
                alt="NANO-BANANA - Free Credits" 
                className="w-full max-w-md mx-auto"
              />
              <div className="mt-4 text-center">
                <p className="text-lg font-bold text-gray-800 mb-1">NANO-BANANA</p>
                <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                  Click to claim your free credits →
                </p>
              </div>
            </button>
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
        
        @keyframes slideUpBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-40px) translateX(20px) rotate(90deg);
          }
          50% {
            transform: translateY(30px) translateX(-15px) rotate(180deg);
          }
          75% {
            transform: translateY(-20px) translateX(25px) rotate(270deg);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUpBottom {
          animation: slideUpBottom 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .animate-slideUpCenter {
          animation: slideUpCenter 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  );
};