import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, session } from '../api';
import { AuthCard, Field, SubmitButton, Alert } from '../components/AuthForm';
import { friendlyError, isEmail, isStrongPassword } from '../utils';

export default function RegisterPage() {
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
    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters and include an uppercase letter and a number.');
      return;
    }
    setLoading(true);
    const res = await api.register(email, password);
    setLoading(false);
    if (res.success) {
      session.save(res.data);
      nav('/dashboard');
      return;
    }
    setError(friendlyError(res.error.code, res.error.message));
  }

  return (
    <AuthCard title="Create your account" subtitle="It only takes a minute.">
      <form onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="Min 8 characters, including 1 uppercase letter and 1 number."
        />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <div className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700">Sign in</Link>
      </div>
    </AuthCard>
  );
}
