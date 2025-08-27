interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly limit: number;
  private readonly windowMs: number = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(limit: number = 200) {
    this.limit = limit;
  }

  private getClientId(request: Request): string {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    // Use the first available IP, fallback to a default
    const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
    return ip.trim();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  check(request: Request): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();
    
    const clientId = this.getClientId(request);
    const now = Date.now();
    
    let entry = this.store.get(clientId);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      entry = {
        count: 0,
        resetTime: now + this.windowMs
      };
    }
    
    if (entry.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    // Increment count
    entry.count++;
    this.store.set(clientId, entry);
    
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      resetTime: entry.resetTime
    };
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter(
  parseInt(process.env.PLAYGROUND_RATE_LIMIT || '200')
);

export { rateLimiter };
