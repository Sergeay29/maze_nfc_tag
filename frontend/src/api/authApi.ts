import type { AuthUser, LoginCredentials, LoginResult, RegisterPayload } from '../auth/types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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

  return payload.data;
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function verify2FA(body: {
  tempToken: string;
  code?: string;
  backupCode?: string;
}): Promise<LoginResult> {
  return request<LoginResult>('/auth/verify-2fa', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function get2FAStatus(token: string): Promise<{ enabled: boolean }> {
  return request<{ enabled: boolean }>('/auth/2fa/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function setup2FA(token: string): Promise<{
  qrCodeDataUrl: string;
  otpauthUrl: string;
  secret: string;
}> {
  return request('/auth/2fa/setup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function enable2FA(token: string, code: string): Promise<{ backupCodes: string[] }> {
  return request('/auth/2fa/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
}

export async function disable2FA(
  token: string,
  password: string,
  code: string
): Promise<void> {
  await request<void>('/auth/2fa/disable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password, code }),
  });
}

export async function register(payload: RegisterPayload): Promise<LoginResult> {
  return request<LoginResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function changePassword(token: string, newPassword: string): Promise<void> {
  await request<void>('/auth/change-password', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ newPassword }),
  });
}

export async function updateCurrentUser(token: string, body: { firstName?: string; lastName?: string; email?: string }): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.user;
}
