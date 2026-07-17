import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import type { Role } from "../utils/jwt";

/**
 * Role/program authorization is enforced here, server-side, on every
 * protected route (Security Considerations, Section 10) - never trust a
 * client-sent role or program claim. Role+program come exclusively from the
 * verified JWT payload set by requireAuth().
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(ApiError.forbidden(`Requires role: ${roles.join(", ")}`));
    next();
  };
}

/**
 * For program-scoped roles (coordinator/panel/guide/student), ensures the
 * `program` route/query/body param (whichever the caller specifies) matches
 * the program embedded in the caller's token. Admin/assistant bypass this
 * (assistant may be assigned across programs; admin sees all).
 */
export function requireSameProgram(getRequestedProgram: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (req.auth.role === "admin" || req.auth.role === "assistant") return next();

    const requested = getRequestedProgram(req);
    if (requested && req.auth.program && requested !== req.auth.program) {
      return next(ApiError.forbidden("Program mismatch for this login context"));
    }
    next();
  };
}
