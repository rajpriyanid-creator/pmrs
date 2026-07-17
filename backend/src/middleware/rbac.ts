import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import type { ScopedRole } from "../utils/jwt";

export function requireRole(...roles: ScopedRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(ApiError.forbidden(`Requires role: ${roles.join(", ")}`));
    next();
  };
}

export function requireSameProgram(getRequestedProgram: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (req.auth.role === "admin" || req.auth.role === "assistant") return next();

    const requested = getRequestedProgram(req);
    if (requested && req.auth.programId && requested !== req.auth.programId) {
      return next(ApiError.forbidden("Program mismatch for this login context"));
    }
    next();
  };
}
