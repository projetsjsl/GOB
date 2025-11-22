import React from 'react';
import { formatCurrency } from '../utils/calculations';

interface SensitivityTableProps {
  baseEPS: number;
  baseGrowth: number;
  basePE: number;
}

export const SensitivityTable: React.FC<SensitivityTableProps> = ({ baseEPS, baseGrowth, basePE }) => {
  // Variations
  const growthSteps = [baseGrowth - 2, baseGrowth, baseGrowth + 2];
  const peSteps = [basePE - 3, basePE, basePE + 3];

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Matrice de Sensibilité (Prix Cible 5 ans)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center">
          <thead>
            <tr>
              <th className="p-2 bg-slate-100 border border-slate-200 rounded-tl">P/E vs Croissance</th>
              {growthSteps.map(g => (
                <th key={g} className="p-2 bg-slate-50 border border-slate-200 font-semibold">
                  {g.toFixed(1)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {peSteps.map(pe => (
              <tr key={pe}>
                <td className="p-2 bg-slate-50 border border-slate-200 font-semibold">{pe.toFixed(1)}x</td>
                {growthSteps.map(g => {
                  const projectedEPS = baseEPS * Math.pow(1 + g / 100, 5);
                  const target = projectedEPS * pe;
                  return (
                    <td key={`${pe}-${g}`} className="p-2 border border-slate-200 hover:bg-blue-50 transition-colors">
                      <span className={`font-mono font-bold ${g === baseGrowth && pe === basePE ? 'text-blue-600 text-sm' : 'text-gray-700'}`}>
                        {formatCurrency(target)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center italic">
          Axe vertical : P/E Cible · Axe horizontal : Croissance BPA
      </p>
    </div>
  );
};