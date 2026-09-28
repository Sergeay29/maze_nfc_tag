# Validation finale Restau

## Viewports manuels

- Mobile étroit : 320 × 568
- Mobile standard : 375 × 812
- Tablette : 768 × 1024
- Ordinateur : 1280 × 800
- Grand écran : 1440 × 900

## Parcours à vérifier

- Menu entreprise : catégories, formulaire plat, upload et aperçu photo, modal des options, import CSV.
- Menu public : navigation des catégories, plat sans description, plat avec options, panier, réservation et commande.
- Commandes : détail des options, changement de statut, téléchargement du ticket PDF.
- Réservations : affichage de la table affectée, confirmation, annulation et affichage vide.
- Tables : création, zone, capacité, désactivation et téléchargement du QR.
- Modales : fermeture par bouton, clic extérieur, défilement interne et absence de débordement horizontal.

## Tests négatifs

- CSV vide, mauvais prix, catégorie absente, plat absent et fichier trop volumineux.
- Option obligatoire non sélectionnée ou trop de choix sélectionnés.
- Deux réservations qui se chevauchent sur une même table.
- Restaurant suspendu lors de la publication et accès public au menu.
- Téléchargement PDF sans authentification ou pour une commande d’une autre entreprise.
