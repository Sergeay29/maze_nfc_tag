# Résumé de l'implémentation - URLs de scan dynamiques

## 📋 Ce qui a été fait

### ✅ Modifications du Backend

#### 1. Modèles de données
- **`models/service.js`** : Ajout du champ `scanToken` (32 caractères, unique, auto-généré)
- **`models/nfcCard.js`** : Ajout du champ `serviceId` (relation vers services)
- **`models/index.js`** : Ajout de la relation Service ↔ NFCCard

#### 2. Utilitaires
- **`utils/urlGenerator.js`** : Nouvelles fonctions créées
  - `generateScanUrl()` - Génère l'URL au format `domain/type/entreprise-type/token`
  - `generateServiceToken()` - Génère un token unique de 32 caractères
  - `generateCardCode()` - Génère un code de carte de 8 caractères
  - `slugify()` - Convertit une chaîne en slug URL-friendly

#### 3. Contrôleurs
- **`controllers/adminController.js`** : Mise à jour de 2 fonctions
  - `generateCards()` - Utilise maintenant `serviceId` au lieu de `scanBaseUrl`
  - `createEnterprise()` - Génération de cartes mise à jour

#### 4. Migration
- **`migrations/add-service-token-and-card-service.js`** : Migration complète
  - Ajoute `scanToken` à tous les services existants
  - Ajoute `serviceId` à la table nfc_cards
  - Crée les index nécessaires
  - Gère le rollback

#### 5. Scripts
- **`scripts/runMigration.js`** : Script pour exécuter les migrations facilement

#### 6. Configuration
- **`.env.example`** : Ajout de `SCAN_BASE_URL=https://mzg.cards`

#### 7. Documentation
- **`backend/README.md`** : Documentation complète du backend
- **`MIGRATION_GUIDE.md`** : Guide détaillé de migration
- **`CHANGELOG_SCAN_URLS.md`** : Liste complète des changements
- **`utils/urlGenerator.test.example.js`** : Tests d'exemple

---

## 🎯 Format des URLs générées

### Structure
```
{SCAN_BASE_URL}/{type-carte}/{entreprise-type-subtype}/{token}
```

### Exemples concrets

**Restaurant Luxe :**
```
Entrées :
- Type de carte : "Restaurant"
- Entreprise : "Chez Marcel"
- Subtype : "Luxe"
- Token service : "a7f3e9d2c1b4a8f6"

Sortie :
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

**Salon Standard :**
```
Entrées :
- Type de carte : "Salon"
- Entreprise : "Coiffure Moderne"
- Subtype : "Standard"
- Token service : "x9y8z7w6v5u4"

Sortie :
https://mzg.cards/salon/coiffure-moderne-salon-standard/x9y8z7w6v5u4
```

**Boutique (sans subtype) :**
```
Entrées :
- Type de carte : "Boutique"
- Entreprise : "Mode & Style"
- Subtype : null
- Token service : "m1o2d3e4s5t6"

Sortie :
https://mzg.cards/boutique/mode-style-boutique/m1o2d3e4s5t6
```

---

## 🚀 Comment l'utiliser

### 1. Configuration initiale

**Ajouter dans `.env` :**
```env
SCAN_BASE_URL=https://mzg.cards
```

### 2. Exécuter la migration

```bash
cd backend
node scripts/runMigration.js add-service-token-and-card-service
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

### 4. Créer un service (nouveau ou existant)

```bash
POST /api/enterprise/services
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Visite standard",
  "description": "Service de visite classique",
  "pointsToAdd": 10,
  "icon": "calendar",
  "color": "#6A35FF",
  "isActive": true
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Service créé avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Visite standard",
    "scanToken": "a7f3e9d2c1b4a8f6e7d8c9b0a1f2e3d4",  ← Token auto-généré
    "pointsToAdd": 10,
    ...
  }
}
```

### 5. Générer des cartes NFC

```bash
POST /api/admin/cards/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "enterpriseId": "550e8400-e29b-41d4-a716-446655440001",
  "cardTypeId": "550e8400-e29b-41d4-a716-446655440002",
  "serviceId": "550e8400-e29b-41d4-a716-446655440000",  ← ID du service créé
  "subtype": "Luxe",
  "quantity": 10
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "10 carte(s) générée(s) avec succès",
  "data": {
    "generated": 10,
    "scanUrl": "https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6..."
  }
}
```

Les cartes auront automatiquement des URLs du type :
```
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
...
```

---

## 📊 Changements d'API

### Avant / Après

**Génération de cartes :**
```diff
POST /api/admin/cards/generate
{
  "enterpriseId": "uuid",
  "cardTypeId": "uuid",
- "scanBaseUrl": "https://mzg.cards/c/",
+ "serviceId": "uuid",
  "subtype": "Luxe",
  "quantity": 10
}
```

**Création d'entreprise avec génération de cartes :**
```diff
POST /api/admin/enterprises
{
  "name": "Chez Marcel",
  ...
  "cardGeneration": {
    "enabled": true,
-   "type": "Restaurant",
+   "cardTypeId": "uuid",
+   "serviceId": "uuid",
    "subtype": "Luxe",
-   "scanBaseUrl": "https://mzg.cards/c/",
    "quantity": 50
  }
}
```

---

## ⚠️ Points importants

### 1. Dépendance Service → Cartes
Désormais, **vous devez créer un service avant de générer des cartes**.

**Workflow recommandé :**
1. Créer l'entreprise
2. Créer au moins un service pour cette entreprise
3. Générer les cartes en spécifiant le service

### 2. Services existants
- Tous les services existants reçoivent automatiquement un `scanToken` lors de la migration
- Aucune action manuelle nécessaire

### 3. Cartes existantes
- Les cartes existantes **conservent leur ancienne URL**
- Elles ne sont **pas automatiquement migrées**
- Pour les migrer, il faudra :
  - Associer chaque carte à un service (`serviceId`)
  - Régénérer les URLs avec la nouvelle logique

### 4. Variable d'environnement obligatoire
```env
SCAN_BASE_URL=https://mzg.cards
```
Sans cette variable, la génération de cartes échouera.

---

## 🧪 Tests

### Vérifier la migration

```sql
-- Tous les services doivent avoir un token
SELECT id, name, "scanToken" FROM services WHERE "scanToken" IS NULL;
-- Résultat attendu : 0 ligne

-- Vérifier la structure
SELECT 
  nc.id,
  nc."cardNumber",
  nc."scanUrl",
  s.name as service_name,
  s."scanToken"
FROM nfc_cards nc
LEFT JOIN services s ON nc."serviceId" = s.id
LIMIT 10;
```

### Tester la génération

1. **Créer un service** et noter le `scanToken` retourné
2. **Générer des cartes** avec ce service
3. **Vérifier les URLs** générées dans la réponse

---

## 📁 Fichiers modifiés/créés

### Fichiers modifiés
```
backend/
├── models/
│   ├── service.js           ✏️ Modifié
│   ├── nfcCard.js           ✏️ Modifié
│   └── index.js             ✏️ Modifié
├── controllers/
│   └── adminController.js   ✏️ Modifié
└── .env.example             ✏️ Modifié
```

### Fichiers créés
```
backend/
├── utils/
│   ├── urlGenerator.js                      ✅ Nouveau
│   └── urlGenerator.test.example.js         ✅ Nouveau
├── migrations/
│   └── add-service-token-and-card-service.js ✅ Nouveau
├── scripts/
│   └── runMigration.js                      ✅ Nouveau
└── README.md                                ✅ Nouveau

Racine/
├── MIGRATION_GUIDE.md                       ✅ Nouveau
├── CHANGELOG_SCAN_URLS.md                   ✅ Nouveau
└── IMPLEMENTATION_SUMMARY.md                ✅ Nouveau (ce fichier)
```

---

## 🔄 Prochaines étapes

### Obligatoire
1. ✅ **Ajouter `SCAN_BASE_URL` dans `.env`**
2. ✅ **Exécuter la migration** : `node scripts/runMigration.js add-service-token-and-card-service`
3. ✅ **Redémarrer le serveur**

### Frontend (à faire)
1. ⏳ **Modifier le formulaire de génération de cartes**
   - Retirer le champ `scanBaseUrl`
   - Ajouter un sélecteur de `serviceId`
   - Filtrer les services par entreprise

2. ⏳ **Modifier le formulaire de création d'entreprise**
   - Si génération de cartes activée, demander `serviceId`
   - Ajouter `cardTypeId` à la place de `type`

3. ⏳ **Afficher le service associé aux cartes**
   - Dans la liste des cartes
   - Dans les détails de la carte

### Recommandé (optionnel)
1. ⏳ **Ajouter des tests unitaires** pour `urlGenerator.js`
2. ⏳ **Mettre à jour la documentation Swagger**
3. ⏳ **Créer un script de migration des anciennes cartes**

---

## 💡 Exemples de code

### Générer une URL manuellement
```javascript
const { generateScanUrl } = require('./utils/urlGenerator');

const url = generateScanUrl({
  cardType: 'Restaurant',
  enterpriseName: 'Chez Marcel',
  subtype: 'Luxe',
  scanToken: service.scanToken,
  baseUrl: process.env.SCAN_BASE_URL
});

console.log(url);
// https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

### Créer un service avec token
```javascript
const { Service } = require('./models');

const service = await Service.create({
  name: "Visite VIP",
  description: "Service premium",
  pointsToAdd: 50,
  enterpriseId: "...",
  // scanToken sera auto-généré
});

console.log(service.scanToken);
// a7f3e9d2c1b4a8f6e7d8c9b0a1f2e3d4
```

---

## 📞 Support

Pour toute question :
1. Consultez le `MIGRATION_GUIDE.md` pour les détails
2. Consultez le `CHANGELOG_SCAN_URLS.md` pour les changements
3. Consultez le code dans `utils/urlGenerator.js` pour les détails techniques

---

## ✨ Résumé en une phrase

**Les URLs de scan des cartes NFC sont maintenant générées automatiquement au format lisible `domain/type/entreprise/token` à partir d'un service associé, sans besoin de saisie manuelle.**

---

**Statut :** ✅ Implémentation backend complète  
**Reste à faire :** Frontend (formulaires et affichage)
