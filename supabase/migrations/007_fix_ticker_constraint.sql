-- Migration 007: Fix ticker constraint to allow international symbols
-- 
-- Problem: Current constraint only allows [A-Z0-9]{1,10}
-- This blocks:
--   - Canadian tickers: RY.TO, TD.TO, etc.
--   - Complex tickers: CAR-UN.TO, QBR-B.TO, etc.
--   - International: 9984.T (Japan), MC.PA (France), etc.
--
-- Solution: Allow dots, hyphens, and up to 20 characters

-- Drop the old constraint
ALTER TABLE finance_pro_snapshots 
DROP CONSTRAINT IF EXISTS valid_ticker;

-- Add new flexible constraint
-- Allows: A-Z, 0-9, dots, hyphens, up to 20 chars
ALTER TABLE finance_pro_snapshots 
ADD CONSTRAINT valid_ticker CHECK (
  ticker ~ '^[A-Z0-9.-]{1,20}$'
);

-- Verify
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'finance_pro_snapshots'::regclass
  AND conname = 'valid_ticker';
