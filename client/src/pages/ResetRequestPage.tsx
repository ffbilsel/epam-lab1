import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { AuthCard, Field, SubmitButton, Alert } from '../components/AuthForm';
import { friendlyError, isEmail } from '../utils';

export default function ResetRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const res = await api.requestReset(email);
    setLoading(false);
    if (res.success) {
      setDone(true);
      return;
    }
    setError(friendlyError(res.error.code, res.error.message));
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="We'll email you a link to reset it."
    >
      {done ? (
        <Alert kind="success">
          If an account with that email exists, a password reset link has been sent.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}
      <div className="mt-4 text-sm">
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700">Back to sign in</Link>
      </div>
    </AuthCard>
  );
}
