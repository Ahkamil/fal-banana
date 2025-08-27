'use client';

import { useEffect, useState, useRef } from 'react';

interface BananaRainProps {
  isActive: boolean;
  duration?: number; // milliseconds
}

interface Banana {
  id: number;
  left: number;
  animationDelay: number;
  animationDuration: number;
  size: number;
}

export const BananaRain = ({ isActive, duration = 3000 }: BananaRainProps) => {
  const [bananas, setBananas] = useState<Banana[]>([]);
  const waveIdRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      setBananas([]);
      waveIdRef.current = 0;
      return;
    }

    // Function to generate a wave of bananas
    const generateWave = () => {
      const newBananas: Banana[] = [];
      const numBananas = 40; // More bananas per wave
      const waveId = waveIdRef.current++;

      for (let i = 0; i < numBananas; i++) {
        newBananas.push({
          id: waveId * 10000 + i, // Unique ID for each banana
          left: Math.random() * 100, // Random position from 0-100%
          animationDelay: Math.random() * 800, // Spread out over 0-0.8s
          animationDuration: 2000 + Math.random() * 1000, // 2-3s fall time
          size: 25 + Math.random() * 20, // Random size 25-45px
        });
      }

      return newBananas;
    };

    // Generate initial wave immediately
    setBananas(generateWave());

    // Generate new waves continuously every 800ms for seamless rain
    const interval = setInterval(() => {
      setBananas(prevBananas => {
        // Add new wave to existing bananas - NO CLEANUP, CONTINUOUS RAIN!
        return [...prevBananas, ...generateWave()];
      });
    }, 800); // New wave every 0.8 seconds for continuous effect

    return () => {
      clearInterval(interval);
      setBananas([]);
      waveIdRef.current = 0;
    };
  }, [isActive]);

  if (!isActive || bananas.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {bananas.map((banana) => (
        <div
          key={banana.id}
          className="absolute animate-bounce"
          style={{
            left: `${banana.left}%`,
            top: '-50px',
            animationDelay: `${banana.animationDelay}ms`,
            animationDuration: `${banana.animationDuration}ms`,
            animationName: 'bananaFall',
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
            animationIterationCount: '1',
          }}
        >
          <img
            src="/banana.png"
            alt="🍌"
            className="object-contain animate-spin"
            style={{
              width: `${banana.size}px`,
              height: `${banana.size}px`,
              animationDuration: '1s',
            }}
          />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes bananaFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};