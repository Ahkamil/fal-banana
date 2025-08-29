import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { isModelAllowed, getModelValidationError } from '@/lib/allowed-models';

export const maxDuration = 100; // Maximum function duration: 100 seconds
export const runtime = 'nodejs';

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
    
    // Validate workflow/model against strict allowlist
    if (!isModelAllowed(workflow)) {
      return NextResponse.json(
        { 
          error: 'Invalid workflow', 
          message: getModelValidationError()
        },
        { status: 400 }
      );
    }

    const stream = await fal.stream(workflow, { input });

    let finalResult = null;
    for await (const event of stream) {
      if (event.data) {
        finalResult = event.data;
      }
    }

    const result = await stream.done();
    
    return NextResponse.json(result || finalResult || {});
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}