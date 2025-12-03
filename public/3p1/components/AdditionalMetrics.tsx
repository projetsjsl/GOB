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

    // Helper function pour obtenir la couleur et la position du JPEGY
    // Zones: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.2%)
    const getJpegyColor = (value: number): { color: string; bgColor: string; position: number } => {
        if (value <= 0) {
            return { color: '#6b7280', bgColor: '#f3f4f6', position: 0 };
        }
        if (value <= 0.5) {
            // Vert pâle (0 à 0.5) - 11.1% de la barre
            const position = (value / 0.5) * 11.1; // 0-11.1% de la barre
            return { color: '#86efac', bgColor: '#dcfce7', position };
        } else if (value <= 1.5) {
            // Vert foncé (0.5 à 1.5) - 55.6% de la barre
            const position = 11.1 + ((value - 0.5) / 1.0) * 55.6; // 11.1-66.7% de la barre
            return { color: '#16a34a', bgColor: '#bbf7d0', position };
        } else if (value <= 1.75) {
            // Jaune (1.5 à 1.75) - 5.6% de la barre
            const position = 66.7 + ((value - 1.5) / 0.25) * 5.6; // 66.7-72.3% de la barre
            return { color: '#eab308', bgColor: '#fef9c3', position };
        } else if (value <= 2.0) {
            // Orange (1.75 à 2.0) - 5.6% de la barre
            const position = 72.3 + ((value - 1.75) / 0.25) * 5.6; // 72.3-77.9% de la barre
            return { color: '#f97316', bgColor: '#fed7aa', position };
        } else {
            // Rouge (au-dessus de 2.0) - 22.2% de la barre
            // Pour les valeurs > 2.0, on limite à 100% mais on peut aller jusqu'à ~4.0 pour utiliser toute la zone rouge
            const maxValue = 4.0; // Valeur maximale pour utiliser toute la zone rouge
            const position = Math.min(77.9 + ((value - 2.0) / (maxValue - 2.0)) * 22.2, 100);
            return { color: '#dc2626', bgColor: '#fecaca', position };
        }
    };

    const jpegyColor = getJpegyColor(jpegy);
    const forwardJpegyColor = getJpegyColor(forwardJpegy);

    return (
        <div className="space-y-6">
            {/* Indicateur JPEGY */}
            <div className="bg-white p-5 rounded-lg shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    🎯 JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Ratio = P/E ÷ (Growth % + Yield %). Plus le ratio est bas, plus l'action est attractive.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {/* JPEGY (P/E Actuel) */}
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (P/E Actuel)</div>
                        <div className="text-3xl font-bold mb-3" style={{ color: jpegyColor.color }}>
                            {jpegy > 0 ? jpegy.toFixed(2) : 'N/A'}
                        </div>
                        
                        {/* Zone de couleur avec indicateur */}
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3">
                            {/* Segments de couleur - proportions: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.1%) */}
                            <div className="absolute inset-0 flex">
                                <div className="bg-green-200" style={{ width: '11.1%' }}></div>
                                <div className="bg-green-600" style={{ width: '55.6%' }}></div>
                                <div className="bg-yellow-400" style={{ width: '5.6%' }}></div>
                                <div className="bg-orange-500" style={{ width: '5.6%' }}></div>
                                <div className="bg-red-600" style={{ width: '22.1%' }}></div>
                            </div>
                            {/* Indicateur de position */}
                            {jpegy > 0 && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-black z-10 transition-all duration-300"
                                    style={{ left: `${jpegyColor.position}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                        {jpegy.toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                            P/E: {currentPE > 0 ? currentPE.toFixed(2) : 'N/A'}x
                        </div>
                        <div className="text-xs text-gray-500">
                            (Growth: {assumptions.growthRateEPS.toFixed(1)}% + Yield: {currentYield.toFixed(2)}% = {growthPlusYield.toFixed(2)}%)
                        </div>
                    </div>
                    
                    {/* JPEGY (Forward P/E) */}
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (Forward P/E)</div>
                        <div className="text-3xl font-bold mb-3" style={{ color: forwardJpegyColor.color }}>
                            {forwardJpegy > 0 ? forwardJpegy.toFixed(2) : 'N/A'}
                        </div>
                        
                        {/* Zone de couleur avec indicateur */}
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3">
                            {/* Segments de couleur - proportions: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.1%) */}
                            <div className="absolute inset-0 flex">
                                <div className="bg-green-200" style={{ width: '11.1%' }}></div>
                                <div className="bg-green-600" style={{ width: '55.6%' }}></div>
                                <div className="bg-yellow-400" style={{ width: '5.6%' }}></div>
                                <div className="bg-orange-500" style={{ width: '5.6%' }}></div>
                                <div className="bg-red-600" style={{ width: '22.1%' }}></div>
                            </div>
                            {/* Indicateur de position */}
                            {forwardJpegy > 0 && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-black z-10 transition-all duration-300"
                                    style={{ left: `${forwardJpegyColor.position}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                        {forwardJpegy.toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                            Forward P/E: {forwardPE > 0 ? forwardPE.toFixed(2) : 'N/A'}x
                        </div>
                        <div className="text-xs text-gray-500">
                            (Growth: {assumptions.growthRateEPS.toFixed(1)}% + Yield: {currentYield.toFixed(2)}% = {growthPlusYield.toFixed(2)}%)
                        </div>
                    </div>
                </div>
                
                {/* Légende des zones de couleur */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Légende des zones :</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-green-200 rounded"></div>
                            <span className="text-gray-600">0.0 - 0.5 (Vert pâle)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-green-600 rounded"></div>
                            <span className="text-gray-600">0.5 - 1.5 (Vert foncé)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                            <span className="text-gray-600">1.5 - 1.75 (Jaune)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                            <span className="text-gray-600">1.75 - 2.0 (Orange)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-red-600 rounded"></div>
                            <span className="text-gray-600">&gt; 2.0 (Rouge)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratios Actuels vs Historiques */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
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
