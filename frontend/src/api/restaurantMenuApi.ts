import { request } from './enterpriseApi';

export type MenuStatus = 'draft' | 'published' | 'archived';

export interface RestaurantMenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  imageUrl?: string | null;
  sortOrder: number;
  isAvailable: boolean;
  optionGroups?: RestaurantMenuItemOptionGroup[];
}

export type RestaurantMenuOptionSelectionType = 'single' | 'multiple';

export interface RestaurantMenuItemOption {
  id: string;
  optionGroupId: string;
  name: string;
  priceModifierMinor: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface RestaurantMenuItemOptionGroup {
  id: string;
  menuItemId: string;
  name: string;
  selectionType: RestaurantMenuOptionSelectionType;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  sortOrder: number;
  options: RestaurantMenuItemOption[];
}

export interface RestaurantMenuCategory {
  id: string;
  menuId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  items: RestaurantMenuItem[];
}

export interface RestaurantMenu {
  id: string;
  enterpriseId: string;
  name: string;
  status: MenuStatus;
  categories: RestaurantMenuCategory[];
}

export interface PublicRestaurant {
  id: string;
  name: string;
  logo?: string | null;
  location?: string | null;
  googleReviewUrl?: string | null;
}

export interface PublicRestaurantMenu {
  restaurant: PublicRestaurant;
  menu: RestaurantMenu;
  table?: { id: string; label: string; capacity: number; enterpriseId: string };
}

export async function getRestaurantMenu(): Promise<RestaurantMenu | null> {
  return request<RestaurantMenu | null>('/enterprise/menu');
}

export async function createRestaurantMenu(name?: string): Promise<RestaurantMenu> {
  return request<RestaurantMenu>('/enterprise/menu', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateRestaurantMenu(
  id: string,
  body: Partial<Pick<RestaurantMenu, 'name' | 'status'>>,
): Promise<RestaurantMenu> {
  return request<RestaurantMenu>(`/enterprise/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteRestaurantMenu(id: string): Promise<void> {
  return request<void>(`/enterprise/menu/${id}`, { method: 'DELETE' });
}

export async function createMenuCategory(
  menuId: string,
  body: Partial<Pick<RestaurantMenuCategory, 'name' | 'description' | 'sortOrder' | 'isActive'>>,
): Promise<RestaurantMenuCategory> {
  return request<RestaurantMenuCategory>(`/enterprise/menu/${menuId}/categories`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMenuCategory(
  id: string,
  body: Partial<Pick<RestaurantMenuCategory, 'name' | 'description' | 'sortOrder' | 'isActive'>>,
): Promise<RestaurantMenuCategory> {
  return request<RestaurantMenuCategory>(`/enterprise/menu/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteMenuCategory(id: string): Promise<void> {
  return request<void>(`/enterprise/menu/categories/${id}`, { method: 'DELETE' });
}

export async function createMenuItem(
  categoryId: string,
  body: Partial<Pick<RestaurantMenuItem, 'name' | 'description' | 'priceMinor' | 'imageUrl' | 'sortOrder' | 'isAvailable'>>,
): Promise<RestaurantMenuItem> {
  return request<RestaurantMenuItem>(`/enterprise/menu/categories/${categoryId}/items`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMenuItem(
  id: string,
  body: Partial<Pick<RestaurantMenuItem, 'name' | 'description' | 'priceMinor' | 'imageUrl' | 'sortOrder' | 'isAvailable'>>,
): Promise<RestaurantMenuItem> {
  return request<RestaurantMenuItem>(`/enterprise/menu/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  return request<void>(`/enterprise/menu/items/${id}`, { method: 'DELETE' });
}

export async function importRestaurantMenuCsv(file: File): Promise<{ menuId: string; categories: number; items: number; optionGroups: number; options: number }> {
  const token = localStorage.getItem('maze_nfc_auth_token');
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/enterprise/menu/import-csv`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const payload = await response.json() as { success?: boolean; data?: { menuId: string; categories: number; items: number; optionGroups: number; options: number }; message?: string };
  if (!response.ok || !payload.success || !payload.data) throw new Error(payload.message || 'Impossible d’importer le menu CSV');
  return payload.data;
}

export async function createMenuItemOptionGroup(
  itemId: string,
  body: Partial<Pick<RestaurantMenuItemOptionGroup, 'name' | 'selectionType' | 'minSelections' | 'maxSelections' | 'isActive' | 'sortOrder'>>,
): Promise<RestaurantMenuItemOptionGroup> {
  return request<RestaurantMenuItemOptionGroup>(`/enterprise/menu/items/${itemId}/option-groups`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateMenuItemOptionGroup(
  id: string,
  body: Partial<Pick<RestaurantMenuItemOptionGroup, 'name' | 'selectionType' | 'minSelections' | 'maxSelections' | 'isActive' | 'sortOrder'>>,
): Promise<RestaurantMenuItemOptionGroup> {
  return request<RestaurantMenuItemOptionGroup>(`/enterprise/menu/option-groups/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteMenuItemOptionGroup(id: string): Promise<void> {
  return request<void>(`/enterprise/menu/option-groups/${id}`, { method: 'DELETE' });
}

export async function createMenuItemOption(
  groupId: string,
  body: Partial<Pick<RestaurantMenuItemOption, 'name' | 'priceModifierMinor' | 'isAvailable' | 'sortOrder'>>,
): Promise<RestaurantMenuItemOption> {
  return request<RestaurantMenuItemOption>(`/enterprise/menu/option-groups/${groupId}/options`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateMenuItemOption(
  id: string,
  body: Partial<Pick<RestaurantMenuItemOption, 'name' | 'priceModifierMinor' | 'isAvailable' | 'sortOrder'>>,
): Promise<RestaurantMenuItemOption> {
  return request<RestaurantMenuItemOption>(`/enterprise/menu/options/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteMenuItemOption(id: string): Promise<void> {
  return request<void>(`/enterprise/menu/options/${id}`, { method: 'DELETE' });
}

export async function getPublicRestaurantMenu(enterpriseId: string): Promise<PublicRestaurantMenu> {
  return request<PublicRestaurantMenu>(`/restau/public/menu/${enterpriseId}`);
}

export async function getPublicTableMenu(publicToken: string): Promise<PublicRestaurantMenu> {
  return request<PublicRestaurantMenu>(`/restau/public/table/${publicToken}`);
}

export interface PublicReservationPayload {
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  contact: string;
}

export interface PublicReservationResponse {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export type RestaurantReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface RestaurantReservation {
  id: string;
  enterpriseId: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  contact: string;
  tableId?: string | null;
  table?: { id: string; label: string; capacity: number } | null;
  status: RestaurantReservationStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type RestaurantTableStatus = 'active' | 'inactive';

export interface RestaurantTable {
  id: string;
  enterpriseId: string;
  label: string;
  zone?: string | null;
  capacity: number;
  status: RestaurantTableStatus;
  sortOrder: number;
}

export interface RestaurantReservationSettings {
  enterpriseId: string;
  defaultDurationMinutes: number;
  turnoverBufferMinutes: number;
  allowPublicBookings: boolean;
}

export interface PublicReservationAvailability {
  available: boolean;
  availableTables: number;
}

export async function createPublicReservation(
  enterpriseId: string,
  body: PublicReservationPayload,
): Promise<PublicReservationResponse> {
  return request<PublicReservationResponse>(`/restau/public/menu/${enterpriseId}/reservations`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getPublicReservationAvailability(
  enterpriseId: string,
  body: Omit<PublicReservationPayload, 'contact'>,
): Promise<PublicReservationAvailability> {
  const search = new URLSearchParams({ reservationDate: body.reservationDate, reservationTime: body.reservationTime, partySize: String(body.partySize) });
  return request<PublicReservationAvailability>(`/restau/public/menu/${enterpriseId}/availability?${search.toString()}`);
}

export async function getRestaurantReservations(): Promise<RestaurantReservation[]> {
  return request<RestaurantReservation[]>('/enterprise/reservations');
}

export async function updateRestaurantReservationStatus(
  id: string,
  status: RestaurantReservationStatus,
): Promise<RestaurantReservation> {
  return request<RestaurantReservation>(`/enterprise/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getRestaurantTables(): Promise<RestaurantTable[]> {
  return request<RestaurantTable[]>('/enterprise/tables');
}

export async function createRestaurantTable(body: Pick<RestaurantTable, 'label' | 'capacity'> & Partial<Pick<RestaurantTable, 'zone'>>): Promise<RestaurantTable> {
  return request<RestaurantTable>('/enterprise/tables', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateRestaurantTable(id: string, body: Partial<Pick<RestaurantTable, 'label' | 'zone' | 'capacity' | 'status'>>): Promise<RestaurantTable> {
  return request<RestaurantTable>(`/enterprise/tables/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function getRestaurantReservationSettings(): Promise<RestaurantReservationSettings> {
  return request<RestaurantReservationSettings>('/enterprise/reservation-settings');
}

export async function updateRestaurantReservationSettings(body: Omit<RestaurantReservationSettings, 'enterpriseId'>): Promise<RestaurantReservationSettings> {
  return request<RestaurantReservationSettings>('/enterprise/reservation-settings', { method: 'PUT', body: JSON.stringify(body) });
}

export async function deactivateRestaurantTable(id: string): Promise<RestaurantTable> {
  return request<RestaurantTable>(`/enterprise/tables/${id}`, { method: 'DELETE' });
}

export interface PublicOrderLinePayload {
  menuItemId: string;
  quantity: number;
  optionIds?: string[];
}

export interface CreatePublicOrderPayload {
  items: PublicOrderLinePayload[];
  tableReference?: string;
  contact?: string;
  customerNote?: string;
}

export interface RestaurantOrderItem {
  id: string;
  menuItemId?: string | null;
  nameSnapshot: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  selectedOptionsSnapshot: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    name: string;
    priceModifierMinor: number;
  }>;
}

export type RestaurantOrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface RestaurantOrder {
  id: string;
  publicOrderToken: string;
  tableReference?: string | null;
  contact?: string | null;
  customerNote?: string | null;
  status: RestaurantOrderStatus;
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  totalMinor: number;
  createdAt: string;
  updatedAt: string;
  items: RestaurantOrderItem[];
}

export async function createPublicOrder(
  enterpriseId: string,
  body: CreatePublicOrderPayload,
): Promise<RestaurantOrder> {
  return request<RestaurantOrder>(`/restau/public/menu/${enterpriseId}/orders`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getPublicOrder(token: string): Promise<RestaurantOrder> {
  return request<RestaurantOrder>(`/restau/public/orders/${token}`);
}

export async function getRestaurantOrders(): Promise<RestaurantOrder[]> {
  return request<RestaurantOrder[]>('/enterprise/orders');
}

export async function updateRestaurantOrderStatus(
  id: string,
  status: RestaurantOrderStatus,
): Promise<RestaurantOrder> {
  return request<RestaurantOrder>(`/enterprise/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function downloadRestaurantOrderTicket(id: string): Promise<Blob> {
  const token = localStorage.getItem('maze_nfc_auth_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/enterprise/orders/${id}/ticket.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    let message = 'Impossible de télécharger le ticket PDF';
    try {
      const payload = await response.json() as { message?: string };
      message = payload.message || message;
    } catch {
      // The backend may return a non-JSON error page.
    }
    throw new Error(message);
  }
  return response.blob();
}
