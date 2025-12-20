/**
 * Validation Settings API
 * CRUD operations for managing validation and sanitization parameters
 * 
 * Endpoints:
 * - GET    ?key=default         - Get settings by key
 * - POST   { settings }         - Create/update settings
 * - PUT    { key, settings }    - Update existing settings
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        switch (req.method) {
            case 'GET':
                return await getSettings(req, res, supabase);
            case 'POST':
            case 'PUT':
                return await saveSettings(req, res, supabase);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Validation settings API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * GET - Get settings by key (default: 'default')
 */
async function getSettings(req, res, supabase) {
    const { key = 'default' } = req.query;

    const { data, error } = await supabase
        .from('validation_settings')
        .select('*')
        .eq('settings_key', key)
        .eq('is_active', true)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No settings found, return defaults
            return res.status(200).json(getDefaultSettings());
        }
        console.error('Get settings error:', error);
        return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    return res.status(200).json(data);
}

/**
 * POST/PUT - Save settings (upsert)
 */
async function saveSettings(req, res, supabase) {
    const {
        settings_key = 'default',
        growth_min,
        growth_max,
        target_pe_min,
        target_pe_max,
        target_pcf_min,
        target_pcf_max,
        target_pbv_min,
        target_pbv_max,
        target_yield_min,
        target_yield_max,
        required_return_min,
        required_return_max,
        dividend_payout_ratio_min,
        dividend_payout_ratio_max,
        growth_precision,
        ratio_precision,
        yield_precision,
        auto_sanitize_on_load,
        auto_sanitize_on_save,
        auto_sanitize_on_sync,
        enforce_fmp_supabase_consistency,
        reject_placeholder_data,
        validate_price_range,
        price_min_threshold,
        price_max_threshold,
        description
    } = req.body;

    // Validate ranges
    if (growth_min >= growth_max) {
        return res.status(400).json({ error: 'growth_min must be less than growth_max' });
    }
    if (target_pe_min >= target_pe_max) {
        return res.status(400).json({ error: 'target_pe_min must be less than target_pe_max' });
    }

    const settings = {
        settings_key,
        growth_min: growth_min ?? -20.00,
        growth_max: growth_max ?? 20.00,
        target_pe_min: target_pe_min ?? 5.0,
        target_pe_max: target_pe_max ?? 50.0,
        target_pcf_min: target_pcf_min ?? 3.0,
        target_pcf_max: target_pcf_max ?? 50.0,
        target_pbv_min: target_pbv_min ?? 0.5,
        target_pbv_max: target_pbv_max ?? 10.0,
        target_yield_min: target_yield_min ?? 0.0,
        target_yield_max: target_yield_max ?? 15.0,
        required_return_min: required_return_min ?? 5.0,
        required_return_max: required_return_max ?? 25.0,
        dividend_payout_ratio_min: dividend_payout_ratio_min ?? 0.0,
        dividend_payout_ratio_max: dividend_payout_ratio_max ?? 100.0,
        growth_precision: growth_precision ?? 2,
        ratio_precision: ratio_precision ?? 1,
        yield_precision: yield_precision ?? 2,
        auto_sanitize_on_load: auto_sanitize_on_load ?? true,
        auto_sanitize_on_save: auto_sanitize_on_save ?? true,
        auto_sanitize_on_sync: auto_sanitize_on_sync ?? true,
        enforce_fmp_supabase_consistency: enforce_fmp_supabase_consistency ?? true,
        reject_placeholder_data: reject_placeholder_data ?? true,
        validate_price_range: validate_price_range ?? true,
        price_min_threshold: price_min_threshold ?? 0.01,
        price_max_threshold: price_max_threshold ?? 100000.00,
        description: description || null,
        is_active: true
    };

    // Upsert (insert or update)
    const { data, error } = await supabase
        .from('validation_settings')
        .upsert(settings, {
            onConflict: 'settings_key',
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (error) {
        console.error('Save settings error:', error);
        return res.status(500).json({ error: 'Failed to save settings' });
    }

    console.log(`✅ Validation settings saved: ${settings_key}`);
    return res.status(200).json(data);
}

/**
 * Get default settings structure
 */
function getDefaultSettings() {
    return {
        settings_key: 'default',
        growth_min: -20.00,
        growth_max: 20.00,
        target_pe_min: 5.0,
        target_pe_max: 50.0,
        target_pcf_min: 3.0,
        target_pcf_max: 50.0,
        target_pbv_min: 0.5,
        target_pbv_max: 10.0,
        target_yield_min: 0.0,
        target_yield_max: 15.0,
        required_return_min: 5.0,
        required_return_max: 25.0,
        dividend_payout_ratio_min: 0.0,
        dividend_payout_ratio_max: 100.0,
        growth_precision: 2,
        ratio_precision: 1,
        yield_precision: 2,
        auto_sanitize_on_load: true,
        auto_sanitize_on_save: true,
        auto_sanitize_on_sync: true,
        enforce_fmp_supabase_consistency: true,
        reject_placeholder_data: true,
        validate_price_range: true,
        price_min_threshold: 0.01,
        price_max_threshold: 100000.00,
        description: 'Paramètres par défaut',
        is_active: true
    };
}







