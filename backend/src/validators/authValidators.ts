import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const roleSelectSchema = z.object({
  role: z.enum(["admin", "coordinator", "guide", "panel", "assistant", "student"]),
  program: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
});

export const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1).max(100),
});

export const verifyOtpSchema = z.object({
  username: z.string().trim().min(1).max(100),
  otp: z.string().trim().min(4).max(10),
});

export const resetPasswordOtpSchema = z.object({
  username: z.string().trim().min(1).max(100),
  otp: z.string().trim().min(4).max(10),
  newPassword: z.string().min(10).max(128),
});

export const resetPasswordLoggedInSchema = z.object({
  oldPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10).max(128),
});

export const registerPanelSchema = z.object({
  name: z.string().trim().min(1).max(150),
  username: z.string().trim().min(3).max(50),
  password: z.string().min(10).max(128),
  email: z.string().trim().email(),
  affiliation: z.string().trim().min(1).max(200),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
