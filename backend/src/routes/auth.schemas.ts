import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1).max(60),
    password: z.string().min(1).max(200),
  }),
  query: z.any(),
  params: z.any(),
});

export const selectRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'coordinator', 'guide', 'panel', 'assistant']),
    programId: z.string().nullable().optional(),
  }),
  query: z.any(),
  params: z.any(),
});
