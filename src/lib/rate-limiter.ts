import { headers } from 'next/headers';

interface RateLimitData {
  hourly: { count: number; resetAt: number };
  daily: { count: number; resetAt: number };
}

// In-memory storage for rate limits (in production, use Redis or database)
const rateLimits = new Map<string, RateLimitData>();

export async function getRateLimitKey(_request: Request): Promise<string> {
  // Get IP from headers (await for Next.js 15)
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  
  // Use IP address as key, fallback to a hash of headers
  const ip = forwardedFor?.split(',')[0] || realIp || 'anonymous';
  return `rate-limit:${ip}`;
}

export function checkRateLimit(key: string): { 
  allowed: boolean; 
  remaining: { hourly: number; daily: number };
  resetIn: { hourly: number; daily: number };
} {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // No rate limiting in development
  if (isDevelopment) {
    return {
      allowed: true,
      remaining: { hourly: 999, daily: 999 },
      resetIn: { hourly: 0, daily: 0 }
    };
  }

  const hourlyLimit = parseInt(process.env.HOURLY_LIMIT || '10');
  const dailyLimit = parseInt(process.env.DAILY_LIMIT || '40');
  
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const dayInMs = 24 * hourInMs;
  
  let data = rateLimits.get(key);
  
  if (!data) {
    data = {
      hourly: { count: 0, resetAt: now + hourInMs },
      daily: { count: 0, resetAt: now + dayInMs }
    };
    rateLimits.set(key, data);
  }
  
  // Reset counters if time has passed
  if (now > data.hourly.resetAt) {
    data.hourly = { count: 0, resetAt: now + hourInMs };
  }
  
  if (now > data.daily.resetAt) {
    data.daily = { count: 0, resetAt: now + dayInMs };
  }
  
  // Check limits
  const hourlyRemaining = Math.max(0, hourlyLimit - data.hourly.count);
  const dailyRemaining = Math.max(0, dailyLimit - data.daily.count);
  
  const allowed = hourlyRemaining > 0 && dailyRemaining > 0;
  
  // Increment counters if allowed
  if (allowed) {
    data.hourly.count++;
    data.daily.count++;
    rateLimits.set(key, data);
  }
  
  return {
    allowed,
    remaining: {
      hourly: hourlyRemaining - (allowed ? 1 : 0),
      daily: dailyRemaining - (allowed ? 1 : 0)
    },
    resetIn: {
      hourly: Math.max(0, data.hourly.resetAt - now),
      daily: Math.max(0, data.daily.resetAt - now)
    }
  };
}

export function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Cleanup old entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimits.entries()) {
    if (now > data.daily.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 60 * 60 * 1000);