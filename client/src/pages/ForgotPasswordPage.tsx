import { useState, type FormEvent } from 'react';
import { authApi } from '../auth/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset link'}
      </button>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <p className="muted" style={{ marginTop: '1rem' }}>
        In dev mode, the reset link is printed to the server console.
      </p>
    </form>
  );
}
