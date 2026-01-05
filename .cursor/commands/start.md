# Commande `/start` - Initialisation environnement de développement

Quand l'utilisateur écrit `/start`, initialiser l'environnement de développement GOB Dashboard.

## Exécution

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB && node scripts/start-dev-setup.js --verbose
```

## Options disponibles

- `/start` → Mode complet (verbose)
- `/start --fast` ou `/sf` → Mode rapide (skip git pull)
- `/start --lint` → Inclure vérification TypeScript + ESLint
- `/start --clean` → Forcer nettoyage du cache
- `/start --check-services` → Vérifier services externes
- `/start --no-browser` → Ne pas ouvrir le navigateur

## Ce que fait /start

1. **🖥️ Cursor IDE** : Vérifie la version, rappelle les mises à jour
2. **💻 Système** : Vérifie espace disque, nettoie cache Vite si > 7 jours
3. **📥 Git** : Pull sécurisé avec stash automatique des changements locaux
4. **🔍 Vérifications** : Node.js, npm, Git, fichiers critiques, dépendances
5. **🛠️ Stack** : Détecte React, TypeScript, Tailwind, Vite, Supabase, APIs
6. **📂 Configuration** : Vérifie .env.local, Vercel, Supabase
7. **📊 État du projet** : Branche, commits, fichiers modifiés, branches actives
8. **🖥️ Serveur** : Tue l'ancien, démarre Vite, vérifie accessibilité
9. **🌐 Navigateur** : Ouvre http://localhost:5173

## Après exécution

Lire et résumer le fichier `.start-context.json` généré qui contient :
- `status` : ready, warning, ou error
- `cursor.version` : Version de Cursor
- `stack` : Technologies détectées avec versions
- `stack.conventions` : Règles de code à respecter
- `environment.sources` : Où trouver les variables d'environnement
- `git` : Branche, commits, fichiers modifiés, branches actives
- `issues` : Problèmes critiques, warnings, infos
- `suggestions` : Actions recommandées

## Sources de configuration

| Source | Usage |
|--------|-------|
| `.env.local` | Développement local |
| **Vercel Dashboard** | Production (variables d'environnement) |
| **Supabase Dashboard** | Database (API keys) |

## Conventions critiques

- Variables dans useState : définir AVANT utilisation
- Components Babel : exposer via `window.ComponentName`
- Dropdowns : `position: fixed` + `z-index: 9999+`
- Pas de `import.meta.env` dans Babel inline
- SDK Gemini : `@google/generative-ai` (PAS `@google/genai`)
- CSS : variables de thème, pas de couleurs hardcodées

## Voir aussi

- `docs/COMMANDE_START.md` - Documentation complète
- `docs/REPERTOIRE_COMPLET_ERREURS.md` - Erreurs à éviter
- `scripts/start-dev-setup.js` - Script source
