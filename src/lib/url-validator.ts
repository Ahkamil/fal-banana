/**
 * URL validation utility for SSRF protection
 */

// Get allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_IMAGE_DOMAINS?.split(',').map(d => d.trim()).filter(Boolean) || [];

// Always blocked private/internal IP ranges for security
const BLOCKED_IP_RANGES = [
  /^127\./,                    // Loopback (127.0.0.0/8)
  /^10\./,                      // Private Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B (172.16.0.0/12)
  /^192\.168\./,               // Private Class C (192.168.0.0/16)
  /^169\.254\./,               // Link-local (169.254.0.0/16)
  /^::1$/,                      // IPv6 loopback
  /^fe80:/,                     // IPv6 link-local
  /^fc00:/,                     // IPv6 unique local
  /^fd00:/,                     // IPv6 unique local
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.gcp',
  'metadata',
  '0.0.0.0',
];

/**
 * Validates if a URL is safe to fetch (SSRF protection)
 * @param url - The URL to validate
 * @returns true if URL is safe, false otherwise
 */
export function isUrlSafe(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      // Blocked URL with unsafe protocol
      return false;
    }
    
    // Check against blocked hostnames
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      // Blocked URL with unsafe hostname
      return false;
    }
    
    // Check against blocked IP ranges
    if (BLOCKED_IP_RANGES.some(range => range.test(hostname))) {
      // Blocked URL with private IP
      return false;
    }
    
    // In production, only allow specific domains if configured
    if (process.env.NODE_ENV === 'production' && ALLOWED_DOMAINS.length > 0) {
      const urlOrigin = parsedUrl.origin;
      const isAllowed = ALLOWED_DOMAINS.some(domain => {
        // Allow exact match or subdomain match
        return urlOrigin === domain || urlOrigin.startsWith(domain);
      });
      
      if (!isAllowed) {
        // Blocked URL not in allowlist
        return false;
      }
    }
    
    return true;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Gets error message for unsafe URLs
 * @param url - The URL that was blocked
 * @returns Error message
 */
export function getUrlValidationError(url: string): string {
  try {
    const parsedUrl = new URL(url);
    
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return `Invalid protocol: ${parsedUrl.protocol}. Only HTTP(S) is allowed.`;
    }
    
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname) || BLOCKED_IP_RANGES.some(range => range.test(hostname))) {
      return 'Access to internal/private resources is not allowed.';
    }
    
    if (process.env.NODE_ENV === 'production' && ALLOWED_DOMAINS.length > 0) {
      return 'URL domain is not in the allowed list.';
    }
    
    return 'Invalid or unsafe URL.';
  } catch {
    return 'Invalid URL format.';
  }
}