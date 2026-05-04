import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Signed in as <strong>{user?.email}</strong> (id: {user?.id}).</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
