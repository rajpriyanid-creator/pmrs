import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AccessTokenPayload } from '../utils/jwt';

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  if (env.REDIS_URL) {
    try {
      const pubClient = new Redis(env.REDIS_URL);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter attached (multi-instance ready)');
    } catch (err) {
      logger.warn(`Socket.IO Redis adapter unavailable, running single-instance: ${(err as Error).message}`);
    }
  } else {
    logger.warn('Socket.IO running single-instance (no REDIS_URL) — fine for dev, configure Redis in production');
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Missing auth token'));
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
      if (payload.kind !== 'access') return next(new Error('Invalid token'));
      socket.data.userId = payload.sub;
      socket.data.userModel = payload.userModel;
      next();
    } catch {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const room = `${socket.data.userModel}:${socket.data.userId}`;
    socket.join(room);
    logger.debug(`Socket connected: ${room}`);
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitToUser(userModel: 'Faculty' | 'Student', userId: string, event: string, payload: unknown): void {
  io?.to(`${userModel}:${userId}`).emit(event, payload);
}
