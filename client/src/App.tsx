import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import type { JSX } from 'react';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading, token } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="container">
      <h1>Auth Demo</h1>
      <nav>
        {user ? (
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>Login</NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>Register</NavLink>
            <NavLink to="/forgot-password" className={({ isActive }) => (isActive ? 'active' : '')}>Forgot</NavLink>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
