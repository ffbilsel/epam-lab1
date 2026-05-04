export function friendlyError(code: string, fallback: string): string {
  switch (code) {
    case 'AUTH_FAILED':
      return 'Invalid email or password';
    case 'RATE_LIMITED':
      return 'Too many attempts. Try again in 1 hour.';
    case 'NETWORK':
    case 'TIMEOUT':
      return 'Connection failed. Please try again.';
    case 'SERVER_ERROR':
      return 'Something went wrong. Please try again.';
    case 'EMAIL_TAKEN':
      return 'An account with this email already exists.';
    case 'INVALID_TOKEN':
      return 'Reset link is invalid or expired.';
    case 'WEAK_PASSWORD':
    case 'INVALID_INPUT':
      return fallback;
    default:
      return fallback;
  }
}

export function isStrongPassword(p: string): boolean {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
