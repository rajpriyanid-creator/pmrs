import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/auditService';
import { notify } from '../services/notificationService';
import { Team } from '../models/Team';

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const teamId = req.query.teamId as string;
  if (!teamId) throw ApiError.badRequest('teamId is required');
  const reviews = await Review.find({ teamId }).sort({ createdAt: 1 }).lean();
  res.json({ reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, type, scheduledDate, scheduledTime, durationMinutes } = req.body;
  const existing = await Review.findOne({ teamId, type });
  if (existing) throw ApiError.conflict('This review stage already exists for the team — use PATCH to update it');

  const review = await Review.create({
    teamId,
    type,
    scheduledDate: scheduledDate ?? null,
    scheduledTime: scheduledTime ?? null,
    durationMinutes: durationMinutes ?? null,
    hasMarks: type !== 'review0',
  });
  await recordAudit(req.auth!, 'create', 'Review', review._id, { type });
  res.status(201).json({ review });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { scheduledDate, scheduledTime, durationMinutes, closed } = req.body;

  const review = await Review.findByIdAndUpdate(
    id,
    { scheduledDate, scheduledTime, durationMinutes, ...(closed !== undefined ? { closed } : {}) },
    { new: true, runValidators: true }
  );
  if (!review) throw ApiError.notFound('Review not found');

  await recordAudit(req.auth!, 'update', 'Review', review._id, req.body);

  const team = await Team.findById(review.teamId);
  if (team && scheduledDate) {
    for (const studentId of team.students) {
      await notify('Student', studentId.toString(), 'review:scheduled', `${review.type.toUpperCase()} scheduled for team "${team.name}".`);
    }
  }
  res.json({ review });
});
