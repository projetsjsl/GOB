# Terminal Emma IA - Résolution des erreurs

## Erreur 1: Incompatibilité de types watchlists

### Problème
```
ERROR: 42804: foreign key constraint "watchlist_instruments_watchlist_id_fkey" cannot be implemented 
DETAIL: Key columns "watchlist_id" and "id" are of incompatible types: uuid and bigint.
```

### Cause
La table `watchlists` existe déjà dans votre base de données avec un `id` de type `bigint` (ou `integer`), mais le nouveau schéma essaie de créer une référence avec `uuid`.

### Solution

**Option 1: Utiliser le schéma adapté (RECOMMANDÉ)**

Exécutez le fichier `supabase-terminal-emma-ia-schema-ADAPTED.sql` qui :
- Détecte automatiquement le type existant de `watchlists.id`
- Détecte et utilise la table `tickers` existante (migre vers `instruments`)
- Détecte la table `team_tickers` si elle existe
- Crée `watchlist_instruments` avec le type compatible
- Évite les conflits avec les tables existantes

**Option 2: Utiliser le schéma corrigé**

Exécutez le fichier `supabase-terminal-emma-ia-schema-FIXED.sql` qui :
- Détecte automatiquement le type existant de `watchlists.id`
- Crée `watchlist_instruments` avec le type compatible
- Évite les conflits avec les tables existantes

```sql
-- Dans Supabase SQL Editor
-- Exécutez: supabase-terminal-emma-ia-schema-FIXED.sql
```

**Option 2: Vérifier manuellement le type**

```sql
-- Vérifier le type de watchlists.id
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlists' 
  AND column_name = 'id';
```

Si c'est `bigint` ou `integer`, le schéma corrigé s'adaptera automatiquement.

## Erreur 2: Table kpi_definitions n'existe pas

### Problème
```
ERROR: 42P01: relation "kpi_definitions" does not exist
```

### Cause
Le script d'initialisation des KPI (`supabase-terminal-emma-ia-kpi-init.sql`) a été exécuté avant le schéma de base.

### Solution

**Ordre d'exécution correct :**

1. **D'abord** : Exécutez le schéma
   ```sql
   -- Exécutez: supabase-terminal-emma-ia-schema-FIXED.sql
   ```

2. **Ensuite** : Exécutez l'initialisation des KPI
   ```sql
   -- Exécutez: supabase-terminal-emma-ia-kpi-init.sql
   ```

### Vérification

Vérifiez que les tables existent :

```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'instruments',
    'fmp_raw_cache',
    'metrics',
    'kpi_definitions',
    'kpi_variables',
    'kpi_values',
    'watchlist_instruments',
    'job_logs',
    'market_indices',
    'price_history'
  )
ORDER BY table_name;
```

## Procédure complète de migration

### Étape 1: Sauvegarde (optionnel mais recommandé)

```sql
-- Exporter les données existantes si nécessaire
```

### Étape 2: Exécuter le schéma adapté

Dans Supabase SQL Editor :

1. Ouvrez `supabase-terminal-emma-ia-schema-ADAPTED.sql` (RECOMMANDÉ)
   - OU `supabase-terminal-emma-ia-schema-FIXED.sql` si vous n'avez pas de table `tickers`
2. Copiez tout le contenu
3. Collez dans SQL Editor
4. Exécutez

Le script va :
- ✅ Détecter la table `tickers` existante et migrer vers `instruments`
- ✅ Détecter la table `team_tickers` si elle existe
- ✅ Détecter et s'adapter aux tables existantes (watchlists)
- ✅ Créer les nouvelles tables nécessaires
- ✅ Créer les index
- ✅ Configurer RLS
- ✅ Créer les triggers

### Étape 3: Vérifier les tables créées

```sql
-- Vérifier que watchlist_instruments a le bon type
SELECT 
    c.column_name,
    c.data_type,
    c.udt_name
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE t.table_schema = 'public' 
  AND c.table_name = 'watchlist_instruments'
  AND c.column_name = 'watchlist_id';
```

Le type doit correspondre à celui de `watchlists.id`.

### Étape 4: Initialiser les KPI

```sql
-- Exécutez: supabase-terminal-emma-ia-kpi-init.sql
```

### Étape 5: Vérifier les KPI créés

```sql
-- Vérifier les KPI créés
SELECT 
    code,
    name,
    category,
    is_active
FROM kpi_definitions
ORDER BY category, code;

-- Vérifier les variables associées
SELECT 
    kd.code,
    kd.name,
    COUNT(kv.id) as variable_count
FROM kpi_definitions kd
LEFT JOIN kpi_variables kv ON kd.id = kv.kpi_id
GROUP BY kd.id, kd.code, kd.name
ORDER BY kd.category, kd.code;
```

## Dépannage supplémentaire

### Si watchlists n'existe pas du tout

Le schéma corrigé créera automatiquement `watchlists` avec `UUID`. C'est le comportement par défaut.

### Si vous voulez forcer un type spécifique

Modifiez le bloc `DO $$` dans `supabase-terminal-emma-ia-schema-FIXED.sql` :

```sql
-- Pour forcer UUID (même si bigint existe)
-- Supprimez la table existante (ATTENTION: perte de données)
DROP TABLE IF EXISTS watchlists CASCADE;

-- Puis exécutez le schéma qui créera avec UUID
```

### Si les politiques RLS échouent

Le schéma corrigé utilise `DROP POLICY IF EXISTS` pour éviter les erreurs. Si vous avez encore des problèmes :

```sql
-- Lister les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('watchlists', 'watchlist_instruments');

-- Supprimer manuellement si nécessaire
DROP POLICY IF EXISTS "nom_de_la_politique" ON nom_table;
```

## Vérification finale

Exécutez ce script pour vérifier que tout est correct :

```sql
-- Vérification complète
DO $$
DECLARE
    table_count INTEGER;
    kpi_count INTEGER;
    watchlist_type TEXT;
    watchlist_instruments_type TEXT;
BEGIN
    -- Compter les tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'instruments', 'fmp_raw_cache', 'metrics', 
        'kpi_definitions', 'kpi_variables', 'kpi_values',
        'watchlists', 'watchlist_instruments',
        'job_logs', 'market_indices', 'price_history'
      );
    
    -- Compter les KPI
    SELECT COUNT(*) INTO kpi_count
    FROM kpi_definitions
    WHERE is_active = true;
    
    -- Vérifier les types
    SELECT data_type INTO watchlist_type
    FROM information_schema.columns
    WHERE table_name = 'watchlists' AND column_name = 'id';
    
    SELECT data_type INTO watchlist_instruments_type
    FROM information_schema.columns
    WHERE table_name = 'watchlist_instruments' AND column_name = 'watchlist_id';
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 VÉRIFICATION TERMINAL EMMA IA';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '   Tables créées: %/11', table_count;
    RAISE NOTICE '   KPI actifs: %', kpi_count;
    RAISE NOTICE '   Type watchlists.id: %', watchlist_type;
    RAISE NOTICE '   Type watchlist_instruments.watchlist_id: %', watchlist_instruments_type;
    
    IF watchlist_type = watchlist_instruments_type THEN
        RAISE NOTICE '   ✅ Types compatibles';
    ELSE
        RAISE WARNING '   ⚠️ Types incompatibles!';
    END IF;
    
    IF table_count = 11 AND kpi_count >= 4 THEN
        RAISE NOTICE '   ✅ Installation réussie!';
    ELSE
        RAISE WARNING '   ⚠️ Installation incomplète';
    END IF;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
```

## Support

Si vous rencontrez toujours des problèmes :

1. Vérifiez les logs dans Supabase Dashboard → Logs
2. Consultez `docs/TERMINAL_EMMA_IA_SETUP.md` pour le guide complet
3. Vérifiez que toutes les variables d'environnement sont configurées dans Vercel

