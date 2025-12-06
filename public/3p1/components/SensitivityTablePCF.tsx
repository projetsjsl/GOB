import React from 'react';
import { formatCurrency } from '../utils/calculations';

interface SensitivityTablePCFProps {
  baseCF: number;
  baseGrowth: number;
  basePCF: number;
}

export const SensitivityTablePCF: React.FC<SensitivityTablePCFProps> = ({ baseCF, baseGrowth, basePCF }) => {
  // Variations
  const growthSteps = [baseGrowth - 2, baseGrowth, baseGrowth + 2];
  const pcfSteps = [basePCF - 3, basePCF, basePCF + 3];

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Matrice de Sensibilité P/FCF (Prix Cible 5 ans)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center">
          <thead>
            <tr>
              <th className="p-2 bg-slate-100 border border-slate-200 rounded-tl">P/FCF vs Croissance</th>
              {growthSteps.map(g => (
                <th key={g} className="p-2 bg-slate-50 border border-slate-200 font-semibold">
                  {g.toFixed(1)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pcfSteps.map(pcf => (
              <tr key={pcf}>
                <td className="p-2 bg-slate-50 border border-slate-200 font-semibold">{pcf.toFixed(1)}x</td>
                {growthSteps.map(g => {
                  const projectedCF = baseCF * Math.pow(1 + g / 100, 5);
                  const target = projectedCF * pcf;
                  return (
                    <td key={`${pcf}-${g}`} className="p-2 border border-slate-200 hover:bg-green-50 transition-colors">
                      <span className={`font-mono font-bold ${g === baseGrowth && pcf === basePCF ? 'text-green-600 text-sm' : 'text-gray-700'}`}>
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
          Axe vertical : P/FCF Cible · Axe horizontal : Croissance CF
      </p>
    </div>
  );
};

