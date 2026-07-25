# 🎯 Démo - Page de Scan NFC

## 📱 Comment tester la fonctionnalité

### 1. Prérequis
- Backend démarré sur `http://localhost:3000`
- Frontend démarré sur `http://localhost:5173`
- Une entreprise créée avec au moins un service

### 2. Créer un service avec token

Via l'interface entreprise ou directement en base de données, créer un service qui génère automatiquement un `scanToken`.

**Exemple de service :**
```json
{
  "name": "Menu du midi",
  "description": "Commandez un menu et gagnez des points",
  "pointsToAdd": 10,
  "icon": "🍽️",
  "color": "#6A35FF",
  "isActive": true,
  "scanToken": "a7f3e9d2c1b4a8f6e5d4c3b2"  // Généré automatiquement
}
```

### 3. Construire l'URL de test

Format : `http://localhost:5173/scan/{scanToken}`

**Exemple :**
```
http://localhost:5173/scan/a7f3e9d2c1b4a8f6e5d4c3b2
```

### 4. Tester le flux complet

#### Étape 1 : Ouvrir le lien
Ouvrir l'URL dans un navigateur (idéalement sur mobile pour le rendu optimal)

#### Étape 2 : Page affichée
La page affiche :
- ✅ Logo de l'entreprise
- ✅ Nom de l'entreprise et localisation
- ✅ Nom du service
- ✅ Nombre de points à gagner (+10 points)
- ✅ Formulaire d'identification (téléphone ou email)

#### Étape 3 : Remplir le formulaire
Entrer :
- **Téléphone** : `+33612345678` OU
- **Email** : `client@test.com`
- **Nom** (optionnel) : `Jean Dupont`

#### Étape 4 : Confirmer le scan
Cliquer sur "Confirmer le scan"

#### Étape 5 : Résultat
Page de succès affichée avec :
- ✅ Animation de réussite
- ✅ Points gagnés (+10 points)
- ✅ Total de points du client
- ✅ Niveau du client (Silver/Gold/Platinum)
- ✅ Bouton "Voir mes récompenses"

---

## 🎨 Aperçu visuel de la page

### État initial (Formulaire)
```
┌─────────────────────────────────┐
│                                 │
│   [Logo Entreprise]             │
│   Restaurant Chez Marcel        │
│   123 rue de Paris              │
│                                 │
├─────────────────────────────────┤
│                                 │
│   🍽️  Menu du midi              │
│   Commandez un menu             │
│                                 │
│   ⭐ +10 points                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│   📱 Téléphone                  │
│   [_________________]           │
│                                 │
│          ou                     │
│                                 │
│   ✉️  Email                     │
│   [_________________]           │
│                                 │
│   👤 Nom (optionnel)            │
│   [_________________]           │
│                                 │
│   [✓ Confirmer le scan]         │
│                                 │
└─────────────────────────────────┘
```

### État succès
```
┌─────────────────────────────────┐
│                                 │
│         ✅                      │
│       Bravo !                   │
│                                 │
│   ┌─────────────────┐           │
│   │ Points gagnés   │           │
│   │      +10        │           │
│   └─────────────────┘           │
│                                 │
│   Total: 120 points             │
│   Niveau: ⭐ Gold               │
│                                 │
│   Merci Jean Dupont !           │
│                                 │
│   [🎁 Voir mes récompenses]     │
│                                 │
└─────────────────────────────────┘
```

---

## 🧪 Tests à effectuer

### Test 1 : Nouveau client
1. Utiliser un numéro/email jamais utilisé
2. Vérifier qu'un nouveau client est créé
3. Vérifier que les points sont bien ajoutés (10 points)
4. Vérifier le niveau (Silver pour première fois)

### Test 2 : Client existant
1. Utiliser un numéro/email déjà enregistré
2. Vérifier que le client existant est retrouvé
3. Vérifier que les points s'ajoutent au total existant
4. Vérifier la mise à jour du niveau si seuil atteint

### Test 3 : Service inactif
1. Désactiver le service (`isActive: false`)
2. Essayer d'accéder au lien
3. Vérifier qu'un message d'erreur s'affiche

### Test 4 : Token invalide
1. Utiliser un token qui n'existe pas
2. Vérifier qu'un message d'erreur s'affiche

### Test 5 : Progression de niveau
1. Client avec 990 points (Silver)
2. Scanner pour gagner 10 points → total 1000
3. Vérifier le passage à Gold
4. Client avec 4995 points (Gold)
5. Scanner pour gagner 10 points → total 5005
6. Vérifier le passage à Platinum

---

## 📊 Données créées dans la base

### Client (si nouveau)
```sql
INSERT INTO clients (
  name,
  email,
  phone,
  enterpriseId,
  points,
  level
) VALUES (
  'Jean Dupont',
  'client@test.com',
  '+33612345678',
  'uuid-entreprise',
  10,
  'Silver'
);
```

### Scan
```sql
INSERT INTO scans (
  cardId,           -- NULL si pas de carte NFC assignée
  clientId,         -- ID du client
  enterpriseId,     -- ID de l'entreprise
  serviceId,        -- ID du service
  pointsAdded,      -- 10
  notes,            -- 'Scan via lien NFC'
  userAgent,        -- User agent du navigateur
  ipAddress,        -- IP du client
  scannedAt         -- Date/heure actuelle
);
```

---

## 🚀 Prochaines étapes possibles

### Améliorations suggérées :
1. **QR Code** : Générer un QR code pour chaque lien de scan
2. **Historique** : Afficher l'historique des scans du client
3. **Notifications** : Notifier l'entreprise lors d'un scan
4. **Limites** : Limiter le nombre de scans par jour/semaine
5. **Géolocalisation** : Vérifier que le client est à proximité
6. **PWA** : Transformer en Progressive Web App
7. **Partage** : Permettre au client de partager son niveau
8. **Statistiques** : Dashboard pour l'entreprise avec les scans en temps réel

---

## 🔧 Dépannage

### Problème : "Service introuvable"
- Vérifier que le service existe en base
- Vérifier que `isActive = true`
- Vérifier que le token est correct

### Problème : "Erreur de connexion"
- Vérifier que le backend est démarré
- Vérifier l'URL de l'API dans `.env`
- Vérifier les CORS dans `app.js`

### Problème : Points non ajoutés
- Vérifier les logs du backend
- Vérifier que le client a bien été créé/trouvé
- Vérifier la table `scans` pour l'enregistrement

---

## 📱 Simulation d'un scan NFC physique

Pour simuler un vrai scan NFC :

1. **Imprimer un QR Code** avec l'URL de scan
2. **Coller le QR Code** sur un support physique
3. **Scanner avec un smartphone** → Le lien s'ouvre automatiquement
4. **Le client remplit le formulaire** et valide
5. **Points ajoutés instantanément**

C'est exactement le même comportement qu'avec une vraie carte NFC, mais avec un QR Code visible au lieu d'une puce invisible ! 🎯
