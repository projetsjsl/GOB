import React from 'react';
import { ExclamationTriangleIcon, LockClosedIcon, LockOpenIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface HistoricalVersionBannerProps {
    snapshotDate: string;
    snapshotVersion: number;
    isLocked: boolean;
    onUnlock: () => void;
    onRevertToCurrent: () => void;
    onSaveAsNew: () => void;
}

export const HistoricalVersionBanner: React.FC<HistoricalVersionBannerProps> = ({
    snapshotDate,
    snapshotVersion,
    isLocked,
    onUnlock,
    onRevertToCurrent,
    onSaveAsNew
}) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-yellow-50 border-b-2 border-yellow-300 p-4 print:hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-4">
                    {/* Warning Message */}
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">
                                {isLocked ? (
                                    <span className="flex items-center gap-2">
                                        <LockClosedIcon className="w-4 h-4" />
                                        Version historique (v{snapshotVersion}) - Lecture seule
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <LockOpenIcon className="w-4 h-4" />
                                        Version historique (v{snapshotVersion}) - Déverrouillée
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                                {formatDate(snapshotDate)}
                                {!isLocked && ' • Les modifications seront sauvegardées sur cette ancienne version'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isLocked ? (
                            <>
                                <button
                                    onClick={onUnlock}
                                    className="px-3 py-1.5 text-sm font-medium text-yellow-800 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 transition-colors flex items-center gap-1.5"
                                >
                                    <LockOpenIcon className="w-4 h-4" />
                                    Déverrouiller
                                </button>
                                <button
                                    onClick={onSaveAsNew}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    💾 Sauvegarder comme nouvelle
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onSaveAsNew}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    💾 Sauvegarder (ancienne version)
                                </button>
                            </>
                        )}

                        <button
                            onClick={onRevertToCurrent}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        >
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                            Revenir à la version actuelle
                        </button>
                    </div>
                </div>

                {/* Unlock Warning (shown when unlocking) */}
                {!isLocked && (
                    <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ Attention: Vous modifiez une version datée du {formatDate(snapshotDate)}.
                        Les changements seront enregistrés sur cette ancienne version, pas la version actuelle.
                    </div>
                )}
            </div>
        </div>
    );
};
