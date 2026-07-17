import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { AccessTokenPayload, ScopedRole, UserModel, verifyAccessLikeToken } from '../utils/jwt';
import { Faculty } from '../models/Faculty';
import { Student } from '../models/Student';
import jwt from 'jsonwebtoken';

export interface AuthContext {
  userId: string;
  userModel: UserModel;
  role: ScopedRole;
  programId: string | null;
  tokenVersion: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Requires a fully-scoped access token (post role-selection). */
export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      if (!token) throw ApiError.unauthorized('Missing access token');

      let payload: AccessTokenPayload;
      try {
        payload = verifyAccessLikeToken(token) as AccessTokenPayload;
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) throw ApiError.unauthorized('Access token expired');
        throw ApiError.unauthorized('Invalid access token');
      }

      if (payload.kind !== 'access') throw ApiError.unauthorized('Role selection required');

      // Verify the current server-side token version still matches — lets us
      // invalidate all outstanding access tokens instantly (e.g. on password
      // change or forced logout) without a token blocklist.
      const currentVersion = await getCurrentTokenVersion(payload.userModel, payload.sub);
      if (currentVersion === null || currentVersion !== payload.tokenVersion) {
        throw ApiError.unauthorized('Session no longer valid, please log in again');
      }

      req.auth = {
        userId: payload.sub,
        userModel: payload.userModel,
        role: payload.role,
        programId: payload.programId,
        tokenVersion: payload.tokenVersion,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

async function getCurrentTokenVersion(userModel: UserModel, id: string): Promise<number | null> {
  if (userModel === 'Faculty') {
    const f = await Faculty.findById(id).select('refreshTokenVersion isActive').lean();
    if (!f || !f.isActive) return null;
    return f.refreshTokenVersion;
  }
  const s = await Student.findById(id).select('refreshTokenVersion').lean();
  if (!s) return null;
  return s.refreshTokenVersion;
}

/** Restricts a route to one or more scoped roles. */
export function requireRole(...roles: ScopedRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(ApiError.forbidden('This action is not permitted for your role'));
    next();
  };
}

/**
 * Ensures the resource's program matches the caller's scoped program context,
 * unless the caller is admin (global scope). `getProgramId` extracts the
 * program id belonging to the entity already loaded onto the request/response
 * path (call this after loading the entity, inside the controller, or pass a
 * param name to compare directly against the query/body).
 */
export function requireSameProgram(programIdFromRequest: (req: Request) => string | null | undefined) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (req.auth.role === 'admin') return next(); // admin is program-agnostic
    const targetProgram = programIdFromRequest(req);
    if (!targetProgram || targetProgram !== req.auth.programId) {
      return next(ApiError.forbidden('This resource is outside your current program scope'));
    }
    next();
  };
}
