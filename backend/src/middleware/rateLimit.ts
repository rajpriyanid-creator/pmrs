import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redis";

const buildStore = () =>
  new RedisStore({
    // @ts-expect-error - ioredis call signature is compatible at runtime
    sendCommand: (...args: string[]) => redis.call(...args),
  });

/** Generic API-wide limiter: blunts scraping and accidental thundering herds. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore(),
});

/** Tight limiter on login to blunt credential stuffing. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore(),
  message: { success: false, error: "Too many login attempts. Try again later." },
});

/** Very tight limiter on OTP request/verify (Section 6.17 / 10) - blunts brute force and spam. */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore(),
  message: { success: false, error: "Too many OTP attempts. Try again later." },
});
