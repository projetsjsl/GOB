import React, { useState, useMemo } from 'react';
import { XMarkIcon, StarIcon, EyeIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AnalysisProfile } from '../types';

interface SyncSelectionDialogProps {
  isOpen: boolean;
  profiles: AnalysisProfile[];
  onClose: () => void;
  onConfirm: (tickers: string[]) => void;
  isSyncing?: boolean;
}

type SyncFilter = 
  | 'all'
  | 'portfolio'      // Étoiles (isWatchlist: false)
  | 'watchlist'     // Œil (isWatchlist: true)
  | 'na'            // Tickers avec N/A
  | 'sector';       // Par secteur

export const SyncSelectionDialog: React.FC<SyncSelectionDialogProps> = ({
  isOpen,
  profiles,
  onClose,
  onConfirm,
  isSyncing = false
}) => {
  const [selectedFilter, setSelectedFilter] = useState<SyncFilter>('all');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [showSectorSelector, setShowSectorSelector] = useState(false);

  // Calculer les métriques pour détecter les N/A
  const profileMetrics = useMemo(() => {
    return profiles.map(profile => {
      const currentPrice = Math.max(profile.assumptions?.currentPrice || 0, 0.01);
      const baseYearData = profile.data.find(d => d.year === profile.assumptions?.baseYear) || profile.data[profile.data.length - 1];
      const baseEPS = Math.max(baseYearData?.earningsPerShare || 0, 0);
      const hasValidEPS = baseEPS > 0.01;
      const basePE = hasValidEPS && currentPrice > 0 ? currentPrice / baseEPS : 0;
      const safeBasePE = basePE > 0 && basePE <= 1000 ? basePE : 0;
      const baseYield = currentPrice > 0 && profile.assumptions.currentDividend >= 0 
        ? (profile.assumptions.currentDividend / currentPrice) * 100 
        : 0;
      const safeBaseYield = Math.max(0, Math.min(baseYield, 50));
      const growthPlusYield = (profile.assumptions.growthRateEPS || 0) + safeBaseYield;
      
      let jpegy: number | null = null;
      if (growthPlusYield > 0.01 && safeBasePE > 0 && hasValidEPS) {
        const rawJPEGY = safeBasePE / growthPlusYield;
        if (isFinite(rawJPEGY) && rawJPEGY >= 0 && rawJPEGY <= 100) {
          jpegy = rawJPEGY;
        }
      }

      const hasInvalidData = currentPrice <= 0 || !isFinite(currentPrice) || jpegy === null;

      return {
        profile,
        hasInvalidData,
        jpegy
      };
    });
  }, [profiles]);

  // Extraire les secteurs uniques
  const sectors = useMemo(() => {
    const sectorSet = new Set<string>();
    profiles.forEach(profile => {
      if (profile.info.sector) {
        sectorSet.add(profile.info.sector);
      }
    });
    return Array.from(sectorSet).sort();
  }, [profiles]);

  // Filtrer les tickers selon les critères
  const filteredTickers = useMemo(() => {
    let filtered = profileMetrics;

    switch (selectedFilter) {
      case 'portfolio':
        filtered = filtered.filter(m => !m.profile.isWatchlist);
        break;
      case 'watchlist':
        filtered = filtered.filter(m => m.profile.isWatchlist);
        break;
      case 'na':
        filtered = filtered.filter(m => m.hasInvalidData || m.jpegy === null);
        break;
      case 'sector':
        if (selectedSector) {
          filtered = filtered.filter(m => m.profile.info.sector === selectedSector);
        }
        break;
      case 'all':
      default:
        // Pas de filtre
        break;
    }

    return filtered.map(m => m.profile.id);
  }, [selectedFilter, selectedSector, profileMetrics]);

  const handleConfirm = () => {
    if (filteredTickers.length === 0) {
      alert('Aucun ticker ne correspond aux critères sélectionnés.');
      return;
    }
    onConfirm(filteredTickers);
  };

  if (!isOpen) return null;

  const getFilterLabel = (filter: SyncFilter): string => {
    switch (filter) {
      case 'all': return 'Tous les tickers';
      case 'portfolio': return 'Portefeuille (étoiles)';
      case 'watchlist': return 'Watchlist (œil)';
      case 'na': return 'Tickers avec N/A';
      case 'sector': return 'Par secteur';
      default: return '';
    }
  };

  const getFilterCount = (filter: SyncFilter): number => {
    switch (filter) {
      case 'portfolio':
        return profileMetrics.filter(m => !m.profile.isWatchlist).length;
      case 'watchlist':
        return profileMetrics.filter(m => m.profile.isWatchlist).length;
      case 'na':
        return profileMetrics.filter(m => m.hasInvalidData || m.jpegy === null).length;
      case 'all':
      default:
        return profiles.length;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isSyncing}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ArrowPathIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Synchroniser avec critères
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">
          Choisissez les critères pour sélectionner les tickers à synchroniser :
        </p>

        {/* Options de filtrage */}
        <div className="space-y-3 mb-6">
          {/* Tous */}
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedFilter === 'all' ? '#2563eb' : '#e5e7eb' }}>
            <input
              type="radio"
              name="syncFilter"
              value="all"
              checked={selectedFilter === 'all'}
              onChange={() => {
                setSelectedFilter('all');
                setShowSectorSelector(false);
              }}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Tous les tickers</div>
              <div className="text-xs text-gray-500">{getFilterCount('all')} ticker(s)</div>
            </div>
          </label>

          {/* Portefeuille */}
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedFilter === 'portfolio' ? '#2563eb' : '#e5e7eb' }}>
            <input
              type="radio"
              name="syncFilter"
              value="portfolio"
              checked={selectedFilter === 'portfolio'}
              onChange={() => {
                setSelectedFilter('portfolio');
                setShowSectorSelector(false);
              }}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2 flex-1">
              <StarIcon className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-semibold text-gray-900">Portefeuille (étoiles)</div>
                <div className="text-xs text-gray-500">{getFilterCount('portfolio')} ticker(s)</div>
              </div>
            </div>
          </label>

          {/* Watchlist */}
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedFilter === 'watchlist' ? '#2563eb' : '#e5e7eb' }}>
            <input
              type="radio"
              name="syncFilter"
              value="watchlist"
              checked={selectedFilter === 'watchlist'}
              onChange={() => {
                setSelectedFilter('watchlist');
                setShowSectorSelector(false);
              }}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2 flex-1">
              <EyeIcon className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-semibold text-gray-900">Watchlist (œil)</div>
                <div className="text-xs text-gray-500">{getFilterCount('watchlist')} ticker(s)</div>
              </div>
            </div>
          </label>

          {/* N/A */}
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedFilter === 'na' ? '#2563eb' : '#e5e7eb' }}>
            <input
              type="radio"
              name="syncFilter"
              value="na"
              checked={selectedFilter === 'na'}
              onChange={() => {
                setSelectedFilter('na');
                setShowSectorSelector(false);
              }}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2 flex-1">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
              <div>
                <div className="font-semibold text-gray-900">Tickers avec N/A</div>
                <div className="text-xs text-gray-500">{getFilterCount('na')} ticker(s)</div>
              </div>
            </div>
          </label>

          {/* Par secteur */}
          <div>
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: selectedFilter === 'sector' ? '#2563eb' : '#e5e7eb' }}>
              <input
                type="radio"
                name="syncFilter"
                value="sector"
                checked={selectedFilter === 'sector'}
                onChange={() => {
                  setSelectedFilter('sector');
                  setShowSectorSelector(true);
                }}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Par secteur</div>
                <div className="text-xs text-gray-500">
                  {selectedSector 
                    ? `${profileMetrics.filter(m => m.profile.info.sector === selectedSector).length} ticker(s) dans "${selectedSector}"`
                    : 'Sélectionnez un secteur'}
                </div>
              </div>
            </label>
            
            {selectedFilter === 'sector' && (
              <div className="mt-2 ml-7">
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Sélectionnez un secteur --</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>
                      {sector} ({profileMetrics.filter(m => m.profile.info.sector === sector).length} tickers)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Résumé */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-semibold text-blue-900 mb-1">
            Tickers sélectionnés : {filteredTickers.length}
          </div>
          {filteredTickers.length > 0 && filteredTickers.length <= 10 && (
            <div className="text-xs text-blue-700 mt-1">
              {filteredTickers.join(', ')}
            </div>
          )}
          {filteredTickers.length > 10 && (
            <div className="text-xs text-blue-700 mt-1">
              {filteredTickers.slice(0, 10).join(', ')} ... et {filteredTickers.length - 10} autres
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSyncing || filteredTickers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSyncing ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-4 h-4" />
                Synchroniser ({filteredTickers.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

