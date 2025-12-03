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
      const basePE = baseEPS > 0 ? profile.assumptions.currentPrice / baseEPS : 0;
      const baseYield = (profile.assumptions.currentDividend / profile.assumptions.currentPrice) * 100;
      const growthPlusYield = profile.assumptions.growthRateEPS + baseYield;
      const jpegy = growthPlusYield > 0 ? basePE / growthPlusYield : 0;

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
      
      // Calculer des métriques supplémentaires
      const currentPE = basePE; // Réutiliser le P/E calculé plus haut
      const currentPCF = baseYearData?.cashFlowPerShare > 0 
        ? profile.assumptions.currentPrice / baseYearData.cashFlowPerShare 
        : 0;
      const currentPBV = baseYearData?.bookValuePerShare > 0
        ? profile.assumptions.currentPrice / baseYearData.bookValuePerShare
        : 0;
      const currentYield = baseYield; // Réutiliser le yield calculé plus haut
      
      // Calculer la croissance moyenne historique
      const validData = profile.data.filter(d => d.earningsPerShare > 0);
      let historicalGrowth = 0;
      if (validData.length >= 2) {
        const firstEPS = validData[0].earningsPerShare;
        const lastEPS = validData[validData.length - 1].earningsPerShare;
        const years = validData[validData.length - 1].year - validData[0].year;
        if (years > 0 && firstEPS > 0) {
          historicalGrowth = (Math.pow(lastEPS / firstEPS, 1 / years) - 1) * 100;
        }
      }
      
      // Calculer la volatilité (écart-type des rendements historiques)
      const priceChanges = [];
      for (let i = 1; i < validHistory.length; i++) {
        if (validHistory[i].priceHigh > 0 && validHistory[i-1].priceHigh > 0) {
          const change = ((validHistory[i].priceHigh - validHistory[i-1].priceHigh) / validHistory[i-1].priceHigh) * 100;
          priceChanges.push(change);
        }
      }
      const avgChange = priceChanges.length > 0 
        ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length 
        : 0;
      const variance = priceChanges.length > 0
        ? priceChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / priceChanges.length
        : 0;
      const volatility = Math.sqrt(variance);

      return {
        profile,
        recommendation,
        jpegy,
        totalReturnPercent,
        ratio31,
        downsideRisk,
        upsidePotential,
        hasApprovedVersion,
        targetPrice,
        currentPE,
        currentPCF,
        currentPBV,
        currentYield,
        historicalGrowth,
        volatility
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
  const chartWidth = 900;
  const chartHeight = 700;
  const padding = 80;
  
  // Calculer les échelles avec marges
  const maxJPEGY = Math.max(...filteredMetrics.map(m => m.jpegy), 5);
  const minJPEGY = Math.min(...filteredMetrics.map(m => m.jpegy), 0);
  const maxReturn = Math.max(...filteredMetrics.map(m => m.totalReturnPercent), 200);
  const minReturn = Math.min(...filteredMetrics.map(m => m.totalReturnPercent), -50);
  
  const xScale = (jpegy: number) => {
    const range = maxJPEGY - minJPEGY || 1;
    return padding + ((jpegy - minJPEGY) / range) * (chartWidth - 2 * padding);
  };
  
  const yScale = (returnPercent: number) => {
    const range = maxReturn - minReturn || 1;
    return chartHeight - padding - (((returnPercent - minReturn) / range) * (chartHeight - 2 * padding));
  };
  
  // Générer les ticks pour les axes
  const xTicks = [];
  const xTickCount = 10;
  for (let i = 0; i <= xTickCount; i++) {
    const value = minJPEGY + (maxJPEGY - minJPEGY) * (i / xTickCount);
    xTicks.push({ value, position: xScale(value) });
  }
  
  const yTicks = [];
  const yTickCount = 10;
  for (let i = 0; i <= yTickCount; i++) {
    const value = minReturn + (maxReturn - minReturn) * (i / yTickCount);
    yTicks.push({ value, position: yScale(value) });
  }

  // Vérifier si on a des profils
  if (profiles.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Vue KPI Dashboard</h3>
        <p className="text-gray-500 mb-4">Aucun profil disponible pour afficher les KPI.</p>
        <p className="text-sm text-gray-400">Ajoutez des tickers dans la sidebar de gauche pour voir les métriques.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Filtres de Screening</h3>
        <div className="mb-2 text-xs text-gray-500">
          {filteredMetrics.length} titre(s) affiché(s) sur {profileMetrics.length} total
        </div>
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

      {/* Matrice à carreaux Améliorée */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">🎯 Matrice de Performance</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-600"></div>
              <span className="text-gray-600">≥50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-300"></div>
              <span className="text-gray-600">20-50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400"></div>
              <span className="text-gray-600">0-20%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-600"></div>
              <span className="text-gray-600">&lt;0%</span>
            </div>
          </div>
        </div>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {filteredMetrics.map((metric) => (
              <div
                key={metric.profile.id}
                onClick={() => onSelect(metric.profile.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-110 hover:shadow-xl border-2 ${
                  currentId === metric.profile.id ? 'border-blue-600 ring-4 ring-blue-300 shadow-xl' : 'border-gray-200'
                }`}
                style={{
                  backgroundColor: getReturnColor(metric.totalReturnPercent),
                  opacity: currentId === metric.profile.id ? 1 : 0.85
                }}
                title={`${metric.profile.info.name || metric.profile.id}
Rendement: ${metric.totalReturnPercent.toFixed(1)}%
JPEGY: ${metric.jpegy.toFixed(2)}
Ratio 3:1: ${metric.ratio31.toFixed(2)}
P/E: ${metric.currentPE?.toFixed(1) || 'N/A'}x
Secteur: ${metric.profile.info.sector}`}
              >
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <div className="text-xs font-bold mb-1">{metric.profile.id}</div>
                  <div className="text-[10px] font-semibold mb-1">{metric.totalReturnPercent.toFixed(0)}%</div>
                  <div className="text-[8px] opacity-90">JPEGY: {metric.jpegy.toFixed(1)}</div>
                  {metric.hasApprovedVersion && (
                    <CheckCircleIcon className="w-4 h-4 mt-1 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Graphique X/Y Amélioré */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">📊 Positionnement JPEGY vs Rendement Total</h3>
          <div className="text-xs text-gray-500">
            {filteredMetrics.length} titre(s) affiché(s)
          </div>
        </div>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre à afficher sur le graphique.
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
            <svg width={chartWidth} height={chartHeight} className="border border-gray-300 rounded bg-white">
              {/* Grille de fond */}
              {xTicks.map((tick, i) => (
                <line
                  key={`x-grid-${i}`}
                  x1={tick.position}
                  y1={padding}
                  x2={tick.position}
                  y2={chartHeight - padding}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
              {yTicks.map((tick, i) => (
                <line
                  key={`y-grid-${i}`}
                  x1={padding}
                  y1={tick.position}
                  x2={chartWidth - padding}
                  y2={tick.position}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
              
              {/* Axes */}
              <line
                x1={padding}
                y1={chartHeight - padding}
                x2={chartWidth - padding}
                y2={chartHeight - padding}
                stroke="#1f2937"
                strokeWidth="2"
              />
              <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={chartHeight - padding}
                stroke="#1f2937"
                strokeWidth="2"
              />
            
              {/* Ticks et Labels sur l'axe X */}
              {xTicks.map((tick, i) => (
                <g key={`x-tick-${i}`}>
                  <line
                    x1={tick.position}
                    y1={chartHeight - padding}
                    x2={tick.position}
                    y2={chartHeight - padding + 5}
                    stroke="#1f2937"
                    strokeWidth="1.5"
                  />
                  <text
                    x={tick.position}
                    y={chartHeight - padding + 20}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700"
                  >
                    {tick.value.toFixed(1)}
                  </text>
                </g>
              ))}
              
              {/* Ticks et Labels sur l'axe Y */}
              {yTicks.map((tick, i) => (
                <g key={`y-tick-${i}`}>
                  <line
                    x1={padding}
                    y1={tick.position}
                    x2={padding - 5}
                    y2={tick.position}
                    stroke="#1f2937"
                    strokeWidth="1.5"
                  />
                  <text
                    x={padding - 10}
                    y={tick.position + 4}
                    textAnchor="end"
                    className="text-xs font-medium fill-gray-700"
                  >
                    {tick.value.toFixed(0)}%
                  </text>
                </g>
              ))}
            
              {/* Labels des axes */}
              <text 
                x={chartWidth / 2} 
                y={chartHeight - 15} 
                textAnchor="middle" 
                className="text-sm font-bold fill-gray-800"
              >
                JPEGY (P/E ajusté pour croissance et rendement)
              </text>
              <text
                x={25}
                y={chartHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90, 25, ${chartHeight / 2})`}
                className="text-sm font-bold fill-gray-800"
              >
                Rendement Total Projeté (5 ans, %)
              </text>
              
              {/* Légende JPEGY */}
              <g transform={`translate(${chartWidth - 200}, ${padding + 20})`}>
                <text x={0} y={0} className="text-xs font-semibold fill-gray-700">Légende JPEGY:</text>
                {[
                  { label: 'Excellent (≤0.5)', color: '#86efac' },
                  { label: 'Bon (0.5-1.5)', color: '#16a34a' },
                  { label: 'Moyen (1.5-1.75)', color: '#eab308' },
                  { label: 'Faible (1.75-2.0)', color: '#f97316' },
                  { label: 'Mauvais (>2.0)', color: '#dc2626' }
                ].map((item, idx) => (
                  <g key={idx} transform={`translate(0, ${(idx + 1) * 18})`}>
                    <circle cx={8} cy={0} r={6} fill={item.color} />
                    <text x={20} y={4} className="text-[10px] fill-gray-600">{item.label}</text>
                  </g>
                ))}
              </g>

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
        )}
      </div>

      {/* Graphique de Distribution des Rendements */}
      {filteredMetrics.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Distribution des Rendements Totaux</h3>
          <div className="flex items-end justify-between gap-2 h-64 border-b border-l border-gray-300 pb-2 pl-2">
            {(() => {
              // Créer des bins pour la distribution
              const minReturn = Math.min(...filteredMetrics.map(m => m.totalReturnPercent));
              const maxReturn = Math.max(...filteredMetrics.map(m => m.totalReturnPercent));
              const binCount = 12;
              const binSize = (maxReturn - minReturn) / binCount;
              const bins = Array(binCount).fill(0).map((_, i) => ({
                min: minReturn + i * binSize,
                max: minReturn + (i + 1) * binSize,
                count: 0
              }));
              
              filteredMetrics.forEach(metric => {
                const binIndex = Math.min(
                  Math.floor((metric.totalReturnPercent - minReturn) / binSize),
                  binCount - 1
                );
                if (binIndex >= 0) bins[binIndex].count++;
              });
              
              const maxCount = Math.max(...bins.map(b => b.count));
              
              return bins.map((bin, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer"
                    style={{
                      height: `${(bin.count / maxCount) * 240}px`,
                      minHeight: bin.count > 0 ? '4px' : '0px'
                    }}
                    title={`${bin.min.toFixed(0)}% - ${bin.max.toFixed(0)}%: ${bin.count} titre(s)`}
                  />
                  {idx % 3 === 0 && (
                    <span className="text-[8px] text-gray-500 mt-1">{bin.min.toFixed(0)}%</span>
                  )}
                </div>
              ));
            })()}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {filteredMetrics.length} titre(s) | Range: {Math.min(...filteredMetrics.map(m => m.totalReturnPercent)).toFixed(0)}% à {Math.max(...filteredMetrics.map(m => m.totalReturnPercent)).toFixed(0)}%
          </div>
        </div>
      )}

      {/* 5 Autres Idées de Visualisation */}
      {filteredMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Idée 1: Heatmap de Secteurs */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold mb-4">🔥 Heatmap par Secteur</h3>
          <div className="space-y-2">
            {Array.from(new Set(filteredMetrics.map(m => m.profile.info.sector))).map(sector => {
              const sectorMetrics = filteredMetrics.filter(m => m.profile.info.sector === sector);
              const avgReturn = sectorMetrics.reduce((sum, m) => sum + m.totalReturnPercent, 0) / sectorMetrics.length;
              return (
                <div key={sector} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{sector}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(Math.max((avgReturn + 50) / 200 * 100, 0), 100)}%`,
                          backgroundColor: getReturnColor(avgReturn)
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-16 text-right">{avgReturn.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Idée 2: Top Performers Amélioré */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top 5 Performers</h3>
          <div className="text-xs text-gray-500 mb-3">
            Meilleurs rendements projetés
          </div>
          <div className="space-y-2">
            {filteredMetrics
              .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
              .slice(0, 5)
              .map((metric, idx) => (
                <div key={metric.profile.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-50 to-white rounded border-l-4 border-yellow-400">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-yellow-600">#{idx + 1}</span>
                    <span className="font-semibold">{metric.profile.id}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{metric.totalReturnPercent.toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>

        {/* Idée 3: Distribution des Risques Amélioré */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Distribution des Risques de Baisse</h3>
          <div className="text-xs text-gray-500 mb-3">
            Classification par niveau de risque
          </div>
          <div className="space-y-2">
            {['Faible', 'Modéré', 'Élevé'].map((level, idx) => {
              const ranges = [[0, 20], [20, 50], [50, 100]];
              const count = filteredMetrics.filter(m => 
                m.downsideRisk >= ranges[idx][0] && m.downsideRisk < ranges[idx][1]
              ).length;
              return (
                <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{level}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${(count / filteredMetrics.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Idée 4: Ratio 3:1 Distribution Amélioré */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Distribution Ratio 3:1 (Potentiel vs Risque)</h3>
          <div className="text-xs text-gray-500 mb-3">
            Ratio hausse potentielle / risque de baisse
          </div>
          <div className="space-y-2">
            {['< 1:1', '1:1 - 3:1', '> 3:1'].map((range, idx) => {
              const ranges = [[0, 1], [1, 3], [3, 100]];
              const count = filteredMetrics.filter(m => 
                m.ratio31 >= ranges[idx][0] && m.ratio31 < ranges[idx][1]
              ).length;
              const color = idx === 2 ? 'green' : idx === 1 ? 'yellow' : 'red';
              return (
                <div key={range} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${color}-500`}
                        style={{ width: `${(count / filteredMetrics.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Idée 5: Timeline de Performance Amélioré */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 md:col-span-2">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Timeline de Performance (Triée par Rendement)</h3>
          <div className="text-xs text-gray-500 mb-3">
            Barres horizontales classées par rendement décroissant
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {filteredMetrics
                .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
                .map((metric) => (
                  <div
                    key={metric.profile.id}
                    className="flex flex-col items-center p-2 bg-gray-50 rounded min-w-[80px] cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => onSelect(metric.profile.id)}
                  >
                    <div className="text-xs font-bold mb-1">{metric.profile.id}</div>
                    <div
                      className="w-full rounded mb-1"
                      style={{
                        height: `${Math.max(Math.min((metric.totalReturnPercent + 50) / 200 * 100, 100), 5)}px`,
                        backgroundColor: getReturnColor(metric.totalReturnPercent),
                        minHeight: '20px'
                      }}
                    />
                    <div className="text-xs font-semibold" style={{ color: getReturnColor(metric.totalReturnPercent) }}>
                      {metric.totalReturnPercent.toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Tableau détaillé Amélioré */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">📋 Tableau de Performance Détaillé</h3>
          <div className="text-xs text-gray-500">
            {filteredMetrics.length} titre(s)
          </div>
        </div>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0">
                <tr>
                  <th className="p-3 text-left font-bold text-gray-700 border-b border-gray-300">Ticker</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="P/E ajusté pour croissance et rendement">JPEGY</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Rendement total projeté sur 5 ans">Rendement</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Ratio potentiel de hausse vs risque de baisse">Ratio 3:1</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Potentiel de hausse en %">Hausse</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Risque de baisse en %">Baisse</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Ratio cours/bénéfice actuel">P/E</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Rendement du dividende">Yield</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Croissance historique des EPS">Croissance</th>
                  <th className="p-3 text-center font-bold text-gray-700 border-b border-gray-300">Approuvé</th>
                  <th className="p-3 text-center font-bold text-gray-700 border-b border-gray-300">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
        )}
      </div>
    </div>
  );
};

