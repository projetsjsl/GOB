# Guide de déploiement Render

Ce guide explique comment déployer l'application GOB sur Render.

## Configuration actuelle

- **Service ID**: `srv-d49ocoh5pdvs73dot64g`
- **URL**: https://gob-kmay.onrender.com
- **Dashboard**: https://dashboard.render.com/web/srv-d49ocoh5pdvs73dot64g

## Configuration requise dans Render Dashboard

### Build & Deploy Settings

1. **Build Command**: 
   ```
   npm install && npm run build
   ```

2. **Start Command**: 
   ```
   npm start
   ```

3. **Health Check Path**: 
   ```
   /health
   ```

### Variables d'environnement

Assurez-vous que toutes les variables d'environnement nécessaires sont configurées dans le dashboard Render. Consultez `CLAUDE.md` pour la liste complète des variables requises.

Variables critiques:
- `GEMINI_API_KEY`
- `FMP_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PORT` (défini automatiquement par Render, mais peut être forcé à `10000`)

## Structure du projet

- `server.js` - Serveur Express qui sert les fichiers statiques et monte les routes API
- `package.json` - Contient le script `start` qui lance le serveur
- `build.js` - Script de build qui copie les fichiers de `public/` vers `dist/`
- `render.yaml` - Configuration Render (pour référence)

## Déploiement

### Méthode 1: Déploiement automatique (recommandé)

1. Poussez vos changements sur GitHub:
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin main
   ```

2. Render redéploiera automatiquement si l'auto-deploy est activé.

### Méthode 2: Déploiement manuel

1. Utilisez le script de déploiement:
   ```bash
   ./deploy-render.sh
   ```

2. Poussez les changements:
   ```bash
   git push origin main
   ```

3. Dans le dashboard Render, cliquez sur "Manual Deploy" → "Deploy latest commit"

## Vérification

Après le déploiement, vérifiez:

1. **Health Check**: https://gob-kmay.onrender.com/health
   - Devrait retourner `{"status":"healthy",...}`

2. **Dashboard**: https://gob-kmay.onrender.com/
   - Devrait afficher le dashboard principal

3. **API**: https://gob-kmay.onrender.com/api/fmp
   - Devrait retourner le statut de l'API FMP

## Dépannage

### Erreur: "Command 'start' not found"

**Solution**: Vérifiez que le script `start` est présent dans `package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### Erreur: "Cannot find module 'express'"

**Solution**: Vérifiez que `express` est dans les dépendances de `package.json` et que `npm install` a été exécuté.

### Le serveur démarre mais les routes API ne fonctionnent pas

**Solution**: Vérifiez les logs Render pour voir quelles routes ont été montées. Le serveur affiche `✅ Route API montée: /api/...` pour chaque route réussie.

### Les fichiers statiques ne se chargent pas

**Solution**: Vérifiez que le build a créé le dossier `dist/` avec les fichiers de `public/`. Le serveur cherche d'abord dans `dist/`, puis dans `public/`.

## Support

Pour plus d'informations, consultez:
- [Documentation Render](https://render.com/docs)
- [CLAUDE.md](./CLAUDE.md) - Documentation du projet

