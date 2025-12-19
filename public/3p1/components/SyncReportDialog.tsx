/**
 * Rapport détaillé de synchronisation en masse
 * Affiche toutes les informations de synchronisation par ticker
 */

import React, { useMemo } from 'react';
import { 
    XMarkIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    InformationCircleIcon,
    ClockIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export interface TickerSyncResult {
    ticker: string;
    success: boolean;
    error?: string;
    timeMs: number;
    dataRetrieved: {
        years: number;
        dataPoints: number;
        hasProfile: boolean;
        hasKeyMetrics: boolean;
        hasQuotes: boolean;
        hasFinancials: boolean;
    };
    outliers: {
        detected: string[];
        excluded: {
            EPS: boolean;
            CF: boolean;
            BV: boolean;
            DIV: boolean;
        };
        reasons: {
            [key: string]: string;
        };
    };
    orangeData: {
        growthRateEPS?: number;
        growthRateCF?: number;
        growthRateBV?: number;
        growthRateDiv?: number;
        targetPE?: number;
        targetPCF?: number;
        targetPBV?: number;
        targetYield?: number;
        wasReplaced: boolean;
    };
    currentPrice: number;
    zeroData: {
        earningsPerShare: number;
        cashFlowPerShare: number;
        bookValuePerShare: number;
        dividendPerShare: number;
        reasons: {
            [key: string]: string;
        };
    };
    naData: {
        fields: string[];
        reasons: {
            [key: string]: string;
        };
    };
    other: {
        snapshotSaved: boolean;
        assumptionsUpdated: boolean;
        infoUpdated: boolean;
        valueLineMetricsSynced: boolean;
    };
}

export interface SyncReportData {
    startTime: number;
    endTime: number;
    totalTickers: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    options: any;
    tickerResults: TickerSyncResult[];
    globalStats: {
        avgTimePerTicker: number;
        totalDataPoints: number;
        totalOutliersDetected: number;
        totalOrangeDataReplaced: number;
    };
}

interface SyncReportDialogProps {
    isOpen: boolean;
    reportData: SyncReportData | null;
    onClose: () => void;
}

export const SyncReportDialog: React.FC<SyncReportDialogProps> = ({
    isOpen,
    reportData,
    onClose
}) => {
    const [expandedTickers, setExpandedTickers] = React.useState<Set<string>>(new Set());
    const [filter, setFilter] = React.useState<'all' | 'success' | 'error' | 'skipped'>('all');
    const [sortBy, setSortBy] = React.useState<'ticker' | 'time' | 'status'>('ticker');

    const toggleTicker = (ticker: string) => {
        setExpandedTickers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticker)) {
                newSet.delete(ticker);
            } else {
                newSet.add(ticker);
            }
            return newSet;
        });
    };

    const filteredResults = useMemo(() => {
        if (!reportData) return [];
        
        let filtered = reportData.tickerResults;
        
        if (filter === 'success') {
            filtered = filtered.filter(r => r.success);
        } else if (filter === 'error') {
            filtered = filtered.filter(r => !r.success && !r.error?.includes('introuvable'));
        } else if (filter === 'skipped') {
            filtered = filtered.filter(r => !r.success && r.error?.includes('introuvable'));
        }
        
        // Trier
        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'ticker') {
                return a.ticker.localeCompare(b.ticker);
            } else if (sortBy === 'time') {
                return b.timeMs - a.timeMs;
            } else {
                // Par statut: success d'abord
                if (a.success !== b.success) {
                    return a.success ? -1 : 1;
                }
                return a.ticker.localeCompare(b.ticker);
            }
        });
        
        return filtered;
    }, [reportData, filter, sortBy]);

    if (!isOpen || !reportData) return null;

    const duration = reportData.endTime - reportData.startTime;
    const successRate = ((reportData.successCount / reportData.totalTickers) * 100).toFixed(1);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full my-8 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <ChartBarIcon className="w-8 h-8 text-blue-600" />
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                Rapport de Synchronisation
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(reportData.startTime).toLocaleString('fr-FR')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Résumé Global */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Total Tickers</div>
                            <div className="text-2xl font-bold text-gray-900">{reportData.totalTickers}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-sm text-green-600">Succès</div>
                            <div className="text-2xl font-bold text-green-700">{reportData.successCount}</div>
                            <div className="text-xs text-green-600 mt-1">{successRate}%</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="text-sm text-red-600">Erreurs</div>
                            <div className="text-2xl font-bold text-red-700">{reportData.errorCount}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-sm text-yellow-600">Ignorés</div>
                            <div className="text-2xl font-bold text-yellow-700">{reportData.skippedCount}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Durée Totale</div>
                            <div className="text-xl font-bold text-gray-900">
                                {Math.floor(duration / 1000)}s
                            </div>
                            <div className="text-xs text-gray-500">
                                ({Math.floor(duration / 60000)}m {Math.floor((duration % 60000) / 1000)}s)
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Temps Moyen/Ticker</div>
                            <div className="text-xl font-bold text-gray-900">
                                {reportData.globalStats.avgTimePerTicker.toFixed(0)}ms
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Points de Données</div>
                            <div className="text-xl font-bold text-gray-900">
                                {reportData.globalStats.totalDataPoints.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Outliers Détectés</div>
                            <div className="text-xl font-bold text-gray-900">
                                {reportData.globalStats.totalOutliersDetected}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtres et Tri */}
                <div className="p-4 border-b border-gray-200 bg-white sticky top-[140px] z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Filtrer:</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                            >
                                <option value="all">Tous</option>
                                <option value="success">Succès</option>
                                <option value="error">Erreurs</option>
                                <option value="skipped">Ignorés</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Trier par:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                            >
                                <option value="ticker">Ticker</option>
                                <option value="time">Temps</option>
                                <option value="status">Statut</option>
                            </select>
                        </div>
                        <div className="ml-auto text-sm text-gray-500">
                            {filteredResults.length} ticker(s) affiché(s)
                        </div>
                    </div>
                </div>

                {/* Liste des Tickers */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {filteredResults.map((result) => (
                            <TickerResultCard
                                key={result.ticker}
                                result={result}
                                isExpanded={expandedTickers.has(result.ticker)}
                                onToggle={() => toggleTicker(result.ticker)}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

interface TickerResultCardProps {
    result: TickerSyncResult;
    isExpanded: boolean;
    onToggle: () => void;
}

const TickerResultCard: React.FC<TickerResultCardProps> = ({ result, isExpanded, onToggle }) => {
    const hasOutliers = result.outliers.detected.length > 0;
    const hasZeroData = Object.values(result.zeroData).some(v => v > 0);
    const hasNaData = result.naData.fields.length > 0;
    const hasOrangeData = Object.values(result.orangeData).some(v => typeof v === 'number' && v !== 0);

    return (
        <div className={`border rounded-lg ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {/* Header du ticker */}
            <div 
                className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {result.success ? (
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        ) : (
                            <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                        )}
                        <div>
                            <div className="font-bold text-lg">{result.ticker}</div>
                            <div className="text-sm text-gray-500">
                                {result.success ? 'Synchronisé avec succès' : result.error || 'Erreur'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Temps</div>
                            <div className="font-semibold">{result.timeMs}ms</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasOutliers && (
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" title="Outliers détectés" />
                            )}
                            {hasZeroData && (
                                <InformationCircleIcon className="w-5 h-5 text-blue-600" title="Données à zéro" />
                            )}
                            {hasNaData && (
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" title="Données N/A" />
                            )}
                        </div>
                        <div className="text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Détails expandables */}
            {isExpanded && result.success && (
                <div className="p-4 pt-0 border-t border-gray-200 bg-white space-y-4">
                    {/* Prix et Données Récupérées */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Prix Actuel</div>
                            <div className="text-lg font-bold text-gray-900">
                                ${result.currentPrice.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Années de Données</div>
                            <div className="text-lg font-bold text-gray-900">
                                {result.dataRetrieved.years}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Points de Données</div>
                            <div className="text-lg font-bold text-gray-900">
                                {result.dataRetrieved.dataPoints}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Sources</div>
                            <div className="text-sm text-gray-700">
                                {result.dataRetrieved.hasProfile && '✅ Profile '}
                                {result.dataRetrieved.hasKeyMetrics && '✅ Metrics '}
                                {result.dataRetrieved.hasQuotes && '✅ Quotes '}
                                {result.dataRetrieved.hasFinancials && '✅ Financials'}
                            </div>
                        </div>
                    </div>

                    {/* Outliers */}
                    {hasOutliers && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                                <div className="font-semibold text-yellow-900">
                                    Métriques Aberrantes Détectées
                                </div>
                            </div>
                            <div className="space-y-2">
                                {result.outliers.detected.map(metric => (
                                    <div key={metric} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{metric}</span>
                                        <span className="text-yellow-700">
                                            {result.outliers.excluded[metric as keyof typeof result.outliers.excluded] ? '❌ Exclue' : '⚠️ Détectée'}
                                        </span>
                                        {result.outliers.reasons[metric] && (
                                            <span className="text-xs text-yellow-600 ml-2">
                                                ({result.outliers.reasons[metric]})
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cases Orange */}
                    {hasOrangeData && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                                <div className="font-semibold text-orange-900">
                                    Cases Orange (Assumptions)
                                </div>
                                {result.orangeData.wasReplaced && (
                                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                                        Recalculées
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {result.orangeData.growthRateEPS !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Croissance EPS</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.growthRateEPS.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.growthRateCF !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Croissance CF</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.growthRateCF.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.growthRateBV !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Croissance BV</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.growthRateBV.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.growthRateDiv !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Croissance DIV</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.growthRateDiv.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.targetPE !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Target P/E</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.targetPE.toFixed(1)}x
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.targetPCF !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Target P/CF</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.targetPCF.toFixed(1)}x
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.targetPBV !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Target P/BV</div>
                                        <div className="font-semibold text-orange-700">
                                            {result.orangeData.targetPBV.toFixed(1)}x
                                        </div>
                                    </div>
                                )}
                                {result.orangeData.targetYield !== undefined && (
                                    <div>
                                        <div className="text-gray-600">Target Yield</div>
                                        <div className="font-semibold text-orange-700">
                                            {(result.orangeData.targetYield * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Données à Zéro */}
                    {hasZeroData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                                <div className="font-semibold text-blue-900">
                                    Données à Zéro
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                {result.zeroData.earningsPerShare > 0 && (
                                    <div>
                                        <span className="font-medium">EPS: {result.zeroData.earningsPerShare} années</span>
                                        {result.zeroData.reasons.earningsPerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.earningsPerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {result.zeroData.cashFlowPerShare > 0 && (
                                    <div>
                                        <span className="font-medium">CF: {result.zeroData.cashFlowPerShare} années</span>
                                        {result.zeroData.reasons.cashFlowPerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.cashFlowPerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {result.zeroData.bookValuePerShare > 0 && (
                                    <div>
                                        <span className="font-medium">BV: {result.zeroData.bookValuePerShare} années</span>
                                        {result.zeroData.reasons.bookValuePerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.bookValuePerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {result.zeroData.dividendPerShare > 0 && (
                                    <div>
                                        <span className="font-medium">DIV: {result.zeroData.dividendPerShare} années</span>
                                        {result.zeroData.reasons.dividendPerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.dividendPerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Données N/A */}
                    {hasNaData && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                <div className="font-semibold text-gray-900">
                                    Données N/A
                                </div>
                            </div>
                            <div className="space-y-1 text-sm">
                                {result.naData.fields.map(field => (
                                    <div key={field}>
                                        <span className="font-medium">{field}</span>
                                        {result.naData.reasons[field] && (
                                            <span className="text-gray-600 ml-2">
                                                - {result.naData.reasons[field]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Autres Informations */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="font-semibold text-gray-900 mb-2">Autres Informations</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                {result.other.snapshotSaved ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Snapshot sauvegardé</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {result.other.assumptionsUpdated ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Assumptions mises à jour</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {result.other.infoUpdated ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Info mise à jour</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {result.other.valueLineMetricsSynced ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Métriques ValueLine</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

