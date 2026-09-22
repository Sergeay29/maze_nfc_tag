# Plan de test — Module Restau Maze-NFC

## 1. Objet du document

Ce document regroupe le plan de validation du module Restau réalisé sur la branche `feature/restau-module`, conformément au planning de la semaine du 21 au 25/09/2026.

Il couvre les migrations, les API, les interfaces, les clics utilisateur, les contrôles négatifs et les critères d’acceptation. Le testeur prévu pour cette itération est Moufid.

## 2. Périmètre fonctionnel

| Date planning | Fonctionnalités à valider |
| --- | --- |
| 21/09 | Architecture Restau, modèles, migrations, environnement local, vérifications CI |
| 22/09 | CRUD du menu digital, catégories, plats, publication et page publique |
| 23/09 | Navigation par catégories, images différées et génération QR de secours |
| 24/09 | Lien d’avis Google et formulaire de réservation de table |
| 25/09 | Panier Premium, ajout/suppression d’articles, validation et suivi des commandes |

### Hors périmètre de cette itération

- Paiement en ligne : les commandes sont créées avec `paymentStatus = unpaid`.
- WebSocket : le suivi « temps réel » est assuré par un rafraîchissement automatique toutes les 10 secondes.
- Gestion avancée des tables et attribution automatique d’une table.
- Notifications SMS, email ou push.
- Import de données de production.

## 3. Pré-requis

### 3.1 Environnement

- Branche : `feature/restau-module`.
- Node.js et npm installés.
- PostgreSQL accessible depuis le fichier `backend/.env`.
- Base locale de test : `maze_nfc` sur `localhost`.
- Aucun secret de production ne doit être utilisé dans les tests locaux.

### 3.2 Comptes et données de test

Préparer :

- un compte `OWNER` ou `MANAGER` rattaché à une entreprise active ;
- un compte `EMPLOYEE` pour vérifier les droits opérationnels ;
- si possible, un second compte d’une autre entreprise pour les tests d’isolation ;
- une entreprise active avec nom, logo ou localisation facultatifs ;
- un menu avec au moins deux catégories ;
- au moins trois plats, dont un avec image, un sans image et un rendu indisponible ;
- une URL Google Maps valide pour les avis ;
- un navigateur desktop et un navigateur mobile ou mode responsive.

## 4. Préparation de la base de données

### 4.1 Contrôle normal, sans réinitialisation

Depuis `frontend/backend` :

```powershell
npm ci
npm run db:migrate:status
npm run db:migrate
```

Le résultat attendu est que toutes les migrations soient indiquées comme exécutées, notamment :

- `20260922090000-create-restaurant-menu.js`
- `20260924090000-add-restau-reviews-and-reservations.js`
- `20260925090000-create-restau-orders.js`

### 4.2 Réinitialisation locale uniquement

Cette procédure est réservée à une base locale jetable. Elle supprime toutes les tables et données de `localhost/maze_nfc`. Elle ne doit jamais être exécutée avec les paramètres de production.

```powershell
$dbPassword = (Get-Content .env | Where-Object { $_ -like 'DB_PASSWORD=*' }) -replace '^DB_PASSWORD=', ''
$env:PGPASSWORD = $dbPassword
psql -h localhost -U postgres -d maze_nfc -v ON_ERROR_STOP=1 -c "BEGIN; DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public; COMMIT;"
npm run db:migrate
npm run db:migrate:status
```

## 5. Vérifications techniques automatisées

Depuis `frontend/backend` :

```powershell
node --check controllers/restaurantOrderController.js
node --check models/restaurantOrder.js
node --check models/restaurantOrderItem.js
node --check migrations/20260925090000-create-restau-orders.js
node --check routes/restauPublicRoute.js
node --check routes/enterpriseRoute.js
```

Depuis `frontend/frontend` :

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
```

Résultats attendus :

- TypeScript sans erreur.
- ESLint sans erreur bloquante ; les avertissements existants doivent être distingués des régressions Restau.
- Build Vite terminé avec succès.
- Aucun espace ou conflit de formatage détecté par `git diff --check`.

## 6. Tests des migrations et du modèle de données

| ID | Test | Procédure | Résultat attendu |
| --- | --- | --- | --- |
| DB-01 | Exécution sur base vide | Réinitialiser uniquement la base locale puis lancer `npm run db:migrate` | Toutes les migrations s’exécutent sans erreur |
| DB-02 | Rejouabilité | Relancer `npm run db:migrate` | Message indiquant qu’aucune migration n’est en attente |
| DB-03 | Statut | Lancer `npm run db:migrate:status` | Toutes les migrations sont `exécutée` |
| DB-04 | Menu | Vérifier les tables `restaurant_menus`, `restaurant_menu_categories`, `restaurant_menu_items` | Tables, clés étrangères et index présents |
| DB-05 | Réservation | Vérifier `restaurant_reservations` et ses statuts | Table et contraintes présentes |
| DB-06 | Commande | Vérifier `restaurant_orders` et `restaurant_order_items` | Commandes, lignes, statuts et index présents |
| DB-07 | Suppression d’un plat | Supprimer un plat déjà commandé | La ligne de commande reste lisible grâce au nom/prix sauvegardés |
| DB-08 | Isolation | Vérifier les clés `enterpriseId` | Une entreprise ne peut pas consulter les données d’une autre |

## 7. Tests API — menu digital

Les routes authentifiées doivent être appelées avec un token d’utilisateur autorisé.

| ID | Test | Résultat attendu |
| --- | --- | --- |
| API-MENU-01 | Créer un menu | Réponse `201`, statut initial `draft` |
| API-MENU-02 | Empêcher un deuxième menu pour la même entreprise | Réponse `409` |
| API-MENU-03 | Créer une catégorie | Réponse `201`, catégorie rattachée au menu |
| API-MENU-04 | Refuser une catégorie sans nom | Réponse `400` |
| API-MENU-05 | Créer un plat avec prix valide | Réponse `201`, prix en unité mineure entière |
| API-MENU-06 | Refuser un prix invalide ou négatif | Réponse `400` |
| API-MENU-07 | Modifier un plat | Nom, description, prix, image et disponibilité actualisés |
| API-MENU-08 | Publier le menu | Statut `published` |
| API-MENU-09 | Consulter le menu public publié | Réponse `200`, uniquement catégories actives et plats disponibles |
| API-MENU-10 | Consulter un menu non publié | Réponse `404` |
| API-MENU-11 | Accès croisé entre entreprises | Réponse `404`, aucune donnée étrangère retournée |

## 8. Tests API — QR code de secours

| ID | Test | Procédure | Résultat attendu |
| --- | --- | --- | --- |
| API-QR-01 | Générer un QR entreprise | Demander le QR d’une carte existante | Réponse `200` avec données image et URL |
| API-QR-02 | Télécharger le QR | Utiliser le bouton de téléchargement | Fichier image téléchargé et lisible |
| API-QR-03 | QR d’une carte inconnue | Utiliser un identifiant inexistant | Réponse d’erreur contrôlée, sans erreur serveur non gérée |
| API-QR-04 | URL de scan | Scanner ou ouvrir l’URL produite | Redirection vers la page de scan attendue |

## 9. Tests API — avis Google et réservations

| ID | Test | Procédure | Résultat attendu |
| --- | --- | --- | --- |
| API-RES-01 | Enregistrer un lien Google valide | Modifier le profil entreprise | Mise à jour acceptée |
| API-RES-02 | Refuser un lien Google invalide | Envoyer une valeur qui n’est pas une URL | Réponse `400` |
| API-RES-03 | Créer une réservation valide | Date actuelle/future, heure valide, 2 couverts, contact valide | Réponse `201`, statut `pending` |
| API-RES-04 | Date passée | Envoyer une date antérieure à aujourd’hui | Réponse `400` |
| API-RES-05 | Heure invalide | Envoyer une heure hors format `HH:mm` | Réponse `400` |
| API-RES-06 | Nombre de couverts invalide | Envoyer `0` ou une valeur supérieure à `100` | Réponse `400` |
| API-RES-07 | Contact manquant | Envoyer une réservation sans contact | Réponse `400` |
| API-RES-08 | Consultation entreprise | Consulter les réservations authentifiées | Uniquement les réservations de l’entreprise connectée |
| API-RES-09 | Statut réservation | Confirmer puis annuler une réservation | Statuts mis à jour, valeurs invalides refusées |

## 10. Tests API — panier et commandes Premium

| ID | Test | Procédure | Résultat attendu |
| --- | --- | --- | --- |
| API-ORDER-01 | Créer une commande valide | Envoyer un panier avec un ou plusieurs plats disponibles | Réponse `201`, commande `pending` |
| API-ORDER-02 | Calcul serveur du total | Modifier le prix envoyé côté client | Le serveur ignore le prix client et utilise le prix du menu |
| API-ORDER-03 | Quantité invalide | Envoyer quantité `0`, décimale ou supérieure à `20` | Réponse `400` |
| API-ORDER-04 | Panier vide | Envoyer `items: []` | Réponse `400` |
| API-ORDER-05 | Article indisponible | Rendre un plat indisponible puis commander | Réponse `409` |
| API-ORDER-06 | Article d’un autre menu | Envoyer un identifiant n’appartenant pas au menu publié | Réponse `409` |
| API-ORDER-07 | Données facultatives | Envoyer table, contact et note | Données enregistrées après nettoyage et limitation de longueur |
| API-ORDER-08 | Snapshot de commande | Modifier ensuite le nom ou le prix d’un plat | La commande conserve le nom et le prix initiaux |
| API-ORDER-09 | Consultation publique | Lire la commande avec son token | Réponse `200` avec lignes, total et statut |
| API-ORDER-10 | Token inconnu | Lire une commande avec un mauvais token | Réponse `404` |
| API-ORDER-11 | Liste entreprise | Consulter les commandes authentifiées | Commandes limitées à l’entreprise connectée |
| API-ORDER-12 | Statut commande | Passer `pending → accepted → preparing → ready → served` | Chaque statut valide est accepté |
| API-ORDER-13 | Annulation | Annuler une commande active | Statut `cancelled` |
| API-ORDER-14 | Statut invalide | Envoyer une valeur arbitraire | Réponse `400` |

## 11. Tests manuels — parcours propriétaire/restaurateur

### TEST-UI-01 — Connexion et accès au module

1. Se connecter avec un compte `OWNER`, `MANAGER` ou `EMPLOYEE`.
2. Vérifier la présence de « Menu digital » dans la barre latérale.
3. Vérifier la présence de « Commandes » dans la barre latérale.
4. Ouvrir les deux écrans.
5. Vérifier qu’un utilisateur non authentifié est redirigé vers la connexion.

### TEST-UI-02 — Création et publication d’un menu

1. Ouvrir « Menu digital ».
2. Créer le menu principal.
3. Ajouter les catégories « Entrées » et « Plats ».
4. Ajouter au moins trois plats avec des prix différents.
5. Ajouter une image à un plat.
6. Désactiver un plat.
7. Enregistrer et publier le menu.
8. Vérifier le message de succès et le statut publié.

### TEST-UI-03 — Consultation du menu public

1. Ouvrir `/restau/menu/:enterpriseId`.
2. Vérifier le nom, le logo et la localisation du restaurant.
3. Cliquer sur chaque catégorie de la navigation sticky.
4. Vérifier l’affichage des plats actifs.
5. Vérifier que le plat désactivé n’est pas affiché.
6. Vérifier qu’une image se charge correctement et qu’un plat sans image reste lisible.
7. Tester l’affichage sur mobile et desktop.

### TEST-UI-04 — QR de secours

1. Ouvrir la liste des cartes NFC.
2. Cliquer sur le bouton QR d’une carte.
3. Vérifier la modale et l’image générée.
4. Télécharger le QR.
5. Ouvrir/scanner le QR et vérifier l’URL de destination.

### TEST-UI-05 — Avis Google

1. Configurer une URL Google valide dans le profil entreprise.
2. Ouvrir le menu public.
3. Cliquer sur « Donner un avis Google ».
4. Vérifier l’ouverture dans un nouvel onglet.
5. Supprimer le lien Google du profil.
6. Vérifier que le bouton n’est plus affiché sur le menu public.

### TEST-UI-06 — Réservation

1. Cliquer sur « Réserver une table ».
2. Vérifier la modale et les champs date, heure, couverts et contact.
3. Soumettre une réservation valide.
4. Vérifier le message de confirmation.
5. Tester une date passée, un contact vide et une heure invalide.
6. Depuis l’espace entreprise, vérifier l’arrivée de la réservation.
7. Confirmer puis annuler la réservation.

### TEST-UI-07 — Panier client

1. Ouvrir le menu public publié.
2. Cliquer sur « Ajouter » pour plusieurs plats.
3. Vérifier le compteur du panier.
4. Ouvrir le panier flottant.
5. Augmenter puis diminuer la quantité.
6. Supprimer une ligne.
7. Vérifier que le total évolue correctement.
8. Vérifier que le prix affiché est en FCFA.
9. Fermer puis rouvrir le panier.

### TEST-UI-08 — Validation d’une commande

1. Ajouter au moins deux plats.
2. Renseigner une table, un contact et une note cuisine.
3. Envoyer la commande.
4. Vérifier l’écran de confirmation.
5. Vérifier la référence courte affichée.
6. Vérifier le total de la commande.
7. Fermer puis consulter la commande depuis l’espace restaurateur.

### TEST-UI-09 — Suivi côté restaurant

1. Ouvrir « Commandes » avec un compte entreprise.
2. Vérifier l’apparition de la commande sans rechargement manuel après au plus 10 secondes.
3. Vérifier la table, le contact, la note, les lignes et le total.
4. Faire progresser la commande jusqu’à « Servie ».
5. Vérifier chaque statut affiché dans l’interface.
6. Tester l’annulation d’une commande active.
7. Cliquer sur « Actualiser » et vérifier que la liste reste cohérente.

## 12. Tests négatifs et sécurité

- Accéder au menu public d’une entreprise inexistante.
- Accéder à un menu non publié.
- Modifier une catégorie appartenant à une autre entreprise.
- Modifier le statut d’une commande appartenant à une autre entreprise.
- Utiliser un token de commande inexistant.
- Envoyer du HTML ou du JavaScript dans la note de commande.
- Dépasser les longueurs maximales des champs table, contact et note.
- Répéter rapidement la soumission d’une commande et vérifier les commandes créées.
- Vérifier qu’un prix client falsifié n’est jamais utilisé.
- Vérifier qu’une commande ne disparaît pas lorsqu’un plat est supprimé du menu.
- Vérifier que les erreurs API sont affichées clairement sans exposer de stack trace.

## 13. Compatibilité et ergonomie

Tester au minimum :

- Chrome ou Edge récent sur desktop ;
- navigateur mobile ou mode responsive ;
- largeur étroite avec panier flottant ;
- menu avec plusieurs catégories ;
- texte long, note longue et noms de plats longs ;
- absence d’image ;
- chargement lent ou erreur réseau ;
- clavier : navigation entre champs, validation avec Entrée, fermeture des modales ;
- contraste et lisibilité des statuts et boutons.

## 14. Critères d’acceptation de l’itération

L’itération est acceptée si :

- toutes les migrations s’exécutent sur une base locale vide ;
- le menu peut être créé, modifié, publié et consulté publiquement ;
- les catégories et plats inactifs sont correctement filtrés côté public ;
- le QR de secours fonctionne et mène à la bonne URL ;
- le lien Google est configurable et correctement affiché ;
- une réservation valide est reçue et gérable par le restaurant ;
- un client peut composer et envoyer un panier ;
- le total est recalculé côté serveur ;
- la commande apparaît dans l’espace restaurant au plus tard après un cycle de rafraîchissement ;
- les statuts de commande sont modifiables et isolés par entreprise ;
- les tests négatifs prioritaires sont maîtrisés ;
- `typecheck`, `lint` et `build` passent sans erreur bloquante ;
- aucun secret ou fichier `.env` n’est committé.

## 15. Preuves à conserver

Pour chaque campagne de test, conserver :

- sortie de `npm run db:migrate:status` ;
- sortie de `npm run typecheck`, `npm run lint` et `npm run build` ;
- captures du menu public, panier, confirmation et écran commandes ;
- référence d’une commande créée ;
- résultats des tests négatifs ;
- anomalies avec étapes de reproduction, résultat attendu, résultat obtenu et capture associée.

## 16. Fiche d’anomalie

```text
ID :
Date :
Test concerné :
Environnement / navigateur :
Préconditions :
Étapes de reproduction :
Résultat attendu :
Résultat obtenu :
Gravité : Bloquante / Majeure / Mineure / Cosmétique
Capture ou logs :
Commit testé :
```
