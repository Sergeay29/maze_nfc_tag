# Maze NFC — Rapport d'analyse complet du projet

> Généré par investigation statique du dépôt. Aucun code n'a été modifié.

---

## Résumé exécutif

**Maze NFC** est une plateforme SaaS multi-tenant de fidélité par cartes NFC physiques, complétée d'un module restaurant complet (menu digital, commandes, réservations). Elle se compose d'un backend API Express/Node.js (CommonJS) connecté à PostgreSQL via Sequelize, d'un frontend React 18 + TypeScript + Vite, et d'une infrastructure Docker + CI GitHub Actions.

Le projet est structuré autour de **trois espaces utilisateurs distincts** :
1. **Super Admin (Maze)** — gestion de toute la plateforme, des entreprises clientes, du stock de cartes NFC et de la facturation.
2. **Entreprise (OWNER / MANAGER / EMPLOYEE)** — tableau de bord propre à l'enseigne : clients, points, récompenses, cartes, menu restaurant, commandes et réservations.
3. **Client final (public, sans compte)** — page de scan NFC accessible sans authentification : identification, points, récompenses, menu restaurant.

---

## 1. Structure des dossiers

```
maze_nfc_tag/
├── backend/                  # API Node.js/Express
│   ├── app.js                # Configuration Express (middlewares, routes)
│   ├── server.js             # Point d'entrée, validation env, démarrage
│   ├── config/
│   │   ├── database.js       # Connexion Sequelize/PostgreSQL
│   │   ├── swagger.js        # Génération spec OpenAPI
│   │   └── upload.js         # Config Multer (images, CSV)
│   ├── controllers/          # Logique HTTP (12 contrôleurs)
│   ├── middlewares/
│   │   └── authMiddleware.js # authenticate() + requireRole()
│   ├── migrations/           # Migrations SQL versionnées
│   │   ├── legacy/           # Anciennes migrations pré-baseline
│   │   └── *.js              # Migrations actives (horodatées)
│   ├── models/               # 22 modèles Sequelize
│   ├── routes/               # 6 fichiers de routes
│   ├── scripts/              # Utilitaires CLI (migration, seed, réconciliation)
│   ├── seeds/                # Données initiales (rôles, admin, types de cartes…)
│   ├── services/             # Logique métier découplée
│   ├── uploads/              # Fichiers téléversés (persistés en volume Docker)
│   ├── utils/                # Générateurs d'URL/token, plans d'abonnement
│   ├── .env                  # Variables d'environnement actives (non committé)
│   ├── .env.example          # Template documenté
│   └── Dockerfile            # Image de production (node:22-bookworm-slim)
│
├── frontend/                 # SPA React/TypeScript
│   ├── src/
│   │   ├── api/              # Clients HTTP (adminApi, authApi, enterpriseApi, restaurantMenuApi)
│   │   ├── auth/             # AuthContext, ProtectedRoute, useAuth, types
│   │   ├── components/       # Composants UI réutilisables (18 fichiers)
│   │   ├── config/           # subscriptions.ts (plans frontend)
│   │   ├── data/             # mockData.ts (données de démo)
│   │   ├── layouts/          # Header, Sidebar, MainLayout, MobileLayout
│   │   ├── pages/
│   │   │   ├── admin/        # 14 pages Super Admin
│   │   │   ├── enterprise/   # 17 pages Entreprise
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── ScanLandingPage.tsx  # Page publique de scan NFC
│   │   │   └── RestaurantMenuPage.tsx # Menu public restaurant
│   │   └── utils/            # cardUtils, clipboard, iconMapper
│   ├── index.html
│   ├── nginx.conf            # Config Nginx de production (SPA routing)
│   └── Dockerfile            # Image de production (nginx)
│
├── .github/
│   └── workflows/ci.yml      # CI GitHub Actions (lint, typecheck, build, syntax)
├── compose.yaml              # Orchestration Docker production (postgres + backend + frontend)
├── compose.dev.yaml          # Orchestration Docker développement (postgres seul)
├── .env.local.example        # Template variables racine
├── README.md                 # Documentation de cadrage
├── md/                       # Documentation technique (architecture restau, guides…)
└── .kilo/worktrees/          # Worktrees Git (branches de travail isolées)
```

---

## 2. Technologies et dépendances

### Backend (`backend/package.json`)

| Dépendance | Version | Usage |
|---|---|---|
| `express` | ^5.2.1 | Framework HTTP |
| `sequelize` | ^6.37.8 | ORM PostgreSQL |
| `pg` | ^8.22.0 | Driver PostgreSQL |
| `jsonwebtoken` | ^9.0.3 | Auth JWT |
| `bcryptjs` | ^3.0.3 | Hash mots de passe |
| `otplib` | ^13.4.1 | TOTP (authentification 2FA) |
| `qrcode` | ^1.5.4 | Génération QR codes |
| `multer` | ^2.2.0 | Upload de fichiers |
| `nodemailer` | ^9.0.5 | Envoi d'emails (reset mot de passe) |
| `helmet` | ^8.2.0 | Sécurité headers HTTP |
| `cors` | ^2.8.6 | Configuration CORS |
| `express-rate-limit` | ^8.5.2 | Rate limiting |
| `express-validator` | ^7.3.2 | Validation des entrées |
| `swagger-jsdoc` + `swagger-ui-express` | ^6.3 / ^5.0 | Documentation API |
| `dotenv` | ^17.4.2 | Variables d'environnement |
| `nodemon` | ^3.1.14 | Rechargement dev |

**Runtime :** Node.js 22, CommonJS (`"type": "commonjs"`).

### Frontend (`frontend/package.json`)

| Dépendance | Version | Usage |
|---|---|---|
| `react` + `react-dom` | ^18.3.1 | Framework UI |
| `react-router-dom` | ^7.18.0 | Routing SPA |
| `recharts` | ^3.8.1 | Graphiques (dashboard) |
| `lucide-react` | ^0.344.0 | Icônes |
| `react-hot-toast` | ^2.6.0 | Notifications toast |
| `react-phone-number-input` | ^3.4.17 | Saisie numéros de téléphone |
| `tailwindcss` | ^3.4.1 | Styles utilitaires |
| `vite` | ^5.4.2 | Bundler/dev server |
| `typescript` | ^5.5.3 | Typage statique |
| `eslint` + plugins | ^9.9.1 | Linting |

---

## 3. Modèles de données (22 modèles Sequelize)

### Noyau plateforme

| Modèle | Table | Champs clés | Description |
|---|---|---|---|
| `Role` | `roles` | `name` | Rôles : SUPER_ADMIN, OWNER, MANAGER, EMPLOYEE |
| `User` | `users` | `email`, `password`, `roleId`, `enterpriseId`, `twoFactorEnabled` | Utilisateurs plateforme |
| `Enterprise` | `enterprises` | `name`, `email`, `status`, `subscription`, `modules` | Tenant principal |
| `Subscription` | `subscriptions` | `plan` (Starter/Pro/Enterprise), `status`, `cardsLimit`, `monthlyPrice` | Abonnement d'une entreprise |
| `Setting` | `settings` | `key`, `value`, `group` | Paramètres globaux (plateforme, sécurité, notifications) |
| `AuditLog` | `audit_logs` | `userId`, `action`, `resource`, `oldValues`, `newValues`, `ipAddress` | Journal d'audit complet |

### Module fidélité NFC

| Modèle | Table | Champs clés | Description |
|---|---|---|---|
| `CardType` | `card_types` | `name`, `subtypes` (JSON) | Types de cartes (Restaurant, Salon…) |
| `NFCCard` | `nfc_cards` | `cardCode`, `scanToken`, `scanUrl`, `status` (active/inactive/unassigned), `stockBatchId` | Carte physique NFC |
| `Client` | `clients` | `name`, `email`, `phone`, `points`, `level` (Silver/Gold/Platinum) | Client final d'une entreprise |
| `Service` | `services` | `name`, `pointsToAdd`, `scanToken`, `isActive` | Service d'une entreprise (attribue des points) |
| `Scan` | `scans` | `cardId`, `clientId`, `serviceId`, `pointsAdded`, `scannedAt` | Enregistrement d'un passage NFC |
| `Reward` | `rewards` | `title`, `pointsRequired`, `stock`, `isActive` | Récompense à échanger contre des points |
| `Redemption` | `redemptions` | `clientId`, `rewardId`, `pointsUsed`, `status` | Utilisation d'une récompense |

### Module restaurant

| Modèle | Table | Champs clés | Description |
|---|---|---|---|
| `RestaurantMenu` | `restaurant_menus` | `name`, `status` (draft/published/archived) | Menu d'un restaurant |
| `RestaurantMenuCategory` | `restaurant_menu_categories` | `name`, `sortOrder` | Catégories du menu |
| `RestaurantMenuItem` | `restaurant_menu_items` | `name`, `priceMinor`, `isAvailable`, `description` | Plat (prix en centimes) |
| `RestaurantMenuItemOptionGroup` | `restaurant_menu_item_option_groups` | `name`, `required`, `multipleChoice` | Groupe d'options (ex: cuisson) |
| `RestaurantMenuItemOption` | `restaurant_menu_item_options` | `name`, `priceAdjustmentMinor` | Option individuelle |
| `RestaurantTable` | `restaurant_tables` | `label`, `capacity`, `publicToken`, `status` | Table physique avec QR code unique |
| `RestaurantReservation` | `restaurant_reservations` | `reservationDate`, `partySize`, `contact`, `status`, `tableId` | Réservation client |
| `RestaurantReservationSettings` | `restaurant_reservation_settings` | `openTime`, `closeTime`, `slotDuration`, `maxPartySize` | Paramètres de réservation |
| `RestaurantOrder` | `restaurant_orders` | `publicOrderToken`, `status` (pending/accepted/preparing/ready/served/cancelled), `totalMinor` | Commande en ligne |
| `RestaurantOrderItem` | `restaurant_order_items` | `menuItemId`, `quantity`, `unitPriceMinor`, `selectedOptionIds` | Ligne de commande |

---

## 4. Routes API complètes

Le préfixe de base est `/api`.

### `POST /api/auth/*` — Authentification (public)

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/login` | Connexion (email/password) → JWT |
| POST | `/auth/register` | Création de compte OWNER |
| GET | `/auth/me` | Profil de l'utilisateur connecté |
| PUT | `/auth/me` | Mise à jour du profil |
| PUT | `/auth/change-password` | Changement de mot de passe |
| POST | `/auth/forgot-password` | Demande de reset par email |
| POST | `/auth/reset-password` | Reset avec token email |
| POST | `/auth/verify-2fa` | Vérification code TOTP |
| GET | `/auth/2fa/status` | Statut 2FA de l'utilisateur |
| POST | `/auth/2fa/setup` | Initialiser la configuration 2FA |
| POST | `/auth/2fa/enable` | Activer la 2FA |
| POST | `/auth/2fa/disable` | Désactiver la 2FA |

### `/api/admin/*` — Super Admin (SUPER_ADMIN uniquement)

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/dashboard` | Statistiques globales |
| GET/POST | `/admin/enterprises` | Liste / Créer entreprise |
| GET/PUT/DELETE | `/admin/enterprises/:id` | Détail / Modifier / Supprimer |
| GET | `/admin/enterprises/:id/services` | Services d'une entreprise |
| GET | `/admin/cards` | Liste toutes les cartes NFC |
| GET | `/admin/cards/unassigned` | Cartes non attribuées |
| POST | `/admin/cards/generate` | Générer des cartes pour une entreprise |
| POST | `/admin/cards/generate-stock` | Générer un lot dans le stock global |
| POST | `/admin/cards/assign-to-enterprise` | Assigner stock global → entreprise |
| GET | `/admin/cards/stock-global` | Vue stock global Maze |
| POST | `/admin/cards/assign` | Attribuer une carte à un client |
| GET | `/admin/cards/stock` | Stock de cartes |
| PATCH | `/admin/cards/:id/status` | Activer / désactiver une carte |
| GET | `/admin/cards/:id/qr-code` | QR code d'une carte |
| GET/POST/GET/PUT/DELETE | `/admin/card-types` + `/:id` | CRUD types de cartes |
| GET/GET | `/admin/scans` + `/scans/export` | Liste scans + export CSV |
| GET/PUT | `/admin/subscriptions` + `/:id` | Liste / Modifier abonnement |
| GET/POST/GET/PUT/DELETE/PATCH/POST | `/admin/users` + `/:id` | CRUD utilisateurs + toggle-status + reset-password |
| GET | `/admin/roles` | Liste des rôles |
| GET/PUT | `/admin/settings` | Lecture / Modification paramètres |
| GET/GET/GET/GET | `/admin/audit` + `/stats` + `/export` + `/:id` | Journal d'audit |

### `/api/enterprise/*` — Espace Entreprise (OWNER / MANAGER / EMPLOYEE)

| Groupe | Routes |
|---|---|
| **Entreprise** | `GET/PUT /enterprise/me`, `GET /enterprise/dashboard` |
| **Clients** | `GET /enterprise/clients`, `GET/PUT/DELETE /enterprise/clients/:id`, `POST /enterprise/clients` |
| **Services** | `GET/POST /enterprise/services`, `GET/PUT/DELETE /enterprise/services/:id` |
| **Récompenses** | `GET/POST /enterprise/rewards`, `GET/PUT/DELETE /enterprise/rewards/:id` |
| **Cartes NFC** | `GET /enterprise/cards`, `GET /enterprise/cards/:id/qr-code`, `PUT /enterprise/cards/:id/assign`, `PATCH /enterprise/cards/:id/status` |
| **Scans & Points** | `POST /enterprise/scan`, `GET /enterprise/scans`, `POST /enterprise/points/adjust` |
| **Menu** | `GET/POST/PUT/DELETE /enterprise/menu/:id`, catégories, plats, options, `POST /enterprise/menu/import-csv` |
| **Réservations** | `GET /enterprise/reservations`, `PATCH /enterprise/reservations/:id/status`, `GET/PUT /enterprise/reservation-settings` |
| **Tables** | `GET/POST /enterprise/tables`, `PATCH/DELETE /enterprise/tables/:id`, `GET /enterprise/tables/:id/qr-code` |
| **Commandes** | `GET /enterprise/orders`, `PATCH /enterprise/orders/:id/status`, `GET /enterprise/orders/:id/ticket.pdf` |

### `/api/scan/*` — Pages publiques de scan NFC (aucune authentification)

| Méthode | Route | Description |
|---|---|---|
| GET | `/scan/card/:token` | Informations carte + services + récompenses |
| POST | `/scan/identify-client` | Identifier un client via tel/email |
| POST | `/scan/validate-service` | Valider un scan et ajouter des points |
| POST | `/scan/redeem-reward` | Utiliser une récompense (déduire des points) |

### `/api/restau/public/*` — Menu restaurant public (aucune authentification)

| Méthode | Route | Description |
|---|---|---|
| GET | `/restau/public/menu/:enterpriseId` | Menu publié par ID d'entreprise |
| GET | `/restau/public/table/:publicToken` | Menu via token de table connectée |
| GET | `/restau/public/menu/:enterpriseId/availability` | Disponibilités pour réservation |
| POST | `/restau/public/menu/:enterpriseId/reservations` | Créer une réservation |
| POST | `/restau/public/menu/:enterpriseId/orders` | Passer une commande |
| GET | `/restau/public/orders/:token` | Suivre l'état d'une commande |

### Routes techniques

| Route | Description |
|---|---|
| `GET /api/health` | Health check Docker |
| `GET /api/docs` | Documentation Swagger UI |
| `GET /api/docs.json` | Spécification OpenAPI brute |
| `POST /api/upload` | Upload d'images (Multer → `/uploads`) |

---

## 5. Fonctionnalités principales

### Fidélité NFC
- **Génération de cartes** : en lot directement pour une entreprise, ou en stock global Maze puis assignation par lot (`batchId`) ou unitaire.
- **URL de scan dynamique** : format `{BASE_URL}/{enterprise-slug}/{card-type-slug}/{scanToken}` (ex : `https://domaine.com/chez-marcel/restaurant/abc123def`).
- **Scan public** : le client approche la carte → page mobile affichant son solde, ses récompenses et les services disponibles.
- **Points et niveaux** : Silver (défaut) → Gold → Platinum, calculés automatiquement à chaque scan.
- **Récompenses** : stock limité, échange en ligne avec vérification du code physique de la carte.
- **Ajustement manuel** : un OWNER/MANAGER peut ajouter/retirer des points à un client depuis le dashboard.

### Authentification et sécurité
- JWT (`Bearer` header), expiration configurable (`JWT_EXPIRES_IN`).
- 2FA TOTP optionnel (activable par rôle via paramètres), avec codes de secours hashés (bcrypt).
- Reset de mot de passe par email (token 1h, Nodemailer).
- `mustChangePassword` : force le changement au premier login.
- Rate limiting (`express-rate-limit`), headers sécurisés (`helmet`), CORS strict.

### Module restaurant
- **Menu digital** : catégories + plats + groupes d'options (ex : cuisson, taille), prix en unités mineures (centimes FCFA).
- **Import CSV** : import en masse d'un menu depuis un fichier CSV.
- **Tables connectées** : chaque table possède un `publicToken` unique générant son QR code; le client accède au menu en scannant.
- **Commandes en ligne** : flux complet pending → accepted → preparing → ready → served/cancelled, avec token public de suivi.
- **Ticket PDF** : génération d'un ticket de caisse PDF téléchargeable.
- **Réservations** : disponibilités calculées en temps réel selon capacités et règles (durée, buffer, créneaux).
- **QR codes** : générés à la volée pour cartes et tables via la bibliothèque `qrcode`.

### Administration Maze (Super Admin)
- Tableau de bord global : entreprises actives, cartes, scans du mois, revenus mensuels.
- Gestion complète des entreprises : CRUD, activation/suspension, détail avec cartes/clients/scans.
- Gestion des abonnements : plans Starter/Pro/Enterprise avec limites de cartes et prix.
- Journal d'audit complet : toutes les actions sensibles tracées avec IP, user-agent, anciennes/nouvelles valeurs.
- Export CSV des scans et de l'audit.

---

## 6. Scripts npm/bash disponibles

### Backend (`backend/`)

| Commande | Description |
|---|---|
| `npm start` | Démarrer l'API en production (`node server.js`) |
| `npm run dev` | Démarrer l'API en développement avec rechargement automatique (`nodemon`) |
| `npm run db:migrate` | Exécuter les migrations en attente |
| `npm run db:migrate:status` | Afficher l'état de chaque migration |
| `npm run db:migrate:down` | Annuler la dernière migration |
| `npm run db:seed:production` | Insérer les données initiales en production (rôles, admin, types de cartes, settings) |
| `npm run data:reconcile-production` | Script de réconciliation des données de production |

### Frontend (`frontend/`)

| Commande | Description |
|---|---|
| `npm run dev` | Lancer le serveur de développement Vite (port 5173) |
| `npm run build` | Compiler pour la production |
| `npm run preview` | Prévisualiser le build de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run typecheck` | Vérifier les types TypeScript sans compiler |

### Docker

| Commande | Description |
|---|---|
| `docker compose up` | Démarrer postgres + backend + frontend en production |
| `docker compose --profile tools run migrate` | Exécuter les migrations dans Docker |
| `docker compose --profile tools run seed` | Seeder la base dans Docker |
| `docker compose -f compose.dev.yaml up` | Démarrer uniquement postgres (développement local) |

---

## 7. Configuration et variables d'environnement

### Variables backend (`.env`)

| Variable | Obligatoire | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` ou `production` |
| `PORT` | ✅ | Port du serveur (défaut 3000) |
| `JWT_SECRET` | ✅ | Clé secrète JWT (≥ 32 chars en prod) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | ✅ | Connexion PostgreSQL |
| `BASE_URL` | ❌ | URL de base de l'API |
| `FRONTEND_URL` | ❌ | URL(s) frontend pour CORS (séparées par virgule) |
| `SCAN_BASE_URL` | ❌ | URL de base pour les liens de scan NFC |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ❌ | Upload d'images Cloudinary |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | ❌ | SMTP pour emails (mode console si absent) |
| `TWO_FACTOR_ENCRYPTION_KEY` | ❌ | Clé de chiffrement AES-256 pour secrets 2FA (utilise `JWT_SECRET` si absent) |

### Variables frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de l'API backend (défaut : `http://localhost:3000/api`) |

### CI/CD (`.github/workflows/ci.yml`)

- **Déclencheurs** : push sur `production`, `staging`, `feature/**` ; PR vers `production` ou `staging`.
- **Frontend** : `npm ci` → `eslint` → `tsc --noEmit` → `vite build`.
- **Backend** : `npm ci` → vérification syntaxe JS (`node --check` sur chaque fichier).
- **Environnement** : Node.js 22, avec cache npm.

---

## 8. Architecture et flux de données

```
Navigateur → Apache (reverse proxy) → Express (port 3000)
                                           └── Sequelize → PostgreSQL

Frontend (port 5173 / Nginx:80 prod)
  └── React Router → pages admin/enterprise/public
       └── fetch() → /api/* (JWT Bearer header)
```

- Le backend est configuré avec `trust proxy 1` pour interpréter `X-Forwarded-For` derrière Apache.
- Les fichiers uploadés sont stockés dans `backend/uploads/` (volume Docker persistant `maze-nfc-uploads`).
- La base de données utilise un volume Docker persistant `maze-nfc-postgres-data`.
- En production, le backend écoute sur `127.0.0.1:3001`, le frontend sur `127.0.0.1:8081`.

---

## 9. Pages frontend par espace

### Espace Super Admin (`/admin/*`)

| Page | Route | Rôle |
|---|---|---|
| Dashboard | `/admin/dashboard` | Stats globales, graphiques tendances |
| Entreprises | `/admin/enterprises` | Liste + CRUD entreprises |
| Détail entreprise | `/admin/enterprises/:id` | Vue détaillée avec cartes/clients |
| Cartes NFC | `/admin/nfc-cards` | Liste + filtres |
| Générer cartes | `/admin/nfc-cards/generate` | Génération par lot (pour entreprise) |
| Attribution | `/admin/nfc-cards/assign` | Assigner carte → client |
| Stock global | `/admin/stock` | Vue stock Maze |
| Générer stock | `/admin/stock/generate` | Générer lot dans stock global |
| Assigner stock | `/admin/stock/assign` | Affecter stock → entreprise |
| Scans | `/admin/scans` | Historique tous scans |
| Abonnements | `/admin/subscriptions` | Gestion abonnements |
| Types de cartes | `/admin/card-types` | CRUD types et sous-types |
| Utilisateurs | `/admin/users` | Gestion utilisateurs plateforme |
| Audit | `/admin/audit` | Journal d'audit complet |
| Paramètres | `/admin/settings` | Config plateforme |

### Espace Entreprise (`/enterprise/*`)

| Page | Route | Rôle |
|---|---|---|
| Dashboard | `/enterprise/dashboard` | Stats entreprise, graphiques |
| Profil entreprise | `/enterprise/profile` | Modifier infos + logo |
| Clients | `/enterprise/clients` | Liste clients avec points/niveau |
| Détail client | `/enterprise/clients/:id` | Fiche client + historique |
| Ajouter points | `/enterprise/clients/:id/add-points` | Ajout/soustraction de points |
| Historique points | `/enterprise/clients/:id/history` | Historique scans/redemptions |
| Cartes NFC | `/enterprise/cards` | Cartes de l'entreprise |
| Services | `/enterprise/services` | Services (pointages) |
| Menu | `/enterprise/menu` | Menu restaurant |
| Commandes | `/enterprise/orders` | Commandes en cours |
| Réservations | `/enterprise/reservations` | Réservations restaurant |
| Tables | `/enterprise/tables` | Tables + QR codes |
| Scans | `/enterprise/scans` | Historique scans |
| Récompenses | `/enterprise/rewards` | Catalogue récompenses |
| Niveaux | `/enterprise/levels` | Config niveaux de fidélité |
| Notifications | `/enterprise/notifications` | Centre notifications |
| Paramètres | `/enterprise/settings` | Config espace entreprise |

### Pages publiques (sans authentification)

| Page | Route | Rôle |
|---|---|---|
| Connexion | `/login` | Login JWT |
| Inscription | `/register` | Création compte OWNER |
| Mot de passe oublié | `/forgot-password` | Envoi email reset |
| Reset mot de passe | `/reset-password` | Nouveau mot de passe via token |
| Scan NFC | `/:enterpriseSlug/:cardType/:token` | Page mobile de scan carte NFC |
| Menu restaurant | `/restau/menu/:enterpriseId` | Menu public par ID entreprise |
| Menu par table | `/restau/table/:publicToken` | Menu public par token de table |

---

## 10. Migrations de base de données

| Fichier | Description |
|---|---|
| `20260723170000-initial-schema.js` | Baseline complète : toutes les tables du noyau (roles, users, enterprises, subscriptions, clients, services, rewards, nfc_cards, scans, redemptions) |
| `20260813100000-audit-log-and-2fa.js` | Table `audit_logs`, colonnes 2FA sur `users` |
| `20260813110000-nfc-cards-enterprise-nullable.js` | `enterpriseId` nullable sur `nfc_cards` |
| `20260813120000-client-portal-password.js` | Ajout mot de passe client (abandonné) |
| `20260813130000-audit-log-client-enterprise.js` | Colonnes `clientId`/`enterpriseId` sur `audit_logs` |
| `20260813140000-remove-client-portal-password.js` | Suppression du mot de passe client |
| `20260922090000-create-restaurant-menu.js` | Tables restaurant (menus, catégories, plats) |
| `20260924090000-add-restau-reviews-and-reservations.js` | Tables réservations et settings réservation |
| `20260925090000-create-restau-orders.js` | Tables commandes et lignes de commande |
| `20260926100000-create-restaurant-tables.js` | Table `restaurant_tables` |
| `20260926110000-add-public-token-to-restaurant-tables.js` | `publicToken` sur tables restaurant |
| `20260928100000-add-restau-menu-item-options.js` | Groupes d'options et options de plats |
| `20260928110000-add-restau-reservation-capacity-rules.js` | Règles de capacité pour réservations |
| `add-password-reset-token.js` | Token reset mot de passe sur `users` |

---

## 11. Fichiers de documentation présents

| Fichier | Contenu |
|---|---|
| `README.md` | Vue d'ensemble, liens architecture |
| `README_NOUVEAU_SYSTEME.md` | Documentation du nouveau système de scan |
| `MIGRATION_NOUVEAU_SYSTEME.md` | Guide de migration vers le nouveau système |
| `RECAP_IMPLEMENTATION_NOUVEAU_SYSTEME.md` | Récapitulatif implémentation |
| `RESUME_URLS_DYNAMIQUES.md` | Résumé URLs dynamiques de scan |
| `URL_DYNAMIQUES_GUIDE.md` | Guide URLs dynamiques |
| `CHANGELOG_SCAN_URL.md` | Changelog des URLs de scan |
| `CONFIGURATION_PRODUCTION.md` | Guide configuration production |
| `DEMO_SCAN.md` | Guide de démo scan |
| `EXEMPLE_RAPIDE_URL.md` | Exemples rapides d'URLs |
| `EXEMPLE_SCAN_NFC.md` | Exemple de scan NFC |
| `TODO_FRONTEND.md` | TODO liste frontend |
| `md/RESTAU_ARCHITECTURE.md` | Architecture technique module restaurant |
| `md/RESTAU_MENU_IMPORT_CSV.md` | Import CSV du menu |
| `md/RESTAU_RESPONSIVE_VALIDATION.md` | Validation responsive |
| `md/TESTS_SUPER_ADMIN.md` | Tests Super Admin |
| `md/IMPLEMENTATION_SUMMARY.md` | Résumé d'implémentation |
| `md/AMELIORATIONS_COMPLETEES.md` | Améliorations réalisées |

---

## 12. Observations et recommandations

### Points positifs
- **Architecture solide** : séparation claire controllers / services / routes / modèles.
- **Migrations versionnées** : système de migrations maison (sans Umzug/Sequelize CLI) avec table `schema_migrations`, transactions atomiques.
- **Sécurité bien pensée** : helmet, CORS strict, rate-limit, JWT, 2FA TOTP avec codes de secours, audit log exhaustif, mot de passe non exposé dans les réponses.
- **Documentation Swagger** complète sur toutes les routes admin.
- **CI fonctionnelle** : lint + typecheck + build frontend, vérification syntaxe backend.
- **Docker production** : healthchecks sur les 3 services, volumes persistants, `no-new-privileges`, processus `node` non-root.

### Points à améliorer / risques

1. **Tests automatisés absents** : ni tests unitaires ni tests d'intégration côté backend. La CI ne vérifie que la syntaxe JS. Recommandation : ajouter Jest ou Vitest avec au moins des tests sur `authService`, `scanController` et `urlGenerator`.

2. **Modèle `Enterprise` dénormalisé** : `cardsCount` et `scansCount` sont des compteurs en dur sur la table `enterprises`, susceptibles de dériver par rapport aux vraies tables `nfc_cards` et `scans`. Recommandation : calculer ces stats à la volée via COUNT() ou utiliser des triggers.

3. **Upload d'images local** : les fichiers sont stockés dans `backend/uploads/` (volume Docker). En cas de scaling multi-instances, les fichiers ne sont pas partagés. L'intégration Cloudinary est prévue (variables d'env présentes) mais pas encore activée dans `upload.js` — à finaliser.

4. **`mockData.ts` dans le frontend** : des données de démonstration statiques sont présentes (`frontend/src/data/mockData.ts`). Vérifier qu'elles ne sont pas utilisées en production à la place des vraies APIs.

5. **Variable `SCAN_BASE_URL` non validée au démarrage** : contrairement aux autres variables, `SCAN_BASE_URL` n'est pas dans la liste `requiredVariables` de `server.js`. Si elle est absente, les URLs de scan générées seront invalides silencieusement.

6. **Route `/register` publique** : n'importe qui peut créer un compte OWNER sans invitation. À sécuriser en production si la plateforme n'est pas ouverte au public.

7. **Clé 2FA** : si `TWO_FACTOR_ENCRYPTION_KEY` n'est pas définie, le chiffrement AES-256 des secrets TOTP utilise `JWT_SECRET`. Recommandation : forcer une clé dédiée en production.

8. **Worktree `.kilo/`** : présence d'un worktree Git dans `.kilo/worktrees/fern-cyclamen/` avec une version plus ancienne du code (sans le module restaurant complet). C'est probablement une branche de travail Kilo — pas de risque immédiat mais à nettoyer si inutile.

---

*Rapport généré le {{DATE}} — investigation statique uniquement, aucune modification du code.*
