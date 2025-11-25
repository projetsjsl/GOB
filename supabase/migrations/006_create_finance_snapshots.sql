-- Migration 006: Create finance_snapshots table for Finance Pro 3p1
-- This table stores versioned snapshots of financial analysis data

CREATE TABLE IF NOT EXISTS public.finance_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    data JSONB NOT NULL,
    assumptions JSONB NOT NULL,
    info JSONB NOT NULL,
    notes TEXT,
    is_current BOOLEAN DEFAULT true,
    auto_fetched BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_ticker ON public.finance_snapshots(ticker);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_is_current ON public.finance_snapshots(is_current);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_created_at ON public.finance_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_ticker_current ON public.finance_snapshots(ticker, is_current);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_finance_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_snapshots_updated_at
    BEFORE UPDATE ON public.finance_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_finance_snapshots_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.finance_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.finance_snapshots
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policy: Allow read for anonymous users
CREATE POLICY "Allow read for anonymous" ON public.finance_snapshots
    FOR SELECT
    USING (true);

-- Add comments
COMMENT ON TABLE public.finance_snapshots IS 'Stores versioned snapshots of financial analysis data for Finance Pro 3p1';
COMMENT ON COLUMN public.finance_snapshots.ticker IS 'Stock ticker symbol (e.g., AAPL, MSFT)';
COMMENT ON COLUMN public.finance_snapshots.data IS 'Historical annual data (prices, EPS, cash flow, etc.)';
COMMENT ON COLUMN public.finance_snapshots.assumptions IS 'User assumptions (growth rates, target ratios, etc.)';
COMMENT ON COLUMN public.finance_snapshots.info IS 'Company info (name, sector, market cap)';
COMMENT ON COLUMN public.finance_snapshots.notes IS 'User notes for this snapshot';
COMMENT ON COLUMN public.finance_snapshots.is_current IS 'Whether this is the current/active version';
COMMENT ON COLUMN public.finance_snapshots.auto_fetched IS 'Whether this was auto-generated from API';
