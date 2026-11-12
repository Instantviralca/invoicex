import { logger } from "@/lib/logger";

export type RateLimitBucket =
  | "login"
  | "register"
  | "reset"
  | "contact"
  | "email"
  | "checkout"
  | "publicQuote";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const RATE_LIMIT_CONFIG: Record<RateLimitBucket, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  register: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  reset: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  contact: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  email: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  checkout: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  publicQuote: { windowMs: 15 * 60 * 1000, maxRequests: 30 },
};

type SlidingWindowEntry = {
  timestamps: number[];
};

const store = new Map<string, SlidingWindowEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    const bucket = key.split(":")[0] as RateLimitBucket;
    const config = RATE_LIMIT_CONFIG[bucket];
    if (!config) {
      store.delete(key);
      continue;
    }

    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < config.windowMs,
    );

    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export type RateLimitSuccess = {
  success: true;
  remaining: number;
  resetAt: Date;
  limit: number;
};

export type RateLimitFailure = {
  success: false;
  remaining: 0;
  resetAt: Date;
  retryAfterSeconds: number;
  limit: number;
};

export type RateLimitResult = RateLimitSuccess | RateLimitFailure;

function buildKey(bucket: RateLimitBucket, identifier: string): string {
  return `${bucket}:${identifier}`;
}

export function rateLimit(
  bucket: RateLimitBucket,
  identifier: string,
): RateLimitResult {
  const config = RATE_LIMIT_CONFIG[bucket];
  const now = Date.now();
  const key = buildKey(bucket, identifier);

  cleanupExpiredEntries(now);

  const entry = store.get(key) ?? { timestamps: [] };
  const windowStart = now - config.windowMs;

  entry.timestamps = entry.timestamps.filter(
    (timestamp) => timestamp >= windowStart,
  );

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0] ?? now;
    const resetAt = new Date(oldest + config.windowMs);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((resetAt.getTime() - now) / 1000),
    );

    logger.warn(
      { bucket, identifier: hashIdentifier(identifier), retryAfterSeconds },
      "Rate limit exceeded",
    );

    return {
      success: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
      limit: config.maxRequests,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.timestamps.length);
  const resetAt = new Date(now + config.windowMs);

  return {
    success: true,
    remaining,
    resetAt,
    limit: config.maxRequests,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };

  if (!result.success) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function rateLimitResponse(result: RateLimitFailure): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...getRateLimitHeaders(result),
      },
    },
  );
}

function hashIdentifier(identifier: string): string {
  return identifier.length > 8
    ? `${identifier.slice(0, 3)}…${identifier.slice(-3)}`
    : "[redacted]";
}

export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
