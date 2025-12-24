-- Migration 015: Add sync_metadata column to finance_pro_snapshots
-- This column stores detailed synchronization information for each snapshot

ALTER TABLE finance_pro_snapshots
ADD COLUMN IF NOT EXISTS sync_metadata JSONB;

-- Create index for querying by sync metadata
CREATE INDEX IF NOT EXISTS idx_snapshots_sync_metadata 
ON finance_pro_snapshots USING GIN (sync_metadata);

-- Comment on column
COMMENT ON COLUMN finance_pro_snapshots.sync_metadata IS 'JSON object containing detailed synchronization information (source, data retrieved, outliers, options, duration, etc.)';







