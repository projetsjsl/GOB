import React, { useState, useMemo } from 'react';
import { formatCurrency, projectFutureValue, calculateCAGR, calculateHistoricalGrowth } from '../utils/calculations';
import { CalculatorIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GuardrailConfig, DEFAULT_CONFIG } from '../config/AppConfig';
import { AnnualData, Assumptions, CompanyInfo } from '../types';

interface EvaluationDetailsProps {
  data: AnnualData[];
  assumptions: Assumptions;
  onUpdateAssumption: (key: keyof Assumptions, value: number | boolean) => void;
  info?: CompanyInfo;
  sector?: string;
  config?: GuardrailConfig;
}

interface Range {
  min: number;
  max: number;
  avg: number;
  median: number;
}

export const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({ data, assumptions, onUpdateAssumption, info, sector, config = DEFAULT_CONFIG }) => {
  //  DEBUG : Log pour verifier que les donnees sont bien passees
  React.useEffect(() => {
    if (data && data.length > 0) {
      const lastData = data[data.length - 1];
      console.log(' EvaluationDetails: Donnees recues', {
        dataLength: data.length,
        lastYear: lastData.year,
        lastYearEPS: lastData.earningsPerShare,
        lastYearCF: lastData.cashFlowPerShare,
        lastYearBV: lastData.bookValuePerShare,
        baseYear: assumptions.baseYear,
        growthRateEPS: assumptions.growthRateEPS,
        growthRateCF: assumptions.growthRateCF,
        growthRateBV: assumptions.growthRateBV,
        targetPE: assumptions.targetPE,
        targetPCF: assumptions.targetPCF,
        targetPBV: assumptions.targetPBV,
        currentPrice: assumptions.currentPrice,
        allAssumptions: assumptions
      });
    }
  }, [data, assumptions]);

  // Etats pour gerer l'affichage/reduction des intervalles de reference
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
  // MEME LOGIQUE QUE KPIDashboard pour coherence
  //  CRITIQUE : Si baseYear n'est pas defini ou n'existe pas, utiliser la derniere annee avec donnees valides
  
  //  CRITIQUE : Verifier d'abord si data est vide
  //  OPTIMISATION: Logging conditionnel - seulement en mode debug pour eviter pollution console
  const DEBUG_MODE = typeof window !== 'undefined' && (window.localStorage?.getItem('3p1-debug') === 'true' || window.location.search.includes('debug=true'));
  if (!data || data.length === 0) {
    if (DEBUG_MODE) {
      console.warn(' EvaluationDetails: Aucune donnee disponible', {
        dataLength: data?.length || 0,
        assumptions: assumptions
      });
    }
  }
  
  let baseYearData = data && data.length > 0 ? data.find(d => d.year === assumptions.baseYear) : null;
  if (!baseYearData || (baseYearData.earningsPerShare <= 0 && baseYearData.cashFlowPerShare <= 0 && baseYearData.bookValuePerShare <= 0)) {
    // Chercher la derniere annee avec au moins une valeur positive
    if (data && data.length > 0) {
      baseYearData = [...data].reverse().find(d => 
        d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
      ) || data[data.length - 1];
    }
  }
  
  //  CRITIQUE : Utiliser les valeurs de baseYearData, pas 0 par defaut
  // Si baseYearData est null/undefined, utiliser 0 mais logger l'erreur
  const baseEPS = baseYearData?.earningsPerShare > 0 ? baseYearData.earningsPerShare : 0;
  const baseCF = baseYearData?.cashFlowPerShare > 0 ? baseYearData.cashFlowPerShare : 0;
  const baseBV = baseYearData?.bookValuePerShare > 0 ? baseYearData.bookValuePerShare : 0;
  const baseDiv = assumptions.currentDividend > 0 ? assumptions.currentDividend : 0;

  const baseValues = {
    eps: baseEPS,
    cf: baseCF,
    bv: baseBV,
    div: baseDiv
  };

  //  DEBUG : Log pour diagnostiquer pourquoi les prix sont N/A
  //  OPTIMISATION: Logging conditionnel - seulement en mode debug
  if (baseValues.eps === 0 && baseValues.cf === 0 && baseValues.bv === 0) {
    if (DEBUG_MODE) {
      console.warn(' EvaluationDetails: Toutes les valeurs de base sont a 0', {
        baseYear: assumptions.baseYear,
        baseYearData,
        dataLength: data?.length || 0,
        dataYears: data?.map(d => d.year) || [],
        baseValues,
        allDataEPS: data?.map(d => ({ year: d.year, eps: d.earningsPerShare, cf: d.cashFlowPerShare, bv: d.bookValuePerShare })) || [],
        hasData: !!data,
        dataIsArray: Array.isArray(data)
      });
    }
  }

  // Projections (5 Years) - MEME VALIDATION QUE KPIDashboard
  //  CRITIQUE : Gerer undefined pour eviter les valeurs inventees (0)
  const projectFutureValueSafe = (current: number, rate: number | undefined, years: number): number | undefined => {
    //  Si le taux est undefined ou null, retourner undefined (pas 0)
    if (rate === undefined || rate === null) {
      if (DEBUG_MODE) {
        console.warn(' projectFutureValueSafe: rate is undefined/null', { current, rate, years });
      }
      return undefined;
    }
    // Valider les entrees - Si current est 0 ou negatif, retourner undefined (pas 0) pour indiquer donnees manquantes
    if (current <= 0 || !isFinite(current)) {
      if (DEBUG_MODE) {
        console.warn(' projectFutureValueSafe: current is invalid', { current, rate, years });
      }
      return undefined;
    }
    if (!isFinite(rate)) {
      if (DEBUG_MODE) {
        console.warn(' projectFutureValueSafe: rate is not finite', { current, rate, years });
      }
      return undefined;
    }
    // Limiter le taux de croissance (Configurable)
    const { min, max } = config.growth;
    const safeRate = Math.max(min, Math.min(rate, max));
    const result = current * Math.pow(1 + safeRate / 100, years);
    const finalResult = isFinite(result) && result > 0 ? result : undefined;
    if (finalResult === undefined && DEBUG_MODE) {
      console.warn(' projectFutureValueSafe: result is invalid', { current, rate, years, safeRate, result });
    }
    return finalResult;
  };

  // Valider et limiter les taux de croissance (Configurable)
  //  FIX: Si les taux de croissance sont 0 ou undefined, utiliser la moyenne historique 5 ans
  // Cela corrige le probleme des projections 5 ans a 0 au depart
  const growthMin = config.growth.min;
  const growthMax = config.growth.max;
  
  // Helper pour calculer la croissance historique si absente
  const getSafeGrowth = (assumedGrowth: number | undefined, metricKey: keyof AnnualData): number => {
    if (assumedGrowth !== undefined && assumedGrowth !== 0) {
      return Math.max(growthMin, Math.min(assumedGrowth, growthMax));
    }
    // Si 0 ou undefined, calculer depuis l'historique 5 ans
    const historicalGrowth = calculateHistoricalGrowth(data, metricKey, 5);
    return historicalGrowth !== 0 ? Math.max(growthMin, Math.min(historicalGrowth, growthMax)) : 0;
  };
  
  const safeGrowthEPS = getSafeGrowth(assumptions.growthRateEPS, 'earningsPerShare');
  const safeGrowthCF = getSafeGrowth(assumptions.growthRateCF, 'cashFlowPerShare');
  const safeGrowthBV = getSafeGrowth(assumptions.growthRateBV, 'bookValuePerShare');
  const safeGrowthDiv = getSafeGrowth(assumptions.growthRateDiv, 'dividendPerShare');

  const futureValues = {
    eps: projectFutureValueSafe(baseValues.eps, safeGrowthEPS, 5),
    cf: projectFutureValueSafe(baseValues.cf, safeGrowthCF, 5),
    bv: projectFutureValueSafe(baseValues.bv, safeGrowthBV, 5),
    div: projectFutureValueSafe(baseValues.div, safeGrowthDiv, 5)
  };

  //  DEBUG : Log pour diagnostiquer les projections
  //  OPTIMISATION: Logging conditionnel - seulement en mode debug
  if (futureValues.eps === undefined && futureValues.cf === undefined && futureValues.bv === undefined) {
    if (DEBUG_MODE) {
      console.warn(' EvaluationDetails: Toutes les projections sont undefined', {
        baseValues,
        safeGrowthEPS,
        safeGrowthCF,
        safeGrowthBV,
        safeGrowthDiv,
        assumptions: {
          growthRateEPS: assumptions.growthRateEPS,
          growthRateCF: assumptions.growthRateCF,
          growthRateBV: assumptions.growthRateBV,
          growthRateDiv: assumptions.growthRateDiv
        }
      });
    }
  }

  // Valider et limiter les ratios cibles (Configurable)
  //  CRITIQUE : Ne pas utiliser || 0 pour eviter les valeurs inventees
  const safeTargetPE = assumptions.targetPE !== undefined 
    ? Math.max(config.ratios.pe.min, Math.min(assumptions.targetPE, config.ratios.pe.max))
    : undefined;
  const safeTargetPCF = assumptions.targetPCF !== undefined 
    ? Math.max(config.ratios.pcf.min, Math.min(assumptions.targetPCF, config.ratios.pcf.max))
    : undefined;
  const safeTargetPBV = assumptions.targetPBV !== undefined 
    ? Math.max(config.ratios.pbv.min, Math.min(assumptions.targetPBV, config.ratios.pbv.max))
    : undefined;
  const safeTargetYield = assumptions.targetYield !== undefined 
    ? Math.max(config.ratios.yield.min, Math.min(assumptions.targetYield, config.ratios.yield.max))
    : undefined;

  // Target Prices - MEME VALIDATION QUE KPIDashboard
  //  CRITIQUE : Gerer undefined pour eviter les valeurs inventees (0)
  const targets = {
    eps: futureValues.eps !== undefined && safeTargetPE !== undefined && futureValues.eps > 0 && safeTargetPE > 0 && safeTargetPE <= 100 
      ? futureValues.eps * safeTargetPE 
      : undefined,
    cf: futureValues.cf !== undefined && safeTargetPCF !== undefined && futureValues.cf > 0 && safeTargetPCF > 0 && safeTargetPCF <= 100 
      ? futureValues.cf * safeTargetPCF 
      : undefined,
    bv: futureValues.bv !== undefined && safeTargetPBV !== undefined && futureValues.bv > 0 && safeTargetPBV > 0 && safeTargetPBV <= 50 
      ? futureValues.bv * safeTargetPBV 
      : undefined,
    div: futureValues.div !== undefined && safeTargetYield !== undefined && futureValues.div > 0 && safeTargetYield > 0 && safeTargetYield <= 20 
      ? futureValues.div / (safeTargetYield / 100) 
      : undefined
  };

  //  DEBUG : Log pour diagnostiquer pourquoi les prix cibles sont undefined
  //  OPTIMISATION: Logging conditionnel - seulement en mode debug
  if (targets.eps === undefined && targets.cf === undefined && targets.bv === undefined && targets.div === undefined) {
    if (DEBUG_MODE) {
      console.warn(' EvaluationDetails: Tous les prix cibles sont undefined', {
        futureValues,
        safeTargetPE,
        safeTargetPCF,
        safeTargetPBV,
        safeTargetYield,
        assumptions: {
          targetPE: assumptions.targetPE,
          targetPCF: assumptions.targetPCF,
          targetPBV: assumptions.targetPBV,
          targetYield: assumptions.targetYield
        },
        baseValues
      });
    }
  }

  // Average Target Price (excluding disabled metrics) - MEME VALIDATION QUE KPIDashboard
  const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
  const maxReasonableTarget = currentPrice * config.projections.maxReasonableTargetMultiplier;
  const minReasonableTarget = currentPrice * config.projections.minReasonableTargetMultiplier;
  
  //  CRITIQUE : Gerer undefined pour eviter les valeurs inventees
  const validTargets = [
    !assumptions.excludeEPS && targets.eps !== undefined && targets.eps > 0 && targets.eps >= minReasonableTarget && targets.eps <= maxReasonableTarget && isFinite(targets.eps) ? targets.eps : null,
    !assumptions.excludeCF && targets.cf !== undefined && targets.cf > 0 && targets.cf >= minReasonableTarget && targets.cf <= maxReasonableTarget && isFinite(targets.cf) ? targets.cf : null,
    !assumptions.excludeBV && targets.bv !== undefined && targets.bv > 0 && targets.bv >= minReasonableTarget && targets.bv <= maxReasonableTarget && isFinite(targets.bv) ? targets.bv : null,
    !assumptions.excludeDIV && targets.div !== undefined && targets.div > 0 && targets.div >= minReasonableTarget && targets.div <= maxReasonableTarget && isFinite(targets.div) ? targets.div : null
  ].filter((t): t is number => t !== null && t > 0 && isFinite(t));
  
  //  Si aucun target valide, retourner undefined au lieu de 0
  const avgTargetPrice = validTargets.length > 0
    ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
    : undefined;

  // Dividend Accumulation - MEME VALIDATION QUE KPIDashboard
  let totalDividends = 0;
  let currentD = Math.max(0, baseValues.div);
  // Limiter les dividendes totaux (Configurable)
  const maxReasonableDividends = currentPrice * config.projections.maxDividendMultiplier;
  for (let i = 0; i < 5; i++) {
    currentD = currentD * (1 + safeGrowthDiv / 100);
    if (isFinite(currentD) && currentD >= 0 && totalDividends + currentD <= maxReasonableDividends) {
      totalDividends += currentD;
    } else {
      break; // Arreter si on depasse les limites
    }
  }
  // Limiter totalDividends au maximum raisonnable
  totalDividends = Math.min(totalDividends, maxReasonableDividends);

  // Total Return Calculation - MEME VALIDATION QUE KPIDashboard
  let totalReturnPercent = -100; // Par defaut si pas de donnees valides
  if (currentPrice > 0 && avgTargetPrice > 0 && isFinite(avgTargetPrice) && isFinite(totalDividends) && validTargets.length > 0) {
    const rawReturn = ((avgTargetPrice + totalDividends - currentPrice) / currentPrice) * 100;
    // VALIDATION STRICTE: Verifier que le calcul est raisonnable
    if (isFinite(rawReturn) && rawReturn >= config.returns.min && rawReturn <= config.returns.max) {
      // Verifier que avgTargetPrice n'est pas aberrant
      const maxTarget = currentPrice * config.returns.maxTargetMultiplier;
      const minTarget = currentPrice * config.projections.minReasonableTargetMultiplier;
      if (avgTargetPrice <= maxTarget && avgTargetPrice >= minTarget) {
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
    // Si aucune metrique valide, retourner -100% pour indiquer donnees manquantes
    totalReturnPercent = -100;
  }

  // Annualized Return (CAGR)
  // End Value = Target + Dividends ? Or just Target and treat dividends as yield?
  // Value Line often uses: (Target Price / Current Price)^(1/5) - 1 + Avg Yield.
  // But based on the user request matching 58.29% which is likely total upside:
  // We stick to totalReturnPercent.

  //  FIX: Ameliorer handleInput pour permettre l'entree de tous les chiffres valides
  // Le probleme etait que parseFloat peut retourner NaN pour des valeurs partielles (ex: "1.")
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Assumptions) => {
    const inputValue = e.target.value.trim();
    
    // Permettre la valeur vide (pour permettre la suppression complete)
    if (inputValue === '' || inputValue === '-') {
      onUpdateAssumption(key, 0);
      return;
    }
    
    // Permettre les valeurs partielles avec point decimal (ex: "1.", "1.5")
    const val = parseFloat(inputValue);
    
    //  FIX: Accepter les valeurs valides meme si elles sont en cours de saisie
    // Ne pas bloquer les valeurs qui sont dans une plage raisonnable
    if (!isNaN(val) && isFinite(val)) {
      // Verifier les limites selon le type de ratio
      let min = -Infinity;
      let max = Infinity;
      
      if (key === 'targetPE' || key === 'targetPCF') {
        min = config.ratios.pe.min; // 1
        max = config.ratios.pe.max; // 100
      } else if (key === 'targetPBV') {
        min = config.ratios.pbv.min; // 0.5
        max = config.ratios.pbv.max; // 50
      } else if (key === 'targetYield') {
        min = config.ratios.yield.min; // 0.1
        max = config.ratios.yield.max; // 20
      } else if (key.includes('growthRate')) {
        min = config.growth.min; // -50
        max = config.growth.max; // 50
      }
      
      //  FIX: Permettre l'entree meme si hors limites (l'utilisateur peut etre en train de taper)
      // La validation finale se fera lors de la perte de focus ou de la sauvegarde
      onUpdateAssumption(key, val);
    }
  };

  const handleToggleExclusion = (metric: 'excludeEPS' | 'excludeCF' | 'excludeBV' | 'excludeDIV') => {
    const currentValue = assumptions[metric] || false;
    // Convert boolean to number for onUpdateAssumption (0 = false, 1 = true)
    onUpdateAssumption(metric as keyof Assumptions, currentValue ? 0 : 1);
  };

  // Helper pour calculer la mediane (deplace ici pour etre accessible dans useMemo)
  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    // Filtrer les valeurs invalides avant le tri
    const validValues = values.filter(v => isFinite(v));
    if (validValues.length === 0) return 0;
    
    const sorted = [...validValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    // Si pair, moyenne des deux du milieu
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Calculer les intervalles historiques pour chaque metrique (Base sur tout l'historique disponible pour le contexte long terme)
  const calculateHistoricalRanges = useMemo(() => {
    // 1. Filtrer et trier les donnees (Ascendant)
    const validData = data
      .filter(d => d.priceHigh > 0 && d.priceLow > 0)
      .sort((a, b) => a.year - b.year); // Ensure ascending order

    // NOTE: On utilise TOUT l'historique disponible pour les "Intervalles de Reference" 
    // afin de donner un contexte maximal a l'utilisateur, meme si les valeurs par defaut (orange) sont basees sur 5 ans.
    
    if (validData.length === 0) {
      return null;
    }

    // Calculer les ratios P/E historiques (et autres) sur cette periode de 5 ans
    const peRatios: number[] = [];
    const pcfRatios: number[] = [];
    const pbvRatios: number[] = [];
    const yields: number[] = [];
    
    // Arrays pour les taux de croissance ANNUELS (pour montrer la volatilite Min/Max)
    const epsGrowthRates: number[] = [];
    const cfGrowthRates: number[] = [];
    const bvGrowthRates: number[] = [];
    const divGrowthRates: number[] = [];

    // Helper pour filtrer les ratios aberrants lors de l'ajout
    const addRatioIfValid = (ratios: number[], value: number, type: 'pe' | 'pcf' | 'pbv' | 'yield' | 'growth', min: number, max: number) => {
      if (isFinite(value) && value >= min && value <= max) {
        ratios.push(value);
      }
    };

    validData.forEach((row, idx) => {
      // Ratios -  Filtrer directement lors de l'ajout
      if (row.earningsPerShare > 0) {
        const peHigh = row.priceHigh / row.earningsPerShare;
        const peLow = row.priceLow / row.earningsPerShare;
        addRatioIfValid(peRatios, peHigh, 'pe', 1, 200);
        addRatioIfValid(peRatios, peLow, 'pe', 1, 200);
      }
      if (row.cashFlowPerShare > 0.1) { // Same threshold as calculations.ts
        const pcfHigh = row.priceHigh / row.cashFlowPerShare;
        const pcfLow = row.priceLow / row.cashFlowPerShare;
        addRatioIfValid(pcfRatios, pcfHigh, 'pcf', 1, 200);
        addRatioIfValid(pcfRatios, pcfLow, 'pcf', 1, 200);
      }
      if (row.bookValuePerShare > 0) {
        const pbvHigh = row.priceHigh / row.bookValuePerShare;
        const pbvLow = row.priceLow / row.bookValuePerShare;
        addRatioIfValid(pbvRatios, pbvHigh, 'pbv', 0.1, 50);
        addRatioIfValid(pbvRatios, pbvLow, 'pbv', 0.1, 50);
      }
      if (row.priceHigh > 0 && row.dividendPerShare >= 0) {
        const yieldValue = (row.dividendPerShare / row.priceHigh) * 100;
        addRatioIfValid(yields, yieldValue, 'yield', 0, 50);
      }

      // Calculer les taux de croissance entre annees consecutives (Yearly volatility)
      if (idx > 0) {
        const prevRow = validData[idx - 1];
        
        if (prevRow.earningsPerShare > 0 && row.earningsPerShare > 0) {
          const growth = ((row.earningsPerShare - prevRow.earningsPerShare) / prevRow.earningsPerShare) * 100;
          //  Filtrer directement : Growth doit etre entre -50% et +100%
          addRatioIfValid(epsGrowthRates, growth, 'growth', -50, 100);
        }

        if (prevRow.cashFlowPerShare > 0 && row.cashFlowPerShare > 0) {
          const growth = ((row.cashFlowPerShare - prevRow.cashFlowPerShare) / prevRow.cashFlowPerShare) * 100;
          //  Filtrer directement : Growth doit etre entre -50% et +100%
          addRatioIfValid(cfGrowthRates, growth, 'growth', -50, 100);
        }

        if (prevRow.bookValuePerShare > 0 && row.bookValuePerShare > 0) {
          const growth = ((row.bookValuePerShare - prevRow.bookValuePerShare) / prevRow.bookValuePerShare) * 100;
          //  Filtrer directement : Growth doit etre entre -50% et +100%
          addRatioIfValid(bvGrowthRates, growth, 'growth', -50, 100);
        }

        if (prevRow.dividendPerShare > 0 && row.dividendPerShare > 0) {
          const growth = ((row.dividendPerShare - prevRow.dividendPerShare) / prevRow.dividendPerShare) * 100;
          //  Filtrer directement : Growth doit etre entre -50% et +100%
          addRatioIfValid(divGrowthRates, growth, 'growth', -50, 100);
        }
      }
    });

    // Filtrer les ratios avec des limites realistes selon le type
    const filterRatiosByType = (values: number[], type: 'pe' | 'pcf' | 'pbv' | 'yield' | 'growth'): number[] => {
      if (values.length === 0) return [];
      
      // Limites realistes selon le type de ratio (plus strictes que config.outliers)
      const limits: Record<string, { min: number; max: number }> = {
        pe: { min: 1, max: 200 },      // P/E: 1x a 200x
        pcf: { min: 1, max: 200 },     // P/CF: 1x a 200x
        pbv: { min: 0.1, max: 50 },    // P/BV: 0.1x a 50x
        yield: { min: 0, max: 50 },    // Yield: 0% a 50%
        growth: { min: -50, max: 100 } // Growth: -50% a +100%
      };
      
      const limit = limits[type] || config.outliers;
      return values.filter(v => isFinite(v) && v >= limit.min && v <= limit.max);
    };

    const calculateRange = (values: number[], type: 'pe' | 'pcf' | 'pbv' | 'yield' | 'growth' = 'growth'): Range | null => {
      if (values.length === 0) return null;
      // Filter extreme outliers for display avec limites specifiques par type
      const filtered = filterRatiosByType(values, type);
      if (filtered.length === 0) return null;
      return {
        min: Math.min(...filtered),
        max: Math.max(...filtered),
        avg: filtered.reduce((a, b) => a + b, 0) / filtered.length,
        median: calculateMedian(filtered)
      };
    };

    // Use calculateRange on the arrays of Y-o-Y growth to show true history range
    return {
      pe: calculateRange(peRatios, 'pe'),
      pcf: calculateRange(pcfRatios, 'pcf'),
      pbv: calculateRange(pbvRatios, 'pbv'),
      yield: calculateRange(yields, 'yield'),
      epsGrowth: calculateRange(epsGrowthRates, 'growth'),
      cfGrowth: calculateRange(cfGrowthRates, 'growth'),
      bvGrowth: calculateRange(bvGrowthRates, 'growth'),
      divGrowth: calculateRange(divGrowthRates, 'growth')
    };
  }, [data]);

  // Valeurs sectorielles par defaut (simplifiees)
  const sectorRanges = useMemo(() => {
    const sectorKey = sector || info?.sector || '';
    const normalizedSector = sectorKey.toLowerCase();
    
    // Mapping simplifie des secteurs
    if (normalizedSector.includes('tech') || normalizedSector.includes('technologie') || normalizedSector.includes('ti')) {
      return {
        pe: { min: 15, max: 35, avg: 25, median: 25 },
        pcf: { min: 12, max: 28, avg: 20, median: 20 },
        pbv: { min: 3, max: 8, avg: 5.5, median: 5.5 },
        yield: { min: 0.5, max: 2.5, avg: 1.5, median: 1.5 },
        epsGrowth: { min: 8, max: 20, avg: 14, median: 14 },
        cfGrowth: { min: 8, max: 20, avg: 14, median: 14 },
        bvGrowth: { min: 5, max: 15, avg: 10, median: 10 },
        divGrowth: { min: 0, max: 10, avg: 5, median: 5 }
      };
    }
    
    // Valeurs par defaut generiques (median = avg pour simplifier les defaults)
    return {
      pe: { min: 10, max: 25, avg: 17, median: 17 },
      pcf: { min: 8, max: 20, avg: 14, median: 14 },
      pbv: { min: 2, max: 6, avg: 4, median: 4 },
      yield: { min: 1, max: 4, avg: 2.5, median: 2.5 },
      epsGrowth: { min: 5, max: 15, avg: 10, median: 10 },
      cfGrowth: { min: 5, max: 15, avg: 10, median: 10 },
      bvGrowth: { min: 3, max: 12, avg: 7, median: 7 },
      divGrowth: { min: 1, max: 8, avg: 4, median: 4 }
    };
  }, [sector, info?.sector]);

  // Projections 5 ans pour le titre
  //  CRITIQUE : Gerer undefined pour eviter les valeurs inventees (NaN)
  const title5YearProjections = useMemo(() => {
    if (!calculateHistoricalRanges) return null;
    //  Si les valeurs sont undefined, retourner null au lieu de calculer avec NaN
    if (assumptions.targetPE === undefined || assumptions.growthRateEPS === undefined) {
      return null;
    }
    return {
      pe: assumptions.targetPE !== undefined 
        ? { min: assumptions.targetPE * 0.9, max: assumptions.targetPE * 1.1, avg: assumptions.targetPE, median: assumptions.targetPE }
        : null,
      pcf: assumptions.targetPCF !== undefined 
        ? { min: assumptions.targetPCF * 0.9, max: assumptions.targetPCF * 1.1, avg: assumptions.targetPCF, median: assumptions.targetPCF }
        : null,
      pbv: assumptions.targetPBV !== undefined 
        ? { min: assumptions.targetPBV * 0.9, max: assumptions.targetPBV * 1.1, avg: assumptions.targetPBV, median: assumptions.targetPBV }
        : null,
      yield: assumptions.targetYield !== undefined 
        ? { min: assumptions.targetYield * 0.9, max: assumptions.targetYield * 1.1, avg: assumptions.targetYield, median: assumptions.targetYield }
        : null,
      epsGrowth: assumptions.growthRateEPS !== undefined 
        ? { min: assumptions.growthRateEPS * 0.8, max: assumptions.growthRateEPS * 1.2, avg: assumptions.growthRateEPS, median: assumptions.growthRateEPS }
        : null,
      cfGrowth: assumptions.growthRateCF !== undefined 
        ? { min: assumptions.growthRateCF * 0.8, max: assumptions.growthRateCF * 1.2, avg: assumptions.growthRateCF, median: assumptions.growthRateCF }
        : null,
      bvGrowth: assumptions.growthRateBV !== undefined 
        ? { min: assumptions.growthRateBV * 0.8, max: assumptions.growthRateBV * 1.2, avg: assumptions.growthRateBV, median: assumptions.growthRateBV }
        : null,
      divGrowth: assumptions.growthRateDiv !== undefined 
        ? { min: assumptions.growthRateDiv * 0.8, max: assumptions.growthRateDiv * 1.2, avg: assumptions.growthRateDiv, median: assumptions.growthRateDiv }
        : null
    };
  }, [calculateHistoricalRanges, assumptions]);

  // Projections 5 ans pour le secteur
  const sector5YearProjections = useMemo(() => {
    return {
      pe: { min: sectorRanges.pe.avg * 0.9, max: sectorRanges.pe.avg * 1.1, avg: sectorRanges.pe.avg, median: sectorRanges.pe.median },
      pcf: { min: sectorRanges.pcf.avg * 0.9, max: sectorRanges.pcf.avg * 1.1, avg: sectorRanges.pcf.avg, median: sectorRanges.pcf.median },
      pbv: { min: sectorRanges.pbv.avg * 0.9, max: sectorRanges.pbv.avg * 1.1, avg: sectorRanges.pbv.avg, median: sectorRanges.pbv.median },
      yield: { min: sectorRanges.yield.avg * 0.9, max: sectorRanges.yield.avg * 1.1, avg: sectorRanges.yield.avg, median: sectorRanges.yield.median },
      epsGrowth: { min: sectorRanges.epsGrowth.avg * 0.8, max: sectorRanges.epsGrowth.avg * 1.2, avg: sectorRanges.epsGrowth.avg, median: sectorRanges.epsGrowth.median },
      cfGrowth: { min: sectorRanges.cfGrowth.avg * 0.8, max: sectorRanges.cfGrowth.avg * 1.2, avg: sectorRanges.cfGrowth.avg, median: sectorRanges.cfGrowth.median },
      bvGrowth: { min: sectorRanges.bvGrowth.avg * 0.8, max: sectorRanges.bvGrowth.avg * 1.2, avg: sectorRanges.bvGrowth.avg, median: sectorRanges.bvGrowth.median },
      divGrowth: { min: sectorRanges.divGrowth.avg * 0.8, max: sectorRanges.divGrowth.avg * 1.2, avg: sectorRanges.divGrowth.avg, median: sectorRanges.divGrowth.median }
    };
  }, [sectorRanges]);

  const formatRange = (range: Range | null, suffix: string = '') => {
    if (!range) return 'N/A';
    // Afficher Min - Max (Med: X)
    return `${range.min?.toFixed(1) ?? '0.0'} - ${range.max?.toFixed(1) ?? '0.0'}${suffix} (Med: ${range.median?.toFixed(1) ?? '0.0'}${suffix})`;
  };

  const formatGrowthRange = (range: Range | null) => {
    if (!range) return 'N/A';
    return `${range.min?.toFixed(1) ?? '0.0'}% - ${range.max?.toFixed(1) ?? '0.0'}% (Med: ${range.median?.toFixed(1) ?? '0.0'}%)`;
  };

  // Composant pour afficher les intervalles de reference sous une metrique
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
        <div className="text-xs font-semibold text-blue-800 mb-2 sm:mb-3"> Intervalles de Reference - {metricConfig[metric].ratioLabel}</div>
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
          Titre Historique: Calcule a partir de vos donnees historiques. Secteur Typique: Valeurs de reference pour le secteur {info?.sector || 'generique'}. 5 Ans: Projections basees sur vos hypotheses actuelles.
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
        <CalculatorIcon className="w-5 h-5 text-blue-600" />
        EVALUATION PERSONNELLE (Projection 5 Ans)
        <span className="text-xs font-normal text-gray-500 ml-2">( = Incluse,  = Exclue)</span>
      </h3>

      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <table className="w-full text-xs sm:text-sm text-right border-collapse" style={{ minWidth: '100%' }}>
          <thead className="bg-slate-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-2 text-left">Metrique</th>
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
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0 accent-blue-600"
                    title={assumptions.excludeEPS 
                      ? "Inclure BPA (EPS) dans le calcul\n\n Cliquez pour inclure cette metrique dans le prix cible moyen.\n\nLa metrique sera:\n- Incluse dans le calcul du prix cible moyen\n- Affichee normalement (non grisee)\n- Les champs seront editables"
                      : "Exclure BPA (EPS) du calcul\n\n Cliquez pour exclure cette metrique du prix cible moyen.\n\nLa metrique sera:\n- Exclue du calcul du prix cible moyen\n- Affichee en gris (opacite 50%)\n- Les champs seront desactives\n\nUtile si:\n- Le prix cible est aberrant\n- Les donnees sont incompletes\n- La metrique n'est pas pertinente pour ce type d'entreprise"}
                  />
                  <span className="select-none">BPA (EPS)</span>
                  <button
                    onClick={() => toggleMetric('eps')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.eps 
                      ? "Masquer les intervalles de reference historiques\n\nCliquez pour masquer les tableaux de comparaison:\n- Ratios historiques (Titre vs Secteur)\n- Croissance historique (Titre vs Secteur)\n- Projections 5 ans (Titre vs Secteur)"
                      : "Afficher les intervalles de reference historiques\n\nCliquez pour afficher les tableaux de comparaison:\n- Ratios historiques (Titre vs Secteur)\n- Croissance historique (Titre vs Secteur)\n- Projections 5 ans (Titre vs Secteur)\n\nUtile pour valider vos hypotheses par rapport a l'historique et au secteur."}
                  >
                    {expandedMetrics.eps ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeEPS ? "bg-red-200 text-red-800 border-2 border-red-500 border-dashed" : "bg-green-50 text-green-800"} cursor-help relative`} title={`BPA (EPS) Actuel: ${baseValues.eps?.toFixed(2) ?? '0.00'} $\n\nValeur de l'annee de base (${assumptions.baseYear}).\nSource: Donnees historiques FMP (vert = officiel).\n\n${assumptions.excludeEPS ? ' EXCLUE: Cette metrique produit un prix cible aberrant et a ete exclue du calcul.' : 'Utilisee comme point de depart pour la projection a 5 ans.'}`}>
                {baseValues.eps?.toFixed(2) ?? '0.00'}
                {assumptions.excludeEPS && (
                  <ExclamationTriangleIcon className="absolute top-1 right-1 w-4 h-4 text-red-600" title="Metrique exclue (prix cible aberrant)" />
                )}
              </td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateEPS} 
                  onChange={(e) => handleInput(e, 'growthRateEPS')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance BPA (EPS)\n\nTaux de croissance annuel compose pour projeter le BPA sur 5 ans.\n\nPlage recommandee: 0% a 20%\nLimite systeme: -50% a +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: BPA x (1 + Taux/100)5`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`BPA (EPS) Projete (5 ans): ${futureValues.eps?.toFixed(2) ?? '0.00'} $\n\nCalcule avec:\nBPA Actuel (${baseValues.eps?.toFixed(2) ?? '0.00'}) x (1 + ${assumptions.growthRateEPS}%)5\n\n= ${futureValues.eps?.toFixed(2) ?? '0.00'} $\n\nValeur projetee utilisee pour calculer le prix cible.`}>{futureValues.eps?.toFixed(2) ?? '0.00'}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPE} 
                  onChange={(e) => handleInput(e, 'targetPE')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`P/E Cible (Ratio Prix/Benefice)\n\nRatio P/E attendu dans 5 ans.\n\nPlage recommandee: 1x a 100x\nLimite systeme: 1x a 100x\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = BPA Projete x P/E Cible`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible BPA (EPS): ${formatCurrency(targets.eps)}\n\nCalcule avec:\nBPA Projete (${(futureValues.eps || 0).toFixed(2)}) x P/E Cible (${assumptions.targetPE}x)\n\n= ${formatCurrency(targets.eps)}\n\n${assumptions.excludeEPS ? ' Exclu du prix cible moyen' : ' Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.eps)}</td>
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
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0 accent-blue-600"
                    title={assumptions.excludeCF ? "Inclure cette metrique dans le calcul" : "Exclure cette metrique du calcul"}
                  />
                  <span className="select-none">CFA (Cash Flow)</span>
                  <button
                    onClick={() => toggleMetric('cf')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.cf ? "Masquer les intervalles de reference" : "Afficher les intervalles de reference"}
                  >
                    {expandedMetrics.cf ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeCF ? "bg-red-200 text-red-800 border-2 border-red-500 border-dashed" : "bg-green-50 text-green-800"} cursor-help relative`} title={`CFA (Cash Flow) Actuel: ${baseValues.cf?.toFixed(2) ?? '0.00'} $\n\nValeur de l'annee de base (${assumptions.baseYear}).\nSource: Donnees historiques FMP (vert = officiel).\n\n${assumptions.excludeCF ? ' EXCLUE: Cette metrique produit un prix cible aberrant et a ete exclue du calcul.' : 'Utilisee comme point de depart pour la projection a 5 ans.'}`}>
                {baseValues.cf?.toFixed(2) ?? '0.00'}
                {assumptions.excludeCF && (
                  <ExclamationTriangleIcon className="absolute top-1 right-1 w-4 h-4 text-red-600" title="Metrique exclue (prix cible aberrant)" />
                )}
              </td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateCF} 
                  onChange={(e) => handleInput(e, 'growthRateCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance CFA (Cash Flow)\n\nTaux de croissance annuel compose pour projeter le Cash Flow sur 5 ans.\n\nPlage recommandee: 0% a 20%\nLimite systeme: -50% a +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: CF x (1 + Taux/100)5`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`CFA (Cash Flow) Projete (5 ans): ${futureValues.cf?.toFixed(2) ?? '0.00'} $\n\nCalcule avec:\nCF Actuel (${baseValues.cf?.toFixed(2) ?? '0.00'}) x (1 + ${assumptions.growthRateCF}%)5\n\n= ${futureValues.cf?.toFixed(2) ?? '0.00'} $\n\nValeur projetee utilisee pour calculer le prix cible.`}>{futureValues.cf?.toFixed(2) ?? '0.00'}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPCF} 
                  onChange={(e) => handleInput(e, 'targetPCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`P/CF Cible (Ratio Prix/Cash Flow)\n\nRatio P/CF attendu dans 5 ans.\n\nPlage recommandee: 1x a 100x\nLimite systeme: 1x a 100x\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = CF Projete x P/CF Cible`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible CFA (Cash Flow): ${formatCurrency(targets.cf)}\n\nCalcule avec:\nCF Projete (${(futureValues.cf || 0).toFixed(2)}) x P/CF Cible (${assumptions.targetPCF}x)\n\n= ${formatCurrency(targets.cf)}\n\n${assumptions.excludeCF ? ' Exclu du prix cible moyen' : ' Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.cf)}</td>
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
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0 accent-blue-600"
                    title={assumptions.excludeBV ? "Inclure cette metrique dans le calcul" : "Exclure cette metrique du calcul"}
                  />
                  <span className="select-none">BV (Book Value)</span>
                  <button
                    onClick={() => toggleMetric('bv')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.bv ? "Masquer les intervalles de reference" : "Afficher les intervalles de reference"}
                  >
                    {expandedMetrics.bv ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeBV ? "bg-red-200 text-red-800 border-2 border-red-500 border-dashed" : "bg-green-50 text-green-800"} cursor-help relative`} title={`BV (Book Value) Actuel: ${baseValues.bv?.toFixed(2) ?? '0.00'} $\n\nValeur de l'annee de base (${assumptions.baseYear}).\nSource: Donnees historiques FMP (vert = officiel).\n\n${assumptions.excludeBV ? ' EXCLUE: Cette metrique produit un prix cible aberrant et a ete exclue du calcul.' : 'Utilisee comme point de depart pour la projection a 5 ans.'}`}>
                {baseValues.bv?.toFixed(2) ?? '0.00'}
                {assumptions.excludeBV && (
                  <ExclamationTriangleIcon className="absolute top-1 right-1 w-4 h-4 text-red-600" title="Metrique exclue (prix cible aberrant)" />
                )}
              </td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateBV} 
                  onChange={(e) => handleInput(e, 'growthRateBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance BV (Book Value)\n\nTaux de croissance annuel compose pour projeter la Book Value sur 5 ans.\n\nPlage recommandee: 0% a 20%\nLimite systeme: -50% a +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: BV x (1 + Taux/100)5`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`BV (Book Value) Projete (5 ans): ${futureValues.bv?.toFixed(2) ?? '0.00'} $\n\nCalcule avec:\nBV Actuel (${baseValues.bv?.toFixed(2) ?? '0.00'}) x (1 + ${assumptions.growthRateBV}%)5\n\n= ${futureValues.bv?.toFixed(2) ?? '0.00'} $\n\nValeur projetee utilisee pour calculer le prix cible.`}>{futureValues.bv?.toFixed(2) ?? '0.00'}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPBV} 
                  onChange={(e) => handleInput(e, 'targetPBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`P/BV Cible (Ratio Prix/Valeur Comptable)\n\nRatio P/BV attendu dans 5 ans.\n\nPlage recommandee: 0.5x a 50x\nLimite systeme: 0.5x a 50x\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = BV Projete x P/BV Cible`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible BV (Book Value): ${formatCurrency(targets.bv)}\n\nCalcule avec:\nBV Projete (${(futureValues.bv || 0).toFixed(2)}) x P/BV Cible (${assumptions.targetPBV}x)\n\n= ${formatCurrency(targets.bv)}\n\n${assumptions.excludeBV ? ' Exclu du prix cible moyen' : ' Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.bv)}</td>
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
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-2 border-gray-300 flex-shrink-0 accent-blue-600"
                    title={assumptions.excludeDIV ? "Inclure cette metrique dans le calcul" : "Exclure cette metrique du calcul"}
                  />
                  <span className="select-none">DIV (Dividende)</span>
                  <button
                    onClick={() => toggleMetric('div')}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={expandedMetrics.div ? "Masquer les intervalles de reference" : "Afficher les intervalles de reference"}
                  >
                    {expandedMetrics.div ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              <td className={`p-3 font-semibold ${assumptions.excludeDIV ? "bg-red-200 text-red-800 border-2 border-red-500 border-dashed" : "bg-green-50 text-green-800"} cursor-help relative`} title={`DIV (Dividende) Actuel: ${baseValues.div?.toFixed(2) ?? '0.00'} $\n\nValeur de l'annee de base (${assumptions.baseYear}).\nSource: Donnees historiques FMP (vert = officiel).\n\n${assumptions.excludeDIV ? ' EXCLUE: Cette metrique produit un prix cible aberrant et a ete exclue du calcul.' : 'Utilisee comme point de depart pour la projection a 5 ans.'}`}>
                {baseValues.div?.toFixed(2) ?? '0.00'}
                {assumptions.excludeDIV && (
                  <ExclamationTriangleIcon className="absolute top-1 right-1 w-4 h-4 text-red-600" title="Metrique exclue (prix cible aberrant)" />
                )}
              </td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateDiv} 
                  onChange={(e) => handleInput(e, 'growthRateDiv')} 
                  disabled={assumptions.excludeDIV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  title={`Taux de croissance DIV (Dividende)\n\nTaux de croissance annuel compose pour projeter le Dividende sur 5 ans.\n\nPlage recommandee: 0% a 20%\nLimite systeme: -50% a +50%\n\nAuto-rempli avec le CAGR historique.\n\nFormule projection: DIV x (1 + Taux/100)5`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"} cursor-help`} title={`DIV (Dividende) Projete (5 ans): ${futureValues.div?.toFixed(2) ?? '0.00'} $\n\nCalcule avec:\nDIV Actuel (${baseValues.div?.toFixed(2) ?? '0.00'}) x (1 + ${assumptions.growthRateDiv}%)5\n\n= ${futureValues.div?.toFixed(2) ?? '0.00'} $\n\nValeur projetee utilisee pour calculer le prix cible.`}>{futureValues.div?.toFixed(2) ?? '0.00'}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <div className="flex items-center justify-end gap-1">
                  <input 
                    type="number" 
                    value={assumptions.targetYield} 
                    step="0.1" 
                    onChange={(e) => handleInput(e, 'targetYield')} 
                    disabled={assumptions.excludeDIV}
                    className={`w-12 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                    title={`Yield Cible (Rendement Dividende)\n\nRendement en dividendes attendu dans 5 ans (en %).\n\nPlage recommandee: 0.1% a 20%\nLimite systeme: 0.1% a 20%\n\nAuto-rempli avec la moyenne historique.\n\nPrix Cible = DIV Projete / (Yield Cible / 100)`}
                  />
                  <span className={`text-xs ${assumptions.excludeDIV ? "text-gray-400" : "text-orange-600"}`}>%</span>
                </div>
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"} cursor-help`} title={`Prix Cible DIV (Dividende): ${formatCurrency(targets.div)}\n\nCalcule avec:\nDIV Projete (${(futureValues.div || 0).toFixed(2)}) / (Yield Cible (${assumptions.targetYield}%) / 100)\n\n= ${formatCurrency(targets.div)}\n\n${assumptions.excludeDIV ? ' Exclu du prix cible moyen' : ' Inclus dans le prix cible moyen'}`}>{formatCurrency(targets.div)}</td>
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
          <div className="text-xs text-gray-500 uppercase mb-1 cursor-help" title="Prix Cible Moyen (5 ans)\n\nMoyenne des prix cibles des metriques incluses (non exclues).\n\nCalcul:\n(Prix Cible EPS + Prix Cible CF + Prix Cible BV + Prix Cible DIV) / Nombre de metriques incluses\n\n= ${formatCurrency(avgTargetPrice)}\n\nBase sur ${validTargets.length} metrique(s) valide(s).">Prix Cible Moyen (5 ans)</div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 border-b-2 border-gray-800 inline-block px-2 cursor-help break-words" title={`Prix Cible Moyen: ${formatCurrency(avgTargetPrice)}\n\nCalcule a partir de ${validTargets.length} metrique(s):\n${validTargets.map((t, i) => `- Metrique ${i + 1}: ${formatCurrency(t)}`).join('\n')}\n\nMoyenne: ${formatCurrency(avgTargetPrice)}\n\nUtilise pour:\n- Calcul du rendement total\n- Zones de prix recommandees\n- Ratio 3:1`}>
            {formatCurrency(avgTargetPrice)}
          </div>
        </div>

        <div className="bg-green-50 p-2.5 sm:p-3 md:p-4 rounded-lg border border-green-200 text-right w-full">
          <div className="text-xs text-green-800 uppercase font-bold mb-1 cursor-help" title="Rendement Total Potentiel (5 ans)\n\nInclut:\n- Appreciation du prix (Prix Cible - Prix Actuel)\n- Dividendes cumules sur 5 ans\n\nFormule:\n((Prix Cible Moyen + Dividendes Totaux - Prix Actuel) / Prix Actuel) x 100\n\n= ${totalReturnPercent.toFixed(2)}%\n\n Base sur vos hypotheses, pas une garantie de performance.">
            Rendement Total Potentiel
          </div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-green-600 cursor-help break-words" title={`Rendement Total: ${totalReturnPercent.toFixed(2)}%\n\nDetail:\n- Prix Actuel: ${formatCurrency(assumptions.currentPrice)}\n- Prix Cible Moyen: ${formatCurrency(avgTargetPrice)}\n- Appreciation: ${((avgTargetPrice - assumptions.currentPrice) / assumptions.currentPrice * 100).toFixed(2)}%\n- Dividendes (5 ans): ~${((totalReturnPercent - ((avgTargetPrice - assumptions.currentPrice) / assumptions.currentPrice * 100)) * assumptions.currentPrice / 100).toFixed(2)} $\n\nBase sur ${validTargets.length} metrique(s) incluse(s).`}>
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