const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

function validateEmail(email) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
    return 'Invalid email address.';
  }
  return null;
}

function validateUsername(username) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'Username must be 3-32 chars: letters, digits, or underscore.';
  }
  return null;
}

/**
 * Strong password rules:
 * - 8-128 chars
 * - at least one lowercase, one uppercase, one digit, one special char
 */
function validatePassword(password) {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain a digit.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
  return null;
}

module.exports = { validateEmail, validateUsername, validatePassword };
