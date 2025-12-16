# 🔧 CORRECTION CONFIGURATION VERCEL

## Problème identifié
Les "Production Overrides" sont différents des "Project Settings", ce qui peut causer des problèmes de déploiement.

## Solution immédiate

### 1. Synchroniser les paramètres
Dans Vercel Dashboard → Settings → General :

**Production Overrides** (actuel) :
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Project Settings** (recommandé) :
- Framework Preset: **Vite** ✅
- Build Command: `npm run build` (ou laisser Vite détecter automatiquement)
- Output Directory: `dist` ✅
- Install Command: `npm install` ✅

### 2. Actions à faire dans Vercel

1. **Supprimer les Production Overrides** :
   - Dans Settings → General
   - Trouver "Production Overrides"
   - Cliquer sur "Remove Overrides" ou les supprimer
   - Laisser Vercel utiliser les Project Settings

2. **Vérifier Root Directory** :
   - Doit être **VIDE** (pas de valeur)
   - Si une valeur est définie, la supprimer

3. **Vérifier Node.js Version** :
   - Doit être **22.x** (actuel ✅)

4. **Redéployer** :
   - Aller dans "Deployments"
   - Cliquer sur les 3 points du dernier déploiement
   - Sélectionner "Redeploy"

### 3. Vérifier que les fonctions serverless sont détectées

Vercel détecte automatiquement les fichiers dans `api/` comme des serverless functions si :
- ✅ Les fichiers sont dans `api/` (pas dans un sous-dossier)
- ✅ Les fichiers exportent `export default async function handler(req, res)`
- ✅ Les fichiers sont trackés par Git

### 4. Vérifier après redéploiement

Une fois redéployé, tester :
```bash
curl -I https://gob.vercel.app/api/test
curl -I https://gob.vercel.app/api/chat
curl -I https://gob.vercel.app/api/fmp
```

Si tous retournent 404, le problème est ailleurs (peut-être que Vercel ne détecte pas les fonctions).

### 5. Alternative : Forcer la détection des fonctions

Si Vercel ne détecte toujours pas les fonctions après avoir supprimé les overrides, vérifier dans `vercel.json` que la configuration est correcte.

## Configuration actuelle dans vercel.json

Le fichier `vercel.json` contient déjà la configuration des fonctions. Vercel devrait les détecter automatiquement.

## Prochaines étapes

1. ✅ Supprimer les Production Overrides dans Vercel
2. ✅ Vérifier que Root Directory est vide
3. ✅ Redéployer le projet
4. ✅ Tester les endpoints après déploiement
5. ✅ Si ça ne fonctionne toujours pas, vérifier les logs de build dans Vercel

