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
    // MÊME LOGIQUE QUE KPIDashboard pour cohérence
    // JPEGY = P/E / (Growth % + Yield %)
    const hasValidEPS = baseEPS > 0.01 && isFinite(baseEPS);
    const safeBasePE = hasValidEPS && assumptions.currentPrice > 0 && currentPE > 0 && currentPE <= 1000 ? currentPE : 0;
    const safeBaseYield = Math.max(0, Math.min(currentYield, 50)); // Limiter yield à 0-50%
    const growthPlusYield = (assumptions.growthRateEPS || 0) + safeBaseYield;
    
    // JPEGY: valider que growthPlusYield > 0.01 ET que basePE est valide
    // Retourner null si impossible à calculer (au lieu de 0)
    let jpegy: number | null = null;
    if (growthPlusYield > 0.01 && safeBasePE > 0 && hasValidEPS) {
      const rawJPEGY = safeBasePE / growthPlusYield;
      if (isFinite(rawJPEGY) && rawJPEGY >= 0 && rawJPEGY <= 100) {
        jpegy = rawJPEGY;
      }
    }
    
    // Forward JPEGY avec même validation
    let forwardJpegy: number | null = null;
    if (growthPlusYield > 0.01 && forwardPE > 0 && forwardPE <= 1000 && hasValidEPS) {
      const rawForwardJPEGY = forwardPE / growthPlusYield;
      if (isFinite(rawForwardJPEGY) && rawForwardJPEGY >= 0 && rawForwardJPEGY <= 100) {
        forwardJpegy = rawForwardJPEGY;
      }
    }

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

    // Rendement espéré (formule Value Line) - Utiliser baseEPS au lieu de lastData pour cohérence avec EvaluationDetails
    // Valider les entrées pour éviter les erreurs
    const safeGrowthRateEPS = Math.max(-50, Math.min(assumptions.growthRateEPS || 0, 50));
    const safeTargetPE = Math.max(1, Math.min(assumptions.targetPE || 0, 100));
    const projectedPrice5Y = baseEPS > 0 && safeTargetPE > 0 
        ? baseEPS * Math.pow(1 + safeGrowthRateEPS / 100, 5) * safeTargetPE 
        : 0;
    const totalReturn = assumptions.currentPrice > 0 && projectedPrice5Y > 0
        ? ((projectedPrice5Y / assumptions.currentPrice) - 1) * 100
        : 0;
    const annualizedReturn = assumptions.currentPrice > 0 && projectedPrice5Y > 0
        ? (Math.pow(projectedPrice5Y / assumptions.currentPrice, 1 / 5) - 1) * 100
        : 0;
    const dividendContribution = currentYield * 5; // Approximation
    const expectedReturn = annualizedReturn + currentYield;

    // Multiple 3 ans - Utiliser le taux de croissance validé
    const multiple3Y = Math.pow(1 + safeGrowthRateEPS / 100, 3);

    // Prix limites (Achat/Vente)
    const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
    const floorPrice = avgLowPrice * 0.9;
    const buyLimit = floorPrice + (projectedPrice5Y - floorPrice) * 0.33;
    const sellLimit = projectedPrice5Y * 0.95;

    // Helper function pour obtenir la couleur et la position du JPEGY
    // Zones: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.2%)
    const getJpegyColor = (value: number | null): { color: string; bgColor: string; position: number } => {
        if (value === null || value <= 0) {
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
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center cursor-help" title="JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)\n\nMétrique propriétaire développée par Jean-Sébastien (JSLAI™).\n\nFormule: P/E ÷ (Croissance % + Yield %)\n\nPlus le ratio est bas, plus l'action est attractive.\n\nZones:\n• 0.0 - 0.5: Très sous-évalué (vert pâle)\n• 0.5 - 1.5: Sous-évalué à raisonnable (vert foncé)\n• 1.5 - 1.75: Légèrement surévalué (jaune)\n• 1.75 - 2.0: Surévalué (orange)\n• > 2.0: Très surévalué (rouge)">
                    🎯 JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Ratio = P/E ÷ (Growth % + Yield %). Plus le ratio est bas, plus l'action est attractive.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* JPEGY (P/E Actuel) */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (P/E Actuel)</div>
                        <div className="text-3xl font-bold mb-3 flex items-center gap-2" style={{ color: jpegy !== null ? jpegyColor.color : '#6b7280' }}>
                            {jpegy !== null ? jpegy.toFixed(2) : (
                                <>
                                    <span>N/A</span>
                                    <span className="text-lg" title="JPEGY non calculable: EPS invalide ou (Growth + Yield) ≤ 0.01%">⚠️</span>
                                </>
                            )}
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
                            {jpegy !== null && jpegy > 0 && (
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
                            {jpegy !== null ? (
                                <>Growth: {assumptions.growthRateEPS.toFixed(1)}% + Yield: {currentYield.toFixed(2)}% = {growthPlusYield.toFixed(2)}%</>
                            ) : (
                                <span className="text-orange-600">⚠️ JPEGY non calculable: EPS invalide ou (Growth + Yield) ≤ 0.01%</span>
                            )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-[10px] text-gray-400 space-y-1">
                                <div><strong>Source de calcul:</strong> P/E Actuel ÷ (Taux de croissance EPS % + Rendement dividende %)</div>
                                <div><strong>Formule:</strong> JPEGY = {currentPE > 0 ? currentPE.toFixed(2) : 'P/E'} ÷ ({assumptions.growthRateEPS.toFixed(1)}% + {currentYield.toFixed(2)}%) = {jpegy !== null ? jpegy.toFixed(2) : 'N/A'}</div>
                                <div><strong>Fournisseur:</strong> Métrique propriétaire développée par Jean-Sébastien (JSLAI™). Le fournisseur établit cette métrique en ajustant le ratio P/E traditionnel par la somme du taux de croissance des bénéfices et du rendement du dividende, permettant une évaluation plus nuancée de la valorisation d'une action en tenant compte de sa capacité de croissance et de sa distribution de dividendes.</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* JPEGY (Forward P/E) */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (Forward P/E)</div>
                        <div className="text-3xl font-bold mb-3 flex items-center gap-2" style={{ color: forwardJpegy !== null ? forwardJpegyColor.color : '#6b7280' }}>
                            {forwardJpegy !== null ? forwardJpegy.toFixed(2) : (
                                <>
                                    <span>N/A</span>
                                    <span className="text-lg" title="Forward JPEGY non calculable: EPS invalide ou (Growth + Yield) ≤ 0.01%">⚠️</span>
                                </>
                            )}
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
                            {forwardJpegy !== null && forwardJpegy > 0 && (
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
                            {forwardJpegy !== null ? (
                                <>Growth: {assumptions.growthRateEPS.toFixed(1)}% + Yield: {currentYield.toFixed(2)}% = {growthPlusYield.toFixed(2)}%</>
                            ) : (
                                <span className="text-orange-600">⚠️ Forward JPEGY non calculable: EPS invalide ou (Growth + Yield) ≤ 0.01%</span>
                            )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-[10px] text-gray-400 space-y-1">
                                <div><strong>Source de calcul:</strong> Forward P/E ÷ (Taux de croissance EPS % + Rendement dividende %)</div>
                                <div><strong>Formule:</strong> Forward JPEGY = {forwardPE > 0 ? forwardPE.toFixed(2) : 'Forward P/E'} ÷ ({assumptions.growthRateEPS.toFixed(1)}% + {currentYield.toFixed(2)}%) = {forwardJpegy !== null ? forwardJpegy.toFixed(2) : 'N/A'}</div>
                                <div><strong>Fournisseur:</strong> Métrique propriétaire développée par Jean-Sébastien (JSLAI™). Le fournisseur établit cette métrique en utilisant le Forward P/E (basé sur les bénéfices projetés) au lieu du P/E actuel, ajusté par la somme du taux de croissance des bénéfices et du rendement du dividende, offrant une perspective prospective de la valorisation.</div>
                            </div>
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
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center cursor-help" title="Ratios Actuels vs Historiques\n\nCompare les ratios actuels avec les moyennes historiques.\n\nPermet de voir si l'action est:\n• Sous-évaluée (ratio actuel < historique)\n• Surévaluée (ratio actuel > historique)\n\nLes ratios verts indiquent une sous-évaluation relative.\nLes ratios rouges indiquent une surévaluation relative.">
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
                                <td className="p-2 font-semibold cursor-help" title="P/E (Price-to-Earnings)\n\nRatio Prix/Bénéfice actuel.\nSource: FMP key-metrics">P/E</td>
                                <td className="p-2 text-right cursor-help" title={`P/E Actuel: ${currentPE.toFixed(2)}x\n\nCalculé avec:\nPrix Actuel / BPA Actuel\n\n= ${formatCurrency(assumptions.currentPrice)} / ${baseEPS.toFixed(2)}\n\n= ${currentPE.toFixed(2)}x`}>{currentPE.toFixed(2)}</td>
                                <td className="p-2 text-right cursor-help" title={`P/E Historique Moyen: ${avgPE.toFixed(2)}x\n\nMoyenne des ratios P/E historiques calculée à partir des données des 10 dernières années.`}>{avgPE.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentPE < avgPE ? 'text-green-600' : 'text-red-600'}`} title={`Écart: ${((currentPE / avgPE - 1) * 100).toFixed(1)}%\n\n${currentPE < avgPE ? '✅ Sous-évalué par rapport à la moyenne historique' : '⚠️ Surévalué par rapport à la moyenne historique'}\n\nUn P/E inférieur à la moyenne historique peut indiquer une opportunité d'achat.`}>
                                    {((currentPE / avgPE - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="P/CF (Price-to-Cash Flow)\n\nRatio Prix/Cash Flow actuel.\nSource: FMP key-metrics">P/CF</td>
                                <td className="p-2 text-right cursor-help" title={`P/CF Actuel: ${currentPCF.toFixed(2)}x\n\nCalculé avec:\nPrix Actuel / Cash Flow par Action Actuel`}>{currentPCF.toFixed(2)}</td>
                                <td className="p-2 text-right cursor-help" title={`P/CF Historique Moyen: ${avgPCF.toFixed(2)}x\n\nMoyenne des ratios P/CF historiques calculée à partir des données des 10 dernières années.`}>{avgPCF.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentPCF < avgPCF ? 'text-green-600' : 'text-red-600'}`} title={`Écart: ${((currentPCF / avgPCF - 1) * 100).toFixed(1)}%\n\n${currentPCF < avgPCF ? '✅ Sous-évalué par rapport à la moyenne historique' : '⚠️ Surévalué par rapport à la moyenne historique'}`}>
                                    {((currentPCF / avgPCF - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="P/BV (Price-to-Book Value)\n\nRatio Prix/Valeur Comptable actuel.\nSource: FMP key-metrics">P/BV</td>
                                <td className="p-2 text-right cursor-help" title={`P/BV Actuel: ${currentPBV.toFixed(2)}x\n\nCalculé avec:\nPrix Actuel / Book Value par Action Actuel`}>{currentPBV.toFixed(2)}</td>
                                <td className="p-2 text-right cursor-help" title={`P/BV Cible: ${assumptions.targetPBV.toFixed(2)}x\n\nRatio P/BV cible utilisé pour vos projections à 5 ans.\nAuto-rempli avec la moyenne historique.`}>{assumptions.targetPBV.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentPBV < assumptions.targetPBV ? 'text-green-600' : 'text-red-600'}`} title={`Écart: ${((currentPBV / assumptions.targetPBV - 1) * 100).toFixed(1)}%\n\n${currentPBV < assumptions.targetPBV ? '✅ Sous-évalué par rapport au ratio cible' : '⚠️ Surévalué par rapport au ratio cible'}`}>
                                    {((currentPBV / assumptions.targetPBV - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="Rendement DIV (Dividend Yield)\n\nRendement en dividendes actuel.\nSource: FMP key-metrics">Rendement DIV</td>
                                <td className="p-2 text-right cursor-help" title={`Yield Actuel: ${currentYield.toFixed(2)}%\n\nCalculé avec:\n(Dividende Actuel / Prix Actuel) × 100`}>{currentYield.toFixed(2)}%</td>
                                <td className="p-2 text-right cursor-help" title={`Yield Cible: ${assumptions.targetYield.toFixed(2)}%\n\nRendement en dividendes cible utilisé pour vos projections à 5 ans.\nAuto-rempli avec la moyenne historique.`}>{assumptions.targetYield.toFixed(2)}%</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentYield > assumptions.targetYield ? 'text-green-600' : 'text-red-600'}`} title={`Écart: ${((currentYield / assumptions.targetYield - 1) * 100).toFixed(1)}%\n\n${currentYield > assumptions.targetYield ? '✅ Rendement supérieur au rendement cible' : '⚠️ Rendement inférieur au rendement cible'}\n\nUn rendement supérieur au cible peut indiquer une opportunité.`}>
                                    {((currentYield / assumptions.targetYield - 1) * 100).toFixed(1)}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Marges et Qualité */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 cursor-help" title="Marges de Rentabilité\n\nMesurent l'efficacité opérationnelle et la rentabilité de l'entreprise.\n\n• Marge Opérationnelle: Efficacité opérationnelle\n• Marge Nette: Rentabilité globale\n• Taux Distribution: Proportion des bénéfices distribués\n\nSource: FMP income-statement et key-metrics">💰 Marges</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between cursor-help" title={`Marge Opérationnelle: ${opMargin.toFixed(1)}%\n\nFormule: (Résultat Opérationnel / Chiffre d'Affaires) × 100\n\nMesure l'efficacité opérationnelle de l'entreprise.\nSource: FMP income-statement`}>
                            <span className="text-gray-600">Marge Opérationnelle</span>
                            <span className="font-semibold">{opMargin.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Marge Nette: ${netMargin.toFixed(1)}%\n\nFormule: (Bénéfice Net / Chiffre d'Affaires) × 100\n\nMesure la rentabilité globale de l'entreprise.\nSource: FMP income-statement`}>
                            <span className="text-gray-600">Marge Nette</span>
                            <span className="font-semibold">{netMargin.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Taux de Distribution (Payout Ratio): ${payoutRatio.toFixed(1)}%\n\nFormule: (Dividendes / Bénéfice Net) × 100\n\nMesure la proportion des bénéfices distribuée aux actionnaires.\nSource: FMP key-metrics`}>
                            <span className="text-gray-600">Taux Distribution DIV</span>
                            <span className="font-semibold">{payoutRatio.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 cursor-help" title="Structure Financière\n\nMesure la santé financière et l'efficacité d'utilisation des ressources.\n\n• Ratio d'Endettement: Niveau de dette\n• ROE: Rentabilité des capitaux propres\n• ROA: Efficacité d'utilisation des actifs\n\nSource: FMP balance-sheet-statement et key-metrics">🏦 Structure Financière</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between cursor-help" title={`Ratio d'Endettement (Debt-to-Equity): ${debtToEquity.toFixed(2)}\n\nFormule: Dette Totale / Capitaux Propres\n\nMesure le niveau d'endettement de l'entreprise.\nUn ratio élevé indique plus de risque financier.\nSource: FMP balance-sheet-statement`}>
                            <span className="text-gray-600">Ratio d'Endettement</span>
                            <span className="font-semibold">{debtToEquity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={info.roe !== null && info.roe !== undefined ? `ROE (Return on Equity): ${info.roe.toFixed(2)}%\n\nFormule: (Bénéfice Net / Capitaux Propres) × 100\n\nMesure la rentabilité des capitaux propres.\nUn ROE élevé indique une utilisation efficace des capitaux.\nSource: FMP key-metrics` : "ROE (Return on Equity): N/A\n\nDonnées non disponibles pour ce ticker.\nSource: FMP key-metrics"}>
                            <span className="text-gray-600">ROE</span>
                            <span className="font-semibold">
                                {info.roe !== null && info.roe !== undefined ? `${info.roe.toFixed(2)}%` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between cursor-help" title={info.roa !== null && info.roa !== undefined ? `ROA (Return on Assets): ${info.roa.toFixed(2)}%\n\nFormule: (Bénéfice Net / Actifs Totaux) × 100\n\nMesure l'efficacité d'utilisation des actifs.\nUn ROA élevé indique une bonne gestion des actifs.\nSource: FMP key-metrics` : "ROA (Return on Assets): N/A\n\nDonnées non disponibles pour ce ticker.\nSource: FMP key-metrics"}>
                            <span className="text-gray-600">ROA</span>
                            <span className="font-semibold">
                                {info.roa !== null && info.roa !== undefined ? `${info.roa.toFixed(2)}%` : 'N/A'}
                            </span>
                        </div>
                    </div>
                    {(info.roe === null || info.roe === undefined || info.roa === null || info.roa === undefined) && (
                        <div className="mt-2 text-xs text-gray-500">
                            {info.roe === null || info.roe === undefined ? 'ROE: ' : ''}
                            {info.roa === null || info.roa === undefined ? 'ROA: ' : ''}
                            Source: FMP key-metrics (données non disponibles pour ce ticker)
                        </div>
                    )}
                </div>
            </div>

            {/* Rendement Espéré (Value Line Style) */}
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                    📈 Rendement Espéré (5 ans)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-2 cursor-help" title={`Appréciation du Prix\n\nRendement annualisé basé uniquement sur l'appréciation du prix (sans dividendes).\n\nFormule:\n((Prix Projeté / Prix Actuel)^(1/5) - 1) × 100\n\n= ${annualizedReturn.toFixed(1)}% / an\n\nTotal sur 5 ans: ${totalReturn.toFixed(1)}%`}>Appréciation du Prix</div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 cursor-help" title={`Appréciation annualisée: ${annualizedReturn.toFixed(1)}% / an\n\nCalculée avec:\n((Prix Projeté (${formatCurrency(projectedPrice5Y)}) / Prix Actuel (${formatCurrency(assumptions.currentPrice)}))^(1/5) - 1) × 100\n\n= ${annualizedReturn.toFixed(1)}% / an\n\nTotal sur 5 ans: ${totalReturn.toFixed(1)}%`}>
                            {annualizedReturn.toFixed(1)}% / an
                        </div>
                        <div className="text-xs text-gray-500 mt-1 cursor-help" title={`Total sur 5 ans: ${totalReturn.toFixed(1)}%\n\nCalculé avec:\n((Prix Projeté / Prix Actuel) - 1) × 100\n\n= ((${formatCurrency(projectedPrice5Y)} / ${formatCurrency(assumptions.currentPrice)}) - 1) × 100\n\n= ${totalReturn.toFixed(1)}%`}>
                            Total: {totalReturn.toFixed(1)}% sur 5 ans
                        </div>
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-2 cursor-help" title={`Rendement Total Espéré\n\nRendement annualisé incluant l'appréciation du prix ET les dividendes.\n\nFormule:\nAppréciation annualisée + Yield annuel\n\n= ${annualizedReturn.toFixed(1)}% + ${currentYield.toFixed(1)}%\n\n= ${expectedReturn.toFixed(1)}% / an`}>Rendement Total Espéré</div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 cursor-help" title={`Rendement Total: ${expectedReturn.toFixed(1)}% / an\n\nDétail:\n• Appréciation: ${annualizedReturn.toFixed(1)}% / an\n• Dividendes: ${currentYield.toFixed(1)}% / an\n• Total: ${expectedReturn.toFixed(1)}% / an\n\nInclut les dividendes perçus sur 5 ans.`}>
                            {expectedReturn.toFixed(1)}% / an
                        </div>
                        <div className="text-xs text-gray-500 mt-1 cursor-help" title={`Dividendes: ${currentYield.toFixed(1)}% / an\n\nCalculé avec:\n(Dividende Actuel / Prix Actuel) × 100\n\n= (${assumptions.currentDividend.toFixed(2)} / ${formatCurrency(assumptions.currentPrice)}) × 100\n\n= ${currentYield.toFixed(1)}% / an`}>
                            Incluant dividendes: {currentYield.toFixed(1)}% / an
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between cursor-help" title={`Prix Actuel: ${formatCurrency(assumptions.currentPrice)}\n\nPrix du marché en temps réel.\nSource: FMP API (quote)\n\nUtilisé comme référence pour tous les calculs de rendement.`}>
                            <span className="text-gray-600">Prix Actuel</span>
                            <span className="font-semibold">{formatCurrency(assumptions.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Prix Projeté (5 ans): ${formatCurrency(projectedPrice5Y)}\n\nCalculé avec:\nEPS Base (${baseEPS.toFixed(2)}) × (1 + ${safeGrowthRateEPS.toFixed(1)}%)⁵ × P/E Cible (${safeTargetPE.toFixed(1)}x)\n\n= ${formatCurrency(projectedPrice5Y)}\n\nBasé sur vos hypothèses de croissance et de ratio P/E.`}>
                            <span className="text-gray-600">Prix Projeté (5 ans)</span>
                            <span className="font-semibold">{formatCurrency(projectedPrice5Y)}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Multiple 3 ans: ${multiple3Y.toFixed(2)}x\n\nFacteur de croissance sur 3 ans basé sur le taux de croissance EPS.\n\nFormule:\n(1 + Taux Croissance EPS / 100)³\n\n= (1 + ${safeGrowthRateEPS.toFixed(1)}% / 100)³\n\n= ${multiple3Y.toFixed(2)}x\n\nIndique le facteur de multiplication de la valeur sur 3 ans.`}>
                            <span className="text-gray-600">Multiple 3 ans</span>
                            <span className="font-semibold">{multiple3Y.toFixed(2)}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratio 3:1 (Potentiel de Rendement vs Potentiel de Baisse) */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Ratio 3:1 (Potentiel vs Risque)</h3>
                <p className="text-xs text-gray-600 mb-4">
                    Le ratio 3:1 mesure le potentiel de rendement par rapport au risque de baisse. 
                    Un ratio ≥ 3:1 indique que le potentiel de hausse est au moins 3 fois supérieur au risque de baisse.
                </p>
                {(() => {
                    // Calcul du risque de baisse (basé sur le prix plancher historique)
                    const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
                    const floorPrice = avgLowPrice * 0.9;
                    const downsideRisk = assumptions.currentPrice > 0
                        ? ((assumptions.currentPrice - floorPrice) / assumptions.currentPrice) * 100
                        : 0;
                    
                    // Calcul du potentiel de hausse (basé sur le rendement total) - Utiliser les valeurs validées
                    const projectedPrice5YLocal = baseEPS > 0 && safeTargetPE > 0 
                        ? baseEPS * Math.pow(1 + safeGrowthRateEPS / 100, 5) * safeTargetPE 
                        : 0;
                    const upsidePotential = assumptions.currentPrice > 0 && projectedPrice5YLocal > 0
                        ? ((projectedPrice5YLocal - assumptions.currentPrice) / assumptions.currentPrice) * 100
                        : 0;
                    
                    const ratio31 = downsideRisk > 0 ? upsidePotential / downsideRisk : 0;
                    const isFavorable = ratio31 >= 3;
                    
                    return (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 cursor-help" title={`Potentiel de Hausse: ${upsidePotential.toFixed(1)}%\n\nCalculé avec:\n((Prix Projeté - Prix Actuel) / Prix Actuel) × 100\n\n= ((${formatCurrency(projectedPrice5YLocal)} - ${formatCurrency(assumptions.currentPrice)}) / ${formatCurrency(assumptions.currentPrice)}) × 100\n\n= ${upsidePotential.toFixed(1)}%\n\nReprésente le gain potentiel si le prix atteint le prix projeté.`}>
                                    <div className="text-xs text-green-700 font-semibold mb-1">Potentiel de Hausse</div>
                                    <div className="text-xl sm:text-2xl font-bold text-green-800">{upsidePotential.toFixed(1)}%</div>
                                    <div className="text-[10px] sm:text-xs text-green-600 mt-1 break-words">
                                        Prix projeté: {formatCurrency(projectedPrice5YLocal)}
                                    </div>
                                </div>
                                <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200 cursor-help" title={`Risque de Baisse: ${downsideRisk.toFixed(1)}%\n\nCalculé avec:\n((Prix Actuel - Prix Plancher) / Prix Actuel) × 100\n\nPrix Plancher = Moyenne Prix Bas Historiques × 0.9\n= ${formatCurrency(avgLowPrice)} × 0.9 = ${formatCurrency(floorPrice)}\n\nRisque = ((${formatCurrency(assumptions.currentPrice)} - ${formatCurrency(floorPrice)}) / ${formatCurrency(assumptions.currentPrice)}) × 100\n\n= ${downsideRisk.toFixed(1)}%\n\nReprésente le risque de baisse jusqu'au prix plancher historique.`}>
                                    <div className="text-xs text-red-700 font-semibold mb-1">Risque de Baisse</div>
                                    <div className="text-xl sm:text-2xl font-bold text-red-800">{downsideRisk.toFixed(1)}%</div>
                                    <div className="text-[10px] sm:text-xs text-red-600 mt-1 break-words">
                                        Prix plancher: {formatCurrency(floorPrice)}
                                    </div>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg border-2 ${
                                isFavorable 
                                    ? 'bg-green-50 border-green-500' 
                                    : 'bg-yellow-50 border-yellow-500'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 mb-1">Ratio 3:1</div>
                                        <div className="text-xs text-gray-600">
                                            Formule: Potentiel de Hausse (%) ÷ Risque de Baisse (%)
                                        </div>
                                    </div>
                                    <div className={`text-2xl sm:text-3xl md:text-4xl font-bold cursor-help ${
                                        isFavorable ? 'text-green-700' : 'text-yellow-700'
                                    }`} title={`Ratio 3:1: ${ratio31.toFixed(2)}:1\n\nFormule:\nPotentiel de Hausse (%) ÷ Risque de Baisse (%)\n\n= ${upsidePotential.toFixed(1)}% ÷ ${downsideRisk.toFixed(1)}%\n\n= ${ratio31.toFixed(2)}:1\n\n${isFavorable ? '✅ Favorable (≥ 3:1): Le potentiel est au moins 3x supérieur au risque' : '⚠️ Défavorable (< 3:1): Le risque est élevé par rapport au potentiel'}\n\nUn ratio ≥ 3:1 indique un bon rapport risque/rendement.`}>
                                        {ratio31.toFixed(2)}:1
                                    </div>
                                </div>
                                <div className={`mt-2 text-sm font-semibold ${
                                    isFavorable ? 'text-green-800' : 'text-yellow-800'
                                }`}>
                                    {isFavorable 
                                        ? '✅ Ratio favorable (≥ 3:1) - Potentiel 3x supérieur au risque'
                                        : '⚠️ Ratio défavorable (< 3:1) - Risque élevé par rapport au potentiel'
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Recommandation d'Achat/Vente */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Zones de Prix Recommandées</h3>
                <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-green-800">Zone d'Achat</div>
                                <div className="text-sm text-gray-600">Prix attractif pour accumuler</div>
                            </div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 cursor-help break-words" title={`Zone d'Achat: ≤ ${formatCurrency(buyLimit)}\n\nCalcul:\nPrix Plancher + (Prix Cible 5 ans - Prix Plancher) × 33%\n\n= ${formatCurrency(floorPrice)} + (${formatCurrency(projectedPrice5Y)} - ${formatCurrency(floorPrice)}) × 33%\n\n= ${formatCurrency(buyLimit)}\n\nSi le prix actuel est ≤ ${formatCurrency(buyLimit)}, la recommandation est ACHAT.`}>
                                ≤ {formatCurrency(buyLimit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Hypothèses utilisées :</strong></div>
                                <div>• Prix plancher (floor) = {formatCurrency(avgLowPrice)} (moy. prix bas hist.) × 0.9 = {formatCurrency(floorPrice)}</div>
                                <div>• Prix cible 5 ans = {formatCurrency(baseEPS)} (EPS année de base {assumptions.baseYear}) × (1 + {safeGrowthRateEPS.toFixed(1)}%)⁵ × {safeTargetPE.toFixed(1)}x (P/E cible) = {formatCurrency(projectedPrice5Y)}</div>
                                <div>• Limite d'achat = {formatCurrency(floorPrice)} + ({formatCurrency(projectedPrice5Y)} - {formatCurrency(floorPrice)}) × 33% = {formatCurrency(buyLimit)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-yellow-800">Zone de Conservation</div>
                                <div className="text-sm text-gray-600">Maintenir la position</div>
                            </div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 cursor-help break-words" title={`Zone de Conservation: ${formatCurrency(buyLimit)} - ${formatCurrency(sellLimit)}\n\nSi le prix actuel est entre ces deux limites, la recommandation est CONSERVER.\n\nLimite d'achat: ${formatCurrency(buyLimit)}\nLimite de vente: ${formatCurrency(sellLimit)} (Prix Cible 5 ans × 95%)`}>
                                {formatCurrency(buyLimit)} - {formatCurrency(sellLimit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-yellow-200">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Hypothèses utilisées :</strong></div>
                                <div>• Limite d'achat = {formatCurrency(buyLimit)} (voir Zone d'Achat)</div>
                                <div>• Limite de vente = {formatCurrency(projectedPrice5Y)} (prix cible 5 ans) × 95% = {formatCurrency(sellLimit)}</div>
                                <div>• Prix cible basé sur : EPS {formatCurrency(baseEPS)} (année {assumptions.baseYear}) × (1 + {safeGrowthRateEPS.toFixed(1)}%)⁵ × P/E {safeTargetPE.toFixed(1)}x</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-red-800">Zone de Vente</div>
                                <div className="text-sm text-gray-600">Prendre profits / Réduire</div>
                            </div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 cursor-help break-words" title={`Zone de Vente: ≥ ${formatCurrency(sellLimit)}\n\nCalcul:\nPrix Cible 5 ans × 95%\n\n= ${formatCurrency(projectedPrice5Y)} × 95%\n\n= ${formatCurrency(sellLimit)}\n\nSi le prix actuel est ≥ ${formatCurrency(sellLimit)}, la recommandation est VENTE (prendre profits).`}>
                                ≥ {formatCurrency(sellLimit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-red-200">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Hypothèses utilisées :</strong></div>
                                <div>• Prix cible 5 ans = {formatCurrency(baseEPS)} (EPS année de base {assumptions.baseYear}) × (1 + {safeGrowthRateEPS.toFixed(1)}%)⁵ × {safeTargetPE.toFixed(1)}x (P/E cible) = {formatCurrency(projectedPrice5Y)}</div>
                                <div>• Limite de vente = {formatCurrency(projectedPrice5Y)} × 95% = {formatCurrency(sellLimit)}</div>
                                <div>• Basé sur projection 5 ans avec croissance EPS {safeGrowthRateEPS.toFixed(1)}% et P/E cible {safeTargetPE.toFixed(1)}x</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                        <strong>Position Actuelle :</strong> <span className="cursor-help" title={`Prix Actuel: ${formatCurrency(assumptions.currentPrice)}\n\nComparé aux zones:\n• Zone d'Achat: ≤ ${formatCurrency(buyLimit)}\n• Zone de Conservation: ${formatCurrency(buyLimit)} - ${formatCurrency(sellLimit)}\n• Zone de Vente: ≥ ${formatCurrency(sellLimit)}\n\nRecommandation basée sur la position actuelle par rapport à ces zones.`}>{formatCurrency(assumptions.currentPrice)}</span>
                        {assumptions.currentPrice <= buyLimit && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded font-semibold cursor-help" title={`Recommandation: ACHAT\n\nLe prix actuel (${formatCurrency(assumptions.currentPrice)}) est dans la zone d'achat (≤ ${formatCurrency(buyLimit)}).\n\nC'est un prix attractif pour accumuler des positions.`}>ACHAT</span>
                        )}
                        {assumptions.currentPrice > buyLimit && assumptions.currentPrice < sellLimit && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold cursor-help" title={`Recommandation: CONSERVER\n\nLe prix actuel (${formatCurrency(assumptions.currentPrice)}) est dans la zone de conservation (${formatCurrency(buyLimit)} - ${formatCurrency(sellLimit)}).\n\nMaintenez votre position actuelle.`}>CONSERVER</span>
                        )}
                        {assumptions.currentPrice >= sellLimit && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded font-semibold cursor-help" title={`Recommandation: VENDRE\n\nLe prix actuel (${formatCurrency(assumptions.currentPrice)}) est dans la zone de vente (≥ ${formatCurrency(sellLimit)}).\n\nConsidérez prendre des profits ou réduire votre position.`}>VENDRE</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

