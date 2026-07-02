// Type definitions for Maze NFC platform

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
  cardCode: string;
  enterpriseId: string;
  enterpriseName?: string;
  type: 'Fidélité Entreprise' | 'Restaurant' | 'Carte de visite';
  subtype?: 'Basic' | 'Standard' | 'Luxe';
  scanUrl?: string;
  status: 'active' | 'inactive' | 'unassigned';
  assignedTo?: string | null;
  assignedToClientId?: string;
  assignedClient?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  points: number;
  level: 'Silver' | 'Gold' | 'Platinum';
  status: 'active' | 'suspended' | 'inactive';
  enterpriseId: string;
  lastActivity?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  pointsToAdd: number;
  isActive: boolean;
  icon?: string;
  color?: string;
  enterpriseId: string;
  createdAt: string;
}

export interface Reward {
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

export interface Scan {
  id: string;
  cardId: string;
  clientId: string;
  enterpriseId: string;
  serviceId?: string;
  scannedAt: string;
  userAgent?: string;
  ipAddress?: string;
  pointsAdded: number;
  notes?: string;
  client?: Client;
  service?: Service;
  card?: NFCCard;
  createdAt: string;
}

export interface PointsHistory {
  id: string;
  date: string;
  action: string;
  points: number;
  balance: number;
  reason: string;
}

export interface DashboardStats {
  totalClients: number;
  totalCards: number;
  activeCards: number;
  totalScans: number;
  totalPointsGiven: number;
}

export interface ScanStat {
  day: string;
  scans: number;
}

export interface CardStatusItem {
  name: string;
  value: number;
  color: string;
}

// Mock data
export const enterprises: Enterprise[] = [
  {
    id: '1',
    name: 'Restaurant Le Gourmet',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
    admin: 'Jean Dupont',
    email: 'contact@legourmet.com',
    phone: '+33 1 23 45 67 89',
    location: '12 Rue de la Paix, 75001 Paris',
    subscription: 'Pro',
    cardsCount: 1250,
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    modules: ['Fidélité', 'Restaurant'],
  },
  {
    id: '2',
    name: 'Boutique Mode Paris',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
    admin: 'Marie Martin',
    email: 'contact@modeparis.com',
    phone: '+33 1 98 76 54 32',
    location: '45 Avenue des Champs-Élysées, 75008 Paris',
    subscription: 'Enterprise',
    cardsCount: 3500,
    status: 'active',
    createdAt: '2024-02-20T14:45:00Z',
    modules: ['Fidélité'],
  },
  {
    id: '3',
    name: 'Spa Zen Attitude',
    logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&h=100&fit=crop',
    admin: 'Sophie Bernard',
    email: 'contact@spa-zen.com',
    phone: '+33 1 12 34 56 78',
    location: '8 Rue des Fleurs, 69002 Lyon',
    subscription: 'Starter',
    cardsCount: 420,
    status: 'suspended',
    createdAt: '2024-03-10T09:15:00Z',
    modules: ['Fidélité'],
  },
];

export const nfcCards: NFCCard[] = [
  {
    id: '1',
    cardNumber: 'ENT-RES-0001',
    cardCode: 'ABCD1234',
    enterpriseId: '1',
    enterpriseName: 'Restaurant Le Gourmet',
    type: 'Restaurant',
    subtype: 'Standard',
    scanUrl: 'https://maze-nfc.com/scan/ABCD1234',
    status: 'active',
    assignedToClientId: '1',
    assignedClient: { id: '1', name: 'Pierre Durand', email: 'pierre@example.com' },
    createdAt: '2024-05-01T10:00:00Z',
  },
  {
    id: '2',
    cardNumber: 'ENT-RES-0002',
    cardCode: 'EFGH5678',
    enterpriseId: '1',
    enterpriseName: 'Restaurant Le Gourmet',
    type: 'Restaurant',
    subtype: 'Luxe',
    scanUrl: 'https://maze-nfc.com/scan/EFGH5678',
    status: 'active',
    assignedToClientId: '2',
    assignedClient: { id: '2', name: 'Marie Lefèvre', email: 'marie@example.com' },
    createdAt: '2024-05-02T11:30:00Z',
  },
  {
    id: '3',
    cardNumber: 'ENT-FID-0003',
    cardCode: 'IJKL9012',
    enterpriseId: '2',
    enterpriseName: 'Boutique Mode Paris',
    type: 'Fidélité Entreprise',
    scanUrl: 'https://maze-nfc.com/scan/IJKL9012',
    status: 'unassigned',
    createdAt: '2024-05-03T09:45:00Z',
  },
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'Pierre Durand',
    email: 'pierre@example.com',
    phone: '+33 6 12 34 56 78',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    points: 1250,
    level: 'Gold',
    status: 'active',
    enterpriseId: '1',
    lastActivity: '2024-06-28T19:30:00Z',
    createdAt: '2024-05-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Marie Lefèvre',
    email: 'marie@example.com',
    phone: '+33 6 98 76 54 32',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    points: 5800,
    level: 'Platinum',
    status: 'active',
    enterpriseId: '1',
    lastActivity: '2024-06-29T20:15:00Z',
    createdAt: '2024-05-02T11:30:00Z',
  },
  {
    id: '3',
    name: 'Lucas Moreau',
    email: 'lucas@example.com',
    phone: '+33 6 55 44 33 22',
    points: 350,
    level: 'Silver',
    status: 'active',
    enterpriseId: '2',
    lastActivity: '2024-06-25T16:45:00Z',
    createdAt: '2024-05-15T14:20:00Z',
  },
];

export const services: Service[] = [
  {
    id: '1',
    name: 'Dîner au restaurant',
    description: 'Repas complet au restaurant Le Gourmet',
    pointsToAdd: 100,
    isActive: true,
    icon: '🍽️',
    color: '#6A35FF',
    enterpriseId: '1',
    createdAt: '2024-05-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Café ou boisson',
    pointsToAdd: 20,
    isActive: true,
    icon: '☕',
    color: '#BC43FF',
    enterpriseId: '1',
    createdAt: '2024-05-01T10:00:00Z',
  },
  {
    id: '3',
    name: 'Achat en boutique',
    pointsToAdd: 50,
    isActive: true,
    icon: '🛍️',
    color: '#FF6B9D',
    enterpriseId: '2',
    createdAt: '2024-05-15T14:20:00Z',
  },
];

export const rewards: Reward[] = [
  {
    id: '1',
    title: 'Menu gratuit',
    description: 'Un menu complet offert au restaurant',
    pointsRequired: 1000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    category: 'Restaurant',
    stock: 50,
    enterpriseId: '1',
    createdAt: '2024-05-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Réduction 20%',
    description: '20% de réduction sur votre prochain achat',
    pointsRequired: 500,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop',
    category: 'Boutique',
    enterpriseId: '2',
    createdAt: '2024-05-15T14:20:00Z',
  },
];

export const scans: Scan[] = [
  {
    id: '1',
    cardId: '1',
    clientId: '1',
    enterpriseId: '1',
    serviceId: '1',
    scannedAt: '2024-06-28T19:30:00Z',
    userAgent: 'Mozilla/5.0 (iPhone)',
    ipAddress: '192.168.1.1',
    pointsAdded: 100,
    notes: 'Dîner en famille',
    client: clients[0],
    service: services[0],
    card: nfcCards[0],
    createdAt: '2024-06-28T19:30:00Z',
  },
  {
    id: '2',
    cardId: '2',
    clientId: '2',
    enterpriseId: '1',
    serviceId: '2',
    scannedAt: '2024-06-29T20:15:00Z',
    userAgent: 'Mozilla/5.0 (Android)',
    ipAddress: '192.168.1.2',
    pointsAdded: 20,
    client: clients[1],
    service: services[1],
    card: nfcCards[1],
    createdAt: '2024-06-29T20:15:00Z',
  },
];

export const scanStats: ScanStat[] = [
  { day: 'Lun', scans: 45 },
  { day: 'Mar', scans: 52 },
  { day: 'Mer', scans: 38 },
  { day: 'Jeu', scans: 65 },
  { day: 'Ven', scans: 78 },
  { day: 'Sam', scans: 82 },
  { day: 'Dim', scans: 56 },
];

export const pointsStats = [
  { day: 'Lun', points: 120 },
  { day: 'Mar', points: 180 },
  { day: 'Mer', points: 95 },
  { day: 'Jeu', points: 220 },
  { day: 'Ven', points: 310 },
  { day: 'Sam', points: 280 },
  { day: 'Dim', points: 150 },
];

export const cardStatusData: CardStatusItem[] = [
  { name: 'Actives', value: 8500, color: '#6A35FF' },
  { name: 'Inactives', value: 1200, color: '#BC43FF' },
  { name: 'Non attribuées', value: 340, color: '#F4C8E8' },
];
