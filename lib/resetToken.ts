import { randomBytes, createHash } from 'crypto'

/** Generate a cryptographically random 64-char hex token to send in the email. */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

/** SHA-256 hash the raw token for storage — never store the raw token in the DB. */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Token lifetime: 1 hour */
export const RESET_TOKEN_TTL_SECS = 60 * 60

export function resetTokenExpiresAt(): number {
  return Math.floor(Date.now() / 1000) + RESET_TOKEN_TTL_SECS
}
