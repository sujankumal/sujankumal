/**
 * High-performance, zero-dependency in-memory sliding window rate limiter.
 * Designed for Next.js Edge & Node runtime environments without external Redis dependency.
 */

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimiterOptions {
  windowMs: number; // Duration of window in milliseconds
  maxRequests: number; // Max allowed requests within windowMs
  maxTrackedKeys?: number; // LRU cap to protect server memory (default: 10,000)
}

export class InMemoryRateLimiter {
  private hits = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;
  private maxTrackedKeys: number;
  private lastCleanup: number = Date.now();

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxTrackedKeys = options.maxTrackedKeys ?? 10000;
  }

  /**
   * Performs automated periodic purge of expired timestamp records.
   */
  private cleanup(now: number): void {
    // Only run purge at most once every 30 seconds
    if (now - this.lastCleanup < 30000) return;
    this.lastCleanup = now;

    const expiryThreshold = now - this.windowMs;
    for (const [key, record] of this.hits.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > expiryThreshold);
      if (record.timestamps.length === 0) {
        this.hits.delete(key);
      }
    }

    // Safety guard for memory: if map still exceeds cap, drop oldest keys
    if (this.hits.size > this.maxTrackedKeys) {
      const keysToDelete = Array.from(this.hits.keys()).slice(
        0,
        this.hits.size - this.maxTrackedKeys
      );
      for (const k of keysToDelete) {
        this.hits.delete(k);
      }
    }
  }

  /**
   * Checks if key is within rate limits. Returns remaining allowance and retry info.
   */
  public check(key: string): {
    success: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
    retryAfterSeconds?: number;
  } {
    const now = Date.now();
    this.cleanup(now);

    const windowStart = now - this.windowMs;
    let record = this.hits.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.hits.set(key, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestActive = record.timestamps[0];
      const resetMs = oldestActive + this.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetMs,
        retryAfterSeconds,
      };
    }

    // Record this hit
    record.timestamps.push(now);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - record.timestamps.length),
      resetMs: this.windowMs,
    };
  }
}

/**
 * Extracts the real client IP address from standard proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0];
    if (firstIp) return firstIp.trim();
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  return '127.0.0.1';
}

// Global pre-configured rate limiters
// 1. General API: 120 requests per minute
export const globalApiRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
});

// 2. Strict Auth & Mutation Limiter: 10 attempts per minute (stops brute-force & credential-stuffing bursts)
export const authRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
});
