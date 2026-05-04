import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, session } from '../api';
import { AuthCard, Field, SubmitButton, Alert } from '../components/AuthForm';
import { friendlyError, isStrongPassword } from '../utils';

export default function ResetConfirmPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Reset link is invalid or expired.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters and include an uppercase letter and a number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await api.confirmReset(token, password);
    setLoading(false);
    if (res.success) {
      session.save(res.data);
      nav('/dashboard');
      return;
    }
    setError(friendlyError(res.error.code, res.error.message));
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Set a strong password to secure your account.">
      <form onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <Field
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="Min 8 characters, including 1 uppercase letter and 1 number."
        />
        <Field
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
      <div className="mt-4 text-sm">
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700">Back to sign in</Link>
      </div>
    </AuthCard>
  );
}
