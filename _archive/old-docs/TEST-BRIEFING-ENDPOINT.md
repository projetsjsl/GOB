# Test de l'endpoint /api/briefing

## 🧪 Endpoints de test créés

1. **`/api/briefing-test`** - Version ultra-simplifiée (sans imports)
2. **`/api/briefing-simple`** - Version avec config mais sans imports externes
3. **`/api/briefing`** - Version complète (avec templates et confirmations)

## 🔍 Diagnostic

Si même `/api/briefing-test` retourne 404:
- ❌ Problème de déploiement Vercel (les fonctions ne sont pas déployées)
- ✅ Vérifier dans Vercel Dashboard → Deployments → Functions

Si `/api/briefing-test` fonctionne mais pas `/api/briefing`:
- ❌ Problème avec les imports (`lib/email-templates.js` ou `lib/briefing-confirmation.js`)
- ✅ Vérifier que les fichiers `lib/` sont bien dans le repo

## 📋 Tests à faire

```bash
# Test 1: Endpoint ultra-simple
curl "https://gob.vercel.app/api/briefing-test?type=morning"

# Test 2: Endpoint avec config
curl "https://gob.vercel.app/api/briefing-simple?type=morning"

# Test 3: Endpoint complet
curl "https://gob.vercel.app/api/briefing?type=morning"
```

## ⚠️ Si tous retournent 404

Le problème vient de Vercel qui ne déploie pas les fonctions. Vérifier:
1. Dashboard Vercel → Deployments → Dernier déploiement
2. Section "Functions" → Vérifier que les endpoints apparaissent
3. Si absents → Problème de configuration Vercel
4. Si présents mais 404 → Problème de runtime (vérifier les logs)

