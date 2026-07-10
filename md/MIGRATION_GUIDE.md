# Guide de migration - URLs de scan dynamiques

Ce guide explique les changements apportés pour la génération automatique des URLs de scan des cartes NFC.

## 🎯 Objectif

Générer automatiquement les URLs de scan au format :
```
nomdedomaine.com/typedecarte/entreprise-type/token
```

**Exemple :**
```
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

## 📦 Changements apportés

### 1. Modèle `Service`
**Nouveau champ ajouté :**
- `scanToken` (STRING 32 caractères, unique, généré automatiquement)

Ce token unique est généré lors de la création d'un service et sera utilisé dans les URLs de scan.

### 2. Modèle `NFCCard`
**Nouveau champ ajouté :**
- `serviceId` (UUID, clé étrangère vers `services`)

**Champ modifié :**
- `scanUrl` : L'URL n'est plus demandée manuellement, elle est générée automatiquement

### 3. Variable d'environnement
**Nouvelle variable requise dans `.env` :**
```env
SCAN_BASE_URL=https://mzg.cards
```

### 4. Nouvelle utilitaire
**Fichier créé :** `backend/utils/urlGenerator.js`

Contient les fonctions :
- `generateScanUrl()` - Génère l'URL de scan complète
- `generateServiceToken()` - Génère un token unique
- `generateCardCode()` - Génère un code de carte
- `slugify()` - Convertit une chaîne en slug URL-friendly

### 5. Contrôleurs mis à jour

**`adminController.js`**
- `generateCards()` : Ne demande plus `scanBaseUrl`, demande maintenant `serviceId`
- `createEnterprise()` : Mis à jour pour la génération de cartes lors de la création d'entreprise

## 🚀 Étapes de migration

### Étape 1 : Mettre à jour le code

Le code a déjà été mis à jour avec tous les changements nécessaires.

### Étape 2 : Ajouter la variable d'environnement

Ouvrir le fichier `.env` et ajouter :
```env
SCAN_BASE_URL=https://mzg.cards
```

Remplacez `https://mzg.cards` par votre propre domaine de production.

### Étape 3 : Exécuter la migration de base de données

```bash
cd backend
node scripts/runMigration.js add-service-token-and-card-service
```

Cette migration va :
1. Ajouter le champ `scanToken` à la table `services`
2. Générer des tokens pour tous les services existants
3. Ajouter le champ `serviceId` à la table `nfc_cards`
4. Créer les index nécessaires

### Étape 4 : Redémarrer le serveur

```bash
npm run dev
```

### Étape 5 : Vérifier la migration

Vous pouvez vérifier que la migration a fonctionné en :

1. **Consultant les services existants :**
```sql
SELECT id, name, "scanToken" FROM services;
```
Chaque service devrait avoir un `scanToken` unique.

2. **Testant la génération de cartes :**
```bash
POST /api/admin/cards/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "enterpriseId": "uuid-de-lentreprise",
  "cardTypeId": "uuid-du-type-carte",
  "serviceId": "uuid-du-service",
  "subtype": "Luxe",
  "quantity": 10
}
```

Les cartes générées devraient avoir des URLs au format :
```
https://mzg.cards/restaurant/nom-entreprise-restaurant-luxe/a7f3e9d2c1b4a8f6
```

## 📋 Nouveaux paramètres API

### Génération de cartes (Admin)

**Avant :**
```json
{
  "enterpriseId": "uuid",
  "cardTypeId": "uuid",
  "subtype": "Luxe",
  "scanBaseUrl": "https://mzg.cards/c/",  ❌ Supprimé
  "quantity": 10
}
```

**Après :**
```json
{
  "enterpriseId": "uuid",
  "cardTypeId": "uuid",
  "serviceId": "uuid",  ✅ Nouveau (requis)
  "subtype": "Luxe",
  "quantity": 10
}
```

### Création d'entreprise avec génération de cartes

**Avant :**
```json
{
  "name": "Chez Marcel",
  "email": "contact@chezmarcel.fr",
  ...
  "cardGeneration": {
    "enabled": true,
    "type": "Restaurant",
    "subtype": "Luxe",
    "scanBaseUrl": "https://mzg.cards/c/",  ❌ Supprimé
    "quantity": 50
  }
}
```

**Après :**
```json
{
  "name": "Chez Marcel",
  "email": "contact@chezmarcel.fr",
  ...
  "cardGeneration": {
    "enabled": true,
    "cardTypeId": "uuid-du-type",  ✅ Nouveau
    "serviceId": "uuid-du-service",  ✅ Nouveau (requis)
    "subtype": "Luxe",
    "quantity": 50
  }
}
```

## 🔍 Format des URLs générées

### Structure
```
{SCAN_BASE_URL}/{type-carte}/{entreprise-type-subtype}/{token}
```

### Exemples

1. **Restaurant Standard**
```
Entreprise: "Chez Marcel"
Type: "Restaurant"
Subtype: null
Token: "a7f3e9d2c1b4a8f6"

→ https://mzg.cards/restaurant/chez-marcel-restaurant/a7f3e9d2c1b4a8f6
```

2. **Restaurant Luxe**
```
Entreprise: "Le Gourmet"
Type: "Restaurant"
Subtype: "Luxe"
Token: "b8g4f0e3d2c5b9g7"

→ https://mzg.cards/restaurant/le-gourmet-restaurant-luxe/b8g4f0e3d2c5b9g7
```

3. **Salon de coiffure**
```
Entreprise: "Coiff' & Style"
Type: "Salon"
Subtype: "Premium"
Token: "c9h5g1f4e3d6c0h8"

→ https://mzg.cards/salon/coiff-style-salon-premium/c9h5g1f4e3d6c0h8
```

## 🎨 Mise à jour du Frontend

### Pages à mettre à jour

1. **Page de génération de cartes (Admin)**
   - Retirer le champ `scanBaseUrl`
   - Ajouter un sélecteur de `serviceId`
   - Le service doit appartenir à l'entreprise sélectionnée

2. **Page de création d'entreprise (Admin)**
   - Si génération de cartes activée, demander `serviceId`
   - Note : Il faudra peut-être créer le service d'abord, ou permettre sa création inline

3. **Affichage des cartes**
   - Les URLs sont maintenant plus lisibles et SEO-friendly
   - Afficher le service associé à chaque carte

## ⚠️ Points d'attention

### Services existants
- Tous les services existants recevront automatiquement un `scanToken` lors de la migration
- Les services créés après la migration auront leur token généré automatiquement

### Cartes existantes
- Les cartes NFC existantes conservent leur ancienne `scanUrl`
- Elles ne sont **pas** automatiquement migrées vers le nouveau format
- Pour les migrer, il faudrait :
  1. Associer chaque carte à un service (`serviceId`)
  2. Régénérer les URLs avec `generateScanUrl()`

### Nouvelle logique obligatoire
- Désormais, **un service doit exister** avant de pouvoir générer des cartes
- Cela crée une dépendance logique : Entreprise → Service → Cartes NFC

## 🧪 Tests

### Tester la génération de token
```bash
# Créer un service
POST /api/enterprise/services
{
  "name": "Visite standard",
  "description": "Service de visite classique",
  "pointsToAdd": 10
}

# Réponse attendue
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Visite standard",
    "scanToken": "a7f3e9d2c1b4a8f6...",  ✅ Token auto-généré
    ...
  }
}
```

### Tester la génération de cartes
```bash
# Générer 5 cartes
POST /api/admin/cards/generate
{
  "enterpriseId": "...",
  "cardTypeId": "...",
  "serviceId": "...",  ✅ ID du service créé précédemment
  "subtype": "Standard",
  "quantity": 5
}

# Vérifier les URLs générées
GET /api/admin/cards?enterpriseId=...
```

## 🐛 Problèmes connus et solutions

### Erreur : "SCAN_BASE_URL n'est pas configuré"
**Solution :** Ajouter `SCAN_BASE_URL=https://mzg.cards` dans le fichier `.env`

### Erreur : "Service introuvable"
**Solution :** Vérifier que le `serviceId` existe et appartient à l'entreprise spécifiée

### Tokens en double
**Solution :** Les tokens sont uniques grâce à la contrainte UNIQUE en base. En cas de conflit (très rare avec 16 bytes), un nouveau token sera généré automatiquement.

## 📞 Support

Pour toute question concernant cette migration, consultez la documentation ou ouvrez une issue sur le projet.
