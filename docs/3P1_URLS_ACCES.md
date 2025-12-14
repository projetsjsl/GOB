# 📍 URLs d'Accès - Finance Pro 3p1

## 🎯 URLs Correctes

### Option 1 : Via gobapps.com (Recommandé)
```
https://gobapps.com/3p1/dist/index.html
```

### Option 2 : Via gobapps.com (avec redirection automatique)
```
https://gobapps.com/3p1/index.html
```
→ Redirige automatiquement vers `/3p1/dist/index.html`

### Option 3 : Via Vercel (si gobapps.com ne fonctionne pas)
```
https://gob-projetsjsls-projects.vercel.app/3p1/dist/index.html
```

## 🔍 Comment Vérifier l'URL Correcte

1. **Vérifier le domaine principal** :
   - Ouvrez `https://gobapps.com` dans votre navigateur
   - Si ça fonctionne, utilisez `https://gobapps.com/3p1/dist/index.html`

2. **Vérifier Vercel** :
   - Allez sur https://vercel.com
   - Trouvez votre projet "GOB"
   - L'URL sera affichée (ex: `gob-projetsjsls-projects.vercel.app`)

3. **Tester l'API** :
   ```bash
   curl https://gobapps.com/api/fmp
   # ou
   curl https://gob-projetsjsls-projects.vercel.app/api/fmp
   ```

## ⚠️ Problèmes Courants

### Page blanche / Rien ne fonctionne

1. **Vérifier que l'application est compilée** :
   ```bash
   cd public/3p1
   npm run build
   ```

2. **Vérifier les fichiers dist/** :
   ```bash
   ls -la public/3p1/dist/
   ```
   Doit contenir :
   - `index.html`
   - `assets/index.js`
   - `assets/index.css`

3. **Vérifier la console du navigateur** :
   - Ouvrir DevTools (F12)
   - Onglet "Console"
   - Chercher les erreurs en rouge

4. **Vérifier le réseau** :
   - Onglet "Network" dans DevTools
   - Recharger la page
   - Vérifier que `index.js` et `index.css` se chargent (status 200)

### Erreur 404

- Vérifier que vous utilisez `/3p1/dist/index.html` et non `/3p1/index.html`
- Vérifier que les fichiers sont bien commités et pushés sur GitHub
- Vérifier que Vercel a bien déployé les fichiers

### Erreurs CORS

- Les APIs doivent être accessibles depuis le même domaine
- Vérifier que les variables d'environnement Vercel sont configurées

## 🚀 Déploiement

L'application est automatiquement déployée sur Vercel à chaque push sur `main`.

Pour forcer un redéploiement :
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 📝 Structure des Fichiers

```
public/3p1/
├── index.html          # Point d'entrée (redirige vers dist/)
├── dist/              # Version compilée (production)
│   ├── index.html     # ✅ URL à utiliser
│   └── assets/
│       ├── index.js   # Code compilé
│       └── index.css # Styles compilés
└── ...                # Code source (TypeScript/React)
```

## ✅ Checklist de Vérification

- [ ] Application compilée (`npm run build` dans `public/3p1/`)
- [ ] Fichiers `dist/` présents et à jour
- [ ] Fichiers commités et pushés sur GitHub
- [ ] Vercel déploiement réussi (vérifier dans dashboard Vercel)
- [ ] URL testée dans le navigateur
- [ ] Console du navigateur vérifiée (pas d'erreurs)
- [ ] APIs accessibles (vérifier Network tab)











