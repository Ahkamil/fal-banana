import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import StructuredData from "./structured-data";
import { Analytics } from "@vercel/analytics/next"

// Focal Web - Main font for everything (from FAL.AI)
const focalWeb = localFont({
  src: [
    // Light weights
    {
      path: '../../public/font/Focal-Light-Web.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-LightItalic-Web.otf',
      weight: '300',
      style: 'italic',
    },
    // Regular weights
    {
      path: '../../public/font/Focal-Regular-Web.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-RegularItalic-Web.otf',
      weight: '400',
      style: 'italic',
    },
    // Medium weights
    {
      path: '../../public/font/Focal-Medium-Web.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-MediumItalic-Web.otf',
      weight: '500',
      style: 'italic',
    },
    // Semibold weights (using Medium as fallback)
    {
      path: '../../public/font/Focal-Medium-Web.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-MediumItalic-Web.otf',
      weight: '600',
      style: 'italic',
    },
    // Bold weights
    {
      path: '../../public/font/Focal-Bold-Web.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-BoldItalic-Web.otf',
      weight: '700',
      style: 'italic',
    },
    // Extrabold weights
    {
      path: '../../public/font/Focal-Extrabold-Web.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-ExtraboldItalic-Web.otf',
      weight: '800',
      style: 'italic',
    },
    // Black weights
    {
      path: '../../public/font/Focal-Black-Web.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../../public/font/Focal-BlackItalic-Web.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-focal-web',
  display: 'swap',
});

// Focal Web Mono - For code blocks (using Medium Italic as monospace alternative)
const focalWebMono = localFont({
  src: [
    {
      path: '../../public/font/Focal-MediumItalic-Web.otf',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-focal-web-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "AI Image Studio - Powered by FAL.ai",
    template: "%s | AI Image Studio"
  },
  description: "Transform images with AI-powered effects. Apply weather changes, portrait transformations, object interactions, and more using cutting-edge AI technology by FAL.ai.",
  keywords: [
    "AI image transformation",
    "portrait editor",
    "weather effects",
    "AI photo editing",
    "style transfer",
    "FAL.ai demo",
    "image manipulation",
    "AI-powered effects",
    "photo transformation",
    "AI portrait",
    "image generation",
    "visual effects",
    "AI studio"
  ],
  authors: [{ name: "FAL.ai" }],
  creator: "FAL.ai",
  publisher: "FAL.ai",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://fal.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fal.ai',
    title: 'AI Image Studio - Powered by FAL.ai',
    description: 'Transform images with AI-powered effects. Apply weather changes, portrait transformations, object interactions, and more using cutting-edge AI technology by FAL.ai.',
    siteName: 'AI Image Studio',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Image Studio - Powered by FAL.ai',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Image Studio - Powered by FAL.ai',
    description: 'Transform images with AI-powered effects. Apply weather changes, portrait transformations, object interactions, and more using cutting-edge AI technology by FAL.ai.',
    images: ['/og-image.png'],
    creator: '@fal_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${focalWeb.variable} ${focalWebMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#8553FF" />
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-focal">
        <StructuredData />
        <Analytics />
        {children}
      
      </body>
    </html>
  );
}