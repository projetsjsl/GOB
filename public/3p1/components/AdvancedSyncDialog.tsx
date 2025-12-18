import React, { useState } from 'react';
import { XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AdvancedSyncDialogProps {
    isOpen: boolean;
    ticker?: string; // Si défini, sync d'un seul ticker, sinon sync de tous
    hasManualData?: boolean;
    onCancel: () => void;
    onConfirm: (options: SyncOptions) => void;
    isSyncing?: boolean;
}

export interface SyncOptions {
    saveBeforeSync: boolean;
    replaceOrangeData: boolean; // Remplacer les données oranges (assumptions manuelles)
    syncAllTickers: boolean; // Synchroniser tous les tickers
    syncData: boolean; // Synchroniser les données historiques
    syncAssumptions: boolean; // Synchroniser les assumptions
    syncInfo: boolean; // Synchroniser les infos (nom, secteur, etc.)
    forceReplace: boolean; // Forcer le remplacement même des données manuelles
    syncOnlyNewYears: boolean; // Synchroniser uniquement les nouvelles années
    syncOnlyMissingMetrics: boolean; // Synchroniser uniquement les métriques manquantes
    preserveExclusions: boolean; // Préserver les exclusions de métriques (EPS, CF, BV, DIV)
    recalculateOutliers: boolean; // Recalculer la détection d'outliers
    updateCurrentPrice: boolean; // Mettre à jour le prix actuel
    syncValueLineMetrics: boolean; // Synchroniser les métriques ValueLine depuis Supabase
}

// Composant d'aide pour chaque option
const HelpSection: React.FC<{ 
    id: string; 
    title: string; 
    children: React.ReactNode;
    showHelp: { [key: string]: boolean };
    setShowHelp: (prev: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => void;
}> = ({ id, title, children, showHelp, setShowHelp }) => {
    const isOpen = showHelp[id] || false;
    return (
        <div className="mt-2">
            <button
                onClick={() => setShowHelp(prev => ({ ...prev, [id]: !prev[id] }))}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
                <QuestionMarkCircleIcon className="w-4 h-4" />
                <span>En savoir plus</span>
                {isOpen ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </button>
            {isOpen && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-gray-700">
                    <h5 className="font-semibold text-blue-900 mb-2">{title}</h5>
                    {children}
                </div>
            )}
        </div>
    );
};

export const AdvancedSyncDialog: React.FC<AdvancedSyncDialogProps> = ({
    isOpen,
    ticker,
    hasManualData = false,
    onCancel,
    onConfirm,
    isSyncing = false
}) => {
    const [options, setOptions] = useState<SyncOptions>({
        saveBeforeSync: true,
        replaceOrangeData: false,
        syncAllTickers: !ticker, // Si pas de ticker spécifique, sync tous par défaut
        syncData: true,
        syncAssumptions: true,
        syncInfo: true,
        forceReplace: false,
        syncOnlyNewYears: false,
        syncOnlyMissingMetrics: false,
        preserveExclusions: true,
        recalculateOutliers: true,
        updateCurrentPrice: true,
        syncValueLineMetrics: true
    });

    const [showHelp, setShowHelp] = useState<{ [key: string]: boolean }>({});

    if (!isOpen) return null;

    const isBulkSync = !ticker;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <ArrowPathIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Options de Synchronisation Avancées
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {isBulkSync ? (
                                    <>Synchronisation de <strong>tous les tickers</strong></>
                                ) : (
                                    <>Ticker: <span className="font-mono font-semibold">{ticker}</span></>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isSyncing}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Section d'information générale */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                    🔄 Processus de Synchronisation
                                </h4>
                                <div className="text-xs text-blue-800 space-y-2">
                                    <p><strong>Séquence d'exécution :</strong></p>
                                    <ol className="list-decimal list-inside ml-2 space-y-1">
                                        <li><strong>Sauvegarde</strong> : Création d'un snapshot (si activé)</li>
                                        <li><strong>Récupération FMP</strong> : Appel API FMP Premium pour données historiques (30 ans)</li>
                                        <li><strong>Merge intelligent</strong> : Fusion des nouvelles données avec les existantes</li>
                                        <li><strong>Calcul assumptions</strong> : Recalcul des taux de croissance et ratios cibles</li>
                                        <li><strong>Détection outliers</strong> : Identification des métriques aberrantes</li>
                                        <li><strong>Mise à jour Supabase</strong> : Synchronisation des métriques ValueLine (si activé)</li>
                                        <li><strong>Sauvegarde finale</strong> : Création d'un snapshot post-sync</li>
                                    </ol>
                                    <p className="mt-2"><strong>Outils utilisés :</strong> FMP API Premium, Supabase, Algorithmes de détection d'outliers, Calculs CAGR</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Avertissement si données manuelles */}
                    {hasManualData && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-800 font-medium">
                                        ⚠️ Données manuelles détectées
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Vous avez modifié des données manuellement (cases oranges).
                                        Choisissez si vous souhaitez les préserver ou les remplacer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Options principales */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                            Options de Synchronisation Principales
                        </h4>

                        {/* Sauvegarder avant sync */}
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.saveBeforeSync}
                                    onChange={(e) => setOptions(prev => ({ ...prev, saveBeforeSync: e.target.checked }))}
                                    disabled={isSyncing}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        💾 Sauvegarder la version actuelle avant synchronisation
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Crée un snapshot de sauvegarde avant de synchroniser. Recommandé pour pouvoir restaurer en cas de problème.
                                    </p>
                                    <HelpSection 
                                        id="saveBeforeSync" 
                                        title="Sauvegarde avant synchronisation"
                                        showHelp={showHelp}
                                        setShowHelp={setShowHelp}
                                    >
                                        <div className="space-y-2">
                                            <p><strong>Comportement :</strong> Un snapshot complet est créé dans Supabase avec toutes les données actuelles (historiques, assumptions, infos).</p>
                                            <p><strong>Exemple concret :</strong> Si vous avez modifié manuellement le taux de croissance EPS à 12% et que la sync le recalcule à 8.5%, vous pourrez restaurer la version avec 12%.</p>
                                            <p><strong>Outil :</strong> API Supabase Snapshots</p>
                                            <p><strong>Recommandation :</strong> Toujours activer cette option, surtout avant de remplacer les données oranges.</p>
                                        </div>
                                    </HelpSection>
                                </div>
                            </label>
                        </div>

                        {/* Remplacer données oranges */}
                        <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.replaceOrangeData}
                                    onChange={(e) => setOptions(prev => ({ ...prev, replaceOrangeData: e.target.checked }))}
                                    disabled={isSyncing}
                                    className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-orange-900">
                                        🟠 Remplacer les données oranges (assumptions manuelles)
                                    </p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        <strong>Attention:</strong> Si coché, toutes les valeurs manuelles (taux de croissance, ratios cibles) seront recalculées et remplacées par les valeurs calculées depuis FMP. Cette action est irréversible.
                                    </p>
                                    <HelpSection 
                                        id="replaceOrangeData" 
                                        title="Remplacement des données oranges"
                                        showHelp={showHelp}
                                        setShowHelp={setShowHelp}
                                    >
                                        <div className="space-y-2">
                                            <p><strong>Comportement :</strong> Les assumptions modifiées manuellement (affichées en orange) seront recalculées depuis les données FMP historiques.</p>
                                            <p><strong>Exemple concret :</strong></p>
                                            <ul className="list-disc list-inside ml-2 space-y-1">
                                                <li>Vous aviez modifié <code className="bg-white px-1 rounded">growthRateEPS</code> à 10% manuellement</li>
                                                <li>FMP calcule un CAGR de 8.5% sur 5 ans</li>
                                                <li>Avec cette option : 10% → 8.5% (remplacé)</li>
                                                <li>Sans cette option : 10% → 10% (préservé)</li>
                                            </ul>
                                            <p><strong>Champs affectés :</strong> growthRateEPS, growthRateCF, growthRateBV, growthRateDiv, targetPE, targetPCF, targetPBV, targetYield</p>
                                            <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">autoFillAssumptionsFromFMPData()</code> avec <code className="bg-white px-1 rounded">existingAssumptions = undefined</code></p>
                                            <p><strong>Recommandation :</strong> Utiliser uniquement si vous voulez réinitialiser toutes vos hypothèses manuelles avec les valeurs calculées.</p>
                                        </div>
                                    </HelpSection>
                                </div>
                            </label>
                        </div>

                        {/* Forcer remplacement même données manuelles */}
                        {options.replaceOrangeData && (
                            <div className="p-4 bg-red-50 rounded-md border border-red-200">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.forceReplace}
                                        onChange={(e) => setOptions(prev => ({ ...prev, forceReplace: e.target.checked }))}
                                        disabled={isSyncing}
                                        className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900">
                                            ⚠️ Forcer le remplacement de TOUTES les données manuelles
                                        </p>
                                        <p className="text-xs text-red-700 mt-1">
                                            <strong>Danger:</strong> Remplace également les données historiques manuelles (pas seulement les assumptions). Utilisez avec précaution.
                                        </p>
                                        <HelpSection 
                                            id="forceReplace" 
                                            title="Remplacement forcé de toutes les données"
                                            showHelp={showHelp}
                                            setShowHelp={setShowHelp}
                                        >
                                            <div className="space-y-2">
                                                <p><strong>Comportement :</strong> Ignore complètement le flag <code className="bg-white px-1 rounded">autoFetched: false</code> et remplace TOUTES les données, même celles modifiées manuellement dans le tableau historique.</p>
                                                <p><strong>Exemple concret :</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>Vous aviez modifié manuellement l'EPS de 2020 de 2.50$ à 2.75$</li>
                                                    <li>FMP retourne 2.50$ pour 2020</li>
                                                    <li>Avec cette option : 2.75$ → 2.50$ (remplacé, même si manuel)</li>
                                                    <li>Sans cette option : 2.75$ → 2.75$ (préservé car manuel)</li>
                                                </ul>
                                                <p><strong>Champs affectés :</strong> Toutes les données historiques (EPS, CF, BV, Dividendes, Prix High/Low) pour toutes les années</p>
                                                <p><strong>Outil :</strong> Merge intelligent avec <code className="bg-white px-1 rounded">forceReplace = true</code></p>
                                                <p><strong>⚠️ Attention :</strong> Cette option est destructive et ne peut pas être annulée facilement. Assurez-vous d'avoir activé la sauvegarde avant sync.</p>
                                            </div>
                                        </HelpSection>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Options détaillées */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                Options Détaillées de Synchronisation
                            </h4>

                            <div className="space-y-3">
                                {/* Synchroniser données historiques */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.syncData}
                                            onChange={(e) => setOptions(prev => ({ ...prev, syncData: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                📊 Synchroniser les données historiques
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                États financiers, prix historiques, métriques (30 ans d'historique)
                                            </p>
                                            <HelpSection 
                                                id="syncData" 
                                                title="Synchronisation des données historiques"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Récupère les données financières historiques depuis FMP API (30 ans d'historique) et les fusionne avec les données existantes.</p>
                                                    <p><strong>Données synchronisées :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>EPS (Earnings Per Share)</strong> : Bénéfices par action par année</li>
                                                        <li><strong>CF (Cash Flow Per Share)</strong> : Flux de trésorerie par action</li>
                                                        <li><strong>BV (Book Value Per Share)</strong> : Valeur comptable par action</li>
                                                        <li><strong>Dividendes</strong> : Dividendes par action</li>
                                                        <li><strong>Prix High/Low</strong> : Prix maximum et minimum par année</li>
                                                    </ul>
                                                    <p><strong>Exemple concret :</strong> Si vous avez des données jusqu'en 2020 et que FMP a des données jusqu'en 2024, les années 2021-2024 seront ajoutées automatiquement.</p>
                                                    <p><strong>Outil :</strong> FMP API Premium - Endpoint <code className="bg-white px-1 rounded">/api/v3/income-statement</code>, <code className="bg-white px-1 rounded">/api/v3/cash-flow-statement</code>, <code className="bg-white px-1 rounded">/api/v3/balance-sheet-statement</code></p>
                                                    <p><strong>Séquence :</strong> Appel API → Parse JSON → Merge avec données existantes → Tri par année</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser uniquement nouvelles années */}
                                {options.syncData && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.syncOnlyNewYears}
                                                onChange={(e) => setOptions(prev => ({ ...prev, syncOnlyNewYears: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    🆕 Synchroniser uniquement les nouvelles années
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    N'ajoute que les années manquantes, ne modifie pas les années existantes
                                                </p>
                                                <HelpSection 
                                                    id="syncOnlyNewYears" 
                                                    title="Synchronisation uniquement des nouvelles années"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Compare les années existantes avec les années disponibles dans FMP et n'ajoute que les années manquantes. Les années existantes ne sont pas modifiées, même si les données FMP sont différentes.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Vous avez des données pour 2015-2020</li>
                                                            <li>FMP a des données pour 2010-2024</li>
                                                            <li>Avec cette option : Ajoute uniquement 2010-2014 et 2021-2024</li>
                                                            <li>Sans cette option : Met à jour toutes les années 2015-2020 aussi</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Plus rapide, préserve toutes vos modifications manuelles sur les années existantes</p>
                                                          <p><strong>Outil :</strong> Algorithme de comparaison d'années avec <code className="bg-white px-1 rounded">{'mergedData.some(row => row.year === newRow.year)'}</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Synchroniser uniquement métriques manquantes */}
                                {options.syncData && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.syncOnlyMissingMetrics}
                                                onChange={(e) => setOptions(prev => ({ ...prev, syncOnlyMissingMetrics: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    🔍 Synchroniser uniquement les métriques manquantes
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Ne remplit que les champs vides (0 ou null), préserve les valeurs existantes
                                                </p>
                                                <HelpSection 
                                                    id="syncOnlyMissingMetrics" 
                                                    title="Synchronisation uniquement des métriques manquantes"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Pour chaque année, ne remplit que les champs qui sont actuellement vides (0, null, ou undefined). Les champs avec des valeurs existantes sont préservés.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Année 2020 : EPS = 2.50$ (existant), CF = 0 (manquant)</li>
                                                            <li>FMP retourne : EPS = 2.50$, CF = 3.20$</li>
                                                            <li>Avec cette option : EPS reste 2.50$, CF devient 3.20$</li>
                                                            <li>Sans cette option : EPS devient 2.50$, CF devient 3.20$ (même si identique)</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Permet de compléter progressivement les données sans écraser ce qui existe déjà</p>
                                                        <p><strong>Outil :</strong> Condition <code className="bg-white px-1 rounded">existingValue === 0 || existingValue === null || existingValue === undefined</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Synchroniser assumptions */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.syncAssumptions}
                                            onChange={(e) => setOptions(prev => ({ ...prev, syncAssumptions: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                🎯 Synchroniser les assumptions (hypothèses)
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Taux de croissance, ratios cibles, année de base, dividende actuel
                                            </p>
                                            <HelpSection 
                                                id="syncAssumptions" 
                                                title="Synchronisation des assumptions"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Recalcule les hypothèses de valorisation basées sur les données historiques FMP.</p>
                                                    <p><strong>Assumptions calculées :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>Taux de croissance (CAGR 5 ans) :</strong> growthRateEPS, growthRateCF, growthRateBV, growthRateDiv</li>
                                                        <li><strong>Ratios cibles (moyenne 5 ans) :</strong> targetPE, targetPCF, targetPBV, targetYield</li>
                                                        <li><strong>Année de base :</strong> Dernière année avec EPS valide</li>
                                                        <li><strong>Dividende actuel :</strong> Dernier dividende par action</li>
                                                    </ul>
                                                    <p><strong>Exemple concret :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li>Données FMP : EPS 2019=2.00$, EPS 2024=2.80$</li>
                                                        <li>Calcul CAGR : ((2.80/2.00)^(1/5) - 1) * 100 = 6.96%</li>
                                                        <li>Résultat : growthRateEPS = 6.96%</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">autoFillAssumptionsFromFMPData()</code> avec calculs CAGR et moyennes</p>
                                                    <p><strong>Formule CAGR :</strong> <code className="bg-white px-1 rounded">((ValeurFinale/ValeurInitiale)^(1/Années) - 1) * 100</code></p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Préserver exclusions */}
                                {options.syncAssumptions && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.preserveExclusions}
                                                onChange={(e) => setOptions(prev => ({ ...prev, preserveExclusions: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    🚫 Préserver les exclusions de métriques
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Maintient les checkboxes d'exclusion (EPS, CF, BV, DIV) même après recalcul
                                                </p>
                                                <HelpSection 
                                                    id="preserveExclusions" 
                                                    title="Préservation des exclusions de métriques"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Les flags d'exclusion (excludeEPS, excludeCF, excludeBV, excludeDIV) sont préservés même si la détection d'outliers les recalculerait différemment.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Vous avez exclu EPS manuellement (excludeEPS = true)</li>
                                                            <li>La détection d'outliers recalcule et trouve que EPS n'est plus aberrant</li>
                                                            <li>Avec cette option : excludeEPS reste true (préservé)</li>
                                                            <li>Sans cette option : excludeEPS devient false (recalculé)</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Vous gardez le contrôle sur quelles métriques utiliser pour la valorisation</p>
                                                        <p><strong>Outil :</strong> Préservation des flags <code className="bg-white px-1 rounded">excludeEPS</code>, <code className="bg-white px-1 rounded">excludeCF</code>, etc. dans <code className="bg-white px-1 rounded">finalAssumptions</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Recalculer outliers */}
                                {options.syncAssumptions && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.recalculateOutliers}
                                                onChange={(e) => setOptions(prev => ({ ...prev, recalculateOutliers: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    📊 Recalculer la détection d'outliers
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Identifie automatiquement les métriques qui produisent des prix cibles aberrants
                                                </p>
                                                <HelpSection 
                                                    id="recalculateOutliers" 
                                                    title="Recalcul de la détection d'outliers"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                          <p><strong>Comportement :</strong> Analyse chaque métrique (EPS, CF, BV, DIV) et calcule le prix cible. Si le prix cible est aberrant (négatif, {'>'} 10x le prix actuel, etc.), la métrique est automatiquement exclue.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Prix actuel : 100$</li>
                                                            <li>Calcul prix cible EPS : -50$ (aberrant, EPS négatif ou croissance impossible)</li>
                                                            <li>Résultat : excludeEPS = true (métrique exclue automatiquement)</li>
                                                            <li>Calcul prix cible CF : 150$ (normal)</li>
                                                            <li>Résultat : excludeCF = false (métrique utilisée)</li>
                                                        </ul>
                                                        <p><strong>Critères d'aberration :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Prix cible négatif</li>
                                                              <li>Prix cible {'>'} 10x le prix actuel</li>
                                                              <li>Prix cible {'<'} 0.1x le prix actuel</li>
                                                            <li>Données insuffisantes pour calculer</li>
                                                        </ul>
                                                        <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">detectOutlierMetrics()</code> avec seuils configurables</p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Mettre à jour prix actuel */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.updateCurrentPrice}
                                            onChange={(e) => setOptions(prev => ({ ...prev, updateCurrentPrice: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                💰 Mettre à jour le prix actuel
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Met à jour le prix actuel depuis FMP (toujours activé par défaut)
                                            </p>
                                            <HelpSection 
                                                id="updateCurrentPrice" 
                                                title="Mise à jour du prix actuel"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Récupère le prix actuel depuis FMP API et met à jour l'assumption <code className="bg-white px-1 rounded">currentPrice</code>.</p>
                                                    <p><strong>Exemple concret :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li>Prix actuel dans l'app : 150.00$</li>
                                                        <li>Prix FMP : 152.50$</li>
                                                        <li>Avec cette option : 150.00$ → 152.50$ (mis à jour)</li>
                                                        <li>Sans cette option : 150.00$ → 150.00$ (préservé)</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> FMP API - Endpoint <code className="bg-white px-1 rounded">/api/v3/quote</code> ou <code className="bg-white px-1 rounded">/api/v3/profile</code></p>
                                                    <p><strong>Recommandation :</strong> Toujours activer pour avoir les prix à jour</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser infos */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.syncInfo}
                                            onChange={(e) => setOptions(prev => ({ ...prev, syncInfo: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                ℹ️ Synchroniser les informations de profil
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Nom de l'entreprise, secteur, logo, beta, capitalisation boursière
                                            </p>
                                            <HelpSection 
                                                id="syncInfo" 
                                                title="Synchronisation des informations de profil"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Met à jour les informations générales de l'entreprise depuis FMP API.</p>
                                                    <p><strong>Informations synchronisées :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>Nom de l'entreprise</strong> : Nom complet (ex: "Apple Inc.")</li>
                                                        <li><strong>Secteur</strong> : Secteur d'activité (ex: "Technology")</li>
                                                        <li><strong>Logo</strong> : URL du logo de l'entreprise</li>
                                                        <li><strong>Beta</strong> : Coefficient bêta (volatilité relative au marché)</li>
                                                        <li><strong>Capitalisation</strong> : Market Cap en USD</li>
                                                        <li><strong>Pays/Bourse</strong> : Localisation et bourse principale</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> FMP API - Endpoint <code className="bg-white px-1 rounded">/api/v3/profile</code></p>
                                                    <p><strong>Note :</strong> Les métriques ValueLine (Security Rank, Earnings Predictability) sont préservées et rechargées depuis Supabase séparément.</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser métriques ValueLine */}
                                {options.syncInfo && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.syncValueLineMetrics}
                                                onChange={(e) => setOptions(prev => ({ ...prev, syncValueLineMetrics: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    ⭐ Synchroniser les métriques ValueLine depuis Supabase
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Recharge Security Rank, Earnings Predictability, etc. depuis la base de données
                                                </p>
                                                <HelpSection 
                                                    id="syncValueLineMetrics" 
                                                    title="Synchronisation des métriques ValueLine"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Recharge les métriques ValueLine depuis Supabase pour garantir la cohérence multi-utilisateurs. Ces métriques ne sont pas disponibles dans FMP.</p>
                                                        <p><strong>Métriques ValueLine :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li><strong>Security Rank</strong> : Classement de sécurité (1-5, 1 = meilleur)</li>
                                                            <li><strong>Earnings Predictability</strong> : Prédictibilité des bénéfices (A-E, A = meilleur)</li>
                                                            <li><strong>Price Growth Persistence</strong> : Persistance de la croissance du prix</li>
                                                            <li><strong>Price Stability</strong> : Stabilité du prix</li>
                                                        </ul>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Valeur locale : Security Rank = "2"</li>
                                                            <li>Valeur Supabase : Security Rank = "1" (mise à jour par un autre utilisateur)</li>
                                                            <li>Avec cette option : Security Rank devient "1" (synchronisé)</li>
                                                            <li>Sans cette option : Security Rank reste "2" (local)</li>
                                                        </ul>
                                                        <p><strong>Outil :</strong> API Supabase - Table <code className="bg-white px-1 rounded">tickers</code> avec colonnes <code className="bg-white px-1 rounded">security_rank</code>, <code className="bg-white px-1 rounded">earnings_predictability</code>, etc.</p>
                                                        <p><strong>Recommandation :</strong> Toujours activer pour avoir les dernières métriques ValueLine partagées</p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info sur synchronisation tous tickers */}
                        {isBulkSync && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-start gap-3">
                                    <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">
                                            Synchronisation en masse
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Cette synchronisation traitera tous les tickers de votre portefeuille et watchlist.
                                            Le processus peut prendre plusieurs minutes selon le nombre de tickers.
                                        </p>
                                        <HelpSection 
                                            id="bulkSync" 
                                            title="Synchronisation en masse - Détails techniques"
                                            showHelp={showHelp}
                                            setShowHelp={setShowHelp}
                                        >
                                            <div className="space-y-2">
                                                <p><strong>Processus :</strong></p>
                                                <ol className="list-decimal list-inside ml-2 space-y-1">
                                                    <li>Traitement par batch de 5 tickers en parallèle</li>
                                                    <li>Délai de 500ms entre chaque batch</li>
                                                    <li>Timeout de 30 secondes par ticker</li>
                                                    <li>Sauvegarde snapshot avant chaque sync (si activé)</li>
                                                    <li>Appel FMP API pour chaque ticker</li>
                                                    <li>Merge intelligent des données</li>
                                                    <li>Recalcul des assumptions</li>
                                                    <li>Détection d'outliers</li>
                                                    <li>Sauvegarde snapshot après sync</li>
                                                </ol>
                                                <p><strong>Exemple de timing :</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>10 tickers : ~2-3 minutes</li>
                                                    <li>50 tickers : ~10-15 minutes</li>
                                                    <li>100 tickers : ~20-30 minutes</li>
                                                </ul>
                                                <p><strong>Contrôles disponibles :</strong> Pause, Resume, Stop pendant la synchronisation</p>
                                            </div>
                                        </HelpSection>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        disabled={isSyncing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Annuler
                    </button>

                    <div className="flex gap-2">
                        {/* Bouton sync rapide (sans options) */}
                        <button
                            onClick={() => onConfirm({
                                saveBeforeSync: true,
                                replaceOrangeData: false,
                                syncAllTickers: isBulkSync,
                                syncData: true,
                                syncAssumptions: true,
                                syncInfo: true,
                                forceReplace: false,
                                syncOnlyNewYears: false,
                                syncOnlyMissingMetrics: false,
                                preserveExclusions: true,
                                recalculateOutliers: true,
                                updateCurrentPrice: true,
                                syncValueLineMetrics: true
                            })}
                            disabled={isSyncing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sync Rapide
                        </button>

                        {/* Bouton sync avec options */}
                        <button
                            onClick={() => onConfirm(options)}
                            disabled={isSyncing || (!options.syncData && !options.syncAssumptions && !options.syncInfo)}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSyncing ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Synchronisation...
                                </>
                            ) : (
                                <>
                                    <ArrowPathIcon className="w-4 h-4" />
                                    Synchroniser avec Options
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
