import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export const PromptManager: React.FC<TabProps> = (props) => {
    const { isDarkMode = true } = props;

    const [prompts, setPrompts] = useState({
        morning: { prompt: '', name: '', tone: '', length: '' },
        midday: { prompt: '', name: '', tone: '', length: '' },
        evening: { prompt: '', name: '', tone: '', length: '' }
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState({});
    const [activeTab, setActiveTab] = useState('morning');
    const [editingPrompt, setEditingPrompt] = useState(null);

    // Charger les prompts depuis l'API
    const loadPrompts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/briefing-prompts');
            const result = await response.json();
            if (result.success && result.prompts) {
                setPrompts({
                    morning: result.prompts.morning || prompts.morning,
                    midday: result.prompts.midday || prompts.midday,
                    evening: result.prompts.evening || prompts.evening
                });
            }
        } catch (error) {
            console.error('Erreur chargement prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sauvegarder un prompt
    const savePrompt = async (type) => {
        setSaving({ ...saving, [type]: true });
        try {
            const response = await fetch('/api/briefing-prompts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    prompt: prompts[type].prompt,
                    name: prompts[type].name,
                    tone: prompts[type].tone,
                    length: prompts[type].length
                })
            });
            const result = await response.json();
            if (result.success) {
                alert(` Prompt ${type} sauvegarde avec succes !`);
                setEditingPrompt(null);
            } else {
                alert(` Erreur: ${result.error}`);
            }
        } catch (error) {
            console.error('Erreur sauvegarde prompt:', error);
            alert(` Erreur lors de la sauvegarde: ${error.message}`);
        } finally {
            setSaving({ ...saving, [type]: false });
        }
    };

    // Charger au montage
    React.useEffect(() => {
        loadPrompts();
    }, []);

    const promptTypes = [
        { id: 'morning', label: ' Matin', icon: '' },
        { id: 'midday', label: ' Midi', icon: '' },
        { id: 'evening', label: ' Soir', icon: '' }
    ];

    return (
        <div className="space-y-4">
            {/* Tabs pour selectionner le type de prompt */}
            <div className="flex gap-2 border-b border-gray-300 dark:border-gray-600">
                {promptTypes.map(type => (
                    <button
                        key={type.id}
                        onClick={() => {
                            setActiveTab(type.id);
                            setEditingPrompt(null);
                        }}
                        className={`px-4 py-2 font-medium transition-colors duration-300 border-b-2 ${
                            activeTab === type.id
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        {type.icon} {type.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des prompts...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Informations du prompt actuel */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className={`text-xs font-semibold mb-1 block transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>Nom</label>
                                <input
                                    type="text"
                                    value={prompts[activeTab].name || ''}
                                    onChange={(e) => setPrompts({
                                        ...prompts,
                                        [activeTab]: { ...prompts[activeTab], name: e.target.value }
                                    })}
                                    className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                    placeholder="Ex: Emma En Direct - Matin"
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-semibold mb-1 block transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>Ton</label>
                                <input
                                    type="text"
                                    value={prompts[activeTab].tone || ''}
                                    onChange={(e) => setPrompts({
                                        ...prompts,
                                        [activeTab]: { ...prompts[activeTab], tone: e.target.value }
                                    })}
                                    className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                    placeholder="Ex: energique, professionnel"
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-semibold mb-1 block transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>Longueur</label>
                                <input
                                    type="text"
                                    value={prompts[activeTab].length || ''}
                                    onChange={(e) => setPrompts({
                                        ...prompts,
                                        [activeTab]: { ...prompts[activeTab], length: e.target.value }
                                    })}
                                    className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                    placeholder="Ex: 200-300 mots"
                                />
                            </div>
                        </div>

                        {/* Editeur de prompt */}
                        <div>
                            <label className={`text-xs font-semibold mb-2 block transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Prompt
                            </label>
                            <textarea
                                value={prompts[activeTab].prompt || ''}
                                onChange={(e) => setPrompts({
                                    ...prompts,
                                    [activeTab]: { ...prompts[activeTab], prompt: e.target.value }
                                })}
                                rows={12}
                                className={`w-full px-4 py-3 rounded-lg border font-mono text-sm transition-colors duration-300 ${
                                    isDarkMode
                                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                placeholder="Entrez le prompt pour ce type de briefing..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => savePrompt(activeTab)}
                                disabled={saving[activeTab]}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-300 ${
                                    saving[activeTab]
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                            >
                                {saving[activeTab] ? ' Sauvegarde...' : ' Sauvegarder'}
                            </button>
                            <button
                                onClick={() => loadPrompts()}
                                className="px-6 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300"
                            >
                                 Recharger
                            </button>
                        </div>
                    </div>

                    {/* Note informative */}
                    <div className={`p-3 rounded-lg text-sm transition-colors duration-300 ${
                        isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'
                    }`}>
                         <strong>Note:</strong> Les modifications sont sauvegardees dans <code className="px-1 py-0.5 rounded bg-gray-800 text-yellow-300">config/briefing-prompts.json</code> et synchronisees automatiquement avec n8n lors de la prochaine execution.
                    </div>
                </div>
            )}
        </div>
    );
};



export default PromptManager;
