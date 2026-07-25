# ⚡ Exemple Rapide - URLs Dynamiques

## 🎯 Comment ça marche ?

### Configuration dans `backend/.env`

```env
SCAN_BASE_URL=http://localhost:5173
```

☝️ **C'est tout ce que tu dois configurer !**

---

## 🔄 Ce qui se passe automatiquement

### Étape 1 : Tu génères des cartes NFC

Via l'interface admin, tu saisis :
- **Entreprise** : "Chez Marcel"
- **Type de carte** : "Restaurant"
- **Sous-type** : "Luxe"
- **Service** : "Menu du midi" (token auto-généré : `abc123def456`)
- **Quantité** : 10 cartes

### Étape 2 : Le système génère l'URL automatiquement

```javascript
generateScanUrl({
  cardType: "Restaurant",           // → slugifié: "restaurant"
  enterpriseName: "Chez Marcel",    // → slugifié: "chez-marcel"
  subtype: "Luxe",                  // → slugifié: "luxe"
  scanToken: "abc123def456",        // → tel quel
  baseUrl: "http://localhost:5173"  // → depuis .env
})
```

**Résultat :**
```
http://localhost:5173/restaurant/chez-marcel-restaurant-luxe/abc123def456
         ↑                ↑              ↑                       ↑
    depuis .env       type carte    nom + type + subtype     token
```

### Étape 3 : Tu changes de domaine en production

Tu modifies juste le `.env` :
```env
SCAN_BASE_URL=https://fidelite.restaurant-marcel.com
```

**Maintenant les URLs générées seront :**
```
https://fidelite.restaurant-marcel.com/restaurant/chez-marcel-restaurant-luxe/abc123def456
```

---

## 📱 Exemples Réels

### Exemple 1 : Restaurant

**Configuration :**
```env
SCAN_BASE_URL=http://localhost:5173
```

**Création de carte :**
- Entreprise : "Le Gourmet Parisien"
- Type : "Restaurant"  
- Subtype : "Premium"
- Token : `a1b2c3d4e5f6`

**URL générée :**
```
http://localhost:5173/restaurant/le-gourmet-parisien-restaurant-premium/a1b2c3d4e5f6
```

---

### Exemple 2 : Salon de coiffure

**Configuration :**
```env
SCAN_BASE_URL=https://monapp.com
```

**Création de carte :**
- Entreprise : "Coiffure & Style"
- Type : "Salon"
- Subtype : "Standard"
- Token : `x9y8z7w6v5u4`

**URL générée :**
```
https://monapp.com/salon/coiffure-style-salon-standard/x9y8z7w6v5u4
```

---

### Exemple 3 : Sans subtype

**Configuration :**
```env
SCAN_BASE_URL=https://app.fidelite.io
```

**Création de carte :**
- Entreprise : "Café des Arts"
- Type : "Restaurant"
- Subtype : *(vide)*
- Token : `m5n4o3p2q1r0`

**URL générée :**
```
https://app.fidelite.io/restaurant/cafe-des-arts-restaurant/m5n4o3p2q1r0
```

---

## 🎨 Slugification automatique

Le système transforme automatiquement les textes :

| Texte original | Slug généré |
|---------------|-------------|
| `"Chez Marcel"` | `chez-marcel` |
| `"Restaurant"` | `restaurant` |
| `"Luxe"` | `luxe` |
| `"Café des Arts"` | `cafe-des-arts` |
| `"Coiffure & Style"` | `coiffure-style` |
| `"Beauté Zen 😊"` | `beaute-zen` |
| `"L'Élégance"` | `l-elegance` |

---

## ✅ Checklist Rapide

### Pour développement local :

1. **Backend `.env` :**
   ```env
   SCAN_BASE_URL=http://localhost:5173
   ```

2. **Frontend `.env` :**
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Démarrer les serveurs :**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm run dev
   ```

4. **Tester :**
   ```bash
   # Créer des données de test
   cd backend
   node seeds/demo-scan.seed.js
   
   # Copier une URL affichée et l'ouvrir
   ```

---

### Pour production :

1. **Backend `.env` :**
   ```env
   SCAN_BASE_URL=https://votre-domaine.com
   ```

2. **Frontend `.env` :**
   ```env
   VITE_API_URL=https://api.votre-domaine.com/api
   ```

3. **Rebuild et redéployer**

4. **Les nouvelles cartes générées auront les nouvelles URLs !**

---

## 🎯 Points clés

### ✅ Ce qui est dynamique :
- L'URL de base (`SCAN_BASE_URL`)
- Le type de carte (slugifié automatiquement)
- Le nom de l'entreprise (slugifié automatiquement)
- Le subtype (slugifié automatiquement)
- Le token (généré automatiquement)

### ✅ Ce que tu dois configurer :
- **Une seule variable** : `SCAN_BASE_URL` dans `backend/.env`

### ✅ Ce qui change entre dev et prod :
- **Seulement** la valeur de `SCAN_BASE_URL`
- Le reste du code reste identique ! 🎉

---

## 🚀 Résultat final

**Tu génères une carte :**
```
Entreprise: "Chez Marcel"
Type: "Restaurant"
Subtype: "Luxe"
```

**URLs générées selon l'environnement :**

| Environnement | SCAN_BASE_URL | URL complète |
|--------------|---------------|--------------|
| **Local** | `http://localhost:5173` | `http://localhost:5173/restaurant/chez-marcel-restaurant-luxe/abc123` |
| **Staging** | `https://staging.app.com` | `https://staging.app.com/restaurant/chez-marcel-restaurant-luxe/abc123` |
| **Production** | `https://fidelite.marcel.com` | `https://fidelite.marcel.com/restaurant/chez-marcel-restaurant-luxe/abc123` |

**Le chemin reste identique, seul le domaine change !** ✨

---

## 📝 TL;DR

1. Configure `SCAN_BASE_URL` dans `backend/.env`
2. Génère des cartes NFC via l'interface
3. Les URLs sont créées automatiquement avec ton domaine
4. Change de domaine en prod → Modifie juste `SCAN_BASE_URL`
5. Profit ! 🎉

**C'est aussi simple que ça !** 🚀
