import { getRedis } from '../config/redis';
import { logger } from '../config/logger';

const DEFAULT_TTL_SECONDS = 60;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    logger.warn(`cacheGet failed for ${key}: ${(err as Error).message}`);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`cacheSet failed for ${key}: ${(err as Error).message}`);
  }
}

/** Invalidate every key under a prefix (e.g. "allocations:programId:*"). Write-driven, not time-driven. */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });
    const pipeline = redis.pipeline();
    let queued = 0;
    for await (const keys of stream) {
      for (const key of keys as string[]) {
        pipeline.del(key);
        queued++;
      }
    }
    if (queued > 0) await pipeline.exec();
  } catch (err) {
    logger.warn(`cacheInvalidatePrefix failed for ${prefix}: ${(err as Error).message}`);
  }
}

export async function cacheWrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
