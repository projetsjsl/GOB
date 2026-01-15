import React, { useState, useEffect } from 'react';
import { GuardrailConfig, DEFAULT_CONFIG } from '../config/AppConfig';
import { XMarkIcon, ArrowPathIcon, Cog6ToothIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: GuardrailConfig;
    onSave: (newConfig: GuardrailConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
    isOpen,
    onClose,
    config,
    onSave
}) => {
    const [localConfig, setLocalConfig] = useState<GuardrailConfig>(config);
    const [activeTab, setActiveTab] = useState<'general' | 'growth' | 'ratios' | 'outliers'>('general');

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
        }
    }, [isOpen, config]);

    if (!isOpen) return null;

    const handleReset = () => {
        if (confirm('Reinitialiser toutes les configurations aux valeurs par defaut ?')) {
            setLocalConfig(DEFAULT_CONFIG);
        }
    };

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    const updateConfig = (section: keyof GuardrailConfig, key: string, value: number) => {
        setLocalConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const updateRatioConfig = (ratio: keyof GuardrailConfig['ratios'], key: 'min' | 'max', value: number) => {
        setLocalConfig(prev => ({
            ...prev,
            ratios: {
                ...prev.ratios,
                [ratio]: {
                    ...prev.ratios[ratio],
                    [key]: value
                }
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 text-left">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Configuration Globale</h3>
                            <p className="text-xs text-gray-500">Ajustez les garde-fous et limites du systeme</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                        aria-label="Fermer"
                        title="Fermer"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto px-5 pt-2">
                    {[
                        { id: 'general', label: 'Projections & Retours' },
                        { id: 'growth', label: 'Limites Croissance' },
                        { id: 'ratios', label: 'Limites Ratios' },
                        { id: 'outliers', label: 'Filtres Outliers' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
                                    Limites de Raisonnabilite
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ConfigInput
                                        label="Min Target Multiplier (x Prix)"
                                        value={localConfig.projections.minReasonableTargetMultiplier}
                                        onChange={(v) => updateConfig('projections', 'minReasonableTargetMultiplier', v)}
                                        help="Prix cible minimum acceptable (ex: 0.1x le prix actuel)"
                                    />
                                    <ConfigInput
                                        label="Max Target Multiplier (x Prix)"
                                        value={localConfig.projections.maxReasonableTargetMultiplier}
                                        onChange={(v) => updateConfig('projections', 'maxReasonableTargetMultiplier', v)}
                                        help="Prix cible maximum acceptable (ex: 50x le prix actuel)"
                                    />
                                    <ConfigInput
                                        label="Max Dividend Multiplier (x Prix)"
                                        value={localConfig.projections.maxDividendMultiplier}
                                        onChange={(v) => updateConfig('projections', 'maxDividendMultiplier', v)}
                                        help="Plafond des dividendes cumules sur 5 ans"
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
                                    Limites Rendement Total
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ConfigInput
                                        label="Rendement Min Accepte (%)"
                                        value={localConfig.returns.min}
                                        onChange={(v) => updateConfig('returns', 'min', v)}
                                        help="Seuil minimum (ex: -100%)"
                                    />
                                    <ConfigInput
                                        label="Rendement Max Accepte (%)"
                                        value={localConfig.returns.max}
                                        onChange={(v) => updateConfig('returns', 'max', v)}
                                        help="Seuil maximum pour filtrer les bugs (ex: 1000%)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'growth' && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                Ces limites s'appliquent aux taux de croissance (EPS, CF, BV, Dividendes) utilises pour les projections.
                                Cela empeche des projections exponentielles irrealistes.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ConfigInput
                                    label="Croissance Min (%)"
                                    value={localConfig.growth.min}
                                    onChange={(v) => updateConfig('growth', 'min', v)}
                                    help="Baisse maximale projetee par an"
                                />
                                <ConfigInput
                                    label="Croissance Max (%)"
                                    value={localConfig.growth.max}
                                    onChange={(v) => updateConfig('growth', 'max', v)}
                                    help="Hausse maximale projetee par an"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'ratios' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <RatioConfigRow 
                                    label="P/E Ratio" 
                                    config={localConfig.ratios.pe} 
                                    onChange={(k, v) => updateRatioConfig('pe', k, v)} 
                                />
                                <RatioConfigRow 
                                    label="P/CF Ratio" 
                                    config={localConfig.ratios.pcf} 
                                    onChange={(k, v) => updateRatioConfig('pcf', k, v)} 
                                />
                                <RatioConfigRow 
                                    label="P/BV Ratio" 
                                    config={localConfig.ratios.pbv} 
                                    onChange={(k, v) => updateRatioConfig('pbv', k, v)} 
                                />
                                <RatioConfigRow 
                                    label="Yield (%)" 
                                    config={localConfig.ratios.yield} 
                                    onChange={(k, v) => updateRatioConfig('yield', k, v)} 
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'outliers' && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                Filtres utilises pour exclure les donnees historiques aberrantes lors du calcul des moyennes (ex: P/E de 5000x lors d'une annee de crise).
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ConfigInput
                                    label="Valeur Min Historique"
                                    value={localConfig.outliers.min}
                                    onChange={(v) => updateConfig('outliers', 'min', v)}
                                />
                                <ConfigInput
                                    label="Valeur Max Historique"
                                    value={localConfig.outliers.max}
                                    onChange={(v) => updateConfig('outliers', 'max', v)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        Reinitialiser
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConfigInput = ({ label, value, onChange, help }: { label: string, value: number, onChange: (v: number) => void, help?: string }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            aria-label={label}
        />
        {help && <span className="text-xs text-gray-500">{help}</span>}
    </div>
);

const RatioConfigRow = ({ label, config, onChange }: { label: string, config: { min: number, max: number }, onChange: (key: 'min' | 'max', v: number) => void }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h5 className="font-semibold text-gray-800 mb-3">{label}</h5>
        <div className="grid grid-cols-2 gap-4">
            <ConfigInput
                label="Min"
                value={config.min}
                onChange={(v) => onChange('min', v)}
            />
            <ConfigInput
                label="Max"
                value={config.max}
                onChange={(v) => onChange('max', v)}
            />
        </div>
    </div>
);
