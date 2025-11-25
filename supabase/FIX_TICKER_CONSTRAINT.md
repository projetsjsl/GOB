# 🔧 FIX: Valid Ticker Constraint

## Problème
Le bulk-load échoue pour les tickers internationaux (`.TO`, `.PA`, etc.) à cause de la contrainte `valid_ticker`.

## Solution Rapide

### Étape 1 : Ouvrir Supabase SQL Editor
1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet "gob-watchlist"
3. Clique sur "SQL Editor"

### Étape 2 : Exécuter ce SQL
```sql
ALTER TABLE finance_pro_snapshots DROP CONSTRAINT IF EXISTS valid_ticker;
```

### Étape 3 : Relancer le bulk-load
```bash
cd scripts
npm run bulk-load
```

## Explication
La contrainte `valid_ticker` limitait les tickers à un format strict (probablement `^[A-Z]+$`).
Les tickers canadiens (`.TO`), français (`.PA`), etc. ne passaient pas.

En supprimant cette contrainte, tous les formats de tickers sont acceptés.

## Alternative (si tu veux garder une validation)
```sql
ALTER TABLE finance_pro_snapshots DROP CONSTRAINT IF EXISTS valid_ticker;
ALTER TABLE finance_pro_snapshots ADD CONSTRAINT valid_ticker 
    CHECK (ticker ~ '^[A-Z0-9.-]+$');
```

Cela permet : `AAPL`, `BRK.B`, `RY.TO`, `MC.PA`, `9984.T`, etc.
