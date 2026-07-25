# 🔗 Guide des URLs Dynamiques de Scan NFC

## 🎯 Principe

Les URLs de scan sont **générées automatiquement** lors de la création des cartes NFC. L'URL de base provient de la variable d'environnement `SCAN_BASE_URL` dans le backend.

---

## 📋 Format des URLs générées

### Format complet
```
{SCAN_BASE_URL}/{typedecarte}/{entreprise-type-subtype}/{token}
```

### Exemples concrets

#### Développement local
**Configuration dans `backend/.env` :**
```env
SCAN_BASE_URL=http://localhost:5173
```

**URLs générées :**
```
http://localhost:5173/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
http://localhost:5173/salon/coiffure-moderne-salon-standard/b8g4f0e3d2c5b9a7
http://localhost:5173/spa/zen-detente-spa-premium/c9h5g1f4e3d6c0b8
```

#### Production
**Configuration dans `backend/.env` :**
```env
SCAN_BASE_URL=https://fidelite.votreentreprise.com
```

**URLs générées :**
```
https://fidelite.votreentreprise.com/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
https://fidelite.votreentreprise.com/salon/coiffure-moderne-salon-standard/b8g4f0e3d2c5b9a7
https://fidelite.votreentreprise.com/spa/zen-detente-spa-premium/c9h5g1f4e3d6c0b8
```

---

## 🔧 Configuration

### 1. Backend - `.env`

```env
# URL de base pour les scans (votre domaine frontend)
SCAN_BASE_URL=http://localhost:5173

# En production, remplacez par votre domaine
# SCAN_BASE_URL=https://votre-domaine.com
```

### 2. Frontend - `.env`

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3000/api

# En production
# VITE_API_URL=https://api.votre-domaine.com/api
```

---

## 🎨 Structure de l'URL

### Parties de l'URL

```
https://fidelite.votreentreprise.com / restaurant / chez-marcel-restaurant-luxe / a7f3e9d2c1b4a8f6
         ↑                              ↑               ↑                            ↑
    SCAN_BASE_URL                   Type carte     Slug entreprise                Token
    (configurable)                  (slugifié)    (slugifié + type)           (unique)
```

### 1. **SCAN_BASE_URL** (configurable via `.env`)
- Développement : `http://localhost:5173`
- Production : `https://votre-domaine.com`
- Changeable sans modifier le code

### 2. **Type de carte** (slugifié)
- Exemples : `restaurant`, `salon`, `spa`, `boutique`
- Généré automatiquement depuis le type de carte

### 3. **Slug entreprise + type** (slugifié)
- Format : `{nom-entreprise}-{type}`
- Avec subtype : `{nom-entreprise}-{type}-{subtype}`
- Exemples :
  - `chez-marcel-restaurant`
  - `chez-marcel-restaurant-luxe`
  - `coiffure-moderne-salon-standard`

### 4. **Token unique**
- Généré automatiquement pour chaque service
- 32 caractères hexadécimaux
- Exemple : `a7f3e9d2c1b4a8f6e5d4c3b2a1f0e9d8`

---

## 🚀 Exemples de génération

### Exemple 1 : Restaurant Luxe

**Données :**
```javascript
{
  cardType: "Restaurant",
  enterpriseName: "Chez Marcel",
  subtype: "Luxe",
  scanToken: "a7f3e9d2c1b4a8f6",
  baseUrl: "http://localhost:5173"
}
```

**URL générée :**
```
http://localhost:5173/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

### Exemple 2 : Salon Standard

**Données :**
```javascript
{
  cardType: "Salon",
  enterpriseName: "Coiffure Moderne",
  subtype: "Standard",
  scanToken: "b8g4f0e3d2c5b9a7",
  baseUrl: "https://fidelite.monapp.com"
}
```

**URL générée :**
```
https://fidelite.monapp.com/salon/coiffure-moderne-salon-standard/b8g4f0e3d2c5b9a7
```

### Exemple 3 : Spa sans subtype

**Données :**
```javascript
{
  cardType: "Spa",
  enterpriseName: "Zen & Détente",
  subtype: null,
  scanToken: "c9h5g1f4e3d6c0b8",
  baseUrl: "https://myapp.com"
}
```

**URL générée :**
```
https://myapp.com/spa/zen-detente-spa/c9h5g1f4e3d6c0b8
```

---

## 📱 Routes Frontend

Le frontend accepte **deux formats** d'URL :

### Format 1 : Complet (recommandé)
```typescript
// Route: /:cardType/:enterpriseSlug/:token
// Exemple: /restaurant/chez-marcel-restaurant-luxe/abc123
```

### Format 2 : Simplifié (fallback)
```typescript
// Route: /scan/:token
// Exemple: /scan/abc123
```

Les deux formats mènent à la même page de scan ! ✅

---

## 🔄 Processus de génération

### Lors de la génération de cartes NFC :

```
1. Admin génère des cartes via l'interface
   ↓
2. Backend récupère SCAN_BASE_URL depuis .env
   ↓
3. Backend appelle generateScanUrl() avec :
   - cardType (ex: "Restaurant")
   - enterpriseName (ex: "Chez Marcel")
   - subtype (ex: "Luxe")
   - scanToken (du service)
   - baseUrl (depuis SCAN_BASE_URL)
   ↓
4. Fonction slugify() normalise les textes :
   - "Chez Marcel" → "chez-marcel"
   - "Restaurant" → "restaurant"
   - "Luxe" → "luxe"
   ↓
5. URL construite et enregistrée en base
   ↓
6. Carte NFC créée avec son scanUrl
```

---

## 🌍 Configuration selon l'environnement

### Développement Local

**Backend `.env` :**
```env
SCAN_BASE_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env` :**
```env
VITE_API_URL=http://localhost:3000/api
```

**URLs générées :**
```
http://localhost:5173/restaurant/chez-marcel-restaurant/abc123
```

---

### Staging/Test

**Backend `.env` :**
```env
SCAN_BASE_URL=https://staging.votreapp.com
FRONTEND_URL=https://staging.votreapp.com
```

**Frontend `.env` :**
```env
VITE_API_URL=https://api-staging.votreapp.com/api
```

**URLs générées :**
```
https://staging.votreapp.com/restaurant/chez-marcel-restaurant/abc123
```

---

### Production

**Backend `.env` :**
```env
SCAN_BASE_URL=https://fidelite.votreentreprise.com
FRONTEND_URL=https://fidelite.votreentreprise.com
```

**Frontend `.env` :**
```env
VITE_API_URL=https://api.votreentreprise.com/api
```

**URLs générées :**
```
https://fidelite.votreentreprise.com/restaurant/chez-marcel-restaurant/abc123
```

---

## ✅ Avantages de ce système

### 1. **Flexibilité**
- ✅ Changez de domaine sans toucher au code
- ✅ Une seule variable à modifier : `SCAN_BASE_URL`

### 2. **SEO-Friendly**
- ✅ URLs lisibles et descriptives
- ✅ Contiennent le type de carte et le nom de l'entreprise
- ✅ Meilleur référencement

### 3. **Personnalisation**
- ✅ Chaque entreprise peut avoir son propre domaine
- ✅ White-label possible

### 4. **Traçabilité**
- ✅ URLs uniques par service
- ✅ Facile à identifier d'où vient un scan

### 5. **Compatibilité**
- ✅ QR Codes
- ✅ Cartes NFC
- ✅ Liens partagés
- ✅ Mobile et Desktop

---

## 🧪 Tester les URLs

### 1. Créer des données de test

```bash
cd backend
node seeds/demo-scan.seed.js
```

### 2. Vérifier les URLs générées

Les URLs seront affichées dans la console :
```
✅ Service créé: Menu du midi (Token: a7f3e9d2c1b4a8f6)
   🔗 URL de test: http://localhost:5173/restaurant/restaurant-chez-marcel/a7f3e9d2c1b4a8f6
```

### 3. Tester dans le navigateur

Copiez l'URL et ouvrez-la → La page de scan devrait s'afficher ! ✅

---

## 🔧 Dépannage

### Problème : URLs avec mauvais domaine

**Cause :** `SCAN_BASE_URL` non configuré ou incorrect

**Solution :**
1. Vérifier `backend/.env`
2. S'assurer que `SCAN_BASE_URL` pointe vers le frontend
3. Redémarrer le backend

### Problème : Page 404 lors du scan

**Cause :** Route frontend non configurée

**Solution :**
1. Vérifier que la route existe dans `App.tsx`
2. Pattern : `/:cardType/:enterpriseSlug/:token`
3. Redémarrer le frontend

### Problème : CORS error

**Cause :** `FRONTEND_URL` différent de l'URL réelle

**Solution :**
1. Mettre à jour `FRONTEND_URL` dans `backend/.env`
2. Doit correspondre exactement à l'URL du frontend
3. Redémarrer le backend

---

## 📊 Résumé

| Configuration | Développement | Production |
|--------------|---------------|------------|
| **SCAN_BASE_URL** | `http://localhost:5173` | `https://votre-domaine.com` |
| **URL générée** | `localhost:5173/restaurant/...` | `votre-domaine.com/restaurant/...` |
| **Format** | `{base}/{type}/{slug}/{token}` | `{base}/{type}/{slug}/{token}` |
| **Changement** | Modifier `.env` | Modifier `.env` |
| **Redémarrage** | Backend uniquement | Backend uniquement |

---

## 🎉 C'est tout !

Votre système d'URLs dynamiques est prêt ! 

**Workflow :**
1. Configurez `SCAN_BASE_URL` dans `backend/.env`
2. Générez des cartes NFC via l'interface admin
3. Les URLs sont automatiquement créées avec votre domaine
4. Partagez via QR Code ou carte NFC physique
5. Clients scannent et gagnent des points ! 🚀

**Support :**
- Documentation complète dans `CONFIGURATION_PRODUCTION.md`
- Exemples de test dans `DEMO_SCAN.md`
- Guide complet dans `EXEMPLE_SCAN_NFC.md`
