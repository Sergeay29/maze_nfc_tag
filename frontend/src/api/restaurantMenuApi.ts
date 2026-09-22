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

export async function getPublicRestaurantMenu(enterpriseId: string): Promise<PublicRestaurantMenu> {
  return request<PublicRestaurantMenu>(`/restau/public/menu/${enterpriseId}`);
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

export async function createPublicReservation(
  enterpriseId: string,
  body: PublicReservationPayload,
): Promise<PublicReservationResponse> {
  return request<PublicReservationResponse>(`/restau/public/menu/${enterpriseId}/reservations`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
