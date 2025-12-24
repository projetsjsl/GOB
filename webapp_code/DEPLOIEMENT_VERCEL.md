# 🚀 Déploiement sur Vercel - Guide Complet

## ✅ Code Adapté pour Vercel

Les endpoints ont été adaptés pour fonctionner sur Vercel en tant que Serverless Functions :

- ✅ `api/sector.js` → `GET /api/sector`
- ✅ `api/sector-index.js` → `GET /api/sector-index?name=msci_world&horizon=B`
- ✅ Configuration ajoutée dans `vercel.json`

## 📋 Étapes de Déploiement

### 1. Créer une Branche Git

```bash
# Depuis la racine du projet GOB
git checkout -b feature/sector-index-api
git add api/sector.js api/sector-index.js vercel.json
git commit -m "feat: Ajout API sectorielles pour Excel (Alpha Vantage)"
git push origin feature/sector-index-api
```

### 2. Configurer les Variables d'Environnement dans Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **GOB**
3. **Settings** → **Environment Variables**
4. Ajouter ou vérifier :
   ```
   ALPHA_VANTAGE_API_KEY=QGSG95SDH5SE52XS
   ```
   (Ou votre propre clé API)

### 3. Déployer sur Vercel

#### Option A : Déploiement Automatique (Recommandé)

1. Créer une Pull Request sur GitHub
2. Vercel déploiera automatiquement une preview
3. Tester les endpoints sur l'URL de preview
4. Merger dans `main` pour déployer en production

#### Option B : Déploiement Manuel

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

### 4. Vérifier le Déploiement

Une fois déployé, tester les endpoints :

```bash
# Remplacer YOUR_APP_URL par votre URL Vercel
export VERCEL_URL="https://gob.vercel.app"

# Test 1: Health check (créer si nécessaire)
curl "$VERCEL_URL/api/sector"

# Test 2: Performance MSCI World
curl "$VERCEL_URL/api/sector-index?name=msci_world&horizon=B"

# Test 3: Performance S&P/TSX
curl "$VERCEL_URL/api/sector-index?name=sptsx&horizon=B"
```

## 🔧 Configuration Excel pour Vercel

### Mettre à Jour l'URL dans Excel

Dans l'onglet `Parameters` du classeur Excel :

**Cellule B1** : Remplacer `http://localhost:5000` par votre URL Vercel :
```
https://gob.vercel.app
```

### Mettre à Jour la Macro VBA

Dans `UpdateIndices.bas`, modifier la constante :

```vba
' Remplacer :
Const SERVER_URL As String = "http://localhost:5000"

' Par :
Const SERVER_URL As String = "https://gob.vercel.app"
```

### Mettre à Jour le Script TypeScript

Dans `UpdateIndicesScript.ts`, modifier :

```typescript
// Remplacer :
const SERVER_URL = "http://localhost:5000";

// Par :
const SERVER_URL = "https://gob.vercel.app";
```

## 📊 Endpoints Disponibles

### 1. GET `/api/sector`

Récupère les données sectorielles brutes depuis Alpha Vantage.

**Exemple :**
```bash
curl https://gob.vercel.app/api/sector
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "Rank A: Real-Time Performance": {
      "Communication Services": "0.5",
      "Consumer Discretionary": "-0.3",
      ...
    },
    ...
  },
  "timestamp": "2025-12-02T...",
  "cached": false
}
```

### 2. GET `/api/sector-index`

Calcule la performance pondérée d'un indice.

**Paramètres :**
- `name` : `msci_world` ou `sptsx` (requis)
- `horizon` : `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, ou `J` (requis)

**Exemple :**
```bash
curl "https://gob.vercel.app/api/sector-index?name=msci_world&horizon=B"
```

**Réponse :**
```json
{
  "success": true,
  "index": "msci_world",
  "horizon": "B",
  "totalPerformance": 0.45,
  "totalWeight": 100,
  "contributions": [
    {
      "sector": "Technologie de l'information",
      "weight": 26.9,
      "performance": 0.8,
      "contribution": 0.2152
    },
    ...
  ],
  "timestamp": "2025-12-02T..."
}
```

## ⚠️ Limitations Vercel

### Cache Serverless

- Le cache est **par instance** (chaque fonction serverless a son propre cache)
- Le cache peut être partagé entre plusieurs invocations de la même instance
- Le cache est perdu quand l'instance est mise en veille (cold start)

### Timeouts

- Timeout configuré : 15 secondes (voir `vercel.json`)
- Si l'API Alpha Vantage est lente, augmenter dans `vercel.json` :
  ```json
  "api/sector.js": {
    "maxDuration": 30
  }
  ```

### Rate Limiting

- Alpha Vantage : 5 appels/minute, 500/jour (gratuit)
- Le cache de 60 secondes aide à respecter ces limites
- En cas de dépassement, l'API retourne une erreur claire

## 🐛 Dépannage

### Les endpoints retournent 404

1. Vérifier que les fichiers sont dans `api/`
2. Vérifier que `vercel.json` contient la configuration
3. Vérifier les logs de déploiement dans Vercel Dashboard
4. Redéployer sans cache : `vercel --prod --force`

### Erreur "Quota Alpha Vantage dépassé"

1. Attendre quelques minutes
2. Vérifier le nombre d'appels dans les logs Vercel
3. Utiliser une clé API différente si disponible
4. Augmenter le TTL du cache (modifier `cache.ttl` dans le code)

### Les données ne se mettent pas à jour

1. Le cache dure 60 secondes
2. Attendre 1 minute avant de réessayer
3. Vérifier les logs Vercel pour voir si l'API est appelée

## 📝 Checklist de Déploiement

- [ ] Code commité sur une branche
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Déploiement réussi (vérifier dans Vercel Dashboard)
- [ ] Endpoints testés avec curl
- [ ] URL mise à jour dans Excel (Parameters!B1)
- [ ] Macro VBA mise à jour avec la nouvelle URL
- [ ] Script TypeScript mis à jour avec la nouvelle URL
- [ ] Test complet depuis Excel

## 🎉 C'est Prêt !

Une fois déployé, votre solution est accessible depuis n'importe où via l'URL Vercel. Plus besoin de serveur local !

**URL de Production :** `https://gob.vercel.app/api/sector`

**Documentation Complète :** Voir `README.md` dans `webapp_code/`

























