import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

// Configure FAL client with API key
fal.config({
  credentials: process.env.FAL_KEY
});

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { workflow, input } = body;

    if (!workflow || !input) {
      return NextResponse.json(
        { error: 'Missing workflow or input' },
        { status: 400 }
      );
    }

    // Stream the FAL AI response
    const stream = await fal.stream(workflow, { input });

    let finalResult = null;
    for await (const event of stream) {
      console.log('Stream event:', event);
      if (event.data) {
        finalResult = event.data;
      }
    }

    const result = await stream.done();
    
    return NextResponse.json(result || finalResult || {});
  } catch (error: unknown) {
    console.error('FAL Stream API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}