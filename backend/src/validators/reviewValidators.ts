import { z } from "zod";
import { objectId } from "./common";
import { REVIEW_ORDER } from "../models/Review";

export const scheduleReviewSchema = z.object({
  teamId: objectId,
  type: z.enum(REVIEW_ORDER as [string, ...string[]]),
  scheduledDate: z.coerce.date(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(5).max(240),
});

export const updateReviewSchema = scheduleReviewSchema.partial().extend({
  closed: z.boolean().optional(),
});
