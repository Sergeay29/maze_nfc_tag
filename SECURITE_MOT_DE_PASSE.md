# 🔐 Système de Changement de Mot de Passe Obligatoire

## Vue d'ensemble

Le système **Maze NFC Tag** implémente un mécanisme de sécurité qui force tous les utilisateurs (peu importe leur rôle) à changer leur mot de passe lors de leur première connexion ou après qu'un administrateur ait réinitialisé leur mot de passe.

## 🎯 Objectifs de sécurité

- **Sécurité maximale** : Les mots de passe générés automatiquement ne sont utilisables qu'une seule fois
- **Conformité** : Respect des bonnes pratiques de sécurité (RGPD, ISO 27001)
- **Responsabilisation** : Chaque utilisateur définit son propre mot de passe sécurisé
- **Traçabilité** : L'administrateur sait quand un utilisateur doit changer son mot de passe

## 📋 Fonctionnement

### 1. Flag `mustChangePassword`

Chaque utilisateur possède un champ booléen `mustChangePassword` dans la base de données :
- ✅ `true` : L'utilisateur DOIT changer son mot de passe à la prochaine connexion
- ❌ `false` : L'utilisateur peut utiliser son mot de passe normalement

### 2. Quand le flag est activé ?

Le flag `mustChangePassword` est automatiquement mis à `true` dans les cas suivants :

#### 📌 Création d'une nouvelle entreprise
```javascript
// Backend: adminController.js > createEnterprise()
await User.create({
  firstName: adminFirstName || name,
  lastName: adminLastName || "",
  email,
  password: hashedPassword,
  roleId: ownerRole.id,
  enterpriseId: enterprise.id,
  mustChangePassword: true,  // ✅ Activé
  isActive: true,
});
```

#### 📌 Création manuelle d'un utilisateur par l'admin
```javascript
// Backend: adminController.js > createUser()
const user = await User.create({
  firstName,
  lastName,
  email,
  password: hashedPassword,
  roleId,
  enterpriseId: enterpriseId || null,
  isActive: isActive !== undefined ? isActive : true,
  mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : true,  // ✅ true par défaut
});
```

#### 📌 Changement de mot de passe par l'admin
```javascript
// Backend: adminController.js > updateUser()
if (password) {
  updateData.password = await bcrypt.hash(password, 10);
  updateData.mustChangePassword = true;  // ✅ Force le changement
}
```

#### 📌 Réinitialisation de mot de passe par l'admin
```javascript
// Backend: adminController.js > resetUserPassword()
await user.update({
  password: hashedPassword,
  mustChangePassword: true,  // ✅ Force le changement
});
```

### 3. Workflow utilisateur

```
┌─────────────────────────────────────────────────────────────┐
│  1. Admin crée un utilisateur                                │
│     └─> mustChangePassword: true                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Utilisateur se connecte                                  │
│     └─> Login réussi, JWT généré                            │
│     └─> Objet user contient: { mustChangePassword: true }   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Frontend détecte mustChangePassword: true                │
│     └─> Affiche modale BLOQUANTE                            │
│     └─> Overlay empêche l'accès au dashboard                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Utilisateur définit son nouveau mot de passe             │
│     └─> PUT /api/auth/change-password                       │
│     └─> Backend met à jour:                                 │
│         • password: nouveau_hash                             │
│         • mustChangePassword: false                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Frontend rafraîchit les infos utilisateur                │
│     └─> refreshUser() récupère user mis à jour              │
│     └─> mustChangePassword: false                           │
│     └─> Modale disparaît, accès complet au dashboard        │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Protection côté Frontend

### Composant ChangePasswordModal

Un composant React réutilisable qui affiche une modale bloquante :

**Fichier** : `frontend/src/components/modals/ChangePasswordModal.tsx`

```typescript
<ChangePasswordModal
  onSubmit={handleChangePassword}
  loading={changingPassword}
  error={passwordError}
/>
```

### Caractéristiques de sécurité

✅ **Modale bloquante** : `z-index: 50` au-dessus de tout le contenu  
✅ **Overlay semi-transparent** : Empêche les clics sur le contenu en dessous  
✅ **Pas de bouton "Annuler"** : L'utilisateur DOIT changer son mot de passe  
✅ **Validation côté client** :
   - Minimum 8 caractères
   - Confirmation du mot de passe
   - Messages d'erreur clairs

✅ **UX optimisée** :
   - Affichage/masquage du mot de passe (icônes Eye/EyeOff)
   - Toast de succès après changement
   - État de chargement pendant la requête

### Intégration dans les dashboards

#### Dashboard Admin
```typescript
// pages/admin/DashboardPage.tsx
{user?.mustChangePassword && (
  <ChangePasswordModal
    onSubmit={handleChangePassword}
    loading={changingPassword}
    error={passwordError}
  />
)}
```

#### Dashboard Entreprise (OWNER/MANAGER/EMPLOYEE)
```typescript
// pages/enterprise/DashboardPage.tsx
{user?.mustChangePassword && (
  <ChangePasswordModal
    onSubmit={handleChangePassword}
    loading={changingPassword}
    error={passwordError}
  />
)}
```

## 🔒 Protection côté Backend

### Endpoint de changement de mot de passe

**Route** : `PUT /api/auth/change-password`  
**Middleware** : `authenticate` (JWT requis)

```javascript
// services/authService.js
async function changePassword(userId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.update(
    { 
      password: hashedPassword, 
      mustChangePassword: false  // ✅ Désactive le flag
    },
    { where: { id: userId } }
  );
}
```

### Validation backend

- ✅ Minimum 8 caractères (contrôlé par le frontend et recommandé côté serveur)
- ✅ Hash bcrypt avec salt (10 rounds)
- ✅ Mise à jour atomique du mot de passe et du flag
- ✅ Token JWT reste valide après changement

## 📊 Rôles concernés

| Rôle | Concerné | Cas d'usage |
|------|----------|-------------|
| **SUPER_ADMIN** | ✅ Oui | Lors de la création manuelle du compte admin |
| **OWNER** | ✅ Oui | Lors de la création automatique de l'entreprise |
| **MANAGER** | ✅ Oui | Lors de l'ajout par l'OWNER |
| **EMPLOYEE** | ✅ Oui | Lors de l'ajout par l'OWNER ou MANAGER |

## 🧪 Tests manuels

### Test 1 : Création d'entreprise
1. Se connecter en tant que SUPER_ADMIN
2. Créer une nouvelle entreprise via `/admin/enterprises`
3. Noter le mot de passe généré pour le compte OWNER
4. Se déconnecter
5. Se connecter avec l'email de l'entreprise et le mot de passe généré
6. ✅ Vérifier que la modale de changement de mot de passe s'affiche
7. Définir un nouveau mot de passe
8. ✅ Vérifier que la modale disparaît et l'accès au dashboard est accordé

### Test 2 : Création manuelle d'utilisateur
1. Se connecter en tant que SUPER_ADMIN
2. Aller dans `/admin/users`
3. Créer un nouvel utilisateur (MANAGER ou EMPLOYEE)
4. Noter le mot de passe généré
5. Se déconnecter
6. Se connecter avec le nouveau compte
7. ✅ Vérifier que la modale de changement de mot de passe s'affiche

### Test 3 : Réinitialisation de mot de passe
1. Se connecter en tant que SUPER_ADMIN
2. Aller dans `/admin/users`
3. Sélectionner un utilisateur et réinitialiser son mot de passe
4. Se déconnecter
5. Se connecter avec le compte dont le mot de passe a été réinitialisé
6. ✅ Vérifier que la modale de changement de mot de passe s'affiche

## 🚀 Améliorations futures possibles

- [ ] Envoi d'email avec le mot de passe temporaire
- [ ] Expiration du mot de passe temporaire après 24h
- [ ] Historique des changements de mot de passe
- [ ] Politique de complexité de mot de passe configurable
- [ ] Authentification à deux facteurs (2FA)
- [ ] Notification par email après changement de mot de passe

## 📝 Notes importantes

⚠️ **ATTENTION** : Le mot de passe généré est retourné UNE SEULE FOIS dans la réponse de création. Assurez-vous de le communiquer à l'utilisateur de manière sécurisée (email chiffré, message privé, etc.).

💡 **CONSEIL** : En production, il est recommandé d'envoyer le mot de passe temporaire par email plutôt que de l'afficher dans l'interface admin.

🔐 **SÉCURITÉ** : Tous les mots de passe sont hashés avec bcrypt (10 rounds de salt). Ils ne sont JAMAIS stockés en clair dans la base de données.

## 📚 Références

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt.js Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Dernière mise à jour** : $(date)  
**Version** : 1.0.0
