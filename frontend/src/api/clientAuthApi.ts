import type { ClientLoginCredentials, ClientUser } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: extraHeaders, ...restOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders as Record<string, string> || {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Une erreur est survenue');
  }

  return payload.data as T;
}

export async function clientLogin(credentials: ClientLoginCredentials) {
  return request<{ token: string; client: ClientUser }>('/client/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function clientForgotPassword(email: string) {
  const response = await fetch(`${API_BASE_URL}/client/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Une erreur est survenue');
  }
  return payload.message || 'Si cet email est enregistré, un lien de réinitialisation vous a été envoyé.';
}

export async function clientResetPassword(token: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/client/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Une erreur est survenue');
  }
  return payload.message || 'Mot de passe réinitialisé avec succès.';
}

export async function getCurrentClient(token: string) {
  return request<ClientUser>('/client/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
