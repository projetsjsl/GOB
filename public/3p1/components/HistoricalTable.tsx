import React, { useState, useEffect } from 'react';
import { AnnualData } from '../types';
import { calculateRowRatios } from '../utils/calculations';

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
  autoFetched?: boolean; // Track if value is from API (shows green)
}> = ({ value, onCommit, min = -Infinity, id, autoFetched = false }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [wasAutoFetched, setWasAutoFetched] = useState(autoFetched);

  // Sync local state if external value changes (e.g. via undo/redo)
  useEffect(() => {
    setLocalValue(value.toString());
    setWasAutoFetched(autoFetched);
  }, [value, autoFetched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    // Mark as manually edited (removes green styling)
    if (wasAutoFetched) {
      setWasAutoFetched(false);
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

  // Conditional styling: green background + green text for auto-fetched data
  const baseClass = "w-full text-right focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 sm:px-1 outline-none transition-colors invalid:text-red-500 invalid:bg-red-50 text-xs sm:text-sm";
  const autoFetchClass = wasAutoFetched
    ? "bg-green-50 text-green-700 font-medium"
    : "bg-transparent";

  return (
    <input
      id={id}
      type="number"
      step="0.01"
      min={min !== -Infinity ? min : undefined}
      className={`${baseClass} ${autoFetchClass}`}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title={wasAutoFetched 
        ? "Données auto-fetchées (FMP API)\n\nFond vert = données récupérées automatiquement depuis l'API FMP.\n\nCliquez pour modifier manuellement. La modification marquera cette valeur comme manuelle (fond blanc)."
        : "Données manuelles\n\nFond blanc = valeur modifiée manuellement.\n\nLes modifications manuelles sont préservées lors de la synchronisation."}
    />
  );
};

export const HistoricalTable: React.FC<HistoricalTableProps> = ({ data, onUpdateRow }) => {

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 mb-4 sm:mb-6 print-break-inside-avoid">
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
            <th className="px-1.5 sm:px-2 py-1 bg-blue-50/50 cursor-help" title="Prix Haut\n\nPrix maximum observé durant l'année.\nSource: FMP API (historical-price-full)">Haut</th>
            <th className="px-1.5 sm:px-2 py-1 bg-blue-50/50 cursor-help" title="Prix Bas\n\nPrix minimum observé durant l'année.\nSource: FMP API (historical-price-full)">Bas</th>
            <th className="px-2 py-1 bg-green-50/50 cursor-help" title="Cash Flow par Action (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).">CF/Act</th>
            <th className="px-2 py-1 bg-green-50/50 cursor-help" title="P/CF au Prix Haut\n\nCalculé: Prix Haut / Cash Flow par Action\n\nRatio calculé automatiquement.">P/CF (H)</th>
            <th className="px-2 py-1 bg-green-50/50 cursor-help" title="P/CF au Prix Bas\n\nCalculé: Prix Bas / Cash Flow par Action\n\nRatio calculé automatiquement.">P/CF (B)</th>
            <th className="px-2 py-1 bg-yellow-50/50 cursor-help" title="Dividende par Action (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).">Div/Act</th>
            <th className="px-2 py-1 bg-yellow-50/50 cursor-help" title="Rendement en Dividendes (%)\n\nCalculé: (Dividende / Prix Bas) × 100\n\nRatio calculé automatiquement.">Rend. %</th>
            <th className="px-2 py-1 bg-purple-50/50 cursor-help" title="Book Value par Action (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).">Val/Act</th>
            <th className="px-2 py-1 bg-purple-50/50 cursor-help" title="P/BV au Prix Haut\n\nCalculé: Prix Haut / Book Value par Action\n\nRatio calculé automatiquement.">P/BV (H)</th>
            <th className="px-2 py-1 bg-purple-50/50 cursor-help" title="P/BV au Prix Bas\n\nCalculé: Prix Bas / Book Value par Action\n\nRatio calculé automatiquement.">P/BV (B)</th>
            <th className="px-2 py-1 bg-red-50/50 cursor-help" title="Earnings per Share (éditable)\n\nCliquez pour modifier. Fond vert = données auto-fetchées (FMP).">EPS</th>
            <th className="px-2 py-1 bg-red-50/50 cursor-help" title="P/E au Prix Haut\n\nCalculé: Prix Haut / Earnings per Share\n\nRatio calculé automatiquement.">P/E (H)</th>
            <th className="px-2 py-1 bg-red-50/50 cursor-help" title="P/E au Prix Bas\n\nCalculé: Prix Bas / Earnings per Share\n\nRatio calculé automatiquement.">P/E (B)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => {
            const ratios = calculateRowRatios(row);
            const isFuture = row.year >= new Date().getFullYear() + 1;
            const rowClass = isFuture ? "bg-slate-50 italic" : "hover:bg-gray-50";

            return (
              <tr key={row.year} className={rowClass}>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-left text-gray-700 sticky left-0 bg-white border-r z-10 text-xs sm:text-sm">
                  {row.year}
                </td>

                <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 bg-blue-50/30 border-r">
                  <EditableCell id={`input-priceHigh-${idx}`} value={row.priceHigh} onCommit={(v) => onUpdateRow(idx, 'priceHigh', v)} min={0} autoFetched={row.autoFetched} />
                </td>
                <td className="px-2 py-2 bg-blue-50/30 border-r">
                  <EditableCell id={`input-priceLow-${idx}`} value={row.priceLow} onCommit={(v) => onUpdateRow(idx, 'priceLow', v)} min={0} autoFetched={row.autoFetched} />
                </td>

                <td className="px-2 py-2 bg-green-50/30 border-r">
                  <EditableCell id={`input-cashFlowPerShare-${idx}`} value={row.cashFlowPerShare} onCommit={(v) => onUpdateRow(idx, 'cashFlowPerShare', v)} autoFetched={row.autoFetched} />
                </td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/CF au Prix Haut: ${ratios.pcfHigh.toFixed(1)}x\n\nCalculé: Prix Haut (${row.priceHigh.toFixed(2)}) / Cash Flow (${row.cashFlowPerShare.toFixed(2)})\n\n= ${ratios.pcfHigh.toFixed(1)}x`}>{ratios.pcfHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 border-r cursor-help" title={`P/CF au Prix Bas: ${ratios.pcfLow.toFixed(1)}x\n\nCalculé: Prix Bas (${row.priceLow.toFixed(2)}) / Cash Flow (${row.cashFlowPerShare.toFixed(2)})\n\n= ${ratios.pcfLow.toFixed(1)}x`}>{ratios.pcfLow.toFixed(1)}</td>

                <td className="px-2 py-2 bg-yellow-50/30 border-r">
                  <EditableCell id={`input-dividendPerShare-${idx}`} value={row.dividendPerShare} onCommit={(v) => onUpdateRow(idx, 'dividendPerShare', v)} min={0} autoFetched={row.autoFetched} />
                </td>
                <td className="px-2 py-2 text-gray-500 border-r cursor-help" title={`Rendement au Prix Bas: ${ratios.yieldHigh.toFixed(2)}%\n\nCalculé: (Dividende (${row.dividendPerShare.toFixed(2)}) / Prix Bas (${row.priceLow.toFixed(2)})) × 100\n\n= ${ratios.yieldHigh.toFixed(2)}%\n\nLe rendement est calculé au prix bas pour obtenir le rendement maximum.`}>{ratios.yieldHigh.toFixed(2)}%</td>

                <td className="px-2 py-2 bg-purple-50/30 border-r">
                  <EditableCell id={`input-bookValuePerShare-${idx}`} value={row.bookValuePerShare} onCommit={(v) => onUpdateRow(idx, 'bookValuePerShare', v)} autoFetched={row.autoFetched} />
                </td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/BV au Prix Haut: ${ratios.pbvHigh.toFixed(1)}x\n\nCalculé: Prix Haut (${row.priceHigh.toFixed(2)}) / Book Value (${row.bookValuePerShare.toFixed(2)})\n\n= ${ratios.pbvHigh.toFixed(1)}x`}>{ratios.pbvHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 border-r cursor-help" title={`P/BV au Prix Bas: ${ratios.pbvLow.toFixed(1)}x\n\nCalculé: Prix Bas (${row.priceLow.toFixed(2)}) / Book Value (${row.bookValuePerShare.toFixed(2)})\n\n= ${ratios.pbvLow.toFixed(1)}x`}>{ratios.pbvLow.toFixed(1)}</td>

                <td className="px-2 py-2 bg-red-50/30 border-r font-medium">
                  <EditableCell id={`input-earningsPerShare-${idx}`} value={row.earningsPerShare} onCommit={(v) => onUpdateRow(idx, 'earningsPerShare', v)} autoFetched={row.autoFetched} />
                </td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/E au Prix Haut: ${ratios.peHigh.toFixed(1)}x\n\nCalculé: Prix Haut (${row.priceHigh.toFixed(2)}) / EPS (${row.earningsPerShare.toFixed(2)})\n\n= ${ratios.peHigh.toFixed(1)}x`}>{ratios.peHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 cursor-help" title={`P/E au Prix Bas: ${ratios.peLow.toFixed(1)}x\n\nCalculé: Prix Bas (${row.priceLow.toFixed(2)}) / EPS (${row.earningsPerShare.toFixed(2)})\n\n= ${ratios.peLow.toFixed(1)}x`}>{ratios.peLow.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};