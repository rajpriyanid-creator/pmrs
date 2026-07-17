import { z } from "zod";

export const createFacultySchema = z.object({
  name: z.string().trim().min(1).max(150),
  username: z.string().trim().min(3).max(50),
  email: z.string().trim().email(),
  designation: z.string().trim().max(150).default(""),
  seniority: z.number().int().min(1),
  guideLimits: z.object({ ug: z.number().int().min(0).default(0), pg: z.number().int().min(0).default(0) }).default({ ug: 0, pg: 0 }),
});

export const updateFacultySchema = createFacultySchema.partial();

export const createStudentSchema = z.object({
  name: z.string().trim().min(1).max(150),
  rollNo: z.string().trim().min(1).max(50),
  program: z.string().regex(/^[a-f0-9]{24}$/i),
  email: z.string().trim().email(),
});
