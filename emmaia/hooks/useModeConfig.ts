// useModeConfig hook - manages per-mode configuration with localStorage persistence
import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, DEFAULT_MODE_CONFIGS } from '../constants';

export interface ModeConfig {
    modelId: string;
    googleSearch: boolean;
    customPrompt?: string;
}

const STORAGE_KEY = 'emma-mode-configs';

export function useModeConfig(modeId: 'researcher' | 'writer' | 'critic' | 'technical') {
    const [config, setConfigState] = useState<ModeConfig>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const allConfigs = JSON.parse(saved);
                if (allConfigs[modeId]) {
                    return allConfigs[modeId];
                }
            }
        } catch (e) {
            console.error('Error loading mode config:', e);
        }
        return DEFAULT_MODE_CONFIGS[modeId];
    });

    const setConfig = (newConfig: Partial<ModeConfig>) => {
        setConfigState(prev => {
            const updated = { ...prev, ...newConfig };
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                const allConfigs = saved ? JSON.parse(saved) : {};
                allConfigs[modeId] = updated;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(allConfigs));
            } catch (e) {
                console.error('Error saving mode config:', e);
            }
            return updated;
        });
    };

    const currentModel = AVAILABLE_MODELS.find(m => m.id === config.modelId) || AVAILABLE_MODELS[0];

    return {
        config,
        setConfig,
        currentModel,
        availableModels: AVAILABLE_MODELS.filter(m => m.type === 'directional') // Only text models
    };
}

export default useModeConfig;
