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
  // MÊME LOGIQUE QUE KPIDashboard pour cohérence
  const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
  const baseEPS = Math.max(baseYearData?.earningsPerShare || 0, 0);

  const baseValues = {
    eps: Math.max(baseEPS, 0),
    cf: Math.max(baseYearData?.cashFlowPerShare || 0, 0),
    bv: Math.max(baseYearData?.bookValuePerShare || 0, 0),
    div: Math.max(assumptions.currentDividend || 0, 0)
  };

  // Projections (5 Years) - MÊME VALIDATION QUE KPIDashboard
  const projectFutureValueSafe = (current: number, rate: number, years: number): number => {
    // Valider les entrées
    if (current <= 0 || !isFinite(current) || !isFinite(rate)) return 0;
    // Limiter le taux de croissance à un maximum raisonnable (50% par an)
    const safeRate = Math.max(-50, Math.min(rate, 50));
    return current * Math.pow(1 + safeRate / 100, years);
  };

  // Valider et limiter les taux de croissance (MÊME QUE KPIDashboard)
  const safeGrowthEPS = Math.max(-50, Math.min(assumptions.growthRateEPS || 0, 50));
  const safeGrowthCF = Math.max(-50, Math.min(assumptions.growthRateCF || 0, 50));
  const safeGrowthBV = Math.max(-50, Math.min(assumptions.growthRateBV || 0, 50));
  const safeGrowthDiv = Math.max(-50, Math.min(assumptions.growthRateDiv || 0, 50));

  const futureValues = {
    eps: projectFutureValueSafe(baseValues.eps, safeGrowthEPS, 5),
    cf: projectFutureValueSafe(baseValues.cf, safeGrowthCF, 5),
    bv: projectFutureValueSafe(baseValues.bv, safeGrowthBV, 5),
    div: projectFutureValueSafe(baseValues.div, safeGrowthDiv, 5)
  };

  // Valider et limiter les ratios cibles (MÊME QUE KPIDashboard)
  const safeTargetPE = Math.max(1, Math.min(assumptions.targetPE || 0, 100));
  const safeTargetPCF = Math.max(1, Math.min(assumptions.targetPCF || 0, 100));
  const safeTargetPBV = Math.max(0.5, Math.min(assumptions.targetPBV || 0, 50));
  const safeTargetYield = Math.max(0.1, Math.min(assumptions.targetYield || 0, 20));

  // Target Prices - MÊME VALIDATION QUE KPIDashboard
  const targets = {
    eps: futureValues.eps > 0 && safeTargetPE > 0 && safeTargetPE <= 100 ? futureValues.eps * safeTargetPE : 0,
    cf: futureValues.cf > 0 && safeTargetPCF > 0 && safeTargetPCF <= 100 ? futureValues.cf * safeTargetPCF : 0,
    bv: futureValues.bv > 0 && safeTargetPBV > 0 && safeTargetPBV <= 50 ? futureValues.bv * safeTargetPBV : 0,
    div: futureValues.div > 0 && safeTargetYield > 0 && safeTargetYield <= 20 ? futureValues.div / (safeTargetYield / 100) : 0
  };

  // Average Target Price (excluding disabled metrics) - MÊME VALIDATION QUE KPIDashboard
  const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
  const maxReasonableTarget = currentPrice * 50;
  const minReasonableTarget = currentPrice * 0.1; // Minimum 10% du prix actuel
  
  const validTargets = [
    !assumptions.excludeEPS && targets.eps > 0 && targets.eps >= minReasonableTarget && targets.eps <= maxReasonableTarget && isFinite(targets.eps) ? targets.eps : null,
    !assumptions.excludeCF && targets.cf > 0 && targets.cf >= minReasonableTarget && targets.cf <= maxReasonableTarget && isFinite(targets.cf) ? targets.cf : null,
    !assumptions.excludeBV && targets.bv > 0 && targets.bv >= minReasonableTarget && targets.bv <= maxReasonableTarget && isFinite(targets.bv) ? targets.bv : null,
    !assumptions.excludeDIV && targets.div > 0 && targets.div >= minReasonableTarget && targets.div <= maxReasonableTarget && isFinite(targets.div) ? targets.div : null
  ].filter((t): t is number => t !== null && t > 0 && isFinite(t));
  
  const avgTargetPrice = validTargets.length > 0
    ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
    : 0;

  // Dividend Accumulation - MÊME VALIDATION QUE KPIDashboard
  let totalDividends = 0;
  let currentD = Math.max(0, baseValues.div);
  // Limiter les dividendes totaux à 10x le prix actuel (au-delà c'est aberrant)
  const maxReasonableDividends = currentPrice * 10;
  for (let i = 0; i < 5; i++) {
    currentD = currentD * (1 + safeGrowthDiv / 100);
    if (isFinite(currentD) && currentD >= 0 && totalDividends + currentD <= maxReasonableDividends) {
      totalDividends += currentD;
    } else {
      break; // Arrêter si on dépasse les limites
    }
  }
  // Limiter totalDividends au maximum raisonnable
  totalDividends = Math.min(totalDividends, maxReasonableDividends);

  // Total Return Calculation - MÊME VALIDATION QUE KPIDashboard
  let totalReturnPercent = -100; // Par défaut si pas de données valides
  if (currentPrice > 0 && avgTargetPrice > 0 && isFinite(avgTargetPrice) && isFinite(totalDividends) && validTargets.length > 0) {
    const rawReturn = ((avgTargetPrice + totalDividends - currentPrice) / currentPrice) * 100;
    // VALIDATION STRICTE: Vérifier que le calcul est raisonnable
    if (isFinite(rawReturn) && rawReturn >= -100 && rawReturn <= 1000) {
      // Vérifier que avgTargetPrice n'est pas aberrant (max 100x le prix actuel)
      if (avgTargetPrice <= currentPrice * 100 && avgTargetPrice >= currentPrice * 0.1) {
        totalReturnPercent = rawReturn;
      } else {
        // Prix cible aberrant, marquer comme invalide
        totalReturnPercent = -100;
      }
    } else {
      // Calcul aberrant, marquer comme invalide
      totalReturnPercent = -100;
    }
  } else if (validTargets.length === 0) {
    // Si aucune métrique valide, retourner -100% pour indiquer données manquantes
    totalReturnPercent = -100;
  }

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

  // Calculer les intervalles historiques pour chaque métrique (Basé sur tout l'historique disponible pour le contexte long terme)
  const calculateHistoricalRanges = useMemo(() => {
    // 1. Filtrer et trier les données (Ascendant)
    const validData = data
      .filter(d => d.priceHigh > 0 && d.priceLow > 0)
      .sort((a, b) => a.year - b.year); // Ensure ascending order

    // NOTE: On utilise TOUT l'historique disponible pour les "Intervalles de Référence" 
    // afin de donner un contexte maximal à l'utilisateur, même si les valeurs par défaut (orange) sont basées sur 5 ans.
    
    if (validData.length === 0) {
      return null;
    }

    // Calculer les ratios P/E historiques (et autres) sur cette période de 5 ans
    const peRatios: number[] = [];
    const pcfRatios: number[] = [];
    const pbvRatios: number[] = [];
    const yields: number[] = [];
    
    // Arrays pour les taux de croissance ANNUELS (pour montrer la volatilité Min/Max)
    const epsGrowthRates: number[] = [];
    const cfGrowthRates: number[] = [];
    const bvGrowthRates: number[] = [];
    const divGrowthRates: number[] = [];

    validData.forEach((row, idx) => {
      // Ratios
      if (row.earningsPerShare > 0) {
        peRatios.push(row.priceHigh / row.earningsPerShare, row.priceLow / row.earningsPerShare);
      }
      if (row.cashFlowPerShare > 0.1) { // Same threshold as calculations.ts
        pcfRatios.push(row.priceHigh / row.cashFlowPerShare, row.priceLow / row.cashFlowPerShare);
      }
      if (row.bookValuePerShare > 0) {
        pbvRatios.push(row.priceHigh / row.bookValuePerShare, row.priceLow / row.bookValuePerShare);
      }
      if (row.priceHigh > 0 && row.dividendPerShare >= 0) {
        yields.push((row.dividendPerShare / row.priceHigh) * 100);
      }

      // Calculer les taux de croissance entre années consécutives (Yearly volatility)
      if (idx > 0) {
        const prevRow = validData[idx - 1];
        
        if (prevRow.earningsPerShare > 0 && row.earningsPerShare > 0) {
          const growth = ((row.earningsPerShare - prevRow.earningsPerShare) / prevRow.earningsPerShare) * 100;
          if (isFinite(growth) && Math.abs(growth) < 500) epsGrowthRates.push(growth);
        }

        if (prevRow.cashFlowPerShare > 0 && row.cashFlowPerShare > 0) {
          const growth = ((row.cashFlowPerShare - prevRow.cashFlowPerShare) / prevRow.cashFlowPerShare) * 100;
          if (isFinite(growth) && Math.abs(growth) < 500) cfGrowthRates.push(growth);
        }

        if (prevRow.bookValuePerShare > 0 && row.bookValuePerShare > 0) {
          const growth = ((row.bookValuePerShare - prevRow.bookValuePerShare) / prevRow.bookValuePerShare) * 100;
          if (isFinite(growth) && Math.abs(growth) < 500) bvGrowthRates.push(growth);
        }

        if (prevRow.dividendPerShare > 0 && row.dividendPerShare > 0) {
          const growth = ((row.dividendPerShare - prevRow.dividendPerShare) / prevRow.dividendPerShare) * 100;
          if (isFinite(growth) && Math.abs(growth) < 500) divGrowthRates.push(growth);
        }
      }
    });

    const calculateRange = (values: number[]): Range | null => {
      if (values.length === 0) return null;
      // Filter extreme outliers for display
      const filtered = values.filter(v => isFinite(v) && v > -100 && v < 500);
      if (filtered.length === 0) return null;
      return {
        min: Math.min(...filtered),
        max: Math.max(...filtered),
        avg: filtered.reduce((a, b) => a + b, 0) / filtered.length
      };
    };

    // Use calculateRange on the arrays of Y-o-Y growth to show true history range
    return {
      pe: calculateRange(peRatios),
      pcf: calculateRange(pcfRatios),
      pbv: calculateRange(pbvRatios),
      yield: calculateRange(yields),
      epsGrowth: calculateRange(epsGrowthRates),
      cfGrowth: calculateRange(cfGrowthRates),
      bvGrowth: calculateRange(bvGrowthRates),
      divGrowth: calculateRange(divGrowthRates)
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
        <table className="w-full text-xs sm:text-sm text-right border-collapse min-w-[650px] md:min-w-[700px]">
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
                    title={assumptions.excludeEPS 
                      ? "Inclure BPA (EPS) dans le calcul\n\n✅ Cliquez pour inclure cette métrique dans le prix cible moyen.\n\nLa métrique sera:\n• Incluse dans le calcul du prix cible moyen\n• Affichée normalement (non grisée)\n• Les champs seront éditables"
                      : "Exclure BPA (EPS) du calcul\n\n❌ Cliquez pour exclure cette métrique du prix cible moyen.\n\nLa métrique sera:\n• Exclue du calcul du prix cible moyen\n• Affichée en gris (opacité 50%)\n• Les champs seront désactivés\n\nUtile si:\n• Le prix cible est aberrant\n• Les données sont incomplètes\n• La métrique n'est pas pertinente pour ce type d'entreprise"}
                  />
                  <span className="select-none">BPA (EPS)</span>
                  <button
                    onClick={() => toggleMetric('eps')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.eps 
                      ? "Masquer les intervalles de référence historiques\n\nCliquez pour masquer les tableaux de comparaison:\n• Ratios historiques (Titre vs Secteur)\n• Croissance historique (Titre vs Secteur)\n• Projections 5 ans (Titre vs Secteur)"
                      : "Afficher les intervalles de référence historiques\n\nCliquez pour afficher les tableaux de comparaison:\n• Ratios historiques (Titre vs Secteur)\n• Croissance historique (Titre vs Secteur)\n• Projections 5 ans (Titre vs Secteur)\n\nUtile pour valider vos hypothèses par rapport à l'historique et au secteur."}
                  >
                    {expandedMetrics.eps ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"} cursor-help`} title={`BPA (EPS) Actuel: ${baseValues.eps.toFixed(2)} $\n\nValeur de l'année de base ({assumptions.baseYear}).\nSource: Données historiques FMP (vert = officiel).\n\nUtilisée comme point de départ pour la projection à 5 ans.`}>{baseValues.eps.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateEPS} 
                  onChange={(e) => handleInput(e, 'growthRateEPS')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance BPA (EPS)\n\nTaux de croissance annuel composé pour projeter le BPA sur 5 ans.\n\nPlage recommandée: 0% à 20%\nLimite système: -50% à +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: BPA × (1 + Taux/100)⁵`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`BPA (EPS) Projeté (5 ans): ${futureValues.eps.toFixed(2)} $\n\nCalculé avec:\nBPA Actuel (${baseValues.eps.toFixed(2)}) × (1 + ${assumptions.growthRateEPS}%)⁵\n\n= ${futureValues.eps.toFixed(2)} $\n\nValeur projetée utilisée pour calculer le prix cible.`}>{futureValues.eps.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPE} 
                  onChange={(e) => handleInput(e, 'targetPE')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`P/E Cible (Ratio Prix/Bénéfice)\n\nRatio P/E attendu dans 5 ans.\n\nPlage recommandée: 1x à 100x\nLimite système: 1x à 100x\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = BPA Projeté × P/E Cible`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible BPA (EPS): ${formatCurrency(targets.eps)}\n\nCalculé avec:\nBPA Projeté (${futureValues.eps.toFixed(2)}) × P/E Cible (${assumptions.targetPE}x)\n\n= ${formatCurrency(targets.eps)}\n\n${assumptions.excludeEPS ? '❌ Exclu du prix cible moyen' : '✅ Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.eps)}</td>
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
              <td className={`p-3 font-semibold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"} cursor-help`} title={`CFA (Cash Flow) Actuel: ${baseValues.cf.toFixed(2)} $\n\nValeur de l'année de base ({assumptions.baseYear}).\nSource: Données historiques FMP (vert = officiel).\n\nUtilisée comme point de départ pour la projection à 5 ans.`}>{baseValues.cf.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateCF} 
                  onChange={(e) => handleInput(e, 'growthRateCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance CFA (Cash Flow)\n\nTaux de croissance annuel composé pour projeter le Cash Flow sur 5 ans.\n\nPlage recommandée: 0% à 20%\nLimite système: -50% à +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: CF × (1 + Taux/100)⁵`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`CFA (Cash Flow) Projeté (5 ans): ${futureValues.cf.toFixed(2)} $\n\nCalculé avec:\nCF Actuel (${baseValues.cf.toFixed(2)}) × (1 + ${assumptions.growthRateCF}%)⁵\n\n= ${futureValues.cf.toFixed(2)} $\n\nValeur projetée utilisée pour calculer le prix cible.`}>{futureValues.cf.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPCF} 
                  onChange={(e) => handleInput(e, 'targetPCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`P/CF Cible (Ratio Prix/Cash Flow)\n\nRatio P/CF attendu dans 5 ans.\n\nPlage recommandée: 1x à 100x\nLimite système: 1x à 100x\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = CF Projeté × P/CF Cible`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible CFA (Cash Flow): ${formatCurrency(targets.cf)}\n\nCalculé avec:\nCF Projeté (${futureValues.cf.toFixed(2)}) × P/CF Cible (${assumptions.targetPCF}x)\n\n= ${formatCurrency(targets.cf)}\n\n${assumptions.excludeCF ? '❌ Exclu du prix cible moyen' : '✅ Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.cf)}</td>
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
              <td className={`p-3 font-semibold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"} cursor-help`} title={`BV (Book Value) Actuel: ${baseValues.bv.toFixed(2)} $\n\nValeur de l'année de base ({assumptions.baseYear}).\nSource: Données historiques FMP (vert = officiel).\n\nUtilisée comme point de départ pour la projection à 5 ans.`}>{baseValues.bv.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateBV} 
                  onChange={(e) => handleInput(e, 'growthRateBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance BV (Book Value)\n\nTaux de croissance annuel composé pour projeter la Book Value sur 5 ans.\n\nPlage recommandée: 0% à 20%\nLimite système: -50% à +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: BV × (1 + Taux/100)⁵`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`BV (Book Value) Projeté (5 ans): ${futureValues.bv.toFixed(2)} $\n\nCalculé avec:\nBV Actuel (${baseValues.bv.toFixed(2)}) × (1 + ${assumptions.growthRateBV}%)⁵\n\n= ${futureValues.bv.toFixed(2)} $\n\nValeur projetée utilisée pour calculer le prix cible.`}>{futureValues.bv.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPBV} 
                  onChange={(e) => handleInput(e, 'targetPBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`P/BV Cible (Ratio Prix/Valeur Comptable)\n\nRatio P/BV attendu dans 5 ans.\n\nPlage recommandée: 0.5x à 50x\nLimite système: 0.5x à 50x\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = BV Projeté × P/BV Cible`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible BV (Book Value): ${formatCurrency(targets.bv)}\n\nCalculé avec:\nBV Projeté (${futureValues.bv.toFixed(2)}) × P/BV Cible (${assumptions.targetPBV}x)\n\n= ${formatCurrency(targets.bv)}\n\n${assumptions.excludeBV ? '❌ Exclu du prix cible moyen' : '✅ Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.bv)}</td>
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
              <td className={`p-3 font-semibold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"} cursor-help`} title={`DIV (Dividende) Actuel: ${baseValues.div.toFixed(2)} $\n\nValeur de l'année de base ({assumptions.baseYear}).\nSource: Données historiques FMP (vert = officiel).\n\nUtilisée comme point de départ pour la projection à 5 ans.`}>{baseValues.div.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateDiv} 
                  onChange={(e) => handleInput(e, 'growthRateDiv')} 
                  disabled={assumptions.excludeDIV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance DIV (Dividende)\n\nTaux de croissance annuel composé pour projeter le Dividende sur 5 ans.\n\nPlage recommandée: 0% à 20%\nLimite système: -50% à +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: DIV × (1 + Taux/100)⁵`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`DIV (Dividende) Projeté (5 ans): ${futureValues.div.toFixed(2)} $\n\nCalculé avec:\nDIV Actuel (${baseValues.div.toFixed(2)}) × (1 + ${assumptions.growthRateDiv}%)⁵\n\n= ${futureValues.div.toFixed(2)} $\n\nValeur projetée utilisée pour calculer le prix cible.`}>{futureValues.div.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <div className="flex items-center justify-end gap-1">
                  <input 
                    type="number" 
                    value={assumptions.targetYield} 
                    step="0.1" 
                    onChange={(e) => handleInput(e, 'targetYield')} 
                    disabled={assumptions.excludeDIV}
                    className={`w-12 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                    title={`Yield Cible (Rendement Dividende)\n\nRendement en dividendes attendu dans 5 ans (en %).\n\nPlage recommandée: 0.1% à 20%\nLimite système: 0.1% à 20%\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = DIV Projeté / (Yield Cible / 100)`}
                  />
                  <span className={`text-xs ${assumptions.excludeDIV ? "text-gray-400" : "text-orange-600"}`}>%</span>
                </div>
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible DIV (Dividende): ${formatCurrency(targets.div)}\n\nCalculé avec:\nDIV Projeté (${futureValues.div.toFixed(2)}) / (Yield Cible (${assumptions.targetYield}%) / 100)\n\n= ${formatCurrency(targets.div)}\n\n${assumptions.excludeDIV ? '❌ Exclu du prix cible moyen' : '✅ Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.div)}</td>
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

      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 md:gap-6 items-end">
        <div className="text-right w-full sm:w-auto">
          <div className="text-xs text-gray-500 uppercase mb-1 cursor-help" title="Prix Cible Moyen (5 ans)\n\nMoyenne des prix cibles des métriques incluses (non exclues).\n\nCalcul:\n(Prix Cible EPS + Prix Cible CF + Prix Cible BV + Prix Cible DIV) / Nombre de métriques incluses\n\n= ${formatCurrency(avgTargetPrice)}\n\nBasé sur ${validTargets.length} métrique(s) valide(s).">Prix Cible Moyen (5 ans)</div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 border-b-2 border-gray-800 inline-block px-2 cursor-help break-words" title={`Prix Cible Moyen: ${formatCurrency(avgTargetPrice)}\n\nCalculé à partir de ${validTargets.length} métrique(s):\n${validTargets.map((t, i) => `• Métrique ${i + 1}: ${formatCurrency(t)}`).join('\n')}\n\nMoyenne: ${formatCurrency(avgTargetPrice)}\n\nUtilisé pour:\n• Calcul du rendement total\n• Zones de prix recommandées\n• Ratio 3:1`}>
            {formatCurrency(avgTargetPrice)}
          </div>
        </div>

        <div className="bg-green-50 p-2.5 sm:p-3 md:p-4 rounded-lg border border-green-200 text-right w-full sm:w-auto sm:min-w-[180px] md:min-w-[200px]">
          <div className="text-xs text-green-800 uppercase font-bold mb-1 cursor-help" title="Rendement Total Potentiel (5 ans)\n\nInclut:\n• Appréciation du prix (Prix Cible - Prix Actuel)\n• Dividendes cumulés sur 5 ans\n\nFormule:\n((Prix Cible Moyen + Dividendes Totaux - Prix Actuel) / Prix Actuel) × 100\n\n= ${totalReturnPercent.toFixed(2)}%\n\n⚠️ Basé sur vos hypothèses, pas une garantie de performance.">
            Rendement Total Potentiel
          </div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-green-600 cursor-help break-words" title={`Rendement Total: ${totalReturnPercent.toFixed(2)}%\n\nDétail:\n• Prix Actuel: ${formatCurrency(assumptions.currentPrice)}\n• Prix Cible Moyen: ${formatCurrency(avgTargetPrice)}\n• Appréciation: ${((avgTargetPrice - assumptions.currentPrice) / assumptions.currentPrice * 100).toFixed(2)}%\n• Dividendes (5 ans): ~${((totalReturnPercent - ((avgTargetPrice - assumptions.currentPrice) / assumptions.currentPrice * 100)) * assumptions.currentPrice / 100).toFixed(2)} $\n\nBasé sur ${validTargets.length} métrique(s) incluse(s).`}>
            {totalReturnPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] sm:text-xs text-green-700 mt-1 opacity-80">
            (Gain Prix + Dividendes)
          </div>
        </div>
      </div>
    </div >
  );
};