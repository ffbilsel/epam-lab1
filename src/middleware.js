const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token =
    (req.cookies && req.cookies.token) ||
    (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));

  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
