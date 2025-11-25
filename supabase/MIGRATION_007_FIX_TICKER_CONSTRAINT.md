# Migration 007: Fix Ticker Constraint

## Problem
The current `valid_ticker` constraint only allows `^[A-Z0-9]{1,10}$`, which blocks:
- **Canadian tickers**: `RY.TO`, `TD.TO`, `SHOP.TO`
- **Complex tickers**: `CAR-UN.TO`, `QBR-B.TO`, `AP-UN.TO`
- **International tickers**: `9984.T` (Japan), `MC.PA` (France)

## Solution
Update constraint to: `^[A-Z0-9.-]{1,20}$`

This allows:
- Dots (`.`)
- Hyphens (`-`)
- Up to 20 characters

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://gob-watchlist.supabase.co
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the SQL from `migrations/007_fix_ticker_constraint.sql`
5. Click **Run** (or press Cmd+Enter)
6. Verify success message

### Option 2: Node.js Script

```bash
cd supabase
node run-migration-007.js
```

**Note**: This requires `exec_sql` function in Supabase, which may not be available. Use Option 1 if this fails.

## Verification

After running, verify the constraint:

```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'finance_pro_snapshots'::regclass
  AND conname = 'valid_ticker';
```

Expected output:
```
constraint_name | constraint_definition
----------------|----------------------
valid_ticker    | CHECK ((ticker ~ '^[A-Z0-9.-]{1,20}$'::text))
```

## After Migration

Re-run the bulk load script:

```bash
cd ../scripts
npm run bulk-load
```

All 126 tickers should now load successfully, including:
- ✅ US tickers: AAPL, GOOGL, MSFT
- ✅ Canadian: RY.TO, TD.TO, SHOP.TO
- ✅ Complex: CAR-UN.TO, QBR-B.TO
- ✅ International: 9984.T, MC.PA

## Rollback (if needed)

To revert to the old constraint:

```sql
ALTER TABLE finance_pro_snapshots DROP CONSTRAINT valid_ticker;
ALTER TABLE finance_pro_snapshots ADD CONSTRAINT valid_ticker CHECK (ticker ~ '^[A-Z0-9]{1,10}$');
```

---

**Created**: 2025-11-25
**Status**: Ready to run
