# Commande /start - Guide de Développement GOB

## Aperçu

La commande `/start` initialise automatiquement l'environnement de développement avec **toutes les vérifications**, même après plusieurs jours d'absence. Elle génère également un **fichier contexte JSON** pour l'Agent LLM.

## Usage

```bash
npm start                      # Mode complet (recommandé après absence)
npm start -- --fast            # Mode rapide (continuer une session)
npm start -- --verbose         # Afficher tous les détails
npm start -- --lint            # Inclure TypeScript + ESLint
npm start -- --clean           # Forcer nettoyage cache
npm start -- --check-services  # Vérifier services externes
npm start -- --no-browser      # Ne pas ouvrir le navigateur
```

### Combinaisons recommandées

```bash
# Reprise après plusieurs jours
npm start -- --verbose

# Continuer une session existante
npm start -- --fast --no-browser

# Debug complet avant PR
npm start -- --verbose --lint --check-services

# Problèmes bizarres après mise à jour
npm start -- --clean --verbose
```

## Ce que fait /start (Mode complet)

### 0. 🖥️ Cursor IDE
- **Version actuelle** : Affiche la version de Cursor installée
- **Rappel mise à jour** : Suggère de vérifier les mises à jour
- **Rappel quotas** : Lien vers la gestion des quotas LLM

### 1. 💻 Vérifications système
- **Espace disque** : Alerte si < 500MB libre
- **Cache Vite** : Nettoie automatiquement si > 7 jours

### 2. 📥 Git Pull sécurisé
- **Stash automatique** des changements locaux avant pull
- **Détection des conflits** : annule le merge et avertit
- **Restauration du stash** après le pull
- Affiche le **retard sur main**

### 3. 🔍 Vérifications environnement
| Check | Description |
|-------|-------------|
| Node.js | Version ≥18 (recommandé: 20+) |
| npm | Version disponible |
| Git | Version disponible |
| Fichiers critiques | package.json, vite.config.ts, index.html |

### 4. 📦 Dépendances intelligentes
Détecte automatiquement si `npm install` est nécessaire :
- `node_modules` manquant
- `package-lock.json` modifié depuis le dernier install
- Dépendance critique manquante

### 5. 🔐 Variables d'environnement
Vérifie la présence et les sources des variables :

**Sources de configuration :**
| Source | Usage | Accès |
|--------|-------|-------|
| `.env.local` | Développement local | Fichier local |
| **Vercel** | Production | [Vercel Dashboard](https://vercel.com) → Settings → Environment Variables |
| **Supabase** | Database | [Supabase Dashboard](https://supabase.com) → Settings → API |

**Variables vérifiées :**
| Variable | Usage | Critique | Où la trouver |
|----------|-------|----------|---------------|
| `SUPABASE_URL` | Database URL | ✅ Oui | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | Database public key | ✅ Oui | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Database admin key | Non | Supabase Dashboard |
| `FASTGRAPHS_EMAIL` | FastGraph login | Non | Vercel |
| `FASTGRAPHS_PASSWORD` | FastGraph login | Non | Vercel |
| `BROWSERBASE_API_KEY` | Browser automation | Non | Browserbase Dashboard |
| `OPENAI_API_KEY` | OpenAI/GPT | Non | OpenAI Dashboard |
| `GEMINI_API_KEY` | Google Gemini | Non | Google AI Studio |
| `PERPLEXITY_API_KEY` | Perplexity AI | Non | Perplexity Dashboard |

### 6. 🔍 TypeScript & Lint (avec --lint)
- `tsc --noEmit` pour les erreurs TypeScript
- `npm run lint` pour ESLint

### 7. 🌐 Services externes (avec --check-services)
- Ping GitHub API
- Ping Supabase

### 8. 📊 État du projet
- Branche actuelle
- Dernier commit sur main
- Commits de retard sur main
- Fichiers modifiés localement
- Branches actives depuis le dernier main

### 9. 🖥️ Serveur de développement
- **Kill robuste** (port + PID + pkill)
- **Attente port libre** (5 tentatives)
- **Vérification accessible** avant de terminer

### 10. 📋 Contexte LLM
- Génère `.start-context.json` avec toutes les infos
- Affiche un résumé structuré pour l'Agent
- Propose des suggestions basées sur l'état

## Fichier de contexte LLM

Le fichier `.start-context.json` contient :

```json
{
  "timestamp": "2026-01-05T15:48:35.715Z",
  "status": "ready",
  "cursor": {
    "version": "2.3.15",
    "updateCheck": "Cmd+Shift+P → \"Cursor: Check for Updates\""
  },
  "environment": {
    "node": "v20.19.5",
    "npm": "10.8.2",
    "git": "2.39.5",
    "variables": { "ok": true, "missing": [...], "present": [...] }
  },
  "git": {
    "branch": "main",
    "uncommitted": [...],
    "lastCommit": { "hash": "abc1234", "message": "...", "date": "..." },
    "activeBranches": [...],
    "behindMain": 0
  },
  "dependencies": { "needsInstall": false },
  "integrations": { "FastGraph": true, "Ground News": true, "Tailwind CSS": true },
  "server": { "url": "...", "pid": 12345, "ready": true },
  "issues": { "critical": [], "warnings": [], "info": [] },
  "suggestions": [...]
}
```

L'Agent peut lire ce fichier pour comprendre instantanément l'état du projet.

### Stack technique détectée

Le contexte inclut maintenant la stack complète avec versions et notes :

```json
{
  "stack": {
    "frontend": [
      { "name": "React", "version": "19.x", "note": "Hooks, functional components" },
      { "name": "TypeScript", "version": "5.x", "note": "Strict typing preferred" },
      { "name": "Tailwind CSS", "version": "3.x", "note": "Utility-first, NO inline styles" },
      { "name": "Babel Inline", "note": "Pour dashboard legacy - window.ComponentName requis" }
    ],
    "backend": [
      { "name": "Vercel Serverless", "note": "API routes dans /api" }
    ],
    "database": [
      { "name": "Supabase", "note": "PostgreSQL + Auth + Realtime" }
    ],
    "apis": [
      { "name": "Google Gemini", "sdk": "@google/generative-ai", "note": "PAS @google/genai" },
      { "name": "Anthropic", "sdk": "@anthropic-ai/sdk", "note": "Claude" }
    ],
    "conventions": [
      "Variables dans useState: définir AVANT utilisation",
      "Components Babel: exposer via window.ComponentName",
      "Dropdowns: position fixed + z-index 9999+",
      "Pas de import.meta.env dans Babel inline",
      "Références: typeof check avant utilisation",
      "CSS: variables de thème, pas de couleurs hardcodées"
    ]
  }
}
```

### Conventions critiques pour le code

| Règle | Explication |
|-------|-------------|
| **useState initializers** | Définir toutes les variables AVANT de les utiliser dans useState |
| **Babel components** | Exposer via `window.ComponentName = ComponentName` |
| **Dropdowns** | `position: fixed` + `z-index: 9999+` pour éviter les problèmes de overflow |
| **import.meta.env** | Ne PAS utiliser dans Babel inline → utiliser fallback multi-méthodes |
| **Références** | Toujours vérifier avec `typeof variable !== 'undefined'` |
| **CSS** | Utiliser les variables de thème, jamais de couleurs hardcodées |
| **Gemini SDK** | Utiliser `@google/generative-ai` (PAS `@google/genai`) |

## Scénarios de reprise

### Après avoir quitté Cursor
```bash
npm start
```
✅ Nettoie les fichiers obsolètes
✅ Tue l'ancien serveur zombie
✅ Vérifie le port libre
✅ Démarre un nouveau serveur

### Après une erreur/crash
```bash
npm start -- --clean
```
✅ Nettoie cache Vite
✅ Force nettoyage fichiers temporaires
✅ Tue tous les processus zombies

### Après plusieurs jours d'absence
```bash
npm start -- --verbose
```
✅ Pull les dernières modifications
✅ Stash vos changements locaux
✅ Réinstalle npm si package-lock.json a changé
✅ Affiche les branches actives
✅ Génère le contexte LLM

### Après avoir développé manuellement
```bash
npm start -- --fast
```
✅ Skip le git pull
✅ Préserve vos changements
✅ Vérifie que tout est OK
✅ Démarre le serveur rapidement

### Avant de créer une PR
```bash
npm start -- --verbose --lint --check-services
```
✅ Vérifie TypeScript
✅ Vérifie ESLint
✅ Vérifie services externes
✅ Rapport complet

## Gestion des problèmes

### Conflits Git détectés
```bash
git status                    # Voir les fichiers en conflit
git checkout --theirs <file>  # Garder version distante
git add . && git commit
```

### Port occupé
```bash
kill $(lsof -ti:5173)
npm start
```

### Cache corrompu
```bash
npm start -- --clean
# ou manuellement:
rm -rf node_modules/.vite
npm start
```

### npm install échoue
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm start
```

## Code de sortie

| Code | Signification |
|------|---------------|
| 0 | ✅ Succès - prêt à travailler |
| 1 | ❌ Problèmes critiques détectés |

## Fichiers générés

| Fichier | Description |
|---------|-------------|
| `.vite.pid` | PID du serveur Vite |
| `vite-dev-server.log` | Logs du serveur |
| `.start-context.json` | Contexte pour l'Agent LLM |

## Pour l'Agent LLM

Après `/start`, l'agent dispose de :

1. **Fichier contexte** : `.start-context.json` avec toutes les infos structurées
2. **Status clair** : `ready`, `warning`, ou `error`
3. **Suggestions** : Actions recommandées basées sur l'état
4. **Serveur accessible** : http://localhost:5173

### Lecture du contexte par l'Agent

```javascript
// L'agent peut lire le contexte ainsi:
const context = JSON.parse(fs.readFileSync('.start-context.json', 'utf-8'));

if (context.status === 'ready') {
    // Prêt à coder
}

if (context.git.activeBranches.length > 0) {
    // Examiner les branches en cours
}

if (context.issues.critical.length > 0) {
    // Résoudre d'abord les problèmes critiques
}
```

La commande **ne bloque jamais** et retourne toujours le contrôle à l'agent avec un **code de sortie approprié**.
