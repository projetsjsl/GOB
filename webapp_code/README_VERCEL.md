# 🚀 Déploiement Vercel - Résumé Rapide

## ✅ Code Adapté et Prêt

Les endpoints ont été créés dans le projet principal pour Vercel :

- ✅ `api/sector.js` → `GET /api/sector`
- ✅ `api/sector-index.js` → `GET /api/sector-index?name=msci_world&horizon=B`
- ✅ Configuration ajoutée dans `vercel.json`

## 📋 Commandes de Déploiement

### 1. Créer une Branche et Commiter

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB

# Créer une branche
git checkout -b feature/sector-index-api

# Ajouter les fichiers
git add api/sector.js api/sector-index.js vercel.json webapp_code/

# Commiter
git commit -m "feat: Ajout API sectorielles pour Excel (Alpha Vantage + Vercel)"

# Pousser sur GitHub
git push origin feature/sector-index-api
```

### 2. Configurer Vercel

1. **Variables d'environnement** :
   - Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Projet **GOB** → **Settings** → **Environment Variables**
   - Ajouter : `ALPHA_VANTAGE_API_KEY=QGSG95SDH5SE52XS`

2. **Déploiement automatique** :
   - Créer une Pull Request sur GitHub
   - Vercel déploiera automatiquement une preview
   - Tester : `https://gob-[hash].vercel.app/api/sector`

3. **Merger en production** :
   - Merger la PR dans `main`
   - Production : `https://gob.vercel.app/api/sector`

### 3. Mettre à Jour Excel

Dans l'onglet `Parameters` du classeur Excel :

**Cellule B1** : `https://gob.vercel.app`

Puis mettre à jour :
- **Macro VBA** : `UpdateIndices.bas` → `Const SERVER_URL = "https://gob.vercel.app"`
- **Script TypeScript** : `UpdateIndicesScript.ts` → `const SERVER_URL = "https://gob.vercel.app"`

## 🧪 Tests Rapides

```bash
# Après déploiement
export URL="https://gob.vercel.app"

# Test 1: Données sectorielles
curl "$URL/api/sector"

# Test 2: Performance MSCI World
curl "$URL/api/sector-index?name=msci_world&horizon=B"

# Test 3: Performance S&P/TSX
curl "$URL/api/sector-index?name=sptsx&horizon=B"
```

## 📚 Documentation Complète

Voir `webapp_code/DEPLOIEMENT_VERCEL.md` pour les détails complets.

## ✅ Checklist

- [ ] Code commité sur une branche
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Déploiement réussi
- [ ] Endpoints testés
- [ ] URL mise à jour dans Excel
- [ ] Test complet depuis Excel

🎉 **C'est prêt !**


