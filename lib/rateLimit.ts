const WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const MAX_ATTEMPTS = 5

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function checkRateLimit(ip: string): { limited: boolean; retryAfterSecs: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { limited: false, retryAfterSecs: 0 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { limited: true, retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { limited: false, retryAfterSecs: 0 }
}
