# 🚀 Configuration pour la Production

## 📝 Variables d'environnement

### Backend (`.env`)

```env
# Environnement
NODE_ENV=production

# Serveur
PORT=3000
BASE_URL=https://api.votre-domaine.com
FRONTEND_URL=https://votre-domaine.com

# URL de scan des cartes NFC - IMPORTANT !
# Cette URL doit pointer vers votre frontend en production
SCAN_BASE_URL=https://votre-domaine.com

# Base de données PostgreSQL (Production)
DB_HOST=votre-db-host.com
DB_PORT=5432
DB_NAME=maze_nfc_prod
DB_USER=votre_user
DB_PASSWORD=votre_mot_de_passe_super_securise

# JWT (GÉNÉREZ UNE CLÉ FORTE !)
JWT_SECRET=votre_cle_jwt_production_super_longue_et_aleatoire_64_caracteres_minimum

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Frontend (`.env`)

```env
VITE_API_URL=https://api.votre-domaine.com/api
```

---

## 🌐 Exemples d'URLs selon l'environnement

### Développement Local

**Backend `.env` :**
```env
SCAN_BASE_URL=http://localhost:5173
```

**URLs générées :**
```
http://localhost:5173/scan/a7f3e9d2c1b4a8f6
http://localhost:5173/scan/b8g4f0e3d2c5b9a7
```

---

### Production avec domaine personnalisé

**Backend `.env` :**
```env
SCAN_BASE_URL=https://fidelite.votreentreprise.com
```

**URLs générées :**
```
https://fidelite.votreentreprise.com/scan/a7f3e9d2c1b4a8f6
https://fidelite.votreentreprise.com/scan/b8g4f0e3d2c5b9a7
```

---

### Production avec sous-domaine

**Backend `.env` :**
```env
SCAN_BASE_URL=https://app.mazenfc.com
```

**URLs générées :**
```
https://app.mazenfc.com/scan/a7f3e9d2c1b4a8f6
https://app.mazenfc.com/scan/b8g4f0e3d2c5b9a7
```

---

## 🎯 Pourquoi cette configuration ?

### ✅ Avantages

1. **Flexibilité totale**
   - Changez de domaine sans toucher au code
   - Testez en local avec la même logique

2. **URLs courtes**
   - Format : `domaine.com/scan/token`
   - Parfait pour les QR Codes
   - Facile à mémoriser

3. **Même application**
   - Pas besoin d'un domaine séparé pour les scans
   - Frontend et scans sur le même domaine
   - SSL/HTTPS automatique

4. **Configuration simple**
   - Une seule variable à changer : `SCAN_BASE_URL`
   - Fonctionne immédiatement après déploiement

---

## 🔧 Étapes de déploiement

### 1. Configurer le Backend

```bash
# Créer le fichier .env en production
nano .env

# Copier les variables ci-dessus
# IMPORTANT: Mettre SCAN_BASE_URL = URL du frontend
```

### 2. Configurer le Frontend

```bash
# Créer le fichier .env en production
nano .env

# Ajouter l'URL de l'API backend
VITE_API_URL=https://api.votre-domaine.com/api
```

### 3. Rebuild le Frontend

```bash
npm run build
```

Les URLs de scan seront automatiquement générées avec le bon domaine !

---

## 🧪 Tester la configuration

### 1. Créer un service de test

Via l'interface admin ou directement en base :
```sql
INSERT INTO services (
  id,
  name,
  description,
  pointsToAdd,
  scanToken,
  isActive,
  enterpriseId
) VALUES (
  gen_random_uuid(),
  'Test Production',
  'Service de test',
  10,
  'test-prod-12345678',
  true,
  'uuid-de-votre-entreprise'
);
```

### 2. Vérifier l'URL générée

L'URL devrait être :
```
https://votre-domaine.com/scan/test-prod-12345678
```

### 3. Tester le scan

1. Ouvrir l'URL dans un navigateur
2. Page de scan s'affiche correctement
3. Entrer un téléphone/email
4. Confirmer → Points ajoutés ✅

---

## 📱 Génération de QR Codes

Une fois vos URLs configurées, générez des QR Codes :

### Outils en ligne
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QR Code Monkey](https://www.qrcode-monkey.com/)

### Exemple avec Node.js
```javascript
const QRCode = require('qrcode');

const scanUrl = 'https://votre-domaine.com/scan/a7f3e9d2c1b4a8f6';

QRCode.toFile('qrcode.png', scanUrl, {
  width: 300,
  margin: 2,
});
```

---

## 🔐 Sécurité en Production

### 1. HTTPS Obligatoire
- ✅ Activez SSL/TLS sur votre domaine
- ✅ Forcez la redirection HTTP → HTTPS

### 2. Variables d'environnement sécurisées
- ❌ Ne jamais commiter `.env` dans Git
- ✅ Utilisez `.env.example` comme template
- ✅ Générez des secrets forts (JWT_SECRET, DB_PASSWORD)

### 3. CORS
Le backend autorise déjà votre frontend via `FRONTEND_URL`

---

## 📊 Exemples de configuration par hébergeur

### Vercel / Netlify (Frontend)

**Variables d'environnement :**
```
VITE_API_URL=https://api.votre-domaine.com/api
```

### Heroku / Railway (Backend)

**Variables d'environnement :**
```
NODE_ENV=production
SCAN_BASE_URL=https://votre-frontend.vercel.app
FRONTEND_URL=https://votre-frontend.vercel.app
DB_HOST=...
DB_PASSWORD=...
JWT_SECRET=...
```

### VPS (Backend + Frontend)

**Backend `.env` :**
```
SCAN_BASE_URL=https://votre-domaine.com
```

**Frontend `.env` :**
```
VITE_API_URL=https://votre-domaine.com/api
```

---

## ✅ Checklist de déploiement

- [ ] Backend `.env` configuré avec `SCAN_BASE_URL` correct
- [ ] Frontend `.env` configuré avec `VITE_API_URL` correct
- [ ] Base de données créée et accessible
- [ ] Migrations exécutées
- [ ] Seeds exécutés (rôles, admin)
- [ ] SSL/HTTPS activé
- [ ] CORS configuré correctement
- [ ] Test d'un scan en production réussi
- [ ] QR Codes générés avec les bonnes URLs

---

## 🆘 Dépannage

### Problème : URLs de scan avec mauvais domaine

**Cause :** `SCAN_BASE_URL` pas à jour dans le backend `.env`

**Solution :**
1. Modifier `SCAN_BASE_URL` dans `.env`
2. Redémarrer le backend
3. Régénérer les cartes ou mettre à jour les URLs en base

### Problème : Page de scan ne charge pas

**Cause :** Frontend non déployé ou URL incorrecte

**Solution :**
1. Vérifier que le frontend est accessible
2. Vérifier la route `/scan/:token` dans l'application
3. Vérifier les logs du navigateur (F12)

### Problème : CORS error lors du scan

**Cause :** `FRONTEND_URL` différent de l'URL réelle du frontend

**Solution :**
1. Mettre à jour `FRONTEND_URL` dans backend `.env`
2. Redémarrer le backend

---

## 🎉 Tout fonctionne !

Vos URLs de scan sont maintenant :
✅ Configurables via `.env`
✅ Identiques en dev et prod (seul le domaine change)
✅ Courtes et lisibles
✅ Prêtes pour QR Codes et cartes NFC

**Exemple final :**
```
https://fidelite.monrestaurant.com/scan/a7f3e9d2c1b4a8f6
```

Scannez et gagnez des points ! 🚀
