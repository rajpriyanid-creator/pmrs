import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { randomUUID } from "node:crypto";
import { Faculty } from "../models/Faculty";
import { Student } from "../models/Student";
import { Program } from "../models/Program";

/**
 * Program-aware role & login system (Section 6.1). After username/password
 * login, the client calls this with the pre-auth token to see the
 * role x program combinations available to this faculty member:
 *  - guide(program): shown for EVERY program, unconditionally (always-open role)
 *  - coordinator(program) / panel(program): shown only where currently assigned
 */
export const listAvailableRoles = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();

  const student = await Student.findById(req.auth.sub).lean();
  if (student) {
    return ok(res, { roles: [{ role: "student", program: String(student.program) }] });
  }

  const faculty = await Faculty.findById(req.auth.sub).lean();
  if (!faculty) throw ApiError.notFound("Account not found");

  const allPrograms = await Program.find().lean();
  const roles: { role: string; program: string; programName: string }[] = [];

  // Guide: always visible for every program, for every faculty member.
  for (const p of allPrograms) {
    roles.push({ role: "guide", program: String(p._id), programName: p.name });
  }
  // Coordinator / Panel: only where an active assignment exists.
  for (const a of faculty.isCoordinatorFor) {
    if (a.teamIds.length > 0) {
      const p = allPrograms.find((x) => String(x._id) === String(a.program));
      if (p) roles.push({ role: "coordinator", program: String(p._id), programName: p.name });
    }
  }
  for (const a of faculty.isPanelFor) {
    if (a.teamIds.length > 0) {
      const p = allPrograms.find((x) => String(x._id) === String(a.program));
      if (p) roles.push({ role: "panel", program: String(p._id), programName: p.name });
    }
  }
  for (const programId of faculty.assistantFor) {
    const p = allPrograms.find((x) => String(x._id) === String(programId));
    if (p) roles.push({ role: "assistant", program: String(p._id), programName: p.name });
  }

  return ok(res, { roles });
});

/** Exchanges the pre-auth token + a chosen role x program for a fully-scoped access token. */
export const selectRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { role, program } = req.body as { role: string; program?: string };

  const faculty = await Faculty.findById(req.auth.sub).lean();
  if (!faculty) throw ApiError.forbidden("Only faculty accounts select role x program contexts");

  const isAllowed =
    role === "guide" ||
    (role === "coordinator" && faculty.isCoordinatorFor.some((a) => String(a.program) === program && a.teamIds.length > 0)) ||
    (role === "panel" && faculty.isPanelFor.some((a) => String(a.program) === program && a.teamIds.length > 0)) ||
    (role === "assistant" && faculty.assistantFor.some((p) => String(p) === program));

  if (!isAllowed) throw ApiError.forbidden("You do not hold this role for this program");

  const accessToken = signAccessToken({
    sub: String(faculty._id),
    role: role as any,
    program,
    memberType: faculty.memberType ?? undefined,
    tokenVersion: faculty.tokenVersion,
  });
  const refreshToken = signRefreshToken({ sub: String(faculty._id), tokenVersion: faculty.tokenVersion, jti: randomUUID() });
  return ok(res, { accessToken, refreshToken, role, program });
});
