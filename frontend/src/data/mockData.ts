// Interfaces TypeScript pour Maze NFC platform

export interface Enterprise {
  id: string;
  name: string;
  logo?: string;
  admin: string;
  email: string;
  phone?: string;
  location?: string;
  subscription: 'Starter' | 'Pro' | 'Enterprise';
  cardsCount?: number;
  status: 'active' | 'suspended';
  createdAt: string;
  modules?: string[];
}

export interface NFCCard {
  id: string;
  number?: string;
  cardNumber: string;
  enterpriseId: string;
  enterpriseName?: string;
  type: 'Fidélité Entreprise' | 'Restaurant' | 'Carte de visite';
  subtype?: 'Basic' | 'Standard' | 'Luxe';
  scanUrl?: string;
  status: 'active' | 'inactive' | 'unassigned';
  assignedTo?: string | null;
  assignedToClientId?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  cardNumber?: string;
  points?: number;
  level?: 'Silver' | 'Gold' | 'Platinum';
  enterpriseId: string;
  enterpriseName?: string;
  lastActivity?: string;
}

export interface Scan {
  id: string;
  clientId: string;
  clientName: string;
  cardNumber?: string;
  enterpriseId: string;
  enterpriseName: string;
  action: string;
  points: number;
  timestamp: string;
}

export interface PointsHistory {
  id: string;
  date: string;
  action: string;
  points: number;
  balance: number;
  reason: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  image?: string;
  category: string;
}

// Types pour les stats
export interface StatItem {
  day: string;
  [key: string]: number | string;
}

export interface CardStatusItem {
  name: string;
  value: number;
  color: string;
}
