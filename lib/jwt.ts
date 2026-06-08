import jwt from 'jsonwebtoken'

const EXPIRES_IN = '7d'
export const COOKIE_NAME = 'nm_token'

export interface JWTPayload {
  userId: number
  email: string
  isAdmin: boolean
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return secret
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, getSecret()) as JWTPayload & { iat?: number; exp?: number }
  return {
    userId: decoded.userId,
    email: decoded.email,
    isAdmin: decoded.isAdmin ?? false,
  }
}
