# Instructions pour corriger Vercel - À FAIRE MAINTENANT

## Problème
Les endpoints API retournent 404 car Vercel ne déploie pas les fonctions serverless. Les Production Overrides empêchent la détection automatique.

## Solution - À FAIRE DANS VERCEL DASHBOARD

### Étape 1 : Accéder aux Settings
1. Allez sur **https://vercel.com/dashboard**
2. Cliquez sur le projet **GOB**
3. Cliquez sur **"Settings"** dans le menu
4. Cliquez sur **"General"** dans le menu de gauche

### Étape 2 : Supprimer les Production Overrides
1. Faites défiler jusqu'à la section **"Production Overrides"**
2. Vous verrez :
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Supprimez ces 3 valeurs** (laissez-les vides)
4. Cliquez sur **"Save"** si nécessaire

### Étape 3 : Vérifier Root Directory
1. Dans la même page, trouvez **"Root Directory"**
2. **Doit être VIDE** (pas de valeur)
3. Si une valeur est définie, supprimez-la
4. Cliquez sur **"Save"**

### Étape 4 : Redéployer
1. Allez dans l'onglet **"Deployments"**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (⋯) à droite
4. Sélectionnez **"Redeploy"**
5. Attendez 2-5 minutes que le déploiement se termine

### Étape 5 : Vérifier
Une fois le déploiement terminé, testez :
```bash
curl https://gob.vercel.app/api/test
curl https://gob.vercel.app/api/chat
```

Si les endpoints retournent 200 au lieu de 404, c'est corrigé !

## Alternative : Si vous ne pouvez pas accéder au dashboard

Un commit vide a été créé pour forcer un redéploiement. Vercel devrait redéployer automatiquement, mais les Production Overrides doivent toujours être supprimés manuellement dans le dashboard pour que les fonctions serverless soient détectées.

