import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, paginated } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Notification } from "../models/Notification";

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const [items, total] = await Promise.all([
    Notification.find({ userId: req.auth.sub }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments({ userId: req.auth.sub }),
  ]);
  return paginated(res, items, { page, limit, total });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  const notif = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.auth.sub }, { read: true }, { new: true });
  if (!notif) throw ApiError.notFound("Notification not found");
  return ok(res, notif);
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized();
  await Notification.updateMany({ userId: req.auth.sub, read: false }, { read: true });
  return ok(res, { updated: true });
});
