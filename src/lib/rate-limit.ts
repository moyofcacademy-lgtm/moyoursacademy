/**
 * In-memory sliding-window rate limiter. Suitable for a single-instance
 * deployment; swap the store for Upstash/Redis if the app scales out.
 */

type Bucket = { timestamps: number[] };

const store = new Map<string, Bucket>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = store.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  store.set(key, bucket);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (store.size > MAX_KEYS) {
    for (const [k, b] of store) {
      if (b.timestamps.every((t) => now - t >= windowMs)) store.delete(k);
      if (store.size <= MAX_KEYS / 2) break;
    }
  }

  return { ok: true, remaining: limit - bucket.timestamps.length, retryAfterSeconds: 0 };
}

export const LIMITS = {
  enrollSubmit: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5/hour/IP
  uploadSignature: { limit: 20, windowMs: 60 * 60 * 1000 },
  login: { limit: 5, windowMs: 15 * 60 * 1000 }, // lockout after repeated failures
  statusCheck: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;
