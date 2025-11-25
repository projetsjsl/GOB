-- Fix: Remove or update the valid_ticker constraint to allow international tickers

-- Option 1: Drop the constraint entirely (RECOMMENDED)
ALTER TABLE finance_pro_snapshots DROP CONSTRAINT IF EXISTS valid_ticker;

-- Option 2: Update constraint to allow international tickers (.TO, .PA, etc.)
-- Uncomment if you prefer to keep validation but allow more formats:
/*
ALTER TABLE finance_pro_snapshots DROP CONSTRAINT IF EXISTS valid_ticker;
ALTER TABLE finance_pro_snapshots ADD CONSTRAINT valid_ticker 
    CHECK (ticker ~ '^[A-Z0-9.-]+$');
*/

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'finance_pro_snapshots'::regclass 
AND conname = 'valid_ticker';
