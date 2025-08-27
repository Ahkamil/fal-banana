import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Get FAL API key from environment variable
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
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Upload image to FAL storage

    // Upload the image to FAL's storage
    const uploadedUrl = await fal.storage.upload(image);
    
    // Image uploaded successfully

    return NextResponse.json({
      success: true,
      url: uploadedUrl
    });
  } catch (error: any) {
    // Upload error occurred
    return NextResponse.json(
      { 
        error: 'Failed to upload image', 
        message: error.message || 'Unknown error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}