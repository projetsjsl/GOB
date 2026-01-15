import React from 'react';
import { XMarkIcon, InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SyncDetails {
    timestamp: string;
    source: 'fmp' | 'supabase' | 'manual';
    dataRetrieved?: {
        years: number;
        dataPoints: number;
        hasProfile: boolean;
        hasKeyMetrics: boolean;
        hasQuotes: boolean;
        hasFinancials: boolean;
    };
    outliers?: {
        detected: string[];
        excluded: { EPS: boolean; CF: boolean; BV: boolean; DIV: boolean };
        reasons: { [key: string]: string };
    };
    orangeData?: {
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
    zeroData?: {
        earningsPerShare: number;
        cashFlowPerShare: number;
        bookValuePerShare: number;
        dividendPerShare: number;
        reasons: {
            earningsPerShare?: string;
            cashFlowPerShare?: string;
            bookValuePerShare?: string;
            dividendPerShare?: string;
        };
    };
    naData?: {
        fields: string[];
        reasons: { [key: string]: string };
    };
    other?: {
        snapshotSaved: boolean;
        assumptionsUpdated: boolean;
        infoUpdated: boolean;
        valueLineMetricsSynced: boolean;
    };
    options?: {
        saveBeforeSync?: boolean;
        replaceOrangeData?: boolean;
        syncData?: boolean;
        syncAssumptions?: boolean;
        syncInfo?: boolean;
        syncValueLineMetrics?: boolean;
    };
    duration?: number; // en millisecondes
    success?: boolean;
    error?: string;
}

interface SyncDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    syncDetails: SyncDetails | null;
}

export const SyncDetailsDialog: React.FC<SyncDetailsDialogProps> = ({
    isOpen,
    onClose,
    ticker,
    syncDetails
}) => {
    if (!isOpen || !syncDetails) return null;

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}min`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-CA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Details de Synchronisation - {ticker}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {formatDate(syncDetails.timestamp)}
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

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        {syncDetails.success !== false ? (
                            <>
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-semibold text-green-700">Synchronisation reussie</span>
                            </>
                        ) : (
                            <>
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                <span className="text-sm font-semibold text-red-700">Erreur de synchronisation</span>
                            </>
                        )}
                        {syncDetails.duration && (
                            <span className="text-xs text-gray-500 ml-2">
                                <ClockIcon className="w-4 h-4 inline mr-1" />
                                {formatDuration(syncDetails.duration)}
                            </span>
                        )}
                    </div>

                    {syncDetails.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800 font-semibold mb-1">Erreur :</p>
                            <p className="text-sm text-red-700">{syncDetails.error}</p>
                        </div>
                    )}

                    {/* Source */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Source de donnees</h3>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                syncDetails.source === 'fmp' ? 'bg-blue-100 text-blue-800' :
                                syncDetails.source === 'supabase' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {syncDetails.source === 'fmp' ? 'FMP API' :
                                 syncDetails.source === 'supabase' ? 'Supabase' :
                                 'Manuel'}
                            </span>
                        </div>
                    </div>

                    {/* Options de synchronisation */}
                    {syncDetails.options && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Options de synchronisation</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(syncDetails.options).map(([key, value]) => (
                                    value && (
                                        <div key={key} className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                            <span className="text-gray-700">{key}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Donnees recuperees */}
                    {syncDetails.dataRetrieved && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Donnees recuperees</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Annees :</span>
                                    <span className="ml-2 font-semibold text-gray-900">{syncDetails.dataRetrieved.years}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Points de donnees :</span>
                                    <span className="ml-2 font-semibold text-gray-900">{syncDetails.dataRetrieved.dataPoints}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Profil :</span>
                                    {syncDetails.dataRetrieved.hasProfile ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Key Metrics :</span>
                                    {syncDetails.dataRetrieved.hasKeyMetrics ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Quotes :</span>
                                    {syncDetails.dataRetrieved.hasQuotes ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Financials :</span>
                                    {syncDetails.dataRetrieved.hasFinancials ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Outliers */}
                    {syncDetails.outliers && syncDetails.outliers.detected.length > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Metriques aberrantes detectees</h3>
                            <div className="space-y-2">
                                {syncDetails.outliers.detected.map((metric) => {
                                    const isExcluded = syncDetails.outliers?.excluded[metric as keyof typeof syncDetails.outliers.excluded];
                                    return (
                                        <div key={metric} className="flex items-start gap-2">
                                            {isExcluded ? (
                                                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5" />
                                            ) : (
                                                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-gray-900">{metric}</span>
                                                {syncDetails.outliers?.reasons[metric] && (
                                                    <p className="text-xs text-gray-600 mt-0.5">
                                                        {syncDetails.outliers.reasons[metric]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Orange Data */}
                    {syncDetails.orangeData && (
                        <div className="bg-orange-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Donnees oranges (Assumptions)
                                {syncDetails.orangeData.wasReplaced && (
                                    <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
                                        Remplacees
                                    </span>
                                )}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {syncDetails.orangeData.growthRateEPS !== undefined && (
                                    <div>
                                        <span className="text-gray-600">Croissance EPS :</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                            {syncDetails.orangeData.growthRateEPS.toFixed(2)}%
                                        </span>
                                    </div>
                                )}
                                {syncDetails.orangeData.growthRateCF !== undefined && (
                                    <div>
                                        <span className="text-gray-600">Croissance CF :</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                            {syncDetails.orangeData.growthRateCF.toFixed(2)}%
                                        </span>
                                    </div>
                                )}
                                {syncDetails.orangeData.targetPE !== undefined && (
                                    <div>
                                        <span className="text-gray-600">P/E Cible :</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                            {syncDetails.orangeData.targetPE.toFixed(1)}x
                                        </span>
                                    </div>
                                )}
                                {syncDetails.orangeData.targetPCF !== undefined && (
                                    <div>
                                        <span className="text-gray-600">P/CF Cible :</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                            {syncDetails.orangeData.targetPCF.toFixed(1)}x
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Zero Data */}
                    {syncDetails.zeroData && (
                        (syncDetails.zeroData.earningsPerShare > 0 ||
                         syncDetails.zeroData.cashFlowPerShare > 0 ||
                         syncDetails.zeroData.bookValuePerShare > 0 ||
                         syncDetails.zeroData.dividendPerShare > 0) && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Donnees a zero</h3>
                                <div className="space-y-2 text-sm">
                                    {syncDetails.zeroData.earningsPerShare > 0 && (
                                        <div>
                                            <span className="text-gray-600">EPS :</span>
                                            <span className="ml-2 font-semibold text-gray-900">
                                                {syncDetails.zeroData.earningsPerShare} annees
                                            </span>
                                            {syncDetails.zeroData.reasons.earningsPerShare && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {syncDetails.zeroData.reasons.earningsPerShare}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {syncDetails.zeroData.cashFlowPerShare > 0 && (
                                        <div>
                                            <span className="text-gray-600">CF :</span>
                                            <span className="ml-2 font-semibold text-gray-900">
                                                {syncDetails.zeroData.cashFlowPerShare} annees
                                            </span>
                                            {syncDetails.zeroData.reasons.cashFlowPerShare && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {syncDetails.zeroData.reasons.cashFlowPerShare}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    {/* N/A Data */}
                    {syncDetails.naData && syncDetails.naData.fields.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Donnees N/A</h3>
                            <div className="space-y-2 text-sm">
                                {syncDetails.naData.fields.map((field) => (
                                    <div key={field}>
                                        <span className="text-gray-600">{field} :</span>
                                        {syncDetails.naData?.reasons[field] && (
                                            <span className="ml-2 text-gray-700">
                                                {syncDetails.naData.reasons[field]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Info */}
                    {syncDetails.other && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Autres informations</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    {syncDetails.other.snapshotSaved ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                    <span className="text-gray-700">Snapshot sauvegarde</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {syncDetails.other.assumptionsUpdated ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                    <span className="text-gray-700">Assumptions mises a jour</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {syncDetails.other.infoUpdated ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                    <span className="text-gray-700">Infos mises a jour</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {syncDetails.other.valueLineMetricsSynced ? (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <span className="text-red-500"></span>
                                    )}
                                    <span className="text-gray-700">Metriques ValueLine</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};







