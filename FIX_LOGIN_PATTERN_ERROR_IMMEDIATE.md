# FIX IMMÉDIAT: Erreur "The string did not match the expected pattern" au Login

## Problème

Vous obtenez l'erreur suivante lors de la connexion:
```
The string did not match the expected pattern
```

## Diagnostic Rapide

1. **Testez d'abord le diagnostic automatique:**
   - Allez sur: `https://votre-app.vercel.app/api/auth-diagnostic`
   - Ce diagnostic vous dira exactement quel est le problème

2. **Causes possibles:**
   - ✅ Les politiques RLS (Row Level Security) ne sont pas configurées dans Supabase
   - ✅ La table `users` n'existe pas dans Supabase
   - ✅ Les variables d'environnement Vercel ne sont pas configurées correctement

## Solution 1: Appliquer les Politiques RLS (Le plus probable)

### Étape 1: Accéder à Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet GOB
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2: Exécuter le Script de Migration

Copiez et collez ce script dans le SQL Editor et cliquez sur **Run**:

```sql
-- ============================================================
-- MIGRATION: Fix RLS Policies for Users Table
-- ============================================================

-- Add missing INSERT policy for users table
CREATE POLICY IF NOT EXISTS "Service role can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Add missing UPDATE policy for users table
CREATE POLICY IF NOT EXISTS "Service role can update users"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

### Étape 3: Vérifier que les Politiques Sont Créées

Le résultat de la requête devrait afficher 3 politiques:
- ✅ `Service role can insert users` (INSERT)
- ✅ `Service role can update users` (UPDATE)
- ✅ `Users can view themselves` (SELECT)

### Étape 4: Tester à Nouveau

Retournez sur `/login.html` et essayez de vous connecter avec `admin` / `admin`.

---

## Solution 2: Créer la Table Users (Si elle n'existe pas)

Si le diagnostic indique que la table `users` n'existe pas:

### Dans Supabase SQL Editor, exécutez:

```sql
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('invite', 'client', 'daniel', 'gob', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view themselves"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update users"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Données initiales
INSERT INTO users (username, display_name, role)
VALUES
  ('invite', 'Invité', 'invite'),
  ('client', 'Client', 'client'),
  ('daniel', 'Daniel', 'daniel'),
  ('gob', 'GOB', 'gob'),
  ('admin', 'Admin', 'admin')
ON CONFLICT (username) DO NOTHING;
```

---

## Solution 3: Vérifier les Variables d'Environnement Vercel

### Sur Vercel Dashboard:

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet GOB
3. Cliquez sur **Settings** → **Environment Variables**
4. Vérifiez que ces variables existent:

```
SUPABASE_URL = https://boyuxgdplbpkknplxbxp.supabase.co
SUPABASE_KEY = [Votre Service Role Key, pas Anon Key!]
```

**IMPORTANT:** Vous devez utiliser la **Service Role Key**, PAS la **Anon Public Key**!

### Pour obtenir votre Service Role Key:

1. Dans Supabase Dashboard, allez dans **Settings** → **API**
2. Copiez la clé sous "**service_role** (secret)"
3. Collez-la dans la variable `SUPABASE_KEY` sur Vercel

### Après modification des variables:

1. Cliquez sur **Redeploy** dans Vercel
2. Attendez que le déploiement se termine
3. Testez à nouveau le login

---

## Vérification Finale

Après avoir appliqué l'une de ces solutions:

1. **Testez le diagnostic:**
   ```
   https://votre-app.vercel.app/api/auth-diagnostic
   ```

2. **Vérifiez que tous les tests passent** (status: PASS)

3. **Testez le login:**
   - Allez sur `/login.html`
   - Connectez-vous avec `admin` / `admin`
   - Vous devriez être redirigé vers le dashboard

---

## Si le Problème Persiste

1. **Vérifiez les logs Vercel:**
   - Allez dans Vercel Dashboard → Deployments → Latest → Functions
   - Cherchez les logs de la fonction `/api/auth`
   - Les nouveaux logs détaillés vous diront exactement quelle est l'erreur

2. **Contactez le support:**
   - Envoyez le résultat de `/api/auth-diagnostic`
   - Envoyez les logs de Vercel montrant l'erreur détaillée

---

## Fichiers de Référence

- **Migration RLS:** `supabase-auth-migration.sql`
- **Schema Complet:** `supabase-auth-setup.sql`
- **Documentation Détaillée:** `FIX_LOGIN_ERROR.md`
