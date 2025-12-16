import React from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface SyncProgressBarProps {
  current: number;
  total: number;
  isActive: boolean;
  successCount?: number;
  errorCount?: number;
}

export const SyncProgressBar: React.FC<SyncProgressBarProps> = ({
  current,
  total,
  isActive,
  successCount = 0,
  errorCount = 0
}) => {
  if (!isActive || total === 0) return null;

  const percentage = Math.min((current / total) * 100, 100);
  const successPercentage = total > 0 ? (successCount / total) * 100 : 0;
  const errorPercentage = total > 0 ? (errorCount / total) * 100 : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 z-[9999] min-w-[320px] max-w-[400px]">
      <div className="flex items-center gap-3 mb-3">
        <ArrowPathIcon className={`w-5 h-5 text-blue-600 ${isActive ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            Synchronisation en cours
          </div>
          <div className="text-xs text-gray-600">
            {current} / {total} tickers traités
          </div>
        </div>
      </div>

      {/* Barre de progression principale */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Barres de succès/erreur */}
      {(successCount > 0 || errorCount > 0) && (
        <div className="flex gap-1 h-1.5 mb-2">
          {successCount > 0 && (
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${successPercentage}%` }}
              title={`${successCount} réussies`}
            />
          )}
          {errorCount > 0 && (
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${errorPercentage}%` }}
              title={`${errorCount} erreurs`}
            />
          )}
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
        <div className="flex items-center gap-1">
          {successCount > 0 && (
            <>
              <CheckCircleIcon className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-semibold">{successCount}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {errorCount > 0 && (
            <>
              <XCircleIcon className="w-3 h-3 text-red-600" />
              <span className="text-red-600 font-semibold">{errorCount}</span>
            </>
          )}
        </div>
        <div className="text-gray-500">
          {total - current} restants
        </div>
      </div>

      {/* Estimation du temps restant */}
      {current > 0 && current < total && (
        <div className="text-xs text-gray-500 mt-2 italic">
          ~{Math.ceil((total - current) * 0.5)} secondes restantes
        </div>
      )}
    </div>
  );
};








