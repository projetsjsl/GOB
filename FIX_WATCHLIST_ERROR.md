# 🔧 RÉSOLUTION ERREUR "column ticker does not exist"

## ❌ Problème identifié

**Erreur :** `ERROR: 42703: column "ticker" does not exist`

**Cause :** La table `watchlist` n'existe pas ou n'a pas la bonne structure.

## 🔧 Solutions

### Solution 1: Créer la table watchlist de base

1. **Ouvrir Supabase :**
   - Allez sur https://app.supabase.com
   - Sélectionnez le projet "gob-watchlist"
   - SQL Editor > New query

2. **Exécuter le script de base :**
   - Copiez le contenu de `supabase-watchlist-base.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" ▶️

3. **Vérifier la création :**
   ```sql
   SELECT * FROM watchlist LIMIT 5;
   ```

### Solution 2: Vérifier la structure existante

Si la table existe déjà, vérifiez sa structure :

```sql
-- Vérifier les colonnes de la table watchlist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlist' 
AND table_schema = 'public';
```

### Solution 3: Recréer la table

Si la structure est incorrecte :

```sql
-- Supprimer la table existante
DROP TABLE IF EXISTS watchlist CASCADE;

-- Recréer avec la bonne structure
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL UNIQUE,
    company_name TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    target_price DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🧪 Test après correction

Une fois la table créée, testez :

```bash
node test-watchlist-table.js
```

## 📋 Structure attendue

La table `watchlist` doit avoir ces colonnes :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `ticker` | TEXT | Symbole boursier (ex: AAPL) |
| `company_name` | TEXT | Nom de l'entreprise |
| `added_at` | TIMESTAMP | Date d'ajout |
| `notes` | TEXT | Notes utilisateur |
| `target_price` | DECIMAL | Prix cible |
| `stop_loss` | DECIMAL | Stop loss |

## 🚀 Prochaines étapes

1. ✅ Créer la table watchlist
2. ✅ Tester la connexion
3. ✅ Exécuter SUPABASE_SETUP_FINAL.sql
4. ✅ Configurer les agents Emma

## 🆘 Dépannage

### Erreur de permissions
```sql
-- Vérifier les permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'watchlist';
```

### Erreur de connexion
- Vérifiez les clés Supabase
- Vérifiez l'URL du projet
- Testez avec `node test-supabase-real.js`

---

**Une fois la table watchlist créée, le système Emma AI sera opérationnel !** 🎯
