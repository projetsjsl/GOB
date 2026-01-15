import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export const ScheduleManager: React.FC<TabProps> = (props) => {
    const { isDarkMode = true } = props;

    const [schedule, setSchedule] = useState({
        morning: { enabled: true, hour: 7, minute: 20 },
        midday: { enabled: true, hour: 11, minute: 50 },
        evening: { enabled: true, hour: 16, minute: 20 }
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Charger la configuration
    const loadSchedule = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/briefing-schedule');
            const result = await response.json();
            if (result.success && result.schedule) {
                setSchedule({
                    morning: result.schedule.morning || schedule.morning,
                    midday: result.schedule.midday || schedule.midday,
                    evening: result.schedule.evening || schedule.evening
                });
            }
        } catch (error) {
            console.error('Erreur chargement horaires:', error);
            alert(' Erreur lors du chargement: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Sauvegarder la configuration
    const saveSchedule = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/briefing-schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    morning: schedule.morning,
                    midday: schedule.midday,
                    evening: schedule.evening
                })
            });
            const result = await response.json();
            if (result.success) {
                alert(' Configuration sauvegardee avec succes !\n\n Note: Vous devez mettre a jour le workflow n8n manuellement avec les nouvelles expressions cron.');
            } else {
                alert(' Erreur: ' + result.error);
            }
        } catch (error) {
            console.error('Erreur sauvegarde horaires:', error);
            alert(' Erreur lors de la sauvegarde: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Charger au montage
    React.useEffect(() => {
        loadSchedule();
    }, []);

    const briefingTypes = [
        { id: 'morning', label: ' Matin', icon: '', description: 'Briefing matinal - Marches, actualites et focus sur nos tickers' },
        { id: 'midday', label: ' Midi', icon: '', description: 'Briefing de mi-journee - Performance matinale et perspectives' },
        { id: 'evening', label: ' Soir', icon: '', description: 'Briefing de cloture - Bilan de journee et perspectives pour demain' }
    ];

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
                </div>
            ) : (
                <>
                    {briefingTypes.map(type => (
                        <div key={type.id} className={`p-4 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{type.icon}</span>
                                    <div>
                                        <h4 className={`font-semibold transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {type.label}
                                        </h4>
                                        <p className={`text-xs transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            {type.description}
                                        </p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={schedule[type.id]?.enabled !== false}
                                        onChange={(e) => setSchedule({
                                            ...schedule,
                                            [type.id]: { ...schedule[type.id], enabled: e.target.checked }
                                        })}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className={`font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        {schedule[type.id]?.enabled ? 'Active' : 'Desactive'}
                                    </span>
                                </label>
                            </div>

                            {schedule[type.id]?.enabled && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className={`text-xs font-semibold mb-2 block transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            Heure (0-23)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="23"
                                            value={schedule[type.id]?.hour || 0}
                                            onChange={(e) => setSchedule({
                                                ...schedule,
                                                [type.id]: { ...schedule[type.id], hour: parseInt(e.target.value) || 0 }
                                            })}
                                            className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                                                isDarkMode
                                                    ? 'bg-gray-800 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold mb-2 block transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            Minute (0-59)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={schedule[type.id]?.minute || 0}
                                            onChange={(e) => setSchedule({
                                                ...schedule,
                                                [type.id]: { ...schedule[type.id], minute: parseInt(e.target.value) || 0 }
                                            })}
                                            className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                                                isDarkMode
                                                    ? 'bg-gray-800 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold mb-2 block transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            Heure locale
                                        </label>
                                        <div className={`px-3 py-2 rounded border transition-colors duration-300 ${
                                            isDarkMode
                                                ? 'bg-gray-800 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}>
                                            {String(schedule[type.id]?.hour || 0).padStart(2, '0')}h{String(schedule[type.id]?.minute || 0).padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={saveSchedule}
                            disabled={saving}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-300 ${
                                saving
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                        >
                            {saving ? ' Sauvegarde...' : ' Sauvegarder'}
                        </button>
                        <button
                            onClick={loadSchedule}
                            className="px-6 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300"
                        >
                             Recharger
                        </button>
                    </div>

                    {/* Note informative */}
                    <div className={`mt-4 p-3 rounded-lg text-sm transition-colors duration-300 ${
                        isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'
                    }`}>
                         <strong>Note:</strong> Les modifications sont sauvegardees dans <code className="px-1 py-0.5 rounded bg-gray-800 text-yellow-300">config/briefing-schedule.json</code>. Pour appliquer les changements dans n8n, vous devez mettre a jour manuellement le nud "Schedule Trigger" avec les nouvelles expressions cron generees.
                    </div>
                </>
            )}
        </div>
    );
};


export default ScheduleManager;
