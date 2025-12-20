-- Migration 010: Create validation_settings table for 3p1
-- Stores user-customizable validation and sanitization parameters

CREATE TABLE IF NOT EXISTS public.validation_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(100) DEFAULT 'default', -- For future multi-user support
    settings_key VARCHAR(50) DEFAULT 'default' UNIQUE, -- 'default' for global settings
    
    -- Growth rate limits
    growth_min DECIMAL(5,2) DEFAULT -20.00,
    growth_max DECIMAL(5,2) DEFAULT 20.00,
    
    -- Target ratio limits
    target_pe_min DECIMAL(5,1) DEFAULT 5.0,
    target_pe_max DECIMAL(5,1) DEFAULT 50.0,
    target_pcf_min DECIMAL(5,1) DEFAULT 3.0,
    target_pcf_max DECIMAL(5,1) DEFAULT 50.0,
    target_pbv_min DECIMAL(5,2) DEFAULT 0.5,
    target_pbv_max DECIMAL(5,2) DEFAULT 10.0,
    target_yield_min DECIMAL(5,2) DEFAULT 0.0,
    target_yield_max DECIMAL(5,2) DEFAULT 15.0,
    
    -- Other parameters
    required_return_min DECIMAL(5,1) DEFAULT 5.0,
    required_return_max DECIMAL(5,1) DEFAULT 25.0,
    dividend_payout_ratio_min DECIMAL(5,1) DEFAULT 0.0,
    dividend_payout_ratio_max DECIMAL(5,1) DEFAULT 100.0,
    
    -- Rounding precision
    growth_precision INTEGER DEFAULT 2,
    ratio_precision INTEGER DEFAULT 1,
    yield_precision INTEGER DEFAULT 2,
    
    -- Auto-sanitization flags
    auto_sanitize_on_load BOOLEAN DEFAULT true,
    auto_sanitize_on_save BOOLEAN DEFAULT true,
    auto_sanitize_on_sync BOOLEAN DEFAULT true,
    
    -- FMP/Supabase consistency
    enforce_fmp_supabase_consistency BOOLEAN DEFAULT true,
    reject_placeholder_data BOOLEAN DEFAULT true,
    validate_price_range BOOLEAN DEFAULT true,
    price_min_threshold DECIMAL(10,2) DEFAULT 0.01,
    price_max_threshold DECIMAL(10,2) DEFAULT 100000.00,
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_validation_settings_key ON public.validation_settings(settings_key);
CREATE INDEX IF NOT EXISTS idx_validation_settings_user ON public.validation_settings(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_validation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validation_settings_updated_at
    BEFORE UPDATE ON public.validation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_validation_settings_updated_at();

-- Insert default settings
INSERT INTO public.validation_settings (settings_key, description)
VALUES (
    'default',
    'Paramètres de validation par défaut pour 3p1 - Limites réalistes pour éviter les valeurs aberrantes'
)
ON CONFLICT (settings_key) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.validation_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow all operations for all users (for now, single-user app)
CREATE POLICY "Allow all for validation settings" ON public.validation_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.validation_settings IS 'Stores customizable validation and sanitization parameters for 3p1 Finance Pro';
COMMENT ON COLUMN public.validation_settings.settings_key IS 'Unique key for settings profile (default: "default")';
COMMENT ON COLUMN public.validation_settings.growth_min IS 'Minimum growth rate allowed (%)';
COMMENT ON COLUMN public.validation_settings.growth_max IS 'Maximum growth rate allowed (%)';
COMMENT ON COLUMN public.validation_settings.auto_sanitize_on_load IS 'Automatically sanitize assumptions when loading from Supabase';
COMMENT ON COLUMN public.validation_settings.auto_sanitize_on_save IS 'Automatically sanitize assumptions before saving to Supabase';
COMMENT ON COLUMN public.validation_settings.auto_sanitize_on_sync IS 'Automatically sanitize assumptions during FMP sync';







