const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const { validateEmail, validateUsername, validatePassword } = require('./validators');
const { requireAuth } = require('./middleware');

const router = express.Router();

const BCRYPT_ROUNDS = 12;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
  });
}

function publicUser(u) {
  return { id: u.id, username: u.username, email: u.email, created_at: u.created_at };
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { email, username, password } = req.body || {};

  const emailErr = validateEmail(email);
  const userErr = validateUsername(username);
  const pwErr = validatePassword(password);
  if (emailErr || userErr || pwErr) {
    return res.status(400).json({ error: emailErr || userErr || pwErr });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Email or username already in use.' });
  }

  try {
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const info = db
      .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
      .run(email, username, password_hash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ user: publicUser(user), token });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username and password are required.' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? OR username = ?')
    .get(identifier, identifier);

  // Constant-ish work to avoid trivial user-enumeration timing.
  const hash = user ? user.password_hash : '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsa';
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({ user: publicUser(user), token });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  const pwErr = validatePassword(newPassword);
  if (pwErr) return res.status(400).json({ error: pwErr });
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must differ from current password.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user.id);

  // Invalidate any outstanding reset tokens.
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);

  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, (req, res) => {
  const { email } = req.body || {};
  const generic = { ok: true, message: 'If the account exists, a reset token has been issued.' };

  if (validateEmail(email)) return res.json(generic);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.json(generic);

  const ttlMin = parseInt(process.env.RESET_TOKEN_TTL_MINUTES || '30', 10);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000).toISOString();

  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
  db.prepare(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, tokenHash, expiresAt);

  // In production, this token would be emailed. For dev we return it.
  if (process.env.NODE_ENV === 'production') {
    console.log(`[reset] user=${user.id} token=${rawToken} expires=${expiresAt}`);
    return res.json(generic);
  }
  return res.json({ ...generic, devToken: rawToken, expiresAt });
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  const pwErr = validatePassword(newPassword);
  if (pwErr) return res.status(400).json({ error: pwErr });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db
    .prepare('SELECT * FROM password_resets WHERE token_hash = ?')
    .get(tokenHash);

  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token.' });
  }

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, row.user_id);
    db.prepare('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
    db.prepare('DELETE FROM password_resets WHERE user_id = ? AND id != ?').run(row.user_id, row.id);
  });
  tx();

  res.json({ ok: true });
});

module.exports = router;
