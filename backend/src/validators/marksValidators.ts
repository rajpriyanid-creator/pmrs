import { z } from "zod";
import { objectId } from "./common";

const criterionSchema = z.object({
  label: z.string().trim().min(1).max(100),
  score: z.number().min(0).max(10),
});

export const submitMarksSchema = z.object({
  teamId: objectId,
  reviewId: objectId,
  studentId: objectId,
  criteria: z.array(criterionSchema).length(4, "Exactly 4 rubric criteria are required"),
  confirmed: z.literal(true, { errorMap: () => ({ message: "Marks must be explicitly confirmed before submit" }) }),
});
