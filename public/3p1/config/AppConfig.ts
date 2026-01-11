export interface GuardrailConfig {
    growth: {
        min: number;
        max: number;
    };
    ratios: {
        pe: { min: number; max: number };
        pcf: { min: number; max: number };
        pbv: { min: number; max: number };
        yield: { min: number; max: number };
    };
    outliers: {
        min: number;
        max: number;
    };
    projections: {
        maxReasonableTargetMultiplier: number; // e.g. 50x current price
        minReasonableTargetMultiplier: number; // e.g. 0.1x current price
        maxDividendMultiplier: number; // e.g. 10x current price
    };
    returns: {
        min: number;
        max: number;
        maxTargetMultiplier: number; // e.g. 100x
    };
}

// ✅ Valeurs par défaut (fallback si Supabase n'est pas disponible)
export const DEFAULT_CONFIG: GuardrailConfig = {
    growth: {
        min: -50,
        max: 50
    },
    ratios: {
        pe: { min: 1, max: 100 },
        pcf: { min: 1, max: 100 },
        pbv: { min: 0.5, max: 50 },
        yield: { min: 0.1, max: 20 }
    },
    outliers: {
        min: -100,
        max: 500
    },
    projections: {
        maxReasonableTargetMultiplier: 50,
        minReasonableTargetMultiplier: 0.1,
        maxDividendMultiplier: 10
    },
    returns: {
        min: -100,
        max: 1000,
        maxTargetMultiplier: 100
    }
};

/**
 * Charge la configuration depuis Supabase (remplace le hardcoding)
 */
export async function loadConfigFromSupabase(): Promise<GuardrailConfig> {
    try {
        const { loadAppConfig } = await import('../services/appConfigApi');
        const config = await loadAppConfig();
        
        return {
            growth: {
                min: config.guardrail_growth_min,
                max: config.guardrail_growth_max
            },
            ratios: {
                pe: { min: config.guardrail_pe_min, max: config.guardrail_pe_max },
                pcf: { min: config.guardrail_pcf_min, max: config.guardrail_pcf_max },
                pbv: { min: config.guardrail_pbv_min, max: config.guardrail_pbv_max },
                yield: { min: config.guardrail_yield_min, max: config.guardrail_yield_max }
            },
            outliers: DEFAULT_CONFIG.outliers, // Pas encore dans Supabase
            projections: DEFAULT_CONFIG.projections, // Pas encore dans Supabase
            returns: DEFAULT_CONFIG.returns // Pas encore dans Supabase
        };
    } catch (error) {
        console.warn('⚠️ Impossible de charger la configuration depuis Supabase, utilisation des valeurs par défaut');
        return DEFAULT_CONFIG;
    }
}

export const CONFIG_STORAGE_KEY = 'finance_pro_guardrails';

export const loadConfig = async (): Promise<GuardrailConfig> => {
    // ✅ Priorité 1: Charger depuis Supabase
    try {
        const supabaseConfig = await loadConfigFromSupabase();
        // ✅ Priorité 2: Merger avec localStorage (pour overrides locaux)
        try {
            const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (stored) {
                const localConfig = JSON.parse(stored);
                return { ...supabaseConfig, ...localConfig };
            }
        } catch (e) {
            console.warn('Failed to load guardrails config from localStorage', e);
        }
        return supabaseConfig;
    } catch (e) {
        console.warn('Failed to load guardrails config from Supabase, using localStorage fallback', e);
        // ✅ Fallback: localStorage
        try {
            const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
            }
        } catch (e2) {
            console.warn('Failed to load guardrails config from localStorage', e2);
        }
        return DEFAULT_CONFIG;
    }
};

export const saveConfig = (config: GuardrailConfig) => {
    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save guardrails config', e);
    }
};
