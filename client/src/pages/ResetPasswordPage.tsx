import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../auth/api';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = params.get('token') || '';
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!PASSWORD_RULE.test(password)) {
      setError('Password must be 8+ chars with at least 1 uppercase letter and 1 number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="token">Reset token</label>
      <input
        id="token"
        type="text"
        required
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <label htmlFor="password">New password</label>
      <input
        id="password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="hint">Min 8 chars, 1 uppercase, 1 number.</div>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Resetting…' : 'Reset password'}
      </button>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </form>
  );
}
