import React, { useMemo, useState } from 'react';
import { AnalysisProfile } from '../types';
import { calculateRecommendation } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface KPIDashboardProps {
  profiles: AnalysisProfile[];
  currentId: string;
  onSelect: (id: string) => void;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ profiles, currentId, onSelect }) => {
  const [filters, setFilters] = useState({
    minReturn: -100,
    maxReturn: 500,
    minJPEGY: 0,
    maxJPEGY: 5,
    sector: '',
    recommendation: 'all' as 'all' | 'BUY' | 'HOLD' | 'SELL'
  });

  // Calculer les métriques pour chaque profil
  const profileMetrics = useMemo(() => {
    return profiles.map(profile => {
      const { recommendation, targetPrice } = calculateRecommendation(profile.data, profile.assumptions);
      
      // Calcul JPEGY
      const baseYearData = profile.data.find(d => d.year === profile.assumptions.baseYear) || profile.data[profile.data.length - 1];
      const baseEPS = baseYearData?.earningsPerShare || 0;
      const currentPE = baseEPS > 0 ? profile.assumptions.currentPrice / baseEPS : 0;
      const currentYield = (profile.assumptions.currentDividend / profile.assumptions.currentPrice) * 100;
      const growthPlusYield = profile.assumptions.growthRateEPS + currentYield;
      const jpegy = growthPlusYield > 0 ? currentPE / growthPlusYield : 0;

      // Calcul rendement total potentiel
      const baseValues = {
        eps: baseEPS,
        cf: baseYearData?.cashFlowPerShare || 0,
        bv: baseYearData?.bookValuePerShare || 0,
        div: profile.assumptions.currentDividend || 0
      };

      const projectFutureValue = (current: number, rate: number, years: number): number => {
        return current * Math.pow(1 + rate / 100, years);
      };

      const futureValues = {
        eps: projectFutureValue(baseValues.eps, profile.assumptions.growthRateEPS, 5),
        cf: projectFutureValue(baseValues.cf, profile.assumptions.growthRateCF, 5),
        bv: projectFutureValue(baseValues.bv, profile.assumptions.growthRateBV, 5),
        div: projectFutureValue(baseValues.div, profile.assumptions.growthRateDiv, 5)
      };

      const targets = {
        eps: futureValues.eps * profile.assumptions.targetPE,
        cf: futureValues.cf * profile.assumptions.targetPCF,
        bv: futureValues.bv * profile.assumptions.targetPBV,
        div: profile.assumptions.targetYield > 0 ? futureValues.div / (profile.assumptions.targetYield / 100) : 0
      };

      const validTargets = [
        !profile.assumptions.excludeEPS && targets.eps > 0 ? targets.eps : null,
        !profile.assumptions.excludeCF && targets.cf > 0 ? targets.cf : null,
        !profile.assumptions.excludeBV && targets.bv > 0 ? targets.bv : null,
        !profile.assumptions.excludeDIV && targets.div > 0 ? targets.div : null
      ].filter((t): t is number => t !== null && t > 0);

      const avgTargetPrice = validTargets.length > 0
        ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
        : 0;

      let totalDividends = 0;
      let currentD = baseValues.div;
      for (let i = 0; i < 5; i++) {
        currentD = currentD * (1 + profile.assumptions.growthRateDiv / 100);
        totalDividends += currentD;
      }

      const totalReturnPercent = profile.assumptions.currentPrice > 0
        ? ((avgTargetPrice + totalDividends - profile.assumptions.currentPrice) / profile.assumptions.currentPrice) * 100
        : 0;

      // Calcul ratio 3:1 (potentiel de rendement vs potentiel de baisse)
      const validHistory = profile.data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
      const avgLowPrice = validHistory.length > 0
        ? validHistory.reduce((sum, d) => sum + d.priceLow, 0) / validHistory.length
        : profile.assumptions.currentPrice * 0.7;
      
      const downsideRisk = profile.assumptions.currentPrice > 0
        ? ((profile.assumptions.currentPrice - avgLowPrice * 0.9) / profile.assumptions.currentPrice) * 100
        : 0;
      
      const upsidePotential = totalReturnPercent;
      const ratio31 = downsideRisk > 0 ? upsidePotential / downsideRisk : 0;

      // Vérifier si version approuvée (simulé - à connecter avec la base de données)
      const hasApprovedVersion = false; // TODO: Connecter avec l'API

      return {
        profile,
        recommendation,
        jpegy,
        totalReturnPercent,
        ratio31,
        downsideRisk,
        upsidePotential,
        hasApprovedVersion,
        targetPrice
      };
    });
  }, [profiles]);

  // Filtrer les profils
  const filteredMetrics = useMemo(() => {
    return profileMetrics.filter(metric => {
      if (metric.totalReturnPercent < filters.minReturn || metric.totalReturnPercent > filters.maxReturn) return false;
      if (metric.jpegy < filters.minJPEGY || metric.jpegy > filters.maxJPEGY) return false;
      if (filters.sector && metric.profile.info.sector.toLowerCase() !== filters.sector.toLowerCase()) return false;
      if (filters.recommendation !== 'all' && metric.recommendation !== filters.recommendation) return false;
      return true;
    });
  }, [profileMetrics, filters]);

  // Obtenir la couleur JPEGY
  const getJpegyColor = (jpegy: number): string => {
    if (jpegy <= 0.5) return '#86efac'; // Vert pâle
    if (jpegy <= 1.5) return '#16a34a'; // Vert foncé
    if (jpegy <= 1.75) return '#eab308'; // Jaune
    if (jpegy <= 2.0) return '#f97316'; // Orange
    return '#dc2626'; // Rouge
  };

  // Obtenir la couleur du rendement
  const getReturnColor = (returnPercent: number): string => {
    if (returnPercent >= 50) return '#16a34a'; // Vert foncé
    if (returnPercent >= 20) return '#86efac'; // Vert pâle
    if (returnPercent >= 0) return '#eab308'; // Jaune
    return '#dc2626'; // Rouge
  };

  // Calculer les dimensions du graphique
  const chartWidth = 800;
  const chartHeight = 600;
  const padding = 60;
  const xScale = (jpegy: number) => {
    const maxJPEGY = Math.max(...filteredMetrics.map(m => m.jpegy), 5);
    return padding + ((jpegy / maxJPEGY) * (chartWidth - 2 * padding));
  };
  const yScale = (returnPercent: number) => {
    const minReturn = Math.min(...filteredMetrics.map(m => m.totalReturnPercent), -50);
    const maxReturn = Math.max(...filteredMetrics.map(m => m.totalReturnPercent), 200);
    const range = maxReturn - minReturn;
    return chartHeight - padding - (((returnPercent - minReturn) / range) * (chartHeight - 2 * padding));
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Filtres de Screening</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rendement Min (%)</label>
            <input
              type="number"
              value={filters.minReturn}
              onChange={(e) => setFilters({ ...filters, minReturn: parseFloat(e.target.value) || -100 })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rendement Max (%)</label>
            <input
              type="number"
              value={filters.maxReturn}
              onChange={(e) => setFilters({ ...filters, maxReturn: parseFloat(e.target.value) || 500 })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">JPEGY Min</label>
            <input
              type="number"
              step="0.1"
              value={filters.minJPEGY}
              onChange={(e) => setFilters({ ...filters, minJPEGY: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">JPEGY Max</label>
            <input
              type="number"
              step="0.1"
              value={filters.maxJPEGY}
              onChange={(e) => setFilters({ ...filters, maxJPEGY: parseFloat(e.target.value) || 5 })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Secteur</label>
            <input
              type="text"
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              placeholder="Tous"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Recommandation</label>
            <select
              value={filters.recommendation}
              onChange={(e) => setFilters({ ...filters, recommendation: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="all">Toutes</option>
              <option value="BUY">Achat</option>
              <option value="HOLD">Conserver</option>
              <option value="SELL">Vendre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matrice à carreaux */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Matrice de Performance</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filteredMetrics.map((metric) => (
            <div
              key={metric.profile.id}
              onClick={() => onSelect(metric.profile.id)}
              className={`aspect-square rounded-lg p-2 cursor-pointer transition-all hover:scale-110 border-2 ${
                currentId === metric.profile.id ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200'
              }`}
              style={{
                backgroundColor: getReturnColor(metric.totalReturnPercent),
                opacity: 0.8
              }}
              title={`${metric.profile.id}: ${metric.totalReturnPercent.toFixed(1)}% | JPEGY: ${metric.jpegy.toFixed(2)}`}
            >
              <div className="flex flex-col items-center justify-center h-full text-white text-xs font-bold">
                <div className="text-[10px] mb-1">{metric.profile.id}</div>
                <div className="text-[8px]">{metric.totalReturnPercent.toFixed(0)}%</div>
                {metric.hasApprovedVersion && (
                  <CheckCircleIcon className="w-3 h-3 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique X/Y */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Positionnement JPEGY vs Rendement</h3>
        <div className="overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} className="border border-gray-300 rounded">
            {/* Axes */}
            <line
              x1={padding}
              y1={chartHeight - padding}
              x2={chartWidth - padding}
              y2={chartHeight - padding}
              stroke="#333"
              strokeWidth="2"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={chartHeight - padding}
              stroke="#333"
              strokeWidth="2"
            />
            
            {/* Labels */}
            <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" className="text-xs font-semibold">
              JPEGY
            </text>
            <text
              x={20}
              y={chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 20, ${chartHeight / 2})`}
              className="text-xs font-semibold"
            >
              Rendement Total (%)
            </text>

            {/* Points */}
            {filteredMetrics.map((metric) => {
              const x = xScale(metric.jpegy);
              const y = yScale(metric.totalReturnPercent);
              return (
                <g key={metric.profile.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={currentId === metric.profile.id ? 8 : 6}
                    fill={getJpegyColor(metric.jpegy)}
                    stroke={currentId === metric.profile.id ? '#2563eb' : '#fff'}
                    strokeWidth={currentId === metric.profile.id ? 2 : 1}
                    className="cursor-pointer hover:r-8"
                    onClick={() => onSelect(metric.profile.id)}
                  />
                  {currentId === metric.profile.id && (
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-xs font-bold fill-blue-600"
                    >
                      {metric.profile.id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Tableau de Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Ticker</th>
                <th className="p-2 text-right">JPEGY</th>
                <th className="p-2 text-right">Rendement Total</th>
                <th className="p-2 text-right">Ratio 3:1</th>
                <th className="p-2 text-right">Potentiel Hausse</th>
                <th className="p-2 text-right">Risque Baisse</th>
                <th className="p-2 text-center">Approuvé</th>
                <th className="p-2 text-center">Recommandation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMetrics.map((metric) => (
                <tr
                  key={metric.profile.id}
                  onClick={() => onSelect(metric.profile.id)}
                  className={`cursor-pointer hover:bg-blue-50 ${
                    currentId === metric.profile.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <td className="p-2 font-bold">{metric.profile.id}</td>
                  <td className="p-2 text-right">
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: getJpegyColor(metric.jpegy) }}
                    />
                    {metric.jpegy.toFixed(2)}
                  </td>
                  <td className="p-2 text-right font-semibold" style={{ color: getReturnColor(metric.totalReturnPercent) }}>
                    {metric.totalReturnPercent.toFixed(1)}%
                  </td>
                  <td className="p-2 text-right">{metric.ratio31.toFixed(2)}</td>
                  <td className="p-2 text-right text-green-600">{metric.upsidePotential.toFixed(1)}%</td>
                  <td className="p-2 text-right text-red-600">{metric.downsideRisk.toFixed(1)}%</td>
                  <td className="p-2 text-center">
                    {metric.hasApprovedVersion ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        metric.recommendation === 'BUY' ? 'bg-green-100 text-green-800' :
                        metric.recommendation === 'SELL' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {metric.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

