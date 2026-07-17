import { z } from "zod";
import { objectId } from "./common";

export const submitAvailabilitySchema = z.object({
  reviewPeriodStart: z.coerce.date(),
  reviewPeriodEnd: z.coerce.date(),
  availableSlots: z
    .array(z.object({ startTime: z.coerce.date(), endTime: z.coerce.date() }))
    .min(1)
    .max(100),
}).refine((v) => v.reviewPeriodStart < v.reviewPeriodEnd, {
  message: "reviewPeriodStart must be before reviewPeriodEnd",
  path: ["reviewPeriodEnd"],
});

export const autoGenerateScheduleSchema = z.object({
  program: objectId,
});

export const generateForTeamSchema = z.object({
  teamId: objectId,
  reviewId: objectId,
  scheduledDate: z.coerce.date(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(5).max(240),
});
