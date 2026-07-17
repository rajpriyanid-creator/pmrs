import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { ReviewPanel } from "../models/ReviewPanel";
import { VivaPanel } from "../models/VivaPanel";
import { Notification } from "../models/Notification";
import { emitNotificationNew } from "../config/socket";
import { recordAudit } from "../services/auditService";

// ---- Review Panels (Admin-assigned, per-review, cap 4 - Section 6.8) ----

export const listReviewPanels = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.program) filter.program = req.query.program;
  const panels = await ReviewPanel.find(filter).populate("memberIds", "name").populate("coordinatorId", "name").populate("teamIds", "name").lean();
  return ok(res, panels);
});

export const upsertReviewPanel = asyncHandler(async (req: Request, res: Response) => {
  const { program, coordinatorId, memberIds, teamIds } = req.body;
  if (memberIds.length > 4) throw ApiError.badRequest("A review panel may have at most 4 members");

  const panel = await ReviewPanel.findOneAndUpdate(
    { program, coordinatorId },
    { memberIds, teamIds },
    { upsert: true, new: true },
  );

  for (const memberId of memberIds) {
    await Notification.create({ userId: memberId, userModel: "Faculty", type: "panel:formed", message: "You've been assigned to a review panel" });
    emitNotificationNew(String(memberId), { type: "panel:formed" });
  }

  await recordAudit(req, "reviewPanel.upsert", "ReviewPanel", String(panel._id), req.body);
  return ok(res, panel);
});

// ---- Viva Panels (Coordinator-owned, prefilled + constrained - Section 6.8) ----

export const getMyVivaPanel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const reviewPanel = await ReviewPanel.findOne({ coordinatorId: req.auth.sub, program: req.auth.program }).lean();

  let vivaPanel = await VivaPanel.findOne({ coordinatorId: req.auth.sub, program: req.auth.program });
  if (!vivaPanel) {
    // Auto-prefill on first access: every internal member from the
    // coordinator's Review Panel, plus the coordinator - all locked.
    vivaPanel = await VivaPanel.create({
      program: req.auth.program,
      coordinatorId: req.auth.sub,
      internalMembers: [...(reviewPanel?.memberIds ?? []), req.auth.sub],
      externalMembers: [],
      teamIds: reviewPanel?.teamIds ?? [],
    });
  }
  return ok(res, await vivaPanel.populate([{ path: "internalMembers", select: "name" }, { path: "teamIds", select: "name" }]));
});

/** Coordinator's only edit rights: add/remove external members - internal members and self are locked (6.8). */
export const updateMyVivaPanel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { addExternal, removeExternalEmails } = req.body as {
    addExternal: { name: string; affiliation: string; email: string }[];
    removeExternalEmails: string[];
  };

  const panel = await VivaPanel.findOne({ coordinatorId: req.auth.sub, program: req.auth.program });
  if (!panel) throw ApiError.notFound("Viva panel not found - call GET first to auto-initialize it");

  panel.externalMembers = panel.externalMembers.filter((m) => !removeExternalEmails.includes(m.email));
  for (const ext of addExternal) {
    if (!panel.externalMembers.some((m) => m.email === ext.email)) panel.externalMembers.push(ext);
  }
  await panel.save();

  await recordAudit(req, "vivaPanel.update", "VivaPanel", String(panel._id), { addExternal, removeExternalEmails });
  return ok(res, panel);
});
