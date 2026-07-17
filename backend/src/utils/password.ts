import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(env.BCRYPT_COST);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Minimum password policy enforced on set/reset. Kept server-side so it can't
 * be bypassed by a modified client.
 */
export function isPasswordStrongEnough(plain: string): boolean {
  return typeof plain === 'string' && plain.length >= 8 && /[A-Za-z]/.test(plain) && /[0-9]/.test(plain);
}
