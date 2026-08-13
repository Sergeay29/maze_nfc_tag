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
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  roleId: string;
  enterpriseId?: string | null;
  Role?: Role;
  enterprise?: {
    id: string;
    name: string;
    logo?: string;
    status: string;
    subscription: string;
  } | null;
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
  token?: string;
  user?: AuthUser;
  requires2FA?: boolean;
  tempToken?: string;
  mustSetup2FA?: boolean;
}
