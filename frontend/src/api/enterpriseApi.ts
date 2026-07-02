import type {
  Enterprise,
  NFCCard,
  Client,
  Service,
  Reward,
  Scan,
  DashboardStats,
  ScanStat,
} from '../data/mockData';

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

interface EnterpriseDashboardData {
  stats: DashboardStats;
  scanStats: ScanStat[];
  topClients: Client[];
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

// Enterprise
export async function getMyEnterprise(): Promise<
  Enterprise & { stats: DashboardStats }
> {
  return request<Enterprise & { stats: DashboardStats }>('/enterprise/me');
}

export async function updateMyEnterprise(
  data: Partial<Enterprise>
): Promise<Enterprise> {
  return request<Enterprise>('/enterprise/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Dashboard
export async function getEnterpriseDashboard(): Promise<EnterpriseDashboardData> {
  return request<EnterpriseDashboardData>('/enterprise/dashboard');
}

// Clients
export interface GetClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getClients(
  params: GetClientsParams = {}
): Promise<PaginatedResponse<Client>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);

  const queryString = query.toString();
  return request<PaginatedResponse<Client>>(
    `/enterprise/clients${queryString ? '?' + queryString : ''}`
  );
}

export async function getClientDetail(id: string): Promise<
  Client & { scans: Scan[] }
> {
  return request<Client & { scans: Scan[] }>(`/enterprise/clients/${id}`);
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  return request<Client>('/enterprise/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(
  id: string,
  data: Partial<Client>
): Promise<Client> {
  return request<Client>(`/enterprise/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Services
export interface GetServicesParams {
  activeOnly?: boolean;
}

export async function getServices(
  params: GetServicesParams = {}
): Promise<Service[]> {
  const query = new URLSearchParams();
  if (params.activeOnly) query.append('activeOnly', 'true');

  const queryString = query.toString();
  return request<Service[]>(
    `/enterprise/services${queryString ? '?' + queryString : ''}`
  );
}

export async function getServiceDetail(id: string): Promise<Service> {
  return request<Service>(`/enterprise/services/${id}`);
}

export async function createService(data: Partial<Service>): Promise<Service> {
  return request<Service>('/enterprise/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(
  id: string,
  data: Partial<Service>
): Promise<Service> {
  return request<Service>(`/enterprise/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: string): Promise<void> {
  return request<void>(`/enterprise/services/${id}`, {
    method: 'DELETE',
  });
}

// Rewards
export interface GetRewardsParams {
  activeOnly?: boolean;
}

export async function getRewards(
  params: GetRewardsParams = {}
): Promise<Reward[]> {
  const query = new URLSearchParams();
  if (params.activeOnly) query.append('activeOnly', 'true');

  const queryString = query.toString();
  return request<Reward[]>(
    `/enterprise/rewards${queryString ? '?' + queryString : ''}`
  );
}

export async function getRewardDetail(id: string): Promise<Reward> {
  return request<Reward>(`/enterprise/rewards/${id}`);
}

export async function createReward(data: Partial<Reward>): Promise<Reward> {
  return request<Reward>('/enterprise/rewards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReward(
  id: string,
  data: Partial<Reward>
): Promise<Reward> {
  return request<Reward>(`/enterprise/rewards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteReward(id: string): Promise<void> {
  return request<void>(`/enterprise/rewards/${id}`, {
    method: 'DELETE',
  });
}

// NFC Cards
export interface GetEnterpriseCardsParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive' | 'unassigned';
}

export async function getEnterpriseCards(
  params: GetEnterpriseCardsParams = {}
): Promise<PaginatedResponse<NFCCard>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.status && params.status !== 'all')
    query.append('status', params.status);

  const queryString = query.toString();
  return request<PaginatedResponse<NFCCard>>(
    `/enterprise/cards${queryString ? '?' + queryString : ''}`
  );
}

// Scans & Points
export interface ScanCardPayload {
  cardCode: string;
  serviceId?: string;
  notes?: string;
  manualPoints?: number;
}

export async function scanCard(data: ScanCardPayload): Promise<Scan> {
  return request<Scan>('/enterprise/scan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface GetEnterpriseScansParams {
  page?: number;
  limit?: number;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getEnterpriseScans(
  params: GetEnterpriseScansParams = {}
): Promise<PaginatedResponse<Scan>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.clientId) query.append('clientId', params.clientId);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  return request<PaginatedResponse<Scan>>(
    `/enterprise/scans${queryString ? '?' + queryString : ''}`
  );
}

export interface AdjustPointsPayload {
  clientId: string;
  points: number;
  reason?: string;
}

export async function adjustPoints(data: AdjustPointsPayload): Promise<Client> {
  return request<Client>('/enterprise/points/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
