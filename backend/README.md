# Maze NFC Tag - Backend

Backend API pour la plateforme de gestion de cartes NFC et programmes de fidélité.

## 🚀 Technologies

- **Node.js** + **Express** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **Sequelize** - ORM
- **JWT** - Authentification
- **Cloudinary** - Gestion des uploads d'images
- **Swagger** - Documentation API

## 📋 Prérequis

- Node.js v16 ou supérieur
- PostgreSQL v12 ou supérieur
- Compte Cloudinary (pour les uploads d'images)

## 🛠️ Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Puis modifier `.env` avec vos propres valeurs :
```env
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# URL de base pour les scans de cartes NFC
SCAN_BASE_URL=https://mzg.cards

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maze_nfc
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_cle_jwt_longue_et_securisee

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

3. **Créer la base de données PostgreSQL**
```sql
CREATE DATABASE maze_nfc;
```

4. **Démarrer le serveur**
```bash
# Mode développement avec hot reload
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:3000`
Documentation API disponible sur `http://localhost:3000/api/docs`

## 📊 Base de données

### Synchronisation automatique

Au démarrage, le serveur :
1. Synchronise automatiquement les modèles avec la base de données
2. Crée les rôles par défaut (SUPER_ADMIN, OWNER, MANAGER, EMPLOYEE)
3. Crée un compte super admin par défaut
4. Seed les données de démonstration

### Migrations

Pour exécuter une migration spécifique :

```bash
node scripts/runMigration.js <nom-de-la-migration>
```

Exemple pour ajouter les tokens de service :
```bash
node scripts/runMigration.js add-service-token-and-card-service
```

## 🔑 Génération dynamique des URLs de scan

Les URLs de scan des cartes NFC sont générées automatiquement selon le format :
```
{SCAN_BASE_URL}/{type-carte}/{entreprise-type-subtype}/{token}
```

### Configuration
Dans `.env` :
```env
# Développement
SCAN_BASE_URL=http://localhost:5173

# Production  
SCAN_BASE_URL=https://votre-domaine.com
```

### Exemple
Pour une carte de type "Restaurant", entreprise "Chez Marcel", sous-type "Luxe" :

**Développement :**
```
http://localhost:5173/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

**Production :**
```
https://votre-domaine.com/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

### Fonctionnement
1. Lors de la création d'un **Service**, un `scanToken` unique est généré automatiquement
2. Lors de la génération de **cartes NFC**, le service doit être spécifié
3. L'URL est construite dynamiquement avec :
   - L'URL du frontend (configurée dans `SCAN_BASE_URL`)
   - Le type de carte (slugifié)
   - Le nom de l'entreprise + type + subtype (slugifié)
   - Le token unique du service

### Avantages
- ✅ URLs configurables via variable d'environnement
- ✅ Format SEO-friendly (lisible et descriptif)
- ✅ Changement de domaine facile (modifier juste `SCAN_BASE_URL`)
- ✅ Même code en développement et production
- ✅ Compatible QR Codes, cartes NFC, liens partagés

📖 **Documentation détaillée** : voir `URL_DYNAMIQUES_GUIDE.md` et `EXEMPLE_RAPIDE_URL.md`

## 🏗️ Structure du projet

```
backend/
├── config/           # Configuration (DB, Swagger, Upload)
├── controllers/      # Logique métier
├── middlewares/      # Middlewares Express (auth, validation)
├── models/           # Modèles Sequelize
├── routes/           # Routes API
├── seeds/            # Données de démonstration
├── services/         # Services métier
├── migrations/       # Migrations de base de données
├── scripts/          # Scripts utilitaires
├── utils/            # Fonctions utilitaires (génération URL, etc.)
├── uploads/          # Fichiers uploadés localement
├── app.js            # Configuration Express
└── server.js         # Point d'entrée
```

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@mazenfc.com",
  "password": "Admin123!@#"
}
```

### Utiliser le token
```bash
GET /api/enterprise/dashboard
Authorization: Bearer {votre_token}
```

## 📚 Documentation API

La documentation complète de l'API est disponible via Swagger UI :

- **Développement** : http://localhost:3000/api/docs
- **JSON brut** : http://localhost:3000/api/docs.json

## 🎯 Endpoints principaux

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/forgot-password` - Mot de passe oublié

### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/enterprises` - Liste des entreprises
- `POST /api/admin/enterprises` - Créer une entreprise
- `POST /api/admin/cards/generate` - Générer des cartes NFC
- `POST /api/admin/cards/assign` - Attribuer une carte

### Entreprise
- `GET /api/enterprise/me` - Infos de l'entreprise
- `GET /api/enterprise/dashboard` - Dashboard entreprise
- `GET /api/enterprise/clients` - Liste des clients
- `GET /api/enterprise/services` - Liste des services
- `POST /api/enterprise/services` - Créer un service
- `POST /api/enterprise/scan` - Scanner une carte NFC
- `GET /api/enterprise/cards` - Liste des cartes

### Upload
- `POST /api/upload` - Upload d'image (Cloudinary)

## 🔧 Scripts disponibles

```bash
# Démarrage
npm start          # Production
npm run dev        # Développement avec nodemon

# Migration
node scripts/runMigration.js <nom-migration>
```

## 🌐 Variables d'environnement importantes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SCAN_BASE_URL` | URL de base pour les scans NFC (URL du frontend) | `http://localhost:5173` (dev) ou `https://votre-domaine.com` (prod) |
| `JWT_SECRET` | Clé secrète JWT (min 32 caractères en prod) | `votre_cle_super_longue_et_securisee` |
| `DB_*` | Configuration PostgreSQL | Voir `.env.example` |
| `CLOUDINARY_*` | Configuration Cloudinary | Voir `.env.example` |

## 🐛 Logs

Les logs du serveur sont automatiquement enregistrés :
- `server.out.log` - Logs de sortie standard
- `server.err.log` - Logs d'erreur

## 📝 Comptes par défaut

### Super Admin
- Email : `admin@mazenfc.com`
- Mot de passe : `Admin123!@#`

> ⚠️ **Important** : Changez ces identifiants en production !

## 🤝 Contribution

1. Créer une branche pour votre fonctionnalité
2. Commiter vos changements
3. Créer une Pull Request

## 📄 Licence

ISC
