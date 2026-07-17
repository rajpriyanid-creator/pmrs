import { z } from 'zod';

export const createFacultySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    username: z.string().min(3).max(60).regex(/^[a-z0-9._-]+$/i, 'Alphanumeric usernames only'),
    email: z.string().email(),
    designation: z.string().min(1).max(80),
    seniority: z.number().int().min(1),
    guideLimits: z.object({ ug: z.number().int().min(0), pg: z.number().int().min(0) }).optional(),
    isAdmin: z.boolean().optional(),
    isAssistant: z.boolean().optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateFacultySchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      email: z.string().email().optional(),
      designation: z.string().min(1).max(80).optional(),
      seniority: z.number().int().min(1).optional(),
      guideLimits: z.object({ ug: z.number().int().min(0), pg: z.number().int().min(0) }).optional(),
      isActive: z.boolean().optional(),
      isAdmin: z.boolean().optional(),
      isAssistant: z.boolean().optional(),
    })
    .strict(),
  query: z.any(),
  params: z.object({ id: z.string().length(24) }),
});
