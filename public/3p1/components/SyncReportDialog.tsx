/**
 * Rapport detaille de synchronisation en masse
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
    ExclamationCircleIcon,
    ArrowDownTrayIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { OPTION_METADATA, SyncOptions } from './AdvancedSyncDialog';

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
    onRetryTicker?: (ticker: string) => void;
    onRetryFailed?: () => void;
}

export const SyncReportDialog: React.FC<SyncReportDialogProps> = ({
    isOpen,
    reportData,
    onClose,
    onRetryTicker,
    onRetryFailed
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

    // Fonction d'export CSV
    const exportToCSV = () => {
        if (!reportData) return;

        const headers = [
            'Ticker',
            'Statut',
            'Temps (ms)',
            'Prix Actuel',
            'Annees de Donnees',
            'Points de Donnees',
            'Outliers Detectes',
            'Outliers Exclus',
            'Cases Orange Recalculees',
            'Donnees EPS a Zero',
            'Donnees CF a Zero',
            'Donnees BV a Zero',
            'Donnees DIV a Zero',
            'Donnees N/A',
            'Snapshot Sauvegarde',
            'Assumptions Mises a Jour',
            'Info Mise a Jour',
            'ValueLine Synced',
            'Erreur'
        ];

        const rows = reportData.tickerResults.map(result => [
            result.ticker,
            result.success ? 'Succes' : 'Erreur',
            result.timeMs.toString(),
            result.currentPrice > 0 ? `$${result.currentPrice.toFixed(2)}` : 'N/A',
            result.dataRetrieved?.years?.toString() || '0',
            result.dataRetrieved?.dataPoints?.toString() || '0',
            result.outliers?.detected?.join('; ') || '',
            Object.entries(result.outliers?.excluded || {})
                .filter(([_, excluded]) => excluded)
                .map(([metric]) => metric)
                .join('; ') || '',
            result.orangeData?.wasReplaced ? 'Oui' : 'Non',
            result.zeroData?.earningsPerShare?.toString() || '0',
            result.zeroData?.cashFlowPerShare?.toString() || '0',
            result.zeroData?.bookValuePerShare?.toString() || '0',
            result.zeroData?.dividendPerShare?.toString() || '0',
            result.naData?.fields?.join('; ') || '',
            result.other?.snapshotSaved ? 'Oui' : 'Non',
            result.other?.assumptionsUpdated ? 'Oui' : 'Non',
            result.other?.infoUpdated ? 'Oui' : 'Non',
            result.other?.valueLineMetricsSynced ? 'Oui' : 'Non',
            result.error || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Echapper les guillemets et les virgules
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sync-report-${new Date(reportData.startTime).toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Fonction d'export JSON
    const exportToJSON = () => {
        if (!reportData) return;

        const jsonContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sync-report-${new Date(reportData.startTime).toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                    <div className="flex items-center gap-2">
                        {/* Boutons d'export */}
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                            title="Exporter en CSV"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={exportToJSON}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            title="Exporter en JSON"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                            JSON
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Resume Global */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Total Tickers</div>
                            <div className="text-2xl font-bold text-gray-900">{reportData.totalTickers}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-sm text-green-600">Succes</div>
                            <div className="text-2xl font-bold text-green-700">{reportData.successCount}</div>
                            <div className="text-xs text-green-600 mt-1">{successRate}%</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="text-sm text-red-600">Erreurs</div>
                            <div className="text-2xl font-bold text-red-700">{reportData.errorCount}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-sm text-yellow-600">Ignores</div>
                            <div className="text-2xl font-bold text-yellow-700">{reportData.skippedCount}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Duree Totale</div>
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
                            <div className="text-sm text-gray-500">Points de Donnees</div>
                            <div className="text-xl font-bold text-gray-900">
                                {reportData.globalStats.totalDataPoints.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500">Outliers Detectes</div>
                            <div className="text-xl font-bold text-gray-900">
                                {reportData.globalStats.totalOutliersDetected}
                            </div>
                        </div>
                    </div>

                    {/*  Section Options Utilisees avec Temps et Utilite */}
                    {reportData.options && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                Options de Synchronisation Utilisees
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(reportData.options as SyncOptions).map(([key, value]) => {
                                    if (!value || key === 'syncAllTickers') return null; // Ignorer les options desactivees et syncAllTickers
                                    const metadata = OPTION_METADATA[key as keyof SyncOptions];
                                    if (!metadata) return null;
                                    
                                    const getUtilityColor = (utility: string) => {
                                        const colors = {
                                            essentiel: 'bg-red-100 text-red-800 border-red-300',
                                            recommande: 'bg-blue-100 text-blue-800 border-blue-300',
                                            optionnel: 'bg-gray-100 text-gray-800 border-gray-300',
                                            avance: 'bg-purple-100 text-purple-800 border-purple-300'
                                        };
                                        return colors[utility as keyof typeof colors] || colors.optionnel;
                                    };
                                    
                                    return (
                                        <div key={key} className="bg-white p-3 rounded border border-gray-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium text-gray-700 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getUtilityColor(metadata.utility)}`}>
                                                    {metadata.utility}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {metadata.timeDescription}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 italic">
                                                {metadata.utilityDescription}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Graphiques */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Graphique en barres - Temps de traitement par ticker (top 10) */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Temps de Traitement (Top 10)</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart
                                    data={filteredResults
                                        .sort((a, b) => b.timeMs - a.timeMs)
                                        .slice(0, 10)
                                        .map(r => ({
                                            ticker: r.ticker,
                                            temps: r.timeMs,
                                            statut: r.success ? 'Succes' : 'Erreur'
                                        }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="ticker" angle={-45} textAnchor="end" height={80} />
                                    <YAxis label={{ value: 'Temps (ms)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value: number) => `${value}ms`} />
                                    <Bar dataKey="temps" fill="#3b82f6">
                                        {filteredResults
                                            .sort((a, b) => b.timeMs - a.timeMs)
                                            .slice(0, 10)
                                            .map((r, index) => (
                                                <Cell key={`cell-${index}`} fill={r.success ? '#3b82f6' : '#ef4444'} />
                                            ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Graphique en camembert - Repartition succes/erreurs/ignores */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Repartition des Resultats</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Succes', value: reportData.successCount, color: '#10b981' },
                                            { name: 'Erreurs', value: reportData.errorCount, color: '#ef4444' },
                                            { name: 'Ignores', value: reportData.skippedCount, color: '#f59e0b' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Succes', value: reportData.successCount, color: '#10b981' },
                                            { name: 'Erreurs', value: reportData.errorCount, color: '#ef4444' },
                                            { name: 'Ignores', value: reportData.skippedCount, color: '#f59e0b' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
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
                                <option value="success">Succes</option>
                                <option value="error">Erreurs</option>
                                <option value="skipped">Ignores</option>
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
                            {filteredResults.length} ticker(s) affiche(s)
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
                                onRetry={onRetryTicker}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex gap-2">
                        {reportData.errorCount > 0 && onRetryFailed && (
                            <button
                                onClick={() => {
                                    onRetryFailed();
                                    onClose();
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                                Reessayer les Echecs ({reportData.errorCount})
                            </button>
                        )}
                    </div>
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
    onRetry?: (ticker: string) => void;
}

const TickerResultCard: React.FC<TickerResultCardProps> = ({ result, isExpanded, onToggle, onRetry }) => {
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
                                {result.success ? 'Synchronise avec succes' : result.error || 'Erreur'}
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
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" title="Outliers detectes" />
                            )}
                            {hasZeroData && (
                                <InformationCircleIcon className="w-5 h-5 text-blue-600" title="Donnees a zero" />
                            )}
                            {hasNaData && (
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" title="Donnees N/A" />
                            )}
                        </div>
                        <div className="text-gray-400">
                            {isExpanded ? '' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details expandables */}
            {isExpanded && result.success && (
                <div className="p-4 pt-0 border-t border-gray-200 bg-white space-y-4">
                    {/* Prix et Donnees Recuperees */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Prix Actuel</div>
                            <div className="text-lg font-bold text-gray-900">
                                ${result.currentPrice.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Annees de Donnees</div>
                            <div className="text-lg font-bold text-gray-900">
                                {result.dataRetrieved.years}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Points de Donnees</div>
                            <div className="text-lg font-bold text-gray-900">
                                {result.dataRetrieved.dataPoints}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Sources</div>
                            <div className="text-sm text-gray-700">
                                {result.dataRetrieved.hasProfile && ' Profile '}
                                {result.dataRetrieved.hasKeyMetrics && ' Metrics '}
                                {result.dataRetrieved.hasQuotes && ' Quotes '}
                                {result.dataRetrieved.hasFinancials && ' Financials'}
                            </div>
                        </div>
                    </div>

                    {/* Outliers */}
                    {hasOutliers && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                                <div className="font-semibold text-yellow-900">
                                    Metriques Aberrantes Detectees
                                </div>
                            </div>
                            <div className="space-y-2">
                                {result.outliers.detected.map(metric => (
                                    <div key={metric} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{metric}</span>
                                        <span className="text-yellow-700">
                                            {result.outliers.excluded[metric as keyof typeof result.outliers.excluded] ? ' Exclue' : ' Detectee'}
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
                                        Recalculees
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

                    {/* Donnees a Zero */}
                    {hasZeroData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                                <div className="font-semibold text-blue-900">
                                    Donnees a Zero
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                {result.zeroData.earningsPerShare > 0 && (
                                    <div>
                                        <span className="font-medium">EPS: {result.zeroData.earningsPerShare} annees</span>
                                        {result.zeroData.reasons.earningsPerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.earningsPerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {result.zeroData.cashFlowPerShare > 0 && (
                                    <div>
                                        <span className="font-medium">CF: {result.zeroData.cashFlowPerShare} annees</span>
                                        {result.zeroData.reasons.cashFlowPerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.cashFlowPerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {result.zeroData.bookValuePerShare > 0 && (
                                    <div>
                                        <span className="font-medium">BV: {result.zeroData.bookValuePerShare} annees</span>
                                        {result.zeroData.reasons.bookValuePerShare && (
                                            <span className="text-blue-700 ml-2">
                                                ({result.zeroData.reasons.bookValuePerShare})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {result.zeroData.dividendPerShare > 0 && (
                                    <div>
                                        <span className="font-medium">DIV: {result.zeroData.dividendPerShare} annees</span>
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

                    {/* Donnees N/A */}
                    {hasNaData && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                <div className="font-semibold text-gray-900">
                                    Donnees N/A
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
                                <span>Snapshot sauvegarde</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {result.other.assumptionsUpdated ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Assumptions mises a jour</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {result.other.infoUpdated ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Info mise a jour</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {result.other.valueLineMetricsSynced ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span>Metriques ValueLine</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Correctives */}
                    {!result.success && onRetry && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-red-900 mb-1">Action Corrective</div>
                                    <div className="text-sm text-red-700">
                                        {result.error || 'Erreur inconnue'}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRetry(result.ticker);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <ArrowPathIcon className="w-4 h-4" />
                                    Reessayer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

