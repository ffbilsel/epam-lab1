import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!PASSWORD_RULE.test(password)) {
      setError('Password must be 8+ chars with at least 1 uppercase letter and 1 number.');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
      <label htmlFor="password">Password</label>
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
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
