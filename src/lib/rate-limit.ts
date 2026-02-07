const windowMs = 60_000; // 1-minute window

const hits = new Map<string, number[]>();

// Evict stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) hits.delete(key);
    else hits.set(key, valid);
  }
}, 5 * 60_000).unref();

/**
 * In-memory sliding-window rate limiter.
 * Returns { limited: true, retryAfter } when the limit is exceeded.
 */
export function rateLimit(
  key: string,
  maxRequests: number
): { limited: false } | { limited: true; retryAfter: number } {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { limited: true, retryAfter };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { limited: false };
}

/** Extract a stable identifier for rate-limiting from a request. */
export function rateLimitKey(req: Request, action: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim() ?? "unknown";
  return `${action}:${ip}`;
}

/** Helper: check rate limit and return a 429 Response if exceeded, or null. */
export function checkRateLimit(
  req: Request,
  action: string,
  maxRequests: number
): Response | null {
  const key = rateLimitKey(req, action);
  const result = rateLimit(key, maxRequests);
  if (result.limited) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }
  return null;
}
