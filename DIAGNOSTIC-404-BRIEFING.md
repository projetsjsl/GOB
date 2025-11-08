# 🔍 Diagnostic 404 - Endpoint /api/briefing

## ❌ Problème

L'endpoint `/api/briefing` retourne 404, et même `/api/emma-briefing.js` (qui existe déjà) retourne 404.

**Conclusion**: Vercel ne déploie pas les fonctions serverless correctement.

## ✅ Fichiers créés et commités

- ✅ `api/briefing.js` (créé et commité)
- ✅ `lib/email-templates.js` (créé et commité)  
- ✅ `lib/briefing-confirmation.js` (créé et commité)
- ✅ `vercel.json` (mis à jour avec `api/briefing.js`)

## 🔍 Vérifications à faire

### 1. Vérifier le déploiement Vercel

**Aller sur**: https://vercel.com/projetsjsl/gob/deployments

1. Vérifier le **dernier déploiement**:
   - Status: "Ready" ✅ ou "Building" ⏳ ou "Error" ❌
   - Si "Building", attendre qu'il se termine
   - Si "Error", vérifier les logs

2. Vérifier la section **"Functions"**:
   - Cliquer sur le dernier déploiement
   - Onglet "Functions"
   - Chercher `api/briefing.js`
   - Si **absent** → Vercel ne détecte pas le fichier

### 2. Vérifier les Settings Vercel

**Aller sur**: https://vercel.com/projetsjsl/gob/settings/general

Vérifier:
- **Root Directory**: `./` (doit pointer vers la racine)
- **Framework Preset**: "Other" ou "Vite"
- **Build Command**: `npm run build` (ou vide)
- **Output Directory**: `dist` (ou vide)

### 3. Si les fonctions n'apparaissent pas

**Solution 1: Forcer un redéploiement complet**

Dans Vercel Dashboard:
1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer **"Redeploy"**
4. **IMPORTANT**: Décocher "Use existing Build Cache"
5. Cliquer "Redeploy"

**Solution 2: Vérifier les logs de build**

Dans le déploiement Vercel:
1. Cliquer sur "Build Logs"
2. Chercher des erreurs:
   - `Module not found`
   - `Syntax error`
   - `Build failed`

### 4. Vérifier que le fichier est correct

Le fichier `api/briefing.js` doit:
- ✅ Exporter `export default async function handler(req, res)`
- ✅ Être dans le dossier `api/`
- ✅ Avoir la bonne structure

## 🧪 Test après correction

Une fois le déploiement terminé:

```bash
# Test simple
curl "https://gob.vercel.app/api/briefing?type=morning"

# Test avec verbose
curl -v "https://gob.vercel.app/api/briefing?type=morning"
```

**Réponse attendue:**
```json
{
  "success": true,
  "type": "morning",
  "subject": "...",
  "content": "...",
  "html_content": "...",
  "metadata": {...}
}
```

## ⚠️ Solution temporaire

En attendant que Vercel déploie correctement, vous pouvez utiliser `/api/emma-n8n` qui existe déjà:

**Modifier le workflow n8n** pour utiliser:
```
https://gob.vercel.app/api/emma-n8n?action=briefing&type=morning
```

Mais il faut d'abord vérifier que `/api/emma-n8n` fonctionne.

## 📋 Checklist

- [ ] Vérifier le statut du déploiement Vercel
- [ ] Vérifier que `api/briefing.js` apparaît dans "Functions"
- [ ] Vérifier les logs de build pour des erreurs
- [ ] Forcer un redéploiement si nécessaire
- [ ] Tester l'endpoint après déploiement

