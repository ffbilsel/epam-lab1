import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
} from './validation';
import * as authService from './auth.service';
import { ok, fail, HttpError } from './http';

export const authRouter = Router();

// Rate limiter: 5 attempts per hour per IP+email for sensitive endpoints.
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = (req.body?.email ?? '').toString().toLowerCase().trim();
    return `${req.ip}|${email}`;
  },
  handler: (_req, res) =>
    fail(res, 429, 'RATE_LIMITED', 'Too many attempts. Try again in 1 hour.'),
});

function asyncHandler<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

authRouter.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    // Step 1: validate email format (and password policy).
    const { email, password } = registerSchema.parse(req.body);
    // Steps 2-4 inside service.
    const data = await authService.register(email, password);
    return ok(res, data, 201);
  })
);

authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const data = await authService.login(email, password);
    return ok(res, data);
  })
);

// Single endpoint per spec; behavior depends on payload shape.
authRouter.post(
  '/reset-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    if (typeof req.body?.token === 'string') {
      const { token, password } = resetConfirmSchema.parse(req.body);
      const data = await authService.confirmPasswordReset(token, password);
      return ok(res, data);
    }
    const { email } = resetRequestSchema.parse(req.body);
    await authService.requestPasswordReset(email);
    // Always success to avoid user enumeration.
    return ok(res, { sent: true });
  })
);

// Route-scoped error handler.
authRouter.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const code = first?.path?.[0] === 'password' ? 'WEAK_PASSWORD' : 'INVALID_INPUT';
    return fail(res, 400, code, first?.message ?? 'Invalid input.');
  }
  if (err instanceof HttpError) {
    return fail(res, err.status, err.code, err.message);
  }
  // eslint-disable-next-line no-console
  console.error('[auth] unhandled error', err);
  return fail(res, 500, 'SERVER_ERROR', 'Something went wrong. Please try again.');
});
