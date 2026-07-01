// api/enterpriseApi.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_STORAGE_KEY = 'maze_nfc_auth_token';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) throw new Error('Not authenticated');

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
  if (!payload.success) throw new Error(payload.message || 'Une erreur est survenue');
  return payload.data;
}

export interface MyEnterpriseData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  logo?: string;
  adminFirstName?: string;
  adminLastName?: string;
  subscription: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'suspended' | 'inactive';
  cardsCount: number;
  scansCount: number;
  modules: string[];
  createdAt: string;
  totalCards: number;
  activeCards: number;
  totalClients: number;
  totalScans: number;
  NFCCards?: Array<{
    id: string;
    cardNumber: string;
    type: string;
    subtype?: string;
    scanUrl: string;
    status: string;
    createdAt: string;
  }>;
  Clients?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    points: number;
    level: string;
    status: string;
  }>;
  Scans?: Array<{
    id: string;
    createdAt: string;
    pointsAdded?: number;
    scannedAt?: string;
  }>;
  Subscription?: {
    id: string;
    plan: string;
    status: string;
    monthlyPrice: number;
    cardsLimit?: number;
    startDate?: string;
    renewalDate?: string;
  };
}

export interface UpdateMyEnterprisePayload {
  name?: string;
  phone?: string;
  location?: string;
  logo?: string;
  adminFirstName?: string;
  adminLastName?: string;
}

/**
 * Récupère les données de l'entreprise de l'utilisateur connecté.
 */
export async function getMyEnterprise(): Promise<MyEnterpriseData> {
  return request<MyEnterpriseData>('/enterprise/me');
}

/**
 * Met à jour les informations de l'entreprise connectée.
 */
export async function updateMyEnterprise(
  data: UpdateMyEnterprisePayload
): Promise<{ enterprise: MyEnterpriseData }> {
  return request<{ enterprise: MyEnterpriseData }>('/enterprise/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
