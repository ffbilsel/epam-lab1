import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetRequestPage from './pages/ResetRequestPage';
import ResetConfirmPage from './pages/ResetConfirmPage';
import DashboardPage from './pages/DashboardPage';
import { session } from './api';

function RequireAuth({ children }: { children: JSX.Element }) {
  const s = session.get();
  return s ? children : <Navigate to="/login" replace />;
}

function Shell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const authed = !!session.get();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">Auth Demo</Link>
          <nav className="flex gap-4 text-sm">
            {authed ? (
              <button
                className="text-slate-700 hover:text-slate-900"
                onClick={() => {
                  session.clear();
                  nav('/login');
                }}
              >
                Sign out
              </button>
            ) : (
              <>
                <Link className="text-slate-700 hover:text-slate-900" to="/login">Sign in</Link>
                <Link className="text-slate-700 hover:text-slate-900" to="/register">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ResetRequestPage />} />
        <Route path="/reset-password" element={<ResetConfirmPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Shell>
  );
}
