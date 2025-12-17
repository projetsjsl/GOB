import React, { useMemo } from 'react';
import { AnnualData, Assumptions } from '../types';
import { detectOutlierMetrics } from '../utils/outlierDetection';
import { sanitizeAssumptionsSync } from '../utils/validation';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, Cell } from 'recharts';
import { formatCurrency, formatPercent } from '../utils/calculations';

interface DataQualityReportProps {
  data: AnnualData[];
  assumptions: Assumptions;
  ticker: string;
}

interface OutlierInfo {
  metric: string;
  originalValue: number;
  targetPrice: number;
  median: number;
  deviation: number;
  deviationPercent: number;
  reason: string;
  isExcluded: boolean;
}

export const DataQualityReport: React.FC<DataQualityReportProps> = ({ data, assumptions, ticker }) => {
  // Calculer les prix cibles pour chaque métrique
  const calculateTargetPrices = (data: AnnualData[], assumptions: Assumptions) => {
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
    const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
    
    const baseValues = {
      eps: Math.max(baseYearData?.earningsPerShare || 0, 0),
      cf: Math.max(baseYearData?.cashFlowPerShare || 0, 0),
      bv: Math.max(baseYearData?.bookValuePerShare || 0, 0),
      div: Math.max(assumptions.currentDividend || 0, 0)
    };

    const projectFutureValue = (current: number, rate: number, years: number): number => {
      if (current <= 0 || !isFinite(current) || !isFinite(rate)) return 0;
      const safeRate = Math.max(-50, Math.min(rate, 50));
      return current * Math.pow(1 + safeRate / 100, years);
    };

    const futureValues = {
      eps: projectFutureValue(baseValues.eps, assumptions.growthRateEPS || 0, 5),
      cf: projectFutureValue(baseValues.cf, assumptions.growthRateCF || 0, 5),
      bv: projectFutureValue(baseValues.bv, assumptions.growthRateBV || 0, 5),
      div: projectFutureValue(baseValues.div, assumptions.growthRateDiv || 0, 5)
    };

    const targets = {
      eps: futureValues.eps > 0 && assumptions.targetPE > 0 ? futureValues.eps * assumptions.targetPE : 0,
      cf: futureValues.cf > 0 && assumptions.targetPCF > 0 ? futureValues.cf * assumptions.targetPCF : 0,
      bv: futureValues.bv > 0 && assumptions.targetPBV > 0 ? futureValues.bv * assumptions.targetPBV : 0,
      div: futureValues.div > 0 && assumptions.targetYield > 0 ? futureValues.div / (assumptions.targetYield / 100) : 0
    };

    return targets;
  };

  // Détecter les outliers avec détails
  const outlierAnalysis = useMemo(() => {
    const outlierDetection = detectOutlierMetrics(data, assumptions);
    const targets = calculateTargetPrices(data, assumptions);
    
    const validTargets = [
      { metric: 'EPS', price: targets.eps, excluded: assumptions.excludeEPS },
      { metric: 'CF', price: targets.cf, excluded: assumptions.excludeCF },
      { metric: 'BV', price: targets.bv, excluded: assumptions.excludeBV },
      { metric: 'DIV', price: targets.div, excluded: assumptions.excludeDIV }
    ].filter(t => t.price > 0);

    if (validTargets.length < 2) {
      return { outliers: [], median: 0, stdDev: 0 };
    }

    const prices = validTargets.map(t => t.price);
    const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const threshold = Math.min(1.5 * stdDev, median * 0.5);

    const outliers: OutlierInfo[] = validTargets.map(target => {
      const deviation = Math.abs(target.price - median);
      const deviationPercent = median > 0 ? (deviation / median) * 100 : 0;
      const isOutlier = deviation > threshold || 
        (assumptions.currentPrice > 0 && Math.abs((target.price - assumptions.currentPrice) / assumptions.currentPrice) > 3.0);
      
      let reason = '';
      if (deviation > threshold) {
        reason = `Écart de ${formatPercent(deviationPercent)} par rapport à la médiane (${formatCurrency(median)})`;
      }
      if (assumptions.currentPrice > 0) {
        const returnPct = ((target.price - assumptions.currentPrice) / assumptions.currentPrice) * 100;
        if (returnPct > 300 || returnPct < -75) {
          reason += reason ? ' + ' : '';
          reason += `Rendement implausible (${formatPercent(returnPct)} sur 5 ans)`;
        }
      }

      return {
        metric: target.metric,
        originalValue: target.price,
        targetPrice: target.price,
        median,
        deviation,
        deviationPercent,
        reason,
        isExcluded: target.excluded || isOutlier
      };
    });

    return { outliers, median, stdDev, threshold };
  }, [data, assumptions]);

  // Analyser les données historiques pour détecter les valeurs aberrantes
  const historicalOutliers = useMemo(() => {
    const outliers: Array<{
      year: number;
      metric: string;
      value: number;
      average: number;
      deviation: number;
      reason: string;
    }> = [];

    // Analyser chaque métrique
    const metrics = ['earningsPerShare', 'cashFlowPerShare', 'bookValuePerShare', 'dividendPerShare'] as const;
    
    metrics.forEach(metric => {
      const values = data.map(d => d[metric]).filter(v => v > 0);
      if (values.length < 3) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const threshold = 2 * stdDev;

      data.forEach(row => {
        const value = row[metric];
        if (value > 0) {
          const deviation = Math.abs(value - mean);
          if (deviation > threshold) {
            outliers.push({
              year: row.year,
              metric: metric.replace('PerShare', '').replace(/([A-Z])/g, ' $1').trim(),
              value,
              average: mean,
              deviation,
              reason: `Écart de ${formatPercent((deviation / mean) * 100)} par rapport à la moyenne`
            });
          }
        }
      });
    });

    return outliers;
  }, [data]);

  // Préparer les données pour les graphiques
  const targetPriceData = useMemo(() => {
    const targets = calculateTargetPrices(data, assumptions);
    const outlierAnalysis = detectOutlierMetrics(data, assumptions);
    
    return [
      { metric: 'EPS', price: targets.eps, excluded: outlierAnalysis.excludeEPS, color: outlierAnalysis.excludeEPS ? '#ef4444' : '#10b981' },
      { metric: 'CF', price: targets.cf, excluded: outlierAnalysis.excludeCF, color: outlierAnalysis.excludeCF ? '#ef4444' : '#10b981' },
      { metric: 'BV', price: targets.bv, excluded: outlierAnalysis.excludeBV, color: outlierAnalysis.excludeBV ? '#ef4444' : '#10b981' },
      { metric: 'DIV', price: targets.div, excluded: outlierAnalysis.excludeDIV, color: outlierAnalysis.excludeDIV ? '#ef4444' : '#10b981' }
    ].filter(d => d.price > 0);
  }, [data, assumptions]);

  const historicalDataChart = useMemo(() => {
    return data.map(row => ({
      year: row.year,
      EPS: row.earningsPerShare,
      CF: row.cashFlowPerShare,
      BV: row.bookValuePerShare,
      DIV: row.dividendPerShare,
      PriceHigh: row.priceHigh,
      PriceLow: row.priceLow
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <InformationCircleIcon className="w-6 h-6" />
          Rapport de Qualité des Données - {ticker}
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          Analyse complète des données aberrantes, exclusions et qualité des données historiques
        </p>
      </div>

      {/* Graphique des Prix Cibles */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-blue-600" />
          Prix Cibles par Métrique
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={targetPriceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {targetPriceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Métrique incluse</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Métrique exclue (aberrante)</span>
          </div>
        </div>
      </div>

      {/* Détails des Outliers */}
      {outlierAnalysis.outliers.filter(o => o.isExcluded).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-red-200">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Métriques Aberrantes Détectées ({outlierAnalysis.outliers.filter(o => o.isExcluded).length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="p-2 text-left">Métrique</th>
                  <th className="p-2 text-right">Prix Cible</th>
                  <th className="p-2 text-right">Médiane</th>
                  <th className="p-2 text-right">Écart</th>
                  <th className="p-2 text-right">Écart %</th>
                  <th className="p-2 text-left">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outlierAnalysis.outliers.filter(o => o.isExcluded).map((outlier, idx) => (
                  <tr key={idx} className="hover:bg-red-50">
                    <td className="p-2 font-semibold">{outlier.metric}</td>
                    <td className="p-2 text-right">{formatCurrency(outlier.targetPrice)}</td>
                    <td className="p-2 text-right">{formatCurrency(outlier.median)}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(outlier.deviation)}</td>
                    <td className="p-2 text-right text-red-600 font-bold">{formatPercent(outlier.deviationPercent)}</td>
                    <td className="p-2 text-xs text-gray-600">{outlier.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Métriques Valides */}
      {outlierAnalysis.outliers.filter(o => !o.isExcluded).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            Métriques Valides ({outlierAnalysis.outliers.filter(o => !o.isExcluded).length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {outlierAnalysis.outliers.filter(o => !o.isExcluded).map((outlier, idx) => (
              <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                <div className="text-xs text-green-600 font-semibold mb-1">{outlier.metric}</div>
                <div className="text-lg font-bold text-green-800">{formatCurrency(outlier.targetPrice)}</div>
                <div className="text-xs text-gray-500 mt-1">Écart: {formatPercent(outlier.deviationPercent)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique des Données Historiques */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-blue-600" />
          Évolution des Données Historiques
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalDataChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="EPS" stroke="#3b82f6" strokeWidth={2} name="EPS" />
              <Line yAxisId="left" type="monotone" dataKey="CF" stroke="#10b981" strokeWidth={2} name="CF" />
              <Line yAxisId="left" type="monotone" dataKey="BV" stroke="#f59e0b" strokeWidth={2} name="BV" />
              <Line yAxisId="left" type="monotone" dataKey="DIV" stroke="#ef4444" strokeWidth={2} name="DIV" />
              <Line yAxisId="right" type="monotone" dataKey="PriceHigh" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="5 5" name="Prix High" />
              <Line yAxisId="right" type="monotone" dataKey="PriceLow" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="5 5" name="Prix Low" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Outliers Historiques */}
      {historicalOutliers.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-orange-200">
          <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" />
            Valeurs Aberrantes dans les Données Historiques ({historicalOutliers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="p-2 text-left">Année</th>
                  <th className="p-2 text-left">Métrique</th>
                  <th className="p-2 text-right">Valeur</th>
                  <th className="p-2 text-right">Moyenne</th>
                  <th className="p-2 text-right">Écart</th>
                  <th className="p-2 text-left">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historicalOutliers.map((outlier, idx) => (
                  <tr key={idx} className="hover:bg-orange-50">
                    <td className="p-2 font-semibold">{outlier.year}</td>
                    <td className="p-2">{outlier.metric}</td>
                    <td className="p-2 text-right font-bold text-orange-600">{formatCurrency(outlier.value)}</td>
                    <td className="p-2 text-right">{formatCurrency(outlier.average)}</td>
                    <td className="p-2 text-right text-orange-600">{formatCurrency(outlier.deviation)}</td>
                    <td className="p-2 text-xs text-gray-600">{outlier.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques Résumées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-semibold mb-1">Médiane des Prix Cibles</div>
          <div className="text-2xl font-bold text-blue-800">{formatCurrency(outlierAnalysis.median)}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-semibold mb-1">Écart-Type</div>
          <div className="text-2xl font-bold text-purple-800">{formatCurrency(outlierAnalysis.stdDev)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-semibold mb-1">Métriques Valides</div>
          <div className="text-2xl font-bold text-green-800">
            {outlierAnalysis.outliers.filter(o => !o.isExcluded).length} / {outlierAnalysis.outliers.length}
          </div>
        </div>
      </div>
    </div>
  );
};

