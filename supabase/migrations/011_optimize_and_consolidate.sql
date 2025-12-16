-- Migration 011: Optimize and Consolidate Database Structure
-- Fixes and improvements for production readiness

-- ============================================
-- 1. ADD MISSING CONSTRAINTS TO validation_settings
-- ============================================

-- Add CHECK constraints to ensure logical value ranges
ALTER TABLE public.validation_settings
ADD CONSTRAINT check_growth_range CHECK (growth_min < growth_max),
ADD CONSTRAINT check_pe_range CHECK (target_pe_min > 0 AND target_pe_min < target_pe_max),
ADD CONSTRAINT check_pcf_range CHECK (target_pcf_min > 0 AND target_pcf_min < target_pcf_max),
ADD CONSTRAINT check_pbv_range CHECK (target_pbv_min > 0 AND target_pbv_min < target_pbv_max),
ADD CONSTRAINT check_yield_range CHECK (target_yield_min >= 0 AND target_yield_min < target_yield_max),
ADD CONSTRAINT check_required_return_range CHECK (required_return_min >= 0 AND required_return_min < required_return_max),
ADD CONSTRAINT check_dividend_payout_range CHECK (
    dividend_payout_ratio_min >= 0 AND 
    dividend_payout_ratio_min <= dividend_payout_ratio_max AND
    dividend_payout_ratio_max <= 200
),
ADD CONSTRAINT check_precision_range CHECK (
    growth_precision >= 0 AND growth_precision <= 4 AND
    ratio_precision >= 0 AND ratio_precision <= 4 AND
    yield_precision >= 0 AND yield_precision <= 4
),
ADD CONSTRAINT check_price_thresholds CHECK (
    price_min_threshold > 0 AND 
    price_min_threshold < price_max_threshold AND
    price_max_threshold <= 1000000.00
);

-- ============================================
-- 2. ADD MISSING CONSTRAINTS TO finance_pro_snapshots
-- ============================================

-- Ensure version is positive
ALTER TABLE public.finance_pro_snapshots
ADD CONSTRAINT check_version_positive CHECK (version > 0);

-- Ensure profile_id is not empty
ALTER TABLE public.finance_pro_snapshots
ADD CONSTRAINT check_profile_id_not_empty CHECK (LENGTH(TRIM(profile_id)) > 0);

-- Ensure JSONB fields are not null and valid JSON
-- (PostgreSQL validates JSONB automatically, but we can add NOT NULL if missing)
DO $$
BEGIN
    -- Check if columns are already NOT NULL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'finance_pro_snapshots' 
        AND column_name = 'annual_data' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.finance_pro_snapshots 
        ALTER COLUMN annual_data SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'finance_pro_snapshots' 
        AND column_name = 'assumptions' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.finance_pro_snapshots 
        ALTER COLUMN assumptions SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'finance_pro_snapshots' 
        AND column_name = 'company_info' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.finance_pro_snapshots 
        ALTER COLUMN company_info SET NOT NULL;
    END IF;
END $$;

-- ============================================
-- 3. OPTIMIZE INDEXES
-- ============================================

-- Add composite index for common query pattern: get current snapshot by ticker
CREATE INDEX IF NOT EXISTS idx_snapshots_ticker_current_composite 
ON public.finance_pro_snapshots(ticker, is_current, created_at DESC) 
WHERE is_current = true;

-- Add index for version queries
CREATE INDEX IF NOT EXISTS idx_snapshots_ticker_version 
ON public.finance_pro_snapshots(ticker, version DESC);

-- Add GIN index for JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_snapshots_assumptions_gin 
ON public.finance_pro_snapshots USING GIN (assumptions);

CREATE INDEX IF NOT EXISTS idx_snapshots_company_info_gin 
ON public.finance_pro_snapshots USING GIN (company_info);

-- ============================================
-- 4. IMPROVE TRIGGER FUNCTIONS
-- ============================================

-- Consolidate updated_at trigger function (use same function for all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing triggers to use consolidated function
DROP TRIGGER IF EXISTS update_snapshot_timestamp ON public.finance_pro_snapshots;
CREATE TRIGGER update_snapshot_timestamp
    BEFORE UPDATE ON public.finance_pro_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ADD UNIQUE CONSTRAINT FOR CURRENT SNAPSHOTS
-- ============================================

-- Ensure only one current snapshot per ticker at a time
-- Using partial unique index (only for is_current = true)
CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_unique_current_per_ticker
ON public.finance_pro_snapshots(ticker)
WHERE is_current = true;

-- ============================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

-- Note: COMMENT ON CONSTRAINT and COMMENT ON INDEX require the object to exist first
-- These will be added after constraints and indexes are created

-- ============================================
-- 7. ADD FUNCTION TO VALIDATE JSONB STRUCTURE
-- ============================================

-- Function to validate assumptions JSONB structure
CREATE OR REPLACE FUNCTION validate_assumptions_structure(assumptions_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields exist
    RETURN (
        assumptions_json ? 'currentPrice' AND
        assumptions_json ? 'growthRateEPS' AND
        assumptions_json ? 'targetPE' AND
        assumptions_json ? 'targetPCF' AND
        assumptions_json ? 'targetPBV' AND
        assumptions_json ? 'targetYield'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_assumptions_structure IS 
    'Validates that assumptions JSONB contains all required fields';

-- ============================================
-- 8. ADD STATISTICS FOR QUERY OPTIMIZATION
-- ============================================

-- Update table statistics for better query planning
ANALYZE public.finance_pro_snapshots;
ANALYZE public.validation_settings;
ANALYZE public.snapshot_audit_log;

