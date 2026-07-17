import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { GuideRequest } from "../models/GuideRequest";
import { Faculty } from "../models/Faculty";
import { Team } from "../models/Team";
import { Program } from "../models/Program";
import { Notification } from "../models/Notification";
import { emitNotificationNew } from "../config/socket";
import { recordAudit } from "../services/auditService";

export const listMyGuideRequests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const requests = await GuideRequest.find({ guideId: req.auth.sub }).populate("teamId", "name").sort({ createdAt: -1 }).lean();
  return ok(res, requests);
});

export const createGuideRequest = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, guideId } = req.body;
  const existing = await GuideRequest.findOne({ teamId, status: "pending" });
  if (existing) throw ApiError.conflict("This team already has a pending guide request");

  const team = await Team.findById(teamId).lean();
  if (!team) throw ApiError.notFound("Team not found");

  const request = await GuideRequest.create({ teamId, guideId, program: team.program, status: "pending" });
  await Notification.create({ userId: guideId, userModel: "Faculty", type: "guideRequest:accepted", message: `New guide request from team "${team.name}"` });
  emitNotificationNew(String(guideId), { type: "guideRequest:new", teamId });
  return ok(res, request, 201);
});

/** Two independent UG/PG counters per guide (Section 6.4) - never a merged number. */
export const getGuideLimits = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const faculty = await Faculty.findById(req.auth.sub).lean();
  if (!faculty) throw ApiError.notFound();

  const ugPrograms = await Program.find({ type: "UG" }).select("_id").lean();
  const pgPrograms = await Program.find({ type: "PG" }).select("_id").lean();

  const acceptedUg = await GuideRequest.countDocuments({ guideId: faculty._id, status: "accepted", program: { $in: ugPrograms.map((p) => p._id) } });
  const acceptedPg = await GuideRequest.countDocuments({ guideId: faculty._id, status: "accepted", program: { $in: pgPrograms.map((p) => p._id) } });

  return ok(res, {
    ug: { accepted: acceptedUg, cap: faculty.guideLimits.ug, remaining: Math.max(0, faculty.guideLimits.ug - acceptedUg) },
    pg: { accepted: acceptedPg, cap: faculty.guideLimits.pg, remaining: Math.max(0, faculty.guideLimits.pg - acceptedPg) },
  });
});

export const decideGuideRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { status } = req.body as { status: "accepted" | "rejected" };
  const request = await GuideRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound("Guide request not found");
  if (String(request.guideId) !== String(req.auth.sub)) throw ApiError.forbidden("Not your request to decide");
  if (request.status !== "pending") throw ApiError.conflict("Request already decided");

  if (status === "accepted") {
    const faculty = await Faculty.findById(request.guideId).lean();
    const program = await Program.findById(request.program).lean();
    if (!faculty || !program) throw ApiError.notFound();

    const cap = program.type === "UG" ? faculty.guideLimits.ug : faculty.guideLimits.pg;
    const acceptedCount = await GuideRequest.countDocuments({
      guideId: faculty._id, status: "accepted",
      program: { $in: (await Program.find({ type: program.type }).select("_id").lean()).map((p) => p._id) },
    });
    if (acceptedCount >= cap) throw ApiError.conflict(`Guide capacity reached for ${program.type}`);

    await Team.findByIdAndUpdate(request.teamId, { guideId: faculty._id, status: "active" });
  }

  request.status = status;
  await request.save();

  const team = await Team.findById(request.teamId).lean();
  if (team) {
    for (const studentId of team.students) {
      await Notification.create({
        userId: studentId, userModel: "Student",
        type: status === "accepted" ? "guideRequest:accepted" : "guideRequest:rejected",
        message: `Your guide request was ${status}`,
      });
      emitNotificationNew(String(studentId), { type: `guideRequest:${status}` });
    }
  }

  await recordAudit(req, "guideRequest.decide", "GuideRequest", req.params.id, { status });
  return ok(res, request);
});
