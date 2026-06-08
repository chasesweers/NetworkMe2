/**
 * Edge-runtime-safe JWT utilities.
 * No Node.js-specific imports — safe to use in middleware.
 * Full cryptographic verification lives in lib/jwt.ts (Node.js only).
 */

export const COOKIE_NAME = 'nm_token'

export interface JWTPayloadEdge {
  userId?: number
  email?: string
  isAdmin?: boolean
}

/**
 * Decode a JWT payload without signature verification.
 * Used in middleware for routing decisions only — API routes always
 * perform full cryptographic verification via verifyToken (lib/jwt.ts).
 */
export function decodeTokenPayload(token: string): JWTPayloadEdge | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // base64url → standard base64, then decode
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(parts[1].length + (4 - (parts[1].length % 4)) % 4, '=')
    const payload = JSON.parse(atob(base64))
    return {
      userId: typeof payload.userId === 'number' ? payload.userId : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      isAdmin: payload.isAdmin === true,
    }
  } catch {
    return null
  }
}
