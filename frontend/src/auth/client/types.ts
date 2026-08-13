export interface ClientEnterprise {
  id: string;
  name: string;
  logo?: string | null;
  location?: string | null;
}

export interface ClientUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
  points: number;
  level: string;
  status: string;
  enterpriseId: string;
  Enterprise?: ClientEnterprise;
}

export interface ClientLoginCredentials {
  email: string;
  password: string;
}
