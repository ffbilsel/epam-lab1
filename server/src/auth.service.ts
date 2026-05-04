import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, UserRow } from './db';
import { config } from './config';
import { HttpError } from './http';
import { sendResetEmail } from './mailer';

function findUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare<[string], UserRow>('SELECT * FROM users WHERE email = ?')
    .get(email);
}

function findUserById(id: string): UserRow | undefined {
  return db.prepare<[string], UserRow>('SELECT * FROM users WHERE id = ?').get(id);
}

function signJwt(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresInSeconds,
  });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(email: string, password: string) {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }
  const password_hash = await bcrypt.hash(password, config.bcryptCost);
  const id = uuidv4();
  db.prepare(
    'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
  ).run(id, email, password_hash);

  const token = signJwt(id, email);
  return { token, expiresIn: config.jwtExpiresInSeconds };
}

export async function login(email: string, password: string) {
  // Step 2: check user exists.
  const user = findUserByEmail(email);
  // Step 3: compare password hash. Always run bcrypt to mitigate user-enumeration timing.
  const dummyHash = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8y3w1YqXh9rZgUw6h8C1aH4jH3mL3W';
  const ok = user
    ? await bcrypt.compare(password, user.password_hash)
    : (await bcrypt.compare(password, dummyHash), false);

  if (!user || !ok) {
    throw new HttpError(401, 'AUTH_FAILED', 'Invalid email or password');
  }
  // Step 4: generate and return JWT token.
  const token = signJwt(user.id, user.email);
  return { token, expiresIn: config.jwtExpiresInSeconds };
}

export async function requestPasswordReset(email: string) {
  const user = findUserByEmail(email);
  // Always respond success to avoid user enumeration.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = Date.now() + config.resetTokenTtlMinutes * 60_000;
    db.prepare(
      'INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(tokenHash, user.id, expiresAt);
    try {
      await sendResetEmail(user.email, token);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[mailer] failed to send reset email', err);
    }
  }
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const row = db
    .prepare<[string], { token_hash: string; user_id: string; expires_at: number; used_at: number | null }>(
      'SELECT token_hash, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?'
    )
    .get(tokenHash);

  if (!row || row.used_at || row.expires_at < Date.now()) {
    throw new HttpError(400, 'INVALID_TOKEN', 'Reset link is invalid or expired.');
  }
  const user = findUserById(row.user_id);
  if (!user) {
    throw new HttpError(400, 'INVALID_TOKEN', 'Reset link is invalid or expired.');
  }
  const password_hash = await bcrypt.hash(newPassword, config.bcryptCost);

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user.id);
    db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(Date.now(), tokenHash);
    // Invalidate all other outstanding tokens for this user.
    db.prepare('UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL').run(
      Date.now(),
      user.id
    );
  });
  tx();

  const jwtToken = signJwt(user.id, user.email);
  return { token: jwtToken, expiresIn: config.jwtExpiresInSeconds };
}
