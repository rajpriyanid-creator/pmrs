import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./env";
import { logger } from "./logger";
import { createRedisConnection } from "./redis";
import { verifyAccessToken } from "../utils/jwt";

let io: SocketIOServer | undefined;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  const pubClient = createRedisConnection();
  const subClient = createRedisConnection();
  io.adapter(createAdapter(pubClient, subClient));

  // Every socket must present a valid short-lived access token. Anonymous
  // sockets are rejected outright rather than allowed to connect and then
  // filtered.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Unauthorized: no token"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      socket.data.program = payload.program;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Scope every socket to rooms it's authorized to hear from:
    // per-user notifications, and per-program/team broadcast rooms.
    socket.join(`user:${socket.data.userId}`);
    if (socket.data.program) socket.join(`program:${socket.data.program}`);

    socket.on("join:team", (teamId: string) => {
      if (typeof teamId === "string" && /^[a-f0-9]{24}$/i.test(teamId)) {
        socket.join(`team:${teamId}`);
      }
    });

    socket.on("disconnect", () => {
      logger.debug({ userId: socket.data.userId }, "socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO not initialized - call initSocket() first");
  return io;
}

// Typed emit helpers matching the event map in the API spec (Section 8).
export const emitNotificationNew = (userId: string, payload: unknown) =>
  getIO().to(`user:${userId}`).emit("notification:new", payload);

export const emitAttendanceUpdated = (teamId: string, payload: unknown) =>
  getIO().to(`team:${teamId}`).emit("attendance:updated", payload);

export const emitMarksPublished = (teamId: string, payload: unknown) =>
  getIO().to(`team:${teamId}`).emit("marks:published", payload);

export const emitAllocationUpdated = (program: string, payload: unknown) =>
  getIO().to(`program:${program}`).emit("allocation:updated", payload);

export const emitScheduleGenerated = (program: string, payload: unknown) =>
  getIO().to(`program:${program}`).emit("schedule:generated", payload);

export const emitDocumentGenerated = (userId: string, payload: unknown) =>
  getIO().to(`user:${userId}`).emit("document:generated", payload);
