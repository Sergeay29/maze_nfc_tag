# 🔄 Migration vers le nouveau système de scan

## 🎯 Qu'est-ce qui a changé ?

### Avant (Ancien système)
- Cartes liées à un **service spécifique**
- URL basée sur le **token du service**
- Points ajoutés automatiquement selon le service pré-défini

### Après (Nouveau système)
- Cartes **indépendantes** des services
- URL basée sur le **token de la carte** (scanToken)
- Employé **choisit le service** lors du scan
- Validation par **cardCode** pour sécuriser

---

## 📦 Changements techniques

### 1. Modèle NFCCard
**Nouveau champ ajouté :**
```javascript
scanToken: {
  type: DataTypes.STRING(32),
  allowNull: false,
  unique: true,
  comment: "Token unique pour l'URL de scan"
}
```

### 2. Format d'URL
**Nouveau format :**
```
{SCAN_BASE_URL}/{entreprise-slug}/{type-slug}/{scanToken}

Exemple:
http://localhost:5173/chez-marcel/restaurant/a7f3e9d2c1b4a8f6
```

### 3. Flux de scan
```
1. Client scanne → URL avec scanToken de la carte
2. Page affiche tous les services disponibles
3. Employé identifie le client (téléphone/email)
4. Employé sélectionne le service voulu
5. Modal s'ouvre → Saisie du cardCode pour validation
6. Points ajoutés selon le service choisi
```

---

## 🚀 Étapes de migration

### Étape 1 : Exécuter la migration

```bash
cd backend
node scripts/runMigration.js add-scan-token-to-cards
```

**Ce que fait cette migration :**
- ✅ Ajoute le champ `scanToken` à toutes les cartes
- ✅ Génère automatiquement des tokens uniques pour les cartes existantes
- ✅ Crée un index unique sur `scanToken`

### Étape 2 : Régénérer les URLs de scan

Les anciennes URLs ne fonctionneront plus. Vous avez 2 options :

#### Option A : Mettre à jour les URLs en base (Recommandé)

```sql
-- Script SQL pour régénérer les URLs de toutes les cartes
UPDATE nfc_cards
SET "scanUrl" = CONCAT(
  'http://localhost:5173/',
  LOWER(REGEXP_REPLACE(
    (SELECT name FROM enterprises WHERE enterprises.id = nfc_cards."enterpriseId"),
    '[^a-zA-Z0-9]+', '-', 'g'
  )),
  '/',
  LOWER(REGEXP_REPLACE(type, '[^a-zA-Z0-9]+', '-', 'g')),
  '/',
  "scanToken"
)
WHERE "scanToken" IS NOT NULL;
```

#### Option B : Régénérer les cartes (Si peu de cartes)

Via l'interface admin :
1. Supprimer les cartes existantes non attribuées
2. Générer de nouvelles cartes
3. Les nouvelles URLs seront créées automatiquement

### Étape 3 : Tester le nouveau flux

1. **Générer une carte de test**
   ```bash
   cd backend
   node seeds/demo-scan.seed.js
   ```

2. **Ouvrir l'URL affichée**
   ```
   http://localhost:5173/chez-marcel/restaurant/a7f3e9d2c1b4a8f6
   ```

3. **Tester le flux complet**
   - Identifier un client (téléphone/email)
   - Sélectionner un service
   - Saisir le cardCode dans le modal
   - Vérifier que les points sont ajoutés

---

## 📊 Comparaison des deux systèmes

| Aspect | Ancien système | Nouveau système |
|--------|----------------|-----------------|
| **Lien carte-service** | Obligatoire | Optionnel (NULL) |
| **Token utilisé** | Token du service | Token de la carte |
| **URL** | `/type/entreprise-type/serviceToken` | `/entreprise/type/cardToken` |
| **Sélection service** | Pré-défini | Lors du scan |
| **Validation** | Aucune | CardCode requis |
| **Flexibilité** | Service fixe | Service variable |
| **Sécurité** | Moyenne | Élevée (cardCode) |

---

## 🔧 Nouveaux endpoints API

### GET /api/scan/card/:token
Récupère les infos de la carte et les services disponibles

**Réponse :**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "uuid",
      "cardCode": "ABC123",
      "cardNumber": "RESTAU-REST-0001",
      "type": "Restaurant",
      "subtype": "Luxe"
    },
    "enterprise": {
      "id": "uuid",
      "name": "Chez Marcel",
      "logo": "...",
      "location": "Paris"
    },
    "services": [
      {
        "id": "uuid",
        "name": "Menu du midi",
        "pointsToAdd": 10,
        "icon": "🍽️",
        "color": "#6A35FF"
      }
    ]
  }
}
```

### POST /api/scan/validate-service
Valide le scan avec service sélectionné et cardCode

**Requête :**
```json
{
  "scanToken": "a7f3e9d2c1b4a8f6",
  "cardCode": "ABC123",
  "serviceId": "uuid-service",
  "phone": "+33612345678",
  "email": "client@example.com",
  "name": "Jean Dupont"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "+10 points ajoutés !",
  "data": {
    "pointsAdded": 10,
    "totalPoints": 120,
    "level": "Gold",
    "service": {
      "name": "Menu du midi",
      "icon": "🍽️"
    },
    "client": {
      "id": "uuid",
      "name": "Jean Dupont",
      "points": 120,
      "level": "Gold"
    }
  }
}
```

---

## ⚠️ Points d'attention

### 1. Cartes existantes avec service pré-défini
Les cartes avec `serviceId` non-NULL continueront de fonctionner, mais il est recommandé de mettre `serviceId` à NULL pour utiliser le nouveau système.

```sql
-- Optionnel : Mettre à NULL les serviceId existants
UPDATE nfc_cards SET "serviceId" = NULL;
```

### 2. QR Codes imprimés
Si vous avez déjà imprimé des QR Codes avec les anciennes URLs, ils ne fonctionneront plus. Il faudra :
- Réimprimer les QR Codes avec les nouvelles URLs
- Ou créer une redirection côté serveur

### 3. Cartes NFC programmées
Les cartes NFC physiques devront être reprogrammées avec les nouvelles URLs.

---

## ✅ Checklist de migration

- [ ] Backup de la base de données
- [ ] Exécuter la migration `add-scan-token-to-cards`
- [ ] Vérifier que tous les `scanToken` sont générés
- [ ] Mettre à jour les `scanUrl` en base (si nécessaire)
- [ ] Tester le nouveau flux de scan
- [ ] Vérifier l'identification client
- [ ] Vérifier la sélection de service
- [ ] Vérifier la validation par cardCode
- [ ] Vérifier l'ajout de points
- [ ] Réimprimer les QR Codes (si nécessaire)
- [ ] Reprogrammer les cartes NFC (si nécessaire)

---

## 🆘 Rollback

Si vous rencontrez des problèmes, vous pouvez revenir en arrière :

```bash
cd backend
node scripts/runMigration.js add-scan-token-to-cards --down
```

⚠️ **Attention** : Le rollback supprimera tous les `scanToken` générés !

---

## 📚 Documentation

- **Guide complet** : `URL_DYNAMIQUES_GUIDE.md`
- **Exemple rapide** : `EXEMPLE_RAPIDE_URL.md`
- **Configuration prod** : `CONFIGURATION_PRODUCTION.md`

---

## 🎉 Avantages du nouveau système

1. ✅ **Flexibilité** : Un service différent à chaque scan
2. ✅ **Sécurité** : Validation par cardCode physique
3. ✅ **Traçabilité** : Chaque scan enregistre le service utilisé
4. ✅ **Simplicité** : URL basée sur la carte, pas le service
5. ✅ **Évolutivité** : Facile d'ajouter/modifier des services

---

**Date de migration** : À définir
**Statut** : ✅ Prêt à déployer
