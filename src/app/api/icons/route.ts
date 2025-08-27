import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const iconsDirectory = path.join(process.cwd(), 'public', 'icons');
    const files = fs.readdirSync(iconsDirectory);
    
    // Filter only SVG files and remove extension
    const iconNames = files
      .filter(file => file.endsWith('.svg'))
      .map(file => file.replace('.svg', ''))
      .sort();
    
    return NextResponse.json({ 
      icons: iconNames,
      total: iconNames.length 
    });
  } catch (error) {
    console.error('Error reading icons directory:', error);
    return NextResponse.json({ 
      icons: [],
      total: 0,
      error: 'Failed to load icons' 
    }, { status: 500 });
  }
}