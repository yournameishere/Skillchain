const buckets = globalThis.__skillchainRateLimits || new Map();
globalThis.__skillchainRateLimits = buckets;

export function rateLimit(request, limit = 10, windowMs = 60000) {
  const forwarded = request.headers['x-forwarded-for'];
  const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) { buckets.set(ip, { count: 1, resetAt: now + windowMs }); return true; }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
