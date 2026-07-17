import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

/**
 * Redis is optional at runtime. In production it should always be configured
 * (see Section 3 of the spec: caching + BullMQ + Socket.IO adapter), but the
 * app must still boot and function correctly for local/dev use without it —
 * caching and background queueing simply fall back to no-op / synchronous
 * behavior in that case.
 */
export let redis: Redis | null = null;

export function initRedis(): Redis | null {
  if (!env.REDIS_URL) {
    logger.warn('REDIS_URL not set — running without Redis cache/queue (dev fallback mode)');
    return null;
  }
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  redis.on('connect', () => logger.info('Redis connected'));
  redis.connect().catch((err) => {
    logger.error(`Redis connection failed, continuing without cache: ${err.message}`);
    redis = null;
  });
  return redis;
}

export function getRedis(): Redis | null {
  return redis;
}
