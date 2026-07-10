# Résumé visuel - Génération dynamique des URLs de scan

## 🔄 Flux de données

```
┌──────────────────────────────────────────────────────────────────┐
│                    CRÉATION D'UN SERVICE                          │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Service créé avec    │
                    │  scanToken auto-généré │
                    │ (ex: a7f3e9d2c1b4a8f6) │
                    └────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                  GÉNÉRATION DE CARTES NFC                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
   ┌─────────┐            ┌─────────┐             ┌─────────┐
   │ Carte 1 │            │ Carte 2 │             │ Carte N │
   │ + URL   │            │ + URL   │             │ + URL   │
   └─────────┘            └─────────┘             └─────────┘
        │                        │                        │
        └────────────────────────┴────────────────────────┘
                                 │
                                 ▼
              Format: domain/type/entreprise-type/token
```

## 📐 Structure d'une URL de scan

```
https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6
│                 │          │                           │
│                 │          │                           └─> Token du service
│                 │          │                               (32 caractères)
│                 │          │
│                 │          └─> Nom entreprise + type + subtype
│                 │              (slugifié, minuscules, sans accents)
│                 │
│                 └─> Type de carte
│                     (slugifié)
│
└─> Domaine de base
    (depuis SCAN_BASE_URL)
```

## 🗂️ Relations de base de données

```
┌─────────────────────┐
│    Enterprise       │
│                     │
│ - id (UUID)         │
│ - name              │
│ - email             │
│ - ...               │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│      Service        │         │      CardType       │
│                     │         │                     │
│ - id (UUID)         │         │ - id (UUID)         │
│ - name              │         │ - name              │
│ - scanToken ✨      │         │ - description       │
│ - pointsToAdd       │         │ - ...               │
│ - enterpriseId      │         └──────────┬──────────┘
└──────────┬──────────┘                    │
           │                               │
           │ 1:N                           │ 1:N
           │                               │
           └───────────┬───────────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │      NFCCard        │
            │                     │
            │ - id (UUID)         │
            │ - cardNumber        │
            │ - cardCode          │
            │ - scanUrl ✨         │
            │ - serviceId ✨       │
            │ - cardTypeId        │
            │ - enterpriseId      │
            │ - status            │
            │ - ...               │
            └─────────────────────┘

✨ = Nouveaux champs
```

## 🔀 Flux de génération d'URL

```
┌─────────────────┐
│  Inputs         │
├─────────────────┤
│ cardType        │ ───┐
│ enterpriseName  │ ───┼──> slugify()
│ subtype?        │ ───┘
│ scanToken       │ ─────> du Service
│ baseUrl         │ ─────> depuis .env
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   utils/urlGenerator.js             │
│   generateScanUrl()                 │
├─────────────────────────────────────┤
│ 1. Nettoyer baseUrl (remove /)      │
│ 2. Slugifier le type                │
│ 3. Slugifier entreprise + type      │
│ 4. Ajouter subtype si présent       │
│ 5. Construire l'URL finale          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Résultat                           │
├─────────────────────────────────────┤
│ https://mzg.cards/restaurant/       │
│ chez-marcel-restaurant-luxe/        │
│ a7f3e9d2c1b4a8f6                    │
└─────────────────────────────────────┘
```

## 📊 Comparaison Avant/Après

### ❌ Ancien système

```
┌─────────────────────────────────────────────────┐
│  Génération de cartes                           │
├─────────────────────────────────────────────────┤
│  Paramètres requis:                             │
│  - enterpriseId                                 │
│  - cardTypeId                                   │
│  - scanBaseUrl (manuel) ⚠️                      │
│  - quantity                                     │
└─────────────────────────────────────────────────┘
                    │
                    ▼
        URL générée: https://mzg.cards/c/ABC123
                    │
                    └─> Pas SEO-friendly
                        Pas de contexte
                        Aucun lien avec le service
```

### ✅ Nouveau système

```
┌─────────────────────────────────────────────────┐
│  Génération de cartes                           │
├─────────────────────────────────────────────────┤
│  Paramètres requis:                             │
│  - enterpriseId                                 │
│  - cardTypeId                                   │
│  - serviceId ✨ (remplace scanBaseUrl)          │
│  - quantity                                     │
└─────────────────────────────────────────────────┘
                    │
                    ▼
        URL générée: https://mzg.cards/restaurant/
                     chez-marcel-restaurant-luxe/
                     a7f3e9d2c1b4a8f6
                    │
                    ├─> SEO-friendly ✅
                    ├─> Contexte clair ✅
                    └─> Lié au service ✅
```

## 🎯 Exemples de cas d'usage

### Cas 1 : Restaurant gastronomique

```
Données d'entrée:
┌───────────────────────────────────┐
│ Enterprise: "Le Gourmet Parisien" │
│ CardType: "Restaurant"            │
│ Subtype: "Luxe"                   │
│ Service: "Repas 3 étoiles"        │
│   scanToken: "a7f3..."            │
└───────────────────────────────────┘
              │
              ▼
        URL générée:
┌──────────────────────────────────────────────────────────┐
│ https://mzg.cards/restaurant/                            │
│ le-gourmet-parisien-restaurant-luxe/a7f3...              │
└──────────────────────────────────────────────────────────┘
```

### Cas 2 : Salon de coiffure

```
Données d'entrée:
┌───────────────────────────────────┐
│ Enterprise: "Coiff'Style & Beauty"│
│ CardType: "Salon"                 │
│ Subtype: null                     │
│ Service: "Coupe standard"         │
│   scanToken: "x9y8..."            │
└───────────────────────────────────┘
              │
              ▼
        URL générée:
┌──────────────────────────────────────────────────────────┐
│ https://mzg.cards/salon/                                 │
│ coiff-style-beauty-salon/x9y8...                         │
└──────────────────────────────────────────────────────────┘
```

### Cas 3 : Spa premium

```
Données d'entrée:
┌───────────────────────────────────┐
│ Enterprise: "Zen & Détente"       │
│ CardType: "Spa"                   │
│ Subtype: "Premium"                │
│ Service: "Massage relaxant"       │
│   scanToken: "p0o9..."            │
└───────────────────────────────────┘
              │
              ▼
        URL générée:
┌──────────────────────────────────────────────────────────┐
│ https://mzg.cards/spa/                                   │
│ zen-detente-spa-premium/p0o9...                          │
└──────────────────────────────────────────────────────────┘
```

## 🔐 Sécurité et unicité

```
┌─────────────────────────────────────────────────────────┐
│               Génération de scanToken                    │
├─────────────────────────────────────────────────────────┤
│  crypto.randomBytes(16).toString('hex')                 │
│         │                                                │
│         ▼                                                │
│  16 bytes = 128 bits d'entropie                         │
│         │                                                │
│         ▼                                                │
│  32 caractères hexadécimaux                             │
│         │                                                │
│         ▼                                                │
│  Probabilité de collision: ~1 / 10^38                   │
│         │                                                │
│         ▼                                                │
│  Contrainte UNIQUE en base de données                   │
│         │                                                │
│         ▼                                                │
│  ✅ Token unique garanti                                │
└─────────────────────────────────────────────────────────┘
```

## 📁 Architecture des fichiers

```
maze_nfc_tag/
│
├── backend/
│   ├── models/
│   │   ├── service.js ✏️ (scanToken ajouté)
│   │   ├── nfcCard.js ✏️ (serviceId ajouté)
│   │   └── index.js ✏️ (relation ajoutée)
│   │
│   ├── controllers/
│   │   └── adminController.js ✏️ (generateCards mis à jour)
│   │
│   ├── utils/
│   │   ├── urlGenerator.js ✨ (nouveau)
│   │   └── urlGenerator.test.example.js ✨ (nouveau)
│   │
│   ├── migrations/
│   │   └── add-service-token-and-card-service.js ✨ (nouveau)
│   │
│   ├── scripts/
│   │   └── runMigration.js ✨ (nouveau)
│   │
│   ├── .env.example ✏️ (SCAN_BASE_URL ajouté)
│   └── README.md ✨ (nouveau)
│
└── Documentation/
    ├── IMPLEMENTATION_SUMMARY.md ✨
    ├── MIGRATION_GUIDE.md ✨
    ├── CHANGELOG_SCAN_URLS.md ✨
    ├── QUICK_TEST_GUIDE.md ✨
    └── VISUAL_SUMMARY.md ✨ (ce fichier)

✨ = Nouveau fichier
✏️ = Fichier modifié
```

## 🎨 Format de slug

```
Chaîne d'origine           →  Slug généré
─────────────────────────────────────────────────────
"Chez Marcel"              →  "chez-marcel"
"Le Gourmet Parisien"      →  "le-gourmet-parisien"
"Café Français"            →  "cafe-francais"
"Coiff'Style & Beauty"     →  "coiff-style-beauty"
"Zen & Détente"            →  "zen-detente"
"Mode   &   Style"         →  "mode-style"
"L'Élégance"               →  "l-elegance"
"  -Le Restaurant-  "      →  "le-restaurant"
```

### Règles de slugification

1. ✅ Normalisation NFD (décomposition des accents)
2. ✅ Suppression des diacritiques
3. ✅ Conversion en minuscules
4. ✅ Remplacement des caractères non-alphanumériques par `-`
5. ✅ Suppression des tirets multiples
6. ✅ Suppression des tirets en début/fin

## 🚀 Workflow complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SUPER_ADMIN crée une entreprise                          │
│    POST /api/admin/enterprises                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. OWNER crée un service                                    │
│    POST /api/enterprise/services                            │
│    → scanToken auto-généré ✨                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SUPER_ADMIN génère des cartes                            │
│    POST /api/admin/cards/generate                           │
│    → Paramètre serviceId requis ✨                          │
│    → URLs générées automatiquement ✨                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Cartes créées avec URLs au format:                       │
│    https://mzg.cards/type/entreprise-type/token             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Statistiques

```
Ancien système:
├── URL: 30 caractères
├── Lisibilité: ⭐☆☆☆☆
├── SEO: ⭐☆☆☆☆
└── Contexte: ⭐☆☆☆☆

Nouveau système:
├── URL: ~80 caractères
├── Lisibilité: ⭐⭐⭐⭐⭐
├── SEO: ⭐⭐⭐⭐⭐
└── Contexte: ⭐⭐⭐⭐⭐
```

## ✅ Avantages du nouveau système

```
┌────────────────────────────────────────────────────────┐
│ ✅ URLs SEO-friendly                                    │
│    → Meilleur référencement                            │
│    → Contexte visible dans l'URL                       │
│                                                         │
│ ✅ Traçabilité                                          │
│    → Lien direct avec le service                       │
│    → Analyse facilitée                                 │
│                                                         │
│ ✅ Lisibilité                                           │
│    → Compréhension immédiate                           │
│    → Debug facilité                                    │
│                                                         │
│ ✅ Sécurité                                             │
│    → Token unique cryptographique                      │
│    → Contrainte d'unicité en DB                        │
│                                                         │
│ ✅ Automatisation                                       │
│    → Plus de saisie manuelle                           │
│    → Moins d'erreurs                                   │
└────────────────────────────────────────────────────────┘
```

---

**Ce document est une représentation visuelle de l'implémentation complète.**  
**Pour les détails techniques, consultez `IMPLEMENTATION_SUMMARY.md`**
