import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Generates a random numeric OTP and its SHA-256 hash for storage. */
export function generateOtp(): { otp: string; hash: string; expiresAt: Date } {
  const otp = String(Math.floor(Math.random() * 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  return { otp, hash, expiresAt };
}

/** Hashes a plain OTP for comparison with the stored hash. */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/** Verifies the submitted OTP against the stored hash and expiry. */
export function verifyOtp(plain: string, storedHash: string, expiresAt: Date): boolean {
  if (Date.now() > expiresAt.getTime()) return false;
  const hash = hashOtp(plain);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}
