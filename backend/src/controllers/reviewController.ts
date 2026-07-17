import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Review, REVIEW_ORDER } from "../models/Review";
import { assertPrerequisiteComplete, findSchedulingClash } from "../services/schedulerService";
import { Team } from "../models/Team";
import { ReviewPanel } from "../models/ReviewPanel";
import { recordAudit } from "../services/auditService";

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.teamId) filter.teamId = req.query.teamId;
  const reviews = await Review.find(filter).sort({ teamId: 1 }).lean();

  // Ensure the full Review 0->Viva sequence exists for any team queried
  // (creates missing "pending" placeholders lazily) so the Review Rail
  // always has all 5 nodes to render, even before any scheduling happens.
  if (req.query.teamId) {
    const existingTypes = new Set(reviews.map((r) => r.type));
    for (let i = 0; i < REVIEW_ORDER.length; i++) {
      const type = REVIEW_ORDER[i];
      if (!existingTypes.has(type)) {
        const created = await Review.create({
          teamId: req.query.teamId,
          type,
          hasMarks: type !== "review0",
        });
        reviews.push(created.toObject());
      }
    }
    reviews.sort((a, b) => REVIEW_ORDER.indexOf(a.type) - REVIEW_ORDER.indexOf(b.type));
  }

  return ok(res, reviews);
});

/** Schedules a review instance, enforcing prerequisite gating and clash detection (6.5 / 6.14). */
export const scheduleReview = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, type, scheduledDate, scheduledTime, durationMinutes } = req.body;

  await assertPrerequisiteComplete(teamId, type);

  const team = await Team.findById(teamId).lean();
  if (!team) throw ApiError.notFound("Team not found");
  const panel = await ReviewPanel.findOne({ teamIds: teamId }).lean();
  const facultyIds = [team.guideId, ...(panel?.memberIds ?? [])].filter(Boolean) as any[];

  const [h, m] = scheduledTime.split(":").map(Number);
  const start = new Date(scheduledDate);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const clash = await findSchedulingClash({ facultyIds, start, end });
  if (clash) throw ApiError.conflict("Scheduling clash detected with an existing review commitment", clash);

  const review = await Review.findOneAndUpdate(
    { teamId, type },
    {
      scheduledDate, scheduledTime, durationMinutes,
      hasMarks: type !== "review0",
    },
    { upsert: true, new: true },
  );

  await recordAudit(req, "review.schedule", "Review", String(review._id), req.body);
  return ok(res, review, 201);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!review) throw ApiError.notFound("Review not found");
  await recordAudit(req, "review.update", "Review", req.params.id, req.body);
  return ok(res, review);
});
