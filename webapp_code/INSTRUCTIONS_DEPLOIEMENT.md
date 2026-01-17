# 🚀 Instructions de Déploiement Vercel

## ✅ État Actuel

Tout est prêt ! Les fichiers suivants ont été créés et adaptés pour Vercel :

- ✅ `api/sector.js` - Endpoint `/api/sector`
- ✅ `api/sector-index.js` - Endpoint `/api/sector-index`
- ✅ `vercel.json` - Configuration mise à jour
- ✅ Branche Git créée : `feature/sector-index-api`

## 📋 Prochaines Étapes

### 1. Commiter et Pousser sur GitHub

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB

# Vérifier que vous êtes sur la bonne branche
git branch
# Devrait afficher: * feature/sector-index-api

# Commiter les changements
git commit -m "feat: Ajout API sectorielles pour Excel (Alpha Vantage + Vercel)

- Ajout endpoint /api/sector pour récupérer les données Alpha Vantage
- Ajout endpoint /api/sector-index pour calculer les performances pondérées
- Support MSCI World et S&P/TSX avec pondérations sectorielles
- Configuration Vercel ajoutée dans vercel.json
- Documentation complète dans webapp_code/"

# Pousser sur GitHub
git push origin feature/sector-index-api
```

### 2. Configurer Vercel

1. **Aller sur [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Sélectionner le projet GOB**
3. **Settings → Environment Variables**
4. **Ajouter ou vérifier** :
   ```
   ALPHA_VANTAGE_API_KEY = QGSG95SDH5SE52XS
   ```
   (Ou votre propre clé API si vous en avez une)

### 3. Déployer

#### Option A : Déploiement Automatique (Recommandé)

1. **Créer une Pull Request** sur GitHub depuis la branche `feature/sector-index-api`
2. **Vercel déploiera automatiquement** une preview
3. **Tester** les endpoints sur l'URL de preview (visible dans la PR)
4. **Merger** dans `main` pour déployer en production

#### Option B : Déploiement Manuel

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter (si pas déjà connecté)
vercel login

# Déployer en production
vercel --prod
```

### 4. Tester les Endpoints

Une fois déployé, tester avec :

```bash
# Remplacer YOUR_APP_URL par votre URL Vercel
export URL="https://gob.vercel.app"  # ou l'URL de preview

# Test 1: Données sectorielles
curl "$URL/api/sector"

# Test 2: Performance MSCI World (horizon B = 1 Day)
curl "$URL/api/sector-index?name=msci_world&horizon=B"

# Test 3: Performance S&P/TSX (horizon B = 1 Day)
curl "$URL/api/sector-index?name=sptsx&horizon=B"
```

### 5. Mettre à Jour Excel

Une fois déployé et testé, mettre à jour votre classeur Excel :

#### Dans l'onglet Parameters

**Cellule B1** : Remplacer `http://localhost:5000` par :
```
https://gob.vercel.app
```

#### Mettre à Jour la Macro VBA

Dans `UpdateIndices.bas` (ou dans votre classeur Excel) :

```vba
' Remplacer :
Const SERVER_URL As String = "http://localhost:5000"

' Par :
Const SERVER_URL As String = "https://gob.vercel.app"
```

#### Mettre à Jour le Script TypeScript

Dans `UpdateIndicesScript.ts` :

```typescript
// Remplacer :
const SERVER_URL = "http://localhost:5000";

// Par :
const SERVER_URL = "https://gob.vercel.app";
```

## 📊 Endpoints Disponibles

### GET `/api/sector`

Récupère les données sectorielles brutes depuis Alpha Vantage.

**Exemple de réponse :**
```json
{
  "success": true,
  "data": {
    "Rank A: Real-Time Performance": {
      "Communication Services": "0.5",
      "Consumer Discretionary": "-0.3",
      ...
    },
    "Rank B: 1 Day Performance": {
      ...
    },
    ...
  },
  "timestamp": "2025-12-02T...",
  "cached": false
}
```

### GET `/api/sector-index`

Calcule la performance pondérée d'un indice.

**Paramètres :**
- `name` : `msci_world` ou `sptsx` (requis)
- `horizon` : `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, ou `J` (requis)

**Exemple :**
```bash
curl "https://gob.vercel.app/api/sector-index?name=msci_world&horizon=B"
```

**Exemple de réponse :**
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
      "originalName": "Information Technology",
      "weight": 26.9,
      "performance": 0.8,
      "contribution": 0.2152
    },
    ...
  ],
  "timestamp": "2025-12-02T..."
}
```

## ⚠️ Notes Importantes

1. **Cache** : Les données sont mises en cache pendant 60 secondes pour respecter les limites de l'API Alpha Vantage (5 appels/min)

2. **Quota API** : Alpha Vantage gratuit = 5 appels/minute, 500/jour. Le cache aide à respecter ces limites.

3. **Cold Start** : En serverless, le premier appel peut être plus lent (cold start). Les appels suivants sont rapides.

4. **URL de Production** : Après déploiement, votre URL sera `https://gob.vercel.app` (ou votre domaine personnalisé)

## ✅ Checklist Finale

- [ ] Code commité sur la branche `feature/sector-index-api`
- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Déploiement réussi (vérifier dans Vercel Dashboard)
- [ ] Endpoints testés avec curl
- [ ] URL mise à jour dans Excel (Parameters!B1)
- [ ] Macro VBA mise à jour avec la nouvelle URL
- [ ] Script TypeScript mis à jour avec la nouvelle URL
- [ ] Test complet depuis Excel

## 🎉 C'est Prêt !

Une fois déployé, votre solution sera accessible depuis n'importe où via l'URL Vercel. Plus besoin de serveur local !

**Documentation Complète :**
- `webapp_code/README.md` - Vue d'ensemble
- `webapp_code/DEPLOIEMENT_VERCEL.md` - Guide détaillé
- `webapp_code/README_VERCEL.md` - Résumé rapide


























See shared rules: /Users/projetsjsl/.gemini-configs/AGENT_CONSTITUTION.md

### Repo Safety (ABSOLUTE)
- Never run `git` or `gh` from: `~`, `~/Documents`, or `~/Documents/GitHub` (container folders).
- Before any `git`/`gh` command, detect repo root with:
  `git rev-parse --show-toplevel`
  - If it fails: STOP and ask for the target repo path (or `cd` to an explicit repo path provided by the user).
  - If it succeeds: `cd` to that toplevel and run commands from there.
- For `gh` commands in this environment, always neutralize auth overrides:
  prefix with: `env -u GITHUB_TOKEN -u GH_TOKEN -u GH_HOST -u GITHUB_HOST`

