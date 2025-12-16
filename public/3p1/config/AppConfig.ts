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

export const CONFIG_STORAGE_KEY = 'finance_pro_guardrails';

export const loadConfig = (): GuardrailConfig => {
    try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load guardrails config', e);
    }
    return DEFAULT_CONFIG;
};

export const saveConfig = (config: GuardrailConfig) => {
    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save guardrails config', e);
    }
};
