import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { Config } from "../models/Config";
import { recordAudit } from "../services/auditService";

export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await Config.getSingleton());
});

/** Admin-only global settings: team size caps, guide caps, review/guide-selection windows (Section 6.18). */
export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
  const cfg = await Config.getSingleton();
  Object.assign(cfg, req.body);
  await cfg.save();
  await recordAudit(req, "config.update", "Config", String(cfg._id), req.body);
  return ok(res, cfg);
});
