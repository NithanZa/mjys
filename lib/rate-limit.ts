import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
    redisUrl && redisToken
        ? new Redis({ url: redisUrl, token: redisToken })
        : null;

if (!redis) {
    console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. " +
            "Rate limiting is disabled — do not run this in production without it.",
    );
}

/**
 * Named, pre-configured limiters for the auth surface. Each is scoped by
 * prefix so they don't collide with each other or with any other Redis keys.
 */
const limiters = {
    // Sign up: 5 attempts per hour per IP.
    register: redis
        ? new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(5, "1 h"),
              prefix: "ratelimit:register",
          })
        : null,
    // Login: 10 attempts per 10 minutes per IP (credential stuffing / brute force).
    login: redis
        ? new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(10, "10 m"),
              prefix: "ratelimit:login",
          })
        : null,
    // Forgot password / resend confirmation: 3 per hour per IP (email spam).
    email: redis
        ? new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(3, "1 h"),
              prefix: "ratelimit:email",
          })
        : null,
    // Password reset submission: 5 per hour per IP.
    resetPassword: redis
        ? new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(5, "1 h"),
              prefix: "ratelimit:reset-password",
          })
        : null,
} as const;

export type RateLimitBucket = keyof typeof limiters;

/**
 * Best-effort extraction of the client IP behind common proxies/CDNs.
 */
function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }
    return "unknown";
}

/**
 * Checks the rate limit for the given bucket + request IP. Returns a
 * NextResponse (429) if the caller should be blocked, or null to continue.
 *
 * If Redis is not configured, this is a no-op (fails open) so local/dev
 * environments without Upstash configured still work.
 */
export async function checkRateLimit(
    request: NextRequest,
    bucket: RateLimitBucket,
    identifier?: string,
): Promise<NextResponse | null> {
    const limiter = limiters[bucket];
    if (!limiter) {
        return null;
    }

    const ip = getClientIp(request);
    const key = identifier ? `${ip}:${identifier.toLowerCase()}` : ip;

    const { success, limit, remaining, reset } = await limiter.limit(key);

    if (!success) {
        const retryAfterSeconds = Math.max(
            0,
            Math.ceil((reset - Date.now()) / 1000),
        );
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": String(limit),
                    "X-RateLimit-Remaining": String(remaining),
                    "Retry-After": String(retryAfterSeconds),
                },
            },
        );
    }

    return null;
}
