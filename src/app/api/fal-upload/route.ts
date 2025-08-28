import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

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
    let uploadedUrl: string;

    // Check if the image is a base64 data URL
    if (image.startsWith('data:')) {
      // Extract the base64 data and convert to File
      const base64Data = image.split(',')[1];
      const mimeType = image.match(/data:([^;]+);/)?.[1] || 'image/png';
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension from mime type
      const extension = mimeType.split('/')[1] || 'png';
      const timestamp = Date.now();
      const fileName = `upload_${timestamp}.${extension}`;
      
      // Create a File object from the buffer
      const file = new File([buffer], fileName, { type: mimeType });
      
      // Upload the file to FAL's storage
      uploadedUrl = await fal.storage.upload(file);
    } else {
      // If it's already a URL or other format, upload directly
      uploadedUrl = await fal.storage.upload(image);
    }
    
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