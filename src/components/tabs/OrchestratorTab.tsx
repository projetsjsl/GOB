// @ts-nocheck
import React, { memo } from 'react';
import type { TabProps } from '../../types';

/**
 * OrchestratorTab
 * Composant dédié pour le Workflow Builder / Orchestrator
 *
 * Permet de créer et gérer des workflows automatisés pour Emma
 * Intègre le workflow-builder.html existant
 */

export const OrchestratorTab: React.FC<TabProps> = memo((props) => {
    const {
        isDarkMode = true,
        LucideIcon: LucideIconProp
    } = props;

    const LucideIcon = LucideIconProp || (({ name, className = '' }) => (
        <span className={className}>{name}</span>
    ));

    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-full ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                        <LucideIcon name="GitBranch" className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            🔄 Orchestrateur de Workflows
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Créez et gérez des workflows automatisés pour Emma
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-purple-900/20 border border-purple-600/30' : 'bg-purple-50 border border-purple-200'
                }`}>
                    <div className="flex items-start gap-3">
                        <LucideIcon name="Info" className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                            <p className="font-semibold mb-1">Fonctionnalités de l'orchestrateur :</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Créer des workflows multi-étapes automatisés</li>
                                <li>Orchestrer plusieurs agents Emma en parallèle</li>
                                <li>Programmer des tâches récurrentes</li>
                                <li>Surveiller l'exécution en temps réel</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflow Builder Iframe */}
            <div className={`rounded-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
                <iframe
                    src="/workflow-builder.html"
                    className="w-full h-[calc(100vh-300px)] min-h-[700px] rounded-lg"
                    title="Workflow Builder"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
                />
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <LucideIcon name="Play" className="w-5 h-5 text-green-500" />
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Workflows Actifs
                        </h3>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Surveillez vos workflows en cours d'exécution
                    </p>
                </div>

                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <LucideIcon name="Clock" className="w-5 h-5 text-blue-500" />
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Programmations
                        </h3>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Gérez vos tâches programmées et récurrentes
                    </p>
                </div>

                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <LucideIcon name="Activity" className="w-5 h-5 text-purple-500" />
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Historique
                        </h3>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Consultez l'historique des exécutions
                    </p>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-6">
                <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-yellow-900/20 border border-yellow-600/30' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                    <div className="flex items-start gap-3">
                        <LucideIcon name="Lightbulb" className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            <p className="font-semibold mb-1">💡 Cas d'usage de l'orchestrateur :</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>Briefings quotidiens :</strong> Collecter news + analyser + envoyer email chaque matin</li>
                                <li><strong>Monitoring portfolio :</strong> Vérifier titres + alertes + notifications push</li>
                                <li><strong>Research automatisé :</strong> Screener + analyse fondamentale + rapport PDF</li>
                                <li><strong>Multi-canal sync :</strong> Répondre sur SMS, email, Messenger simultanément</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Set display name for debugging
OrchestratorTab.displayName = 'OrchestratorTab';

export default OrchestratorTab;
