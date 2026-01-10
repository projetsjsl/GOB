import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { StarIcon, EyeIcon } from '@heroicons/react/24/solid';
import { AnalysisProfile, Recommendation } from '../types';
import { calculateRecommendation } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, LightBulbIcon, ExclamationCircleIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon, ArrowPathIcon, BookOpenIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { listSnapshots } from '../services/snapshotApi';
import { SyncSelectionDialog } from './SyncSelectionDialog';
import { GuideDialog } from './GuideDialog';
import { StatusBadge } from './StatusBadge';
import { logger } from '../utils/logger';
import { AdditionalMetrics } from './AdditionalMetrics';
import { EvaluationDetails } from './EvaluationDetails';

interface KPIDashboardProps {
  profiles: AnalysisProfile[];
  currentId: string;
  onSelect: (id: string) => void;
  onBulkSync?: () => void; // Optionnel : fonction pour synchroniser tous les tickers
  onSyncNA?: (tickers: string[]) => void; // Optionnel : fonction pour synchroniser uniquement les N/A
  isBulkSyncing?: boolean; // Optionnel : état de la synchronisation
  onUpdateProfile?: (id: string, newProfile: AnalysisProfile) => void;
  onOpenSettings?: () => void; // Optionnel : fonction pour ouvrir le panneau de paramètres
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ profiles, currentId, onSelect, onBulkSync, onSyncNA, isBulkSyncing = false, onUpdateProfile, onOpenSettings }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'totalReturnPercent', direction: 'desc' });
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  const [isAnalyzingNA, setIsAnalyzingNA] = useState(false);
  const [naAnalysisResult, setNaAnalysisResult] = useState<{
    total: number;
    na: number;
    valid: number;
    errors: number;
    naTickers: string[];
  } | null>(null);
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [matrixView, setMatrixView] = useState<'grid' | 'list' | 'compact'>('grid');
  const [approvedVersions, setApprovedVersions] = useState<Set<string>>(new Set());
  const [isLoadingApprovedVersions, setIsLoadingApprovedVersions] = useState(false);
  
  // États pour zoom et pan - Graphique JPEGY
  const [zoomJPEGY, setZoomJPEGY] = useState(1);
  const [panJPEGY, setPanJPEGY] = useState({ x: 0, y: 0 });
  const [isPanningJPEGY, setIsPanningJPEGY] = useState(false);
  const [panStartJPEGY, setPanStartJPEGY] = useState({ x: 0, y: 0 });
  const svgJPEGYRef = useRef<SVGSVGElement>(null);
  
  // États pour zoom et pan - Graphique Ratio 3:1
  const [zoomRatio31, setZoomRatio31] = useState(1);
  const [panRatio31, setPanRatio31] = useState({ x: 0, y: 0 });
  const [isPanningRatio31, setIsPanningRatio31] = useState(false);
  const [panStartRatio31, setPanStartRatio31] = useState({ x: 0, y: 0 });
  const svgRatio31Ref = useRef<SVGSVGElement>(null);
  
  // États pour gérer la visibilité des sections (collapse/expand)
  const [sectionsVisibility, setSectionsVisibility] = useState<Record<string, boolean>>({
    globalStats: true,
    detailedAnalysis: true,
    comparison: true,
    filters: true,
    performanceMatrix: true,
    scatterPlot: true,
    scatterPlotRatio31: true,
    returnDistribution: true,
    otherVisualizations: true,
    correlationMatrix: true,
    detailedTable: true
  });
  
  const toggleSection = (sectionKey: string) => {
    setSectionsVisibility(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Calculer les métriques pour chaque profil
  const profileMetrics = useMemo(() => {
    if (profiles.length === 0) return [];
    return profiles.map(profile => {
      // ✅ CAS 1: Profil Squelette en cours de chargement
      if (profile._isSkeleton) {
        return {
          profile,
          recommendation: null,
          jpegy: null,
          totalReturnPercent: null,
          ratio31: null,
          downsideRisk: null,
          upsidePotential: null,
          hasApprovedVersion: false,
          targetPrice: null,
          currentPE: null,
          currentPCF: null,
          currentPBV: null,
          currentYield: null,
          historicalGrowth: null,
          volatility: null,
          _isLoading: true // Affiche le spinner
        };
      }

      // ✅ CAS 2: Données manquantes ou vides (Échec chargement)
      if (!profile.data || profile.data.length === 0) {
        return {
          profile,
          recommendation: null,
          jpegy: null,
          totalReturnPercent: null,
          ratio31: null,
          downsideRisk: null,
          upsidePotential: null,
          hasApprovedVersion: false,
          targetPrice: null,
          currentPE: null,
          currentPCF: null,
          currentPBV: null,
          currentYield: null,
          historicalGrowth: null,
          volatility: null,
          _isLoading: false, // Pas de spinner
          hasInvalidData: true,
          invalidReason: "Données manquantes ou échec chargement"
        };
      }
      
      const { recommendation, targetPrice } = calculateRecommendation(profile.data, profile.assumptions);
      
      // VALIDATION: Vérifier que currentPrice est valide
      const currentPrice = Math.max(profile.assumptions.currentPrice || 0, 0.01); // Minimum 0.01 pour éviter division par zéro
      if (currentPrice <= 0 || !isFinite(currentPrice)) {
        // Retourner des valeurs par défaut si prix invalide
        return {
          profile,
          recommendation,
          jpegy: null,
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
      
      // BUG #3P1-2 FIX: Validation pour éviter NaN quand currentPrice = 0
      const baseYield = currentPrice > 0 && profile.assumptions.currentDividend >= 0 
        ? (profile.assumptions.currentDividend / currentPrice) * 100 
        : 0;
      // Limiter yield à 0-50% (au-delà c'est suspect)
      const safeBaseYield = Math.max(0, Math.min(baseYield, 50));
      
      const growthPlusYield = (profile.assumptions.growthRateEPS || 0) + safeBaseYield;
      
      // JPEGY: valider que growthPlusYield > 0.01 ET que basePE est valide
      // Retourner null si impossible à calculer (au lieu de 0)
      let jpegy: number | null = null;
      if (growthPlusYield > 0.01 && safeBasePE > 0 && hasValidEPS) {
        const rawJPEGY = safeBasePE / growthPlusYield;
        if (isFinite(rawJPEGY) && rawJPEGY >= 0 && rawJPEGY <= 100) {
          jpegy = rawJPEGY;
        }
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
        if (jpegy === null) {
          const growthRate = (profile.assumptions.growthRateEPS != null && isFinite(profile.assumptions.growthRateEPS)) ? profile.assumptions.growthRateEPS.toFixed(2) : '0.00';
          const yieldValue = (baseYield != null && isFinite(baseYield)) ? baseYield.toFixed(2) : '0.00';
          invalidReason.push(`JPEGY non calculable: Croissance EPS (${growthRate}%) + Yield (${yieldValue}%) trop faible (≤0.01%) ou EPS invalide - Ajustez la croissance, le dividende ou synchronisez les données`);
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

  // Charger les versions approuvées pour tous les profils (avec cache et optimisation)
  const approvedVersionsCacheRef = React.useRef<{ profileIds: string; approvedSet: Set<string>; timestamp: number } | null>(null);
  const APPROVED_VERSIONS_CACHE_TTL = 300000; // Cache valide pendant 5 minutes
  
  useEffect(() => {
    const loadApprovedVersions = async () => {
      // Vérifier le cache
      const now = Date.now();
      const currentProfileIds = profiles.map(p => p.id).sort().join(',');
      
      if (approvedVersionsCacheRef.current && 
          approvedVersionsCacheRef.current.profileIds === currentProfileIds &&
          (now - approvedVersionsCacheRef.current.timestamp) < APPROVED_VERSIONS_CACHE_TTL) {
        // Utiliser le cache
        setApprovedVersions(approvedVersionsCacheRef.current.approvedSet);
        setIsLoadingApprovedVersions(false);
        return;
      }
      
      setIsLoadingApprovedVersions(true);
  const approvedSet = new Set<string>();
  
  // Traiter par batch de 5 pour éviter de surcharger l'API (réduit de 10)
  const batchSize = 5;
  let batchCount = 0;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    batchCount++;
    
    await Promise.all(
      batch.map(async (profile) => {
        try {
          if (!profile.id) return; // ✅ Guard clause pour éviter les erreurs 400
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
    
    // Délai entre les batches pour éviter de surcharger l'API (augmenté à 500ms)
    if (i + batchSize < profiles.length) {
      // Pause plus longue tous les 10 batches pour permettre à la base de récupérer
      const delay = (batchCount % 10 === 0) ? 2000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
      
      // Mettre à jour le cache
      approvedVersionsCacheRef.current = {
        profileIds: currentProfileIds,
        approvedSet: new Set(approvedSet),
        timestamp: now
      };
      
      setApprovedVersions(approvedSet);
      setIsLoadingApprovedVersions(false);
    };

    if (profiles.length > 0) {
      loadApprovedVersions();
    } else {
      setIsLoadingApprovedVersions(false);
      setApprovedVersions(new Set());
    }
  }, [profiles]);

  // Gérer les event listeners wheel pour le graphique JPEGY (non-passif pour permettre preventDefault)
  useEffect(() => {
    const svg = svgJPEGYRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomJPEGY(prevZoom => {
        const newZoom = Math.max(0.5, Math.min(prevZoom * delta, 5));
        const zoomFactor = newZoom / prevZoom;
        setPanJPEGY(prev => ({
          x: mouseX - (mouseX - prev.x) * zoomFactor,
          y: mouseY - (mouseY - prev.y) * zoomFactor
        }));
        return newZoom;
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Gérer les event listeners wheel pour le graphique Ratio 3:1 (non-passif pour permettre preventDefault)
  useEffect(() => {
    const svg = svgRatio31Ref.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomRatio31(prevZoom => {
        const newZoom = Math.max(0.5, Math.min(prevZoom * delta, 5));
        const zoomFactor = newZoom / prevZoom;
        setPanRatio31(prev => ({
          x: mouseX - (mouseX - prev.x) * zoomFactor,
          y: mouseY - (mouseY - prev.y) * zoomFactor
        }));
        return newZoom;
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Calculer les valeurs min/max réelles pour définir des filtres par défaut qui incluent tout
  const defaultFilterValues = useMemo(() => {
    if (profileMetrics.length === 0) {
      return {
        minReturn: -100,
        maxReturn: 500,
        minJPEGY: 0,
        maxJPEGY: 10,
        sector: '',
        recommendation: 'all' as 'all' | Recommendation,
        source: 'all' as 'all' | 'portfolio' | 'watchlist'
      };
    }
    
    const returns = profileMetrics.map(m => m.totalReturnPercent);
    const jpegyValues = profileMetrics.map(m => m.jpegy).filter((j): j is number => j !== null);
    
    return {
      minReturn: Math.floor(Math.min(...returns, -100)) - 10, // Marge de sécurité
      maxReturn: Math.ceil(Math.max(...returns, 500)) + 10, // Marge de sécurité
      minJPEGY: jpegyValues.length > 0 ? Math.max(0, Math.floor(Math.min(...jpegyValues, 0))) : 0,
      maxJPEGY: jpegyValues.length > 0 ? Math.ceil(Math.max(...jpegyValues, 10)) + 2 : 10, // Marge de sécurité
      sector: '',
      recommendation: 'all' as 'all' | Recommendation,
      source: 'all' as 'all' | 'portfolio' | 'watchlist'
    };
  }, [profileMetrics]);

  const [filters, setFilters] = useState(() => ({
    minReturn: -100,
    maxReturn: 500,
    minJPEGY: 0,
    maxJPEGY: 10,
    minRatio31: 0,
    maxRatio31: 100,
    minPE: 0,
    maxPE: 1000,
    minYield: 0,
    maxYield: 50,
    minVolatility: 0,
    maxVolatility: 200,
    minGrowth: -50,
    maxGrowth: 100,
    sector: '',
    recommendation: 'all' as 'all' | Recommendation,
    source: 'all' as 'all' | 'portfolio' | 'watchlist',
    showOnlyNA: false,
    showOnlyApproved: false,
    showOnlySkeleton: false,
    groupBy: 'none' as 'none' | 'sector' | 'recommendation' | 'source'
  }));

  // Options d'affichage
  const [displayOptions, setDisplayOptions] = useState({
    visibleColumns: {
      ticker: true,
      jpegy: true,
      return: true,
      ratio31: true,
      upside: true,
      downside: true,
      pe: true,
      yield: true,
      growth: true,
      volatility: true,
      approved: true,
      recommendation: true
    },
    compactMode: false,
    showSector: true,
    showNames: true,
    density: 'comfortable' as 'compact' | 'comfortable' | 'spacious'
  });

  // Mettre à jour les filtres quand defaultFilterValues change (nouveaux profils chargés)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...defaultFilterValues
    }));
  }, [defaultFilterValues]);

  // Filtrer et trier les profils
  const filteredMetrics = useMemo(() => {
    const filtered = profileMetrics.filter(metric => {
      // Filtre N/A en premier (priorité)
      if (filters.showOnlyNA && !metric.hasInvalidData && metric.jpegy !== null) {
        return false;
      }
      
      // Filtre squelette
      if (filters.showOnlySkeleton && !metric.profile._isSkeleton) {
        return false;
      }
      
      // Filtre approuvé
      if (filters.showOnlyApproved && !metric.hasApprovedVersion) {
        return false;
      }
      
      if (metric.totalReturnPercent < filters.minReturn || metric.totalReturnPercent > filters.maxReturn) return false;
      
      // Filtrer JPEGY seulement si la valeur est calculable (non null)
      if (metric.jpegy !== null && (metric.jpegy < filters.minJPEGY || metric.jpegy > filters.maxJPEGY)) return false;
      
      // Filtres par métrique supplémentaires
      if (metric.ratio31 !== null && (metric.ratio31 < filters.minRatio31 || metric.ratio31 > filters.maxRatio31)) return false;
      if (metric.currentPE !== null && (metric.currentPE < filters.minPE || metric.currentPE > filters.maxPE)) return false;
      if (metric.currentYield !== null && (metric.currentYield < filters.minYield || metric.currentYield > filters.maxYield)) return false;
      if (metric.volatility !== null && (metric.volatility < filters.minVolatility || metric.volatility > filters.maxVolatility)) return false;
      if (metric.historicalGrowth !== null && (metric.historicalGrowth < filters.minGrowth || metric.historicalGrowth > filters.maxGrowth)) return false;
      
      if (filters.sector && metric.profile.info.sector.toLowerCase() !== filters.sector.toLowerCase()) return false;
      if (filters.recommendation !== 'all') {
        // Mapping entre les valeurs du filtre et les valeurs réelles
        const filterMap: Record<string, string> = {
          'BUY': 'ACHAT',
          'HOLD': 'CONSERVER',
          'SELL': 'VENTE',
          'ACHAT': 'ACHAT',
          'CONSERVER': 'CONSERVER',
          'VENTE': 'VENTE'
        };
        const expectedValue = filterMap[filters.recommendation] || filters.recommendation;
        if (metric.recommendation !== expectedValue) return false;
      }
      // Filtre portefeuille/watchlist
      if (filters.source !== 'all') {
        const isWatchlist = metric.profile.isWatchlist ?? false;
        if (filters.source === 'watchlist' && !isWatchlist) return false;
        if (filters.source === 'portfolio' && isWatchlist) return false;
      }
      return true;
    });
    
    // Groupement (si activé)
    let grouped = filtered;
    if (filters.groupBy !== 'none') {
      const groups = new Map<string, typeof filtered>();
      filtered.forEach(metric => {
        let key = '';
        switch (filters.groupBy) {
          case 'sector':
            key = metric.profile.info.sector || 'Autre';
            break;
          case 'recommendation':
            key = metric.recommendation || 'N/A';
            break;
          case 'source':
            key = (metric.profile.isWatchlist ?? false) ? 'Watchlist' : 'Portefeuille';
            break;
        }
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(metric);
      });
      // Aplatir les groupes (on peut améliorer pour afficher par groupe)
      grouped = Array.from(groups.values()).flat();
    }
    
    // Trier
    const sorted = [...grouped].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];
      
      // Gérer les valeurs imbriquées
      if (sortConfig.key === 'ticker') {
        aValue = a.profile.id;
        bValue = b.profile.id;
      } else if (sortConfig.key === 'sector') {
        aValue = a.profile.info.sector;
        bValue = b.profile.info.sector;
      } else if (sortConfig.key === 'name') {
        aValue = a.profile.info.name || a.profile.id;
        bValue = b.profile.info.name || b.profile.id;
      } else if (sortConfig.key === 'ratio31') {
        aValue = a.ratio31 ?? 0;
        bValue = b.ratio31 ?? 0;
      } else if (sortConfig.key === 'upsidePotential') {
        aValue = a.upsidePotential;
        bValue = b.upsidePotential;
      } else if (sortConfig.key === 'downsideRisk') {
        aValue = a.downsideRisk;
        bValue = b.downsideRisk;
      } else if (sortConfig.key === 'currentPE') {
        aValue = a.currentPE ?? 0;
        bValue = b.currentPE ?? 0;
      } else if (sortConfig.key === 'currentYield') {
        aValue = a.currentYield ?? 0;
        bValue = b.currentYield ?? 0;
      } else if (sortConfig.key === 'volatility') {
        aValue = a.volatility ?? 0;
        bValue = b.volatility ?? 0;
      } else if (sortConfig.key === 'targetPrice') {
        aValue = a.targetPrice ?? 0;
        bValue = b.targetPrice ?? 0;
      }
      
      // Gérer les valeurs null
      if (aValue === null || aValue === undefined) aValue = -Infinity;
      if (bValue === null || bValue === undefined) bValue = -Infinity;
      
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
  
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // Définir handleExport APRÈS filteredMetrics pour éviter l'erreur d'initialisation
  const handleExport = useCallback(() => {
    const csv = [
      ['Ticker', 'Nom', 'Secteur', 'JPEGY', 'Rendement Total', 'Ratio 3:1', 'Potentiel Hausse', 'Risque Baisse', 'P/E', 'Yield', 'Croissance', 'Recommandation', 'Prix Actuel', 'Prix Cible', 'Prix Achat', 'Prix Vente', 'P/CF', 'P/BV', 'Volatilité'].join(','),
      ...filteredMetrics.map(m => [
        m.profile.id,
        `"${m.profile.info.name}"`,
        m.profile.info.sector,
        m.jpegy !== null && m.jpegy !== undefined ? m.jpegy.toFixed(2) : 'N/A',
        m.totalReturnPercent !== null && m.totalReturnPercent !== undefined ? m.totalReturnPercent.toFixed(2) : 'N/A',
        m.ratio31 !== null && m.ratio31 !== undefined ? m.ratio31.toFixed(2) : 'N/A',
        m.upsidePotential !== null && m.upsidePotential !== undefined ? m.upsidePotential.toFixed(2) : 'N/A',
        m.downsideRisk !== null && m.downsideRisk !== undefined ? m.downsideRisk.toFixed(2) : 'N/A',
        (m.currentPE !== null && m.currentPE !== undefined ? m.currentPE.toFixed(1) : 'N/A'),
        (m.currentYield !== null && m.currentYield !== undefined ? m.currentYield.toFixed(2) : 'N/A'),
        (m.historicalGrowth !== null && m.historicalGrowth !== undefined ? m.historicalGrowth.toFixed(2) : 'N/A'),
        m.recommendation,
        (m.profile.assumptions.currentPrice !== null && m.profile.assumptions.currentPrice !== undefined ? m.profile.assumptions.currentPrice.toFixed(2) : 'N/A'),
        (m.targetPrice !== null && m.targetPrice !== undefined ? m.targetPrice.toFixed(2) : 'N/A'),
        (m.profile.assumptions.currentPrice !== null && m.profile.assumptions.currentPrice !== undefined ? (m.profile.assumptions.currentPrice * 0.9).toFixed(2) : 'N/A'),
        (m.profile.assumptions.currentPrice !== null && m.profile.assumptions.currentPrice !== undefined ? (m.profile.assumptions.currentPrice * 1.1).toFixed(2) : 'N/A'),
        (m.currentPCF !== null && m.currentPCF !== undefined ? m.currentPCF.toFixed(1) : 'N/A'),
        (m.currentPBV !== null && m.currentPBV !== undefined ? m.currentPBV.toFixed(2) : 'N/A'),
        (m.volatility !== null && m.volatility !== undefined ? m.volatility.toFixed(2) : 'N/A')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpi-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredMetrics]);

  // Raccourcis clavier (défini APRÈS handleExport)
  useKeyboardShortcuts({
    onSyncAll: onBulkSync,
    onSyncNA: () => {
      if (filters.showOnlyNA && onSyncNA && filteredMetrics.length > 0) {
        const naTickers = filteredMetrics.map(m => m.profile.id);
        onSyncNA(naTickers);
      }
    },
    onToggleNAFilter: () => {
      setFilters(prev => ({ ...prev, showOnlyNA: !prev.showOnlyNA }));
    },
    onExport: handleExport,
    onOpenSyncDialog: () => setShowSyncDialog(true),
    enabled: true
  });

  // Obtenir la couleur JPEGY (retourne null si JPEGY est null)
  const getJpegyColor = (jpegy: number | null): string | null => {
    if (jpegy === null) return null; // Pas de couleur si N/A
    if (jpegy <= 0.5) return '#86efac'; // Vert pâle
    if (jpegy <= 1.5) return '#16a34a'; // Vert foncé
    if (jpegy <= 1.75) return '#eab308'; // Jaune
    if (jpegy <= 2.0) return '#f97316'; // Orange
    return '#dc2626'; // Rouge
  };

  // Fonction pour obtenir la couleur du Ratio 3:1
  const getRatio31Color = (ratio: number | null): string | null => {
    if (ratio === null || !isFinite(ratio) || ratio < 0) return null;
    if (ratio >= 3) return '#16a34a'; // Vert foncé (favorable ≥ 3:1)
    if (ratio >= 1) return '#eab308'; // Jaune (acceptable 1:1 à 3:1)
    return '#dc2626'; // Rouge (défavorable < 1:1)
  };

  // Obtenir la couleur du rendement
  const getReturnColor = (returnPercent: number | null | undefined): string => {
    if (returnPercent === null || returnPercent === undefined) return '#9ca3af'; // Gris pour N/A
    if (returnPercent >= 50) return '#16a34a'; // Vert foncé
    if (returnPercent >= 20) return '#86efac'; // Vert pâle
    if (returnPercent >= 0) return '#eab308'; // Jaune
    return '#dc2626'; // Rouge
  };

  // Helpers pour Tailwind (classes CSS) pour éviter les styles inline
  const getReturnTextClass = (returnPercent: number | null | undefined): string => {
    if (returnPercent === null || returnPercent === undefined) return 'text-gray-400';
    if (returnPercent >= 50) return 'text-green-600';
    if (returnPercent >= 20) return 'text-green-300';
    if (returnPercent >= 0) return 'text-yellow-600'; // Note: yellow-600 for text readability
    return 'text-red-600';
  };

  const getReturnBgClass = (returnPercent: number | null | undefined): string => {
    if (returnPercent === null || returnPercent === undefined) return 'bg-gray-100'; // fallback
    if (returnPercent >= 50) return 'bg-green-600';
    if (returnPercent >= 20) return 'bg-green-300';
    if (returnPercent >= 0) return 'bg-yellow-400';
    return 'bg-red-600';
  };

  const getJpegyTextClass = (jpegy: number | null): string => {
    if (jpegy === null) return 'text-gray-400';
    if (jpegy <= 0.5) return 'text-green-300';
    if (jpegy <= 1.5) return 'text-green-600';
    if (jpegy <= 1.75) return 'text-yellow-600';
    if (jpegy <= 2.0) return 'text-orange-500';
    return 'text-red-600';
  };

  const getJpegyBgClass = (jpegy: number | null): string => {
    if (jpegy === null) return 'bg-gray-400';
    if (jpegy <= 0.5) return 'bg-green-300';
    if (jpegy <= 1.5) return 'bg-green-600';
    if (jpegy <= 1.75) return 'bg-yellow-500';
    if (jpegy <= 2.0) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getRatioTextClass = (ratio: number | null): string => {
    if (ratio === null || !isFinite(ratio) || ratio < 0) return 'text-gray-400';
    if (ratio >= 3) return 'text-green-600';
    if (ratio >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatioFillClass = (ratio: number | null): string => {
    if (ratio === null || !isFinite(ratio) || ratio < 0) return 'fill-gray-400';
    if (ratio >= 3) return 'fill-green-600';
    if (ratio >= 1) return 'fill-yellow-500';
    return 'fill-red-600';
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
  
  // Calculer les échelles avec marges (seulement si on a des métriques filtrées VALIDES avec JPEGY calculable)
  const validMetricsForChart = filteredMetrics.filter(m => 
    !m.hasInvalidData && 
    m.totalReturnPercent >= -100 && m.totalReturnPercent <= 1000 &&
    m.jpegy !== null && m.jpegy >= 0 && m.jpegy <= 100 &&
    isFinite(m.totalReturnPercent) && isFinite(m.jpegy)
  );
  
  const maxJPEGY = validMetricsForChart.length > 0
    ? Math.max(...validMetricsForChart.map(m => m.jpegy!).filter((j): j is number => j !== null && j !== undefined && isFinite(j)), 5)
    : 5;
  const minJPEGY = validMetricsForChart.length > 0
    ? Math.min(...validMetricsForChart.map(m => m.jpegy!).filter((j): j is number => j !== null && j !== undefined && isFinite(j)), 0)
    : 0;
  const maxReturn = validMetricsForChart.length > 0
    ? Math.max(...validMetricsForChart.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined && isFinite(r)), 200)
    : 200;
  const minReturn = validMetricsForChart.length > 0
    ? Math.min(...validMetricsForChart.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined && isFinite(r)), -50)
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
    
    // Filtrer les valeurs null/undefined/invalides avant de calculer les statistiques
    // IMPORTANT: Exclure explicitement les profils en cours de chargement ou avec erreur
    const validMetrics = filteredMetrics.filter(m => !m.hasInvalidData && !(m as any)._isLoading);
    
    const returns = validMetrics.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined && isFinite(r));
    const jpegyValues = validMetrics.map(m => m.jpegy).filter((j): j is number => j !== null && j !== undefined && isFinite(j));
    const ratios = validMetrics.map(m => m.ratio31).filter((r): r is number => r !== null && r !== undefined && isFinite(r));
    
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const median = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };
    const stdDev = (arr: number[], mean: number) => {
      if (arr.length === 0) return 0;
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
      return Math.sqrt(variance);
    };
    
    const avgReturn = returns.length > 0 ? avg(returns) : 0;
    const medianReturn = returns.length > 0 ? median(returns) : 0;
    const stdReturn = returns.length > 0 ? stdDev(returns, avgReturn) : 0;
    
    const avgJPEGY = jpegyValues.length > 0 ? avg(jpegyValues) : null;
    const medianJPEGY = jpegyValues.length > 0 ? median(jpegyValues) : null;
    
    const avgRatio = ratios.length > 0 ? avg(ratios) : 0;
    const medianRatio = ratios.length > 0 ? median(ratios) : 0;
    
    return {
      avgReturn,
      medianReturn,
      stdReturn,
      minReturn: returns.length > 0 ? Math.min(...returns) : 0,
      maxReturn: returns.length > 0 ? Math.max(...returns) : 0,
      avgJPEGY,
      medianJPEGY,
      avgRatio,
      medianRatio,
      count: filteredMetrics.length,
      validCount: validMetrics.length
    };
  }, [filteredMetrics]);

  return (
    <div className="space-y-6">
      {/* Statistiques Globales */}
      {globalStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              📊 Statistiques Globales du Portefeuille 
              {globalStats.validCount < globalStats.count && (
                 <span className="ml-2 text-sm font-normal text-blue-600 animate-pulse">
                   (Chargement... {globalStats.validCount}/{globalStats.count})
                 </span>
              )}
            </h3>
            <button
              onClick={() => toggleSection('globalStats')}
              className="p-1.5 hover:bg-blue-100 rounded transition-colors cursor-help"
              title={sectionsVisibility.globalStats ? "Réduire cette section" : "Agrandir cette section"}
            >
              {sectionsVisibility.globalStats ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          {sectionsVisibility.globalStats && globalStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rendement Moyen</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                {globalStats.validCount > 0 ? (globalStats.avgReturn?.toFixed(1) ?? 'N/A') + '%' : <span className="text-sm font-normal text-gray-400">En attente...</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1">Médiane: {globalStats.validCount > 0 ? (globalStats.medianReturn?.toFixed(1) ?? 'N/A') + '%' : '-'}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Écart-Type</div>
              <div className="text-2xl font-bold text-purple-600">{globalStats.stdReturn !== null && globalStats.stdReturn !== undefined ? globalStats.stdReturn.toFixed(1) : 'N/A'}%</div>
              <div className="text-xs text-gray-400 mt-1">Volatilité</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rendement Min</div>
              <div className="text-2xl font-bold text-red-600">{globalStats.minReturn !== null && globalStats.minReturn !== undefined ? globalStats.minReturn.toFixed(1) : 'N/A'}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rendement Max</div>
              <div className="text-2xl font-bold text-green-600">{globalStats.maxReturn !== null && globalStats.maxReturn !== undefined ? globalStats.maxReturn.toFixed(1) : 'N/A'}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">JPEGY Moyen</div>
              {globalStats.avgJPEGY != null && isFinite(globalStats.avgJPEGY) ? (
                <>
                  <div className={`text-2xl font-bold ${getJpegyTextClass(globalStats.avgJPEGY)}`}>
                    {globalStats.avgJPEGY?.toFixed(2) ?? 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Médiane: {(globalStats.medianJPEGY != null && isFinite(globalStats.medianJPEGY)) ? globalStats.medianJPEGY.toFixed(2) : 'N/A'}</div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-[10px] text-gray-400 space-y-0.5">
                      <div><strong>Source:</strong> P/E Actuel ÷ (Croissance EPS % + Yield %)</div>
                      <div><strong>Fournisseur:</strong> Métrique propriétaire JSLAI™ développée par Jean-Sébastien. Ajuste le P/E par la somme du taux de croissance et du rendement du dividende pour une évaluation nuancée de la valorisation.</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-400 flex items-center gap-2">
                    N/A <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" title="JPEGY non calculable pour tous les titres" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Aucun JPEGY calculable</div>
                </>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Ratio 3:1 Moyen</div>
              <div className={`text-2xl font-bold ${
                (globalStats.avgRatio != null && globalStats.avgRatio >= 3) ? 'text-green-600' :
                (globalStats.avgRatio != null && globalStats.avgRatio >= 1) ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {(globalStats.avgRatio != null && isFinite(globalStats.avgRatio)) ? globalStats.avgRatio.toFixed(2) : 'N/A'}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Mode Comparaison */}
      {comparisonMode && selectedForComparison.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border-2 border-purple-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              🔍 Mode Comparaison ({selectedForComparison.length} titre(s))
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection('comparison')}
                className="p-1.5 hover:bg-purple-100 rounded transition-colors cursor-help"
                title={sectionsVisibility.comparison ? "Réduire cette section" : "Agrandir cette section"}
              >
                {sectionsVisibility.comparison ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setComparisonMode(false);
                  setSelectedForComparison([]);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                title="Fermer le mode comparaison"
              >
                Fermer
              </button>
            </div>
          </div>
          {sectionsVisibility.comparison && (
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
                      <span className="font-bold text-green-600">{(metric.totalReturnPercent != null && isFinite(metric.totalReturnPercent)) ? metric.totalReturnPercent.toFixed(1) : 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">JPEGY:</span>
                      <div className="text-right">
                        {metric.jpegy !== null ? (
                          <>
                            <span className={`font-bold ${getJpegyTextClass(metric.jpegy)}`}>
                              {metric.jpegy?.toFixed(2) ?? 'N/A'}
                            </span>
                            <div className="mt-1 pt-1 border-t border-gray-200">
                              <div className="text-[9px] text-gray-400 space-y-0.5 text-left">
                                <div><strong>Source:</strong> P/E ÷ (Growth % + Yield %)</div>
                                <div><strong>Fournisseur:</strong> JSLAI™ - Métrique propriétaire ajustant le P/E par croissance et dividende.</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="font-bold text-gray-400 flex items-center gap-1">
                            N/A <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" title="JPEGY non calculable" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ratio 3:1:</span>
                      <span className={`font-bold ${
                        (metric.ratio31 != null && metric.ratio31 >= 3) ? 'text-green-600' :
                        (metric.ratio31 != null && metric.ratio31 >= 1) ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(metric.ratio31 != null && isFinite(metric.ratio31)) ? metric.ratio31.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P/E:</span>
                      <span className="font-bold">{metric.currentPE?.toFixed(1) ?? 'N/A'}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yield:</span>
                      <span className="font-bold">{metric.currentYield?.toFixed(2) ?? 'N/A'}%</span>
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
          )}
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
            <button
              onClick={() => toggleSection('filters')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
              title={sectionsVisibility.filters ? "Réduire cette section" : "Agrandir cette section"}
            >
              {sectionsVisibility.filters ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
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
              title={comparisonMode 
                ? "Désactiver le Mode Comparaison\n\nCliquez pour désactiver le mode comparaison.\n\nEn mode comparaison, vous pouvez sélectionner jusqu'à 5 tickers pour les comparer côte à côte."
                : "Activer le Mode Comparaison\n\nCliquez pour activer le mode comparaison.\n\nEn mode comparaison:\n• Sélectionnez jusqu'à 5 tickers (cliquez sur les tuiles)\n• Les tickers sélectionnés sont marqués avec un numéro\n• Comparez leurs métriques côte à côte\n\nUtile pour comparer plusieurs opportunités d'investissement."}
            >
              {comparisonMode ? '✕ Mode Comparaison' : '🔍 Mode Comparaison'}
            </button>
            <button
              onClick={() => setFilters({
                ...defaultFilterValues,
                minRatio31: 0,
                maxRatio31: 100,
                minPE: 0,
                maxPE: 1000,
                minYield: 0,
                maxYield: 50,
                minVolatility: 0,
                maxVolatility: 200,
                minGrowth: -50,
                maxGrowth: 100,
                showOnlyNA: false,
                showOnlyApproved: false,
                showOnlySkeleton: false,
                groupBy: 'none'
              })}
              className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Réinitialiser tous les filtres\n\nRéinitialise tous les filtres actifs:\n• Rendement\n• JPEGY\n• Ratio 3:1\n• Recommandation\n• Secteur\n• Source\n\nAffiche tous les titres du portefeuille."
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
              title="Zoom Top 10\n\nFiltre automatiquement pour afficher uniquement les 10 tickers avec le meilleur rendement total projeté.\n\nAjuste les filtres Min/Max de rendement pour encadrer ces 10 tickers."
            >
              Top 10
            </button>
            <button
              onClick={() => {
                const undervalued = filteredMetrics.filter(m => m.jpegy !== null && m.jpegy <= 1.5);
                if (undervalued.length > 0) {
                  const validJPEGYs = undervalued.map(m => m.jpegy!).filter((j): j is number => j !== null);
                  const minJPEGY = Math.min(...validJPEGYs);
                  const maxJPEGY = Math.max(...validJPEGYs);
                  setFilters(prev => ({ ...prev, minJPEGY: 0, maxJPEGY: maxJPEGY + 0.5 }));
                }
              }}
              className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
              title="Sous-évalués (JPEGY ≤ 1.5)\n\nFiltre automatiquement pour afficher uniquement les tickers avec un JPEGY ≤ 1.5.\n\nJPEGY ≤ 1.5 indique une action sous-évaluée ou raisonnablement valorisée.\n\nAjuste automatiquement les filtres JPEGY Min/Max."
            >
              Sous-évalués
            </button>
          </div>
        </div>
        {sectionsVisibility.filters && (
          <>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
          <div>
            <label htmlFor="filter-min-return" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1 cursor-help" title="Rendement Total Projeté Minimum (%)\n\nFiltre les tickers avec un rendement total projeté supérieur ou égal à cette valeur.\n\nLe rendement total inclut:\n• Appréciation du prix (5 ans)\n• Dividendes cumulés (5 ans)\n\nPlage par défaut: -100% à +1000%">Rendement Min (%)</label>
            <input
              id="filter-min-return"
              type="number"
              value={filters.minReturn}
              onChange={(e) => setFilters({ ...filters, minReturn: parseFloat(e.target.value) || defaultFilterValues.minReturn })}
              className={`w-full px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.minReturn !== defaultFilterValues.minReturn 
                  ? 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-500' 
                  : 'border-gray-300 focus:border-blue-400'
              }`}
              title={`Filtre: Rendement Min = ${filters.minReturn}%\n\nAffiche uniquement les tickers avec un rendement total projeté ≥ ${filters.minReturn}%.\n\n${filters.minReturn !== defaultFilterValues.minReturn ? '✅ Filtre actif' : 'Filtre par défaut'}`}
            />
          </div>
          <div>
            <label htmlFor="filter-max-return" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1 cursor-help" title="Rendement Total Projeté Maximum (%)\n\nFiltre les tickers avec un rendement total projeté inférieur ou égal à cette valeur.\n\nLe rendement total inclut:\n• Appréciation du prix (5 ans)\n• Dividendes cumulés (5 ans)\n\nPlage par défaut: -100% à +1000%">Rendement Max (%)</label>
            <input
              id="filter-max-return"
              type="number"
              value={filters.maxReturn}
              onChange={(e) => setFilters({ ...filters, maxReturn: parseFloat(e.target.value) || defaultFilterValues.maxReturn })}
              className={`w-full px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.maxReturn !== defaultFilterValues.maxReturn 
                  ? 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-500' 
                  : 'border-gray-300 focus:border-blue-400'
              }`}
              title={`Filtre: Rendement Max = ${filters.maxReturn}%\n\nAffiche uniquement les tickers avec un rendement total projeté ≤ ${filters.maxReturn}%.\n\n${filters.maxReturn !== defaultFilterValues.maxReturn ? '✅ Filtre actif' : 'Filtre par défaut'}`}
            />
          </div>
          <div>
            <label htmlFor="filter-min-jpegy" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1 cursor-help" title="JPEGY Minimum\n\nFiltre les tickers avec un JPEGY supérieur ou égal à cette valeur.\n\nJPEGY = P/E ÷ (Croissance % + Yield %)\n\nPlage recommandée: 0.0 à 5.0\n\nPlus le JPEGY est bas, plus l'action est attractive.">JPEGY Min</label>
            <input
              id="filter-min-jpegy"
              type="number"
              step="0.1"
              value={filters.minJPEGY}
              onChange={(e) => setFilters({ ...filters, minJPEGY: parseFloat(e.target.value) || defaultFilterValues.minJPEGY })}
              className={`w-full px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.minJPEGY !== defaultFilterValues.minJPEGY 
                  ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-500' 
                  : 'border-gray-300 focus:border-green-400'
              }`}
              title={`Filtre: JPEGY Min = ${filters.minJPEGY}\n\nAffiche uniquement les tickers avec un JPEGY ≥ ${filters.minJPEGY}.\n\n${filters.minJPEGY !== defaultFilterValues.minJPEGY ? '✅ Filtre actif' : 'Filtre par défaut'}`}
            />
          </div>
          <div>
            <label htmlFor="filter-max-jpegy" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1 cursor-help" title="JPEGY Maximum\n\nFiltre les tickers avec un JPEGY inférieur ou égal à cette valeur.\n\nJPEGY = P/E ÷ (Croissance % + Yield %)\n\nPlage recommandée: 0.0 à 5.0\n\nPlus le JPEGY est bas, plus l'action est attractive.">JPEGY Max</label>
            <input
              id="filter-max-jpegy"
              type="number"
              step="0.1"
              value={filters.maxJPEGY}
              onChange={(e) => setFilters({ ...filters, maxJPEGY: parseFloat(e.target.value) || defaultFilterValues.maxJPEGY })}
              className={`w-full px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm transition-all ${
                filters.maxJPEGY !== defaultFilterValues.maxJPEGY 
                  ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-500' 
                  : 'border-gray-300 focus:border-green-400'
              }`}
              title={`Filtre: JPEGY Max = ${filters.maxJPEGY}\n\nAffiche uniquement les tickers avec un JPEGY ≤ ${filters.maxJPEGY}.\n\n${filters.maxJPEGY !== defaultFilterValues.maxJPEGY ? '✅ Filtre actif' : 'Filtre par défaut'}`}
            />
          </div>
          <div>
            <label htmlFor="filter-sector" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1 cursor-help" title="Filtre par Secteur\n\nFiltre les tickers par secteur d'activité.\n\nLaissez vide pour afficher tous les secteurs.\n\nLa recherche est insensible à la casse et cherche dans le nom du secteur.">Secteur</label>
            <input
              id="filter-sector"
              type="text"
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              placeholder="Tous"
              className="w-full px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm"
              title={`Filtre: Secteur = "${filters.sector || 'Tous'}"\n\n${filters.sector ? `Affiche uniquement les tickers du secteur contenant "${filters.sector}".` : 'Affiche tous les secteurs.'}\n\n${filters.sector ? '✅ Filtre actif' : 'Filtre par défaut'}`}
            />
          </div>
          <div>
            <label htmlFor="filter-recommendation" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1 cursor-help" title="Filtre par Recommandation\n\nFiltre les tickers selon la recommandation calculée:\n\n• ACHAT: Prix actuel ≤ Limite d'achat\n• CONSERVER: Entre limite d'achat et vente\n• VENTE: Prix actuel ≥ Limite de vente\n\nSélectionnez 'Toutes' pour afficher toutes les recommandations.">Recommandation</label>
            <select
              id="filter-recommendation"
              value={filters.recommendation}
              onChange={(e) => setFilters({ ...filters, recommendation: e.target.value as any })}
              className="w-full px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm"
              title={`Filtre: Recommandation = "${filters.recommendation === 'all' ? 'Toutes' : filters.recommendation}"\n\n${filters.recommendation !== 'all' ? `Affiche uniquement les tickers avec la recommandation "${filters.recommendation}".` : 'Affiche toutes les recommandations.'}\n\n${filters.recommendation !== 'all' ? '✅ Filtre actif' : 'Filtre par défaut'}`}
            >
              <option value="all">Toutes</option>
              <option value="ACHAT">Achat</option>
              <option value="CONSERVER">Conserver</option>
              <option value="VENTE">Vendre</option>
            </select>
          </div>
          <div className="relative">
            <label htmlFor="filter-source" className="flex text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2 items-center gap-1.5 sm:gap-2 cursor-help" title="Filtre par Source\n\nFiltre les tickers selon leur source:\n\n• ⭐ Portefeuille: Titres détenus actuellement\n• 👁️ Watchlist: Titres surveillés (non détenus)\n• Tous: Affiche les deux sources\n\nLe badge coloré indique le filtre actif.">
              <span className="truncate">Source</span>
              {filters.source !== 'all' && (
                <span className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ${
                  filters.source === 'watchlist' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {filters.source === 'watchlist' ? (
                    <>
                      <EyeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Watchlist</span>
                    </>
                  ) : (
                    <>
                      <StarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Portefeuille</span>
                    </>
                  )}
                </span>
              )}
            </label>
            <div className="relative">
              <select
                id="filter-source"
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value as any })}
                className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm transition-all appearance-none ${
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
                  className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs"
                  title="Réinitialiser le filtre Source\n\nRemet le filtre Source à 'Tous' (Portefeuille + Watchlist)."
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Filtres avancés supplémentaires */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Filtres avancés</h4>
            <button
              onClick={() => setFilters(prev => ({ ...prev, showOnlyNA: !prev.showOnlyNA }))}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.showOnlyNA ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-orange-100 text-gray-700'
              }`}
            >
              {filters.showOnlyNA ? '✓ N/A uniquement' : 'Afficher N/A'}
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, showOnlyApproved: !prev.showOnlyApproved }))}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.showOnlyApproved ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-green-100 text-gray-700'
              }`}
            >
              {filters.showOnlyApproved ? '✓ Approuvés uniquement' : 'Approuvés'}
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, showOnlySkeleton: !prev.showOnlySkeleton }))}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filters.showOnlySkeleton ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-100 text-gray-700'
              }`}
            >
              {filters.showOnlySkeleton ? '✓ Squelettes uniquement' : 'Squelettes'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
            {/* Ratio 3:1 */}
            <div>
              <label htmlFor="filter-ratio31-min" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Ratio 3:1 Min</label>
              <input
                id="filter-ratio31-min"
                type="number"
                step="0.1"
                value={filters.minRatio31}
                onChange={(e) => setFilters({ ...filters, minRatio31: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label htmlFor="filter-ratio31-max" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Ratio 3:1 Max</label>
              <input
                id="filter-ratio31-max"
                type="number"
                step="0.1"
                value={filters.maxRatio31}
                onChange={(e) => setFilters({ ...filters, maxRatio31: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            
            {/* P/E */}
            <div>
              <label htmlFor="filter-pe-min" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">P/E Min</label>
              <input
                id="filter-pe-min"
                type="number"
                step="0.1"
                value={filters.minPE}
                onChange={(e) => setFilters({ ...filters, minPE: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label htmlFor="filter-pe-max" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">P/E Max</label>
              <input
                id="filter-pe-max"
                type="number"
                step="0.1"
                value={filters.maxPE}
                onChange={(e) => setFilters({ ...filters, maxPE: parseFloat(e.target.value) || 1000 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            
            {/* Yield */}
            <div>
              <label htmlFor="filter-yield-min" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Yield Min (%)</label>
              <input
                id="filter-yield-min"
                type="number"
                step="0.1"
                value={filters.minYield}
                onChange={(e) => setFilters({ ...filters, minYield: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label htmlFor="filter-yield-max" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Yield Max (%)</label>
              <input
                id="filter-yield-max"
                type="number"
                step="0.1"
                value={filters.maxYield}
                onChange={(e) => setFilters({ ...filters, maxYield: parseFloat(e.target.value) || 50 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            
            {/* Volatilité */}
            <div>
              <label htmlFor="filter-volatility-min" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Volatilité Min (%)</label>
              <input
                id="filter-volatility-min"
                type="number"
                step="0.1"
                value={filters.minVolatility}
                onChange={(e) => setFilters({ ...filters, minVolatility: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label htmlFor="filter-volatility-max" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Volatilité Max (%)</label>
              <input
                id="filter-volatility-max"
                type="number"
                step="0.1"
                value={filters.maxVolatility}
                onChange={(e) => setFilters({ ...filters, maxVolatility: parseFloat(e.target.value) || 200 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            
            {/* Croissance */}
            <div>
              <label htmlFor="filter-growth-min" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Croissance Min (%)</label>
              <input
                id="filter-growth-min"
                type="number"
                step="0.1"
                value={filters.minGrowth}
                onChange={(e) => setFilters({ ...filters, minGrowth: parseFloat(e.target.value) || -50 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label htmlFor="filter-growth-max" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Croissance Max (%)</label>
              <input
                id="filter-growth-max"
                type="number"
                step="0.1"
                value={filters.maxGrowth}
                onChange={(e) => setFilters({ ...filters, maxGrowth: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              />
            </div>
            
            {/* Groupement */}
            <div>
              <label htmlFor="filter-group-by" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Grouper par</label>
              <select
                id="filter-group-by"
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              >
                <option value="none">Aucun</option>
                <option value="sector">Secteur</option>
                <option value="recommendation">Recommandation</option>
                <option value="source">Source</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Options d'affichage */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Options d'affichage</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label htmlFor="display-density" className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Densité</label>
              <select
                id="display-density"
                value={displayOptions.density}
                onChange={(e) => setDisplayOptions({ ...displayOptions, density: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
              >
                <option value="compact">Compacte</option>
                <option value="comfortable">Confortable</option>
                <option value="spacious">Spacieuse</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={displayOptions.showSector}
                  onChange={(e) => setDisplayOptions({ ...displayOptions, showSector: e.target.checked })}
                  className="w-4 h-4"
                />
                Afficher secteur
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={displayOptions.showNames}
                  onChange={(e) => setDisplayOptions({ ...displayOptions, showNames: e.target.checked })}
                  className="w-4 h-4"
                />
                Afficher noms
              </label>
            </div>
          </div>
          
          {/* Colonnes visibles */}
          <div className="mt-3">
            <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Colonnes visibles</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(displayOptions.visibleColumns).map(([key, visible]) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setDisplayOptions({
                      ...displayOptions,
                      visibleColumns: { ...displayOptions.visibleColumns, [key]: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{key === 'ratio31' ? 'Ratio 3:1' : key === 'pe' ? 'P/E' : key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Matrice à carreaux Améliorée avec Vues Multiples */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">🎯 Matrice de Performance</h3>
              <button
                onClick={() => toggleSection('performanceMatrix')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title={sectionsVisibility.performanceMatrix ? "Réduire cette section" : "Agrandir cette section"}
              >
                {sectionsVisibility.performanceMatrix ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
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
                title="Vue grille\n\nAffiche les tickers dans une grille de tuiles colorées.\n\nChaque tuile montre:\n• Symbole du ticker\n• Rendement total projeté\n• JPEGY\n• Icônes (Portefeuille/Watchlist)\n\nLes couleurs indiquent le rendement (vert = élevé, rouge = faible)."
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
                title="Vue liste détaillée\n\nAffiche les tickers dans un tableau détaillé.\n\nColonnes:\n• Symbole\n• Nom\n• Rendement Total\n• JPEGY\n• Ratio 3:1\n• P/E, P/CF, P/BV, Yield\n• Recommandation\n• Secteur\n\nCliquez sur une ligne pour voir l'analyse complète."
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
                title="Vue compacte (matrice)\n\nAffiche les tickers dans une matrice compacte.\n\nChaque case montre:\n• Symbole du ticker\n• Rendement total projeté\n• JPEGY\n\nIdéal pour une vue d'ensemble rapide de tous les tickers.\n\nLes cases sont colorées selon le rendement."
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
        {sectionsVisibility.performanceMatrix && (
          <>
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
                      <div className="font-semibold block mt-1 space-y-2">
                        <p>La plupart nécessitent une synchronisation depuis l'API.</p>
                        {onBulkSync ? (
                          <button
                            onClick={onBulkSync}
                            disabled={isBulkSyncing}
                            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                          >
                            <ArrowPathIcon className={`w-4 h-4 ${isBulkSyncing ? 'animate-spin' : ''}`} />
                            {isBulkSyncing ? 'Synchronisation en cours...' : 'Synchroniser Tous les Tickers'}
                          </button>
                        ) : (
                          <p className="text-xs">Allez dans l'onglet "Analysis" et cliquez sur "Synchroniser" pour chaque ticker, ou utilisez "Sync Tous les Tickers" dans la sidebar.</p>
                        )}
                      </div>
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
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
                <span>Mode: <span className="font-semibold">{filters.showOnlyNA ? 'Tickers avec N/A uniquement' : 'Vue normale'}</span></span>
                {filters.showOnlyNA && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {filteredMetrics.length} ticker(s) avec N/A
                  </span>
                )}
                <button
                  onClick={() => setShowGuideDialog(true)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-1 transition-colors"
                  title="Ouvrir le guide complet pour réduire les N/A"
                >
                  <BookOpenIcon className="w-3 h-3" />
                  Guide
                </button>
                <span className="text-xs text-gray-400 hidden sm:inline" title="Raccourcis clavier disponibles">
                  ⌨️ Ctrl+Shift+F: Filtre N/A | Ctrl+Shift+E: Export | Ctrl+Shift+D: Sync critères
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="px-3 py-1 text-xs rounded transition-colors bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-700 flex items-center gap-1"
                    title="⚙️ Configuration Complète : Guardrails, Validation, Ajustements\n\nOuvre le panneau de configuration unifié pour gérer tous les paramètres de l'application.\n\n🛡️ Guardrails (Limites d'affichage):\n• Limites de croissance (min/max pour toutes les métriques)\n• Limites de ratios (P/E, P/CF, P/BV min/max)\n• Multiplicateur maximum raisonnable pour les projections\n• Contrôlent l'affichage des graphiques et tableaux\n• Stockés dans localStorage (navigateur)\n• Affectent uniquement l'affichage, pas les calculs\n\n✅ Validation (Paramètres de sanitisation):\n• Limites de croissance par métrique (EPS, CF, BV, DIV)\n• Limites de ratios cibles (P/E, P/CF, P/BV, Yield)\n• Précision des calculs (décimales)\n• Automatisation de la sanitisation lors de la sync FMP\n• Cohérence des données\n• Stockés dans Supabase (partagés entre utilisateurs)\n• Affectent les calculs et la sauvegarde\n\n📊 Ajustements:\n• Paramètres généraux de l'application\n• Comportement par défaut\n• Options d'affichage\n\n💡 Impact:\n• Les Guardrails affectent l'affichage uniquement\n• La Validation affecte les calculs et la sauvegarde\n• Les changements sont appliqués immédiatement\n• Les paramètres sont persistants (localStorage ou Supabase)"
                  >
                    <Cog6ToothIcon className="w-3 h-3" />
                    Paramètres
                  </button>
                )}
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, showOnlyNA: !prev.showOnlyNA }));
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    filters.showOnlyNA
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-700'
                  }`}
                  title={filters.showOnlyNA 
                    ? "👁️ Afficher tous les tickers\n\nDésactive le filtre N/A pour voir tous les tickers de votre portefeuille et watchlist.\n\n📊 Affichage:\n• Tous les tickers (valides et avec N/A)\n• Métriques complètes pour les tickers valides\n• Indicateurs N/A pour les tickers incomplets\n\n⌨️ Raccourci: Ctrl+Shift+F (Cmd+Shift+F sur Mac)" 
                    : "⚠️ Afficher uniquement les tickers avec N/A\n\nFiltre pour ne voir que les tickers avec des données invalides ou manquantes.\n\n🔍 Utilité:\n• Identifier rapidement les tickers nécessitant une synchronisation\n• Voir quels tickers ont des problèmes de données\n• Faciliter le nettoyage et la maintenance\n• Permet de synchroniser uniquement les tickers problématiques\n\n📊 Indicateurs N/A:\n• Prix actuel invalide ou manquant\n• Données historiques incomplètes\n• Métriques impossibles à calculer\n• Tickers non synchronisés depuis FMP\n\n⌨️ Raccourci: Ctrl+Shift+F (Cmd+Shift+F sur Mac)"}
                  aria-label={filters.showOnlyNA ? "Afficher tous les tickers" : "Afficher uniquement les tickers avec N/A"}
                  aria-pressed={filters.showOnlyNA ? "true" : "false"}
                  tabIndex={0}
                >
                  {filters.showOnlyNA ? 'Afficher Tous' : 'Afficher N/A'}
                </button>
                {filters.showOnlyNA && onSyncNA && filteredMetrics.length > 0 && (
                  <button
                    onClick={() => {
                      const naTickers = filteredMetrics.map(m => m.profile.id);
                      if (confirm(`Synchroniser ${naTickers.length} ticker(s) avec N/A ?\n\nTickers: ${naTickers.slice(0, 10).join(', ')}${naTickers.length > 10 ? `\n... et ${naTickers.length - 10} autres` : ''}`)) {
                        onSyncNA(naTickers);
                      }
                    }}
                    disabled={isBulkSyncing}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition-colors flex items-center gap-1"
                    title={`🔄 Synchroniser uniquement les ${filteredMetrics.length} ticker(s) avec N/A\n\nSynchronise uniquement les tickers affichés (ceux avec des données invalides ou manquantes).\n\n⚡ Avantages:\n• Plus rapide que de synchroniser tous les tickers\n• Cible uniquement les tickers problématiques\n• Économise les appels API FMP\n• Permet de corriger rapidement les données manquantes\n\n📊 Processus:\n• Récupère les données FMP Premium pour chaque ticker\n• Met à jour les données historiques (30 ans)\n• Recalcule les hypothèses automatiquement\n• Préserve les modifications manuelles existantes\n• Sauvegarde un snapshot avant et après la sync\n\n⏱️ Durée:\n• Environ 2-3 secondes par ticker\n• Traitement en batch (3 tickers en parallèle)\n• Barre de progression affichée\n\n💡 Astuce:\n• Utilisez ce bouton après avoir filtré les N/A\n• Plus efficace que 'Sync Warehouse (Deep)' si vous avez beaucoup de tickers`}
                  >
                    <ArrowPathIcon className={`w-3 h-3 ${isBulkSyncing ? 'animate-spin' : ''}`} />
                    Sync N/A ({filteredMetrics.length})
                  </button>
                )}
                <button
                  onClick={async () => {
                    setIsAnalyzingNA(true);
                    setNaAnalysisResult(null);
                    try {
                      const response = await fetch('/api/3p1-sync-na?action=analyze&limit=200');
                      if (!response.ok) {
                        throw new Error(`Erreur API: ${response.status}`);
                      }
                      const result = await response.json();
                      if (result.success) {
                        setNaAnalysisResult({
                          total: result.totalTickers || 0,
                          na: result.naTickers?.length || 0,
                          valid: result.validTickers || 0,
                          errors: result.errorTickers || 0,
                          naTickers: result.naTickers || []
                        });
                        
                        // Si des tickers N/A sont trouvés, proposer de les synchroniser
                        if (result.naTickers && result.naTickers.length > 0 && onSyncNA) {
                          const shouldSync = confirm(
                            `Analyse terminée:\n\n` +
                            `✅ Tickers valides: ${result.validTickers}\n` +
                            `⚠️ Tickers avec N/A: ${result.naTickers.length}\n` +
                            `❌ Erreurs: ${result.errorTickers}\n\n` +
                            `Voulez-vous synchroniser automatiquement les ${result.naTickers.length} tickers avec N/A ?`
                          );
                          
                          if (shouldSync) {
                            onSyncNA(result.naTickers);
                          }
                        } else if (result.naTickers && result.naTickers.length === 0) {
                          alert(`✅ Excellent! Aucun ticker avec N/A trouvé.\n\nTous les ${result.validTickers} tickers ont des données valides.`);
                        }
                      } else {
                        alert(`Erreur: ${result.error || 'Erreur inconnue'}`);
                      }
                    } catch (error: any) {
                      console.error('Erreur analyse N/A:', error);
                      alert(`Erreur lors de l'analyse: ${error.message}`);
                    } finally {
                      setIsAnalyzingNA(false);
                    }
                  }}
                  disabled={isBulkSyncing || isAnalyzingNA}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors flex items-center gap-1"
                  title="🔍 Analyser les tickers avec N/A\n\nAnalyse tous les tickers de votre portefeuille et watchlist pour identifier ceux avec des données invalides ou manquantes.\n\n📊 Résultats de l'analyse:\n• Nombre total de tickers analysés\n• Nombre de tickers valides (données complètes)\n• Nombre de tickers avec N/A (données manquantes)\n• Nombre d'erreurs rencontrées\n• Liste des tickers problématiques\n\n⚡ Fonctionnalités:\n• Analyse rapide via l'API backend\n• Limite de 200 tickers par analyse\n• Propose automatiquement de synchroniser les N/A\n• Affiche un résumé détaillé\n\n💡 Utilisation:\n• Cliquez pour lancer l'analyse\n• Attendez quelques secondes\n• Si des N/A sont trouvés, vous pouvez les synchroniser automatiquement\n• Plus efficace que de vérifier manuellement chaque ticker"
                >
                  <ArrowPathIcon className={`w-3 h-3 ${isAnalyzingNA ? 'animate-spin' : ''}`} />
                  {isAnalyzingNA ? 'Analyse...' : 'Auto-Sync N/A'}
                </button>
                {naAnalysisResult && (
                  <div className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                    {naAnalysisResult.na > 0 ? (
                      <span>⚠️ {naAnalysisResult.na} N/A trouvés</span>
                    ) : (
                      <span>✅ Tous valides</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    const sorted = [...filteredMetrics].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
                    const top10 = sorted.slice(0, 10);
                    // Scroll vers le premier élément (optimisé avec requestAnimationFrame)
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        const firstEl = document.querySelector(`[data-ticker="${top10[0]?.profile.id}"]`);
                        firstEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      });
                    });
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-700 rounded transition-colors"
                  title="Zoom Top 10\n\nFait défiler automatiquement vers les 10 meilleurs tickers (par rendement total projeté).\n\nUtile pour se concentrer rapidement sur les meilleures opportunités."
                >
                  Zoom Top 10
                </button>
              </div>
            </div>
            {/* Vue Grille */}
            {matrixView === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3">
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
                    className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg cursor-pointer transition-all hover:scale-105 sm:hover:scale-110 hover:shadow-xl border-2 ${
                      currentId === metric.profile.id ? 'border-blue-600 ring-4 ring-blue-300 shadow-xl' : 
                      comparisonMode && selectedForComparison.includes(metric.profile.id)
                        ? 'border-purple-600 ring-4 ring-purple-300 shadow-xl' 
                        : 'border-gray-200'
                    } ${getReturnBgClass(metric.totalReturnPercent)} ${currentId === metric.profile.id ? 'opacity-100' : 'opacity-85'}`}
                    title={`${metric.profile.info.name || metric.profile.id}
Rendement: ${metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A (données invalides)' : `${metric.totalReturnPercent.toFixed(1)}%`}
JPEGY: ${metric.jpegy !== null && metric.jpegy !== undefined ? metric.jpegy.toFixed(2) : 'N/A (non calculable)'}
Ratio 3:1: ${metric.hasInvalidData || metric.ratio31 === null || metric.ratio31 === undefined ? 'N/A' : metric.ratio31.toFixed(2)}
P/E: ${metric.currentPE !== null && metric.currentPE !== undefined ? metric.currentPE.toFixed(1) : 'N/A'}x
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
                        {(metric as any)._isLoading ? (
                         <div className="flex flex-col items-center">
                           <ArrowPathIcon className="w-5 h-5 text-white/50 animate-spin mb-1" />
                           <span className="text-[9px] opacity-75">Sync...</span>
                         </div>
                        ) : metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A' : `${metric.totalReturnPercent.toFixed(0)}%`}
                      </div>
                       <div className={`text-[8px] opacity-90 ${(metric as any)._isLoading || metric.hasInvalidData || metric.jpegy === null ? 'opacity-50' : ''}`}>
                        {(metric as any)._isLoading ? (
                          <span className="animate-pulse">Calcul...</span>
                        ) : (
                          <>JPEGY: {metric.jpegy !== null && metric.jpegy !== undefined ? metric.jpegy.toFixed(1) : <span className="text-white/50">N/A</span>}</>
                        )}
                        {!((metric as any)._isLoading) && metric.jpegy === null && <span className="ml-1 text-red-200">⚠️</span>}
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
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm relative transition-colors ${metric.hasInvalidData ? 'bg-red-100' : ''}`}
                      >
                        <div className={`absolute inset-0 rounded-lg ${metric.hasInvalidData ? '' : getReturnBgClass(metric.totalReturnPercent)}`} />
                        <span className="relative z-10">{metric.profile.id}</span>
                        <div className="absolute -top-1 -right-1 z-10">
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
                        <div className={`font-bold text-lg ${(metric as any)._isLoading ? 'text-gray-400' : metric.hasInvalidData ? 'text-gray-400' : getReturnTextClass(metric.totalReturnPercent)}`}>
                          {(metric as any)._isLoading ? (
                            <span className="flex items-center gap-1"><ArrowPathIcon className="w-4 h-4 animate-spin" /> ...</span>
                          ) : metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A' : `${metric.totalReturnPercent.toFixed(1)}%`}
                        </div>
                        <div className="text-xs text-gray-500">Rendement</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold flex items-center justify-end gap-1 ${metric.jpegy === null ? 'text-gray-400' : getJpegyTextClass(metric.jpegy)}`}>
                          {metric.jpegy !== null && metric.jpegy !== undefined ? metric.jpegy.toFixed(2) : 'N/A'}
                          {metric.jpegy === null && <ExclamationTriangleIcon className="w-3 h-3 text-orange-500" title="JPEGY non calculable" />}
                        </div>
                        <div className="text-xs text-gray-500">JPEGY</div>
                        {metric.jpegy !== null && (
                          <div className="mt-1 pt-1 border-t border-gray-200">
                            <div className="text-[9px] text-gray-400 space-y-0.5 text-left">
                              <div><strong>Source:</strong> P/E ÷ (Growth % + Yield %)</div>
                              <div><strong>Fournisseur:</strong> JSLAI™ - Métrique propriétaire ajustant le P/E par croissance et dividende.</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          metric.hasInvalidData ? 'text-gray-400' :
                          metric.ratio31 >= 3 ? 'text-green-600' :
                          metric.ratio31 >= 1 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {metric.hasInvalidData || metric.ratio31 === null || metric.ratio31 === undefined ? 'N/A' : (metric.ratio31 !== null && metric.ratio31 !== undefined ? metric.ratio31.toFixed(2) : 'N/A')}
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
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-1 sm:gap-1.5 md:gap-2">
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
                    } ${metric.hasInvalidData ? 'bg-red-50' : getReturnBgClass(metric.totalReturnPercent)} ${currentId === metric.profile.id ? 'opacity-100' : (metric.hasInvalidData ? 'opacity-60' : 'opacity-80')}`}
                    title={`${metric.profile.id}: ${metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'Données invalides' : `${metric.totalReturnPercent.toFixed(1)}%`}`}
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
                      <div className="text-[8px]">
                        {(metric as any)._isLoading ? <ArrowPathIcon className="w-3 h-3 animate-spin mx-auto" /> : (metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A' : `${metric.totalReturnPercent.toFixed(0)}%`)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
          )}
          </>
        )}
      </div>

      {/* Section Analyse Détaillée (Visible uniquement si un ticker est sélectionné) */}
      {currentId && profiles.find(p => p.id === currentId) && (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-blue-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              <MagnifyingGlassPlusIcon className="w-6 h-6 text-blue-600" />
              Analyse Détaillée : <span className="text-blue-600">{currentId}</span>
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({profiles.find(p => p.id === currentId)?.info?.name || 'Inconnu'})
              </span>
            </h3>
            <button
              onClick={() => toggleSection('detailedAnalysis')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
              title={sectionsVisibility.detailedAnalysis ? "Réduire cette section" : "Agrandir cette section"}
            >
              {sectionsVisibility.detailedAnalysis ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          
          {sectionsVisibility.detailedAnalysis && profiles.find(p => p.id === currentId) && (
            <div className="space-y-6">
              {profiles.find(p => p.id === currentId)?.data && (
                <>
                  <AdditionalMetrics 
                    data={profiles.find(p => p.id === currentId)!.data!} 
                    assumptions={profiles.find(p => p.id === currentId)!.assumptions} 
                    info={profiles.find(p => p.id === currentId)!.info} 
                  />
                  
                  <div className="border-t border-gray-200 pt-6">
                    <EvaluationDetails
                      data={profiles.find(p => p.id === currentId)!.data!}
                      assumptions={profiles.find(p => p.id === currentId)!.assumptions}
                      info={profiles.find(p => p.id === currentId)!.info}
                      sector={profiles.find(p => p.id === currentId)!.info.sector}
                      onUpdateAssumption={(key, value) => {
                        const profile = profiles.find(p => p.id === currentId);
                        if (profile && onUpdateProfile) {
                          const updatedProfile = {
                            ...profile,
                            assumptions: {
                              ...profile.assumptions,
                              [key]: value
                            }
                          };
                          onUpdateProfile(profile.id, updatedProfile);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Graphique X/Y Amélioré */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📊 Positionnement JPEGY vs Rendement Total</h3>
            <button
              onClick={() => toggleSection('scatterPlot')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
              title={sectionsVisibility.scatterPlot ? "Réduire cette section" : "Agrandir cette section"}
            >
              {sectionsVisibility.scatterPlot ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {filteredMetrics.length} titre(s) affiché(s)
            </div>
            {/* Contrôles de zoom et pan */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
              <button
                onClick={() => {
                  setZoomJPEGY(prev => Math.min(prev * 1.2, 5));
                  setPanJPEGY({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title="Zoomer (x1.2)"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  setZoomJPEGY(prev => Math.max(prev / 1.2, 0.5));
                  setPanJPEGY({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title="Dézoomer (÷1.2)"
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  setZoomJPEGY(1);
                  setPanJPEGY({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title="Réinitialiser la vue"
              >
                <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        {sectionsVisibility.scatterPlot && (
          <>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre à afficher sur le graphique.
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg">
            <div className="w-full" style={{ minWidth: '100%' }}>
              <svg 
                ref={svgJPEGYRef}
                width={chartWidth} 
                height={chartHeight} 
                className="border border-gray-300 rounded bg-white w-full max-w-full cursor-move" 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                preserveAspectRatio="xMidYMid meet"
                onMouseDown={(e) => {
                  if (e.button === 0 && !e.target || (e.target as Element).tagName !== 'circle') { // Clic gauche seulement, pas sur un point
                    setIsPanningJPEGY(true);
                    setPanStartJPEGY({ 
                      x: e.clientX - panJPEGY.x, 
                      y: e.clientY - panJPEGY.y 
                    });
                  }
                }}
                onMouseMove={(e) => {
                  if (isPanningJPEGY) {
                    setPanJPEGY({
                      x: e.clientX - panStartJPEGY.x,
                      y: e.clientY - panStartJPEGY.y
                    });
                  }
                }}
                onMouseUp={() => setIsPanningJPEGY(false)}
                onMouseLeave={() => setIsPanningJPEGY(false)}
              >
                <g transform={`translate(${panJPEGY.x}, ${panJPEGY.y}) scale(${zoomJPEGY})`}>
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
                    {tick.value !== null && tick.value !== undefined ? tick.value.toFixed(1) : 'N/A'}
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
                    {tick.value !== null && tick.value !== undefined ? tick.value.toFixed(0) : 'N/A'}%
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
              
              {/* Note explicative JPEGY sous le graphique */}
              <g transform={`translate(${chartWidth / 2}, ${chartHeight - 5})`}>
                <text 
                  x={0} 
                  y={0} 
                  textAnchor="middle" 
                  className="text-[9px] fill-gray-500"
                >
                  JPEGY = P/E ÷ (Growth % + Yield %) | Source: JSLAI™ (Jean-Sébastien)
                </text>
              </g>
              
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
                  // Exclure les points avec JPEGY null ou valeurs aberrantes
                  if (metric.jpegy === null || 
                      metric.totalReturnPercent > 1000 || metric.totalReturnPercent < -100 || 
                      metric.jpegy > 100 || metric.jpegy < 0 || 
                      !isFinite(metric.totalReturnPercent) || !isFinite(metric.jpegy)) {
                    return null; // Ne pas afficher ce point
                  }
                  
                  const x = xScale(metric.jpegy);
                  const y = yScale(metric.totalReturnPercent);
                  const jpegyColor = getJpegyColor(metric.jpegy);
                  return (
                    <g key={metric.profile.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={currentId === metric.profile.id ? 8 : 6}
                        fill={jpegyColor || '#9ca3af'}
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
                </g>
              </svg>
            </div>
            {/* Note explicative JPEGY sous le graphique */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-700 space-y-1">
                <div className="font-semibold mb-1">📊 À propos de JPEGY :</div>
                <div><strong>Source de calcul:</strong> P/E Actuel ÷ (Taux de croissance EPS % + Rendement dividende %)</div>
                <div><strong>Formule:</strong> JPEGY = Prix Actuel / BPA ÷ (Taux de croissance annuel des bénéfices % + Rendement du dividende %)</div>
                <div><strong>Fournisseur:</strong> Métrique propriétaire JSLAI™ développée par Jean-Sébastien. Le fournisseur établit cette métrique en ajustant le ratio P/E traditionnel par la somme du taux de croissance des bénéfices et du rendement du dividende, permettant une évaluation plus nuancée de la valorisation d'une action en tenant compte de sa capacité de croissance et de sa distribution de dividendes. Plus le ratio est bas, plus l'action est attractive.</div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Graphique X/Y Ratio 3:1 vs Rendement Total */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📊 Positionnement Ratio 3:1 vs Rendement Total</h3>
            <button
              onClick={() => toggleSection('scatterPlotRatio31')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
              title={sectionsVisibility.scatterPlotRatio31 ? "Réduire cette section" : "Agrandir cette section"}
            >
              {sectionsVisibility.scatterPlotRatio31 ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {filteredMetrics.length} titre(s) affiché(s)
            </div>
            {/* Contrôles de zoom et pan */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
              <button
                onClick={() => {
                  setZoomRatio31(prev => Math.min(prev * 1.2, 5));
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title="Zoomer (x1.2)\n\nUtilisez aussi la molette de la souris pour zoomer vers le point de la souris."
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  setZoomRatio31(prev => Math.max(prev / 1.2, 0.5));
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title="Dézoomer (÷1.2)\n\nUtilisez aussi la molette de la souris pour dézoomer."
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  setZoomRatio31(1);
                  setPanRatio31({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title="Réinitialiser la vue"
              >
                <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        {sectionsVisibility.scatterPlotRatio31 && (
          <>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre à afficher sur le graphique.
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg">
            <div className="w-full" style={{ minWidth: '100%' }}>
              {(() => {
                // Calculer les échelles pour Ratio 3:1
                const validMetricsForRatio31Chart = filteredMetrics.filter(m => 
                  !m.hasInvalidData && 
                  m.totalReturnPercent >= -100 && m.totalReturnPercent <= 1000 &&
                  m.ratio31 >= 0 && m.ratio31 <= 100 &&
                  isFinite(m.totalReturnPercent) && isFinite(m.ratio31)
                );
                
                const maxRatio31 = validMetricsForRatio31Chart.length > 0 
                  ? Math.max(...validMetricsForRatio31Chart.map(m => m.ratio31).filter((r): r is number => r !== null && r !== undefined && isFinite(r)), 10)
                  : 10;
                const minRatio31 = validMetricsForRatio31Chart.length > 0
                  ? Math.min(...validMetricsForRatio31Chart.map(m => m.ratio31).filter((r): r is number => r !== null && r !== undefined && isFinite(r)), 0)
                  : 0;
                const maxReturnRatio31 = validMetricsForRatio31Chart.length > 0
                  ? Math.max(...validMetricsForRatio31Chart.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined && isFinite(r)), 200)
                  : 200;
                const minReturnRatio31 = validMetricsForRatio31Chart.length > 0
                  ? Math.min(...validMetricsForRatio31Chart.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined && isFinite(r)), -50)
                  : -50;
                
                const xScaleRatio31 = (ratio: number) => {
                  const range = maxRatio31 - minRatio31 || 1;
                  return padding + ((ratio - minRatio31) / range) * (chartWidth - 2 * padding);
                };
                
                const yScaleRatio31 = (returnPercent: number) => {
                  const range = maxReturnRatio31 - minReturnRatio31 || 1;
                  return chartHeight - padding - (((returnPercent - minReturnRatio31) / range) * (chartHeight - 2 * padding));
                };
                
                // Générer les ticks pour les axes Ratio 3:1
                const xTicksRatio31 = [];
                const xTickCountRatio31 = 10;
                for (let i = 0; i <= xTickCountRatio31; i++) {
                  const value = minRatio31 + (maxRatio31 - minRatio31) * (i / xTickCountRatio31);
                  xTicksRatio31.push({ value, position: xScaleRatio31(value) });
                }
                
                const yTicksRatio31 = [];
                const yTickCountRatio31 = 10;
                for (let i = 0; i <= yTickCountRatio31; i++) {
                  const value = minReturnRatio31 + (maxReturnRatio31 - minReturnRatio31) * (i / yTickCountRatio31);
                  yTicksRatio31.push({ value, position: yScaleRatio31(value) });
                }
                
                return (
                  <svg 
                    ref={svgRatio31Ref}
                    width={chartWidth} 
                    height={chartHeight} 
                    className="border border-gray-300 rounded bg-white w-full max-w-full cursor-move" 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    preserveAspectRatio="xMidYMid meet"
                    onMouseDown={(e) => {
                      if (e.button === 0 && !e.target || (e.target as Element).tagName !== 'circle') { // Clic gauche seulement, pas sur un point
                        setIsPanningRatio31(true);
                        setPanStartRatio31({ 
                          x: e.clientX - panRatio31.x, 
                          y: e.clientY - panRatio31.y 
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isPanningRatio31) {
                        setPanRatio31({
                          x: e.clientX - panStartRatio31.x,
                          y: e.clientY - panStartRatio31.y
                        });
                      }
                    }}
                    onMouseUp={() => setIsPanningRatio31(false)}
                    onMouseLeave={() => setIsPanningRatio31(false)}
                  >
                    <g transform={`translate(${panRatio31.x}, ${panRatio31.y}) scale(${zoomRatio31})`}>
                    {/* Grille de fond */}
                    {xTicksRatio31.map((tick, i) => (
                      <line
                        key={`x-grid-ratio31-${i}`}
                        x1={tick.position}
                        y1={padding}
                        x2={tick.position}
                        y2={chartHeight - padding}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    ))}
                    {yTicksRatio31.map((tick, i) => (
                      <line
                        key={`y-grid-ratio31-${i}`}
                        x1={padding}
                        y1={tick.position}
                        x2={chartWidth - padding}
                        y2={tick.position}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    ))}
                    
                    {/* Ligne de référence à 3:1 */}
                    {maxRatio31 >= 3 && minRatio31 <= 3 && (
                      <line
                        x1={xScaleRatio31(3)}
                        y1={padding}
                        x2={xScaleRatio31(3)}
                        y2={chartHeight - padding}
                        stroke="#16a34a"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                      />
                    )}
                    
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
                    {xTicksRatio31.map((tick, i) => (
                      <g key={`x-tick-ratio31-${i}`}>
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
                          {tick.value !== null && tick.value !== undefined ? tick.value.toFixed(1) : 'N/A'}:1
                        </text>
                      </g>
                    ))}
                    
                    {/* Ticks et Labels sur l'axe Y */}
                    {yTicksRatio31.map((tick, i) => (
                      <g key={`y-tick-ratio31-${i}`}>
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
                          {tick.value !== null && tick.value !== undefined ? tick.value.toFixed(0) : 'N/A'}%
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
                      Ratio 3:1 (Potentiel de Hausse vs Risque de Baisse)
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
                    
                    {/* Note explicative Ratio 3:1 sous le graphique */}
                    <g transform={`translate(${chartWidth / 2}, ${chartHeight - 5})`}>
                      <text 
                        x={0} 
                        y={0} 
                        textAnchor="middle" 
                        className="text-[9px] fill-gray-500"
                      >
                        Ratio 3:1 = Potentiel de Hausse (%) ÷ Risque de Baisse (%) | Source: JSLAI™
                      </text>
                    </g>
                    
                    {/* Légende Ratio 3:1 */}
                    <g transform={`translate(${chartWidth - 200}, ${padding + 20})`}>
                      <text x={0} y={0} className="text-xs font-semibold fill-gray-700">Légende Ratio 3:1:</text>
                      {[
                        { label: 'Favorable (≥3:1)', color: '#16a34a' },
                        { label: 'Acceptable (1:1-3:1)', color: '#eab308' },
                        { label: 'Défavorable (<1:1)', color: '#dc2626' }
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
                        // Validation supplémentaire: exclure les valeurs aberrantes
                        if (metric.ratio31 < 0 || metric.ratio31 > 100 || 
                            metric.totalReturnPercent > 1000 || metric.totalReturnPercent < -100 || 
                            !isFinite(metric.totalReturnPercent) || !isFinite(metric.ratio31)) {
                          return null; // Ne pas afficher ce point
                        }
                        
                        const x = xScaleRatio31(metric.ratio31);
                        const y = yScaleRatio31(metric.totalReturnPercent);
                        const ratio31Color = getRatio31Color(metric.ratio31);
                        return (
                          <g key={`ratio31-${metric.profile.id}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r={currentId === metric.profile.id ? 8 : 6}
                              className={`cursor-pointer hover:r-8 ${getRatioFillClass(metric.ratio31)}`}
                              stroke={currentId === metric.profile.id ? '#2563eb' : '#fff'}
                              strokeWidth={currentId === metric.profile.id ? 2 : 1}
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
                    </g>
                  </svg>
                );
              })()}
            </div>
            {/* Note explicative Ratio 3:1 sous le graphique */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-700 space-y-1">
                <div className="font-semibold mb-1">📊 À propos du Ratio 3:1 :</div>
                <div><strong>Source de calcul:</strong> Potentiel de Hausse (%) ÷ Risque de Baisse (%)</div>
                <div><strong>Formule:</strong> Ratio 3:1 = ((Prix Projeté - Prix Actuel) / Prix Actuel × 100) ÷ ((Prix Actuel - Prix Plancher) / Prix Actuel × 100)</div>
                <div><strong>Fournisseur:</strong> Métrique propriétaire JSLAI™ développée par Jean-Sébastien. Le fournisseur établit cette métrique en comparant le potentiel de hausse (gain potentiel si le prix atteint le prix projeté) au risque de baisse (perte potentielle jusqu'au prix plancher historique). Un ratio ≥ 3:1 indique que le potentiel de hausse est au moins 3 fois supérieur au risque de baisse, ce qui représente un bon rapport risque/rendement.</div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Graphique de Distribution des Rendements */}
      {filteredMetrics.length > 0 && (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📊 Distribution des Rendements Totaux</h3>
              <button
                onClick={() => toggleSection('returnDistribution')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title={sectionsVisibility.returnDistribution ? "Réduire cette section" : "Agrandir cette section"}
              >
                {sectionsVisibility.returnDistribution ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          {sectionsVisibility.returnDistribution && (
            <>
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
              
              return bins.map((bin, idx) => {
                  const barHeightStyle: React.CSSProperties = {
                      height: `${(bin.count / maxCount) * 240}px`,
                      minHeight: bin.count > 0 ? '4px' : '0px'
                  };
                  return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer"
                      style={barHeightStyle}
                    title={`${bin.min !== null && bin.min !== undefined ? bin.min.toFixed(0) : 'N/A'}% - ${bin.max !== null && bin.max !== undefined ? bin.max.toFixed(0) : 'N/A'}%: ${bin.count} titre(s)`}
                  />
                  {idx % 3 === 0 && (
                    <span className="text-[8px] text-gray-500 mt-1">{bin.min !== null && bin.min !== undefined ? bin.min.toFixed(0) : 'N/A'}%</span>
                  )}
                </div>
                  );
              });
            })()}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {filteredMetrics.length} titre(s) | Range: {
              filteredMetrics.length > 0 
                ? (() => {
                    const validReturns = filteredMetrics.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined);
                    if (validReturns.length === 0) return 'N/A';
                    return `${(Math.min(...validReturns) ?? 0).toFixed(0)}% à ${(Math.max(...validReturns) ?? 0).toFixed(0)}%`;
                  })()
                : 'N/A'
            }
          </div>
            </>
          )}
        </div>
      )}

      {/* 5 Autres Idées de Visualisation */}
      {filteredMetrics.length > 0 && (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📈 Visualisations Avancées</h3>
              <button
                onClick={() => toggleSection('otherVisualizations')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title={sectionsVisibility.otherVisualizations ? "Réduire cette section" : "Agrandir cette section"}
              >
                {sectionsVisibility.otherVisualizations ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          {sectionsVisibility.otherVisualizations && (
            <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                const validReturns = sectorMetrics.map(m => m.totalReturnPercent).filter((r): r is number => r !== null && r !== undefined && isFinite(r));
                const avgReturn = validReturns.length > 0 ? validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length : 0;
                const validJPEGY = sectorMetrics.filter(m => m.jpegy !== null && m.jpegy !== undefined && isFinite(m.jpegy)).map(m => m.jpegy!);
                const avgJPEGY = validJPEGY.length > 0 ? validJPEGY.reduce((sum, j) => sum + j, 0) / validJPEGY.length : null;
                const validRatios = sectorMetrics.map(m => m.ratio31).filter((r): r is number => r !== null && r !== undefined && isFinite(r));
                const avgRatio31 = validRatios.length > 0 ? validRatios.reduce((sum, r) => sum + r, 0) / validRatios.length : 0;
                return { sector, avgReturn, avgJPEGY, avgRatio31, count: sectorMetrics.length };
              })
              .sort((a, b) => b.avgReturn - a.avgReturn)
              .map(({ sector, avgReturn, avgJPEGY, avgRatio31, count }) => {
                const barWidthStyle: React.CSSProperties = {
                  width: `${Math.min(Math.max((avgReturn + 50) / 200 * 100, 0), 100)}%`
                };
                return (
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
                                className={`h-full ${getReturnBgClass(avgReturn)}`}
                                style={barWidthStyle}
                              />
                            </div>
                        <span className={`text-xs font-bold w-16 text-right ${
                          avgReturn >= 50 ? 'text-green-600' :
                          avgReturn >= 20 ? 'text-green-500' :
                          avgReturn >= 0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {avgReturn !== null && avgReturn !== undefined && isFinite(avgReturn) ? avgReturn.toFixed(1) : 'N/A'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">JPEGY moyen:</span>
                      {avgJPEGY !== null ? (
                        <span 
                          className={`text-xs font-semibold px-2 py-0.5 rounded text-white ${getJpegyBgClass(avgJPEGY)}`}
                        >
                          {avgJPEGY?.toFixed(2) ?? 'N/A'}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-400 text-white flex items-center gap-1">
                          N/A <ExclamationTriangleIcon className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Ratio 3:1 moyen:</span>
                      <span className={`text-xs font-semibold ${
                        (avgRatio31 != null && avgRatio31 >= 3) ? 'text-green-600' :
                        (avgRatio31 != null && avgRatio31 >= 1) ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(avgRatio31 != null && isFinite(avgRatio31)) ? avgRatio31.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
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
              .filter(m => !m.hasInvalidData) // Exclure les données invalides du Top 5
              .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
              .slice(0, 5)
              .map((metric, idx) => (
                <div key={metric.profile.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-50 to-white rounded border-l-4 border-yellow-400">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-yellow-600">#{idx + 1}</span>
                    <span className="font-semibold">{metric.profile.id}</span>
                  </div>
                  <span className={`text-sm font-bold ${metric.hasInvalidData ? 'text-gray-400' : 'text-green-600'}`}>
                    {metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A' : `${metric.totalReturnPercent.toFixed(1)}%`}
                  </span>
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
                      style={{
                        height: `${(count / maxCount) * 100}%`,
                        minHeight: '10px'
                      }}
                      className={`w-full rounded-t cursor-pointer hover:opacity-80 transition-opacity ${
                        idx === 0 ? 'bg-green-300' : idx === 1 ? 'bg-yellow-500' : 'bg-red-600'
                      }`}
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
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200 md:col-span-2">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">📈 Timeline de Performance (Triée par Rendement)</h3>
          <div className="text-xs text-gray-500 mb-3">
            Barres horizontales classées par rendement décroissant
          </div>
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <div className="flex gap-1.5 sm:gap-2 min-w-max pb-2">
              {filteredMetrics
                .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
                .map((metric) => {
                    const timelineBarStyle: React.CSSProperties = {
                        height: `${Math.max(Math.min((metric.totalReturnPercent + 50) / 200 * 100, 100), 5)}px`,
                        minHeight: '15px'
                    };
                    return (
                    <div
                      key={metric.profile.id}
                      className="flex flex-col items-center p-1.5 sm:p-2 bg-gray-50 rounded min-w-[60px] sm:min-w-[70px] md:min-w-[80px] cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => onSelect(metric.profile.id)}
                    >
                      <div className="text-[10px] sm:text-xs font-bold mb-1 truncate w-full text-center">{metric.profile.id}</div>
                      <div
                        className={`w-full rounded mb-1 ${getReturnBgClass(metric.totalReturnPercent)}`}
                        style={timelineBarStyle}
                      />
                    <div className={`text-[9px] sm:text-xs font-semibold ${metric.hasInvalidData ? 'text-gray-400' : getReturnTextClass(metric.totalReturnPercent)}`}>
                      {metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A' : `${metric.totalReturnPercent.toFixed(0)}%`}
                    </div>
                  </div>
                    );
                })}
            </div>
          </div>
        </div>
        </div>
            </>
          )}
        </div>
      )}

      {/* Matrice de Corrélation */}
      {filteredMetrics.length > 1 && (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">🔗 Matrice de Corrélation entre Métriques</h3>
              <button
                onClick={() => toggleSection('correlationMatrix')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
                title={sectionsVisibility.correlationMatrix ? "Réduire cette section" : "Agrandir cette section"}
              >
                {sectionsVisibility.correlationMatrix ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          {sectionsVisibility.correlationMatrix && (
            <>
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
                        const cellStyle: React.CSSProperties = { backgroundColor: color, color: intensity > 0.5 ? 'white' : 'black' };
                        return (
                          <td 
                            key={otherMetric} 
                            className="p-2 text-center font-semibold"
                            style={cellStyle}
                            title={`Corrélation: ${corr?.toFixed(3) ?? '0.000'}`}
                          >
                            {corr?.toFixed(2) ?? '0.00'}
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
            </>
          )}
        </div>
      )}

      {/* Tableau détaillé Amélioré */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">📋 Tableau de Performance Détaillé</h3>
            <button
              onClick={() => toggleSection('detailedTable')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-help"
              title={sectionsVisibility.detailedTable ? "Réduire cette section" : "Agrandir cette section"}
            >
              {sectionsVisibility.detailedTable ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
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
        {sectionsVisibility.detailedTable && (
          <>
        {filteredMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun titre ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-xs sm:text-sm" style={{ minWidth: '100%' }}>
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0">
                <tr>
                  <th 
                    className="p-2 sm:p-3 text-left font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors text-xs sm:text-sm"
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
                    className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors text-xs sm:text-sm" 
                    title="JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield) - Source: P/E Actuel ÷ (Taux de croissance EPS % + Rendement dividende %) - Fournisseur: Métrique propriétaire JSLAI™ développée par Jean-Sébastien. Ajuste le ratio P/E traditionnel par la somme du taux de croissance des bénéfices et du rendement du dividende, permettant une évaluation plus nuancée de la valorisation d'une action."
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
                    className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors text-xs sm:text-sm" 
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
                    className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors text-xs sm:text-sm" 
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
                  <th className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 text-xs sm:text-sm hidden md:table-cell" title="Potentiel de hausse en %">Hausse</th>
                  <th className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 text-xs sm:text-sm hidden md:table-cell" title="Risque de baisse en %">Baisse</th>
                  <th className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 text-xs sm:text-sm hidden lg:table-cell" title="Ratio cours/bénéfice actuel">P/E</th>
                  <th className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 text-xs sm:text-sm hidden lg:table-cell" title="Rendement du dividende">Yield</th>
                  <th 
                    className="p-2 sm:p-3 text-right font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors text-xs sm:text-sm hidden lg:table-cell" 
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
                  <th className="p-2 sm:p-3 text-center font-bold text-gray-700 border-b border-gray-300 text-xs sm:text-sm">Approuvé</th>
                  <th 
                    className="p-2 sm:p-3 text-center font-bold text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors text-xs sm:text-sm"
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
                  <td className="p-2 sm:p-3 font-bold text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="truncate">{metric.profile.id}</span>
                      {(metric.profile.isWatchlist ?? false) ? (
                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" title="Watchlist" />
                      ) : (
                        <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" title="Portefeuille" />
                      )}
                    </div>
                  </td>
                  <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">
                    {metric._isLoading ? (
                      <div className="flex items-center justify-end gap-1 text-gray-400">
                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">Chargement...</span>
                      </div>
                    ) : metric.jpegy !== null ? (
                      <div className="group relative">
                        <div className="flex items-center justify-end">
                          <span
                            className={`inline-block w-4 h-4 rounded-full mr-2 ${getJpegyBgClass(metric.jpegy)}`}
                          />
                          {metric.jpegy?.toFixed(2) ?? 'N/A'}
                        </div>
                        <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          <div className="font-semibold mb-1">JPEGY: {metric.jpegy?.toFixed(2) ?? 'N/A'}</div>
                          <div className="space-y-1 text-[10px]">
                            <div><strong>Source de calcul:</strong> P/E Actuel ÷ (Taux de croissance EPS % + Rendement dividende %)</div>
                            <div><strong>Formule:</strong> JPEGY = {metric.currentPE?.toFixed(2) ?? 'P/E'} ÷ ({metric.historicalGrowth?.toFixed(1) ?? 'Growth'}% + {metric.currentYield?.toFixed(2) ?? 'Yield'}%)</div>
                            <div><strong>Fournisseur:</strong> Métrique propriétaire JSLAI™ développée par Jean-Sébastien. Le fournisseur établit cette métrique en ajustant le ratio P/E traditionnel par la somme du taux de croissance des bénéfices et du rendement du dividende, permettant une évaluation plus nuancée de la valorisation d'une action en tenant compte de sa capacité de croissance et de sa distribution de dividendes.</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 flex items-center justify-end gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" title="JPEGY non calculable: EPS invalide ou (Growth + Yield) ≤ 0.01%" />
                        N/A
                      </span>
                    )}
                  </td>
                  <td className={`p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm ${
                    metric._isLoading || metric.hasInvalidData ? 'text-gray-400' : getReturnTextClass(metric.totalReturnPercent)
                  }`}>
                    {metric._isLoading ? (
                      <div className="flex items-center justify-end gap-1 text-gray-400">
                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">...</span>
                      </div>
                    ) : metric.hasInvalidData || metric.totalReturnPercent === null || metric.totalReturnPercent === undefined ? 'N/A' : `${metric.totalReturnPercent.toFixed(1)}%`}
                  </td>
                  <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">
                    {metric._isLoading ? (
                      <div className="flex items-center justify-end gap-1 text-gray-400">
                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">...</span>
                      </div>
                    ) : (metric.ratio31 !== null && metric.ratio31 !== undefined) ? metric.ratio31.toFixed(2) : 'N/A'}
                  </td>
                  <td className={`p-2 sm:p-3 text-right text-green-600 text-xs sm:text-sm ${!displayOptions.visibleColumns.upside ? 'hidden' : ''} ${displayOptions.density === 'compact' ? 'hidden md:table-cell' : 'md:table-cell'}`}>
                    {metric._isLoading ? (
                      <div className="flex items-center justify-end gap-1 text-gray-400">
                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">...</span>
                      </div>
                    ) : (metric.upsidePotential !== null && metric.upsidePotential !== undefined) ? `${metric.upsidePotential.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className={`p-2 sm:p-3 text-right text-red-600 text-xs sm:text-sm ${!displayOptions.visibleColumns.downside ? 'hidden' : ''} ${displayOptions.density === 'compact' ? 'hidden md:table-cell' : 'md:table-cell'}`}>
                    {metric._isLoading ? (
                      <div className="flex items-center justify-end gap-1 text-gray-400">
                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">...</span>
                      </div>
                    ) : (metric.downsideRisk !== null && metric.downsideRisk !== undefined) ? `${metric.downsideRisk.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className={`p-2 sm:p-3 text-center ${!displayOptions.visibleColumns.pe ? 'hidden' : ''} ${displayOptions.density === 'compact' ? 'hidden lg:table-cell' : 'lg:table-cell'}`}>
                    <span className="text-xs sm:text-sm">{metric.currentPE?.toFixed(1) ?? 'N/A'}x</span>
                  </td>
                  <td className={`p-2 sm:p-3 text-center ${!displayOptions.visibleColumns.yield ? 'hidden' : ''} ${displayOptions.density === 'compact' ? 'hidden lg:table-cell' : 'lg:table-cell'}`}>
                    <span className="text-xs sm:text-sm">{metric.currentYield?.toFixed(2) ?? 'N/A'}%</span>
                  </td>
                  <td className={`p-2 sm:p-3 text-right text-xs sm:text-sm ${!displayOptions.visibleColumns.growth ? 'hidden' : ''} ${displayOptions.density === 'compact' ? 'hidden lg:table-cell' : 'lg:table-cell'}`}>
                    {metric.historicalGrowth?.toFixed(1) ?? 'N/A'}%
                  </td>
                  <td className={`p-2 sm:p-3 text-right text-xs sm:text-sm ${!displayOptions.visibleColumns.volatility ? 'hidden' : ''} hidden xl:table-cell`}>
                    {metric.volatility?.toFixed(1) ?? 'N/A'}%
                  </td>
                  <td className={`p-2 sm:p-3 text-center ${!displayOptions.visibleColumns.approved ? 'hidden' : ''}`}>
                    {metric.hasApprovedVersion ? (
                      <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">
                    <span className="hidden sm:inline">
                      <StatusBadge 
                        type="recommendation" 
                        value={metric.recommendation} 
                        className="font-semibold"
                      />
                    </span>
                    <span className="sm:hidden">
                      <StatusBadge 
                        type="recommendation" 
                        value={metric.recommendation === 'ACHAT' || metric.recommendation === 'BUY' ? 'A' : 
                               metric.recommendation === 'VENTE' || metric.recommendation === 'SELL' ? 'V' : 'C'} 
                        className="font-semibold text-xs"
                      />
                    </span>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </div>

      {/* Dialog de sélection de synchronisation */}
      <SyncSelectionDialog
        isOpen={showSyncDialog}
        profiles={profiles}
        onClose={() => setShowSyncDialog(false)}
        onConfirm={(tickers) => {
          setShowSyncDialog(false);
          if (onSyncNA) {
            onSyncNA(tickers);
          }
        }}
        isSyncing={isBulkSyncing}
      />

      {/* Dialog du guide */}
      <GuideDialog
        isOpen={showGuideDialog}
        onClose={() => setShowGuideDialog(false)}
      />
    </div>
  );
};

