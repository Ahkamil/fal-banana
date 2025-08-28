import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { isUrlSafe, getUrlValidationError } from '@/lib/url-validator';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

// Get FAL API key from environment variable
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY environment variable is not set');
}

fal.config({
  credentials: FAL_KEY,
});

// Function to fetch image as buffer with URL validation
async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  // Validate URL for SSRF protection
  if (!isUrlSafe(url)) {
    throw new Error(`URL blocked: ${getUrlValidationError(url)}`);
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Function to merge two images side by side using HTML5 Canvas
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mergeImages(personImageUrl: string, objectImageUrl: string): Promise<string> {
  try {
    // Download images
    const [personBuffer, objectBuffer] = await Promise.all([
      fetchImageAsBuffer(personImageUrl),
      fetchImageAsBuffer(objectImageUrl)
    ]);

 
    const personBase64 = `data:image/jpeg;base64,${personBuffer.toString('base64')}`;
    const objectBase64 = `data:image/jpeg;base64,${objectBuffer.toString('base64')}`;

   
    return personImageUrl; // We'll analyze both separately but provide combined prompt

  } catch (error) {
    // Error merging images, will analyze separately
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

    // Analyze images with Vision LLM

    try {
      // Create a combined prompt for vision analysis
      const combinedPrompt = `I see two images - a person and an object. The person should be holding, wearing, or using this object. Please generate a detailed prompt for an AI image generator that describes how the person would naturally interact with this object. Focus on realistic pose, natural interaction, and good composition. Example: "Woman in black outfit holding and showcasing brown leather handbag in professional advertising pose with studio lighting". Only provide the prompt text, no additional commentary.

Image 1: Person
Image 2: Object to be held/used

Generate a prompt for: Person holding/using the object naturally.`;

      // Analyze combined scene
      const stream = await fal.stream("fal-ai/any-llm/vision", {
        input: {
          prompt: combinedPrompt,
          system_prompt: "You are an expert at creating detailed prompts for AI image generation. Analyze the person and object images. Create a single, detailed prompt that describes the person holding, using, or wearing the object in a natural and realistic way. Only provide the prompt text, no additional commentary or formatting.",
          priority: "latency",
          model: "openai/gpt-4-vision-preview",
          image_url: personImageUrl
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

      // Return generated prompt

      return NextResponse.json({
        success: true,
        prompt: generatedPrompt,
        personImageUrl,
        objectImageUrl
      });

    } catch {
      // Vision analysis failed, use fallback
      
      // Fallback to template-based approach
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

  } catch (error: any) {
    // Vision analysis error
    
    return NextResponse.json(
      { 
        error: 'Vision analysis failed', 
        message: error.message || 'Unknown error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}