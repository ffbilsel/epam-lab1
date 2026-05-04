'use strict';

const jwt = require('jsonwebtoken');

function expiresInToSeconds(value) {
  if (!value) return 3600;
  if (typeof value === 'number') return value;
  const m = String(value).match(/^(\d+)([smhd])?$/);
  if (!m) return 3600;
  const n = Number(m[1]);
  switch (m[2]) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
    default: return n;
  }
}

function signAccessToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  return { token, expiresIn: expiresInToSeconds(expiresIn) };
}

module.exports = { signAccessToken };
