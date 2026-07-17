import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getPagination, paginated } from '../utils/pagination';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const filter = { userId: req.auth!.userId, userModel: req.auth!.userModel };
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Notification.countDocuments(filter),
  ]);
  res.json(paginated(items, total, pagination));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.auth!.userId, userModel: req.auth!.userModel },
    { read: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.json({ notification });
});
