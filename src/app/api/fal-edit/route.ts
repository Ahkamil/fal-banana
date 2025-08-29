import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { checkRateLimit, getRateLimitKey, formatTimeRemaining } from '@/lib/rate-limiter';
import { isModelAllowed, getModelValidationError } from '@/lib/allowed-models';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY environment variable is not set');
}


export async function POST(request: NextRequest) {
  try {
    // Check request size before processing (allow up to 8MB for two images)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 8 * 1024 * 1024) {
      return NextResponse.json(
        { 
          error: 'Request too large. Please compress your images before uploading. Maximum total size is 8MB.',
          tip: 'Images are automatically compressed on the client side. If you still see this error, try uploading smaller images.'
        },
        { status: 413 }
      );
    }
    
    const body = await request.json();
    const { model, prompt, image_url, object_image_url, num_images = 1, customApiKey } = body;
    
    // Additional check for base64 image sizes (allow 4MB per image)
    if (image_url && image_url.startsWith('data:')) {
      const imageSizeBytes = (image_url.length * 3) / 4;
      if (imageSizeBytes > 4 * 1024 * 1024) {
        return NextResponse.json(
          { 
            error: 'Person image is too large. Maximum size is 4MB after compression.',
            currentSize: `${(imageSizeBytes / (1024 * 1024)).toFixed(2)}MB`
          },
          { status: 413 }
        );
      }
    }
    
    if (object_image_url && object_image_url.startsWith('data:')) {
      const objectSizeBytes = (object_image_url.length * 3) / 4;
      if (objectSizeBytes > 4 * 1024 * 1024) {
        return NextResponse.json(
          { 
            error: 'Object image is too large. Maximum size is 4MB after compression.',
            currentSize: `${(objectSizeBytes / (1024 * 1024)).toFixed(2)}MB`
          },
          { status: 413 }
        );
      }
    }

    // Validate required fields
    if (!model || !prompt || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: model, prompt and image_url' },
        { status: 400 }
      );
    }
    
    // Validate model against strict allowlist
    if (!isModelAllowed(model)) {
      return NextResponse.json(
        { 
          error: 'Invalid model', 
          message: getModelValidationError()
        },
        { status: 400 }
      );
    }

    // Use custom API key if provided, otherwise use default
    const apiKey = customApiKey || FAL_KEY;
    
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
    if (image_url && image_url.startsWith('data:')) {
      try {
        // Extract base64 data
        const base64Data = image_url.split(',')[1];
        const mimeType = image_url.match(/data:([^;]+);/)?.[1] || 'image/png';
        
        // Convert to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create file for upload
        const timestamp = Date.now();
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `person_${timestamp}.${extension}`;
        const file = new File([buffer], fileName, { type: mimeType });
        
        imageToProcess = await fal.storage.upload(file);
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'Failed to upload person image',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Process object image if provided and if it's base64
    if (object_image_url && object_image_url.startsWith('data:')) {
      try {
        // Extract base64 data
        const base64Data = object_image_url.split(',')[1];
        const mimeType = object_image_url.match(/data:([^;]+);/)?.[1] || 'image/png';
        
        // Convert to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create file for upload
        const timestamp = Date.now();
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `object_${timestamp}.${extension}`;
        const file = new File([buffer], fileName, { type: mimeType });
        
        objectImageToProcess = await fal.storage.upload(file);
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'Failed to upload object image',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Prepare image URLs array
    const imageUrls = [imageToProcess];
    if (objectImageToProcess) {
      imageUrls.push(objectImageToProcess);
    }

    try {
      // Use the model provided in the request (already validated to contain "gemini-25")
      const result = await fal.subscribe(model, {
        input: {
          prompt: prompt,
          image_urls: imageUrls,
          num_images: num_images
        },
        logs: false
      });

      // Extract images from result
      let images = [];
      const resultData = result as { data?: { images?: unknown[]; image?: unknown | unknown[] }; images?: unknown[]; image?: unknown | unknown[]; requestId?: string };
      
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
        return NextResponse.json(
          { error: 'No images generated' },
          { status: 500 }
        );
      }

      // Ensure all images have proper URL structure
      const processedImages = images.map((img: unknown) => {
        if (typeof img === 'string') {
          return { url: img };
        }
        return img;
      });

      // Build response
      const response: Record<string, unknown> = {
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
      const error = falError as { status?: number; message?: string };
      
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process request', message: errorMessage },
      { status: 500 }
    );
  }
}