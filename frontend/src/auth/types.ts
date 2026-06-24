export type RoleName = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'EMPLOYEE';

export interface Role {
  id: string;
  name: RoleName;
  description?: string | null;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roleId: string;
  Role?: Role;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}
