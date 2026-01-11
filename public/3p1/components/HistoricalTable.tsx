import React, { useState, useEffect, useMemo } from 'react';
import { AnnualData } from '../types';
import { calculateRowRatios } from '../utils/calculations';
import { DataColorLegend } from './DataColorLegend';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface HistoricalTableProps {
  data: AnnualData[];
  onUpdateRow: (index: number, field: keyof AnnualData, value: number) => void;
}

// Helper component for buffered input to prevent excessive undo states
const EditableCell: React.FC<{
  value: number;
  onCommit: (val: number) => void;
  min?: number;
  id: string; // Added ID for navigation
  autoFetched?: boolean; // Deprecated, use dataSource instead
  dataSource?: 'fmp-verified' | 'fmp-adjusted' | 'manual' | 'calculated'; // Source de la donnée
  isOutlier?: boolean; // Indique si la valeur est aberrante
}> = ({ value, onCommit, min = -Infinity, id, autoFetched = false, dataSource, isOutlier = false }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  // Déterminer la source : priorité à dataSource, sinon fallback sur autoFetched
  const actualDataSource = dataSource || (autoFetched ? 'fmp-adjusted' : 'manual');
  const [currentDataSource, setCurrentDataSource] = useState(actualDataSource);

  // Sync local state if external value changes (e.g. via undo/redo)
  useEffect(() => {
    setLocalValue(value.toString());
    const newDataSource = dataSource || (autoFetched ? 'fmp-adjusted' : 'manual');
    setCurrentDataSource(newDataSource);
  }, [value, autoFetched, dataSource]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    // Marquer comme manuel lors de l'édition
    if (currentDataSource !== 'manual') {
      setCurrentDataSource('manual');
    }
  };

  const handleBlur = () => {
    if (localValue === '') {
      onCommit(0);
      return;
    }
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      if (min !== -Infinity && num < min) {
        setLocalValue(value.toString()); // Revert if invalid
        return;
      }
      if (num !== value) {
        onCommit(num);
      }
    } else {
      setLocalValue(value.toString()); // Revert if NaN
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const parts = id.split('-'); // format: input-field-index
      if (parts.length === 3) {
        const field = parts[1];
        const currentIndex = parseInt(parts[2]);
        const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        const targetId = `input-${field}-${nextIndex}`;
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.focus();
      }
    }
  };

  // Conditional styling basé sur dataSource et outliers
  const baseClass = "w-full text-right focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 sm:px-1 outline-none transition-colors invalid:text-red-500 invalid:bg-red-50 text-xs sm:text-sm relative";
  
  let sourceClass = "bg-transparent"; // Par défaut : blanc (données manuelles ou non spécifiées)
  let tooltipText = "Données manuelles\n\nFond blanc = valeur modifiée manuellement.\n\nLes modifications manuelles sont préservées lors de la synchronisation.";
  
  // ⚠️ PRIORITÉ AUX OUTLIERS : Si la valeur est aberrante, appliquer le style d'alerte
  if (isOutlier) {
    sourceClass = "bg-red-100 text-red-800 font-bold border-2 border-red-400 border-dashed";
    tooltipText = "⚠️ VALEUR ABERRANTE DÉTECTÉE\n\nCette valeur est significativement différente de la moyenne historique (> 2 écarts-types).\n\nCela peut indiquer:\n• Une erreur de données\n• Un événement exceptionnel (restructuration, acquisition, etc.)\n• Des données incomplètes ou corrompues\n\nVérifiez cette valeur et corrigez-la si nécessaire.";
  } else if (currentDataSource === 'fmp-verified') {
    // ✅ VERT : Données FMP vérifiées directement (non modifiées)
    sourceClass = "bg-green-50 text-green-700 font-medium";
    tooltipText = "✅ Données FMP vérifiées\n\nFond VERT = données récupérées directement depuis l'API FMP, non modifiées.\n\nCes données sont les seules considérées comme \"officielles\" et vérifiées.\n\nCliquez pour modifier manuellement. La modification marquera cette valeur comme manuelle (fond orange).";
  } else if (currentDataSource === 'fmp-adjusted') {
    // 🔵 BLEU : Données FMP mais ajustées/mergées
    sourceClass = "bg-blue-50 text-blue-700 font-medium";
    tooltipText = "🔵 Données FMP ajustées\n\nFond BLEU = données provenant de FMP mais ajustées/mergées avec des valeurs existantes.\n\nCes données ne sont pas 100% vérifiées car elles ont été modifiées lors du merge.\n\nCliquez pour modifier manuellement. La modification marquera cette valeur comme manuelle (fond orange).";
  } else if (currentDataSource === 'manual') {
    // 🟠 ORANGE : Données manuelles
    sourceClass = "bg-orange-50 text-orange-700 font-medium";
    tooltipText = "🟠 Données manuelles\n\nFond ORANGE = valeur modifiée manuellement.\n\nLes modifications manuelles sont préservées lors de la synchronisation.";
  } else if (currentDataSource === 'calculated') {
    // ⚪ GRIS : Données calculées
    sourceClass = "bg-gray-50 text-gray-700 font-medium";
    tooltipText = "⚪ Données calculées\n\nFond GRIS = valeur calculée automatiquement.\n\nCes données ne proviennent pas directement de FMP.";
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        step="0.01"
        min={min !== -Infinity ? min : undefined}
        className={`${baseClass} ${sourceClass}`}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        title={tooltipText}
      />
      {isOutlier && (
        <ExclamationTriangleIcon 
          className="absolute -top-1 -right-1 w-3 h-3 text-red-600 bg-white rounded-full p-0.5" 
          title="Valeur aberrante détectée"
        />
      )}
    </div>
  );
};

/**
 * Détecte les valeurs aberrantes dans une série de données
 * Utilise l'écart-type pour identifier les outliers (> 2 écarts-types de la moyenne)
 * ✅ CRITIQUE : Ignore complètement les valeurs manquantes, nulles, ou à zéro
 */
function detectOutlierValues(values: number[]): Set<number> {
  // Filtrer strictement : seulement les valeurs valides, positives, et finies
  const validValues = values.filter(v => 
    v != null && 
    v !== undefined && 
    isFinite(v) && 
    !isNaN(v) && 
    v > 0
  );
  
  // Besoin d'au moins 3 valeurs valides pour calculer des statistiques significatives
  if (validValues.length < 3) return new Set();
  
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);
  const threshold = 2 * stdDev;
  
  const outliers = new Set<number>();
  validValues.forEach(val => {
    // Seulement ajouter si la valeur est significativement différente de la moyenne
    if (Math.abs(val - mean) > threshold) {
      outliers.add(val);
    }
  });
  
  return outliers;
}

export const HistoricalTable: React.FC<HistoricalTableProps> = ({ data, onUpdateRow }) => {
  // État pour le modal de statistiques
  const [selectedMetric, setSelectedMetric] = useState<{
    name: string;
    field: keyof AnnualData;
    values: number[];
  } | null>(null);

  // Calculer les statistiques pour une métrique
  const calculateStatistics = (values: number[]) => {
    const validValues = values.filter(v => v != null && v !== undefined && isFinite(v) && !isNaN(v) && v > 0);
    if (validValues.length === 0) {
      return {
        count: 0,
        mean: 0,
        min: 0,
        max: 0,
        median: 0,
        stdDev: 0,
        sum: 0
      };
    }
    
    const sorted = [...validValues].sort((a, b) => a - b);
    const sum = validValues.reduce((a, b) => a + b, 0);
    const mean = sum / validValues.length;
    const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      count: validValues.length,
      mean,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median,
      stdDev,
      sum
    };
  };

  // Gérer le clic sur un en-tête de colonne
  const handleHeaderClick = (field: keyof AnnualData, name: string) => {
    const values = data.map(d => d[field] as number);
    setSelectedMetric({ field, name, values });
  };

  // Détecter les valeurs aberrantes pour chaque métrique
  const outlierDetection = useMemo(() => {
    const outliers: {
      earningsPerShare: Set<number>;
      cashFlowPerShare: Set<number>;
      bookValuePerShare: Set<number>;
      dividendPerShare: Set<number>;
      priceHigh: Set<number>;
      priceLow: Set<number>;
    } = {
      earningsPerShare: detectOutlierValues(data.map(d => d.earningsPerShare)),
      cashFlowPerShare: detectOutlierValues(data.map(d => d.cashFlowPerShare)),
      bookValuePerShare: detectOutlierValues(data.map(d => d.bookValuePerShare)),
      dividendPerShare: detectOutlierValues(data.map(d => d.dividendPerShare)),
      priceHigh: detectOutlierValues(data.map(d => d.priceHigh)),
      priceLow: detectOutlierValues(data.map(d => d.priceLow))
    };
    
    return outliers;
  }, [data]);

  // Vérifier si une valeur est aberrante
  // ✅ CRITIQUE : Ne jamais considérer les valeurs manquantes, nulles, ou à 0 comme aberrantes
  const checkIfOutlier = (field: keyof AnnualData, value: number): boolean => {
    // Exclure toutes les valeurs invalides, manquantes, ou à zéro
    if (value == null || value === undefined || !isFinite(value) || value <= 0 || isNaN(value)) {
      return false;
    }
    // Vérifier si la valeur est dans le Set d'outliers (qui ne contient que des valeurs > 0)
    return outlierDetection[field as keyof typeof outlierDetection]?.has(value) || false;
  };

  return (
    <div className="mb-4 sm:mb-6 print-break-inside-avoid">
      {/* Légende des couleurs */}
      <DataColorLegend />
      
      {/* Tableau historique */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200" data-demo="historical-table">
      <table className="min-w-full text-xs sm:text-sm text-right">
        <thead className="bg-slate-100 text-gray-600 font-semibold uppercase text-[10px] sm:text-xs border-b-2 border-slate-200">
          <tr>
            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left sticky left-0 bg-slate-100 z-10 cursor-help" title="Année fiscale\n\nAnnée de référence pour les données financières.\n\nLes données sont organisées par année fiscale complète.">Année</th>
            <th className="px-1.5 sm:px-2 py-2 sm:py-3 bg-blue-50 text-blue-800 cursor-help" colSpan={2} title="Prix de l'action\n\n• Prix Haut: Prix maximum observé durant l'année\n• Prix Bas: Prix minimum observé durant l'année\n\nSource: FMP API (historical-price-full)\n\nUtilisés pour:\n• Calcul des ratios P/E, P/CF, P/BV\n• Calcul du Yield\n• Détermination du prix plancher historique">Prix</th>
            <th className="px-1.5 sm:px-2 py-2 sm:py-3 bg-green-50 text-green-800 cursor-help" colSpan={3} title="Cash Flow par Action (CFA)\n\nFlux de trésorerie opérationnel par action.\n\nSource: FMP API (cash-flow-statement)\n\n• CF/Act: Cash Flow par action (éditable)\n• P/CF (H): Ratio Prix/Cash Flow au prix haut\n• P/CF (B): Ratio Prix/Cash Flow au prix bas\n\nUtilisé pour:\n• Calcul du prix cible (méthode P/CF)\n• Évaluation de la génération de cash">Cash Flow</th>
            <th className="px-1.5 sm:px-2 py-2 sm:py-3 bg-yellow-50 text-yellow-800 cursor-help" colSpan={2} title="Dividendes par Action\n\nSomme des dividendes versés par année fiscale.\n\nSource: FMP API (key-metrics + financial-growth)\n\n• Div/Act: Dividende par action (éditable)\n• Rend. %: Rendement en dividendes (Div / Prix Bas)\n\nUtilisé pour:\n• Calcul du prix cible (méthode Yield)\n• Calcul du rendement total (incluant dividendes)">Dividendes</th>
            <th className="px-1.5 sm:px-2 py-2 sm:py-3 bg-purple-50 text-purple-800 cursor-help" colSpan={3} title="Valeur Comptable par Action (BV)\n\nValeur comptable (actif net) par action.\n\nSource: FMP API (balance-sheet-statement)\n\n• Val/Act: Book Value par action (éditable)\n• P/BV (H): Ratio Prix/Valeur Comptable au prix haut\n• P/BV (B): Ratio Prix/Valeur Comptable au prix bas\n\nUtilisé pour:\n• Calcul du prix cible (méthode P/BV)\n• Évaluation de la valeur intrinsèque">Valeur Comptable (BV)</th>
            <th className="px-1.5 sm:px-2 py-2 sm:py-3 bg-red-50 text-red-800 cursor-help" colSpan={3} title="Bénéfice par Action (EPS)\n\nBénéfice net par action (données annuelles auditées).\n\nSource: FMP API (income-statement)\n\n• EPS: Earnings per Share (éditable)\n• P/E (H): Ratio Prix/Bénéfice au prix haut\n• P/E (B): Ratio Prix/Bénéfice au prix bas\n\nUtilisé pour:\n• Calcul du prix cible (méthode P/E)\n• Calcul du JPEGY\n• Évaluation principale">Earnings (EPS)</th>
          </tr>
          <tr className="text-[9px] sm:text-[10px] text-gray-500">
            <th className="px-2 sm:px-3 py-1 text-left sticky left-0 bg-slate-100 z-10"></th>
            <th 
              className="px-1.5 sm:px-2 py-1 bg-blue-50/50 cursor-pointer hover:bg-blue-100 transition-colors" 
              title="Prix Haut\n\nPrix maximum observé durant l'année.\nSource: FMP API (historical-price-full)\n\nCliquez pour voir les statistiques historiques"
              onClick={() => handleHeaderClick('priceHigh', 'Prix Haut')}
            >Haut</th>
            <th 
              className="px-1.5 sm:px-2 py-1 bg-blue-50/50 cursor-pointer hover:bg-blue-100 transition-colors" 
              title="Prix Bas\n\nPrix minimum observé durant l'année.\nSource: FMP API (historical-price-full)\n\nCliquez pour voir les statistiques historiques"
              onClick={() => handleHeaderClick('priceLow', 'Prix Bas')}
            >Bas</th>
            <th 
              className="px-2 py-1 bg-green-50/50 cursor-pointer hover:bg-green-100 transition-colors" 
              title="Cash Flow par Action (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).\n\nCliquez sur l'en-tête pour voir les statistiques historiques"
              onClick={() => handleHeaderClick('cashFlowPerShare', 'Cash Flow par Action')}
            >CF/Act</th>
            <th className="px-2 py-1 bg-green-50/50 cursor-help" title="P/CF au Prix Haut\n\nCalculé: Prix Haut / Cash Flow par Action\n\nRatio calculé automatiquement.">P/CF (H)</th>
            <th className="px-2 py-1 bg-green-50/50 cursor-help" title="P/CF au Prix Bas\n\nCalculé: Prix Bas / Cash Flow par Action\n\nRatio calculé automatiquement.">P/CF (B)</th>
            <th 
              className="px-2 py-1 bg-yellow-50/50 cursor-pointer hover:bg-yellow-100 transition-colors" 
              title="Dividende par Action (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).\n\nCliquez sur l'en-tête pour voir les statistiques historiques"
              onClick={() => handleHeaderClick('dividendPerShare', 'Dividende par Action')}
            >Div/Act</th>
            <th className="px-2 py-1 bg-yellow-50/50 cursor-help" title="Rendement en Dividendes (%)\n\nCalculé: (Dividende / Prix Bas) × 100\n\nRatio calculé automatiquement.">Rend. %</th>
            <th 
              className="px-2 py-1 bg-purple-50/50 cursor-pointer hover:bg-purple-100 transition-colors" 
              title="Book Value par Action (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).\n\nCliquez sur l'en-tête pour voir les statistiques historiques"
              onClick={() => handleHeaderClick('bookValuePerShare', 'Book Value par Action')}
            >Val/Act</th>
            <th className="px-2 py-1 bg-purple-50/50 cursor-help" title="P/BV au Prix Haut\n\nCalculé: Prix Haut / Book Value par Action\n\nRatio calculé automatiquement.">P/BV (H)</th>
            <th className="px-2 py-1 bg-purple-50/50 cursor-help" title="P/BV au Prix Bas\n\nCalculé: Prix Bas / Book Value par Action\n\nRatio calculé automatiquement.">P/BV (B)</th>
            <th 
              className="px-2 py-1 bg-red-50/50 cursor-pointer hover:bg-red-100 transition-colors" 
              title="Earnings per Share (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).\n\nCliquez sur l'en-tête pour voir les statistiques historiques"
              onClick={() => handleHeaderClick('earningsPerShare', 'Earnings per Share')}
            >EPS</th>
            <th className="px-2 py-1 bg-red-50/50 cursor-help" title="P/E au Prix Haut\n\nCalculé: Prix Haut / Earnings per Share\n\nRatio calculé automatiquement.">P/E (H)</th>
            <th className="px-2 py-1 bg-red-50/50 cursor-help" title="P/E au Prix Bas\n\nCalculé: Prix Bas / Earnings per Share\n\nRatio calculé automatiquement.">P/E (B)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => {
            const ratios = calculateRowRatios(row);
            const isFuture = row.year >= new Date().getFullYear() + 1;
            const rowClass = isFuture ? "bg-slate-50 italic" : "hover:bg-gray-50";

            // Compter les outliers dans cette ligne pour mettre en évidence la ligne entière
            const outlierCount = [
              checkIfOutlier('priceHigh', row.priceHigh),
              checkIfOutlier('priceLow', row.priceLow),
              checkIfOutlier('cashFlowPerShare', row.cashFlowPerShare),
              checkIfOutlier('dividendPerShare', row.dividendPerShare),
              checkIfOutlier('bookValuePerShare', row.bookValuePerShare),
              checkIfOutlier('earningsPerShare', row.earningsPerShare)
            ].filter(Boolean).length;
            
            const hasOutliers = outlierCount > 0;
            const rowOutlierClass = hasOutliers ? "bg-red-50/50 border-l-4 border-red-500" : "";

            return (
              <tr key={row.year} className={`${rowClass} ${rowOutlierClass} ${hasOutliers ? 'relative' : ''}`}>
                <td className={`px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-left text-gray-700 sticky left-0 bg-white border-r z-10 text-xs sm:text-sm ${hasOutliers ? 'bg-red-50' : ''}`}>
                  <div className="flex items-center gap-1">
                    {row.year}
                    {hasOutliers && (
                      <ExclamationTriangleIcon className="w-3 h-3 text-red-600 flex-shrink-0" title={`${outlierCount} valeur(s) aberrante(s) détectée(s) dans cette année`} />
                    )}
                  </div>
                </td>

                <td className={`px-1.5 sm:px-2 py-1.5 sm:py-2 bg-blue-50/30 border-r ${checkIfOutlier('priceHigh', row.priceHigh) ? 'bg-red-100 border-red-400 border-2 border-dashed' : ''}`}>
                  <EditableCell id={`input-priceHigh-${idx}`} value={row.priceHigh} onCommit={(v) => onUpdateRow(idx, 'priceHigh', v)} min={0} autoFetched={row.autoFetched} dataSource={row.dataSource} isOutlier={checkIfOutlier('priceHigh', row.priceHigh)} />
                </td>
                <td className={`px-2 py-2 bg-blue-50/30 border-r ${checkIfOutlier('priceLow', row.priceLow) ? 'bg-red-100 border-red-400 border-2 border-dashed' : ''}`}>
                  <EditableCell id={`input-priceLow-${idx}`} value={row.priceLow} onCommit={(v) => onUpdateRow(idx, 'priceLow', v)} min={0} autoFetched={row.autoFetched} dataSource={row.dataSource} isOutlier={checkIfOutlier('priceLow', row.priceLow)} />
                </td>

                <td className={`px-2 py-2 bg-green-50/30 border-r ${checkIfOutlier('cashFlowPerShare', row.cashFlowPerShare) ? 'bg-red-100 border-red-400 border-2 border-dashed' : ''}`}>
                  <EditableCell id={`input-cashFlowPerShare-${idx}`} value={row.cashFlowPerShare} onCommit={(v) => onUpdateRow(idx, 'cashFlowPerShare', v)} autoFetched={row.autoFetched} dataSource={row.dataSource} isOutlier={checkIfOutlier('cashFlowPerShare', row.cashFlowPerShare)} />
                </td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/CF au Prix Haut: ${ratios.pcfHigh.toFixed(1)}x\n\nCalculé: Prix Haut (${row.priceHigh.toFixed(2)}) / Cash Flow (${row.cashFlowPerShare.toFixed(2)})\n\n= ${ratios.pcfHigh.toFixed(1)}x`}>{ratios.pcfHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 border-r cursor-help" title={`P/CF au Prix Bas: ${ratios.pcfLow.toFixed(1)}x\n\nCalculé: Prix Bas (${row.priceLow.toFixed(2)}) / Cash Flow (${row.cashFlowPerShare.toFixed(2)})\n\n= ${ratios.pcfLow.toFixed(1)}x`}>{ratios.pcfLow.toFixed(1)}</td>

                <td className={`px-2 py-2 bg-yellow-50/30 border-r ${checkIfOutlier('dividendPerShare', row.dividendPerShare) ? 'bg-red-100 border-red-400 border-2 border-dashed' : ''}`}>
                  <EditableCell id={`input-dividendPerShare-${idx}`} value={row.dividendPerShare} onCommit={(v) => onUpdateRow(idx, 'dividendPerShare', v)} min={0} autoFetched={row.autoFetched} dataSource={row.dataSource} isOutlier={checkIfOutlier('dividendPerShare', row.dividendPerShare)} />
                </td>
                <td className="px-2 py-2 text-gray-500 border-r cursor-help" title={`Rendement au Prix Bas: ${ratios.yieldHigh.toFixed(2)}%\n\nCalculé: (Dividende (${row.dividendPerShare.toFixed(2)}) / Prix Bas (${row.priceLow.toFixed(2)})) × 100\n\n= ${ratios.yieldHigh.toFixed(2)}%\n\nLe rendement est calculé au prix bas pour obtenir le rendement maximum.`}>{ratios.yieldHigh.toFixed(2)}%</td>

                <td className={`px-2 py-2 bg-purple-50/30 border-r ${checkIfOutlier('bookValuePerShare', row.bookValuePerShare) ? 'bg-red-100 border-red-400 border-2 border-dashed' : ''}`}>
                  <EditableCell id={`input-bookValuePerShare-${idx}`} value={row.bookValuePerShare} onCommit={(v) => onUpdateRow(idx, 'bookValuePerShare', v)} autoFetched={row.autoFetched} dataSource={row.dataSource} isOutlier={checkIfOutlier('bookValuePerShare', row.bookValuePerShare)} />
                </td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/BV au Prix Haut: ${ratios.pbvHigh.toFixed(1)}x\n\nCalculé: Prix Haut (${row.priceHigh.toFixed(2)}) / Book Value (${row.bookValuePerShare.toFixed(2)})\n\n= ${ratios.pbvHigh.toFixed(1)}x`}>{ratios.pbvHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 border-r cursor-help" title={`P/BV au Prix Bas: ${ratios.pbvLow.toFixed(1)}x\n\nCalculé: Prix Bas (${row.priceLow.toFixed(2)}) / Book Value (${row.bookValuePerShare.toFixed(2)})\n\n= ${ratios.pbvLow.toFixed(1)}x`}>{ratios.pbvLow.toFixed(1)}</td>

                <td className={`px-2 py-2 bg-red-50/30 border-r font-medium ${checkIfOutlier('earningsPerShare', row.earningsPerShare) ? 'bg-red-100 border-red-400 border-2 border-dashed' : ''}`}>
                  <EditableCell id={`input-earningsPerShare-${idx}`} value={row.earningsPerShare} onCommit={(v) => onUpdateRow(idx, 'earningsPerShare', v)} autoFetched={row.autoFetched} dataSource={row.dataSource} isOutlier={checkIfOutlier('earningsPerShare', row.earningsPerShare)} />
                </td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/E au Prix Haut: ${ratios.peHigh.toFixed(1)}x\n\nCalculé: Prix Haut (${row.priceHigh.toFixed(2)}) / EPS (${row.earningsPerShare.toFixed(2)})\n\n= ${ratios.peHigh.toFixed(1)}x`}>{ratios.peHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/E au Prix Bas: ${ratios.peLow.toFixed(1)}x\n\nCalculé: Prix Bas (${row.priceLow.toFixed(2)}) / EPS (${row.earningsPerShare.toFixed(2)})\n\n= ${ratios.peLow.toFixed(1)}x`}>{ratios.peLow.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Modal de statistiques */}
      {selectedMetric && (() => {
        const stats = calculateStatistics(selectedMetric.values);
        const validData = data
          .map((row, idx) => ({
            year: row.year,
            value: row[selectedMetric.field] as number
          }))
          .filter(d => d.value != null && d.value !== undefined && isFinite(d.value) && !isNaN(d.value) && d.value > 0)
          .sort((a, b) => a.year - b.year);
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMetric(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Statistiques Historiques: {selectedMetric.name}</h2>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Fermer"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="p-6">
                {stats.count > 0 ? (
                  <>
                    {/* Statistiques principales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Moyenne</div>
                        <div className="text-lg font-bold text-blue-800">{stats.mean.toFixed(2)}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Médiane</div>
                        <div className="text-lg font-bold text-green-800">{stats.median.toFixed(2)}</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Minimum</div>
                        <div className="text-lg font-bold text-yellow-800">{stats.min.toFixed(2)}</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Maximum</div>
                        <div className="text-lg font-bold text-red-800">{stats.max.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Statistiques supplémentaires */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Écart-type</div>
                        <div className="text-lg font-bold text-gray-800">{stats.stdDev.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Nombre de valeurs</div>
                        <div className="text-lg font-bold text-gray-800">{stats.count}</div>
                      </div>
                    </div>

                    {/* Tableau des valeurs historiques */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Valeurs Historiques</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Année</th>
                              <th className="px-3 py-2 text-right">Valeur</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {validData.map((d) => (
                              <tr key={d.year} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{d.year}</td>
                                <td className="px-3 py-2 text-right">{d.value.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune donnée valide disponible pour cette métrique
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};