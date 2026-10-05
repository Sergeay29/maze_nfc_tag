# 📝 Changelog - URLs de Scan Simplifiées

## 🎯 Changement effectué

Les URLs de scan NFC utilisent maintenant **directement l'URL du frontend** au lieu d'un domaine séparé.

---

## ⚡ Avant vs Après

### ❌ Avant (Format complexe)

**Configuration :**
```env
SCAN_BASE_URL=https://mzg.cards
```

**URL générée :**
```
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
                ↑              ↑                          ↑
           type carte    slug entreprise              token
```

**Problèmes :**
- 🔴 Nécessite un domaine séparé (`mzg.cards`)
- 🔴 URLs longues et complexes
- 🔴 Slugs dépendants du type et du nom d'entreprise
- 🔴 Difficile à configurer pour chaque client

---

### ✅ Après (Format simplifié)

**Configuration :**
```env
# Développement
SCAN_BASE_URL=http://localhost:5173

# Production
SCAN_BASE_URL=https://votre-domaine.com
```

**URL générée :**
```
http://localhost:5173/scan/a7f3e9d2c1b4a8f6
                      ↑         ↑
                   route     token
```

**Avantages :**
- ✅ Utilise directement l'URL du frontend
- ✅ URLs courtes et propres
- ✅ Configurable via variable d'environnement
- ✅ Même domaine pour l'application et les scans
- ✅ SSL/HTTPS automatique
- ✅ Facile à déployer

---

## 📦 Fichiers modifiés

### Backend

1. **`backend/utils/urlGenerator.js`**
   - Simplifié la fonction `generateScanUrl()`
   - Ne prend plus que `scanToken` et `baseUrl`
   - Génère format : `{baseUrl}/scan/{token}`

2. **`backend/controllers/adminController.js`**
   - Mis à jour l'appel à `generateScanUrl()` dans `generateCards()`
   - Supprimé les paramètres inutiles (cardType, enterpriseName, subtype)

3. **`backend/.env.example`**
   - Changé `SCAN_BASE_URL` de `https://mzg.cards` à `http://localhost:5173`
   - Ajouté commentaires sur la configuration dev/prod

4. **`backend/README.md`**
   - Mis à jour la documentation des URLs de scan
   - Ajouté exemples de configuration

### Documentation

1. **`EXEMPLE_SCAN_NFC.md`**
   - Mis à jour les exemples d'URLs
   - Ajouté section sur la configuration

2. **`CONFIGURATION_PRODUCTION.md`** *(nouveau)*
   - Guide complet de configuration pour la production
   - Exemples pour différents hébergeurs
   - Checklist de déploiement

3. **`CHANGELOG_SCAN_URL.md`** *(ce fichier)*
   - Résumé des changements

---

## 🚀 Migration

### Si vous avez déjà des cartes NFC générées

Les anciennes URLs continueront de fonctionner si vous avez toujours `mzg.cards`, mais pour migrer :

#### Option 1 : Régénérer les cartes
```sql
-- Supprimer les anciennes cartes
DELETE FROM nfc_cards WHERE status = 'unassigned';

-- Régénérer via l'interface admin
```

#### Option 2 : Mettre à jour les URLs en base
```sql
-- Mettre à jour toutes les URLs de scan
UPDATE nfc_cards
SET scanUrl = CONCAT('http://localhost:5173/scan/', 
                     (SELECT scanToken FROM services WHERE services.id = nfc_cards.serviceId))
WHERE serviceId IS NOT NULL;
```

#### Option 3 : Laisser vides et régénérer au besoin
```sql
-- Mettre toutes les URLs à NULL
UPDATE nfc_cards SET scanUrl = NULL;

-- Elles seront régénérées lors de la prochaine génération de cartes
```

---

## 🔧 Configuration requise

### 1. Backend `.env`

```env
# URL du frontend (pour générer les URLs de scan)
SCAN_BASE_URL=http://localhost:5173
```

### 2. Frontend `.env`

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3000/api
```

### 3. Redémarrer les serveurs

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## ✅ Test de validation

### 1. Créer un service
Via l'interface entreprise ou la seed :
```bash
node backend/seeds/demo-scan.seed.js
```

### 2. Vérifier l'URL générée
Elle doit être au format :
```
http://localhost:5173/scan/[token]
```

### 3. Ouvrir l'URL
La page de scan doit s'afficher correctement.

---

## 📱 Utilisation en production

### Exemple : déploiement sur Vercel + Heroku

**Backend (Heroku) `.env` :**
```env
SCAN_BASE_URL=https://mon-app.vercel.app
FRONTEND_URL=https://mon-app.vercel.app
```

**Frontend (Vercel) `.env` :**
```env
VITE_API_URL=https://mon-api.herokuapp.com/api
```

**URLs générées :**
```
https://mon-app.vercel.app/scan/a7f3e9d2c1b4a8f6
```

---

## 🎉 Résultat

### ✅ Ce qui fonctionne maintenant

- [x] URLs de scan utilisent l'URL du frontend
- [x] Configuration via variable d'environnement
- [x] Format simple : `{domaine}/scan/{token}`
- [x] Même domaine pour l'app et les scans
- [x] Facile à déployer en production
- [x] URLs courtes pour QR Codes
- [x] Compatible mobile et desktop

### 📊 Comparaison

| Aspect | Avant | Après |
|--------|-------|-------|
| **URL** | `mzg.cards/restaurant/chez-marcel/token` | `votre-domaine.com/scan/token` |
| **Longueur** | ~60 caractères | ~40 caractères |
| **Domaines** | 2 (app + scan) | 1 (app uniquement) |
| **Configuration** | Fixe | Variable `.env` |
| **Déploiement** | Complexe | Simple |

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifier `SCAN_BASE_URL` dans backend `.env`
2. Vérifier que les deux serveurs sont démarrés
3. Vérifier les logs de la console (F12)
4. Consulter `CONFIGURATION_PRODUCTION.md`

---

**Date de modification :** $(date)
**Version :** 2.0
**Statut :** ✅ Testé et validé
