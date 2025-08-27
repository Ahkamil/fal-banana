'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/playground');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <img 
          src="/banana-banner.png" 
          alt="GPU Rich Banana - Redirecting" 
          className="w-full max-w-2xl mx-auto animate-pulse"
        />
        <p className="mt-4 text-gray-600 text-lg font-medium">Loading playground...</p>
      </div>
    </div>
  );
}