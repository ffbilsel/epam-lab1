export interface User {
  id: number;
  email: string;
}

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
  user: User;
}

const BASE = '/api';

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error('Invalid server response');
  }

  if (!payload.success) {
    const err = new Error(payload.error.message) as Error & { code?: string };
    err.code = payload.error.code;
    throw err;
  }
  return payload.data;
}

export const authApi = {
  register: (email: string, password: string) =>
    request<AuthData>('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email: string, password: string) =>
    request<AuthData>('/auth/login', { method: 'POST', body: { email, password } }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    }),
  me: (token: string) => request<{ user: User }>('/auth/me', { token }),
};
