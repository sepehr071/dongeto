// ponytail: in-memory rate limit, redis if multi-instance
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const start = now - windowMs;
  const prev = (hits.get(key) ?? []).filter((t) => t > start);
  if (prev.length >= max) {
    hits.set(key, prev);
    return false;
  }
  prev.push(now);
  hits.set(key, prev);
  return true;
}
