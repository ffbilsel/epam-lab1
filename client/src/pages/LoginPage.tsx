import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, session } from '../api';
import { AuthCard, Field, SubmitButton, Alert } from '../components/AuthForm';
import { friendlyError, isEmail } from '../utils';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.success) {
      session.save(res.data);
      nav('/dashboard');
      return;
    }
    setError(friendlyError(res.error.code, res.error.message));
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back. Enter your credentials.">
      <form onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
        <Link to="/register" className="text-indigo-600 hover:text-indigo-700">Create account</Link>
      </div>
    </AuthCard>
  );
}
