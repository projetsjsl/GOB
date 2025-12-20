/**
 * Validation Settings API Service
 * Handles loading and saving validation settings from Supabase
 */

export interface ValidationSettings {
    id?: string;
    settings_key: string;
    growth_min: number;
    growth_max: number;
    target_pe_min: number;
    target_pe_max: number;
    target_pcf_min: number;
    target_pcf_max: number;
    target_pbv_min: number;
    target_pbv_max: number;
    target_yield_min: number;
    target_yield_max: number;
    required_return_min: number;
    required_return_max: number;
    dividend_payout_ratio_min: number;
    dividend_payout_ratio_max: number;
    growth_precision: number;
    ratio_precision: number;
    yield_precision: number;
    auto_sanitize_on_load: boolean;
    auto_sanitize_on_save: boolean;
    auto_sanitize_on_sync: boolean;
    enforce_fmp_supabase_consistency: boolean;
    reject_placeholder_data: boolean;
    validate_price_range: boolean;
    price_min_threshold: number;
    price_max_threshold: number;
    description?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Load validation settings from Supabase
 */
export async function loadValidationSettings(key: string = 'default'): Promise<ValidationSettings | null> {
    try {
        const response = await fetch(`${API_BASE}/api/validation-settings?key=${encodeURIComponent(key)}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const settings = await response.json();
        return settings;
    } catch (error: any) {
        console.error('Failed to load validation settings:', error);
        return null;
    }
}

/**
 * Save validation settings to Supabase
 */
export async function saveValidationSettings(settings: Partial<ValidationSettings>): Promise<{ success: boolean; settings?: ValidationSettings; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/validation-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                settings_key: settings.settings_key || 'default',
                ...settings
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const savedSettings = await response.json();
        console.log(`✅ Validation settings saved: ${savedSettings.settings_key}`);
        
        return { success: true, settings: savedSettings };
    } catch (error: any) {
        console.error('Failed to save validation settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get default validation settings
 */
export function getDefaultValidationSettings(): ValidationSettings {
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







