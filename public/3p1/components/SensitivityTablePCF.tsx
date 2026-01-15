import React from 'react';
import { formatCurrency } from '../utils/calculations';

interface SensitivityTablePCFProps {
  baseCF: number;
  baseGrowth: number;
  basePCF: number;
}

export const SensitivityTablePCF: React.FC<SensitivityTablePCFProps> = ({ baseCF, baseGrowth, basePCF }) => {
  // Verifier que les valeurs de base sont definies - protection complete contre undefined
  const safeBaseGrowth = (baseGrowth != null && baseGrowth !== undefined && isFinite(baseGrowth)) ? baseGrowth : 0;
  const safeBasePCF = (basePCF != null && basePCF !== undefined && isFinite(basePCF)) ? basePCF : 0;
  const safeBaseCF = (baseCF != null && baseCF !== undefined && isFinite(baseCF)) ? baseCF : 0;

  // Variations - s'assurer que les valeurs sont toujours des nombres
  const growthSteps = [safeBaseGrowth - 2, safeBaseGrowth, safeBaseGrowth + 2].map(v => (v != null && isFinite(v)) ? v : 0);
  const pcfSteps = [safeBasePCF - 3, safeBasePCF, safeBasePCF + 3].map(v => (v != null && isFinite(v)) ? v : 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Matrice de Sensibilite P/FCF (Prix Cible 5 ans)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center">
          <thead>
            <tr>
              <th className="p-2 bg-slate-100 border border-slate-200 rounded-tl">P/FCF vs Croissance</th>
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
            {pcfSteps.map((pcf, pcfIdx) => {
              const safePCF = (pcf != null && pcf !== undefined && isFinite(pcf)) ? pcf : 0;
              return (
                <tr key={`pcf-${pcfIdx}-${safePCF}`}>
                  <td className="p-2 bg-slate-50 border border-slate-200 font-semibold">{safePCF.toFixed(1)}x</td>
                  {growthSteps.map((g, gIdx) => {
                    const safeG = (g != null && g !== undefined && isFinite(g)) ? g : 0;
                    const projectedCF = safeBaseCF * Math.pow(1 + safeG / 100, 5);
                    const target = projectedCF * safePCF;
                    return (
                      <td key={`pcf-${pcfIdx}-g-${gIdx}`} className="p-2 border border-slate-200 hover:bg-green-50 transition-colors">
                        <span className={`font-mono font-bold ${safeG === safeBaseGrowth && safePCF === safeBasePCF ? 'text-green-600 text-sm' : 'text-gray-700'}`}>
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
          Axe vertical : P/FCF Cible  Axe horizontal : Croissance CF
      </p>
    </div>
  );
};

