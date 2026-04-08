type BucketEntry = {
  count: number;
  windowStart: number;
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

// In-memory store: suitable for single-instance only.
// For multi-instance production use, replace with a distributed store
// such as Upstash Redis (@upstash/ratelimit).
const buckets = new Map<string, BucketEntry>();

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterMs: number };

export const checkRateLimit = (key: string): RateLimitResult => {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { limited: false };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
    return { limited: true, retryAfterMs };
  }

  entry.count += 1;
  return { limited: false };
};
