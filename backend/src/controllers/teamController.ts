import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, paginated } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Team } from "../models/Team";
import { TeamInvite } from "../models/TeamInvite";
import { Config } from "../models/Config";
import { Program } from "../models/Program";
import { Notification } from "../models/Notification";
import { emitNotificationNew } from "../config/socket";
import { recordAudit } from "../services/auditService";

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const filter: Record<string, unknown> = {};
  if (req.query.program) filter.program = req.query.program;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Team.find(filter).populate("students", "name rollNo").populate("guideId", "name").skip((page - 1) * limit).limit(limit).lean(),
    Team.countDocuments(filter),
  ]);
  return paginated(res, items, { page, limit, total });
});

/** Team size of 1 is valid end-to-end (Section 6.3). */
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, program, studentIds } = req.body;
  const cfg = await Config.getSingleton();
  const programDoc = await Program.findById(program).lean();
  if (!programDoc) throw ApiError.badRequest("Unknown program");

  if (!cfg.teamFormationOpen) throw ApiError.conflict("Team formation is currently closed");

  const maxSize = programDoc.type === "UG" ? cfg.ugMaxTeamSize : cfg.pgMaxTeamSize;
  if (studentIds.length > maxSize) throw ApiError.badRequest(`Team exceeds max size of ${maxSize} for this program`);

  const team = await Team.create({ name, program, students: studentIds, size: studentIds.length, status: "forming" });
  await recordAudit(req, "team.create", "Team", String(team._id));
  return ok(res, team, 201);
});

/** Symmetric invite flow (6.3): works identically regardless of who initiates. */
export const inviteToTeam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { toStudentId } = req.body;
  const team = await Team.findById(req.params.teamId).lean();
  if (!team) throw ApiError.notFound("Team not found");
  if (team.status === "locked") throw ApiError.conflict("Team is locked - cannot invite further members");

  const invite = await TeamInvite.create({ teamId: team._id, fromStudent: req.auth.sub, toStudent: toStudentId, status: "pending" });

  await Notification.create({ userId: toStudentId, userModel: "Student", type: "invite:sent", message: `You've been invited to join team "${team.name}"` });
  emitNotificationNew(toStudentId, { type: "invite:sent", teamId: team._id });

  return ok(res, invite, 201);
});

export const respondToInvite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { inviteId, action } = req.body;
  const invite = await TeamInvite.findById(inviteId);
  if (!invite) throw ApiError.notFound("Invite not found");
  if (String(invite.toStudent) !== String(req.auth.sub)) throw ApiError.forbidden("Not your invite to respond to");
  if (invite.status !== "pending") throw ApiError.conflict("Invite already resolved");

  invite.status = action === "accept" ? "accepted" : "declined";
  await invite.save();

  if (action === "accept") {
    await Team.findByIdAndUpdate(invite.teamId, { $addToSet: { students: invite.toStudent }, $inc: { size: 1 } });
  }

  await Notification.create({
    userId: invite.fromStudent, userModel: "Student",
    type: action === "accept" ? "invite:accepted" : "invite:declined",
    message: `Your team invite was ${invite.status}`,
  });
  emitNotificationNew(String(invite.fromStudent), { type: `invite:${invite.status}` });

  return ok(res, invite);
});

/** One-directional lock (6.3): once initiated, no peer counter-action can reverse it. */
export const lockTeam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const team = await Team.findById(req.body.teamId);
  if (!team) throw ApiError.notFound("Team not found");
  if (team.status === "locked") throw ApiError.conflict("Team is already locked");

  team.status = "locked";
  team.lockInitiatedBy = req.auth.sub as any;
  team.lockConfirmedAt = new Date();
  await team.save();

  for (const studentId of team.students) {
    await Notification.create({ userId: studentId, userModel: "Student", type: "team:locked", message: `Team "${team.name}" has been locked` });
    emitNotificationNew(String(studentId), { type: "team:locked", teamId: team._id });
  }

  return ok(res, team);
});

/** Bulk destructive operations - danger zone, double-confirm required client-side (Section 6.18). */
export const bulkDeleteTeams = asyncHandler(async (req: Request, res: Response) => {
  const result = await Team.deleteMany({});
  await recordAudit(req, "team.bulkDelete", "Team", undefined, { deletedCount: result.deletedCount });
  return ok(res, { deletedCount: result.deletedCount });
});

export const bulkDeleteSoloTeams = asyncHandler(async (req: Request, res: Response) => {
  const result = await Team.deleteMany({ size: 1 });
  await recordAudit(req, "team.bulkDeleteSolo", "Team", undefined, { deletedCount: result.deletedCount });
  return ok(res, { deletedCount: result.deletedCount });
});
