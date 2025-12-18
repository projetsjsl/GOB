-- Migration 012: Create yield_curve_data table for storing historical yield curve data
-- Stores daily yield curve data for US and Canada to reduce API calls and improve performance

CREATE TABLE IF NOT EXISTS public.yield_curve_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Identification
    country TEXT NOT NULL CHECK (country IN ('us', 'canada')),
    data_date DATE NOT NULL, -- Date of the yield curve data
    
    -- Data storage
    rates JSONB NOT NULL, -- Array of rate objects: [{maturity, rate, change1M, prevValue, months}, ...]
    source TEXT, -- 'FRED', 'Bank of Canada', 'FMP'
    currency TEXT, -- 'USD' or 'CAD'
    count INTEGER, -- Number of data points
    
    -- Calculated metrics
    spread_10y_2y DECIMAL(10,4), -- 10Y - 2Y spread (recession indicator)
    inverted BOOLEAN DEFAULT false, -- Whether the curve is inverted (spread < 0)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one record per country per date
    UNIQUE(country, data_date)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_yield_curve_country_date ON public.yield_curve_data(country, data_date DESC);
CREATE INDEX IF NOT EXISTS idx_yield_curve_date ON public.yield_curve_data(data_date DESC);
CREATE INDEX IF NOT EXISTS idx_yield_curve_country ON public.yield_curve_data(country);

-- Index on JSONB for querying rates
CREATE INDEX IF NOT EXISTS idx_yield_curve_rates ON public.yield_curve_data USING GIN (rates);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_yield_curve_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_yield_curve_updated_at
    BEFORE UPDATE ON public.yield_curve_data
    FOR EACH ROW
    EXECUTE FUNCTION update_yield_curve_updated_at();

-- Enable RLS
ALTER TABLE public.yield_curve_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read access to all, insert/update for all (public data)
CREATE POLICY "Allow read access to all" ON public.yield_curve_data
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.yield_curve_data
    FOR ALL USING (true);

-- Comment
COMMENT ON TABLE public.yield_curve_data IS 'Stores historical yield curve data for US and Canada to reduce API calls and improve performance';
COMMENT ON COLUMN public.yield_curve_data.rates IS 'JSON array of rate objects with maturity, rate, change1M, prevValue, months';
COMMENT ON COLUMN public.yield_curve_data.spread_10y_2y IS '10Y - 2Y spread, negative values indicate inverted curve (recession signal)';

