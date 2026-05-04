'use strict';

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const { db } = require('../db');
const { ApiError } = require('../middleware/errors');
const { requireAuth } = require('../middleware/auth');
const { signAccessToken } = require('../services/tokens');
const { sendPasswordResetEmail } = require('../services/mailer');

const router = express.Router();
const BCRYPT_ROUNDS = 12;

// ---------- Validation ----------

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });
const forgotSchema = z.object({ email: emailSchema });
const resetSchema = z.object({ token: z.string().min(10), newPassword: passwordSchema });

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ApiError(400, 'VALIDATION_ERROR', first ? first.message : 'Invalid input');
  }
  return result.data;
}

// ---------- Rate limiting ----------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});

// ---------- Helpers ----------

const findUserByEmail = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
const insertUser = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
const findUserById = db.prepare('SELECT id, email FROM users WHERE id = ?');
const updateUserPassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');

const insertReset = db.prepare(
  'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
);
const findResetByHash = db.prepare(
  'SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?'
);
const markResetUsed = db.prepare(
  "UPDATE password_resets SET used_at = strftime('%s','now') * 1000 WHERE id = ?"
);
const invalidateUserResets = db.prepare(
  "UPDATE password_resets SET used_at = strftime('%s','now') * 1000 WHERE user_id = ? AND used_at IS NULL"
);

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ---------- Routes ----------

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = parse(registerSchema, req.body);

    if (findUserByEmail.get(email)) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const info = insertUser.run(email, passwordHash);
    const user = { id: info.lastInsertRowid, email };
    const { token, expiresIn } = signAccessToken(user);

    res.status(201).json({ success: true, data: { token, expiresIn, user } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// Implements the requested flow:
//   1. validate email format
//   2. check if user exists
//   3. compare password hash with bcrypt
//   4. generate and return JWT token
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = parse(loginSchema, req.body);

    const row = findUserByEmail.get(email);
    if (!row) {
      throw new ApiError(401, 'AUTH_FAILED', 'Invalid email or password');
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      throw new ApiError(401, 'AUTH_FAILED', 'Invalid email or password');
    }

    const user = { id: row.id, email: row.email };
    const { token, expiresIn } = signAccessToken(user);

    res.json({ success: true, data: { token, expiresIn, user } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = parse(forgotSchema, req.body);
    const user = findUserByEmail.get(email);

    // Always respond success to avoid user enumeration.
    if (user) {
      const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES) || 30;
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

      invalidateUserResets.run(user.id);
      insertReset.run(user.id, tokenHash, expiresAt);

      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (mailErr) {
        // eslint-disable-next-line no-console
        console.error('[mailer] failed to send reset email:', mailErr);
      }
    }

    res.json({
      success: true,
      data: { message: 'If that email is registered, a reset link has been sent.' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = parse(resetSchema, req.body);
    const tokenHash = hashToken(token);
    const reset = findResetByHash.get(tokenHash);

    if (!reset || reset.used_at || reset.expires_at < Date.now()) {
      throw new ApiError(400, 'INVALID_RESET_TOKEN', 'Reset token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const tx = db.transaction(() => {
      updateUserPassword.run(passwordHash, reset.user_id);
      markResetUsed.run(reset.id);
    });
    tx();

    res.json({
      success: true,
      data: { message: 'Password has been reset. You can now log in.' },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res, next) => {
  try {
    const user = findUserById.get(req.user.id);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
