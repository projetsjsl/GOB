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
}> = ({ value, onCommit, min = -Infinity, id }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync local state if external value changes (e.g. via undo/redo)
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

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

  return (
    <input
      id={id}
      type="number"
      step="0.01"
      min={min !== -Infinity ? min : undefined}
      className="w-full bg-transparent text-right focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none transition-colors invalid:text-red-500 invalid:bg-red-50"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

export const HistoricalTable: React.FC<HistoricalTableProps> = ({ data, onUpdateRow }) => {
  
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 mb-6 print-break-inside-avoid">
      <table className="min-w-full text-sm text-right">
        <thead className="bg-slate-100 text-gray-600 font-semibold uppercase text-xs border-b-2 border-slate-200">
          <tr>
            <th className="px-3 py-3 text-left sticky left-0 bg-slate-100 z-10">Année</th>
            <th className="px-2 py-3 bg-blue-50 text-blue-800" colSpan={2}>Prix</th>
            <th className="px-2 py-3 bg-green-50 text-green-800" colSpan={3}>Cash Flow</th>
            <th className="px-2 py-3 bg-yellow-50 text-yellow-800" colSpan={2}>Dividendes</th>
            <th className="px-2 py-3 bg-purple-50 text-purple-800" colSpan={3}>Valeur Comptable (BV)</th>
            <th className="px-2 py-3 bg-red-50 text-red-800" colSpan={3}>Earnings (EPS)</th>
          </tr>
          <tr className="text-[10px] text-gray-500">
            <th className="px-3 py-1 text-left sticky left-0 bg-slate-100 z-10"></th>
            <th className="px-2 py-1 bg-blue-50/50">Haut</th>
            <th className="px-2 py-1 bg-blue-50/50">Bas</th>
            <th className="px-2 py-1 bg-green-50/50">CF/Act</th>
            <th className="px-2 py-1 bg-green-50/50">P/CF (H)</th>
            <th className="px-2 py-1 bg-green-50/50">P/CF (B)</th>
            <th className="px-2 py-1 bg-yellow-50/50">Div/Act</th>
            <th className="px-2 py-1 bg-yellow-50/50">Rend. %</th>
            <th className="px-2 py-1 bg-purple-50/50">Val/Act</th>
            <th className="px-2 py-1 bg-purple-50/50">P/BV (H)</th>
            <th className="px-2 py-1 bg-purple-50/50">P/BV (B)</th>
            <th className="px-2 py-1 bg-red-50/50">EPS</th>
            <th className="px-2 py-1 bg-red-50/50">P/E (H)</th>
            <th className="px-2 py-1 bg-red-50/50">P/E (B)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => {
            const ratios = calculateRowRatios(row);
            const isFuture = row.year >= new Date().getFullYear() + 1;
            const rowClass = isFuture ? "bg-slate-50 italic" : "hover:bg-gray-50";

            return (
              <tr key={row.year} className={rowClass}>
                <td className="px-3 py-2 font-bold text-left text-gray-700 sticky left-0 bg-white border-r z-10">
                  {row.year}
                </td>
                
                <td className="px-2 py-2 bg-blue-50/30 border-r">
                    <EditableCell id={`input-priceHigh-${idx}`} value={row.priceHigh} onCommit={(v) => onUpdateRow(idx, 'priceHigh', v)} min={0} />
                </td>
                <td className="px-2 py-2 bg-blue-50/30 border-r">
                    <EditableCell id={`input-priceLow-${idx}`} value={row.priceLow} onCommit={(v) => onUpdateRow(idx, 'priceLow', v)} min={0} />
                </td>
                
                <td className="px-2 py-2 bg-green-50/30 border-r">
                    <EditableCell id={`input-cashFlowPerShare-${idx}`} value={row.cashFlowPerShare} onCommit={(v) => onUpdateRow(idx, 'cashFlowPerShare', v)} />
                </td>
                <td className="px-2 py-2 text-gray-500">{ratios.pcfHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 border-r">{ratios.pcfLow.toFixed(1)}</td>
                
                <td className="px-2 py-2 bg-yellow-50/30 border-r">
                    <EditableCell id={`input-dividendPerShare-${idx}`} value={row.dividendPerShare} onCommit={(v) => onUpdateRow(idx, 'dividendPerShare', v)} min={0} />
                </td>
                <td className="px-2 py-2 text-gray-500 border-r">{ratios.yieldHigh.toFixed(2)}%</td>

                <td className="px-2 py-2 bg-purple-50/30 border-r">
                    <EditableCell id={`input-bookValuePerShare-${idx}`} value={row.bookValuePerShare} onCommit={(v) => onUpdateRow(idx, 'bookValuePerShare', v)} />
                </td>
                <td className="px-2 py-2 text-gray-500">{ratios.pbvHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 border-r">{ratios.pbvLow.toFixed(1)}</td>

                <td className="px-2 py-2 bg-red-50/30 border-r font-medium">
                    <EditableCell id={`input-earningsPerShare-${idx}`} value={row.earningsPerShare} onCommit={(v) => onUpdateRow(idx, 'earningsPerShare', v)} />
                </td>
                <td className="px-2 py-2 text-gray-500">{ratios.peHigh.toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500">{ratios.peLow.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};