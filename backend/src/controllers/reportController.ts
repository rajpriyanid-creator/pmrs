import type { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { FinalReport } from "../models/FinalReport";
import { Team } from "../models/Team";
import { Notification } from "../models/Notification";
import { emitNotificationNew } from "../config/socket";
import { recordAudit } from "../services/auditService";

/** Final report upload (student) + guide approval (Section 6.16). File stored under a random, non-guessable key. */
export const uploadFinalReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const { teamId } = req.body;

  const dest = path.join("uploads", "reports", `${crypto.randomUUID()}${path.extname(req.file.originalname)}`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.rename(req.file.path, dest);

  const report = await FinalReport.findOneAndUpdate(
    { teamId },
    { filePath: dest, fileName: req.file.originalname, uploadedBy: req.auth.sub, status: "uploaded" },
    { upsert: true, new: true },
  );

  const team = await Team.findById(teamId).lean();
  if (team?.guideId) {
    await Notification.create({ userId: team.guideId, userModel: "Faculty", type: "report:approved", message: `Final report uploaded for team "${team.name}"` });
    emitNotificationNew(String(team.guideId), { type: "report:uploaded", teamId });
  }

  await recordAudit(req, "finalReport.upload", "FinalReport", String(report._id));
  return ok(res, report, 201);
});

export const approveFinalReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const report = await FinalReport.findOneAndUpdate(
    { teamId: req.params.teamId },
    { status: "approved", approvedBy: req.auth.sub },
    { new: true },
  );
  if (!report) throw ApiError.notFound("No final report on file for this team");

  await recordAudit(req, "finalReport.approve", "FinalReport", String(report._id));
  return ok(res, report);
});

export const getFinalReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await FinalReport.findOne({ teamId: req.params.teamId }).lean();
  if (!report) throw ApiError.notFound("No final report on file for this team");
  return ok(res, report);
});
