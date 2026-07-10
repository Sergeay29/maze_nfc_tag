# Plan de tests — Dashboard Super Admin Maze NFC

## Démarrage

### Backend
```bash
cd backend
node server.js
```
API disponible sur : http://localhost:3000
Swagger : http://localhost:3000/api/docs

### Frontend
```bash
cd frontend
npm run dev
```
App disponible sur : http://localhost:5173

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | `admin@maze-nfc.local` | `admin123456` |
| Owner (Conciergerie Premium) | `marie@conciergerie.fr` | `owner123456` |

---

## BLOC 1 — Authentification ✅

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 1.1 | Aller sur `/login`, se connecter avec les identifiants admin | Redirige vers `/admin/dashboard` | ✅ |
| 1.2 | Ouvrir un onglet privé, aller sur `/admin/dashboard` sans être connecté | Redirige vers `/login` | ✅ |
| 1.3 | Se connecter avec le compte OWNER | Redirige vers `/enterprise/dashboard`, pas vers `/admin` | ⏳ |
| 1.4 | Avec le token OWNER, appeler `GET http://localhost:3000/api/admin/dashboard` | Réponse `403 permissions insuffisantes` | ⏳ |

---

## BLOC 2 — Dashboard global `/admin/dashboard` ✅

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 2.1 | Charger la page | 4 cartes stats avec valeurs réelles (pas 0 bloqué) | ✅ |
| 2.2 | Vérifier le graphique linéaire | Courbe "Scans des 7 derniers jours" visible | ✅ |
| 2.3 | Vérifier le donut | Segments Actives / Non attribuées (Inactives masqué si = 0, normal) | ✅ |
| 2.4 | Section "Derniers scans" | 5 scans avec avatar client + nom + entreprise | ✅ |
| 2.5 | Section "Entreprises actives" | 5 entreprises avec logo/avatar + plan + lien cliquable vers détail | ✅ |
| 2.6 | Réduire la sidebar | Le contenu se décale proprement, pas de chevauchement | ✅ |

> **Note revenus mensuels** : calculé via `SUM(monthlyPrice)` des abonnements actifs en base.

---

## BLOC 3 — Gestion des entreprises `/admin/enterprises`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 3.1 | Charger la page | Liste réelle des entreprises seedées avec logo/avatar | ✅ |
| 3.2 | Taper "Conciergerie" dans la recherche | Filtre côté client, instantané, sans requête | ✅ |
| 3.3 | Filtrer par "Suspendu" | Seules les entreprises suspendues apparaissent | ✅ |
| 3.4 | Cliquer "Nouvelle entreprise" | Modale s'ouvre avec formulaire | ✅ |
| 3.5 | Dans la modale, champ téléphone | Sélecteur de pays avec indicatif, validation longueur | ✅ |
| 3.6 | Laisser nom vide | Bouton "Créer" désactivé, message d'erreur sous le champ | ✅ |
| 3.7 | Saisir un email invalide | Bouton désactivé, message "Email invalide" | ✅ |
| 3.8 | Soumettre avec nom + email valides | Entreprise créée avec aperçu logo, apparaît dans la liste | ✅ |
| 3.9 | Soumettre avec un email déjà utilisé | Message d'erreur API "email existe déjà" | ✅ |
| 3.10 | Saisir une URL logo valide | Aperçu du logo s'affiche en temps réel dans la modale | ✅ |
| 3.11 | Cliquer sur une ligne entreprise | Navigue vers `/admin/enterprises/:id` | ✅ |

---

## BLOC 4 — Détail entreprise `/admin/enterprises/:id`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 4.1 | Charger la page | Logo/avatar entreprise, stats réelles (cartes, clients, scans) | ⏳ |
| 4.2 | Onglet "Cartes" | Liste des cartes de cette entreprise avec statut | ⏳ |
| 4.3 | Onglet "Clients" | Liste des clients de cette entreprise | ⏳ |
| 4.4 | Onglet "Scans" | Liste des scans récents | ⏳ |
| 4.5 | Cliquer "Suspendre" sur une entreprise active | Confirmation → badge passe à "Suspendu" | ⏳ |
| 4.6 | Cliquer "Réactiver" sur l'entreprise suspendue | Badge repasse à "Actif" | ⏳ |

---

## BLOC 5 — Cartes NFC `/admin/nfc-cards`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 5.1 | Charger la page | Liste avec numéro de carte visible dans chaque ligne | ✅ |
| 5.2 | Vérifier les colonnes | Carte (icône + numéro), Entreprise, Type, Statut, Attribuée à, Créée le | ✅ |
| 5.3 | Filtrer par "Non attribuée" | Seules les cartes unassigned, sans requête | ✅ |
| 5.4 | Cliquer "Générer des cartes" | Navigue vers `/admin/nfc-cards/generate` | ✅ |

---

## BLOC 6 — Génération de cartes `/admin/nfc-cards/generate`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 6.1 | Sélectionner entreprise + type + préfixe + quantité 5 | Aperçu carte mis à jour dynamiquement | ✅ |
| 6.2 | Soumettre | Message succès "5 cartes générées", lien vers la liste | ✅ |
| 6.3 | Aller sur la liste des cartes | 5 nouvelles cartes avec le préfixe, statut "Non attribuée" | ✅ |
| 6.4 | Laisser le préfixe vide | Message d'erreur champ obligatoire | ⏳ |
| 6.5 | Mettre quantité 1500 | Erreur "quantité entre 1 et 1000" | ⏳ |

---

## BLOC 7 — Attribution de carte `/admin/nfc-cards/assign`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 7.1 | Sélectionner une entreprise | Liste des cartes non attribuées se charge | ⏳ |
| 7.2 | Champ téléphone | Sélecteur d'indicatif + validation longueur | ✅ |
| 7.3 | Remplir tous les champs + soumettre | Message succès, aperçu client visible | ⏳ |
| 7.4 | Retourner sur la liste des cartes | La carte attribuée est passée en statut "Active" | ⏳ |
| 7.5 | Retenter d'attribuer la même carte | Erreur "Carte introuvable ou déjà attribuée" | ⏳ |
| 7.6 | Soumettre sans nom client | Erreur champ obligatoire | ⏳ |

---

## BLOC 8 — Scans `/admin/scans`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 8.1 | Charger la page | 100 scans avec avatar client + carte + entreprise | ✅ |
| 8.2 | Rechercher un nom de client | Filtre côté client, instantané | ✅ |
| 8.3 | Pagination | Navigation entre pages fonctionne | ✅ |

---

## BLOC 9 — Abonnements `/admin/subscriptions`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 9.1 | Charger la page | StatCards : revenus + compteurs par plan calculés côté client | ⏳ |
| 9.2 | Grille tarifaire | 3 cartes Starter/Pro/Enterprise avec nb abonnements réels | ⏳ |
| 9.3 | Filtrer par plan ou statut | Filtre côté client, sans requête | ✅ |
| 9.4 | Changer le plan via le select inline | Confirmation → plan et badge mis à jour | ⏳ |
| 9.5 | Cliquer refresh sur un abonnement actif | Confirmation → statut passe à "Pausé" | ⏳ |

---

## BLOC 10 — Utilisateurs `/admin/users`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 10.1 | Charger la page | Liste réelle avec avatar (initiales) + rôle | ⏳ |
| 10.2 | Rechercher par email | Filtre côté client, instantané | ✅ |
| 10.3 | Vérifier les badges de rôle | SUPER_ADMIN → Platinum, OWNER → Warning, etc. | ⏳ |

---

## BLOC 11 — Paramètres `/admin/settings`

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 11.1 | Charger la page | 7 paramètres seedés avec valeurs réelles | ⏳ |
| 11.2 | Modifier "Nom de la plateforme" → Enregistrer | Message succès vert | ⏳ |
| 11.3 | Recharger la page | La nouvelle valeur est persistée | ⏳ |
| 11.4 | Toggler "Alertes email" → Enregistrer | Toggle change, valeur persistée | ⏳ |
| 11.5 | Modifier un champ → "Réinitialiser" | Champs reviennent aux valeurs sauvegardées | ⏳ |

---

## BLOC 12 — Sécurité transversale

| # | Ce qu'on fait | Ce qu'on attend | Statut |
|---|---------------|-----------------|--------|
| 12.1 | Supprimer le token du localStorage, recharger une page admin | Redirection `/login` | ⏳ |
| 12.2 | Appeler `GET /api/admin/users` sans token | `401 Token manquant` | ⏳ |
| 12.3 | Appeler `GET /api/admin/users` avec token OWNER | `403 permissions insuffisantes` | ⏳ |

---

## Périmètre MVP Super Admin — état actuel

| Fonctionnalité MVP | Statut |
|--------------------|--------|
| Connexion admin + redirection | ✅ Fait |
| Redirection si non connecté | ✅ Fait |
| Dashboard global (stats, graphiques, scans récents) | ✅ Fait |
| Dashboard — entreprises actives avec logo cliquables | ✅ Fait |
| Liste des entreprises (logo/avatar, recherche + filtre côté client) | ✅ Fait |
| Création d'entreprise (modale + validation + phone picker + logo URL + bouton désactivé si invalide) | ✅ Fait |
| Détail entreprise (cartes, clients, scans) | ✅ Fait |
| Activation / suspension entreprise | ✅ Fait |
| Liste des cartes NFC (numéro visible, filtres côté client) | ✅ Fait |
| Génération de cartes NFC en masse | ✅ Fait |
| Attribution carte à un client | ✅ Fait |
| Scans — liste avec données réelles + avatar client | ✅ Fait |
| Abonnements — filtres côté client, stats en mémoire | ✅ Fait |
| Utilisateurs — avatar initiales, filtres côté client | ✅ Fait |
| Paramètres plateforme (persistés en base) | ✅ Fait |
| Guard SUPER_ADMIN sur toutes les routes API | ✅ Fait |
| Champ téléphone avec indicatif pays | ✅ Fait |
| Sidebar responsive (repliable sans chevauchement) | ✅ Fait |
| Données persistées au redémarrage (alter au lieu de force) | ✅ Fait |
| Seed compte OWNER entreprise | ✅ Fait |
| Swagger API docs | ✅ Fait |
| Types de cartes NFC configurables | ⏳ À faire (Priorité 2) |
| Modules activables par entreprise | ⏳ À faire (Priorité 2) |
| Export Excel des données | ⏳ À faire (Priorité 3) |
