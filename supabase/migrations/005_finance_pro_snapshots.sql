-- Finance Pro Snapshots Table
-- Stores historical versions of 3p1 analyses for version control

CREATE TABLE IF NOT EXISTS finance_pro_snapshots (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Identification
  ticker VARCHAR(10) NOT NULL,
  profile_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(100), -- For future multi-user support (currently NULL for single user)
  
  -- Metadata
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_current BOOLEAN DEFAULT true, -- Mark as active version
  version INT DEFAULT 1, -- Auto-incremented version number per ticker
  
  -- Data (JSONB for flexibility)
  annual_data JSONB NOT NULL, -- Array of AnnualData objects
  assumptions JSONB NOT NULL, -- Assumptions object
  company_info JSONB NOT NULL, -- CompanyInfo object
  
  -- Flags
  is_watchlist BOOLEAN DEFAULT false,
  auto_fetched BOOLEAN DEFAULT false, -- True if created via API sync
  
  -- Constraints
  CONSTRAINT valid_ticker CHECK (ticker ~ '^[A-Z0-9]{1,10}$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_snapshots_ticker ON finance_pro_snapshots(ticker);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON finance_pro_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON finance_pro_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_current ON finance_pro_snapshots(ticker, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_snapshots_ticker_date ON finance_pro_snapshots(ticker, snapshot_date DESC);

-- Trigger to auto-increment version number per ticker
CREATE OR REPLACE FUNCTION increment_snapshot_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Get max version for this ticker and increment
  SELECT COALESCE(MAX(version), 0) + 1 
  INTO NEW.version
  FROM finance_pro_snapshots
  WHERE ticker = NEW.ticker;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_snapshot_version
  BEFORE INSERT ON finance_pro_snapshots
  FOR EACH ROW
  WHEN (NEW.version IS NULL)
  EXECUTE FUNCTION increment_snapshot_version();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_snapshot_timestamp
  BEFORE UPDATE ON finance_pro_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Row Level Security (RLS)
ALTER TABLE finance_pro_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for all (for now, since single-user)
CREATE POLICY "Allow read access to all snapshots"
  ON finance_pro_snapshots FOR SELECT
  USING (true);

-- Policy: Allow insert for all
CREATE POLICY "Allow insert for all"
  ON finance_pro_snapshots FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update for all
CREATE POLICY "Allow update for all"
  ON finance_pro_snapshots FOR UPDATE
  USING (true);

-- Policy: Allow delete for all
CREATE POLICY "Allow delete for all"
  ON finance_pro_snapshots FOR DELETE
  USING (true);

-- Comment on table
COMMENT ON TABLE finance_pro_snapshots IS 'Stores versioned snapshots of Finance Pro (3p1) analyses for historical tracking and version control';

-- Comment on columns
COMMENT ON COLUMN finance_pro_snapshots.ticker IS 'Stock ticker symbol (e.g., AAPL, MSFT)';
COMMENT ON COLUMN finance_pro_snapshots.profile_id IS 'Unique identifier for the analysis profile';
COMMENT ON COLUMN finance_pro_snapshots.snapshot_date IS 'Date when this snapshot was created';
COMMENT ON COLUMN finance_pro_snapshots.is_current IS 'Marks the currently active version for this ticker';
COMMENT ON COLUMN finance_pro_snapshots.version IS 'Auto-incremented version number per ticker';
COMMENT ON COLUMN finance_pro_snapshots.annual_data IS 'JSON array of annual financial data (AnnualData[])';
COMMENT ON COLUMN finance_pro_snapshots.assumptions IS 'JSON object containing analysis assumptions';
COMMENT ON COLUMN finance_pro_snapshots.company_info IS 'JSON object containing company information';
COMMENT ON COLUMN finance_pro_snapshots.auto_fetched IS 'True if snapshot was created automatically via API sync';
