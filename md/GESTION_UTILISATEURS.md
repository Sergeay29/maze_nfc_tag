# Gestion des Utilisateurs - Documentation

## Vue d'ensemble

La gestion des utilisateurs permet aux administrateurs (SUPER_ADMIN) de créer, modifier, supprimer et gérer les comptes utilisateurs de la plateforme Maze NFC.

## Fonctionnalités

### 1. Liste des utilisateurs
- **Route Frontend**: `/admin/users`
- **API Endpoint**: `GET /api/admin/users`
- Affichage paginé de tous les utilisateurs
- Recherche par nom, prénom ou email
- Filtrage par rôle, statut et entreprise
- Vue détaillée : nom, email, rôle, entreprise, statut, date d'inscription

### 2. Créer un utilisateur
- **Bouton**: "Créer un utilisateur" (en haut à droite de la page)
- **API Endpoint**: `POST /api/admin/users`
- **Champs obligatoires**:
  - Prénom
  - Nom
  - Email (unique)
  - Rôle (SUPER_ADMIN, OWNER, MANAGER, EMPLOYEE)
- **Champs optionnels**:
  - Entreprise (si applicable)
  - Mot de passe (généré automatiquement si non fourni)
  - Compte actif (par défaut: oui)
  - Forcer changement de mot de passe (par défaut: oui)

**Comportement**:
- Si aucun mot de passe n'est fourni, un mot de passe aléatoire sécurisé de 12 caractères est généré
- Le mot de passe généré est affiché une seule fois à l'administrateur
- L'utilisateur devra changer son mot de passe à la première connexion (si l'option est activée)

### 3. Modifier un utilisateur
- **Bouton**: Icône crayon (Edit) dans la colonne Actions
- **API Endpoint**: `PUT /api/admin/users/:id`
- **Modifications possibles**:
  - Informations personnelles (prénom, nom, email)
  - Rôle
  - Entreprise associée
  - Statut du compte (actif/inactif)
  - Mot de passe (optionnel)
  - Option "forcer le changement de mot de passe"

### 4. Activer/Désactiver un utilisateur
- **Bouton**: Icône Power dans la colonne Actions
- **API Endpoint**: `PATCH /api/admin/users/:id/toggle-status`
- Permet d'activer ou désactiver rapidement un compte
- Un utilisateur désactivé ne peut plus se connecter
- **Protection**: Impossible de désactiver son propre compte

### 5. Réinitialiser le mot de passe
- **Bouton**: Icône clé (Key) dans la colonne Actions
- **API Endpoint**: `POST /api/admin/users/:id/reset-password`
- Génère un nouveau mot de passe aléatoire sécurisé
- Le nouveau mot de passe est affiché dans une alerte
- Force automatiquement le changement de mot de passe à la prochaine connexion

### 6. Supprimer un utilisateur
- **Bouton**: Icône corbeille (Trash) dans la colonne Actions
- **API Endpoint**: `DELETE /api/admin/users/:id`
- Suppression définitive de l'utilisateur
- Confirmation requise avant suppression
- **Protection**: Impossible de supprimer son propre compte

## Rôles disponibles

| Rôle | Description | Badge |
|------|-------------|-------|
| SUPER_ADMIN | Administrateur global avec accès complet | Platinum |
| OWNER | Propriétaire d'entreprise | Warning (Orange) |
| MANAGER | Gestionnaire d'entreprise | Primary (Violet) |
| EMPLOYEE | Employé d'entreprise | Active (Vert) |

## Sécurité

### Mot de passe
- **Longueur minimale**: 8 caractères
- **Génération automatique**: 12 caractères avec lettres majuscules, minuscules, chiffres et caractères spéciaux
- **Hashage**: bcrypt avec 10 rounds de salage

### Authentification
- Toutes les routes requièrent un token JWT valide
- Seuls les utilisateurs avec le rôle SUPER_ADMIN peuvent accéder aux endpoints de gestion

### Validations
- Email unique dans la base de données
- Vérification de l'existence des rôles et entreprises avant assignation
- Protection contre la suppression/désactivation de son propre compte

## Structure des données

### Modèle User (Backend)
```javascript
{
  id: UUID (primary key),
  firstName: STRING(100),
  lastName: STRING(100),
  email: STRING(255) UNIQUE,
  password: STRING (hashed),
  isActive: BOOLEAN (default: true),
  mustChangePassword: BOOLEAN (default: false),
  roleId: UUID (foreign key -> roles),
  enterpriseId: UUID (foreign key -> enterprises, nullable),
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

### Interface AdminUser (Frontend)
```typescript
interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  roleId: string;
  enterpriseId?: string | null;
  createdAt: string;
  Role?: { id: string; name: string; description?: string };
  enterprise?: { id: string; name: string; logo?: string } | null;
}
```

## Endpoints API

### Liste des utilisateurs
```http
GET /api/admin/users
Query params:
  - page: number (default: 1)
  - limit: number (default: 20)
  - search: string (recherche par nom/email)
  - roleId: UUID (filtre par rôle)
  - isActive: boolean (filtre par statut)
  - enterpriseId: UUID (filtre par entreprise)
```

### Détails d'un utilisateur
```http
GET /api/admin/users/:id
```

### Créer un utilisateur
```http
POST /api/admin/users
Body: {
  firstName: string,
  lastName: string,
  email: string,
  password?: string,
  roleId: UUID,
  enterpriseId?: UUID,
  isActive?: boolean,
  mustChangePassword?: boolean
}
```

### Modifier un utilisateur
```http
PUT /api/admin/users/:id
Body: {
  firstName?: string,
  lastName?: string,
  email?: string,
  password?: string,
  roleId?: UUID,
  enterpriseId?: UUID,
  isActive?: boolean,
  mustChangePassword?: boolean
}
```

### Supprimer un utilisateur
```http
DELETE /api/admin/users/:id
```

### Activer/Désactiver un utilisateur
```http
PATCH /api/admin/users/:id/toggle-status
```

### Réinitialiser le mot de passe
```http
POST /api/admin/users/:id/reset-password
Response: {
  success: true,
  data: {
    newPassword: string
  }
}
```

### Liste des rôles
```http
GET /api/admin/roles
Response: {
  success: true,
  data: [
    { id: UUID, name: string, description: string }
  ]
}
```

## Composants Frontend

### CreateUserModal
**Fichier**: `frontend/src/components/modals/CreateUserModal.tsx`
- Modal de création d'utilisateur
- Formulaire avec validation
- Option de génération automatique de mot de passe
- Affichage du mot de passe généré avec bouton de copie

### EditUserModal
**Fichier**: `frontend/src/components/modals/EditUserModal.tsx`
- Modal de modification d'utilisateur
- Pré-remplissage des champs avec les données existantes
- Option de changement de mot de passe
- Validation avant soumission

### UsersPage
**Fichier**: `frontend/src/pages/admin/UsersPage.tsx`
- Page principale de gestion des utilisateurs
- Tableau avec pagination
- Barre de recherche
- Boutons d'action (éditer, activer/désactiver, réinitialiser, supprimer)
- Intégration des modals

## Flux utilisateur

### Création d'un utilisateur
1. L'admin clique sur "Créer un utilisateur"
2. Le modal s'ouvre avec le formulaire
3. L'admin remplit les informations
4. Si "générer automatiquement" est coché, aucun mot de passe n'est requis
5. Soumission du formulaire
6. Si succès avec mot de passe généré :
   - Le mot de passe est affiché
   - L'admin peut le copier
   - Le modal reste ouvert jusqu'à la fermeture manuelle
7. Si succès sans mot de passe généré :
   - Message de succès
   - Fermeture automatique après 1.5s
   - Rafraîchissement de la liste

### Modification d'un utilisateur
1. L'admin clique sur l'icône crayon
2. Le modal s'ouvre avec les données pré-remplies
3. L'admin modifie les champs souhaités
4. Pour changer le mot de passe, il coche "Changer le mot de passe"
5. Soumission du formulaire
6. Message de succès et fermeture du modal
7. Rafraîchissement de la liste

### Autres actions
- Les actions (activer/désactiver, réinitialiser, supprimer) nécessitent une confirmation
- Un message d'erreur s'affiche en cas de problème
- La liste est rafraîchie après chaque action réussie

## Notes techniques

### Backend
- Controller: `backend/controllers/adminController.js`
- Routes: `backend/routes/adminRoute.js`
- Fonction utilitaire: `generateRandomPassword(length = 12)` pour générer des mots de passe sécurisés

### Frontend
- API Client: `frontend/src/api/adminApi.ts`
- Types TypeScript définis pour toutes les opérations
- Gestion d'état locale avec React hooks
- Validation côté client avant soumission

### Améliorations futures possibles
- Envoi d'email avec le mot de passe lors de la création
- Historique des modifications utilisateur
- Import/export en masse d'utilisateurs
- Filtres avancés (date d'inscription, dernière connexion, etc.)
- Assignation de permissions granulaires par utilisateur
