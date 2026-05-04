import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type User } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = 'auth.token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(token));

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!token) { setLoading(false); return; }
      try {
        const { user: u } = await authApi.me(token);
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => { cancelled = true; };
  }, [token]);

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    loading,
    async login(email, password) {
      const data = await authApi.login(email, password);
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    },
    async register(email, password) {
      const data = await authApi.register(email, password);
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    },
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
