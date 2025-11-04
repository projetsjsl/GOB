-- Create usage_stats table for Emma Agent tool statistics
-- This replaces the filesystem-based usage_stats.json file

CREATE TABLE IF NOT EXISTS tool_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id TEXT NOT NULL,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    success_rate DECIMAL(5,2) DEFAULT 0,
    error_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on tool_id for quick lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_usage_stats_tool_id ON tool_usage_stats(tool_id);

-- Create index on last_used for performance queries
CREATE INDEX IF NOT EXISTS idx_tool_usage_stats_last_used ON tool_usage_stats(last_used DESC);

-- Add RLS policies (allow all operations for service role)
ALTER TABLE tool_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role all access" ON tool_usage_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_tool_usage_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER trigger_update_tool_usage_stats_updated_at
    BEFORE UPDATE ON tool_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_tool_usage_stats_updated_at();

-- Comment on table
COMMENT ON TABLE tool_usage_stats IS 'Stores usage statistics for Emma Agent tools (replaces usage_stats.json)';
