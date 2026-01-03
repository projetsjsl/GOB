# 🎯 Configuration Vercel ↔ Supabase - Guide Master

## ✅ Scripts Créés et Prêts

J'ai créé 3 scripts automatiques dans `scripts/` :

1. **`setup-vercel-env.sh`** - Configuration basique via CLI
2. **`auto-setup-vercel-supabase.sh`** - Configuration semi-automatique
3. **`master-vercel-setup.sh`** - Configuration MASTER (API ou CLI)

---

## 🚀 OPTION 1 : Configuration Automatique (Recommandé)

### Méthode A : Via VERCEL_TOKEN (100% automatique)

**1. Récupérez votre Vercel Token**
```bash
# Allez sur: https://vercel.com/account/tokens
# Créez un nouveau token → Copiez-le
```

**2. Exportez le token + vos clés Supabase**
```bash
export VERCEL_TOKEN="votre_token_vercel_ici"
export SUPABASE_ANON_KEY="eyJhbGc..."  # Depuis Supabase Dashboard
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."  # Depuis Supabase Dashboard
```

**3. Lancez le script master**
```bash
./scripts/master-vercel-setup.sh
```

✅ Tout est configuré automatiquement via l'API Vercel !

---

### Méthode B : Via Vercel CLI (semi-automatique)

**1. Authentifiez Vercel CLI**
```bash
npx vercel login
# → Suivez les instructions (email ou GitHub)
```

**2. Liez le projet**
```bash
npx vercel link
# → Sélectionnez votre projet GOB
```

**3. Lancez le script**
```bash
./scripts/master-vercel-setup.sh
```

Le script vous demandera vos clés Supabase interactivement.

---

## 🎯 OPTION 2 : Configuration Manuelle (5 min)

**1. Allez sur Vercel Dashboard**
```
https://vercel.com/dashboard
→ Projet GOB
→ Settings
→ Environment Variables
```

**2. Ajoutez ces variables**

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gob-watchlist.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [Votre clé depuis Supabase] | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | [Votre clé secrète] | Production only |
| `SUPABASE_URL` | `https://gob-watchlist.supabase.co` | Production, Preview, Development |
| `SUPABASE_KEY` | [Même que SERVICE_ROLE_KEY] | Production only |

**3. Récupérez vos clés Supabase**
```
https://app.supabase.com
→ Projet: gob-watchlist
→ Settings → API
→ Copiez "anon public" et "service_role"
```

**4. Save & Redeploy**

Vercel redéploie automatiquement après sauvegarde.

---

## 📋 Variables Configurées

Une fois terminé, vous aurez :

### Variables Publiques (accessibles côté client)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - URL de votre base Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé publique Supabase

### Variables Privées (serveur seulement)
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` - Clé secrète Supabase (production)
- 🔒 `SUPABASE_KEY` - Alias pour compatibilité (production)
- 🔒 `SUPABASE_URL` - URL backend (tous environnements)

---

## ✅ Vérification

**1. Vérifiez dans Vercel Dashboard**
```
https://vercel.com/dashboard
→ GOB → Settings → Environment Variables
→ Devrait afficher 5 variables configurées
```

**2. Vérifiez via CLI**
```bash
npx vercel env ls
```

**3. Testez la connexion**
```bash
# Dans votre Preview Vercel, ouvrez la console:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Devrait afficher: https://gob-watchlist.supabase.co
```

---

## 🎨 Utilisation avec v0

Une fois configuré, v0 utilisera automatiquement ces variables :

```tsx
// v0 générera du code comme ça:
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Fonctionne automatiquement !
const { data } = await supabase.from('watchlist').select('*')
```

---

## 🔧 Troubleshooting

### "Project not found"
```bash
npx vercel link
# Sélectionnez votre projet GOB
```

### "Authentication required"
```bash
npx vercel login
# Connectez-vous avec GitHub ou email
```

### "Variable already exists"
C'est normal ! Ça signifie que la variable est déjà configurée.

---

## 📝 Résumé

**Le plus simple** :
→ Option 2 (Manuel) - 5 minutes via Dashboard

**Le plus rapide** :
→ Option 1A (VERCEL_TOKEN) - 2 minutes avec token

**Le plus flexible** :
→ Option 1B (CLI) - 3 minutes avec authentification

---

**Status** : ✅ Scripts prêts et committés sur `claude/tailwind-poc-eZBGE`

Choisissez la méthode qui vous convient le mieux ! 🚀
