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

export const enterprises: Enterprise[] = [
  {
    id: '1',
    name: 'Conciergerie Premium',
    logo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100',
    admin: 'Marie Dupont',
    email: 'marie@conciergerie.fr',
    phone: '+33 1 23 45 67 89',
    location: 'Paris, France',
    subscription: 'Pro',
    cardsCount: 1250,
    status: 'active',
    createdAt: '2024-01-15',
    modules: ['Fidélité', 'Conciergerie', 'Notifications', 'Récompenses'],
  },
  {
    id: '2',
    name: 'Auto Spa Luxe',
    logo: 'https://images.pexels.com/photos/3806289/pexels-photo-3806289.jpeg?auto=compress&cs=tinysrgb&w=100',
    admin: 'Jean Martin',
    email: 'jean@autospa.fr',
    phone: '+33 1 98 76 54 32',
    location: 'Lyon, France',
    subscription: 'Enterprise',
    cardsCount: 890,
    status: 'active',
    createdAt: '2023-11-20',
    modules: ['Fidélité', 'Récompenses'],
  },
  {
    id: '3',
    name: 'Hôtel Riviera',
    logo: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=100',
    admin: 'Sophie Bernard',
    email: 'sophie@riviera.com',
    phone: '+33 4 56 78 90 12',
    location: 'Nice, France',
    subscription: 'Pro',
    cardsCount: 2100,
    status: 'active',
    createdAt: '2023-08-10',
    modules: ['Fidélité', 'Conciergerie', 'Notifications'],
  },
  {
    id: '4',
    name: 'Restaurant Gastronomique',
    logo: 'https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=100',
    admin: 'Pierre Leroy',
    email: 'pierre@gastro.fr',
    phone: '+33 1 34 56 78 90',
    location: 'Bordeaux, France',
    subscription: 'Starter',
    cardsCount: 320,
    status: 'suspended',
    createdAt: '2024-02-28',
    modules: ['Fidélité'],
  },
  {
    id: '5',
    name: 'Fitness Club Elite',
    logo: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=100',
    admin: 'Claire Moreau',
    email: 'claire@fitness-elite.fr',
    phone: '+33 1 45 67 89 01',
    location: 'Marseille, France',
    subscription: 'Pro',
    cardsCount: 1560,
    status: 'active',
    createdAt: '2023-05-12',
    modules: ['Fidélité', 'Notifications', 'Récompenses'],
  },
];



export const nfcCards: NFCCard[] = [
  {
    id: '1',
    number: 'CP-FID-0001',
    cardNumber: 'CP-FID-0001',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/CPFID0001',
    status: 'active',
    assignedTo: 'Alice Martin',
    assignedToClientId: '1',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    number: 'CP-FID-0002',
    cardNumber: 'CP-FID-0002',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/CPFID0002',
    status: 'active',
    assignedTo: 'Bob Durand',
    assignedToClientId: '2',
    createdAt: '2024-01-22'
  },
  {
    id: '3',
    number: 'CP-CDV-0001',
    cardNumber: 'CP-CDV-0001',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    type: 'Carte de visite',
    scanUrl: 'http://localhost:5173/scan/CPCDV0001',
    status: 'unassigned',
    assignedTo: null,
    createdAt: '2024-02-01'
  },
  {
    id: '4',
    number: 'ASL-FID-0001',
    cardNumber: 'ASL-FID-0001',
    enterpriseId: '2',
    enterpriseName: 'Auto Spa Luxe',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/ASLFID0001',
    status: 'active',
    assignedTo: 'Charles Petit',
    assignedToClientId: '3',
    createdAt: '2024-02-05'
  },
  {
    id: '5',
    number: 'ASL-FID-0002',
    cardNumber: 'ASL-FID-0002',
    enterpriseId: '2',
    enterpriseName: 'Auto Spa Luxe',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/ASLFID0002',
    status: 'inactive',
    assignedTo: 'Diana Rose',
    assignedToClientId: '4',
    createdAt: '2024-02-10'
  },
  {
    id: '6',
    number: 'HR-FID-0001',
    cardNumber: 'HR-FID-0001',
    enterpriseId: '3',
    enterpriseName: 'Hôtel Riviera',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/HRFID0001',
    status: 'active',
    assignedTo: 'Eric Blanc',
    assignedToClientId: '5',
    createdAt: '2024-02-15'
  },
  {
    id: '7',
    number: 'HR-CDV-0001',
    cardNumber: 'HR-CDV-0001',
    enterpriseId: '3',
    enterpriseName: 'Hôtel Riviera',
    type: 'Carte de visite',
    scanUrl: 'http://localhost:5173/scan/HRCDV0001',
    status: 'unassigned',
    assignedTo: null,
    createdAt: '2024-02-20'
  },
  {
    id: '8',
    number: 'FCE-FID-0001',
    cardNumber: 'FCE-FID-0001',
    enterpriseId: '5',
    enterpriseName: 'Fitness Club Elite',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/FCEFID0001',
    status: 'active',
    assignedTo: 'Fanny Vert',
    assignedToClientId: '6',
    createdAt: '2024-03-01'
  },
  {
    id: '9',
    number: 'FCE-FID-0002',
    cardNumber: 'FCE-FID-0002',
    enterpriseId: '5',
    enterpriseName: 'Fitness Club Elite',
    type: 'Fidélité Entreprise',
    scanUrl: 'http://localhost:5173/scan/FCEFID0002',
    status: 'active',
    assignedTo: 'Greg Noir',
    assignedToClientId: '7',
    createdAt: '2024-03-05'
  },
  {
    id: '10',
    number: 'RG-RES-LUX-0001',
    cardNumber: 'RG-RES-LUX-0001',
    enterpriseId: '4',
    enterpriseName: 'Restaurant Gastronomique',
    type: 'Restaurant',
    subtype: 'Luxe',
    scanUrl: 'http://localhost:5173/scan/RGRESLUX0001',
    status: 'inactive',
    assignedTo: null,
    createdAt: '2024-03-10'
  },
];



export const clients: Client[] = [
  {
    id: '1',
    name: 'Alice Martin',
    email: 'alice@email.com',
    phone: '+33 6 12 34 56 78',
    photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'CP-FID-0001',
    points: 1520,
    level: 'Platinum',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    lastActivity: '2024-03-15'
  },
  {
    id: '2',
    name: 'Bob Durand',
    email: 'bob@email.com',
    phone: '+33 6 23 45 67 89',
    photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'CP-FID-0002',
    points: 680,
    level: 'Gold',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    lastActivity: '2024-03-14'
  },
  {
    id: '3',
    name: 'Charles Petit',
    email: 'charles@email.com',
    phone: '+33 6 34 56 78 90',
    photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'ASL-FID-0001',
    points: 320,
    level: 'Silver',
    enterpriseId: '2',
    enterpriseName: 'Auto Spa Luxe',
    lastActivity: '2024-03-13'
  },
  {
    id: '4',
    name: 'Diana Rose',
    email: 'diana@email.com',
    phone: '+33 6 45 67 89 01',
    photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'ASL-FID-0002',
    points: 890,
    level: 'Gold',
    enterpriseId: '2',
    enterpriseName: 'Auto Spa Luxe',
    lastActivity: '2024-03-12'
  },
  {
    id: '5',
    name: 'Eric Blanc',
    email: 'eric@email.com',
    phone: '+33 6 56 78 90 12',
    photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'HR-FID-0001',
    points: 2150,
    level: 'Platinum',
    enterpriseId: '3',
    enterpriseName: 'Hôtel Riviera',
    lastActivity: '2024-03-11'
  },
  {
    id: '6',
    name: 'Fanny Vert',
    email: 'fanny@email.com',
    phone: '+33 6 67 89 01 23',
    photo: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'FCE-FID-0001',
    points: 450,
    level: 'Silver',
    enterpriseId: '5',
    enterpriseName: 'Fitness Club Elite',
    lastActivity: '2024-03-10'
  },
  {
    id: '7',
    name: 'Greg Noir',
    email: 'greg@email.com',
    phone: '+33 6 78 90 12 34',
    photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100',
    cardNumber: 'FCE-FID-0002',
    points: 1120,
    level: 'Platinum',
    enterpriseId: '5',
    enterpriseName: 'Fitness Club Elite',
    lastActivity: '2024-03-09'
  },
];



export const scans: Scan[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Alice Martin',
    cardNumber: 'CP-FID-0001',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    action: '+50 points',
    points: 50,
    timestamp: '2024-03-15T14:30:00'
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Bob Durand',
    cardNumber: 'CP-FID-0002',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    action: 'Consultation',
    points: 0,
    timestamp: '2024-03-15T14:25:00'
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Charles Petit',
    cardNumber: 'ASL-FID-0001',
    enterpriseId: '2',
    enterpriseName: 'Auto Spa Luxe',
    action: '+100 points',
    points: 100,
    timestamp: '2024-03-15T14:20:00'
  },
  {
    id: '4',
    clientId: '5',
    clientName: 'Eric Blanc',
    cardNumber: 'HR-FID-0001',
    enterpriseId: '3',
    enterpriseName: 'Hôtel Riviera',
    action: '+50 points',
    points: 50,
    timestamp: '2024-03-15T14:15:00'
  },
  {
    id: '5',
    clientId: '7',
    clientName: 'Greg Noir',
    cardNumber: 'FCE-FID-0002',
    enterpriseId: '5',
    enterpriseName: 'Fitness Club Elite',
    action: 'Retrait points',
    points: -30,
    timestamp: '2024-03-15T14:10:00'
  },
  {
    id: '6',
    clientId: '4',
    clientName: 'Diana Rose',
    cardNumber: 'ASL-FID-0002',
    enterpriseId: '2',
    enterpriseName: 'Auto Spa Luxe',
    action: '+100 points',
    points: 100,
    timestamp: '2024-03-15T14:00:00'
  },
  {
    id: '7',
    clientId: '6',
    clientName: 'Fanny Vert',
    cardNumber: 'FCE-FID-0001',
    enterpriseId: '5',
    enterpriseName: 'Fitness Club Elite',
    action: 'Consultation',
    points: 0,
    timestamp: '2024-03-15T13:50:00'
  },
  {
    id: '8',
    clientId: '1',
    clientName: 'Alice Martin',
    cardNumber: 'CP-FID-0001',
    enterpriseId: '1',
    enterpriseName: 'Conciergerie Premium',
    action: '+50 points',
    points: 50,
    timestamp: '2024-03-15T13:40:00'
  },
];



export const pointsHistory: PointsHistory[] = [
  {
    id: '1',
    date: '2024-03-15',
    action: '+50 points',
    points: 50,
    balance: 1520,
    reason: 'Service Conciergerie'
  },
  {
    id: '2',
    date: '2024-03-14',
    action: '+100 points',
    points: 100,
    balance: 1470,
    reason: 'Réservation VIP'
  },
  {
    id: '3',
    date: '2024-03-12',
    action: '+50 points',
    points: 50,
    balance: 1370,
    reason: 'Service Conciergerie'
  },
  {
    id: '4',
    date: '2024-03-10',
    action: '-200 points',
    points: -200,
    balance: 1320,
    reason: 'Échange récompense'
  },
  {
    id: '5',
    date: '2024-03-08',
    action: '+100 points',
    points: 100,
    balance: 1520,
    reason: 'Parrainage'
  },
  {
    id: '6',
    date: '2024-03-05',
    action: '+50 points',
    points: 50,
    balance: 1420,
    reason: 'Service Conciergerie'
  },
];



export const rewards: Reward[] = [
  {
    id: '1',
    title: 'Réduction 10%',
    description: '10% de réduction sur votre prochaine prestation',
    pointsRequired: 200,
    image: 'https://images.pexels.com/photos/5462681/pexels-photo-5462681.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'discount'
  },
  {
    id: '2',
    title: 'Lavage Premium Gratuit',
    description: 'Un lavage complet de votre véhicule offert',
    pointsRequired: 500,
    image: 'https://images.pexels.com/photos/3806289/pexels-photo-3806289.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'service'
  },
  {
    id: '3',
    title: 'Service Voiturier Gratuit',
    description: 'Service voiturier offert pour une soirée',
    pointsRequired: 300,
    image: 'https://images.pexels.com/photos/1267335/pexels-photo-1267335.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'service'
  },
  {
    id: '4',
    title: 'Nuit d\'Hôtel Offerte',
    description: 'Une nuit dans un établissement partenaire',
    pointsRequired: 1000,
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'experience'
  },
  {
    id: '5',
    title: 'Dîner Gastronomique',
    description: 'Un dîner pour deux dans un restaurant étoilé',
    pointsRequired: 1500,
    image: 'https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'experience'
  },
  {
    id: '6',
    title: 'Weekend Spa',
    description: 'Un weekend détente avec soins inclus',
    pointsRequired: 2500,
    image: 'https://images.pexels.com/photos/3757655/pexels-photo-3757655.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'experience'
  },
];



export const scanStats: StatItem[] = [
  { day: 'Lun', scans: 45 },
  { day: 'Mar', scans: 52 },
  { day: 'Mer', scans: 38 },
  { day: 'Jeu', scans: 65 },
  { day: 'Ven', scans: 78 },
  { day: 'Sam', scans: 82 },
  { day: 'Dim', scans: 56 },
];



export const pointsStats: StatItem[] = [
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
