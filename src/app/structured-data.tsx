export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI Image Transformation Studio",
    "description": "AI-powered image transformation and editing tool",
    "url": "https://fal.ai",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "FAL.ai",
      "url": "https://fal.ai"
    },
    "featureList": [
      "AI Portrait Transformation",
      "Weather Effects",
      "Object Holding",
      "Style Transfer",
      "Real-time Preview"
    ],
    "screenshot": "https://fal.ai/og-image.png",
    "softwareVersion": "1.0.0"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
