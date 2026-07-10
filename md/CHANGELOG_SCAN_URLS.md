# Changelog - Génération dynamique des URLs de scan

## Version 2.0.0 - Génération automatique des URLs de scan

### 🎯 Objectif
Automatiser la génération des URLs de scan des cartes NFC selon le format :
```
nomdedomaine.com/typedecarte/entreprise-type/token
```

---

## ✨ Nouvelles fonctionnalités

### 1. Tokens de service uniques
- Chaque service reçoit maintenant un `scanToken` unique généré automatiquement
- Le token est utilisé dans la construction des URLs de scan
- Format : 32 caractères hexadécimaux (16 bytes)

### 2. Génération automatique des URLs
- Les URLs de scan ne sont plus saisies manuellement
- Elles sont construites dynamiquement à partir de :
  - Type de carte (slugifié)
  - Nom d'entreprise + type (slugifié)
  - Sous-type optionnel (slugifié)
  - Token du service

### 3. URLs SEO-friendly
Les URLs générées sont lisibles et optimisées pour le SEO :
```
❌ Avant : https://mzg.cards/c/ABC123XYZ
✅ Après  : https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

---

## 🔧 Modifications techniques

### Backend

#### Modèles modifiés

**`models/service.js`**
```javascript
// Nouveau champ ajouté
scanToken: {
  type: DataTypes.STRING(32),
  allowNull: false,
  unique: true,
  defaultValue: () => crypto.randomBytes(16).toString('hex'),
}
```

**`models/nfcCard.js`**
```javascript
// Nouveau champ ajouté
serviceId: {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: "services", key: "id" },
}

// Champ modifié (validation retirée)
scanUrl: {
  type: DataTypes.STRING(500),
  allowNull: false,
  comment: "URL générée dynamiquement",
}
```

**`models/index.js`**
```javascript
// Nouvelle relation ajoutée
Service.hasMany(NFCCard, { foreignKey: "serviceId" });
NFCCard.belongsTo(Service, { foreignKey: "serviceId" });
```

#### Nouveaux fichiers

**`utils/urlGenerator.js`**
Fonctions utilitaires :
- `generateScanUrl()` - Génère l'URL complète
- `generateServiceToken()` - Génère un token unique
- `generateCardCode()` - Génère un code de carte
- `slugify()` - Convertit une chaîne en slug

**`migrations/add-service-token-and-card-service.js`**
Migration pour :
- Ajouter `scanToken` aux services existants
- Ajouter `serviceId` aux cartes NFC
- Créer les index nécessaires

**`scripts/runMigration.js`**
Script pour exécuter les migrations facilement

**`backend/README.md`**
Documentation complète du backend

#### Contrôleurs modifiés

**`controllers/adminController.js`**
- `generateCards()` : Paramètre `scanBaseUrl` → `serviceId`
- `createEnterprise()` : Mise à jour pour la génération de cartes

#### Configuration

**`.env.example`**
```env
# Nouvelle variable d'environnement
SCAN_BASE_URL=https://mzg.cards
```

---

## 📝 Changements d'API

### Endpoint : `POST /api/admin/cards/generate`

**Avant :**
```json
{
  "enterpriseId": "uuid",
  "cardTypeId": "uuid",
  "subtype": "Luxe",
  "scanBaseUrl": "https://mzg.cards/c/",
  "quantity": 10
}
```

**Après :**
```json
{
  "enterpriseId": "uuid",
  "cardTypeId": "uuid",
  "serviceId": "uuid",        // ✅ Nouveau - REQUIS
  "subtype": "Luxe",          // Optionnel
  "quantity": 10
}
```

**Réponse enrichie :**
```json
{
  "success": true,
  "message": "10 carte(s) générée(s) avec succès",
  "data": {
    "generated": 10,
    "scanUrl": "https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2..."
  }
}
```

### Endpoint : `POST /api/admin/enterprises`

**cardGeneration avant :**
```json
{
  "enabled": true,
  "type": "Restaurant",
  "subtype": "Luxe",
  "scanBaseUrl": "https://mzg.cards/c/",
  "quantity": 50
}
```

**cardGeneration après :**
```json
{
  "enabled": true,
  "cardTypeId": "uuid",      // ✅ Nouveau - REQUIS
  "serviceId": "uuid",       // ✅ Nouveau - REQUIS
  "subtype": "Luxe",
  "quantity": 50
}
```

### Endpoint : `POST /api/enterprise/services`

**Réponse enrichie :**
```json
{
  "success": true,
  "message": "Service créé avec succès",
  "data": {
    "id": "...",
    "name": "Visite standard",
    "description": "...",
    "pointsToAdd": 10,
    "scanToken": "a7f3e9d2c1b4a8f6...",  // ✅ Auto-généré
    "isActive": true,
    "icon": null,
    "color": "#6A35FF",
    "enterpriseId": "...",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔄 Migration nécessaire

### Étapes pour migrer une instance existante

1. **Mettre à jour le code**
   ```bash
   git pull origin main
   cd backend
   npm install
   ```

2. **Ajouter la variable d'environnement**
   ```bash
   echo "SCAN_BASE_URL=https://mzg.cards" >> .env
   ```

3. **Exécuter la migration**
   ```bash
   node scripts/runMigration.js add-service-token-and-card-service
   ```

4. **Redémarrer le serveur**
   ```bash
   npm run dev
   ```

### Vérifications post-migration

```sql
-- Vérifier que tous les services ont un token
SELECT id, name, "scanToken" FROM services WHERE "scanToken" IS NULL;
-- Résultat attendu : 0 ligne

-- Vérifier les relations
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

---

## ⚠️ Breaking Changes

### Pour les développeurs Frontend

1. **Génération de cartes**
   - Le champ `scanBaseUrl` a été supprimé
   - Le champ `serviceId` est maintenant **requis**
   - Ajouter un sélecteur de service dans le formulaire

2. **Création d'entreprise**
   - Si `cardGeneration.enabled = true`, les champs `cardTypeId` et `serviceId` sont requis
   - Le `type` en string a été remplacé par `cardTypeId` en UUID

3. **Affichage des cartes**
   - Les cartes ont maintenant une relation `Service`
   - Afficher le service associé dans l'UI

### Pour les API consumers

1. **Toutes les nouvelles cartes doivent avoir un `serviceId`**
2. **Le format des URLs a changé** - mettre à jour les parsers d'URL si nécessaire
3. **Les anciennes cartes conservent leur ancienne URL** - pas de rétrocompatibilité automatique

---

## 📊 Impact sur les performances

### Positif
- ✅ Index ajouté sur `nfc_cards.serviceId` pour améliorer les jointures
- ✅ Génération d'URL en mémoire (pas de requête DB supplémentaire)

### Neutre
- ➖ Nouvelle jointure possible entre `NFCCard` et `Service`
- ➖ Champ `scanToken` unique (contrainte d'unicité en DB)

---

## 🧪 Tests recommandés

### Tests unitaires à ajouter

```javascript
// utils/urlGenerator.test.js
describe('generateScanUrl', () => {
  it('génère une URL valide avec tous les paramètres', () => {
    const url = generateScanUrl({
      cardType: 'Restaurant',
      enterpriseName: 'Chez Marcel',
      subtype: 'Luxe',
      scanToken: 'abc123',
      baseUrl: 'https://mzg.cards'
    });
    
    expect(url).toBe('https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/abc123');
  });
  
  it('génère une URL sans subtype', () => {
    const url = generateScanUrl({
      cardType: 'Salon',
      enterpriseName: "Coiff'Style",
      subtype: null,
      scanToken: 'xyz789',
      baseUrl: 'https://mzg.cards'
    });
    
    expect(url).toBe('https://mzg.cards/salon/coiff-style-salon/xyz789');
  });
});
```

### Tests d'intégration

1. Créer un service → vérifier le `scanToken` généré
2. Générer des cartes → vérifier le format des URLs
3. Scanner une carte → vérifier la résolution de l'URL

---

## 📚 Documentation

### Nouveaux documents créés

1. **`backend/README.md`**
   - Documentation complète du backend
   - Instructions d'installation
   - Explication de la génération d'URLs

2. **`MIGRATION_GUIDE.md`**
   - Guide détaillé de migration
   - Étapes pas à pas
   - Exemples et troubleshooting

3. **`CHANGELOG_SCAN_URLS.md`** (ce fichier)
   - Récapitulatif de tous les changements
   - Breaking changes
   - Impact sur les systèmes existants

---

## 🔮 Prochaines étapes recommandées

### Court terme
- [ ] Mettre à jour le frontend pour utiliser `serviceId` au lieu de `scanBaseUrl`
- [ ] Ajouter des tests unitaires pour `urlGenerator.js`
- [ ] Documenter le format d'URL dans Swagger

### Moyen terme
- [ ] Migration des anciennes cartes vers le nouveau format d'URL
- [ ] Création d'un endpoint pour régénérer les URLs des cartes existantes
- [ ] Ajout de métriques sur l'utilisation des différents formats d'URL

### Long terme
- [ ] Système de redirection pour les anciennes URLs
- [ ] Analytics sur les URLs de scan les plus utilisées
- [ ] Personnalisation du format d'URL par entreprise

---

## 👥 Contributeurs

Cette fonctionnalité a été développée pour améliorer :
- La lisibilité des URLs de scan
- Le référencement SEO
- L'expérience utilisateur
- La traçabilité des services

---

## 📞 Support

Pour toute question ou problème lié à cette mise à jour :
1. Consultez le `MIGRATION_GUIDE.md`
2. Vérifiez la documentation Swagger : `http://localhost:3000/api/docs`
3. Ouvrez une issue sur le projet

---

**Date de release :** 2024-01-15  
**Version :** 2.0.0  
**Type :** Breaking Change
