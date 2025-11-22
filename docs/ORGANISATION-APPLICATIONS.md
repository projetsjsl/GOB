# 📁 Organisation des Applications - Guide de Bonnes Pratiques

## 🎯 Recommandations pour les Applications Intégrées

### Option 1 : Dossier `apps/` à la racine (RECOMMANDÉ) ⭐

```
GOB/
├── apps/
│   └── finance-pro/          # Application 3p1 renommée
│       ├── src/
│       ├── package.json
│       ├── vite.config.ts
│       └── dist/              # Build output
├── public/
│   └── finance-pro/          # Copie du dist après build
├── build.js                   # Script qui build apps/ et copie dans public/
└── package.json
```

**Avantages :**
- ✅ Séparation claire entre applications et fichiers statiques
- ✅ Chaque app a son propre `package.json` et dépendances
- ✅ Build isolé, pas de conflits
- ✅ Facile à ajouter d'autres apps (`apps/stock-screener/`, `apps/portfolio-manager/`, etc.)

**Configuration Vite :**
```typescript
// apps/finance-pro/vite.config.ts
export default defineConfig({
  base: '/finance-pro/',
  build: {
    outDir: '../public/finance-pro',  // Build directement dans public/
    // ...
  }
});
```

**Script de build :**
```javascript
// build.js
const APP_DIR = 'apps/finance-pro';
const PUBLIC_TARGET = 'public/finance-pro';

// Build l'app
execSync('npm run build', { cwd: APP_DIR });

// Pas besoin de copier, le build va directement dans public/
```

---

### Option 2 : Dossier `src/apps/` (Alternative)

```
GOB/
├── src/
│   ├── apps/
│   │   └── finance-pro/
│   │       ├── components/
│   │       ├── App.tsx
│   │       └── index.tsx
│   └── main.tsx
├── public/
│   └── finance-pro/          # Build output
└── vite.config.ts             # Config unique pour toutes les apps
```

**Avantages :**
- ✅ Tout le code source dans `src/`
- ✅ Partage de dépendances avec le projet principal
- ✅ Build unifié

**Inconvénients :**
- ❌ Moins flexible si les apps ont des dépendances différentes
- ❌ Plus complexe à gérer les builds séparés

---

### Option 3 : Build direct dans `public/` (Simple mais moins propre)

```
GOB/
├── apps/
│   └── finance-pro/          # Source code
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
└── public/
    └── finance-pro/          # Build directement ici (pas de sous-dossier dist/)
        ├── index.html
        └── assets/
            └── index.js
```

**Configuration Vite :**
```typescript
// apps/finance-pro/vite.config.ts
export default defineConfig({
  base: '/finance-pro/',
  build: {
    outDir: '../../public/finance-pro',  // Build directement dans public/
    // ...
  }
});
```

**Avantages :**
- ✅ Pas de copie nécessaire après build
- ✅ Chemin simple : `/finance-pro/assets/index.js`
- ✅ Structure claire

---

## 🚀 Recommandation Finale

**Utiliser l'Option 1 avec modification :**

1. **Créer `apps/finance-pro/`** à la racine
2. **Configurer Vite pour build directement dans `public/finance-pro/`**
3. **Modifier le script de build** pour construire depuis `apps/`
4. **Mettre à jour le chemin dans le dashboard** : `/finance-pro/assets/index.js`

### Structure Recommandée :

```
GOB/
├── apps/
│   └── finance-pro/              # Source de l'application
│       ├── src/
│       ├── components/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── public/
│   └── finance-pro/              # Build output (créé par Vite)
│       ├── index.html
│       └── assets/
│           └── index.js
├── build.js                       # Build toutes les apps
└── package.json
```

### Avantages de cette approche :

1. ✅ **Séparation claire** : Code source dans `apps/`, fichiers servis dans `public/`
2. ✅ **Pas de duplication** : Pas de structure `dist/apps/finance-pro/dist/`
3. ✅ **Chemin simple** : `/finance-pro/assets/index.js` au lieu de `/3p1/dist/assets/index.js`
4. ✅ **Scalable** : Facile d'ajouter d'autres apps (`apps/portfolio-manager/`, etc.)
5. ✅ **Build optimisé** : Vite build directement au bon endroit

---

## 📝 Migration depuis `public/3p1/`

Si vous voulez migrer l'application actuelle :

```bash
# 1. Créer le nouveau dossier
mkdir -p apps/finance-pro

# 2. Déplacer le contenu (sauf dist/)
mv public/3p1/* apps/finance-pro/
rm -rf public/3p1

# 3. Modifier vite.config.ts
# Changer outDir vers '../../public/finance-pro'

# 4. Modifier build.js
# Changer APP_3P1_DIR vers 'apps/finance-pro'

# 5. Modifier le chemin dans dashboard
# Changer '/3p1/dist/assets/index.js' vers '/finance-pro/assets/index.js'
```

---

## 🎯 Règles Générales

1. **Applications complètes** → `apps/[nom-app]/`
2. **Fichiers statiques** → `public/[nom]/`
3. **Build output** → Directement dans `public/[nom]/` (pas de sous-dossier `dist/`)
4. **Chemin d'accès** → `/nom-app/assets/index.js` (simple et clair)

