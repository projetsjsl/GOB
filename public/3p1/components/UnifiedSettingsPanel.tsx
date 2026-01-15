import React, { useState, useEffect, useCallback } from 'react';
import { 
    XMarkIcon, 
    ArrowPathIcon, 
    ShieldCheckIcon, 
    Cog6ToothIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GuardrailConfig, DEFAULT_CONFIG, loadConfig, saveConfig } from '../config/AppConfig';
import { 
    loadValidationSettings, 
    saveValidationSettings, 
    getDefaultValidationSettings,
    ValidationSettings 
} from '../services/validationSettingsApi';
import { invalidateValidationSettingsCache } from '../utils/validation';

interface UnifiedSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'guardrails' | 'validation' | 'overview';

export const UnifiedSettingsPanel: React.FC<UnifiedSettingsPanelProps> = ({
    isOpen,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [guardrailConfig, setGuardrailConfig] = useState<GuardrailConfig>(() => loadConfig());
    const [validationSettings, setValidationSettings] = useState<ValidationSettings>(getDefaultValidationSettings());
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasChanges, setHasChanges] = useState(false);
    const [initialGuardrailConfig, setInitialGuardrailConfig] = useState<GuardrailConfig | null>(null);
    const [initialValidationSettings, setInitialValidationSettings] = useState<ValidationSettings | null>(null);

    // Load validation settings on mount
    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const loaded = await loadValidationSettings('default');
            const finalSettings = loaded || getDefaultValidationSettings();
            setValidationSettings(finalSettings);
            setInitialValidationSettings(finalSettings);
            
            const loadedGuardrails = loadConfig();
            setGuardrailConfig(loadedGuardrails);
            setInitialGuardrailConfig(loadedGuardrails);
            
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to load validation settings:', error);
            const defaults = getDefaultValidationSettings();
            setValidationSettings(defaults);
            setInitialValidationSettings(defaults);
            const defaultGuardrails = loadConfig();
            setGuardrailConfig(defaultGuardrails);
            setInitialGuardrailConfig(defaultGuardrails);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen, loadSettings]);

    // Track changes intelligently (compare with initial values)
    useEffect(() => {
        if (initialGuardrailConfig && initialValidationSettings) {
            const guardrailsChanged = JSON.stringify(guardrailConfig) !== JSON.stringify(initialGuardrailConfig);
            const validationChanged = JSON.stringify(validationSettings) !== JSON.stringify(initialValidationSettings);
            setHasChanges(guardrailsChanged || validationChanged);
        }
    }, [guardrailConfig, validationSettings, initialGuardrailConfig, initialValidationSettings]);

    const handleSaveAll = async () => {
        setIsSaving(true);
        setSaveStatus('saving');
        try {
            // Save guardrails (localStorage)
            saveConfig(guardrailConfig);
            
            // Save validation settings (Supabase)
            const result = await saveValidationSettings(validationSettings);
            
            if (result.success) {
                setSaveStatus('saved');
                setHasChanges(false);
                // Update initial values to reflect saved state
                setInitialGuardrailConfig(guardrailConfig);
                setInitialValidationSettings(validationSettings);
                invalidateValidationSettingsCache();
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reinitialiser toutes les configurations aux valeurs par defaut ?')) {
            setGuardrailConfig(DEFAULT_CONFIG);
            setValidationSettings(getDefaultValidationSettings());
            setHasChanges(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000] p-4 text-left">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg flex-shrink-0">
                            <Cog6ToothIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">Configuration Complete 3p1</h3>
                            <p className="text-xs text-gray-600 mt-0.5 truncate">
                                Guardrails, Validation, Ajustements
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveStatus === 'saving' && (
                            <div className="flex items-center gap-2 text-blue-600 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                <span>Sauvegarde...</span>
                            </div>
                        )}
                        {saveStatus === 'saved' && (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircleIconSolid className="w-5 h-5" />
                                <span>Sauvegarde</span>
                            </div>
                        )}
                        {saveStatus === 'error' && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                <span>Erreur</span>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                            aria-label="Fermer"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50 px-4 flex-shrink-0">
                    {[
                        { id: 'overview' as TabType, label: ' Vue d\'ensemble', icon: '' },
                        { id: 'guardrails' as TabType, label: ' Guardrails', icon: '' },
                        { id: 'validation' as TabType, label: ' Validation & Coherence', icon: '' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-4 text-sm font-medium border-b-3 transition-all whitespace-nowrap flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 bg-white'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <OverviewTab 
                                    guardrailConfig={guardrailConfig}
                                    validationSettings={validationSettings}
                                />
                            )}
                            {activeTab === 'guardrails' && (
                                <GuardrailsTab 
                                    config={guardrailConfig}
                                    onUpdate={setGuardrailConfig}
                                />
                            )}
                            {activeTab === 'validation' && (
                                <ValidationTab 
                                    settings={validationSettings}
                                    onUpdate={setValidationSettings}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-red-50"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        Reinitialiser tout
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving || !hasChanges}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder tout'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Overview Tab - Vue d'ensemble de toutes les configurations
const OverviewTab: React.FC<{
    guardrailConfig: GuardrailConfig;
    validationSettings: ValidationSettings;
}> = ({ guardrailConfig, validationSettings }) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-lg text-blue-900 mb-3"> Configuration Actuelle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 className="font-semibold text-blue-800 mb-2"> Guardrails (LocalStorage)</h5>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p>- Croissance: {guardrailConfig.growth.min}% a {guardrailConfig.growth.max}%</p>
                            <p>- P/E: {guardrailConfig.ratios.pe.min}x a {guardrailConfig.ratios.pe.max}x</p>
                            <p>- P/CF: {guardrailConfig.ratios.pcf.min}x a {guardrailConfig.ratios.pcf.max}x</p>
                            <p>- Multiplicateur max: {guardrailConfig.projections.maxReasonableTargetMultiplier}x</p>
                        </div>
                    </div>
                    <div>
                        <h5 className="font-semibold text-green-800 mb-2"> Validation (Supabase)</h5>
                        <div className="text-sm text-green-700 space-y-1">
                            <p>- Croissance: {validationSettings.growth_min}% a {validationSettings.growth_max}%</p>
                            <p>- P/E: {validationSettings.target_pe_min}x a {validationSettings.target_pe_max}x</p>
                            <p>- P/CF: {validationSettings.target_pcf_min}x a {validationSettings.target_pcf_max}x</p>
                            <p>- Sanitisation auto: {validationSettings.auto_sanitize_on_save ? '' : ''}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1"> Note importante</p>
                        <p>Les <strong>Guardrails</strong> sont stockes dans localStorage (navigateur) et controlent les limites d'affichage.</p>
                        <p className="mt-2">Les <strong>Parametres de Validation</strong> sont stockes dans Supabase et controlent la sanitisation automatique des donnees.</p>
                        <p className="mt-2">Les deux sont necessaires pour une protection complete contre les valeurs aberrantes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Guardrails Tab - Configuration des guardrails (existant)
const GuardrailsTab: React.FC<{
    config: GuardrailConfig;
    onUpdate: (config: GuardrailConfig) => void;
}> = ({ config, onUpdate }) => {
    const updateConfig = (section: keyof GuardrailConfig, key: string, value: number) => {
        onUpdate({
            ...config,
            [section]: {
                ...config[section],
                [key]: value
            }
        });
    };

    const updateRatioConfig = (ratio: keyof GuardrailConfig['ratios'], key: 'min' | 'max', value: number) => {
        onUpdate({
            ...config,
            ratios: {
                ...config.ratios,
                [ratio]: {
                    ...config.ratios[ratio],
                    [key]: value
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Guardrails - Limites d'Affichage</p>
                        <p>Ces limites controlent ce qui est affiche dans l'interface et les calculs de projections.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Limites de Croissance</h4>
                    <div className="space-y-3">
                        <NumberInput
                            label="Minimum (%)"
                            value={config.growth.min}
                            onChange={(v) => updateConfig('growth', 'min', v)}
                        />
                        <NumberInput
                            label="Maximum (%)"
                            value={config.growth.max}
                            onChange={(v) => updateConfig('growth', 'max', v)}
                        />
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Limites de Projections</h4>
                    <div className="space-y-3">
                        <NumberInput
                            label="Min Target Multiplier (x Prix)"
                            value={config.projections.minReasonableTargetMultiplier}
                            onChange={(v) => updateConfig('projections', 'minReasonableTargetMultiplier', v)}
                        />
                        <NumberInput
                            label="Max Target Multiplier (x Prix)"
                            value={config.projections.maxReasonableTargetMultiplier}
                            onChange={(v) => updateConfig('projections', 'maxReasonableTargetMultiplier', v)}
                        />
                        <NumberInput
                            label="Max Dividend Multiplier (x Prix)"
                            value={config.projections.maxDividendMultiplier}
                            onChange={(v) => updateConfig('projections', 'maxDividendMultiplier', v)}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-gray-800 mb-4">Limites des Ratios</h4>
                <div className="grid grid-cols-1 gap-4">
                    <RatioConfigRow 
                        label="P/E Ratio" 
                        config={config.ratios.pe} 
                        onChange={(k, v) => updateRatioConfig('pe', k, v)} 
                    />
                    <RatioConfigRow 
                        label="P/CF Ratio" 
                        config={config.ratios.pcf} 
                        onChange={(k, v) => updateRatioConfig('pcf', k, v)} 
                    />
                    <RatioConfigRow 
                        label="P/BV Ratio" 
                        config={config.ratios.pbv} 
                        onChange={(k, v) => updateRatioConfig('pbv', k, v)} 
                    />
                    <RatioConfigRow 
                        label="Yield (%)" 
                        config={config.ratios.yield} 
                        onChange={(k, v) => updateRatioConfig('yield', k, v)} 
                    />
                </div>
            </div>
        </div>
    );
};

// Validation Tab - Configuration de validation (existant, simplifie)
const ValidationTab: React.FC<{
    settings: ValidationSettings;
    onUpdate: (settings: ValidationSettings) => void;
}> = ({ settings, onUpdate }) => {
    const updateSetting = <K extends keyof ValidationSettings>(
        key: K,
        value: ValidationSettings[K]
    ) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Validation & Sanitisation Automatique</p>
                        <p>Ces parametres sont sauvegardes dans Supabase et controlent la sanitisation automatique des donnees lors du chargement, de la sauvegarde et de la synchronisation.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RangeSlider
                    label="Plage de Croissance Globale"
                    minLabel="Minimum (%)"
                    maxLabel="Maximum (%)"
                    minValue={settings.growth_min}
                    maxValue={settings.growth_max}
                    minLimit={-50}
                    maxLimit={50}
                    onMinChange={(v) => updateSetting('growth_min', v)}
                    onMaxChange={(v) => updateSetting('growth_max', v)}
                    unit="%"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">P/E Ratio</h4>
                    <RangeSlider
                        minLabel="Min"
                        maxLabel="Max"
                        minValue={settings.target_pe_min}
                        maxValue={settings.target_pe_max}
                        minLimit={1}
                        maxLimit={100}
                        onMinChange={(v) => updateSetting('target_pe_min', v)}
                        onMaxChange={(v) => updateSetting('target_pe_max', v)}
                        unit="x"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">P/CF Ratio</h4>
                    <RangeSlider
                        minLabel="Min"
                        maxLabel="Max"
                        minValue={settings.target_pcf_min}
                        maxValue={settings.target_pcf_max}
                        minLimit={1}
                        maxLimit={100}
                        onMinChange={(v) => updateSetting('target_pcf_min', v)}
                        onMaxChange={(v) => updateSetting('target_pcf_max', v)}
                        unit="x"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">P/BV Ratio</h4>
                    <RangeSlider
                        minLabel="Min"
                        maxLabel="Max"
                        minValue={settings.target_pbv_min}
                        maxValue={settings.target_pbv_max}
                        minLimit={0.1}
                        maxLimit={50}
                        onMinChange={(v) => updateSetting('target_pbv_min', v)}
                        onMaxChange={(v) => updateSetting('target_pbv_max', v)}
                        unit="x"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Yield (%)</h4>
                    <RangeSlider
                        minLabel="Min"
                        maxLabel="Max"
                        minValue={settings.target_yield_min}
                        maxValue={settings.target_yield_max}
                        minLimit={0}
                        maxLimit={30}
                        onMinChange={(v) => updateSetting('target_yield_min', v)}
                        onMaxChange={(v) => updateSetting('target_yield_max', v)}
                        unit="%"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Required Return (%)</h4>
                    <RangeSlider
                        minLabel="Min"
                        maxLabel="Max"
                        minValue={settings.required_return_min}
                        maxValue={settings.required_return_max}
                        minLimit={0}
                        maxLimit={50}
                        onMinChange={(v) => updateSetting('required_return_min', v)}
                        onMaxChange={(v) => updateSetting('required_return_max', v)}
                        unit="%"
                    />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Dividend Payout Ratio (%)</h4>
                    <RangeSlider
                        minLabel="Min"
                        maxLabel="Max"
                        minValue={settings.dividend_payout_ratio_min}
                        maxValue={settings.dividend_payout_ratio_max}
                        minLimit={0}
                        maxLimit={200}
                        onMinChange={(v) => updateSetting('dividend_payout_ratio_min', v)}
                        onMaxChange={(v) => updateSetting('dividend_payout_ratio_max', v)}
                        unit="%"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="font-semibold text-gray-800 mb-4">Precisions (decimales)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberInput
                        label="Precision Croissance"
                        value={settings.growth_precision}
                        onChange={(v) => updateSetting('growth_precision', Math.max(0, Math.min(4, Math.round(v))))}
                        min={0}
                        max={4}
                        step={1}
                        help="Nombre de decimales pour les taux de croissance"
                    />
                    <NumberInput
                        label="Precision Ratios"
                        value={settings.ratio_precision}
                        onChange={(v) => updateSetting('ratio_precision', Math.max(0, Math.min(4, Math.round(v))))}
                        min={0}
                        max={4}
                        step={1}
                        help="Nombre de decimales pour les ratios (P/E, P/CF, etc.)"
                    />
                    <NumberInput
                        label="Precision Yield"
                        value={settings.yield_precision}
                        onChange={(v) => updateSetting('yield_precision', Math.max(0, Math.min(4, Math.round(v))))}
                        min={0}
                        max={4}
                        step={1}
                        help="Nombre de decimales pour le rendement"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="font-semibold text-gray-800 mb-4">Seuils de Prix</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberInput
                        label="Prix Minimum ($)"
                        value={settings.price_min_threshold}
                        onChange={(v) => updateSetting('price_min_threshold', Math.max(0.01, v))}
                        min={0.01}
                        step={0.01}
                        help="Prix minimum accepte pour une action"
                    />
                    <NumberInput
                        label="Prix Maximum ($)"
                        value={settings.price_max_threshold}
                        onChange={(v) => updateSetting('price_max_threshold', Math.max(settings.price_min_threshold, v))}
                        min={settings.price_min_threshold}
                        step={1}
                        help="Prix maximum accepte pour une action"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Automatisation</h4>
                <ToggleSwitch
                    label="Sanitiser lors du chargement"
                    description="Applique automatiquement la sanitisation lors du chargement depuis Supabase"
                    enabled={settings.auto_sanitize_on_load}
                    onChange={(enabled) => updateSetting('auto_sanitize_on_load', enabled)}
                />
                <ToggleSwitch
                    label="Sanitiser avant sauvegarde"
                    description="Applique automatiquement la sanitisation avant chaque sauvegarde"
                    enabled={settings.auto_sanitize_on_save}
                    onChange={(enabled) => updateSetting('auto_sanitize_on_save', enabled)}
                />
                <ToggleSwitch
                    label="Sanitiser lors de la synchronisation FMP"
                    description="Applique automatiquement la sanitisation lors de la synchronisation avec FMP"
                    enabled={settings.auto_sanitize_on_sync}
                    onChange={(enabled) => updateSetting('auto_sanitize_on_sync', enabled)}
                />
            </div>

            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Coherence FMP/Supabase</h4>
                <ToggleSwitch
                    label="Forcer la coherence FMP/Supabase"
                    description="Rejette les donnees qui ne correspondent pas entre FMP et Supabase"
                    enabled={settings.enforce_fmp_supabase_consistency}
                    onChange={(enabled) => updateSetting('enforce_fmp_supabase_consistency', enabled)}
                />
                <ToggleSwitch
                    label="Rejeter les donnees placeholder"
                    description="Rejette les valeurs placeholder (0, -1, etc.) qui indiquent des donnees manquantes"
                    enabled={settings.reject_placeholder_data}
                    onChange={(enabled) => updateSetting('reject_placeholder_data', enabled)}
                />
                <ToggleSwitch
                    label="Valider la plage de prix"
                    description="Valide que les prix sont dans une plage raisonnable"
                    enabled={settings.validate_price_range}
                    onChange={(enabled) => updateSetting('validate_price_range', enabled)}
                />
            </div>
        </div>
    );
};

// Helper Components (reutilises depuis ValidationSettingsPanel)
const RangeSlider: React.FC<{
    label?: string;
    minLabel: string;
    maxLabel: string;
    minValue: number;
    maxValue: number;
    minLimit: number;
    maxLimit: number;
    onMinChange: (value: number) => void;
    onMaxChange: (value: number) => void;
    unit?: string;
}> = ({ label, minLabel, maxLabel, minValue, maxValue, minLimit, maxLimit, onMinChange, onMaxChange, unit = '' }) => {
    return (
        <div className="space-y-4">
            {label && <h4 className="font-semibold text-gray-800">{label}</h4>}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{minLabel}</label>
                    <input
                        type="number"
                        value={minValue}
                        onChange={(e) => onMinChange(parseFloat(e.target.value) || 0)}
                        min={minLimit}
                        max={maxValue - 0.01}
                        step={0.01}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Valeur: {minValue}{unit}</span>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{maxLabel}</label>
                    <input
                        type="number"
                        value={maxValue}
                        onChange={(e) => onMaxChange(parseFloat(e.target.value) || 0)}
                        min={minValue + 0.01}
                        max={maxLimit}
                        step={0.01}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Valeur: {maxValue}{unit}</span>
                </div>
            </div>
        </div>
    );
};

const NumberInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    help?: string;
}> = ({ label, value, onChange, min, max, step, help }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                min={min}
                max={max}
                step={step || 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {help && <span className="text-xs text-gray-500 mt-1 block">{help}</span>}
        </div>
    );
};

const RatioConfigRow: React.FC<{
    label: string;
    config: { min: number, max: number };
    onChange: (key: 'min' | 'max', v: number) => void;
}> = ({ label, config, onChange }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h5 className="font-semibold text-gray-800 mb-3">{label}</h5>
        <div className="grid grid-cols-2 gap-4">
            <NumberInput
                label="Min"
                value={config.min}
                onChange={(v) => onChange('min', v)}
            />
            <NumberInput
                label="Max"
                value={config.max}
                onChange={(v) => onChange('max', v)}
            />
        </div>
    </div>
);

const ToggleSwitch: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}> = ({ label, description, enabled, onChange }) => {
    return (
        <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
                <p className="text-xs text-gray-600">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
};

