# Guide de test rapide - URLs de scan dynamiques

## ✅ Checklist de vérification

### 1. Configuration (5 min)

- [ ] Le fichier `.env` contient `SCAN_BASE_URL=https://mzg.cards`
- [ ] Le serveur démarre sans erreur avec `npm run dev`
- [ ] La documentation Swagger est accessible sur `http://localhost:3000/api/docs`

### 2. Migration (2 min)

```bash
cd backend
node scripts/runMigration.js add-service-token-and-card-service
```

**Vérifications attendues :**
```
✅ Connexion à la base de données établie
✅ Migration exécutée avec succès !
```

### 3. Vérification SQL (3 min)

```sql
-- Vérifier que tous les services ont un token
SELECT id, name, "scanToken" FROM services LIMIT 5;
```

**Résultat attendu :**
| id | name | scanToken |
|----|------|-----------|
| uuid | Service 1 | a7f3e9d2c1b4a8f6... |
| uuid | Service 2 | b8g4f0e3d2c5b9g7... |

---

## 🧪 Test complet (10 min)

### Étape 1 : Se connecter

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@mazenfc.com",
  "password": "Admin123!@#"
}
```

**Sauvegarder le token** retourné dans la réponse.

---

### Étape 2 : Récupérer une entreprise

```bash
GET http://localhost:3000/api/admin/enterprises
Authorization: Bearer {votre_token}
```

**Noter l'ID** de la première entreprise.

---

### Étape 3 : Créer un service

```bash
POST http://localhost:3000/api/enterprise/services
Authorization: Bearer {votre_token}
Content-Type: application/json

{
  "name": "Test Visite Standard",
  "description": "Service de test",
  "pointsToAdd": 10,
  "icon": "calendar",
  "color": "#6A35FF",
  "isActive": true
}
```

**Vérifier dans la réponse :**
```json
{
  "success": true,
  "data": {
    "scanToken": "a7f3e9d2..."  ← Doit être présent (32 caractères)
  }
}
```

**Noter le `scanToken`** généré.

---

### Étape 4 : Récupérer les types de cartes

```bash
GET http://localhost:3000/api/admin/card-types
Authorization: Bearer {votre_token}
```

**Noter l'ID** d'un type de carte (ex: "Restaurant").

---

### Étape 5 : Générer des cartes NFC

```bash
POST http://localhost:3000/api/admin/cards/generate
Authorization: Bearer {votre_token}
Content-Type: application/json

{
  "enterpriseId": "{id_entreprise}",
  "cardTypeId": "{id_type_carte}",
  "serviceId": "{id_service_créé}",
  "subtype": "Standard",
  "quantity": 5
}
```

**Vérifier dans la réponse :**
```json
{
  "success": true,
  "message": "5 carte(s) générée(s) avec succès",
  "data": {
    "generated": 5,
    "scanUrl": "https://mzg.cards/restaurant/nom-entreprise-restaurant-standard/a7f3e9d2..."
  }
}
```

**✅ L'URL doit suivre le format :** `{domain}/{type}/{entreprise-type-subtype}/{token}`

---

### Étape 6 : Vérifier les cartes générées

```bash
GET http://localhost:3000/api/admin/cards?enterpriseId={id_entreprise}
Authorization: Bearer {votre_token}
```

**Vérifier que :**
- Les cartes ont le bon format de `scanUrl`
- Le `serviceId` est présent
- Les `cardNumber` suivent le format `ENTREPRISE-TYPE-0001`, `ENTREPRISE-TYPE-0002`, etc.

---

## 🎯 Validation des URLs

### Format attendu

```
https://mzg.cards/{type-carte}/{entreprise-type-subtype}/{token}
```

### Exemples valides

✅ **Avec subtype :**
```
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
```

✅ **Sans subtype :**
```
https://mzg.cards/salon/coiffure-moderne-salon/x9y8z7w6v5u4
```

### Points à vérifier

- [ ] Le type de carte est en minuscules
- [ ] Le nom d'entreprise est slugifié (sans accents, avec tirets)
- [ ] Le subtype est ajouté s'il existe
- [ ] Le token correspond au `scanToken` du service
- [ ] Pas de doubles slashes `//`
- [ ] Pas de slash à la fin

---

## 🐛 Troubleshooting

### Erreur : "SCAN_BASE_URL n'est pas configuré"

**Solution :**
```bash
echo "SCAN_BASE_URL=https://mzg.cards" >> .env
```
Puis redémarrer le serveur.

---

### Erreur : "Service introuvable"

**Causes possibles :**
1. Le `serviceId` n'existe pas
2. Le service n'appartient pas à l'entreprise spécifiée

**Solution :**
Créer d'abord un service, puis utiliser son ID.

---

### Erreur lors de la migration

**Solution :**
Vérifier que PostgreSQL est démarré et accessible :
```bash
psql -U postgres -d maze_nfc -c "SELECT version();"
```

---

### Les tokens ne sont pas générés

**Vérifier :**
```sql
SELECT id, name, "scanToken" FROM services WHERE "scanToken" IS NULL;
```

Si des services n'ont pas de token :
```sql
UPDATE services SET "scanToken" = md5(random()::text) WHERE "scanToken" IS NULL;
```

---

## 📊 Tests SQL supplémentaires

### Voir les services avec leurs tokens

```sql
SELECT 
  id,
  name,
  "scanToken",
  "pointsToAdd",
  "isActive"
FROM services
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Voir les cartes avec leurs services

```sql
SELECT 
  nc.id,
  nc."cardNumber",
  nc."scanUrl",
  s.name as service_name,
  s."scanToken",
  e.name as enterprise_name
FROM nfc_cards nc
LEFT JOIN services s ON nc."serviceId" = s.id
LEFT JOIN enterprises e ON nc."enterpriseId" = e.id
ORDER BY nc."createdAt" DESC
LIMIT 10;
```

### Compter les cartes par service

```sql
SELECT 
  s.name as service,
  COUNT(nc.id) as nb_cartes
FROM services s
LEFT JOIN nfc_cards nc ON s.id = nc."serviceId"
GROUP BY s.id, s.name
ORDER BY nb_cartes DESC;
```

---

## 🎉 Test réussi si...

- [x] La migration s'exécute sans erreur
- [x] Tous les services ont un `scanToken` unique
- [x] Les nouvelles cartes ont un `serviceId`
- [x] Les URLs suivent le format `domain/type/entreprise-type/token`
- [x] Les URLs ne contiennent pas de caractères spéciaux
- [x] Les slugs sont en minuscules sans accents

---

## 📝 Commandes utiles

### Relancer la migration (rollback puis up)

```bash
# Rollback
node -e "require('dotenv').config(); const migration = require('./migrations/add-service-token-and-card-service'); const sequelize = require('./config/database'); const Sequelize = require('sequelize'); migration.down(sequelize.getQueryInterface(), Sequelize).then(() => console.log('Rollback OK')).catch(console.error);"

# Up
node scripts/runMigration.js add-service-token-and-card-service
```

### Vérifier la structure de la table services

```sql
\d services
```

### Vérifier la structure de la table nfc_cards

```sql
\d nfc_cards
```

---

## ⏱️ Temps estimé

- Configuration : 5 min
- Migration : 2 min
- Tests : 10 min
- **Total : ~20 min**

---

**Date de création :** 2024-01-15  
**Dernière mise à jour :** 2024-01-15
