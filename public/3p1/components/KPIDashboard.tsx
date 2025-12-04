import React, { useMemo, useState, useEffect } from 'react';
import { StarIcon, EyeIcon } from '@heroicons/react/24/solid';
import { AnalysisProfile } from '../types';
import { calculateRecommendation } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, LightBulbIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { listSnapshots } from '../services/snapshotApi';

interface KPIDashboardProps {
  profiles: AnalysisProfile[];
  currentId: string;
  onSelect: (id: string) => void;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ profiles, currentId, onSelect }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'totalReturnPercent', direction: 'desc' });
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [matrixView, setMatrixView] = useState<'grid' | 'list' | 'compact'>('grid');
  const [approvedVersions, setApprovedVersions] = useState<Set<string>>(new Set());
  const [isLoadingApprovedVersions, setIsLoadingApprovedVersions] = useState(false);

  // Calculer les métriques pour chaque profil
  const profileMetrics = useMemo(() => {
    if (profiles.length === 0) return [];
    return profiles.map(profile => {
      const { recommendation, targetPrice } = calculateRecommendation(profile.data, profile.assumptions);
      
      // VALIDATION: Vérifier que currentPrice est valide
      const currentPrice = Math.max(profile.assumptions.currentPrice || 0, 0.01); // Minimum 0.01 pour éviter division par zéro
      if (currentPrice <= 0 || !isFinite(currentPrice)) {
        // Retourner des valeurs par défaut si prix invalide
        return {
          profile,
          recommendation,
          jpegy: 0,
          totalReturnPercent: -100,
          ratio31: 0,
          downsideRisk: 0,
          upsidePotential: -100,
          hasApprovedVersion: false,
          targetPrice: 0,
          currentPE: 0,
          currentPCF: 0,
          currentPBV: 0,
          currentYield: 0,
          historicalGrowth: 0,
          volatility: 0
        };
      }
      
      // Calcul JPEGY avec validation stricte
      const baseYearData = profile.data.find(d => d.year === profile.assumptions.baseYear) || profile.data[profile.data.length - 1];
      const baseEPS = Math.max(baseYearData?.earningsPerShare || 0, 0);
      
      // VALIDATION: Vérifier que baseEPS est valide (pas juste 0 par défaut)
      const hasValidEPS = baseEPS > 0.01 && isFinite(baseEPS);
      
      const basePE = hasValidEPS && currentPrice > 0 ? currentPrice / baseEPS : 0;
      // Limiter P/E à un maximum raisonnable (1000x)
      const safeBasePE = basePE > 0 && basePE <= 1000 ? basePE : 0;
      
      const baseYield = currentPrice > 0 && profile.assumptions.currentDividend >= 0 
        ? (profile.assumptions.currentDividend / currentPrice) * 100 
        : 0;
      // Limiter yield à 0-50% (au-delà c'est suspect)
      const safeBaseYield = Math.max(0, Math.min(baseYield, 50));
      
      const growthPlusYield = (profile.assumptions.growthRateEPS || 0) + safeBaseYield;
      
      // JPEGY: valider que growthPlusYield > 0.01 ET que basePE est valide
      // Limiter JPEGY à un maximum raisonnable (100)
      let jpegy = 0;
      if (growthPlusYield > 0.01 && safeBasePE > 0 && hasValidEPS) {
        const rawJPEGY = safeBasePE / growthPlusYield;
        jpegy = isFinite(rawJPEGY) && rawJPEGY >= 0 && rawJPEGY <= 100 ? rawJPEGY : 0;
      }

      // Calcul rendement total potentiel
      const baseValues = {
        eps: Math.max(baseEPS, 0),
        cf: Math.max(baseYearData?.cashFlowPerShare || 0, 0),
        bv: Math.max(baseYearData?.bookValuePerShare || 0, 0),
        div: Math.max(profile.assumptions.currentDividend || 0, 0)
      };

      const projectFutureValue = (current: number, rate: number, years: number): number => {
        // Valider les entrées
        if (current <= 0 || !isFinite(current) || !isFinite(rate)) return 0;
        // Limiter le taux de croissance à un maximum raisonnable (50% par an)
        const safeRate = Math.max(-50, Math.min(rate, 50));
        return current * Math.pow(1 + safeRate / 100, years);
      };

      // Valider et limiter les taux de croissance
      const safeGrowthEPS = Math.max(-50, Math.min(profile.assumptions.growthRateEPS || 0, 50));
      const safeGrowthCF = Math.max(-50, Math.min(profile.assumptions.growthRateCF || 0, 50));
      const safeGrowthBV = Math.max(-50, Math.min(profile.assumptions.growthRateBV || 0, 50));
      const safeGrowthDiv = Math.max(-50, Math.min(profile.assumptions.growthRateDiv || 0, 50));

      const futureValues = {
        eps: projectFutureValue(baseValues.eps, safeGrowthEPS, 5),
        cf: projectFutureValue(baseValues.cf, safeGrowthCF, 5),
        bv: projectFutureValue(baseValues.bv, safeGrowthBV, 5),
        div: projectFutureValue(baseValues.div, safeGrowthDiv, 5)
      };

      // Valider et limiter les ratios cibles (éviter des ratios extrêmes)
      const safeTargetPE = Math.max(1, Math.min(profile.assumptions.targetPE || 0, 100));
      const safeTargetPCF = Math.max(1, Math.min(profile.assumptions.targetPCF || 0, 100));
      const safeTargetPBV = Math.max(0.5, Math.min(profile.assumptions.targetPBV || 0, 50));
      const safeTargetYield = Math.max(0.1, Math.min(profile.assumptions.targetYield || 0, 20));

      const targets = {
        eps: futureValues.eps > 0 && safeTargetPE > 0 && safeTargetPE <= 100 ? futureValues.eps * safeTargetPE : 0,
        cf: futureValues.cf > 0 && safeTargetPCF > 0 && safeTargetPCF <= 100 ? futureValues.cf * safeTargetPCF : 0,
        bv: futureValues.bv > 0 && safeTargetPBV > 0 && safeTargetPBV <= 50 ? futureValues.bv * safeTargetPBV : 0,
        div: futureValues.div > 0 && safeTargetYield > 0 && safeTargetYield <= 20 ? futureValues.div / (safeTargetYield / 100) : 0
      };

      // Valider que les targets sont raisonnables (max 50x le prix actuel pour éviter les valeurs aberrantes)
      const maxReasonableTarget = currentPrice * 50;
      const minReasonableTarget = currentPrice * 0.1; // Minimum 10% du prix actuel
      const validTargets = [
        !profile.assumptions.excludeEPS && targets.eps > 0 && targets.eps >= minReasonableTarget && targets.eps <= maxReasonableTarget && isFinite(targets.eps) ? targets.eps : null,
        !profile.assumptions.excludeCF && targets.cf > 0 && targets.cf >= minReasonableTarget && targets.cf <= maxReasonableTarget && isFinite(targets.cf) ? targets.cf : null,
        !profile.assumptions.excludeBV && targets.bv > 0 && targets.bv >= minReasonableTarget && targets.bv <= maxReasonableTarget && isFinite(targets.bv) ? targets.bv : null,
        !profile.assumptions.excludeDIV && targets.div > 0 && targets.div >= minReasonableTarget && targets.div <= maxReasonableTarget && isFinite(targets.div) ? targets.div : null
      ].filter((t): t is number => t !== null && t > 0 && isFinite(t));

      const avgTargetPrice = validTargets.length > 0
        ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
        : 0;

      // Calculer les dividendes totaux avec validation stricte
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

      // Calculer le rendement total avec validation et limites STRICTES
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

      // Calcul ratio 3:1 (potentiel de rendement vs potentiel de baisse)
      const validHistory = profile.data.filter(d => d.priceHigh > 0 && d.priceLow > 0 && isFinite(d.priceHigh) && isFinite(d.priceLow));
      const avgLowPrice = validHistory.length > 0
        ? validHistory.reduce((sum, d) => sum + d.priceLow, 0) / validHistory.length
        : currentPrice * 0.7;
      
      // Valider avgLowPrice
      const safeAvgLowPrice = isFinite(avgLowPrice) && avgLowPrice > 0 ? avgLowPrice : currentPrice * 0.7;
      
      const downsideRisk = currentPrice > 0 && safeAvgLowPrice > 0
        ? Math.max(0, Math.min(100, ((currentPrice - safeAvgLowPrice * 0.9) / currentPrice) * 100))
        : 0;
      
      const upsidePotential = Math.max(-100, Math.min(1000, totalReturnPercent));
      const ratio31 = downsideRisk > 0.1 ? Math.max(0, Math.min(100, upsidePotential / downsideRisk)) : 0;

      // Vérifier si version approuvée (vérifié via useEffect)
      const hasApprovedVersion = approvedVersions.has(profile.id);
      
      // Calculer des métriques supplémentaires avec validation
      const currentPE = isFinite(basePE) && basePE >= 0 ? Math.min(basePE, 1000) : 0; // Limiter P/E à 1000x max
      const currentPCF = baseYearData?.cashFlowPerShare > 0 && isFinite(baseYearData.cashFlowPerShare)
        ? Math.min(currentPrice / baseYearData.cashFlowPerShare, 1000)
        : 0;
      const currentPBV = baseYearData?.bookValuePerShare > 0 && isFinite(baseYearData.bookValuePerShare)
        ? Math.min(currentPrice / baseYearData.bookValuePerShare, 100)
        : 0;
      const currentYield = Math.max(0, Math.min(100, baseYield)); // Limiter yield à 0-100%
      
      // Calculer la croissance moyenne historique avec validation
      const validData = profile.data.filter(d => d.earningsPerShare > 0 && isFinite(d.earningsPerShare));
      let historicalGrowth = 0;
      if (validData.length >= 2) {
        const firstEPS = validData[0].earningsPerShare;
        const lastEPS = validData[validData.length - 1].earningsPerShare;
        const years = validData[validData.length - 1].year - validData[0].year;
        if (years > 0 && firstEPS > 0 && lastEPS > 0 && isFinite(firstEPS) && isFinite(lastEPS)) {
          const rawGrowth = (Math.pow(lastEPS / firstEPS, 1 / years) - 1) * 100;
          // Limiter la croissance historique à -50% à +100% par an
          historicalGrowth = Math.max(-50, Math.min(100, rawGrowth));
        }
      }
      
      // Calculer la volatilité (écart-type des rendements historiques) avec validation
      const priceChanges = [];
      for (let i = 1; i < validHistory.length; i++) {
        if (validHistory[i].priceHigh > 0 && validHistory[i-1].priceHigh > 0 
            && isFinite(validHistory[i].priceHigh) && isFinite(validHistory[i-1].priceHigh)) {
          const change = ((validHistory[i].priceHigh - validHistory[i-1].priceHigh) / validHistory[i-1].priceHigh) * 100;
          if (isFinite(change)) {
            priceChanges.push(change);
          }
        }
      }
      const avgChange = priceChanges.length > 0 
        ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length 
        : 0;
      const variance = priceChanges.length > 0 && isFinite(avgChange)
        ? priceChanges.reduce((sum, change) => {
            const diff = change - avgChange;
            return sum + (isFinite(diff) ? Math.pow(diff, 2) : 0);
          }, 0) / priceChanges.length
        : 0;
      const volatility = isFinite(variance) && variance >= 0 ? Math.min(Math.sqrt(variance), 200) : 0; // Limiter à 200%

      // Détecter si les données sont suspectes ou invalides et identifier la cause
      const invalidReason: string[] = [];
      
      // Vérifier si c'est un profil "vide" (pas encore synchronisé depuis l'API)
      const hasEmptyData = profile.data.length === 1 && 
        profile.data[0].earningsPerShare === 0 && 
        profile.data[0].cashFlowPerShare === 0 &&
        profile.data[0].bookValuePerShare === 0 &&
        (profile.assumptions.currentPrice === 100 || profile.assumptions.currentPrice === 0) &&
        profile.assumptions.currentDividend === 0;
      
      if (hasEmptyData) {
        invalidReason.push('⚠️ DONNÉES NON SYNCHRONISÉES - Cliquez sur "Synchroniser" dans l\'onglet Analysis pour charger les données réelles');
      } else {
        if (currentPrice <= 0 || !isFinite(currentPrice)) {
          invalidReason.push('Prix actuel invalide ou manquant');
        }
        if (baseEPS === 0 && baseYearData) {
          invalidReason.push('EPS de base = 0 (données historiques manquantes ou nulles)');
        }
        if (validTargets.length === 0) {
          const excludedMetrics = [];
          if (profile.assumptions.excludeEPS) excludedMetrics.push('EPS');
          if (profile.assumptions.excludeCF) excludedMetrics.push('CF');
          if (profile.assumptions.excludeBV) excludedMetrics.push('BV');
          if (profile.assumptions.excludeDIV) excludedMetrics.push('DIV');
          const excludedText = excludedMetrics.length > 0 ? ` (${excludedMetrics.join(', ')} exclus)` : '';
          invalidReason.push(`Aucun ratio cible valide${excludedText} - Vérifiez les ratios cibles (P/E, P/CF, P/BV, Yield) et les données historiques`);
        }
        if (jpegy === 0 && growthPlusYield <= 0.01) {
          invalidReason.push(`Croissance EPS (${profile.assumptions.growthRateEPS?.toFixed(2) || 0}%) + Yield (${baseYield.toFixed(2) || 0}%) trop faible (≤0.01%) - Ajustez la croissance ou le dividende`);
        }
        if (totalReturnPercent <= -99.9) {
          invalidReason.push('Rendement impossible à calculer - Vérifiez le prix actuel et les ratios cibles');
        }
      }
      
      const hasInvalidData = invalidReason.length > 0;

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
        volatility,
        hasInvalidData, // Nouveau flag pour indiquer données invalides
        invalidReason: hasInvalidData ? invalidReason.join('; ') : undefined, // Raison de l'invalidité pour debug
        isNotSynchronized: hasEmptyData // Flag spécial pour profils non synchronisés
      };
    });
  }, [profiles, approvedVersions]);

  // Charger les versions approuvées pour tous les profils (avec batch pour éviter trop de requêtes)
  useEffect(() => {
    const loadApprovedVersions = async () => {
      setIsLoadingApprovedVersions(true);
      const approvedSet = new Set<string>();
      
      // Traiter par batch de 10 pour éviter de surcharger l'API
      const batchSize = 10;
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (profile) => {
            try {
              const result = await listSnapshots(profile.id, 50);
              if (result.success && result.snapshots) {
                const hasApproved = result.snapshots.some(
                  (snapshot: any) => snapshot.is_approved === true
                );
                if (hasApproved) {
                  approvedSet.add(profile.id);
                }
              }
            } catch (error) {
              // Erreur silencieuse pour ne pas polluer la console
              // Les versions approuvées sont une fonctionnalité bonus
            }
          })
        );
        
        // Petit délai entre les batches pour éviter de surcharger l'API
        if (i + batchSize < profiles.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setApprovedVersions(approvedSet);
      setIsLoadingApprovedVersions(false);
    };

    if (profiles.length > 0) {
      loadApprovedVersions();
    } else {
      setIsLoadingApprovedVersions(false);
    }
  }, [profiles]);

  // Calculer les valeurs min/max réelles pour définir des filtres par défaut qui incluent tout
  const defaultFilterValues = useMemo(() => {
    if (profileMetrics.length === 0) {
      return {
        minReturn: -100,
        maxReturn: 500,
        minJPEGY: 0,
        maxJPEGY: 10,
        sector: '',
        recommendation: 'all' as 'all' | 'BUY' | 'HOLD' | 'SELL'
      };
    }
    
    const returns = profileMetrics.map(m => m.totalReturnPercent);
    const jpegyValues = profileMetrics.map(m => m.jpegy);
    
    return {
      minReturn: Math.floor(Math.min(...returns, -100)) - 10, // Marge de sécurité
      maxReturn: Math.ceil(Math.max(...returns, 500)) + 10, // Marge de sécurité
      minJPEGY: Math.max(0, Math.floor(Math.min(...jpegyValues, 0))),
      maxJPEGY: Math.ceil(Math.max(...jpegyValues, 10)) + 2, // Marge de sécurité
      sector: '',
      recommendation: 'all' as 'all' | 'BUY' | 'HOLD' | 'SELL',
      source: 'all' as 'all' | 'portfolio' | 'watchlist'
    };
  }, [profileMetrics]);

  const [filters, setFilters] = useState(() => ({
    minReturn: -100,
    maxReturn: 500,
    minJPEGY: 0,
    maxJPEGY: 10,
    sector: '',
    recommendation: 'all' as 'all' | 'BUY' | 'HOLD' | 'SELL',
    source: 'all' as 'all' | 'portfolio' | 'watchlist' // Nouveau filtre pour portefeuille/watchlist
  }));

  // Mettre à jour les filtres quand defaultFilterValues change (nouveaux profils chargés)
  useEffect(() => {
    setFilters(defaultFilterValues);
  }, [defaultFilterValues]);

  // Filtrer et trier les profils
  const filteredMetrics = useMemo(() => {
    const filtered = profileMetrics.filter(metric => {
      if (metric.totalReturnPercent < filters.minReturn || metric.totalReturnPercent > filters.maxReturn) return false;
      if (metric.jpegy < filters.minJPEGY || metric.jpegy > filters.maxJPEGY) return false;
      if (filters.sector && metric.profile.info.sector.toLowerCase() !== filters.sector.toLowerCase()) return false;
      if (filters.recommendation !== 'all' && metric.recommendation !== filters.recommendation) return false;
      // Filtre portefeuille/watchlist
      if (filters.source !== 'all') {
        const isWatchlist = metric.profile.isWatchlist ?? false;
        if (filters.source === 'watchlist' && !isWatchlist) return false;
        if (filters.source === 'portfolio' && isWatchlist) return false;
      }
      return true;
    });
    
    // Trier
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];
      
      // Gérer les valeurs imbriquées
      if (sortConfig.key === 'ticker') {
        aValue = a.profile.id;
        bValue = b.profile.id;
      } else if (sortConfig.key === 'sector') {
        aValue = a.profile.info.sector;
        bValue = b.profile.info.sector;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [profileMetrics, filters, sortConfig]);
  
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  const handleExport = () => {
    const csv = [
      ['Ticker', 'Nom', 'Secteur', 'JPEGY', 'Rendement Total', 'Ratio 3:1', 'Potentiel Hausse', 'Risque Baisse', 'P/E', 'Yield', 'Croissance', 'Recommandation'].join(','),
      ...filteredMetrics.map(m => [
        m.profile.id,
        `"${m.profile.info.name}"`,
        m.profile.info.sector,
        m.jpegy.toFixed(2),
        m.totalReturnPercent.toFixed(2),
        m.ratio31.toFixed(2),
        m.upsidePotential.toFixed(2),
        m.downsideRisk.toFixed(2),
        m.currentPE?.toFixed(1) || 'N/A',
        m.currentYield?.toFixed(2) || 'N/A',
        m.historicalGrowth?.toFixed(2) || 'N/A',
        m.recommendation
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpi-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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

  // Calculer les dimensions du graphique (après avoir vérifié qu'on a des profils)
  const chartWidth = 900;
  const chartHeight = 700;
  const padding = 80;
  
  // Calculer les échelles avec marges (seulement si on a des métriques filtrées VALIDES)
  const validMetricsForChart = filteredMetrics.filter(m => 
    !m.hasInvalidData && 
    m.totalReturnPercent >= -100 && m.totalReturnPercent <= 1000 &&
    m.jpegy >= 0 && m.jpegy <= 100 &&
    isFinite(m.totalReturnPercent) && isFinite(m.jpegy)
  );
  
  const maxJPEGY = validMetricsForChart.length > 0 
    ? Math.max(...validMetricsForChart.map(m => m.jpegy), 5)
    : 5;
  const minJPEGY = validMetricsForChart.length > 0
    ? Math.min(...validMetricsForChart.map(m => m.jpegy), 0)
    : 0;
  const maxReturn = validMetricsForChart.length > 0
    ? Math.max(...validMetricsForChart.map(m => m.totalReturnPercent), 200)
    : 200;
  const minReturn = validMetricsForChart.length > 0
    ? Math.min(...validMetricsForChart.map(m => m.totalReturnPercent), -50)
    : -50;
  
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

  // Calculer les statistiques globales
  const globalStats = useMemo(() => {
    if (filteredMetrics.length === 0) return null;
    
    const returns = filteredMetrics.map(m => m.totalReturnPercent);
    const jpegyValues = filteredMetrics.map(m => m.jpegy);
    const ratios = filteredMetrics.map(m => m.ratio31);
    
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };
    const stdDev = (arr: number[], mean: number) => {
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
      return Math.sqrt(variance);
    };
    
    const avgReturn = avg(returns);
    const medianReturn = median(returns);
    const stdReturn = stdDev(returns, avgReturn);
    
    const avgJPEGY = avg(jpegyValues);
    const medianJPEGY = median(jpegyValues);
    
    const avgRatio = avg(ratios);
    const medianRatio = median(ratios);
    
    return {
      avgReturn,
      medianReturn,
      stdReturn,
      minReturn: Math.min(...returns),
      maxReturn: Math.max(...returns),
      avgJPEGY,
      medianJPEGY,
      avgRatio,
      medianRatio,
      count: filteredMetrics.length
    };
  }, [filteredMetrics]);

  return (
    <div className="space-y-6">
      {/* Statistiques Globales */}
      {globalStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-lg border border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Statistiques Globales du Portefeuille</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rendement Moyen</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{globalStats.avgReturn.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1">Médiane: {globalStats.medianReturn.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Écart-Type</div>
              <div className="text-2xl font-bold text-purple-600">{globalStats.stdReturn.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1">Volatilité</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rendement Min</div>
              <div className="text-2xl font-bold text-red-600">{globalStats.minReturn.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rendement Max</div>
              <div className="text-2xl font-bold text-green-600">{globalStats.maxReturn.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">JPEGY Moyen</div>
              <div className="text-2xl font-bold" style={{ color: getJpegyColor(globalStats.avgJPEGY) }}>
                {globalStats.avgJPEGY.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Médiane: {globalStats.medianJPEGY.toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Ratio 3:1 Moyen</div>
              <div className={`text-2xl font-bold ${
                globalStats.avgRatio >= 3 ? 'text-green-600' :
                globalStats.avgRatio >= 1 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {globalStats.avgRatio.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Comparaison */}
      {comparisonMode && selectedForComparison.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg shadow-lg border-2 border-purple-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🔍 Mode Comparaison ({selectedForComparison.length} titre(s))
            </h3>
            <button
              onClick={() => {
                setComparisonMode(false);
                setSelectedForComparison([]);
              }}
              className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              Fermer
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedForComparison.map(ticker => {
              const metric = filteredMetrics.find(m => m.profile.id === ticker);
              if (!metric) return null;
              return (
                <div key={ticker} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg">{metric.profile.id}</h4>
                    <button
                      onClick={() => setSelectedForComparison(prev => prev.filter(t => t !== ticker))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rendement:</span>
                      <span className="font-bold text-green-600">{metric.totalReturnPercent.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">JPEGY:</span>
                      <span className="font-bold" style={{ color: getJpegyColor(metric.jpegy) }}>
                        {metric.jpegy.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ratio 3:1:</span>
                      <span className={`font-bold ${
                        metric.ratio31 >= 3 ? 'text-green-600' :
                        metric.ratio31 >= 1 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {metric.ratio31.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P/E:</span>
                      <span className="font-bold">{metric.currentPE?.toFixed(1) || 'N/A'}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yield:</span>
                      <span className="font-bold">{metric.currentYield?.toFixed(2) || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signal:</span>
                      <span className={`font-bold ${
                        metric.recommendation === 'ACHAT' ? 'text-green-600' :
                        metric.recommendation === 'VENTE' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {metric.recommendation}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelect(ticker)}
                      className="w-full mt-3 px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 transition-colors"
                    >
                      Voir détails →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres Améliorés */}
        <div className={`bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border-2 transition-all ${
        (filters.minReturn !== -100 || filters.maxReturn !== 500 || filters.minJPEGY !== 0 || 
         filters.maxJPEGY !== 5 || filters.sector !== '' || filters.recommendation !== 'all')
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-base sm:text-lg font-bold">🔍 Filtres de Screening</h3>
            {(filters.minReturn !== -100 || filters.maxReturn !== 500 || filters.minJPEGY !== 0 || 
              filters.maxJPEGY !== 5 || filters.sector !== '' || filters.recommendation !== 'all') && (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Filtres actifs
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded transition-colors ${
                comparisonMode 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
              }`}
            >
              {comparisonMode ? '✕ Mode Comparaison' : '🔍 Mode Comparaison'}
            </button>
            <button
              onClick={() => setFilters(defaultFilterValues)}
              className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Réinitialiser tous les filtres pour afficher tous les titres"
            >
              🔄 Réinitialiser
            </button>
            <button
              onClick={() => {
                const top10 = [...filteredMetrics].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent).slice(0, 10);
                const minReturn = Math.min(...top10.map(m => m.totalReturnPercent));
                const maxReturn = Math.max(...top10.map(m => m.totalReturnPercent));
                setFilters(prev => ({ ...prev, minReturn: minReturn - 5, maxReturn: maxReturn + 5 }));
              }}
              className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-700 rounded transition-colors"
            >
              Top 10
            </button>
            <button
              onClick={() => {
                const undervalued = filteredMetrics.filter(m => m.jpegy <= 1.5);
                if (undervalued.length > 0) {
                  const minJPEGY = Math.min(...undervalued.map(m => m.jpegy));
                  const maxJPEGY = Math.max(...undervalued.map(m => m.jpegy));
                  setFilters(prev => ({ ...prev, minJPEGY: 0, maxJPEGY: maxJPEGY + 0.5 }));
                }
              }}
              className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
            >
              Sous-évalués
            </button>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-bold text-blue-600">{filteredMetrics.length}</span> titre(s) affiché(s) sur{' '}
            <span className="font-semibold">{profileMetrics.length}</span> total
            {(filters.minReturn !== defaultFilterValues.minReturn || 
              filters.maxReturn !== defaultFilterValues.maxReturn || 
              filters.minJPEGY !== defaultFilterValues.minJPEGY || 
              filters.maxJPEGY !== defaultFilterValues.maxJPEGY || 
              filters.sector !== '' || 
              filters.recommendation !== 'all' ||
              filters.source !== 'all') && (
              <span className="ml-2 text-xs text-blue-600">({profileMetrics.length - filteredMetrics.length} masqué(s))</span>
            )}
            {isLoadingApprovedVersions && (
              <span className="ml-2 text-xs text-gray-400">⏳ Vérification des versions approuvées...</span>
            )}
          </div>
        </div>
        
        {/* Filtres avec indicateurs visuels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rendement Min (%)</label>
            <input
              type="number"
              value={filters.minReturn}
              onChange={(e) => setFilters({ ...filters, minReturn: parseFloat(e.target.value) || defaultFilterValues.minReturn })}
              className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.minReturn !== defaultFilterValues.minReturn 
                  ? 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-500' 
                  : 'border-gray-300 focus:border-blue-400'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rendement Max (%)</label>
            <input
              type="number"
              value={filters.maxReturn}
              onChange={(e) => setFilters({ ...filters, maxReturn: parseFloat(e.target.value) || defaultFilterValues.maxReturn })}
              className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.maxReturn !== defaultFilterValues.maxReturn 
                  ? 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-500' 
                  : 'border-gray-300 focus:border-blue-400'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">JPEGY Min</label>
            <input
              type="number"
              step="0.1"
              value={filters.minJPEGY}
              onChange={(e) => setFilters({ ...filters, minJPEGY: parseFloat(e.target.value) || defaultFilterValues.minJPEGY })}
              className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.minJPEGY !== defaultFilterValues.minJPEGY 
                  ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-500' 
                  : 'border-gray-300 focus:border-green-400'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">JPEGY Max</label>
            <input
              type="number"
              step="0.1"
              value={filters.maxJPEGY}
              onChange={(e) => setFilters({ ...filters, maxJPEGY: parseFloat(e.target.value) || defaultFilterValues.maxJPEGY })}
              className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.maxJPEGY !== defaultFilterValues.maxJPEGY 
                  ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-500' 
                  : 'border-gray-300 focus:border-green-400'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Secteur</label>
            <input
              type="text"
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              placeholder="Tous"
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Recommandation</label>
            <select
              value={filters.recommendation}
              onChange={(e) => setFilters({ ...filters, recommendation: e.target.value as any })}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm"
            >
              <option value="all">Toutes</option>
              <option value="BUY">Achat</option>
              <option value="HOLD">Conserver</option>
              <option value="SELL">Vendre</option>
            </select>
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Source
              {filters.source !== 'all' && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                  filters.source === 'watchlist' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {filters.source === 'watchlist' ? (
                    <>
                      <EyeIcon className="w-3 h-3" />
                      Watchlist
                    </>
                  ) : (
                    <>
                      <StarIcon className="w-3 h-3" />
                      Portefeuille
                    </>
                  )}
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value as any })}
                className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all appearance-none ${
                  filters.source !== 'all' 
                    ? filters.source === 'watchlist'
                      ? 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-500' 
                      : 'border-yellow-400 bg-yellow-50 focus:ring-2 focus:ring-yellow-500'
                    : 'border-gray-300 focus:border-blue-400'
                }`}
              >
                <option value="all">Tous (Portefeuille + Watchlist)</option>
                <option value="portfolio">⭐ Portefeuille</option>
                <option value="watchlist">👁️ Watchlist</option>
              </select>
              {filters.source !== 'all' && (
                <button
                  onClick={() => setFilters({ ...filters, source: 'all' })}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs"
                  title="Réinitialiser"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matrice à carreaux Améliorée avec Vues Multiples */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">🎯 Matrice de Performance</h3>
            <p className="text-xs text-gray-500 mt-1">Cliquez sur un carreau pour sélectionner le titre</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {/* Sélecteur de vue */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
              <button
                onClick={() => setMatrixView('grid')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded transition-all ${
                  matrixView === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vue grille"
              >
                ⬜ Grille
              </button>
              <button
                onClick={() => setMatrixView('list')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded transition-all ${
                  matrixView === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vue liste"
              >
                ☰ Liste
              </button>
              <button
                onClick={() => setMatrixView('compact')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded transition-all ${
                  matrixView === 'compact' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vue compacte"
              >
                ▦ Compacte
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-600"></div>
                <span className="text-gray-600">≥50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-300"></div>
                <span className="text-gray-600">20-50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-400"></div>
                <span className="text-gray-600">0-20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-600"></div>
                <span className="text-gray-600">&lt;0%</span>
              </div>
            </div>
          </div>
        </div>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <>
            {/* Avertissement pour les données invalides */}
            {filteredMetrics.some(m => m.hasInvalidData) && (
              <div className={`mb-4 p-3 border-l-4 rounded-r ${
                filteredMetrics.some(m => m.isNotSynchronized) 
                  ? 'bg-blue-50 border-blue-400' 
                  : 'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    filteredMetrics.some(m => m.isNotSynchronized) 
                      ? 'text-blue-600' 
                      : 'text-yellow-600'
                  }`} />
                  <div className={`flex-1 text-xs sm:text-sm ${
                    filteredMetrics.some(m => m.isNotSynchronized) 
                      ? 'text-blue-800' 
                      : 'text-yellow-800'
                  }`}>
                    <strong>
                      {filteredMetrics.some(m => m.isNotSynchronized) 
                        ? '⚠️ Action requise:' 
                        : 'Attention:'}
                    </strong> {filteredMetrics.filter(m => m.hasInvalidData).length} titre(s) ont des données invalides ou manquantes. 
                    {filteredMetrics.some(m => m.isNotSynchronized) && (
                      <span className="font-semibold block mt-1">
                        La plupart nécessitent une synchronisation depuis l'API. Allez dans l'onglet "Analysis" et cliquez sur "Synchroniser" pour chaque ticker.
                      </span>
                    )}
                    Ces tickers sont marqués avec <ExclamationTriangleIcon className="w-4 h-4 inline text-red-500" /> et affichent "N/A".
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold hover:opacity-80">Voir les détails par ticker</summary>
                      <ul className="mt-2 space-y-1 ml-4 list-disc">
                        {filteredMetrics.filter(m => m.hasInvalidData).map(metric => (
                          <li key={metric.profile.id} className="text-xs">
                            <strong>{metric.profile.id}:</strong> {metric.invalidReason || 'Données invalides'}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mode: <span className="font-semibold">Vue normale</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const sorted = [...filteredMetrics].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
                    const top10 = sorted.slice(0, 10);
                    // Scroll vers le premier élément
                    setTimeout(() => {
                      const firstEl = document.querySelector(`[data-ticker="${top10[0]?.profile.id}"]`);
                      firstEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-700 rounded transition-colors"
                >
                  Zoom Top 10
                </button>
              </div>
            </div>
            {/* Vue Grille */}
            {matrixView === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 sm:gap-3">
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.profile.id}
                    data-ticker={metric.profile.id}
                    onClick={(e) => {
                      if (comparisonMode) {
                        e.stopPropagation();
                        setSelectedForComparison(prev => {
                          if (prev.includes(metric.profile.id)) {
                            return prev.filter(t => t !== metric.profile.id);
                          } else if (prev.length < 5) {
                            return [...prev, metric.profile.id];
                          }
                          return prev;
                        });
                      } else {
                        onSelect(metric.profile.id);
                      }
                    }}
                    className={`p-2 sm:p-2.5 md:p-3 rounded-lg cursor-pointer transition-all hover:scale-105 sm:hover:scale-110 hover:shadow-xl border-2 ${
                      currentId === metric.profile.id ? 'border-blue-600 ring-4 ring-blue-300 shadow-xl' : 
                      comparisonMode && selectedForComparison.includes(metric.profile.id)
                        ? 'border-purple-600 ring-4 ring-purple-300 shadow-xl' 
                        : 'border-gray-200'
                    }`}
                    style={{
                      backgroundColor: getReturnColor(metric.totalReturnPercent),
                      opacity: currentId === metric.profile.id ? 1 : 0.85
                    }}
                    title={`${metric.profile.info.name || metric.profile.id}
Rendement: ${metric.hasInvalidData ? 'N/A (données invalides)' : `${metric.totalReturnPercent.toFixed(1)}%`}
JPEGY: ${metric.hasInvalidData ? 'N/A (données invalides)' : metric.jpegy.toFixed(2)}
Ratio 3:1: ${metric.hasInvalidData ? 'N/A' : metric.ratio31.toFixed(2)}
P/E: ${metric.currentPE?.toFixed(1) || 'N/A'}x
Secteur: ${metric.profile.info.sector}
${metric.hasApprovedVersion ? '✓ Version approuvée' : ''}
${metric.invalidReason ? `⚠️ ${metric.invalidReason}` : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-white relative">
                      {comparisonMode && selectedForComparison.includes(metric.profile.id) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10">
                          {selectedForComparison.indexOf(metric.profile.id) + 1}
                        </div>
                      )}
                      {metric.hasInvalidData && (
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10" title="Données invalides ou manquantes">
                          <ExclamationTriangleIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`text-xs font-bold ${metric.hasInvalidData ? 'line-through opacity-70' : ''}`}>{metric.profile.id}</div>
                        {(metric.profile.isWatchlist ?? false) ? (
                          <EyeIcon className="w-3 h-3 text-blue-300" title="Watchlist" />
                        ) : (
                          <StarIcon className="w-3 h-3 text-yellow-400" title="Portefeuille" />
                        )}
                      </div>
                      <div className={`text-[10px] font-semibold mb-1 ${metric.hasInvalidData ? 'opacity-50' : ''}`}>
                        {metric.hasInvalidData ? 'N/A' : `${metric.totalReturnPercent.toFixed(0)}%`}
                      </div>
                      <div className={`text-[8px] opacity-90 ${metric.hasInvalidData ? 'opacity-50' : ''}`}>
                        JPEGY: {metric.hasInvalidData ? 'N/A' : metric.jpegy.toFixed(1)}
                      </div>
                      {metric.hasApprovedVersion && !metric.hasInvalidData && (
                        <CheckCircleIcon className="w-4 h-4 mt-1 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vue Liste */}
            {matrixView === 'list' && (
              <div className="space-y-2">
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.profile.id}
                    data-ticker={metric.profile.id}
                    onClick={(e) => {
                      if (comparisonMode) {
                        e.stopPropagation();
                        setSelectedForComparison(prev => {
                          if (prev.includes(metric.profile.id)) {
                            return prev.filter(t => t !== metric.profile.id);
                          } else if (prev.length < 5) {
                            return [...prev, metric.profile.id];
                          }
                          return prev;
                        });
                      } else {
                        onSelect(metric.profile.id);
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 ${
                      currentId === metric.profile.id ? 'border-blue-600 ring-2 ring-blue-300 bg-blue-50' : 
                      comparisonMode && selectedForComparison.includes(metric.profile.id)
                        ? 'border-purple-600 ring-2 ring-purple-300 bg-purple-50' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm relative"
                        style={{ backgroundColor: metric.hasInvalidData ? '#fee2e2' : getReturnColor(metric.totalReturnPercent) }}
                      >
                        {metric.profile.id}
                        <div className="absolute -top-1 -right-1">
                          {(metric.profile.isWatchlist ?? false) ? (
                            <EyeIcon className="w-4 h-4 text-blue-300" title="Watchlist" />
                          ) : (
                            <StarIcon className="w-4 h-4 text-yellow-400" title="Portefeuille" />
                          )}
                        </div>
                        {metric.hasInvalidData && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10" title="Données invalides">
                            <ExclamationTriangleIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`font-bold text-gray-800 ${metric.hasInvalidData ? 'line-through opacity-70' : ''}`}>{metric.profile.info.name || metric.profile.id}</div>
                          {(metric.profile.isWatchlist ?? false) ? (
                            <EyeIcon className="w-4 h-4 text-blue-500" title="Watchlist" />
                          ) : (
                            <StarIcon className="w-4 h-4 text-yellow-500" title="Portefeuille" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{metric.profile.info.sector}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${metric.hasInvalidData ? 'text-gray-400' : ''}`} style={metric.hasInvalidData ? {} : { color: getReturnColor(metric.totalReturnPercent) }}>
                          {metric.hasInvalidData ? 'N/A' : `${metric.totalReturnPercent.toFixed(1)}%`}
                        </div>
                        <div className="text-xs text-gray-500">Rendement</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${metric.hasInvalidData ? 'text-gray-400' : ''}`} style={metric.hasInvalidData ? {} : { color: getJpegyColor(metric.jpegy) }}>
                          {metric.hasInvalidData ? 'N/A' : metric.jpegy.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">JPEGY</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          metric.hasInvalidData ? 'text-gray-400' :
                          metric.ratio31 >= 3 ? 'text-green-600' :
                          metric.ratio31 >= 1 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {metric.hasInvalidData ? 'N/A' : metric.ratio31.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Ratio 3:1</div>
                      </div>
                    </div>
                    {comparisonMode && selectedForComparison.includes(metric.profile.id) && (
                      <div className="ml-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {selectedForComparison.indexOf(metric.profile.id) + 1}
                      </div>
                    )}
                    {metric.hasInvalidData ? (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 ml-2" title="Données invalides" />
                    ) : metric.hasApprovedVersion && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vue Compacte */}
            {matrixView === 'compact' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-15 gap-1.5 sm:gap-2">
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.profile.id}
                    data-ticker={metric.profile.id}
                    onClick={(e) => {
                      if (comparisonMode) {
                        e.stopPropagation();
                        setSelectedForComparison(prev => {
                          if (prev.includes(metric.profile.id)) {
                            return prev.filter(t => t !== metric.profile.id);
                          } else if (prev.length < 5) {
                            return [...prev, metric.profile.id];
                          }
                          return prev;
                        });
                      } else {
                        onSelect(metric.profile.id);
                      }
                    }}
                    className={`p-1.5 sm:p-2 rounded cursor-pointer transition-all hover:scale-105 border ${
                      currentId === metric.profile.id ? 'border-blue-600 ring-2 ring-blue-300' : 
                      comparisonMode && selectedForComparison.includes(metric.profile.id)
                        ? 'border-purple-600 ring-2 ring-purple-300' 
                        : metric.hasInvalidData
                        ? 'border-red-300 border-dashed'
                        : 'border-gray-200'
                    }`}
                    style={{
                      backgroundColor: metric.hasInvalidData ? '#fee2e2' : getReturnColor(metric.totalReturnPercent),
                      opacity: currentId === metric.profile.id ? 1 : (metric.hasInvalidData ? 0.6 : 0.8)
                    }}
                    title={`${metric.profile.id}: ${metric.hasInvalidData ? 'Données invalides' : `${metric.totalReturnPercent.toFixed(1)}%`}`}
                  >
                    <div className={`flex flex-col items-center ${metric.hasInvalidData ? 'text-gray-600' : 'text-white'} text-[9px] relative`}>
                      {metric.hasInvalidData && (
                        <ExclamationTriangleIcon className="w-3 h-3 text-red-500 absolute -top-1 -left-1" />
                      )}
                      <div className="flex items-center gap-0.5">
                        <div className={`font-bold ${metric.hasInvalidData ? 'line-through' : ''}`}>{metric.profile.id}</div>
                        {(metric.profile.isWatchlist ?? false) ? (
                          <EyeIcon className="w-2.5 h-2.5 text-blue-300" title="Watchlist" />
                        ) : (
                          <StarIcon className="w-2.5 h-2.5 text-yellow-400" title="Portefeuille" />
                        )}
                      </div>
                      <div className="text-[8px]">{metric.hasInvalidData ? 'N/A' : `${metric.totalReturnPercent.toFixed(0)}%`}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Graphique X/Y Amélioré */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📊 Positionnement JPEGY vs Rendement Total</h3>
          <div className="text-xs text-gray-500">
            {filteredMetrics.length} titre(s) affiché(s)
          </div>
        </div>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre à afficher sur le graphique.
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-50 p-2 sm:p-4 rounded-lg">
            <div className="min-w-[600px]">
              <svg width={chartWidth} height={chartHeight} className="border border-gray-300 rounded bg-white w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
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
                Rendement Total Projeté (5 ans, %) - Ratio 3:1
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

              {/* Points - EXCLURE les données invalides du graphique */}
              {filteredMetrics
                .filter(metric => !metric.hasInvalidData) // Exclure complètement les données invalides
                .map((metric) => {
                  // Validation supplémentaire: exclure les valeurs aberrantes même si hasInvalidData est false
                  if (metric.totalReturnPercent > 1000 || metric.totalReturnPercent < -100 || 
                      metric.jpegy > 100 || metric.jpegy < 0 || 
                      !isFinite(metric.totalReturnPercent) || !isFinite(metric.jpegy)) {
                    return null; // Ne pas afficher ce point
                  }
                  
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
                })
                .filter(Boolean) // Retirer les null
              }
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Graphique de Distribution des Rendements */}
      {filteredMetrics.length > 0 && (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">📊 Distribution des Rendements Totaux</h3>
          <div className="flex items-end justify-between gap-2 h-64 border-b border-l border-gray-300 pb-2 pl-2">
            {(() => {
              if (filteredMetrics.length === 0) return null;
              // Créer des bins pour la distribution
              const minReturn = Math.min(...filteredMetrics.map(m => m.totalReturnPercent));
              const maxReturn = Math.max(...filteredMetrics.map(m => m.totalReturnPercent));
              const binCount = 12;
              const binSize = (maxReturn - minReturn) / binCount || 1;
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
            {filteredMetrics.length} titre(s) | Range: {
              filteredMetrics.length > 0 
                ? `${Math.min(...filteredMetrics.map(m => m.totalReturnPercent)).toFixed(0)}% à ${Math.max(...filteredMetrics.map(m => m.totalReturnPercent)).toFixed(0)}%`
                : 'N/A'
            }
          </div>
        </div>
      )}

      {/* 5 Autres Idées de Visualisation */}
      {filteredMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Idée 1: Heatmap de Secteurs Amélioré */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">🔥 Performance par Secteur</h3>
          <div className="text-xs text-gray-500 mb-3">
            Rendement moyen, JPEGY moyen et nombre de titres par secteur
          </div>
          <div className="space-y-3">
            {Array.from(new Set(filteredMetrics.map(m => m.profile.info.sector)))
              .map(sector => {
                const sectorMetrics = filteredMetrics.filter(m => m.profile.info.sector === sector);
                const avgReturn = sectorMetrics.reduce((sum, m) => sum + m.totalReturnPercent, 0) / sectorMetrics.length;
                const avgJPEGY = sectorMetrics.reduce((sum, m) => sum + m.jpegy, 0) / sectorMetrics.length;
                const avgRatio31 = sectorMetrics.reduce((sum, m) => sum + m.ratio31, 0) / sectorMetrics.length;
                return { sector, avgReturn, avgJPEGY, avgRatio31, count: sectorMetrics.length };
              })
              .sort((a, b) => b.avgReturn - a.avgReturn)
              .map(({ sector, avgReturn, avgJPEGY, avgRatio31, count }) => (
                <div key={sector} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-800">{sector}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {count} titre(s)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Rendement moyen:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(Math.max((avgReturn + 50) / 200 * 100, 0), 100)}%`,
                              backgroundColor: getReturnColor(avgReturn)
                            }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-16 text-right ${
                          avgReturn >= 50 ? 'text-green-600' :
                          avgReturn >= 20 ? 'text-green-500' :
                          avgReturn >= 0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {avgReturn.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">JPEGY moyen:</span>
                      <span 
                        className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: getJpegyColor(avgJPEGY) }}
                      >
                        {avgJPEGY.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Ratio 3:1 moyen:</span>
                      <span className={`text-xs font-semibold ${
                        avgRatio31 >= 3 ? 'text-green-600' :
                        avgRatio31 >= 1 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {avgRatio31.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Idée 2: Top Performers Amélioré */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">🏆 Top 5 Performers</h3>
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

        {/* Idée 3: Distribution des Risques Amélioré avec Graphique */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">⚠️ Distribution des Risques de Baisse</h3>
          <div className="text-xs text-gray-500 mb-3">
            Classification par niveau de risque avec visualisation
          </div>
          <div className="mb-4">
            <div className="flex items-end justify-between gap-3 h-24 border-b border-l border-gray-300 pb-2 pl-2 bg-gray-50 p-2 rounded">
              {['Faible', 'Modéré', 'Élevé'].map((level, idx) => {
                const ranges = [[0, 20], [20, 50], [50, 100]];
                const count = filteredMetrics.filter(m => 
                  m.downsideRisk >= ranges[idx][0] && m.downsideRisk < ranges[idx][1]
                ).length;
                const maxCount = Math.max(...['Faible', 'Modéré', 'Élevé'].map((_, i) => {
                  const r = [[0, 20], [20, 50], [50, 100]];
                  return filteredMetrics.filter(m => 
                    m.downsideRisk >= r[i][0] && m.downsideRisk < r[i][1]
                  ).length;
                }), 1);
                return (
                  <div key={level} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        height: `${(count / maxCount) * 100}%`,
                        backgroundColor: idx === 0 ? '#86efac' : idx === 1 ? '#eab308' : '#dc2626',
                        minHeight: '10px'
                      }}
                      title={`${level}: ${count} titre(s)`}
                    />
                    <span className="text-[9px] text-gray-600 mt-1 text-center">{level}</span>
                    <span className="text-xs font-bold text-gray-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            {['Faible', 'Modéré', 'Élevé'].map((level, idx) => {
              const ranges = [[0, 20], [20, 50], [50, 100]];
              const count = filteredMetrics.filter(m => 
                m.downsideRisk >= ranges[idx][0] && m.downsideRisk < ranges[idx][1]
              ).length;
              const titles = filteredMetrics
                .filter(m => m.downsideRisk >= ranges[idx][0] && m.downsideRisk < ranges[idx][1])
                .map(m => m.profile.id)
                .slice(0, 5);
              return (
                <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{level}</span>
                    {titles.length > 0 && (
                      <span className="text-xs text-gray-500">
                        ({titles.join(', ')}{titles.length < count ? ` +${count - titles.length}` : ''})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          idx === 0 ? 'bg-green-400' : idx === 1 ? 'bg-yellow-400' : 'bg-red-500'
                        }`}
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
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">📊 Distribution Ratio 3:1 (Potentiel vs Risque)</h3>
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
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">📈 Timeline de Performance (Triée par Rendement)</h3>
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

      {/* Matrice de Corrélation */}
      {filteredMetrics.length > 1 && (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">🔗 Matrice de Corrélation entre Métriques</h3>
          <div className="text-xs text-gray-500 mb-4">
            Corrélations entre JPEGY, Rendement, Ratio 3:1, P/E, Yield et Croissance
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-bold text-gray-700 border-b border-gray-300"></th>
                  <th className="p-2 text-center font-bold text-gray-700 border-b border-gray-300">JPEGY</th>
                  <th className="p-2 text-center font-bold text-gray-700 border-b border-gray-300">Rendement</th>
                  <th className="p-2 text-center font-bold text-gray-700 border-b border-gray-300">Ratio 3:1</th>
                  <th className="p-2 text-center font-bold text-gray-700 border-b border-gray-300">P/E</th>
                  <th className="p-2 text-center font-bold text-gray-700 border-b border-gray-300">Yield</th>
                  <th className="p-2 text-center font-bold text-gray-700 border-b border-gray-300">Croissance</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const metrics = ['jpegy', 'totalReturnPercent', 'ratio31', 'currentPE', 'currentYield', 'historicalGrowth'];
                  const labels = ['JPEGY', 'Rendement', 'Ratio 3:1', 'P/E', 'Yield', 'Croissance'];
                  
                  const calculateCorrelation = (x: string, y: string): number => {
                    if (filteredMetrics.length < 2) return 0;
                    const xValues = filteredMetrics.map(m => {
                      const val = m[x as keyof typeof m];
                      return typeof val === 'number' && isFinite(val) ? val : 0;
                    }).filter(v => v != null && isFinite(v));
                    const yValues = filteredMetrics.map(m => {
                      const val = m[y as keyof typeof m];
                      return typeof val === 'number' && isFinite(val) ? val : 0;
                    }).filter(v => v != null && isFinite(v));
                    
                    if (xValues.length !== yValues.length || xValues.length < 2) return 0;
                    
                    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
                    const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
                    
                    let numerator = 0;
                    let xSumSq = 0;
                    let ySumSq = 0;
                    
                    for (let i = 0; i < xValues.length; i++) {
                      const xDiff = xValues[i] - xMean;
                      const yDiff = yValues[i] - yMean;
                      numerator += xDiff * yDiff;
                      xSumSq += xDiff * xDiff;
                      ySumSq += yDiff * yDiff;
                    }
                    
                    const denominator = Math.sqrt(xSumSq * ySumSq);
                    return denominator === 0 ? 0 : numerator / denominator;
                  };
                  
                  return metrics.map((metric, idx) => (
                    <tr key={metric}>
                      <td className="p-2 font-bold text-gray-700 border-r border-gray-300">{labels[idx]}</td>
                      {metrics.map((otherMetric, otherIdx) => {
                        if (idx === otherIdx) {
                          return (
                            <td key={otherMetric} className="p-2 text-center bg-gray-100 font-bold">
                              1.00
                            </td>
                          );
                        }
                        const corr = calculateCorrelation(metric, otherMetric);
                        const intensity = Math.abs(corr);
                        const color = corr > 0 
                          ? `rgba(34, 197, 94, ${intensity})` // Vert pour corrélation positive
                          : `rgba(239, 68, 68, ${intensity})`; // Rouge pour corrélation négative
                        return (
                          <td 
                            key={otherMetric} 
                            className="p-2 text-center font-semibold"
                            style={{ backgroundColor: color, color: intensity > 0.5 ? 'white' : 'black' }}
                            title={`Corrélation: ${corr.toFixed(3)}`}
                          >
                            {corr.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Corrélation positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Corrélation négative</span>
            </div>
            <div className="text-gray-500">Intensité = valeur absolue</div>
          </div>
        </div>
      )}

      {/* Tableau détaillé Amélioré */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📋 Tableau de Performance Détaillé</h3>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-xs text-gray-500">
              {filteredMetrics.length} titre(s)
            </div>
            <button
              onClick={handleExport}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none"
              title="Exporter en CSV"
            >
              📥 <span className="hidden sm:inline">Exporter</span> CSV
            </button>
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
                  <th 
                    className="p-3 text-left font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleSort('ticker')}
                  >
                    <div className="flex items-center gap-1">
                      Ticker
                      {sortConfig.key === 'ticker' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors" 
                    title="P/E ajusté pour croissance et rendement"
                    onClick={() => handleSort('jpegy')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      JPEGY
                      {sortConfig.key === 'jpegy' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors" 
                    title="Rendement total projeté sur 5 ans"
                    onClick={() => handleSort('totalReturnPercent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Rendement
                      {sortConfig.key === 'totalReturnPercent' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors" 
                    title="Ratio potentiel de hausse vs risque de baisse"
                    onClick={() => handleSort('ratio31')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Ratio 3:1
                      {sortConfig.key === 'ratio31' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Potentiel de hausse en %">Hausse</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Risque de baisse en %">Baisse</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Ratio cours/bénéfice actuel">P/E</th>
                  <th className="p-3 text-right font-bold text-gray-700 border-b border-gray-300" title="Rendement du dividende">Yield</th>
                  <th 
                    className="p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors" 
                    title="Croissance historique des EPS"
                    onClick={() => handleSort('historicalGrowth')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Croissance
                      {sortConfig.key === 'historicalGrowth' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-center font-bold text-gray-700 border-b border-gray-300">Approuvé</th>
                  <th 
                    className="p-3 text-center font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleSort('recommendation')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Signal
                      {sortConfig.key === 'recommendation' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
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
                  <td className="p-2 font-bold">
                    <div className="flex items-center gap-2">
                      <span>{metric.profile.id}</span>
                      {(metric.profile.isWatchlist ?? false) ? (
                        <EyeIcon className="w-4 h-4 text-blue-500" title="Watchlist" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-yellow-500" title="Portefeuille" />
                      )}
                    </div>
                  </td>
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

