import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { checkRateLimit, getRateLimitKey, formatTimeRemaining } from '@/lib/rate-limiter';

// Get FAL API key from environment variable
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY environment variable is not set');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, input, customApiKey } = body;

    if (!model || !input) {
      return NextResponse.json(
        { error: 'Missing model or input' },
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

    // Call FAL AI with subscribe for real-time updates
    const result = await fal.subscribe(model, {
      input,
      logs: false
    });
    
    // Include rate limit info only if using default key
    const response = {
      data: result.data || result
    };
    
    if (!customApiKey) {
      const rateLimitKey = await getRateLimitKey(request);
      const currentLimits = checkRateLimit(rateLimitKey);
      return NextResponse.json({
        ...response,
        limits: {
          hourly: { remaining: currentLimits.remaining.hourly },
          daily: { remaining: currentLimits.remaining.daily }
        }
      });
    }
    
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}