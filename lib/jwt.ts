import { SignJWT, jwtVerify } from 'jose'

const EXPIRES_IN = '7d'
export const COOKIE_NAME = 'nm_token'

export interface JWTPayload {
  userId: number
  email: string
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return { userId: payload.userId as number, email: payload.email as string }
}
