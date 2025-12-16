# Vérification du déploiement Vercel

## Problème
L'endpoint `/api/emma-n8n` retourne 404 sur Vercel, alors que :
- ✅ Le fichier `api/emma-n8n.js` existe
- ✅ Il est configuré dans `vercel.json`
- ✅ Le code est commité sur GitHub

## Solutions à vérifier

### 1. Vérifier le déploiement Vercel
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet GOB
3. Vérifier que le dernier déploiement est terminé
4. Vérifier les logs de déploiement pour voir s'il y a des erreurs

### 2. Vérifier que le fichier est bien dans le repo
```bash
ls -la api/emma-n8n.js
git ls-files api/emma-n8n.js
```

### 3. Forcer un redéploiement
Un commit vide a été créé pour forcer le redéploiement.

### 4. Vérifier la structure des fichiers
Vercel détecte automatiquement les fichiers dans `api/` comme des serverless functions.
Assurez-vous que :
- Le fichier est bien dans `api/emma-n8n.js` (pas dans un sous-dossier)
- Le fichier exporte un handler par défaut : `export default async function handler(req, res)`

### 5. Vérifier les logs Vercel
Dans le dashboard Vercel :
- Aller dans "Functions"
- Chercher `/api/emma-n8n`
- Vérifier s'il apparaît dans la liste des fonctions déployées

### 6. Alternative : Utiliser `/api/briefing` temporairement
Si `/api/emma-n8n` ne fonctionne toujours pas, on peut modifier le workflow pour utiliser `/api/briefing` qui devrait être déployé.

