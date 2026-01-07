-- Create tables for storing yield curve data

-- Table for storing raw yield observations
CREATE TABLE IF NOT EXISTS yield_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(10) NOT NULL, -- 'US' or 'CA'
  date DATE NOT NULL,
  maturity VARCHAR(10) NOT NULL, -- '1M', '3M', '6M', '1Y', '2Y', etc.
  yield_value DECIMAL(10, 4) NOT NULL,
  days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(country, date, maturity)
);

-- Table for storing calculated spreads
CREATE TABLE IF NOT EXISTS yield_spreads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  spread_type VARCHAR(50) NOT NULL, -- '10Y-2Y', '30Y-5Y', etc.
  spread_value DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(country, date, spread_type)
);

-- Table for storing forward rates
CREATE TABLE IF NOT EXISTS forward_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  forward_rate DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(country, date, period_start, period_end)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_yield_obs_country_date ON yield_observations(country, date);
CREATE INDEX IF NOT EXISTS idx_yield_obs_date ON yield_observations(date);
CREATE INDEX IF NOT EXISTS idx_yield_spreads_country_date ON yield_spreads(country, date);
CREATE INDEX IF NOT EXISTS idx_forward_rates_country_date ON forward_rates(country, date);

-- Enable Row Level Security
ALTER TABLE yield_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forward_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to yield_observations"
  ON yield_observations FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to yield_spreads"
  ON yield_spreads FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to forward_rates"
  ON forward_rates FOR SELECT
  USING (true);

-- Create policies for authenticated insert/update
CREATE POLICY "Allow authenticated insert to yield_observations"
  ON yield_observations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to yield_observations"
  ON yield_observations FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated insert to yield_spreads"
  ON yield_spreads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert to forward_rates"
  ON forward_rates FOR INSERT
  WITH CHECK (true);
