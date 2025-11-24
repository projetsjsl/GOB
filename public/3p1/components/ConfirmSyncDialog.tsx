import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmSyncDialogProps {
    isOpen: boolean;
    ticker: string;
    hasManualData: boolean;
    onCancel: () => void;
    onConfirm: (saveSnapshot: boolean) => void;
}

export const ConfirmSyncDialog: React.FC<ConfirmSyncDialogProps> = ({
    isOpen,
    ticker,
    hasManualData,
    onCancel,
    onConfirm
}) => {
    const [saveBeforeSync, setSaveBeforeSync] = React.useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Synchroniser avec l'API
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Ticker: <span className="font-mono font-semibold">{ticker}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {hasManualData ? (
                        <>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-yellow-800 font-medium">
                                    ⚠️ Vous avez modifié des données manuellement
                                </p>
                                <p className="text-sm text-yellow-700 mt-2">
                                    Charger les données de l'API va <strong>écraser vos modifications</strong>.
                                    Toutes les cellules seront remplacées par les données FMP/Finnhub.
                                </p>
                            </div>

                            {/* Save Option */}
                            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={saveBeforeSync}
                                    onChange={(e) => setSaveBeforeSync(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        💾 Sauvegarder la version actuelle avant sync
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Recommandé: Crée un snapshot de vos modifications avant de charger les nouvelles données.
                                        Vous pourrez restaurer cette version plus tard.
                                    </p>
                                </div>
                            </label>
                        </>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-sm text-blue-800">
                                ℹ️ Aucune modification manuelle détectée. Les données actuelles seront remplacées par les données de l'API.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>

                    {hasManualData && (
                        <button
                            onClick={() => onConfirm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Sync sans sauvegarder
                        </button>
                    )}

                    <button
                        onClick={() => onConfirm(saveBeforeSync)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        {hasManualData && saveBeforeSync ? '💾 Sauvegarder & Sync' : 'Synchroniser'}
                    </button>
                </div>
            </div>
        </div>
    );
};
