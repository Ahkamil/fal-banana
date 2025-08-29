import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY environment variable is not set');
}

fal.config({
  credentials: FAL_KEY,
});


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
          model: "google/gemini-25-flash",
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
        error: 'Vision analysis failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.toString() : 'Unknown error'
      },
      { status: 500 }
    );
  }
}