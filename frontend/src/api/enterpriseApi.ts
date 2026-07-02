const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'maze_nfc_auth_token';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const { headers: extraHeaders, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders as Record<string, string> || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Une erreur est survenue');
  }
  return payload.data;
}

export interface EnterpriseDashboardData {
  stats: { totalClients: number; totalCards: number; activeCards: number; totalScans: number; totalPointsGiven: number };
  scanStats: Array<{ day: string; scans: number }>;
  topClients: Array<{ id: string; name: string; points: number; level: string }>;
  recentScans: Array<{ id: string; pointsAdded: number; scannedAt: string; Client?: { name: string }; NFCCard?: { cardCode: string } }>;
}

export interface MyEnterpriseData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  logo?: string;
  status: string;
  subscription?: string;
  modules?: string[];
  adminFirstName?: string;
  adminLastName?: string;
  createdAt: string;
  stats: { totalCards: number; activeCards: number; totalClients: number; totalScansThisMonth: number };
  Subscription?: { status: string; monthlyPrice?: number };
  Scans?: Array<{ id: string; pointsAdded?: number; createdAt: string }>;
}

export async function getEnterpriseDashboard(): Promise<EnterpriseDashboardData> {
  return request<EnterpriseDashboardData>('/enterprise/dashboard');
}

export async function getMyEnterprise(): Promise<MyEnterpriseData> {
  return request<MyEnterpriseData>('/enterprise/me');
}

export async function updateMyEnterprise(body: {
  name?: string; phone?: string; location?: string;
  logo?: string; adminFirstName?: string; adminLastName?: string;
}): Promise<MyEnterpriseData> {
  return request<MyEnterpriseData>('/enterprise/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

// ─── CLIENTS ────────────────────────────────────────────────

export interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  points: number;
  level: string;
  status: string;
  lastActivity?: string;
  enterpriseId: string;
  createdAt: string;
}

export interface ScanData {
  id: string;
  pointsAdded: number;
  notes?: string;
  scannedAt: string;
  Client?: { id: string; name: string };
  NFCCard?: { cardCode: string };
  Service?: { id: string; name: string };
  service?: { name: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function getClients(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<ClientData>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);
  return request<PaginatedResponse<ClientData>>(`/enterprise/clients${qs.toString() ? '?' + qs : ''}`);
}

export async function getClientDetail(id: string): Promise<ClientData> {
  return request<ClientData>(`/enterprise/clients/${id}`);
}

export async function createClient(body: { name: string; email?: string; phone?: string; photo?: string }): Promise<ClientData> {
  return request<ClientData>('/enterprise/clients', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateClient(id: string, body: Partial<ClientData>): Promise<ClientData> {
  return request<ClientData>(`/enterprise/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function adjustPoints(body: { clientId: string; points: number; reason?: string }): Promise<ClientData> {
  return request<ClientData>('/enterprise/points/adjust', { method: 'POST', body: JSON.stringify(body) });
}

export async function getEnterpriseScans(params?: { page?: number; limit?: number; clientId?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<ScanData>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.clientId) qs.set('clientId', params.clientId);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  return request<PaginatedResponse<ScanData>>(`/enterprise/scans${qs.toString() ? '?' + qs : ''}`);
}

// ─── SERVICES ────────────────────────────────────────────────

export interface ServiceData {
  id: string;
  name: string;
  description?: string;
  pointsToAdd: number;
  icon?: string;
  color: string;
  isActive: boolean;
  enterpriseId: string;
  createdAt: string;
}

export async function getServices(params?: { activeOnly?: boolean }): Promise<ServiceData[]> {
  const qs = params?.activeOnly ? '?activeOnly=true' : '';
  return request<ServiceData[]>(`/enterprise/services${qs}`);
}

export async function createService(body: Partial<ServiceData>): Promise<ServiceData> {
  return request<ServiceData>('/enterprise/services', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateService(id: string, body: Partial<ServiceData>): Promise<ServiceData> {
  return request<ServiceData>(`/enterprise/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteService(id: string): Promise<void> {
  return request<void>(`/enterprise/services/${id}`, { method: 'DELETE' });
}

// ─── REWARDS ────────────────────────────────────────────────

export interface RewardData {
  id: string;
  title: string;
  description?: string;
  pointsRequired: number;
  isActive: boolean;
  image?: string;
  category?: string;
  stock?: number;
  enterpriseId: string;
  createdAt: string;
}

export async function getRewards(params?: { activeOnly?: boolean }): Promise<RewardData[]> {
  const qs = params?.activeOnly ? '?activeOnly=true' : '';
  return request<RewardData[]>(`/enterprise/rewards${qs}`);
}

export async function createReward(body: Partial<RewardData>): Promise<RewardData> {
  return request<RewardData>('/enterprise/rewards', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateReward(id: string, body: Partial<RewardData>): Promise<RewardData> {
  return request<RewardData>(`/enterprise/rewards/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteReward(id: string): Promise<void> {
  return request<void>(`/enterprise/rewards/${id}`, { method: 'DELETE' });
}

// ─── NFC CARDS ──────────────────────────────────────────────

export interface NFCCardData {
  id: string;
  cardNumber: string;
  cardCode: string;
  status: 'active' | 'inactive' | 'unassigned';
  enterpriseId: string;
  assignedToClientId?: string;
  assignedClient?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export async function getEnterpriseCards(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<NFCCardData>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  return request<PaginatedResponse<NFCCardData>>(`/enterprise/cards${qs.toString() ? '?' + qs : ''}`);
}

// ─── UPLOAD ────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('Non authentifié');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.message || 'Erreur upload');
  return payload.data.url as string;
}
