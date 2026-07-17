import { z } from 'zod';

const objectId = z.string().length(24);

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    program: objectId,
    studentIds: z.array(objectId).min(1),
  }),
  query: z.any(),
  params: z.any(),
});

export const inviteSchema = z.object({
  body: z.object({ toStudentId: objectId }),
  query: z.any(),
  params: z.object({ id: objectId }),
});

export const respondInviteSchema = z.object({
  body: z.object({ accept: z.boolean() }),
  query: z.any(),
  params: z.object({ id: objectId }),
});
