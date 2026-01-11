import React, { useEffect, useState } from 'react';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SupabaseLoadingProgressProps {
  isLoading: boolean;
  current: number;
  total: number;
  startTime: number | null;
  message?: string;
}

export const SupabaseLoadingProgress: React.FC<SupabaseLoadingProgressProps> = ({
  isLoading,
  current,
  total,
  startTime,
  message
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Calculer le temps écoulé et estimé
  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsedTime(0);
      setEstimatedTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Calculer le temps estimé restant basé sur la progression
      if (current > 0 && total > 0) {
        const progress = current / total;
        if (progress > 0) {
          const estimatedTotal = Math.floor(elapsed / progress);
          const remaining = Math.max(0, estimatedTotal - elapsed);
          setEstimatedTimeRemaining(remaining);
        }
      }
    }, 100); // Mise à jour toutes les 100ms pour fluidité

    return () => clearInterval(interval);
  }, [isLoading, startTime, current, total]);

  if (!isLoading && current === 0) {
    return null;
  }

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed top-20 right-4 z-[10000] bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 min-w-[320px] max-w-[400px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-blue-600 animate-spin" />
          <h3 className="font-semibold text-gray-800">
            {isLoading ? 'Chargement Supabase' : 'Chargement terminé'}
          </h3>
        </div>
        {!isLoading && (
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
        )}
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {current} / {total} tickers
          </span>
          <span className="text-sm font-bold text-blue-600">
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Informations de temps */}
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>⏱️ Temps écoulé:</span>
          <span className="font-semibold text-gray-800">{formatTime(elapsedTime)}</span>
        </div>
        {isLoading && estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
          <div className="flex items-center justify-between">
            <span>⏳ Temps restant (est.):</span>
            <span className="font-semibold text-gray-800">{formatTime(estimatedTimeRemaining)}</span>
          </div>
        )}
        {message && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 italic">{message}</span>
          </div>
        )}
      </div>

      {/* Détails de progression */}
      {isLoading && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {current === 0 && 'Initialisation...'}
            {current > 0 && current < total && `Chargement des données pour ${current} ticker(s)...`}
            {current === total && 'Finalisation...'}
          </div>
        </div>
      )}
    </div>
  );
};
