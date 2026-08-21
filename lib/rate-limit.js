const WINDOW_MS = 60_000;
const LIMIT = 10;
const MAX_BUCKETS = 5000;

const buckets = globalThis.__awarenessReportRateBuckets || new Map();
globalThis.__awarenessReportRateBuckets = buckets;

export function reportClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export function checkReportBurstLimit(key, now = Date.now()) {
  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
  }
  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= LIMIT,
    limit: LIMIT,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
