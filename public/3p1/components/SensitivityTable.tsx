import React from 'react';
import { formatCurrency } from '../utils/calculations';

interface SensitivityTableProps {
  baseEPS: number;
  baseGrowth: number;
  basePE: number;
}

export const SensitivityTable: React.FC<SensitivityTableProps> = ({ baseEPS, baseGrowth, basePE }) => {
  // Verifier que les valeurs de base sont definies - protection complete contre undefined
  const safeBaseGrowth = (baseGrowth != null && baseGrowth !== undefined && isFinite(baseGrowth)) ? baseGrowth : 0;
  const safeBasePE = (basePE != null && basePE !== undefined && isFinite(basePE)) ? basePE : 0;
  const safeBaseEPS = (baseEPS != null && baseEPS !== undefined && isFinite(baseEPS)) ? baseEPS : 0;

  // Variations - s'assurer que les valeurs sont toujours des nombres
  const growthSteps = [safeBaseGrowth - 2, safeBaseGrowth, safeBaseGrowth + 2].map(v => (v != null && isFinite(v)) ? v : 0);
  const peSteps = [safeBasePE - 3, safeBasePE, safeBasePE + 3].map(v => (v != null && isFinite(v)) ? v : 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Matrice de Sensibilite (Prix Cible 5 ans)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center">
          <thead>
            <tr>
              <th className="p-2 bg-slate-100 border border-slate-200 rounded-tl">P/E vs Croissance</th>
              {growthSteps.map((g, idx) => {
                const safeG = (g != null && g !== undefined && isFinite(g)) ? g : 0;
                return (
                  <th key={`growth-${idx}-${safeG}`} className="p-2 bg-slate-50 border border-slate-200 font-semibold">
                    {safeG.toFixed(1)}%
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {peSteps.map((pe, peIdx) => {
              const safePE = (pe != null && pe !== undefined && isFinite(pe)) ? pe : 0;
              return (
                <tr key={`pe-${peIdx}-${safePE}`}>
                  <td className="p-2 bg-slate-50 border border-slate-200 font-semibold">{safePE.toFixed(1)}x</td>
                  {growthSteps.map((g, gIdx) => {
                    const safeG = (g != null && g !== undefined && isFinite(g)) ? g : 0;
                    const projectedEPS = safeBaseEPS * Math.pow(1 + safeG / 100, 5);
                    const target = projectedEPS * safePE;
                    return (
                      <td key={`pe-${peIdx}-g-${gIdx}`} className="p-2 border border-slate-200 hover:bg-blue-50 transition-colors">
                        <span className={`font-mono font-bold ${safeG === safeBaseGrowth && safePE === safeBasePE ? 'text-blue-600 text-sm' : 'text-gray-700'}`}>
                          {formatCurrency(target)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center italic">
          Axe vertical : P/E Cible  Axe horizontal : Croissance BPA
      </p>
    </div>
  );
};