import { z } from "zod";
import { objectId } from "./common";

export const batchAssignmentSchema = z.object({
  program: objectId,
  updates: z
    .array(
      z.object({
        teamId: objectId,
        guideId: objectId.nullable().optional(),
        panelMemberIds: z.array(objectId).max(4).optional(),
        coordinatorId: objectId.nullable().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export const autoAssignSchema = z.object({
  program: objectId,
});
