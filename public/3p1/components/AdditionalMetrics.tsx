import React from 'react';
import { Assumptions, AnnualData, CompanyInfo } from '../types';
import { calculateAverage, formatCurrency, formatPercent } from '../utils/calculations';

interface AdditionalMetricsProps {
    data: AnnualData[];
    assumptions: Assumptions;
    info: CompanyInfo;
}

export const AdditionalMetrics: React.FC<AdditionalMetricsProps> = ({ data, assumptions, info }) => {
    // Calculs des métriques manquantes
    const lastData = data[data.length - 1];
    const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);

    // Trouver les données de l'année de base pour les calculs
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || lastData;
    const baseEPS = baseYearData?.earningsPerShare || 0;

    // Ratio Moyen Actuel
    const currentPE = baseEPS > 0 ? assumptions.currentPrice / baseEPS : 0;
    const currentPCF = assumptions.currentPrice / (lastData?.cashFlowPerShare || 1);
    const currentPBV = assumptions.currentPrice / (lastData?.bookValuePerShare || 1);
    const currentYield = (assumptions.currentDividend / assumptions.currentPrice) * 100;

    // Calcul du Forward P/E (P/E basé sur les earnings projetés)
    const forwardEPS = baseEPS * (1 + assumptions.growthRateEPS / 100);
    const forwardPE = forwardEPS > 0 ? assumptions.currentPrice / forwardEPS : 0;

    // Calcul JPEGY (Jean-Sebastien's Price to Earning adjusted for Growth and Yield)
    // JPEGY = P/E / (Growth % + Yield %)
    const growthPlusYield = assumptions.growthRateEPS + currentYield;
    const jpegy = growthPlusYield > 0 ? currentPE / growthPlusYield : 0;
    const forwardJpegy = growthPlusYield > 0 ? forwardPE / growthPlusYield : 0;

    // Ratios historiques moyens
    const avgPE = calculateAverage(
        validHistory
            .map(d => (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2)
            .filter(v => isFinite(v) && v > 0)
    );
    const avgPCF = calculateAverage(
        validHistory
            .map(d => (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2)
            .filter(v => isFinite(v) && v > 0)
    );

    // Marges (estimées - à améliorer avec vraies données)
    const opMargin = 15.0; // Placeholder
    const netMargin = 10.0; // Placeholder

    // Ratio d'endettement (estimé)
    const debtToEquity = 0.5; // Placeholder

    // Taux de distribution dividende
    const payoutRatio = ((lastData?.dividendPerShare || 0) / (lastData?.earningsPerShare || 1)) * 100;

    // Rendement espéré (formule Value Line)
    const projectedPrice5Y = (lastData?.earningsPerShare || 0) * Math.pow(1 + assumptions.growthRateEPS / 100, 5) * assumptions.targetPE;
    const totalReturn = ((projectedPrice5Y / assumptions.currentPrice) - 1) * 100;
    const annualizedReturn = (Math.pow(projectedPrice5Y / assumptions.currentPrice, 1 / 5) - 1) * 100;
    const dividendContribution = currentYield * 5; // Approximation
    const expectedReturn = annualizedReturn + currentYield;

    // Multiple 3 ans
    const multiple3Y = Math.pow(1 + assumptions.growthRateEPS / 100, 3);

    // Prix limites (Achat/Vente)
    const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
    const floorPrice = avgLowPrice * 0.9;
    const buyLimit = floorPrice + (projectedPrice5Y - floorPrice) * 0.33;
    const sellLimit = projectedPrice5Y * 0.95;

    return (
        <div className="space-y-6">
            {/* Indicateur JPEGY */}
            <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    🎯 JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Ratio = P/E ÷ (Growth % + Yield %). Plus le ratio est bas, plus l'action est attractive.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (P/E Actuel)</div>
                        <div className="text-3xl font-bold text-purple-600">
                            {jpegy > 0 ? jpegy.toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            P/E: {currentPE > 0 ? currentPE.toFixed(2) : 'N/A'}x
                        </div>
                        <div className="text-xs text-gray-500">
                            (Growth: {assumptions.growthRateEPS.toFixed(1)}% + Yield: {currentYield.toFixed(2)}% = {growthPlusYield.toFixed(2)}%)
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (Forward P/E)</div>
                        <div className="text-3xl font-bold text-indigo-600">
                            {forwardJpegy > 0 ? forwardJpegy.toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Forward P/E: {forwardPE > 0 ? forwardPE.toFixed(2) : 'N/A'}x
                        </div>
                        <div className="text-xs text-gray-500">
                            (Growth: {assumptions.growthRateEPS.toFixed(1)}% + Yield: {currentYield.toFixed(2)}% = {growthPlusYield.toFixed(2)}%)
                        </div>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-purple-100 rounded-lg text-xs text-gray-700">
                    <strong>Interprétation :</strong> Un JPEGY &lt; 1.0 indique que le P/E est inférieur à la somme de la croissance et du rendement, 
                    suggérant une valorisation attractive. Un JPEGY &gt; 1.5 peut indiquer une survalorisation relative.
                </div>
            </div>

            {/* Ratios Actuels vs Historiques */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    📊 Ratios Actuels vs Historiques
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-2 text-left">Métrique</th>
                                <th className="p-2 text-right">Actuel</th>
                                <th className="p-2 text-right">Historique Moyen</th>
                                <th className="p-2 text-right">Écart</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr>
                                <td className="p-2 font-semibold">P/E</td>
                                <td className="p-2 text-right">{currentPE.toFixed(2)}</td>
                                <td className="p-2 text-right">{avgPE.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold ${currentPE < avgPE ? 'text-green-600' : 'text-red-600'}`}>
                                    {((currentPE / avgPE - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold">P/CF</td>
                                <td className="p-2 text-right">{currentPCF.toFixed(2)}</td>
                                <td className="p-2 text-right">{avgPCF.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold ${currentPCF < avgPCF ? 'text-green-600' : 'text-red-600'}`}>
                                    {((currentPCF / avgPCF - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold">P/BV</td>
                                <td className="p-2 text-right">{currentPBV.toFixed(2)}</td>
                                <td className="p-2 text-right">{assumptions.targetPBV.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold ${currentPBV < assumptions.targetPBV ? 'text-green-600' : 'text-red-600'}`}>
                                    {((currentPBV / assumptions.targetPBV - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold">Rendement DIV</td>
                                <td className="p-2 text-right">{currentYield.toFixed(2)}%</td>
                                <td className="p-2 text-right">{assumptions.targetYield.toFixed(2)}%</td>
                                <td className={`p-2 text-right font-semibold ${currentYield > assumptions.targetYield ? 'text-green-600' : 'text-red-600'}`}>
                                    {((currentYield / assumptions.targetYield - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Marges et Qualité */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card">
                    <h4 className="font-bold text-gray-800 mb-3">💰 Marges</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Marge Opérationnelle</span>
                            <span className="font-semibold">{opMargin.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Marge Nette</span>
                            <span className="font-semibold">{netMargin.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Taux Distribution DIV</span>
                            <span className="font-semibold">{payoutRatio.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h4 className="font-bold text-gray-800 mb-3">🏦 Structure Financière</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Ratio d'Endettement</span>
                            <span className="font-semibold">{debtToEquity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">ROE</span>
                            <span className="font-semibold">N/A</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">ROA</span>
                            <span className="font-semibold">N/A</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rendement Espéré (Value Line Style) */}
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    📈 Rendement Espéré (5 ans)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Appréciation du Prix</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {annualizedReturn.toFixed(1)}% / an
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Total: {totalReturn.toFixed(1)}% sur 5 ans
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Rendement Total Espéré</div>
                        <div className="text-2xl font-bold text-green-600">
                            {expectedReturn.toFixed(1)}% / an
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Incluant dividendes: {currentYield.toFixed(1)}% / an
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Prix Actuel</span>
                            <span className="font-semibold">{formatCurrency(assumptions.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Prix Projeté (5 ans)</span>
                            <span className="font-semibold">{formatCurrency(projectedPrice5Y)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Multiple 3 ans</span>
                            <span className="font-semibold">{multiple3Y.toFixed(2)}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommandation d'Achat/Vente */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Zones de Prix Recommandées</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div>
                            <div className="font-bold text-green-800">Zone d'Achat</div>
                            <div className="text-sm text-gray-600">Prix attractif pour accumuler</div>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                            ≤ {formatCurrency(buyLimit)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div>
                            <div className="font-bold text-yellow-800">Zone de Conservation</div>
                            <div className="text-sm text-gray-600">Maintenir la position</div>
                        </div>
                        <div className="text-xl font-bold text-yellow-600">
                            {formatCurrency(buyLimit)} - {formatCurrency(sellLimit)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div>
                            <div className="font-bold text-red-800">Zone de Vente</div>
                            <div className="text-sm text-gray-600">Prendre profits / Réduire</div>
                        </div>
                        <div className="text-xl font-bold text-red-600">
                            ≥ {formatCurrency(sellLimit)}
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                        <strong>Position Actuelle :</strong> {formatCurrency(assumptions.currentPrice)}
                        {assumptions.currentPrice <= buyLimit && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">ACHAT</span>
                        )}
                        {assumptions.currentPrice > buyLimit && assumptions.currentPrice < sellLimit && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">CONSERVER</span>
                        )}
                        {assumptions.currentPrice >= sellLimit && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">VENDRE</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
