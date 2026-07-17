import { z } from "zod";
import { objectId } from "./common";

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(150),
  program: objectId,
  studentIds: z.array(objectId).min(1).max(10),
});

export const inviteSchema = z.object({
  toStudentId: objectId,
});

export const respondInviteSchema = z.object({
  inviteId: objectId,
  action: z.enum(["accept", "decline"]),
});

export const lockTeamSchema = z.object({
  teamId: objectId,
});

export const guideRequestSchema = z.object({
  teamId: objectId,
  guideId: objectId,
});

export const guideRequestDecisionSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});
