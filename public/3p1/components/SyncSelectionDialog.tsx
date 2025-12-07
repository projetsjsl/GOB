import React, { useState, useMemo } from 'react';
import { XMarkIcon, StarIcon, EyeIcon, ArrowPathIcon, ExclamationTriangleIcon, FunnelIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { AnalysisProfile } from '../types';
import { calculateRecommendation } from '../utils/calculations';

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
  | 'sector'        // Par secteur
  | 'recommendation' // Par recommandation
  | 'metric'        // Par métrique (JPEGY, Ratio 3:1, etc.)
  | 'performance'   // Par performance (Top/Bottom)
  | 'status'        // Par statut (approuvé, squelette)
  | 'combined'      // Filtres combinés
  | 'custom';       // Sélection manuelle

type MetricFilter = 'jpegy' | 'ratio31' | 'return' | 'volatility' | 'pe' | 'yield';
type MetricRange = '<' | 'between' | '>';

export const SyncSelectionDialog: React.FC<SyncSelectionDialogProps> = ({
  isOpen,
  profiles,
  onClose,
  onConfirm,
  isSyncing = false
}) => {
  const [selectedFilter, setSelectedFilter] = useState<SyncFilter>('all');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<MetricFilter>('jpegy');
  const [metricRange, setMetricRange] = useState<MetricRange>('<');
  const [metricValue1, setMetricValue1] = useState<string>('10');
  const [metricValue2, setMetricValue2] = useState<string>('20');
  const [performanceType, setPerformanceType] = useState<'top' | 'bottom'>('top');
  const [performanceCount, setPerformanceCount] = useState<string>('10');
  const [statusFilter, setStatusFilter] = useState<'approved' | 'not-approved' | 'skeleton'>('not-approved');
  const [combinedFilters, setCombinedFilters] = useState<{
    portfolio?: boolean;
    watchlist?: boolean;
    sector?: string;
    recommendation?: string;
  }>({});
  const [customSelection, setCustomSelection] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculer les métriques complètes pour tous les profils
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

      // Calculer Ratio 3:1
      const { recommendation, targetPrice } = calculateRecommendation(profile.data, profile.assumptions);
      const upsidePotential = targetPrice > 0 && currentPrice > 0 
        ? ((targetPrice - currentPrice) / currentPrice) * 100 
        : 0;
      const downsideRisk = Math.abs(upsidePotential < 0 ? upsidePotential : 0);
      const ratio31 = downsideRisk > 0 ? upsidePotential / downsideRisk : 0;

      // Calculer Return %
      const totalReturnPercent = targetPrice > 0 && currentPrice > 0
        ? ((targetPrice - currentPrice) / currentPrice) * 100
        : 0;

      // Calculer volatilité (simplifié - écart-type des prix historiques)
      const prices = profile.data.map(d => (d.priceHigh + d.priceLow) / 2).filter(p => p > 0);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance) / avgPrice * 100; // En pourcentage

      const hasInvalidData = currentPrice <= 0 || !isFinite(currentPrice) || jpegy === null;

      return {
        profile,
        hasInvalidData,
        jpegy,
        ratio31: isFinite(ratio31) ? ratio31 : null,
        returnPercent: isFinite(totalReturnPercent) ? totalReturnPercent : null,
        volatility: isFinite(volatility) ? volatility : null,
        currentPE: safeBasePE,
        currentYield: safeBaseYield,
        recommendation,
        targetPrice
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

  // Extraire les recommandations uniques
  const recommendations = useMemo(() => {
    const recSet = new Set<string>();
    profileMetrics.forEach(m => {
      if (m.recommendation) {
        recSet.add(m.recommendation);
      }
    });
    return Array.from(recSet).sort();
  }, [profileMetrics]);

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
      case 'recommendation':
        if (selectedRecommendation) {
          filtered = filtered.filter(m => m.recommendation === selectedRecommendation);
        }
        break;
      case 'metric':
        filtered = filtered.filter(m => {
          let value: number | null = null;
          switch (selectedMetric) {
            case 'jpegy':
              value = m.jpegy;
              break;
            case 'ratio31':
              value = m.ratio31;
              break;
            case 'return':
              value = m.returnPercent;
              break;
            case 'volatility':
              value = m.volatility;
              break;
            case 'pe':
              value = m.currentPE;
              break;
            case 'yield':
              value = m.currentYield;
              break;
          }
          
          if (value === null) return false;
          
          const val1 = parseFloat(metricValue1) || 0;
          const val2 = parseFloat(metricValue2) || 0;
          
          switch (metricRange) {
            case '<':
              return value < val1;
            case '>':
              return value > val1;
            case 'between':
              return value >= Math.min(val1, val2) && value <= Math.max(val1, val2);
            default:
              return false;
          }
        });
        break;
      case 'performance':
        const count = parseInt(performanceCount) || 10;
        const sorted = [...filtered].sort((a, b) => {
          let valA = 0, valB = 0;
          switch (selectedMetric) {
            case 'jpegy':
              valA = a.jpegy || 0;
              valB = b.jpegy || 0;
              break;
            case 'ratio31':
              valA = a.ratio31 || 0;
              valB = b.ratio31 || 0;
              break;
            case 'return':
              valA = a.returnPercent || 0;
              valB = b.returnPercent || 0;
              break;
            case 'volatility':
              valA = a.volatility || 0;
              valB = b.volatility || 0;
              break;
            case 'pe':
              valA = a.currentPE || 0;
              valB = b.currentPE || 0;
              break;
            case 'yield':
              valA = a.currentYield || 0;
              valB = b.currentYield || 0;
              break;
          }
          return performanceType === 'top' ? valB - valA : valA - valB;
        });
        filtered = sorted.slice(0, count);
        break;
      case 'status':
        if (statusFilter === 'skeleton') {
          filtered = filtered.filter(m => m.profile._isSkeleton);
        } else if (statusFilter === 'approved') {
          // Note: Vous devrez ajouter un champ hasApprovedVersion dans profileMetrics
          filtered = filtered.filter(m => !m.profile._isSkeleton);
        } else {
          filtered = filtered.filter(m => !m.profile._isSkeleton);
        }
        break;
      case 'combined':
        if (combinedFilters.portfolio) {
          filtered = filtered.filter(m => !m.profile.isWatchlist);
        }
        if (combinedFilters.watchlist) {
          filtered = filtered.filter(m => m.profile.isWatchlist);
        }
        if (combinedFilters.sector) {
          filtered = filtered.filter(m => m.profile.info.sector === combinedFilters.sector);
        }
        if (combinedFilters.recommendation) {
          filtered = filtered.filter(m => m.recommendation === combinedFilters.recommendation);
        }
        break;
      case 'custom':
        filtered = filtered.filter(m => customSelection.has(m.profile.id));
        break;
      case 'all':
      default:
        // Pas de filtre
        break;
    }

    return filtered.map(m => m.profile.id);
  }, [
    selectedFilter, selectedSector, selectedRecommendation, selectedMetric, 
    metricRange, metricValue1, metricValue2, performanceType, performanceCount,
    statusFilter, combinedFilters, customSelection, profileMetrics
  ]);

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
      case 'recommendation': return 'Par recommandation';
      case 'metric': return 'Par métrique';
      case 'performance': return 'Par performance';
      case 'status': return 'Par statut';
      case 'combined': return 'Filtres combinés';
      case 'custom': return 'Sélection manuelle';
      default: return '';
    }
  };

  const getMetricLabel = (metric: MetricFilter): string => {
    switch (metric) {
      case 'jpegy': return 'JPEGY';
      case 'ratio31': return 'Ratio 3:1';
      case 'return': return 'Return %';
      case 'volatility': return 'Volatilité %';
      case 'pe': return 'P/E';
      case 'yield': return 'Yield %';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative my-8">
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
          <FunnelIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Synchronisation avec critères avancés
          </h2>
        </div>

        {/* Toggle avancé */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Choisissez les critères pour sélectionner les tickers à synchroniser :
          </p>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ChartBarIcon className="w-4 h-4" />
            {showAdvanced ? 'Options simples' : 'Options avancées'}
          </button>
        </div>

        {/* Options de filtrage */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {/* Tous */}
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: selectedFilter === 'all' ? '#2563eb' : '#e5e7eb' }}>
            <input
              type="radio"
              name="syncFilter"
              value="all"
              checked={selectedFilter === 'all'}
              onChange={() => setSelectedFilter('all')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Tous les tickers</div>
              <div className="text-xs text-gray-500">{profiles.length} ticker(s)</div>
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
              onChange={() => setSelectedFilter('portfolio')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2 flex-1">
              <StarIcon className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-semibold text-gray-900">Portefeuille (étoiles)</div>
                <div className="text-xs text-gray-500">{profileMetrics.filter(m => !m.profile.isWatchlist).length} ticker(s)</div>
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
              onChange={() => setSelectedFilter('watchlist')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2 flex-1">
              <EyeIcon className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-semibold text-gray-900">Watchlist (œil)</div>
                <div className="text-xs text-gray-500">{profileMetrics.filter(m => m.profile.isWatchlist).length} ticker(s)</div>
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
              onChange={() => setSelectedFilter('na')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2 flex-1">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
              <div>
                <div className="font-semibold text-gray-900">Tickers avec N/A</div>
                <div className="text-xs text-gray-500">{profileMetrics.filter(m => m.hasInvalidData || m.jpegy === null).length} ticker(s)</div>
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
                onChange={() => setSelectedFilter('sector')}
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

          {/* Par recommandation */}
          <div>
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: selectedFilter === 'recommendation' ? '#2563eb' : '#e5e7eb' }}>
              <input
                type="radio"
                name="syncFilter"
                value="recommendation"
                checked={selectedFilter === 'recommendation'}
                onChange={() => setSelectedFilter('recommendation')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Par recommandation</div>
                <div className="text-xs text-gray-500">
                  {selectedRecommendation 
                    ? `${profileMetrics.filter(m => m.recommendation === selectedRecommendation).length} ticker(s) avec "${selectedRecommendation}"`
                    : 'Sélectionnez une recommandation'}
                </div>
              </div>
            </label>
            
            {selectedFilter === 'recommendation' && (
              <div className="mt-2 ml-7">
                <select
                  value={selectedRecommendation}
                  onChange={(e) => setSelectedRecommendation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Sélectionnez une recommandation --</option>
                  {recommendations.map(rec => {
                    const count = profileMetrics.filter(m => m.recommendation === rec).length;
                    const emoji = rec === 'ACHAT' ? '🟢' : rec === 'CONSERVER' ? '🟡' : rec === 'VENTE' ? '🔴' : '⚪';
                    return (
                      <option key={rec} value={rec}>
                        {emoji} {rec} ({count} tickers)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Options avancées */}
          {showAdvanced && (
            <>
              {/* Par métrique avec plage */}
              <div>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: selectedFilter === 'metric' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="syncFilter"
                    value="metric"
                    checked={selectedFilter === 'metric'}
                    onChange={() => setSelectedFilter('metric')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Par métrique (plage de valeurs)</div>
                    <div className="text-xs text-gray-500">Filtrer par JPEGY, Ratio 3:1, Return %, etc.</div>
                  </div>
                </label>
                
                {selectedFilter === 'metric' && (
                  <div className="mt-2 ml-7 space-y-2">
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value as MetricFilter)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="jpegy">JPEGY</option>
                      <option value="ratio31">Ratio 3:1</option>
                      <option value="return">Return %</option>
                      <option value="volatility">Volatilité %</option>
                      <option value="pe">P/E</option>
                      <option value="yield">Yield %</option>
                    </select>
                    <div className="flex gap-2 items-center">
                      <select
                        value={metricRange}
                        onChange={(e) => setMetricRange(e.target.value as MetricRange)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="<">&lt;</option>
                        <option value=">">&gt;</option>
                        <option value="between">Entre</option>
                      </select>
                      <input
                        type="number"
                        value={metricValue1}
                        onChange={(e) => setMetricValue1(e.target.value)}
                        placeholder="Valeur"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      {metricRange === 'between' && (
                        <input
                          type="number"
                          value={metricValue2}
                          onChange={(e) => setMetricValue2(e.target.value)}
                          placeholder="et"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Par performance (Top/Bottom) */}
              <div>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: selectedFilter === 'performance' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="syncFilter"
                    value="performance"
                    checked={selectedFilter === 'performance'}
                    onChange={() => setSelectedFilter('performance')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Par performance (Top/Bottom)</div>
                    <div className="text-xs text-gray-500">Top 10 ou Bottom 10 par métrique</div>
                  </div>
                </label>
                
                {selectedFilter === 'performance' && (
                  <div className="mt-2 ml-7 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={performanceType}
                        onChange={(e) => setPerformanceType(e.target.value as 'top' | 'bottom')}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                      <input
                        type="number"
                        value={performanceCount}
                        onChange={(e) => setPerformanceCount(e.target.value)}
                        placeholder="Nombre"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value as MetricFilter)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="jpegy">JPEGY</option>
                      <option value="ratio31">Ratio 3:1</option>
                      <option value="return">Return %</option>
                      <option value="volatility">Volatilité %</option>
                      <option value="pe">P/E</option>
                      <option value="yield">Yield %</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Par statut */}
              <div>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: selectedFilter === 'status' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="syncFilter"
                    value="status"
                    checked={selectedFilter === 'status'}
                    onChange={() => setSelectedFilter('status')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Par statut</div>
                    <div className="text-xs text-gray-500">Approuvé, non approuvé, ou squelette</div>
                  </div>
                </label>
                
                {selectedFilter === 'status' && (
                  <div className="mt-2 ml-7">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="skeleton">Squelette (données incomplètes)</option>
                      <option value="not-approved">Non approuvé</option>
                      <option value="approved">Approuvé</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Filtres combinés */}
              <div>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: selectedFilter === 'combined' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="syncFilter"
                    value="combined"
                    checked={selectedFilter === 'combined'}
                    onChange={() => setSelectedFilter('combined')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Filtres combinés</div>
                    <div className="text-xs text-gray-500">Combiner plusieurs critères</div>
                  </div>
                </label>
                
                {selectedFilter === 'combined' && (
                  <div className="mt-2 ml-7 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={combinedFilters.portfolio || false}
                        onChange={(e) => setCombinedFilters({ ...combinedFilters, portfolio: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Portefeuille (étoiles)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={combinedFilters.watchlist || false}
                        onChange={(e) => setCombinedFilters({ ...combinedFilters, watchlist: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Watchlist (œil)</span>
                    </label>
                    <select
                      value={combinedFilters.sector || ''}
                      onChange={(e) => setCombinedFilters({ ...combinedFilters, sector: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">-- Secteur (optionnel) --</option>
                      {sectors.map(sector => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                    <select
                      value={combinedFilters.recommendation || ''}
                      onChange={(e) => setCombinedFilters({ ...combinedFilters, recommendation: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">-- Recommandation (optionnel) --</option>
                      {recommendations.map(rec => (
                        <option key={rec} value={rec}>{rec}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sélection manuelle */}
              <div>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: selectedFilter === 'custom' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="syncFilter"
                    value="custom"
                    checked={selectedFilter === 'custom'}
                    onChange={() => setSelectedFilter('custom')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Sélection manuelle</div>
                    <div className="text-xs text-gray-500">{customSelection.size} ticker(s) sélectionné(s)</div>
                  </div>
                </label>
                
                {selectedFilter === 'custom' && (
                  <div className="mt-2 ml-7 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {profiles.map(profile => (
                      <label key={profile.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customSelection.has(profile.id)}
                          onChange={(e) => {
                            const newSelection = new Set(customSelection);
                            if (e.target.checked) {
                              newSelection.add(profile.id);
                            } else {
                              newSelection.delete(profile.id);
                            }
                            setCustomSelection(newSelection);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{profile.id}</span>
                        {profile.info.name && (
                          <span className="text-xs text-gray-500">({profile.info.name})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
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
