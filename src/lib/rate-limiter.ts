interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetTime <= now) {
      store.delete(key)
    }
  }
}, 60_000)

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetTime <= now) {
    store.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs }
  }

  entry.count++

  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  return { allowed: true, remaining: maxAttempts - entry.count, resetTime: entry.resetTime }
}

export const loginLimiter = {
  check: (ip: string) => checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000),
}
