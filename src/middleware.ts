import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/fal') || 
      request.nextUrl.pathname.startsWith('/api/fal-stream')) {
    
    const rateLimit = rateLimiter.check(request);
    
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toISOString();
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          resetTime,
          limit: parseInt(process.env.PLAYGROUND_RATE_LIMIT || '200')
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': process.env.PLAYGROUND_RATE_LIMIT || '200',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime,
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    const resetTime = new Date(rateLimit.resetTime).toISOString();
    
    response.headers.set('X-RateLimit-Limit', process.env.PLAYGROUND_RATE_LIMIT || '200');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime);
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
