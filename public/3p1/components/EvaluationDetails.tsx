import React from 'react';
import { AnnualData, Assumptions } from '../types';
import { formatCurrency, projectFutureValue } from '../utils/calculations';
import { CalculatorIcon } from '@heroicons/react/24/outline';

interface EvaluationDetailsProps {
  data: AnnualData[];
  assumptions: Assumptions;
  onUpdateAssumption: (key: keyof Assumptions, value: number) => void;
}

export const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({ data, assumptions, onUpdateAssumption }) => {

  // Determine base values from selected base year
  // Robust fallback: 1. Match Base Year & Valid EPS -> 2. Any Valid EPS -> 3. Last Data
  const baseYearData = data.find(d => d.year === assumptions.baseYear && d.earningsPerShare > 0)
    || [...data].reverse().find(d => d.earningsPerShare > 0)
    || data[data.length - 1];

  const baseValues = {
    eps: baseYearData?.earningsPerShare || 0,
    cf: baseYearData?.cashFlowPerShare || 0,
    bv: baseYearData?.bookValuePerShare || 0,
    div: assumptions.currentDividend || 0
  };

  // Projections (5 Years)
  const futureValues = {
    eps: projectFutureValue(baseValues.eps, assumptions.growthRateEPS, 5),
    cf: projectFutureValue(baseValues.cf, assumptions.growthRateCF, 5),
    bv: projectFutureValue(baseValues.bv, assumptions.growthRateBV, 5),
    div: projectFutureValue(baseValues.div, assumptions.growthRateDiv, 5)
  };

  // Target Prices
  const targets = {
    eps: futureValues.eps * assumptions.targetPE,
    cf: futureValues.cf * assumptions.targetPCF,
    bv: futureValues.bv * assumptions.targetPBV,
    // Dividend Model: Target Price = Projected Dividend / Target Yield
    // Using format 1.8% -> 0.018
    div: assumptions.targetYield > 0 ? futureValues.div / (assumptions.targetYield / 100) : 0
  };

  // Average Target Price (excluding disabled metrics)
  const validTargets = [
    !assumptions.excludeEPS && targets.eps > 0 ? targets.eps : null,
    !assumptions.excludeCF && targets.cf > 0 ? targets.cf : null,
    !assumptions.excludeBV && targets.bv > 0 ? targets.bv : null,
    !assumptions.excludeDIV && targets.div > 0 ? targets.div : null
  ].filter((t): t is number => t !== null && t > 0);
  
  const avgTargetPrice = validTargets.length > 0
    ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
    : 0;

  // Dividend Accumulation (Approximate sum of 5 years of growing dividends)
  // D1 = D0(1+g), D2=D0(1+g)^2...
  let totalDividends = 0;
  let currentD = baseValues.div;
  for (let i = 0; i < 5; i++) {
    currentD = currentD * (1 + assumptions.growthRateDiv / 100);
    totalDividends += currentD;
  }

  // Total Return Calculation
  // Formula: ((Target Price + Accumulated Dividends) - Current Price) / Current Price
  const totalReturnPercent = assumptions.currentPrice > 0
    ? ((avgTargetPrice + totalDividends - assumptions.currentPrice) / assumptions.currentPrice) * 100
    : 0;

  // Annualized Return (CAGR)
  // End Value = Target + Dividends ? Or just Target and treat dividends as yield?
  // Value Line often uses: (Target Price / Current Price)^(1/5) - 1 + Avg Yield.
  // But based on the user request matching 58.29% which is likely total upside:
  // We stick to totalReturnPercent.

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Assumptions) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) onUpdateAssumption(key, val);
  };

  const handleToggleExclusion = (metric: 'excludeEPS' | 'excludeCF' | 'excludeBV' | 'excludeDIV') => {
    const currentValue = assumptions[metric] || false;
    // Convert boolean to number for onUpdateAssumption (0 = false, 1 = true)
    onUpdateAssumption(metric as keyof Assumptions, currentValue ? 0 : 1);
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-200 print-break-inside-avoid">
      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
        <CalculatorIcon className="w-5 h-5 text-blue-600" />
        ÉVALUATION PERSONNELLE (Projection 5 Ans)
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right border-collapse">
          <thead className="bg-slate-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-2 text-left">Métrique</th>
              <th className="p-2">Actuel</th>
              <th className="p-2">Croissance %</th>
              <th className="p-2 bg-slate-50">5 Ans (Proj)</th>
              <th className="p-2">Ratio Cible</th>
              <th className="p-2 bg-green-50 text-green-900">Prix Cible</th>
              <th className="p-2 text-center" title="Exclure de la moyenne">Exclure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* BPA Row */}
            <tr className={assumptions.excludeEPS ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">BPA (EPS)</td>
              <td className={`p-3 font-semibold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.eps.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateEPS} 
                  onChange={(e) => handleInput(e, 'growthRateEPS')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.eps.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeEPS ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPE} 
                  onChange={(e) => handleInput(e, 'targetPE')} 
                  disabled={assumptions.excludeEPS}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeEPS ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeEPS ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.eps)}</td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={assumptions.excludeEPS || false}
                  onChange={() => handleToggleExclusion('excludeEPS')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  title="Exclure cette métrique du calcul de la moyenne"
                />
              </td>
            </tr>

            {/* CFA Row */}
            <tr className={assumptions.excludeCF ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">CFA (Cash Flow)</td>
              <td className={`p-3 font-semibold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.cf.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateCF} 
                  onChange={(e) => handleInput(e, 'growthRateCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.cf.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeCF ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPCF} 
                  onChange={(e) => handleInput(e, 'targetPCF')} 
                  disabled={assumptions.excludeCF}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeCF ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeCF ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.cf)}</td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={assumptions.excludeCF || false}
                  onChange={() => handleToggleExclusion('excludeCF')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  title="Exclure cette métrique du calcul de la moyenne"
                />
              </td>
            </tr>

            {/* BV Row */}
            <tr className={assumptions.excludeBV ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">BV (Book Value)</td>
              <td className={`p-3 font-semibold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.bv.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateBV} 
                  onChange={(e) => handleInput(e, 'growthRateBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.bv.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeBV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.targetPBV} 
                  onChange={(e) => handleInput(e, 'targetPBV')} 
                  disabled={assumptions.excludeBV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeBV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeBV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.bv)}</td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={assumptions.excludeBV || false}
                  onChange={() => handleToggleExclusion('excludeBV')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  title="Exclure cette métrique du calcul de la moyenne"
                />
              </td>
            </tr>

            {/* DIV Row */}
            <tr className={assumptions.excludeDIV ? "opacity-50 bg-gray-100" : ""}>
              <td className="p-3 text-left font-bold text-gray-700">DIV (Dividende)</td>
              <td className={`p-3 font-semibold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-800"}`}>{baseValues.div.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <input 
                  type="number" 
                  value={assumptions.growthRateDiv} 
                  onChange={(e) => handleInput(e, 'growthRateDiv')} 
                  disabled={assumptions.excludeDIV}
                  className={`w-16 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                />
              </td>
              <td className={`p-3 font-medium ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-slate-50 text-gray-800"}`}>{futureValues.div.toFixed(2)}</td>
              <td className={`p-3 ${assumptions.excludeDIV ? "bg-gray-200" : "bg-orange-50"}`}>
                <div className="flex items-center justify-end gap-1">
                  <input 
                    type="number" 
                    value={assumptions.targetYield} 
                    step="0.1" 
                    onChange={(e) => handleInput(e, 'targetYield')} 
                    disabled={assumptions.excludeDIV}
                    className={`w-12 text-right border-b outline-none focus:border-orange-500 bg-transparent font-medium ${assumptions.excludeDIV ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-orange-300 text-orange-700"}`}
                  />
                  <span className={`text-xs ${assumptions.excludeDIV ? "text-gray-400" : "text-orange-600"}`}>%</span>
                </div>
              </td>
              <td className={`p-3 font-bold ${assumptions.excludeDIV ? "bg-gray-200 text-gray-500" : "bg-green-50 text-green-700"}`}>{formatCurrency(targets.div)}</td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={assumptions.excludeDIV || false}
                  onChange={() => handleToggleExclusion('excludeDIV')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  title="Exclure cette métrique du calcul de la moyenne"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col md:flex-row justify-end gap-6 items-end">
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase mb-1">Prix Cible Moyen (5 ans)</div>
          <div className="text-3xl font-bold text-gray-800 border-b-2 border-gray-800 inline-block px-2">
            {formatCurrency(avgTargetPrice)}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-right min-w-[200px]">
          <div className="text-xs text-green-800 uppercase font-bold mb-1" title="Incluant appréciation du prix et dividendes cumulés">
            Rendement Total Potentiel
          </div>
          <div className="text-3xl font-black text-green-600">
            {totalReturnPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-green-700 mt-1 opacity-80">
            (Gain Prix + Dividendes)
          </div>
        </div>
      </div>
    </div >
  );
};