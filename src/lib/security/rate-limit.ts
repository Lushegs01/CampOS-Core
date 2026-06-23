import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/db/redis";

interface RateLimitConfig {
  requests: number;
  window: number; // seconds
}

const DEFAULT_LIMIT: RateLimitConfig = { requests: 100, window: 60 };

const STRICT_LIMIT: RateLimitConfig = { requests: 5, window: 60 };

const API_LIMITS: Record<string, RateLimitConfig> = {
  "/api/auth/login": { requests: 5, window: 60 },
  "/api/auth/register": { requests: 3, window: 300 },
  "/api/auth/forgot-password": { requests: 3, window: 300 },
  "/api/auth/reset-password": { requests: 3, window: 300 },
  "/api/auth/refresh": { requests: 10, window: 60 },
};

/**
 * Rate limit by identifier string.
 * Uses Redis sorted sets with sliding window.
 */
export async function rateLimit(
  identifier: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const { requests, window } = config || DEFAULT_LIMIT;
  const key = `rate_limit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, now - window);

    // Add current request
    const member = `${now}-${Math.random().toString(36).slice(2)}`;
    await redis.zadd(key, { score: now, member });

    // Set expiry on the key
    await redis.expire(key, window);

    // Count requests in current window
    const count = await redis.zcard(key);

    const allowed = count <= requests;
    const remaining = Math.max(0, requests - count);
    const reset = now + window;

    return { allowed, remaining, reset };
  } catch (error) {
    // If Redis fails, allow the request (fail open for availability)
    console.error("Rate limiter Redis error:", error);
    return { allowed: true, remaining: 0, reset: now + window };
  }
}

/**
 * Next.js middleware-compatible rate limiter.
 * Returns a NextResponse with 429 if rate limited, null otherwise.
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Only rate limit API routes
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  // Get the strictest applicable limit
  const config = API_LIMITS[pathname] || DEFAULT_LIMIT;

  // Build identifier: IP + path
  const ip =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const identifier = `${ip}:${pathname}`;

  const { allowed, remaining, reset } = await rateLimit(identifier, config);

  if (!allowed) {
    const response = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Limit", String(config.requests));
    response.headers.set("X-RateLimit-Remaining", String(0));
    response.headers.set("X-RateLimit-Reset", String(reset));
    return response;
  }

  return null; // Continue to next middleware/handler
}

/**
 * Institution-scoped rate limiter for sensitive operations.
 * Prevents one institution from consuming all API quota.
 */
export async function rateLimitByInstitution(
  institutionId: string,
  operation: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const identifier = `inst_rate_limit:${institutionId}:${operation}`;
  return rateLimit(identifier, config || { requests: 1000, window: 60 });
}

/**
 * User-scoped rate limiter for API keys.
 */
export async function rateLimitByApiKey(
  apiKeyId: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const identifier = `apikey_rate_limit:${apiKeyId}`;
  return rateLimit(identifier, config || { requests: 1000, window: 60 });
}

/**
 * Get rate limit headers for a successful request.
 */
export function getRateLimitHeaders(
  remaining: number,
  limit: number,
  reset: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}
