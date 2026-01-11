/**
 * Overlay de verrouillage pendant la synchronisation
 * Bloque toute interaction avec l'interface jusqu'à la fin de la synchronisation
 */

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XCircleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SyncLockOverlayProps {
  isActive: boolean;
  current: number;
  total: number;
  successCount: number;
  errorCount: number;
  currentTicker?: string;
  onAbort?: () => void;
}

export const SyncLockOverlay: React.FC<SyncLockOverlayProps> = ({
  isActive,
  current,
  total,
  successCount,
  errorCount,
  currentTicker,
  onAbort
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  if (!isActive || total === 0) return null;

  const percentage = Math.min((current / total) * 100, 100);
  const remaining = total - current;
  const avgTimePerTicker = current > 0 ? elapsedTime / current : 0;
  const estimatedTimeRemaining = remaining * avgTimePerTicker;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      {/* Overlay plein écran qui bloque toute interaction */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[20000] flex items-center justify-center pointer-events-auto"
        style={{ 
          cursor: 'not-allowed',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          // Empêcher toute navigation au clavier
          if (e.key !== 'Escape' || !onAbort) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* Panneau de progression centré */}
        <div 
          className="bg-white rounded-2xl shadow-2xl border-4 border-blue-500 p-6 sm:p-8 max-w-md w-full mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Synchronisation en cours
                </h2>
                <p className="text-sm text-gray-600">
                  Veuillez patienter...
                </p>
              </div>
            </div>
            {onAbort && (
              <button
                onClick={onAbort}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Arrêter la synchronisation"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Ticker actuel */}
          {currentTicker && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 font-semibold mb-1">
                Ticker en cours
              </div>
              <div className="text-lg font-bold text-blue-900">
                {currentTicker}
              </div>
            </div>
          )}

          {/* Barre de progression principale */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Progression
              </span>
              <span className="text-sm font-bold text-blue-600">
                {current} / {total} ({Math.round(percentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                style={{ width: `${percentage}%` }}
              >
                {percentage > 10 && (
                  <span className="text-xs font-bold text-white">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barres de succès/erreur */}
          {(successCount > 0 || errorCount > 0) && (
            <div className="mb-4 flex gap-2 h-2">
              {successCount > 0 && (
                <div
                  className="bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(successCount / total) * 100}%` }}
                  title={`${successCount} réussies`}
                />
              )}
              {errorCount > 0 && (
                <div
                  className="bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${(errorCount / total) * 100}%` }}
                  title={`${errorCount} erreurs`}
                />
              )}
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Réussies
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {successCount}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <XCircleIcon className="w-5 h-5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">
                  Erreurs
                </span>
              </div>
              <div className="text-2xl font-bold text-red-900">
                {errorCount}
              </div>
            </div>
          </div>

          {/* Informations de temps */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-gray-600">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>Temps écoulé:</span>
              </div>
              <span className="font-semibold">{formatTime(elapsedTime)}</span>
            </div>
            {estimatedTimeRemaining > 0 && remaining > 0 && (
              <div className="flex items-center justify-between text-gray-600">
                <span>Temps estimé restant:</span>
                <span className="font-semibold">{formatTime(Math.ceil(estimatedTimeRemaining))}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-600">
              <span>Tickers restants:</span>
              <span className="font-semibold">{remaining}</span>
            </div>
          </div>

          {/* Message d'avertissement */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              ⚠️ L'interface est verrouillée pendant la synchronisation. 
              Veuillez ne pas naviguer ni modifier les données.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
