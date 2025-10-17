-- Check existing Supabase schema
-- Run this in Supabase SQL Editor to see your current structure

-- 1. Check team_tickers structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'team_tickers'
ORDER BY ordinal_position;

-- 2. Check seeking_alpha_data structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'seeking_alpha_data'
ORDER BY ordinal_position;

-- 3. Check seeking_alpha_latest structure (view?)
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'seeking_alpha_latest'
ORDER BY ordinal_position;

-- 4. Sample data from team_tickers
SELECT * FROM team_tickers LIMIT 5;

-- 5. Sample data from seeking_alpha_data
SELECT ticker, url, LENGTH(raw_text) as text_length, timestamp, status
FROM seeking_alpha_data
ORDER BY timestamp DESC
LIMIT 5;

-- 6. Check if seeking_alpha_analysis exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'seeking_alpha_analysis'
);
