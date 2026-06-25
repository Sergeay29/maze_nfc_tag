import type { Enterprise, NFCCard, Client, Scan } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_STORAGE_KEY = 'maze_nfc_auth_token';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface DashboardData {
  stats: {
    activeEnterprises: number;
    totalCards: number;
    scansThisMonth: number;
    monthlyRevenue: number;
  };
  scanTrends: Array<{ day: string; scans: number }>;
  cardStatusBreakdown: Array<{ name: string; value: number; color: string }>;
  recentScans: Scan[];
}

async function getAuthToken(): Promise<string> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Une erreur est survenue');
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.message || 'Une erreur est survenue');
  }

  return payload.data;
}

// Dashboard
export async function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>('/admin/dashboard');
}

// Enterprises
export interface GetEnterprisesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'suspended';
}

export async function getEnterprises(
  params: GetEnterprisesParams = {}
): Promise<PaginatedResponse<Enterprise>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'all')
    query.append('status', params.status);

  const queryString = query.toString();
  return request<PaginatedResponse<Enterprise>>(
    `/admin/enterprises${queryString ? '?' + queryString : ''}`
  );
}

export async function getEnterpriseDetail(
  id: string
): Promise<Enterprise & { totalClients: number; totalScans: number; activeCards: number }> {
  return request(`/admin/enterprises/${id}`);
}

export async function createEnterprise(
  data: Partial<Enterprise>
): Promise<Enterprise> {
  return request<Enterprise>('/admin/enterprises', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEnterprise(
  id: string,
  data: Partial<Enterprise>
): Promise<Enterprise> {
  return request<Enterprise>(`/admin/enterprises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// NFC Cards
export interface GetCardsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'unassigned';
  enterpriseId?: string;
}

export async function getCards(
  params: GetCardsParams = {}
): Promise<PaginatedResponse<NFCCard>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'all')
    query.append('status', params.status);
  if (params.enterpriseId) query.append('enterpriseId', params.enterpriseId);

  const queryString = query.toString();
  return request<PaginatedResponse<NFCCard>>(
    `/admin/cards${queryString ? '?' + queryString : ''}`
  );
}

// Scans
export interface GetScansParams {
  page?: number;
  limit?: number;
  search?: string;
  enterpriseId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getScans(
  params: GetScansParams = {}
): Promise<PaginatedResponse<Scan>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.enterpriseId) query.append('enterpriseId', params.enterpriseId);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  return request<PaginatedResponse<Scan>>(
    `/admin/scans${queryString ? '?' + queryString : ''}`
  );
}

// ─── Generate Cards ───────────────────────────────────────────

export interface GenerateCardsPayload {
  enterpriseId: string;
  type: 'Loyalty' | 'VIP' | 'Business' | 'Client';
  prefix: string;
  quantity: number;
}

export async function generateCards(
  payload: GenerateCardsPayload
): Promise<{ generated: number }> {
  return request<{ generated: number }>('/admin/cards/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface AssignCardPayload {
  cardNumber: string;
  clientName: string;
  email?: string;
  phone?: string;
  level?: 'Silver' | 'Gold' | 'Platinum';
  enterpriseId: string;
}

export async function assignCard(
  payload: AssignCardPayload
): Promise<{ client: unknown; card: unknown }> {
  return request<{ client: unknown; card: unknown }>('/admin/cards/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface UnassignedCard {
  id: string;
  cardNumber: string;
  type: string;
  enterpriseId: string;
  Enterprise?: { name: string };
}

export async function getUnassignedCards(
  enterpriseId?: string
): Promise<UnassignedCard[]> {
  const query = enterpriseId ? `?enterpriseId=${enterpriseId}` : '';
  return request<UnassignedCard[]>(`/admin/cards/unassigned${query}`);
}

// ─── Subscriptions ────────────────────────────────────────────

export interface SubscriptionRecord {
  id: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'paused' | 'cancelled';
  monthlyPrice: number;
  cardsLimit: number;
  startDate: string;
  renewalDate?: string;
  Enterprise?: {
    id: string;
    name: string;
    email: string;
    logo?: string;
    status: string;
  };
}

export interface SubscriptionStats {
  totalRevenue: number;
  countByPlan: Array<{ plan: string; count: string }>;
}

export interface GetSubscriptionsResponse extends PaginatedResponse<SubscriptionRecord> {
  stats: SubscriptionStats;
}

export async function getSubscriptions(params: {
  page?: number;
  limit?: number;
  plan?: string;
  status?: string;
} = {}): Promise<GetSubscriptionsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.plan && params.plan !== 'all') query.append('plan', params.plan);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  const qs = query.toString();
  return request<GetSubscriptionsResponse>(
    `/admin/subscriptions${qs ? '?' + qs : ''}`
  );
}

export async function updateSubscription(
  id: string,
  data: { plan?: string; status?: string }
): Promise<SubscriptionRecord> {
  return request<SubscriptionRecord>(`/admin/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Users ────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  Role?: { id: string; name: string };
}

export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  const qs = query.toString();
  return request<PaginatedResponse<AdminUser>>(
    `/admin/users${qs ? '?' + qs : ''}`
  );
}

// ─── Settings ─────────────────────────────────────────────────

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  label: string;
}

export type SettingsGrouped = Record<string, SettingItem[]>;

export async function getSettings(): Promise<SettingsGrouped> {
  return request<SettingsGrouped>('/admin/settings');
}

export async function updateSettings(
  settings: Record<string, string>
): Promise<{ updated: number }> {
  return request<{ updated: number }>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

// ─── Upload ───────────────────────────────────────────────────

export async function uploadLogo(file: File): Promise<string> {
  const token = localStorage.getItem('maze_nfc_auth_token');
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const payload = await response.json();
  if (!payload.success) throw new Error(payload.message || 'Erreur upload');
  return payload.data.url as string;
}
