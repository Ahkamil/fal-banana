import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';
import { isUrlSafe, getUrlValidationError } from '@/lib/url-validator';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY environment variable is not set');
}

fal.config({
  credentials: FAL_KEY,
});

// Function to create a merged image using Sharp
async function createMergedImage(personImageUrl: string, objectImageUrl: string): Promise<string> {
  try {
    let personBuf: Buffer;
    let objectBuf: Buffer;
    
    // Check if URLs are base64 data URLs or regular URLs
    if (personImageUrl.startsWith('data:')) {
      // It's a base64 data URL
      const personBase64 = personImageUrl.split(',')[1];
      if (!personBase64) throw new Error('Invalid person base64 data URL');
      personBuf = Buffer.from(personBase64, 'base64');
    } else if (personImageUrl.startsWith('http')) {
      // It's a regular URL, validate and fetch the image
      if (!isUrlSafe(personImageUrl)) {
        throw new Error(`Person image URL blocked: ${getUrlValidationError(personImageUrl)}`);
      }
      // Fetching person image from URL
      const personResponse = await fetch(personImageUrl);
      if (!personResponse.ok) throw new Error(`Failed to fetch person image: ${personResponse.statusText}`);
      const personArrayBuffer = await personResponse.arrayBuffer();
      personBuf = Buffer.from(personArrayBuffer);
    } else {
      throw new Error('Invalid person image URL format');
    }
    
    if (objectImageUrl.startsWith('data:')) {
      // It's a base64 data URL
      const objectBase64 = objectImageUrl.split(',')[1];
      if (!objectBase64) throw new Error('Invalid object base64 data URL');
      objectBuf = Buffer.from(objectBase64, 'base64');
    } else if (objectImageUrl.startsWith('http')) {
      // It's a regular URL, validate and fetch the image
      if (!isUrlSafe(objectImageUrl)) {
        throw new Error(`Object image URL blocked: ${getUrlValidationError(objectImageUrl)}`);
      }
      // Fetching object image from URL
      const objectResponse = await fetch(objectImageUrl);
      if (!objectResponse.ok) throw new Error(`Failed to fetch object image: ${objectResponse.statusText}`);
      const objectArrayBuffer = await objectResponse.arrayBuffer();
      objectBuf = Buffer.from(objectArrayBuffer);
    } else {
      throw new Error('Invalid object image URL format');
    }

    // Try to get metadata first to debug the issue
    try {
      await sharp(personBuf).metadata();
      await sharp(objectBuf).metadata();
    } catch {
    }

    let personProcessed: Buffer;
    let objectProcessed: Buffer;

    try {
      // Process person image (left side - 400x400)
      personProcessed = await sharp(personBuf)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Process object image (right side - 400x400)  
      objectProcessed = await sharp(objectBuf)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toBuffer();

    } catch {
      const personBase64 = personBuf.toString('base64');
      return `data:image/jpeg;base64,${personBase64}`;
    }

    // Create merged image (800x400)
    const mergedBuffer = await sharp({
      create: {
        width: 800,
        height: 400,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: personProcessed, left: 0, top: 0 },
      { input: objectProcessed, left: 400, top: 0 }
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

    // Convert to base64 for return
    const mergedBase64 = mergedBuffer.toString('base64');
    return `data:image/jpeg;base64,${mergedBase64}`;

  } catch (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personImageUrl, objectImageUrl } = body;

    if (!personImageUrl || !objectImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: personImageUrl and objectImageUrl' },
        { status: 400 }
      );
    }

    try {
      // Step 1: Create merged image
      const mergedImageData = await createMergedImage(personImageUrl, objectImageUrl);
      
      const base64Data = mergedImageData.split(',')[1];
      const binaryData = Buffer.from(base64Data, 'base64');
      const file = new File([binaryData], 'merged-image.jpg', { type: 'image/jpeg' });
      
      const mergedImageUrl = await fal.storage.upload(file);
      
      const combinedPrompt = `This image shows a person on the LEFT and a separate object on the RIGHT. The person should be holding/using the object from the RIGHT side, not whatever they may already have. Generate a prompt for the LEFT person to hold/use the RIGHT object. Format: "[person description] [action with RIGHT object]". Example: "This woman holding this bottle". Only the RIGHT object matters.`;

      const stream = await fal.stream("fal-ai/any-llm/vision", {
        input: {
          prompt: combinedPrompt,
          system_prompt: "IGNORE anything the person on LEFT already has. Focus only on the separate object on the RIGHT side. Generate prompt for LEFT person to hold/use the RIGHT object. Format: '[person] [action] [RIGHT object]'. Keep under 6 words.",
          priority: "latency",
          model: "google/gemini-25-flash",
          image_url: mergedImageUrl
        }
      });

      let generatedPrompt = '';
      for await (const event of stream) {
        if (event.type === 'message' && event.data) {
          generatedPrompt += event.data;
        }
      }
      
      const result = await stream.done();
      generatedPrompt = result.output || generatedPrompt || 'Person holding and using the object in a natural pose';

      return NextResponse.json({
        success: true,
        prompt: generatedPrompt,
        personImageUrl,
        objectImageUrl
      });

    } catch {
      const promptTemplates = [
        "Person holding and showcasing the object in a natural, professional pose with good lighting",
        "Person using the object in an everyday, realistic setting with natural lighting",
        "Person wearing/carrying the object in a stylish, advertising-style pose",
        "Person demonstrating the object in a clean, studio-like environment",
        "Person posed naturally with the object, showing it in use"
      ];
      
      const randomTemplate = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
      
      return NextResponse.json({
        success: true,
        prompt: randomTemplate,
        personImageUrl,
        objectImageUrl,
        fallback: true
      });
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Merge and analyze failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.toString() : 'Unknown error'
      },
      { status: 500 }
    );
  }
}