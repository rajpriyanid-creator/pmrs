import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Availability } from "../models/Availability";
import { autoGenerateSchedule } from "../services/schedulerService";
import { scheduleJobQueue } from "../queues/queues";
import { recordAudit } from "../services/auditService";

export const submitAvailability = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const { reviewPeriodStart, reviewPeriodEnd, availableSlots } = req.body;
  const userRole = req.auth.role === "panel" ? "panel" : "guide";

  const availability = await Availability.findOneAndUpdate(
    { userId: req.auth.sub, reviewPeriodStart, reviewPeriodEnd },
    { availableSlots, userRole },
    { upsert: true, new: true },
  );
  await recordAudit(req, "availability.submit", "Availability", String(availability._id));
  return ok(res, availability);
});

export const getMyAvailability = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const records = await Availability.find({ userId: req.auth.sub }).lean();
  return ok(res, records);
});

/**
 * Queues background auto-schedule generation for a program+review-type
 * (Section 6.14) - runs off the request thread; the coordinator receives a
 * `schedule:generated` socket event with per-team results when it finishes.
 */
export const requestAutoSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.body as { program: string };
  const reviewType = (req.query.reviewType as string) ?? "review1";
  const job = await scheduleJobQueue.add("auto-generate", { program, reviewType });
  await recordAudit(req, "schedule.autoGenerate.enqueue", "Program", program, { reviewType });
  return ok(res, { jobId: job.id, status: "queued" }, 202);
});

/** Synchronous variant for small programs / dev environments without a running worker. */
export const runAutoScheduleSync = asyncHandler(async (req: Request, res: Response) => {
  const { program } = req.body as { program: string };
  const reviewType = (req.query.reviewType as any) ?? "review1";
  const results = await autoGenerateSchedule(program, reviewType);
  await recordAudit(req, "schedule.autoGenerate.sync", "Program", program, { reviewType, results: results.length });
  return ok(res, { results });
});
