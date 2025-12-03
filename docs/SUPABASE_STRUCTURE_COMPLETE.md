# Structure Complète Supabase - Table `tickers`

**Date** : 3 décembre 2025  
**Dernière mise à jour** : Après exécution des scripts ValueLine

---

## 🔗 Accès Supabase

### Dashboard Supabase
1. **URL** : `https://supabase.com/dashboard`
2. **Projet** : Votre projet GOB
3. **SQL Editor** : Menu gauche → SQL Editor

### Variables d'Environnement
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_KEY=eyJhbGc... (anon key)
```

---

## 📊 Structure Complète de la Table `tickers`

### Champs de Base (Existants)

```sql
CREATE TABLE tickers (
    -- Identifiants
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    
    -- Classification
    sector VARCHAR(100),
    industry VARCHAR(100),
    country VARCHAR(100),
    exchange VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    market_cap VARCHAR(50),
    
    -- Gestion
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50) DEFAULT 'manual', -- 'team', 'watchlist', 'manual', 'both'
    priority INTEGER DEFAULT 1,
    user_id TEXT,
    
    -- Trading
    target_price DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    notes TEXT,
    
    -- Métadonnées
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped TIMESTAMP WITH TIME ZONE,
    scraping_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Métriques ValueLine (Ajoutées via `supabase-add-valueline-metrics.sql`)

```sql
-- Financial Strength (Cote de sécurité)
security_rank VARCHAR(10), -- A++, A+, A, B++, B+, B, etc.

-- Earnings Predictability
earnings_predictability VARCHAR(10), -- 0-100

-- Price Growth
price_growth VARCHAR(10), -- A++, A+, A, B++, B+, B, etc.

-- Persistence
persistence VARCHAR(10), -- A++, A+, A, B++, B+, B, etc.

-- Price Stability
price_stability VARCHAR(10), -- 0-100

-- Beta (volatilité relative)
beta DECIMAL(5,2), -- Récupéré via API FMP

-- Date de mise à jour ValueLine
valueline_updated_at TIMESTAMP WITH TIME ZONE
```

---

### Corridor ValueLine (Ajoutées via `supabase-add-valueline-corridor.sql`)

```sql
-- Proj Low Total Return
valueline_proj_low_return DECIMAL(5,2), -- Proj Low TTL Return

-- Proj High Total Return
valueline_proj_high_return DECIMAL(5,2), -- Proj High TTL Return

-- Proj Low Price Gain (Optionnel)
valueline_proj_low_price_gain DECIMAL(5,2), -- Proj Price Low Gain

-- Proj High Price Gain (Optionnel)
valueline_proj_high_price_gain DECIMAL(5,2), -- Proj Price High Gain
```

---

### Safety Score (Ajouté via `supabase-add-safety-score.sql`)

```sql
-- Safety™ Score ValueLine
safety_score VARCHAR(10), -- 1-5
```

---

## 📋 Scripts SQL Disponibles

### Scripts de Structure (Créer Colonnes)

| Script | Description | Champs Ajoutés |
|--------|-------------|----------------|
| `supabase-add-valueline-metrics.sql` | Métriques ValueLine de base | 7 champs (security_rank, earnings_predictability, price_growth, persistence, price_stability, beta, valueline_updated_at) |
| `supabase-add-valueline-corridor.sql` | Corridor ValueLine (Phase 3) | 4 champs (valueline_proj_low_return, valueline_proj_high_return, valueline_proj_low_price_gain, valueline_proj_high_price_gain) |
| `supabase-add-safety-score.sql` | Safety™ Score | 1 champ (safety_score) |

### Scripts de Données (Mise à Jour)

| Script | Description | Source |
|--------|-------------|--------|
| `supabase-update-valueline-data.sql` | Met à jour les métriques ValueLine | Généré depuis `valueline.xlsx` |

---

## 🔍 Requêtes SQL Utiles

### Voir Tous les Tickers avec Métriques ValueLine

```sql
SELECT 
    ticker,
    company_name,
    sector,
    security_rank,
    earnings_predictability,
    price_growth,
    persistence,
    price_stability,
    beta,
    safety_score,
    valueline_proj_low_return,
    valueline_proj_high_return,
    valueline_updated_at
FROM tickers
WHERE valueline_updated_at IS NOT NULL
ORDER BY ticker;
```

### Statistiques ValueLine

```sql
SELECT 
    COUNT(*) as total_tickers,
    COUNT(security_rank) as with_security_rank,
    COUNT(earnings_predictability) as with_earnings_predictability,
    COUNT(price_growth) as with_price_growth,
    COUNT(persistence) as with_persistence,
    COUNT(price_stability) as with_price_stability,
    COUNT(beta) as with_beta,
    COUNT(safety_score) as with_safety_score,
    COUNT(valueline_proj_low_return) as with_corridor
FROM tickers;
```

### Tickers Sans Métriques ValueLine

```sql
SELECT 
    ticker,
    company_name,
    sector
FROM tickers
WHERE valueline_updated_at IS NULL
ORDER BY ticker;
```

---

## 📊 Mapping Complet : Excel → Supabase

### `valueline.xlsx` → Supabase

| Colonne Excel | Champ Supabase | Script SQL |
|---------------|----------------|------------|
| Company Name | `company_name` | Existant |
| Ticker | `ticker` | Existant |
| Financial Strength Rating | `security_rank` | `supabase-add-valueline-metrics.sql` |
| Earnings Predictability | `earnings_predictability` | `supabase-add-valueline-metrics.sql` |
| Price Growth Persistence | `price_growth` + `persistence` | `supabase-add-valueline-metrics.sql` |
| Price Stability | `price_stability` | `supabase-add-valueline-metrics.sql` |
| Exchange | `exchange` | Existant |
| Country | `country` | Existant |
| Safety™ | `safety_score` | `supabase-add-safety-score.sql` |

### `confirmationtest.xlsx` → Supabase

| Colonne Excel | Champ Supabase | Script SQL |
|---------------|----------------|------------|
| Proj Low TTL Return | `valueline_proj_low_return` | `supabase-add-valueline-corridor.sql` |
| Proj High TTL Return | `valueline_proj_high_return` | `supabase-add-valueline-corridor.sql` |
| Proj Price Low Gain | `valueline_proj_low_price_gain` | `supabase-add-valueline-corridor.sql` |
| Proj Price High Gain | `valueline_proj_high_price_gain` | `supabase-add-valueline-corridor.sql` |

---

## ✅ Checklist d'Exécution

### Étape 1 : Structure (Créer Colonnes)

- [ ] Exécuter `supabase-add-valueline-metrics.sql`
- [ ] Exécuter `supabase-add-valueline-corridor.sql`
- [ ] Exécuter `supabase-add-safety-score.sql`

### Étape 2 : Données (Remplir Colonnes)

- [ ] Exécuter `supabase-update-valueline-data.sql` (métriques ValueLine)
- [ ] Créer script pour `safety_score` (depuis valueline.xlsx)
- [ ] Créer script pour corridor (depuis confirmationtest.xlsx)

### Étape 3 : Vérification

- [ ] Exécuter requête de statistiques
- [ ] Vérifier que tous les tickers ont leurs métriques
- [ ] Tester dans l'application 3p1

---

## 🔧 Commandes Utiles Supabase

### Via SQL Editor

```sql
-- Vérifier si une colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickers' 
AND column_name = 'security_rank';

-- Compter les tickers avec métriques
SELECT 
    COUNT(*) FILTER (WHERE security_rank IS NOT NULL) as with_security_rank,
    COUNT(*) FILTER (WHERE earnings_predictability IS NOT NULL) as with_earnings_predictability
FROM tickers;

-- Voir les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tickers';
```

---

## 📝 Notes Importantes

1. **Ordre d'exécution** : Exécuter les scripts de structure AVANT les scripts de données
2. **Idempotence** : Tous les scripts utilisent `IF NOT EXISTS` pour éviter les erreurs
3. **Index** : Les scripts créent automatiquement les index nécessaires
4. **Commentaires** : Toutes les colonnes ont des commentaires explicatifs

---

**Document créé le** : 3 décembre 2025  
**Version** : 1.0

