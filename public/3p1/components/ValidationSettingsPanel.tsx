import React, { useState, useEffect, useCallback } from 'react';
import { 
    XMarkIcon, 
    ArrowPathIcon, 
    ShieldCheckIcon, 
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    Cog6ToothIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { 
    loadValidationSettings, 
    saveValidationSettings, 
    getDefaultValidationSettings,
    ValidationSettings 
} from '../services/validationSettingsApi';

interface ValidationSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'growth' | 'ratios' | 'precision' | 'automation' | 'consistency';

export const ValidationSettingsPanel: React.FC<ValidationSettingsPanelProps> = ({
    isOpen,
    onClose
}) => {
    const [settings, setSettings] = useState<ValidationSettings>(getDefaultValidationSettings());
    const [activeTab, setActiveTab] = useState<TabType>('growth');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasChanges, setHasChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Load settings on mount
    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const loaded = await loadValidationSettings('default');
            if (loaded) {
                setSettings(loaded);
                setLastSaved(loaded.updated_at ? new Date(loaded.updated_at) : null);
            } else {
                setSettings(getDefaultValidationSettings());
            }
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-save with debounce
    const debouncedSave = useCallback(
        debounce(async (settingsToSave: ValidationSettings) => {
            setIsSaving(true);
            setSaveStatus('saving');
            try {
                const result = await saveValidationSettings(settingsToSave);
                if (result.success) {
                    setSaveStatus('saved');
                    setLastSaved(new Date());
                    setHasChanges(false);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } else {
                    setSaveStatus('error');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } finally {
                setIsSaving(false);
            }
        }, 1000),
        []
    );

    const updateSetting = <K extends keyof ValidationSettings>(
        key: K,
        value: ValidationSettings[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setHasChanges(true);
        debouncedSave(newSettings);
    };

    const handleReset = () => {
        if (confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
            const defaults = getDefaultValidationSettings();
            setSettings(defaults);
            setHasChanges(true);
            debouncedSave(defaults);
        }
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        setSaveStatus('saving');
        try {
            const result = await saveValidationSettings(settings);
            if (result.success) {
                setSaveStatus('saved');
                setLastSaved(new Date());
                setHasChanges(false);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000] p-4 text-left">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                            <ShieldCheckIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Paramètres de Validation</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Gestion sophistiquée des limites et ajustements pour la cohérence FMP/Supabase
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Save Status Indicator */}
                        {saveStatus === 'saving' && (
                            <div className="flex items-center gap-2 text-blue-600 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                <span>Sauvegarde...</span>
                            </div>
                        )}
                        {saveStatus === 'saved' && (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircleIconSolid className="w-5 h-5" />
                                <span>Sauvegardé</span>
                            </div>
                        )}
                        {saveStatus === 'error' && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                <span>Erreur</span>
                            </div>
                        )}
                        {hasChanges && saveStatus === 'idle' && (
                            <div className="flex items-center gap-2 text-amber-600 text-sm">
                                <InformationCircleIcon className="w-5 h-5" />
                                <span>Modifications non sauvegardées</span>
                            </div>
                        )}
                        <button
                            onClick={handleManualSave}
                            disabled={isSaving || !hasChanges}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Sauvegarder
                        </button>
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
                <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50 px-6">
                    {[
                        { id: 'growth' as TabType, label: 'Taux de Croissance', icon: '📈' },
                        { id: 'ratios' as TabType, label: 'Ratios Cibles', icon: '📊' },
                        { id: 'precision' as TabType, label: 'Précision', icon: '🎯' },
                        { id: 'automation' as TabType, label: 'Automatisation', icon: '⚙️' },
                        { id: 'consistency' as TabType, label: 'Cohérence FMP/Supabase', icon: '🔗' }
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
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'growth' && (
                                <GrowthTab settings={settings} onUpdate={updateSetting} />
                            )}
                            {activeTab === 'ratios' && (
                                <RatiosTab settings={settings} onUpdate={updateSetting} />
                            )}
                            {activeTab === 'precision' && (
                                <PrecisionTab settings={settings} onUpdate={updateSetting} />
                            )}
                            {activeTab === 'automation' && (
                                <AutomationTab settings={settings} onUpdate={updateSetting} />
                            )}
                            {activeTab === 'consistency' && (
                                <ConsistencyTab settings={settings} onUpdate={updateSetting} />
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-red-50"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Réinitialiser
                        </button>
                        {lastSaved && (
                            <span className="text-xs text-gray-500">
                                Dernière sauvegarde: {lastSaved.toLocaleTimeString('fr-FR')}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

// Growth Tab Component
const GrowthTab: React.FC<{
    settings: ValidationSettings;
    onUpdate: <K extends keyof ValidationSettings>(key: K, value: ValidationSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Limites des Taux de Croissance</p>
                        <p>Ces limites s'appliquent à tous les taux de croissance (EPS, CF, BV, Dividendes) pour éviter des projections irréalistes.</p>
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
                    onMinChange={(v) => onUpdate('growth_min', v)}
                    onMaxChange={(v) => onUpdate('growth_max', v)}
                    unit="%"
                />
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Valeurs Recommandées</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Conservateur:</span>
                        <span className="ml-2 font-medium text-gray-800">-10% à +10%</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Modéré:</span>
                        <span className="ml-2 font-medium text-gray-800">-15% à +15%</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Par défaut:</span>
                        <span className="ml-2 font-medium text-blue-600">-20% à +20%</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Permissif:</span>
                        <span className="ml-2 font-medium text-gray-800">-30% à +30%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Ratios Tab Component
const RatiosTab: React.FC<{
    settings: ValidationSettings;
    onUpdate: <K extends keyof ValidationSettings>(key: K, value: ValidationSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
    const ratios = [
        { key: 'pe' as const, label: 'P/E Ratio', min: settings.target_pe_min, max: settings.target_pe_max, unit: 'x' },
        { key: 'pcf' as const, label: 'P/CF Ratio', min: settings.target_pcf_min, max: settings.target_pcf_max, unit: 'x' },
        { key: 'pbv' as const, label: 'P/BV Ratio', min: settings.target_pbv_min, max: settings.target_pbv_max, unit: 'x' },
        { key: 'yield' as const, label: 'Dividend Yield', min: settings.target_yield_min, max: settings.target_yield_max, unit: '%' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Limites des Ratios Cibles</p>
                        <p>Définissez les plages acceptables pour chaque ratio utilisé dans les projections de valorisation.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {ratios.map(ratio => (
                    <div key={ratio.key} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4">{ratio.label}</h4>
                        <RangeSlider
                            minLabel="Minimum"
                            maxLabel="Maximum"
                            minValue={ratio.min}
                            maxValue={ratio.max}
                            minLimit={ratio.key === 'yield' ? 0 : 0.1}
                            maxLimit={ratio.key === 'yield' ? 50 : 100}
                            onMinChange={(v) => onUpdate(`target_${ratio.key}_min` as any, v)}
                            onMaxChange={(v) => onUpdate(`target_${ratio.key}_max` as any, v)}
                            unit={ratio.unit}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Precision Tab Component
const PrecisionTab: React.FC<{
    settings: ValidationSettings;
    onUpdate: <K extends keyof ValidationSettings>(key: K, value: ValidationSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Précision des Arrondis</p>
                        <p>Définissez le nombre de décimales pour l'arrondi des valeurs calculées.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <NumberInput
                    label="Précision Taux de Croissance"
                    value={settings.growth_precision}
                    onChange={(v) => onUpdate('growth_precision', v)}
                    min={0}
                    max={4}
                    help="Nombre de décimales (0-4)"
                />
                <NumberInput
                    label="Précision Ratios"
                    value={settings.ratio_precision}
                    onChange={(v) => onUpdate('ratio_precision', v)}
                    min={0}
                    max={4}
                    help="Nombre de décimales (0-4)"
                />
                <NumberInput
                    label="Précision Yield"
                    value={settings.yield_precision}
                    onChange={(v) => onUpdate('yield_precision', v)}
                    min={0}
                    max={4}
                    help="Nombre de décimales (0-4)"
                />
            </div>
        </div>
    );
};

// Automation Tab Component
const AutomationTab: React.FC<{
    settings: ValidationSettings;
    onUpdate: <K extends keyof ValidationSettings>(key: K, value: ValidationSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
    const toggles = [
        {
            key: 'auto_sanitize_on_load' as const,
            label: 'Sanitiser lors du chargement',
            description: 'Applique automatiquement la sanitisation lors du chargement depuis Supabase',
            enabled: settings.auto_sanitize_on_load
        },
        {
            key: 'auto_sanitize_on_save' as const,
            label: 'Sanitiser avant sauvegarde',
            description: 'Applique automatiquement la sanitisation avant chaque sauvegarde',
            enabled: settings.auto_sanitize_on_save
        },
        {
            key: 'auto_sanitize_on_sync' as const,
            label: 'Sanitiser lors de la synchronisation FMP',
            description: 'Applique automatiquement la sanitisation lors de la synchronisation avec FMP',
            enabled: settings.auto_sanitize_on_sync
        }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Automatisation de la Sanitisation</p>
                        <p>Activez ou désactivez la sanitisation automatique à différents moments du cycle de vie des données.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {toggles.map(toggle => (
                    <ToggleSwitch
                        key={toggle.key}
                        label={toggle.label}
                        description={toggle.description}
                        enabled={toggle.enabled}
                        onChange={(enabled) => onUpdate(toggle.key, enabled)}
                    />
                ))}
            </div>
        </div>
    );
};

// Consistency Tab Component
const ConsistencyTab: React.FC<{
    settings: ValidationSettings;
    onUpdate: <K extends keyof ValidationSettings>(key: K, value: ValidationSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Cohérence FMP / Supabase</p>
                        <p>Paramètres pour garantir la cohérence entre les données FMP et les enregistrements Supabase.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <ToggleSwitch
                    label="Forcer la cohérence FMP/Supabase"
                    description="Rejette les données incohérentes entre FMP et Supabase"
                    enabled={settings.enforce_fmp_supabase_consistency}
                    onChange={(enabled) => onUpdate('enforce_fmp_supabase_consistency', enabled)}
                />
                <ToggleSwitch
                    label="Rejeter les données placeholder"
                    description="Rejette automatiquement les données placeholder (prix = 0, 100, etc.)"
                    enabled={settings.reject_placeholder_data}
                    onChange={(enabled) => onUpdate('reject_placeholder_data', enabled)}
                />
                <ToggleSwitch
                    label="Valider la plage de prix"
                    description="Valide que les prix sont dans une plage raisonnable"
                    enabled={settings.validate_price_range}
                    onChange={(enabled) => onUpdate('validate_price_range', enabled)}
                />

                {settings.validate_price_range && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <NumberInput
                            label="Prix Minimum ($)"
                            value={settings.price_min_threshold}
                            onChange={(v) => onUpdate('price_min_threshold', v)}
                            min={0}
                            max={1000}
                            step={0.01}
                            help="Prix minimum acceptable"
                        />
                        <NumberInput
                            label="Prix Maximum ($)"
                            value={settings.price_max_threshold}
                            onChange={(v) => onUpdate('price_max_threshold', v)}
                            min={1}
                            max={1000000}
                            step={100}
                            help="Prix maximum acceptable"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Components
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
            <div className="relative h-2 bg-gray-200 rounded-full">
                <div 
                    className="absolute h-2 bg-blue-600 rounded-full"
                    style={{
                        left: `${((minValue - minLimit) / (maxLimit - minLimit)) * 100}%`,
                        width: `${((maxValue - minValue) / (maxLimit - minLimit)) * 100}%`
                    }}
                />
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
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                min={min}
                max={max}
                step={step || 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {help && <span className="text-xs text-gray-500 mt-1 block">{help}</span>}
        </div>
    );
};

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

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T;
}



