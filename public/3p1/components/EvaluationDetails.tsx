import React, { useState, useMemo } from 'react';
import { AnnualData, Assumptions, CompanyInfo } from '../types';
import { formatCurrency, projectFutureValue, calculateCAGR } from '../utils/calculations';
import { CalculatorIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface EvaluationDetailsProps {
  data: AnnualData[];
  assumptions: Assumptions;
  onUpdateAssumption: (key: keyof Assumptions, value: number | boolean) => void;
  info?: CompanyInfo;
  sector?: string;
}

interface Range {
  min: number;
  max: number;
  avg: number;
}

export const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({ data, assumptions, onUpdateAssumption, info, sector }) => {
  // États pour gérer l'affichage/réduction des intervalles de référence
  const [expandedMetrics, setExpandedMetrics] = useState<{
    eps: boolean;
    cf: boolean;
    bv: boolean;
    div: boolean;
  }>({
    eps: false,
    cf: false,
    bv: false,
    div: false
  });

  const toggleMetric = (metric: 'eps' | 'cf' | 'bv' | 'div') => {
    setExpandedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Determine base values from selected base year
  // Robust fallback: 1. Match Base Year & Valid EPS -> 2. Any Valid EPS -> 3. Last Data
  const baseYearData = data.find(d => d.year === assumptions.baseYear && d.earningsPerShare > 0)
    || [...data].reverse().find(d => d.earningsPerShare > 0)
    || data[data.length - 1];

  const baseValues = {
    eps: baseYearData?.earningsPerShare || 0,
    cf: baseYearData?.cashFlowPerShare || 0,
    bv: baseYearData?.bookValuePerShare || 0,
    div: assumptions.currentDividend || 0
  };

  // Projections (5 Years)
  const futureValues = {
    eps: projectFutureValue(baseValues.eps, assumptions.growthRateEPS, 5),
    cf: projectFutureValue(baseValues.cf, assumptions.growthRateCF, 5),
    bv: projectFutureValue(baseValues.bv, assumptions.growthRateBV, 5),
    div: projectFutureValue(baseValues.div, assumptions.growthRateDiv, 5)
  };

  // Target Prices
  const targets = {
    eps: futureValues.eps * assumptions.targetPE,
    cf: futureValues.cf * assumptions.targetPCF,
    bv: futureValues.bv * assumptions.targetPBV,
    // Dividend Model: Target Price = Projected Dividend / Target Yield
    // Using format 1.8% -> 0.018
    div: assumptions.targetYield > 0 ? futureValues.div / (assumptions.targetYield / 100) : 0
  };

  // Average Target Price (excluding disabled metrics)
  const validTargets = [
    !assumptions.excludeEPS && targets.eps > 0 ? targets.eps : null,
    !assumptions.excludeCF && targets.cf > 0 ? targets.cf : null,
    !assumptions.excludeBV && targets.bv > 0 ? targets.bv : null,
    !assumptions.excludeDIV && targets.div > 0 ? targets.div : null
  ].filter((t): t is number => t !== null && t > 0);
  
  const avgTargetPrice = validTargets.length > 0
    ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
    : 0;

  // Dividend Accumulation (Approximate sum of 5 years of growing dividends)
  // D1 = D0(1+g), D2=D0(1+g)^2...
  let totalDividends = 0;
  let currentD = baseValues.div;
  for (let i = 0; i < 5; i++) {
    currentD = currentD * (1 + assumptions.growthRateDiv / 100);
    totalDividends += currentD;
  }

  // Total Return Calculation
  // Formula: ((Target Price + Accumulated Dividends) - Current Price) / Current Price
  const totalReturnPercent = assumptions.currentPrice > 0
    ? ((avgTargetPrice + totalDividends - assumptions.currentPrice) / assumptions.currentPrice) * 100
    : 0;

  // Annualized Return (CAGR)
  // End Value = Target + Dividends ? Or just Target and treat dividends as yield?
  // Value Line often uses: (Target Price / Current Price)^(1/5) - 1 + Avg Yield.
  // But based on the user request matching 58.29% which is likely total upside:
  // We stick to totalReturnPercent.

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Assumptions) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) onUpdateAssumption(key, val);
  };

  const handleToggleExclusion = (metric: 'excludeEPS' | 'excludeCF' | 'excludeBV' | 'excludeDIV') => {
    const currentValue = assumptions[metric] || false;
    // Convert boolean to number for onUpdateAssumption (0 = false, 1 = true)
    onUpdateAssumption(metric as keyof Assumptions, currentValue ? 0 : 1);
  };

  // Calculer les intervalles historiques pour chaque métrique
  const calculateHistoricalRanges = useMemo(() => {
    const validData = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
    
    if (validData.length === 0) {
      return null;
    }

    // Calculer les ratios P/E historiques
    const peRatios: number[] = [];
    const pcfRatios: number[] = [];
    const pbvRatios: number[] = [];
    const yields: number[] = [];
    const epsGrowthRates: number[] = [];
    const cfGrowthRates: number[] = [];
    const bvGrowthRates: number[] = [];
    const divGrowthRates: number[] = [];

    validData.forEach((row, idx) => {
      if (row.earningsPerShare > 0) {
        const peHigh = row.priceHigh / row.earningsPerShare;
        const peLow = row.priceLow / row.earningsPerShare;
        peRatios.push(peHigh, peLow);
      }

      if (row.cashFlowPerShare > 0) {
        const pcfHigh = row.priceHigh / row.cashFlowPerShare;
        const pcfLow = row.priceLow / row.cashFlowPerShare;
        pcfRatios.push(pcfHigh, pcfLow);
      }

      if (row.bookValuePerShare > 0) {
        const pbvHigh = row.priceHigh / row.bookValuePerShare;
        const pbvLow = row.priceLow / row.bookValuePerShare;
        pbvRatios.push(pbvHigh, pbvLow);
      }

      if (row.priceHigh > 0 && row.dividendPerShare > 0) {
        const yieldValue = (row.dividendPerShare / row.priceHigh) * 100;
        yields.push(yieldValue);
      }

      // Calculer les taux de croissance entre années consécutives
      if (idx > 0) {
        const prevRow = validData[idx - 1];
        
        if (prevRow.earningsPerShare > 0 && row.earningsPerShare > 0) {
          const growth = ((row.earningsPerShare - prevRow.earningsPerShare) / prevRow.earningsPerShare) * 100;
          epsGrowthRates.push(growth);
        }

        if (prevRow.cashFlowPerShare > 0 && row.cashFlowPerShare > 0) {
          const growth = ((row.cashFlowPerShare - prevRow.cashFlowPerShare) / prevRow.cashFlowPerShare) * 100;
          cfGrowthRates.push(growth);
        }

        if (prevRow.bookValuePerShare > 0 && row.bookValuePerShare > 0) {
          const growth = ((row.bookValuePerShare - prevRow.bookValuePerShare) / prevRow.bookValuePerShare) * 100;
          bvGrowthRates.push(growth);
        }

        if (prevRow.dividendPerShare > 0 && row.dividendPerShare > 0) {
          const growth = ((row.dividendPerShare - prevRow.dividendPerShare) / prevRow.dividendPerShare) * 100;
          divGrowthRates.push(growth);
        }
      }
    });

    // Calculer CAGR sur toute la période
    const firstRow = validData[0];
    const lastRow = validData[validData.length - 1];
    const yearsDiff = lastRow.year - firstRow.year;

    const epsCAGR = firstRow.earningsPerShare > 0 && lastRow.earningsPerShare > 0
      ? calculateCAGR(firstRow.earningsPerShare, lastRow.earningsPerShare, yearsDiff)
      : null;
    
    const cfCAGR = firstRow.cashFlowPerShare > 0 && lastRow.cashFlowPerShare > 0
      ? calculateCAGR(firstRow.cashFlowPerShare, lastRow.cashFlowPerShare, yearsDiff)
      : null;
    
    const bvCAGR = firstRow.bookValuePerShare > 0 && lastRow.bookValuePerShare > 0
      ? calculateCAGR(firstRow.bookValuePerShare, lastRow.bookValuePerShare, yearsDiff)
      : null;
    
    const divCAGR = firstRow.dividendPerShare > 0 && lastRow.dividendPerShare > 0
      ? calculateCAGR(firstRow.dividendPerShare, lastRow.dividendPerShare, yearsDiff)
      : null;

    const calculateRange = (values: number[]): Range | null => {
      if (values.length === 0) return null;
      const filtered = values.filter(v => isFinite(v) && v > -100 && v < 1000);
      if (filtered.length === 0) return null;
      return {
        min: Math.min(...filtered),
        max: Math.max(...filtered),
        avg: filtered.reduce((a, b) => a + b, 0) / filtered.length
      };
    };

    return {
      pe: calculateRange(peRatios),
      pcf: calculateRange(pcfRatios),
      pbv: calculateRange(pbvRatios),
      yield: calculateRange(yields),
      epsGrowth: epsCAGR !== null ? { min: epsCAGR, max: epsCAGR, avg: epsCAGR } : calculateRange(epsGrowthRates),
      cfGrowth: cfCAGR !== null ? { min: cfCAGR, max: cfCAGR, avg: cfCAGR } : calculateRange(cfGrowthRates),
      bvGrowth: bvCAGR !== null ? { min: bvCAGR, max: bvCAGR, avg: bvCAGR } : calculateRange(bvGrowthRates),
      divGrowth: divCAGR !== null ? { min: divCAGR, max: divCAGR, avg: divCAGR } : calculateRange(divGrowthRates)
    };
  }, [data]);

  // Valeurs sectorielles par défaut (simplifiées)
  const sectorRanges = useMemo(() => {
    const sectorKey = sector || info?.sector || '';
    const normalizedSector = sectorKey.toLowerCase();
    
    // Mapping simplifié des secteurs
    if (normalizedSector.includes('tech') || normalizedSector.includes('technologie') || normalizedSector.includes('ti')) {
      return {
        pe: { min: 15, max: 35, avg: 25 },
        pcf: { min: 12, max: 28, avg: 20 },
        pbv: { min: 3, max: 8, avg: 5.5 },
        yield: { min: 0.5, max: 2.5, avg: 1.5 },
        epsGrowth: { min: 8, max: 20, avg: 14 },
        cfGrowth: { min: 8, max: 20, avg: 14 },
        bvGrowth: { min: 5, max: 15, avg: 10 },
        divGrowth: { min: 0, max: 10, avg: 5 }
      };
    }
    
    // Valeurs par défaut génériques
    return {
      pe: { min: 10, max: 25, avg: 17 },
      pcf: { min: 8, max: 20, avg: 14 },
      pbv: { min: 2, max: 6, avg: 4 },
      yield: { min: 1, max: 4, avg: 2.5 },
      epsGrowth: { min: 5, max: 15, avg: 10 },
      cfGrowth: { min: 5, max: 15, avg: 10 },
      bvGrowth: { min: 3, max: 12, avg: 7 },
      divGrowth: { min: 1, max: 8, avg: 4 }
    };
  }, [sector, info?.sector]);

  // Projections 5 ans pour le titre
  const title5YearProjections = useMemo(() => {
    if (!calculateHistoricalRanges) return null;
    return {
      pe: { min: assumptions.targetPE * 0.9, max: assumptions.targetPE * 1.1, avg: assumptions.targetPE },
      pcf: { min: assumptions.targetPCF * 0.9, max: assumptions.targetPCF * 1.1, avg: assumptions.targetPCF },
      pbv: { min: assumptions.targetPBV * 0.9, max: assumptions.targetPBV * 1.1, avg: assumptions.targetPBV },
      yield: { min: assumptions.targetYield * 0.9, max: assumptions.targetYield * 1.1, avg: assumptions.targetYield },
      epsGrowth: { min: assumptions.growthRateEPS * 0.8, max: assumptions.growthRateEPS * 1.2, avg: assumptions.growthRateEPS },
      cfGrowth: { min: assumptions.growthRateCF * 0.8, max: assumptions.growthRateCF * 1.2, avg: assumptions.growthRateCF },
      bvGrowth: { min: assumptions.growthRateBV * 0.8, max: assumptions.growthRateBV * 1.2, avg: assumptions.growthRateBV },
      divGrowth: { min: assumptions.growthRateDiv * 0.8, max: assumptions.growthRateDiv * 1.2, avg: assumptions.growthRateDiv }
    };
  }, [calculateHistoricalRanges, assumptions]);

  // Projections 5 ans pour le secteur
  const sector5YearProjections = useMemo(() => {
    return {
      pe: { min: sectorRanges.pe.avg * 0.9, max: sectorRanges.pe.avg * 1.1, avg: sectorRanges.pe.avg },
      pcf: { min: sectorRanges.pcf.avg * 0.9, max: sectorRanges.pcf.avg * 1.1, avg: sectorRanges.pcf.avg },
      pbv: { min: sectorRanges.pbv.avg * 0.9, max: sectorRanges.pbv.avg * 1.1, avg: sectorRanges.pbv.avg },
      yield: { min: sectorRanges.yield.avg * 0.9, max: sectorRanges.yield.avg * 1.1, avg: sectorRanges.yield.avg },
      epsGrowth: { min: sectorRanges.epsGrowth.avg * 0.8, max: sectorRanges.epsGrowth.avg * 1.2, avg: sectorRanges.epsGrowth.avg },
      cfGrowth: { min: sectorRanges.cfGrowth.avg * 0.8, max: sectorRanges.cfGrowth.avg * 1.2, avg: sectorRanges.cfGrowth.avg },
      bvGrowth: { min: sectorRanges.bvGrowth.avg * 0.8, max: sectorRanges.bvGrowth.avg * 1.2, avg: sectorRanges.bvGrowth.avg },
      divGrowth: { min: sectorRanges.divGrowth.avg * 0.8, max: sectorRanges.divGrowth.avg * 1.2, avg: sectorRanges.divGrowth.avg }
    };
  }, [sectorRanges]);

  const formatRange = (range: Range | null, suffix: string = '') => {
    if (!range) return 'N/A';
    return `${range.min.toFixed(1)} - ${range.max.toFixed(1)}${suffix} (moy: ${range.avg.toFixed(1)}${suffix})`;
  };

  const formatGrowthRange = (range: Range | null) => {
    if (!range) return 'N/A';
    return `${range.min.toFixed(1)}% - ${range.max.toFixed(1)}% (moy: ${range.avg.toFixed(1)}%)`;
  };

  // Composant pour afficher les intervalles de référence sous une métrique
  const MetricReferenceRanges = ({ metric }: { metric: 'eps' | 'cf' | 'bv' | 'div' }) => {
    if (!calculateHistoricalRanges) return null;

    const metricConfig = {
      eps: {
        ratioKey: 'pe' as const,
        growthKey: 'epsGrowth' as const,
        ratioLabel: 'P/E Ratio',
        growthLabel: 'Croissance BPA (EPS)',
        ratioSuffix: 'x'
      },
      cf: {
        ratioKey: 'pcf' as const,
        growthKey: 'cfGrowth' as const,
        ratioLabel: 'P/CF Ratio',
        growthLabel: 'Croissance CFA',
        ratioSuffix: 'x'
      },
      bv: {
        ratioKey: 'pbv' as const,
        growthKey: 'bvGrowth' as const,
        ratioLabel: 'P/BV Ratio',
        growthLabel: 'Croissance BV',
        ratioSuffix: 'x'
      },
      div: {
        ratioKey: 'yield' as const,
        growthKey: 'divGrowth' as const,
        ratioLabel: 'Dividend Yield',
        growthLabel: 'Croissance Dividende',
        ratioSuffix: '%'
      }
    };

    const config = metricConfig[metric];
    const titleRatio = calculateHistoricalRanges[config.ratioKey];
    const sectorRatio = sectorRanges[config.ratioKey];
    const title5YRatio = title5YearProjections?.[config.ratioKey];
    const sector5YRatio = sector5YearProjections[config.ratioKey];
    const titleGrowth = calculateHistoricalRanges[config.growthKey];
    const sectorGrowth = sectorRanges[config.growthKey];
    const title5YGrowth = title5YearProjections?.[config.growthKey];
    const sector5YGrowth = sector5YearProjections[config.growthKey];

    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 sm:p-3 md:p-4 mt-2 mb-2 rounded-r">
        <div className="text-xs font-semibold text-blue-800 mb-2 sm:mb-3">📊 Intervalles de Référence - {metricConfig[metric].ratioLabel}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs">
          <div>
            <div className="font-semibold text-gray-700 mb-2">Ratio {config.ratioLabel}</div>
            <table className="w-full text-xs">
              <thead className="bg-blue-100 text-gray-600">
                <tr>
                  <th className="p-1 text-left text-[10px]">Source</th>
                  <th className="p-1 text-right text-[10px]">Historique</th>
                  <th className="p-1 text-right text-[10px]">5 Ans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                <tr>
                  <td className="p-1 text-gray-600">Titre</td>
                  <td className="p-1 text-right font-medium">{formatRange(titleRatio, config.ratioSuffix)}</td>
                  <td className="p-1 text-right font-medium">{title5YRatio ? formatRange(title5YRatio, config.ratioSuffix) : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="p-1 text-gray-600">Secteur</td>
                  <td className="p-1 text-right font-medium">{formatRange(sectorRatio, config.ratioSuffix)}</td>
                  <td className="p-1 text-right font-medium">{formatRange(sector5YRatio, config.ratioSuffix)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-2">{config.growthLabel}</div>
            <table className="w-full text-xs">
              <thead className="bg-blue-100 text-gray-600">
                <tr>
                  <th className="p-1 text-left text-[10px]">Source</th>
                  <th className="p-1 text-right text-[10px]">Historique</th>
                  <th className="p-1 text-right text-[10px]">5 Ans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                <tr>
                  <td className="p-1 text-gray-600">Titre</td>
                  <td className="p-1 text-right font-medium">{formatGrowthRange(titleGrowth)}</td>
                  <td className="p-1 text-right font-medium">{title5YGrowth ? formatGrowthRange(title5YGrowth) : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="p-1 text-gray-600">Secteur</td>
                  <td className="p-1 text-right font-medium">{formatGrowthRange(sectorGrowth)}</td>
                  <td className="p-1 text-right font-medium">{formatGrowthRange(sector5YGrowth)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-500 italic">
          Titre Historique: Calculé à partir de vos données historiques. Secteur Typique: Valeurs de référence pour le secteur {info?.sector || 'générique'}. 5 Ans: Projections basées sur vos hypothèses actuelles.
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
        <CalculatorIcon className="w-5 h-5 text-blue-600" />
        ÉVALUATION PERSONNELLE (Projection 5 Ans)
        <span className="text-xs font-normal text-gray-500 ml-2">(☑ = Incluse, ☐ = Exclue)</span>
      </h3>

      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <table className="w-full text-xs sm:text-sm text-right border-collapse min-w-[600px]">
          <thead className="bg-slate-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-2 text-left">Métrique</th>
              <th className="p-2">Actuel</th>
              <th className="p-2">Croissance %</th>
              <th className="p-2 bg-slate-50">5 Ans (Proj)</th>
              <th className="p-2">Ratio Cible</th>
              <th className="p-2 bg-green-50 text-green-900">Prix Cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* BPA Row */}
            <tr className={assumptions.excludeEPS ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!assumptions.excludeEPS}
                    onChange={() => handleToggleExclusion('excludeEPS')}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0"
                    style={{ accentColor: '#2563eb' }}
                    title={assumptions.excludeEPS ? "Inclure cette métrique dans le calcul" : "Exclure cette métrique du calcul"}
                  />
                  <span className="select-none">BPA (EPS)</span>
                  <button
                    onClick={() => toggleMetric('eps')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.eps ? "Masquer les intervalles de référence" : "Afficher les intervalles de référence"}
                  >
                    {expandedMetrics.eps ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.eps.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateEPS} 
                  onChange={(e) => handleInput(e, 'growthRateEPS')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.eps.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPE} 
                  onChange={(e) => handleInput(e, 'targetPE')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.eps)}</td>
            </tr>
            {expandedMetrics.eps && (
              <tr>
                <td colSpan={6} className="p-0">
                  <MetricReferenceRanges metric="eps" />
                </td>
              </tr>
            )}

            {/* CFA Row */}
            <tr className={assumptions.excludeCF ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!assumptions.excludeCF}
                    onChange={() => handleToggleExclusion('excludeCF')}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0"
                    style={{ accentColor: '#2563eb' }}
                    title={assumptions.excludeCF ? "Inclure cette métrique dans le calcul" : "Exclure cette métrique du calcul"}
                  />
                  <span className="select-none">CFA (Cash Flow)</span>
                  <button
                    onClick={() => toggleMetric('cf')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.cf ? "Masquer les intervalles de référence" : "Afficher les intervalles de référence"}
                  >
                    {expandedMetrics.cf ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.cf.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateCF} 
                  onChange={(e) => handleInput(e, 'growthRateCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.cf.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPCF} 
                  onChange={(e) => handleInput(e, 'targetPCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.cf)}</td>
            </tr>
            {expandedMetrics.cf && (
              <tr>
                <td colSpan={6} className="p-0">
                  <MetricReferenceRanges metric="cf" />
                </td>
              </tr>
            )}

            {/* BV Row */}
            <tr className={assumptions.excludeBV ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!assumptions.excludeBV}
                    onChange={() => handleToggleExclusion('excludeBV')}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0"
                    style={{ accentColor: '#2563eb' }}
                    title={assumptions.excludeBV ? "Inclure cette métrique dans le calcul" : "Exclure cette métrique du calcul"}
                  />
                  <span className="select-none">BV (Book Value)</span>
                  <button
                    onClick={() => toggleMetric('bv')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.bv ? "Masquer les intervalles de référence" : "Afficher les intervalles de référence"}
                  >
                    {expandedMetrics.bv ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.bv.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateBV} 
                  onChange={(e) => handleInput(e, 'growthRateBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.bv.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPBV} 
                  onChange={(e) => handleInput(e, 'targetPBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.bv)}</td>
            </tr>
            {expandedMetrics.bv && (
              <tr>
                <td colSpan={6} className="p-0">
                  <MetricReferenceRanges metric="bv" />
                </td>
              </tr>
            )}

            {/* DIV Row */}
            <tr className={assumptions.excludeDIV ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!assumptions.excludeDIV}
                    onChange={() => handleToggleExclusion('excludeDIV')}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0"
                    style={{ accentColor: '#2563eb' }}
                    title={assumptions.excludeDIV ? "Inclure cette métrique dans le calcul" : "Exclure cette métrique du calcul"}
                  />
                  <span className="select-none">DIV (Dividende)</span>
                  <button
                    onClick={() => toggleMetric('div')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.div ? "Masquer les intervalles de référence" : "Afficher les intervalles de référence"}
                  >
                    {expandedMetrics.div ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.div.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateDiv} 
                  onChange={(e) => handleInput(e, 'growthRateDiv')} 
                  disabled={assumptions.excludeDIV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.div.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <div className="flex items-center justify-end gap-1">
                  <input 
                    type="number" 
                    value={assumptions.targetYield} 
                    step="0.1" 
                    onChange={(e) => handleInput(e, 'targetYield')} 
                    disabled={assumptions.excludeDIV}
                    className={`w-12 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  />
                  <span className={`text-xs ${assumptions.excludeDIV ? "text-gray-400" : "text-orange-600"}`}>%</span>
                </div>
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.div)}</td>
            </tr>
            {expandedMetrics.div && (
              <tr>
                <td colSpan={6} className="p-0">
                  <MetricReferenceRanges metric="div" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-4 sm:gap-6 items-end">
        <div className="text-right w-full sm:w-auto">
          <div className="text-xs text-gray-500 uppercase mb-1">Prix Cible Moyen (5 ans)</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 border-b-2 border-gray-800 inline-block px-2">
            {formatCurrency(avgTargetPrice)}
          </div>
        </div>

        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 text-right w-full sm:min-w-[200px]">
          <div className="text-xs text-green-800 uppercase font-bold mb-1" title="Incluant appréciation du prix et dividendes cumulés">
            Rendement Total Potentiel
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-green-600">
            {totalReturnPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-green-700 mt-1 opacity-80">
            (Gain Prix + Dividendes)
          </div>
        </div>
      </div>
    </div >
  );
};