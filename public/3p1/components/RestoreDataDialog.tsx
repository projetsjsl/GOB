import React from 'react';
import { XMarkIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface RestoreDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreFromSnapshot: () => void;
  onRecalculateFromFMP: () => void;
  latestSnapshotDate?: string;
  isLoading?: boolean;
}

export const RestoreDataDialog: React.FC<RestoreDataDialogProps> = ({
  isOpen,
  onClose,
  onRestoreFromSnapshot,
  onRecalculateFromFMP,
  latestSnapshotDate,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Restaurer les données
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Choisissez comment restaurer les données de ce ticker :
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: Restore from Snapshot */}
          <button
            onClick={() => {
              onRestoreFromSnapshot();
              onClose();
            }}
            disabled={isLoading}
            className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Depuis la dernière sauvegarde
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Restaure les données et métriques de la dernière version sauvegardée (snapshot).
                </p>
                {latestSnapshotDate && (
                  <p className="text-xs text-gray-500">
                    Dernière sauvegarde : {new Date(latestSnapshotDate).toLocaleString('fr-CA')}
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* Option 2: Recalculate from FMP */}
          <button
            onClick={() => {
              onRecalculateFromFMP();
              onClose();
            }}
            disabled={isLoading}
            className="w-full p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowPathIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Recalculer depuis FMP
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Récupère les données FMP et recalcule automatiquement toutes les métriques (comme lors d'un nouvel ajout de ticker).
                </p>
                <p className="text-xs text-gray-500">
                  Les métriques seront recalculées selon les bonnes pratiques (CAGR, ratios moyens, etc.)
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};





