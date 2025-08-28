import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { checkRateLimit, getRateLimitKey, formatTimeRemaining } from '@/lib/rate-limiter';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

// Get FAL API key from environment variable
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY environment variable is not set');
}

// Convert base64 to Blob
function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Detect mime type from base64 prefix or default to png
  let mimeType = 'image/png';
  if (base64.startsWith('data:')) {
    const matches = base64.match(/^data:([^;]+);/);
    if (matches && matches[1]) {
      mimeType = matches[1];
    }
  }
  
  return new Blob([bytes], { type: mimeType });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, image_url, object_image_url, num_images = 1, customApiKey } = body;

    // Validate required fields
    if (!prompt || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and image_url' },
        { status: 400 }
      );
    }

    // Use custom API key if provided, otherwise use default
    const apiKey = customApiKey || FAL_KEY;
    
    // Configure FAL with the appropriate key
    fal.config({
      credentials: apiKey
    });

    // Only check rate limiting if using default API key
    if (!customApiKey) {
      const rateLimitKey = await getRateLimitKey(request);
      const rateLimitCheck = checkRateLimit(rateLimitKey);
      
      if (!rateLimitCheck.allowed) {
        const resetTime = rateLimitCheck.resetIn.hourly < rateLimitCheck.resetIn.daily
          ? formatTimeRemaining(rateLimitCheck.resetIn.hourly)
          : formatTimeRemaining(rateLimitCheck.resetIn.daily);
        
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: `You've reached your generation limit. Try again in ${resetTime}.`,
            limits: {
              hourly: { remaining: rateLimitCheck.remaining.hourly, resetIn: formatTimeRemaining(rateLimitCheck.resetIn.hourly) },
              daily: { remaining: rateLimitCheck.remaining.daily, resetIn: formatTimeRemaining(rateLimitCheck.resetIn.daily) }
            }
          },
          { status: 429 }
        );
      }
    }

    // Process the request

    let imageToProcess = image_url;
    let objectImageToProcess = object_image_url;
    
    // Process primary image (person) if it's base64
    if (image_url.startsWith('data:')) {
      // Upload person image to FAL storage
      try {
        const blob = base64ToBlob(image_url);
        const timestamp = Date.now();
        const extension = blob.type.split('/')[1] || 'png';
        const fileName = `person_${timestamp}.${extension}`;
        const file = new File([blob], fileName, { type: blob.type });
        
        imageToProcess = await fal.storage.upload(file);
        // Person image uploaded successfully
      } catch {
        // Upload failed
        return NextResponse.json(
          { error: 'Failed to upload person image' },
          { status: 500 }
        );
      }
    }

    // Process object image if provided and if it's base64
    if (object_image_url && object_image_url.startsWith('data:')) {
      // Upload object image to FAL storage
      try {
        const blob = base64ToBlob(object_image_url);
        const timestamp = Date.now();
        const extension = blob.type.split('/')[1] || 'png';
        const fileName = `object_${timestamp}.${extension}`;
        const file = new File([blob], fileName, { type: blob.type });
        
        objectImageToProcess = await fal.storage.upload(file);
        // Object image uploaded successfully
      } catch {
        // Upload failed
        return NextResponse.json(
          { error: 'Failed to upload object image' },
          { status: 500 }
        );
      }
    }

    // Prepare image URLs array
    const imageUrls = [imageToProcess];
    if (objectImageToProcess) {
      imageUrls.push(objectImageToProcess);
    }

    // Process images with FAL API

    // Call FAL API
    try {
      const result = await fal.subscribe("fal-ai/gemini-25-flash-image/edit", {
        input: {
          prompt: prompt,
          image_urls: imageUrls,
          num_images: num_images
        },
        logs: false
      });

      // Transformation complete
      
      // Extract images from result
      let images = [];
      const resultData = result as any;
      
      if (resultData.data?.images && Array.isArray(resultData.data.images)) {
        images = resultData.data.images;
      } else if (resultData.data?.image) {
        images = Array.isArray(resultData.data.image) ? resultData.data.image : [resultData.data.image];
      } else if (resultData.images && Array.isArray(resultData.images)) {
        images = resultData.images;
      } else if (resultData.image) {
        images = Array.isArray(resultData.image) ? resultData.image : [resultData.image];
      }
      
      if (images.length === 0) {
        // No images in response
        return NextResponse.json(
          { error: 'No images generated' },
          { status: 500 }
        );
      }

      // Ensure all images have proper URL structure
      const processedImages = images.map((img: any) => {
        if (typeof img === 'string') {
          return { url: img };
        }
        return img;
      });

      // Build response
      const response: any = {
        success: true,
        images: processedImages,
        requestId: resultData.requestId
      };

      // Add rate limits if using default key
      if (!customApiKey) {
        const rateLimitKey = await getRateLimitKey(request);
        const currentLimits = checkRateLimit(rateLimitKey);
        response.limits = {
          hourly: { remaining: currentLimits.remaining.hourly },
          daily: { remaining: currentLimits.remaining.daily }
        };
      }

      return NextResponse.json(response);

    } catch (falError) {
      // FAL API error occurred
      const error = falError as any;
      
      // Check for specific error types
      if (error.status === 422) {
        return NextResponse.json(
          { error: 'Invalid request - check image format' },
          { status: 422 }
        );
      }
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'FAL API error', message: error.message || 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    // Request error occurred
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process request', message: errorMessage },
      { status: 500 }
    );
  }
}