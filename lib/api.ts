const BASE = process.env.NEXT_PUBLIC_API_BASE

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('nm_token')
}

export function setToken(token: string): void {
  localStorage.setItem('nm_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('nm_token')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error('API base not configured')
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || res.statusText)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
}
