import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    if (NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    // Development-only convenience: ephemeral secret so `npm run dev` works
    // immediately after cloning. Tokens will invalidate on restart. Never
    // relied upon in production — see the check above.
    // eslint-disable-next-line no-console
    console.warn(`[env] ${name} not set — generating an ephemeral dev secret. Set it in .env for production.`);
    return crypto.randomBytes(32).toString('hex');
  }
  return value;
}

export const env = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGO_URI: required('MONGO_URI', 'mongodb://127.0.0.1:27017/prms'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  REDIS_URL: process.env.REDIS_URL || '',
  BCRYPT_COST: parseInt(process.env.BCRYPT_COST || '12', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  COOKIE_SECURE: (process.env.COOKIE_SECURE || 'false') === 'true',
  ADMIN_SEED_USERNAME: process.env.ADMIN_SEED_USERNAME || 'admin',
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD || 'ChangeMe123!',
  // SMTP (optional — if absent, emails are logged to console in dev)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
};

export const isProd = env.NODE_ENV === 'production';
