import { z } from "zod";
import { objectId } from "./common";

export const submitAttendanceSchema = z.object({
  teamId: objectId,
  reviewId: objectId.optional(), // required when kind === "review"
  kind: z.enum(["review", "semester"]),
  reviewDate: z.coerce.date().optional(),
  reviewTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  perStudent: z
    .array(z.object({ studentId: objectId, present: z.boolean() }))
    .min(1),
}).refine((v) => v.kind !== "review" || Boolean(v.reviewId), {
  message: "reviewId is required for review-kind attendance",
  path: ["reviewId"],
});
