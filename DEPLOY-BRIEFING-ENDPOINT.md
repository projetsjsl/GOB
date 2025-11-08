# Déploiement de l'endpoint /api/briefing

## ✅ Fichiers créés/modifiés

1. **`api/briefing.js`** - Nouvel endpoint créé ✅
2. **`lib/email-templates.js`** - Templates HTML par type ✅
3. **`lib/briefing-confirmation.js`** - Confirmations email ✅
4. **`vercel.json`** - Configuration ajoutée pour `api/briefing.js` ✅

## 🚀 Déploiement requis

L'endpoint `/api/briefing` doit être déployé sur Vercel pour fonctionner.

### Option 1: Déploiement automatique (recommandé)

```bash
# Commit et push les changements
git add api/briefing.js lib/email-templates.js lib/briefing-confirmation.js vercel.json
git commit -m "feat: Add /api/briefing endpoint for n8n workflows"
git push origin main
```

Vercel déploiera automatiquement.

### Option 2: Déploiement manuel

1. Aller sur https://vercel.com/projetsjsl/gob
2. Cliquer sur "Deployments" → "Redeploy" (ou attendre le prochain push)

## 🧪 Test après déploiement

Une fois déployé, tester:

```bash
# Test direct
curl "https://gob.vercel.app/api/briefing?type=morning"

# Test via script
node test-briefing-endpoint.js morning
```

## ⚠️ Si l'erreur 404 persiste

1. Vérifier que le déploiement est terminé sur Vercel
2. Vérifier dans Vercel → Deployments → Functions que `api/briefing.js` apparaît
3. Vérifier les logs Vercel pour voir s'il y a des erreurs de build

