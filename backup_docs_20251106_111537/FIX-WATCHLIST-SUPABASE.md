# 🔧 Résolution du Problème Watchlist Supabase

## 🚨 Problème Identifié

La watchlist est vide à l'ouverture car :
1. ✅ Les variables d'environnement Supabase sont configurées
2. ❌ La table `watchlists` n'existe pas dans Supabase
3. ❌ L'API retourne "TypeError: fetch failed"

## 🛠️ Solution Étape par Étape

### Étape 1: Créer la Table dans Supabase

1. **Connectez-vous à votre projet Supabase** : https://supabase.com/dashboard
2. **Allez dans l'éditeur SQL** : SQL Editor (icône `</>`)
3. **Exécutez le script SQL** suivant :

```sql
-- Création de la table watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  tickers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- Fonction pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_watchlists_updated_at ON watchlists;
CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Données de test
INSERT INTO watchlists (user_id, tickers) 
VALUES ('default', '["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]')
ON CONFLICT (user_id) 
DO UPDATE SET 
  tickers = EXCLUDED.tickers,
  updated_at = NOW();

-- Politiques RLS
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON watchlists
  FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all users" ON watchlists
  FOR ALL USING (true);
```

### Étape 2: Vérifier la Création

Après avoir exécuté le SQL, vérifiez que la table existe :

```sql
SELECT * FROM watchlists;
```

Vous devriez voir une ligne avec `user_id = 'default'` et des tickers.

### Étape 3: Tester l'API

Une fois la table créée, testez l'API :

```bash
node test-supabase-watchlist.js
```

### Étape 4: Vérifier le Dashboard

1. **Ouvrez le dashboard** : https://gobapps.com/beta-combined-dashboard.html
2. **Allez dans l'onglet "⭐ Dan's Watchlist"**
3. **La watchlist devrait maintenant se charger automatiquement**

## 🔍 Diagnostic Avancé

Si le problème persiste après avoir créé la table :

### Vérifier les Logs Supabase

1. Allez dans **Logs** dans votre dashboard Supabase
2. Regardez les logs d'erreur pour voir les requêtes qui échouent

### Vérifier les Politiques RLS

Assurez-vous que les politiques RLS permettent l'accès :

```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'watchlists';

-- Tester l'accès
SELECT * FROM watchlists WHERE user_id = 'default';
```

### Tester la Connexion Directe

Créez un script de test simple :

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'VOTRE_SUPABASE_URL',
  'VOTRE_SUPABASE_ANON_KEY'
);

const { data, error } = await supabase
  .from('watchlists')
  .select('*')
  .eq('user_id', 'default');

console.log('Data:', data);
console.log('Error:', error);
```

## 📊 Structure de la Table

La table `watchlists` a cette structure :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | SERIAL | Clé primaire auto-incrémentée |
| `user_id` | TEXT | Identifiant utilisateur (défaut: 'default') |
| `tickers` | JSONB | Array des symboles de tickers |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière modification |

## 🎯 Résultat Attendu

Après avoir créé la table :

1. ✅ L'API `/api/supabase-watchlist` retourne les tickers
2. ✅ Le dashboard charge automatiquement la watchlist
3. ✅ Les ajouts/suppressions fonctionnent
4. ✅ Les données sont persistées dans Supabase

## 🚀 Test Final

Une fois tout configuré, testez :

```bash
# Test de l'API
curl https://gobapps.com/api/supabase-watchlist

# Devrait retourner :
{
  "success": true,
  "tickers": ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"],
  "count": 5,
  "source": "supabase"
}
```

---

**Note** : Le fichier `supabase-watchlist-table.sql` contient le script complet à exécuter dans Supabase.
