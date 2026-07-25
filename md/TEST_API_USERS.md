# Test de l'API Utilisateurs

## Prérequis
- Backend démarré sur http://localhost:3000
- Token d'authentification SUPER_ADMIN

## Obtenir un token SUPER_ADMIN

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maze-nfc.com",
    "password": "votre_mot_de_passe"
  }'
```

Copier le token de la réponse et l'utiliser dans les requêtes suivantes.

## 1. Récupérer tous les rôles

```bash
curl -X GET http://localhost:3000/api/admin/roles \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "EMPLOYEE",
      "description": "Employé"
    },
    {
      "id": "uuid-2",
      "name": "MANAGER",
      "description": "Gestionnaire"
    },
    {
      "id": "uuid-3",
      "name": "OWNER",
      "description": "Propriétaire entreprise"
    },
    {
      "id": "uuid-4",
      "name": "SUPER_ADMIN",
      "description": "Administrateur global"
    }
  ]
}
```

## 2. Lister tous les utilisateurs

```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Avec recherche:**
```bash
curl -X GET "http://localhost:3000/api/admin/users?search=jean&page=1&limit=20" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Avec filtres:**
```bash
curl -X GET "http://localhost:3000/api/admin/users?isActive=true&roleId=ROLE_UUID" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 3. Créer un utilisateur

### Avec génération automatique de mot de passe

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "roleId": "ROLE_UUID_ICI",
    "isActive": true,
    "mustChangePassword": true
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": {
      "id": "uuid-nouveau",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "isActive": true,
      "mustChangePassword": true,
      "roleId": "ROLE_UUID_ICI",
      "enterpriseId": null,
      "Role": {
        "id": "ROLE_UUID_ICI",
        "name": "MANAGER",
        "description": "Gestionnaire"
      },
      "enterprise": null
    },
    "generatedPassword": "A8k#mP9x2Qr!"
  }
}
```

### Avec mot de passe personnalisé

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie.martin@example.com",
    "password": "MonMotDePasse123!",
    "roleId": "ROLE_UUID_ICI",
    "enterpriseId": "ENTERPRISE_UUID_ICI",
    "isActive": true,
    "mustChangePassword": false
  }'
```

## 4. Récupérer les détails d'un utilisateur

```bash
curl -X GET http://localhost:3000/api/admin/users/USER_UUID \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 5. Modifier un utilisateur

```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_UUID \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean-Michel",
    "email": "jean.michel.dupont@example.com",
    "isActive": true
  }'
```

**Avec changement de mot de passe:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_UUID \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean-Michel",
    "password": "NouveauMotDePasse123!",
    "mustChangePassword": true
  }'
```

## 6. Activer/Désactiver un utilisateur

```bash
curl -X PATCH http://localhost:3000/api/admin/users/USER_UUID/toggle-status \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Utilisateur désactivé avec succès",
  "data": {
    "isActive": false
  }
}
```

## 7. Réinitialiser le mot de passe

```bash
curl -X POST http://localhost:3000/api/admin/users/USER_UUID/reset-password \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès",
  "data": {
    "newPassword": "X9m#nK2p7Tw!"
  }
}
```

## 8. Supprimer un utilisateur

```bash
curl -X DELETE http://localhost:3000/api/admin/users/USER_UUID \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

## Erreurs Courantes

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token d'authentification manquant"
}
```
➡️ Vérifier que le header Authorization est présent

### 403 Forbidden
```json
{
  "success": false,
  "message": "Accès refusé : permissions insuffisantes"
}
```
➡️ Seul SUPER_ADMIN peut accéder à ces endpoints

### 404 Not Found
```json
{
  "success": false,
  "message": "Utilisateur non trouvé"
}
```
➡️ Vérifier l'UUID de l'utilisateur

### 409 Conflict
```json
{
  "success": false,
  "message": "Un utilisateur avec cet email existe déjà"
}
```
➡️ L'email doit être unique

### 400 Bad Request
```json
{
  "success": false,
  "message": "Prénom, nom, email et rôle sont requis"
}
```
➡️ Vérifier que tous les champs obligatoires sont présents

## Tests avec Postman

1. **Importer la collection**
   - Créer une nouvelle collection "Maze NFC - Users"
   - Ajouter une variable d'environnement `token` avec votre JWT
   - Ajouter une variable `baseUrl` = `http://localhost:3000/api`

2. **Configuration des requêtes**
   - Authorization: Type = Bearer Token, Token = `{{token}}`
   - Headers: Content-Type = application/json

3. **Créer les requêtes** pour chaque endpoint ci-dessus

## Script de test complet (Bash)

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@maze-nfc.com"
ADMIN_PASSWORD="votre_mot_de_passe"

# 1. Login
echo "=== LOGIN ==="
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token: $TOKEN"

# 2. Récupérer les rôles
echo -e "\n=== ROLES ==="
ROLES=$(curl -s -X GET "$API_URL/admin/roles" \
  -H "Authorization: Bearer $TOKEN")
echo $ROLES | jq

MANAGER_ROLE_ID=$(echo $ROLES | jq -r '.data[] | select(.name=="MANAGER") | .id')
echo "Manager Role ID: $MANAGER_ROLE_ID"

# 3. Créer un utilisateur
echo -e "\n=== CREER UN UTILISATEUR ==="
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\":\"Test\",
    \"lastName\":\"User\",
    \"email\":\"test.user.$(date +%s)@example.com\",
    \"roleId\":\"$MANAGER_ROLE_ID\",
    \"isActive\":true
  }")
echo $CREATE_RESPONSE | jq

USER_ID=$(echo $CREATE_RESPONSE | jq -r '.data.user.id')
GENERATED_PASSWORD=$(echo $CREATE_RESPONSE | jq -r '.data.generatedPassword')
echo "User ID: $USER_ID"
echo "Password: $GENERATED_PASSWORD"

# 4. Lister les utilisateurs
echo -e "\n=== LISTE DES UTILISATEURS ==="
curl -s -X GET "$API_URL/admin/users?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Modifier l'utilisateur
echo -e "\n=== MODIFIER L'UTILISATEUR ==="
curl -s -X PUT "$API_URL/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test Updated\"}" | jq

# 6. Désactiver l'utilisateur
echo -e "\n=== DESACTIVER L'UTILISATEUR ==="
curl -s -X PATCH "$API_URL/admin/users/$USER_ID/toggle-status" \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. Réinitialiser le mot de passe
echo -e "\n=== REINITIALISER LE MOT DE PASSE ==="
curl -s -X POST "$API_URL/admin/users/$USER_ID/reset-password" \
  -H "Authorization: Bearer $TOKEN" | jq

# 8. Supprimer l'utilisateur
echo -e "\n=== SUPPRIMER L'UTILISATEUR ==="
curl -s -X DELETE "$API_URL/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n=== TESTS TERMINES ==="
```

Pour exécuter le script:
```bash
chmod +x test_users_api.sh
./test_users_api.sh
```
