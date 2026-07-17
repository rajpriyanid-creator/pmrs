import { z } from "zod";
import { objectId } from "./common";

export const createReviewPanelSchema = z.object({
  program: objectId,
  coordinatorId: objectId,
  memberIds: z.array(objectId).max(4, "A review panel may have at most 4 members"),
  teamIds: z.array(objectId).default([]),
});

export const externalMemberSchema = z.object({
  name: z.string().trim().min(1).max(150),
  affiliation: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
});

export const updateVivaPanelSchema = z.object({
  addExternal: z.array(externalMemberSchema).default([]),
  removeExternalEmails: z.array(z.string().trim().email()).default([]),
});
