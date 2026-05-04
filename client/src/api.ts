export interface ApiSuccess<T> {
  success: true;
  data: T;
}
export interface ApiError {
  success: false;
  error: { code: string; message: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthData {
  token: string;
  expiresIn: number;
}

const BASE = '/api/auth';

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    let json: ApiResponse<T> | null = null;
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch {
      // fallthrough
    }
    if (json) return json;

    if (res.status >= 500) {
      return { success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' } };
    }
    return { success: false, error: { code: 'UNKNOWN', message: `Unexpected response (${res.status}).` } };
  } catch (err) {
    const isAbort = (err as { name?: string })?.name === 'AbortError';
    return {
      success: false,
      error: {
        code: isAbort ? 'TIMEOUT' : 'NETWORK',
        message: 'Connection failed. Please try again.',
      },
    };
  }
}

export const api = {
  register: (email: string, password: string) =>
    post<AuthData>('/register', { email, password }),
  login: (email: string, password: string) =>
    post<AuthData>('/login', { email, password }),
  requestReset: (email: string) =>
    post<{ sent: boolean }>('/reset-password', { email }),
  confirmReset: (token: string, password: string) =>
    post<AuthData>('/reset-password', { token, password }),
};

const TOKEN_KEY = 'auth.token';

export const session = {
  save(data: AuthData) {
    const expiresAt = Date.now() + data.expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token, expiresAt }));
  },
  get(): { token: string; expiresAt: number } | null {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.expiresAt && parsed.expiresAt > Date.now()) return parsed;
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
