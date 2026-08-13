import type { Enterprise, NFCCard } from '../data/mockData';
import type { CardType } from '../@types/types';


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
  recentScans: AdminScanData[];
}

export interface AdminScanData {
  id: string;
  clientName?: string;
  enterpriseName?: string;
  cardNumber?: string;
  action?: string;
  pointsAdded?: number;
  scannedAt?: string;
}

export interface CardGenerationPayload {
  enabled: boolean;
  type: CardType;
  subtype?: string;
  quantity: number;
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

export interface CreateEnterprisePayload extends Partial<Enterprise> {
  cardGeneration?: {
    enabled: boolean;
    type?: string;
    subtype?: string;
      quantity?: number;
  };
}

export async function createEnterprise(
  data: CreateEnterprisePayload,
): Promise<Enterprise & { generatedPassword: string }> {
  return request<Enterprise & { generatedPassword: string }>(
    "/admin/enterprises",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
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

export async function deleteEnterprise(id: string): Promise<void> {
  return request<void>(`/admin/enterprises/${id}`, {
    method: "DELETE",
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
): Promise<PaginatedResponse<AdminScanData>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.enterpriseId) query.append('enterpriseId', params.enterpriseId);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  return request<PaginatedResponse<AdminScanData>>(
    `/admin/scans${queryString ? '?' + queryString : ''}`
  );
}


export interface ExportScansParams
  extends Omit<GetScansParams, 'page' | 'limit'> {
  ids?: string[];
}

export async function exportScansCsv(
  params: ExportScansParams = {}
): Promise<{ blob: Blob; filename: string }> {
  const token = await getAuthToken();
  const query = new URLSearchParams();

  if (params.search) query.append('search', params.search);
  if (params.enterpriseId) query.append('enterpriseId', params.enterpriseId);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.ids?.length) query.append('ids', params.ids.join(','));

  const queryString = query.toString();
  const response = await fetch(
    `${API_BASE_URL}/admin/scans/export${queryString ? '?' + queryString : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Erreur lors de l'export CSV");
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] || 'scans.csv',
  };
}

// ─── Generate Cards ───────────────────────────────────────────

export interface GenerateCardsPayload {
  enterpriseId: string;
  cardTypeId: string;
  subtype?: string;
  serviceId?: string;
  quantity: number;
}

export async function generateCards(
  payload: GenerateCardsPayload,
): Promise<{ generated: number; scanUrl?: string }> {
  return request<{ generated: number; scanUrl?: string }>(
    "/admin/cards/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export interface AssignCardPayload {
  cardNumber: string;
  clientName: string;
  email?: string;
  phone?: string;
  level?: "Silver" | "Gold" | "Platinum";
  enterpriseId: string;
}

export async function assignCard(
  payload: AssignCardPayload,
): Promise<{ client: unknown; card: unknown }> {
  return request<{ client: unknown; card: unknown }>("/admin/cards/assign", {
    method: "POST",
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
  enterpriseId?: string,
): Promise<UnassignedCard[]> {
  const query = enterpriseId ? `?enterpriseId=${enterpriseId}` : "";
  return request<UnassignedCard[]>(`/admin/cards/unassigned${query}`);
}

export interface CardTypeData {
  id: string;
  type: string;
  description?: string;
  subtypes: string[];
  totalCards: number;
  totalScans: number;
  enterprises: Array<{
    id: string;
    name: string;
    logo?: string;
    status: string;
  }>;
}

export interface CardTypeDetail {
  type: string;
  subtypes: string[];
  enterprises: Array<{
    id: string;
    name: string;
    logo?: string;
    status: string;
    totalCards: number;
    activeCards: number;
    totalScans: number;
  }>;
}

export async function getCardTypes(): Promise<CardTypeData[]> {
  const result = await request<CardTypeData[]>("/admin/card-types");
  return result.map(type => ({ ...type, subtypes: type.subtypes || [] }));
}

export async function getCardTypeDetail(id: string): Promise<CardTypeDetail> {
  const result = await request<CardTypeDetail>(`/admin/card-types/${id}`);
  return { ...result, subtypes: result.subtypes || [] };
}

export async function createCardType(data: {
  name: string;
  description?: string;
  subtypes?: string[];
}): Promise<CardTypeData> {
  return request<CardTypeData>("/admin/card-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCardType(
  id: string,
  data: { name?: string; description?: string; subtypes?: string[] },
): Promise<CardTypeData> {
  return request<CardTypeData>(`/admin/card-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCardType(id: string): Promise<void> {
  return request<void>(`/admin/card-types/${id}`, { method: "DELETE" });
}

export interface CardStockData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    unassigned: number;
    sold: number;
    globalStock: number; // Cartes Maze sans entreprise
    availableForEnterprise: number; // Cartes assignées à une entreprise mais pas à un client
  };
  byEnterprise: Array<{
    enterpriseId: string;
    name: string;
    logo?: string;
    total: number;
    active: number;
    unassigned: number;
    inactive: number;
  }>;
  byType: Array<{ type: string; total: number; inStock: number }>;
}

export async function getCardStock(): Promise<CardStockData> {
  return request<CardStockData>("/admin/cards/stock");
}

// ─── Global Stock ─────────────────────────────────────────────

export interface GlobalStockData {
  total: number;
  byBatch: Array<{
    batchId: string;
    count: number;
    createdAt: string;
  }>;
}

export async function getGlobalStock(): Promise<GlobalStockData> {
  return request<GlobalStockData>(`/admin/cards/stock-global`);
}

export interface GenerateStockPayload {
  quantity: number;
}

export async function generateStockCards(
  payload: GenerateStockPayload,
): Promise<{
  generated: number;
  batchId: string;
}> {
  return request(`/admin/cards/generate-stock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface AssignStockPayload {
  enterpriseId: string;
  cardTypeId: string;
  subtype?: string;
  batchId?: string;
  cardIds?: string[];
  quantity?: number;
}

export async function assignStockToEnterprise(
  payload: AssignStockPayload,
): Promise<{
  assigned: number;
  enterpriseId: string;
  enterpriseName: string;
  type: string;
  subtype?: string;
  cardIds: string[];
}> {
  return request(`/admin/cards/assign-to-enterprise`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCardStatus(
  id: string,
  status: "active" | "inactive",
): Promise<{
  id: string;
  cardNumber: string;
  status: string;
  enterpriseName?: string;
}> {
  return request(`/admin/cards/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Services (Admin) ─────────────────────────────────────────

export interface AdminService {
  id: string;
  name: string;
  description?: string;
  pointsToAdd: number;
  scanToken: string;
  isActive: boolean;
  icon?: string;
  color?: string;
  enterpriseId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getEnterpriseServices(
  enterpriseId: string,
): Promise<AdminService[]> {
  return request<AdminService[]>(`/admin/enterprises/${enterpriseId}/services`);
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
  mustChangePassword?: boolean;
  roleId: string;
  enterpriseId?: string | null;
  createdAt: string;
  Role?: { id: string; name: string };
  enterprise?: { id: string; name: string; logo?: string } | null;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roleId: string;
  enterpriseId?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleId?: string;
  enterpriseId?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export async function getUsers(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
    enterpriseId?: string;
  } = {},
): Promise<PaginatedResponse<AdminUser>> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.search) query.append("search", params.search);
  if (params.roleId) query.append("roleId", params.roleId);
  if (params.isActive !== undefined)
    query.append("isActive", String(params.isActive));
  if (params.enterpriseId) query.append("enterpriseId", params.enterpriseId);
  const qs = query.toString();
  return request<PaginatedResponse<AdminUser>>(
    `/admin/users${qs ? "?" + qs : ""}`,
  );
}

export async function getUserDetail(id: string): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${id}`);
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<{ user: AdminUser; generatedPassword?: string }> {
  return request<{ user: AdminUser; generatedPassword?: string }>(
    "/admin/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request<void>(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function toggleUserStatus(
  id: string,
): Promise<{ isActive: boolean }> {
  return request<{ isActive: boolean }>(`/admin/users/${id}/toggle-status`, {
    method: "PATCH",
  });
}

export async function resetUserPassword(
  id: string,
): Promise<{ newPassword: string }> {
  return request<{ newPassword: string }>(`/admin/users/${id}/reset-password`, {
    method: "POST",
  });
}

// ─── Roles ────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export async function getRoles(): Promise<Role[]> {
  return request<Role[]>("/admin/roles");
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

// ─── Audit ────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
  User: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AuditStats {
  period: string;
  stats: {
    total: number;
    success: number;
    failed: number;
    successRate: string;
  };
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{
    user: { id: string; name: string; email: string };
    count: number;
  }>;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  userId?: string;
  success?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<{
  success: boolean;
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.action) query.append('action', params.action);
  if (params.resource) query.append('resource', params.resource);
  if (params.userId) query.append('userId', params.userId);
  if (params.success) query.append('success', params.success);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.search) query.append('search', params.search);

  const queryString = query.toString();
  const response = await fetch(
    `${API_BASE_URL}/admin/audit${queryString ? '?' + queryString : ''}`,
    {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur lors de la récupération des logs d\'audit');
  }

  return response.json();
}

export async function getAuditStats(params: { period?: string } = {}): Promise<{
  success: boolean;
  data: AuditStats;
}> {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);

  const queryString = query.toString();
  const response = await fetch(
    `${API_BASE_URL}/admin/audit/stats${queryString ? '?' + queryString : ''}`,
    {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur lors de la récupération des statistiques');
  }

  return response.json();
}

export async function getAuditLogDetail(id: string): Promise<{
  success: boolean;
  data: AuditLog;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/audit/${id}`, {
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur lors de la récupération du détail');
  }

  return response.json();
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
