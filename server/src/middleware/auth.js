'use strict';

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errors');

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new ApiError(401, 'INVALID_TOKEN', 'Token is invalid or expired'));
  }
}

module.exports = { requireAuth };
