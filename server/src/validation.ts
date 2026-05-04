import { z } from 'zod';

// RFC 5322-ish email check via zod, normalized to lowercase trimmed.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email();

// min 8 chars, at least 1 uppercase, at least 1 number
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const resetConfirmSchema = z.object({
  token: z.string().min(20).max(256),
  password: passwordSchema,
});
