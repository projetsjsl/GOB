import React from 'react';
import { Assumptions, AnnualData, CompanyInfo } from '../types';
import { calculateAverage, formatCurrency, formatPercent } from '../utils/calculations';
import { GuardrailConfig, DEFAULT_CONFIG } from '../config/AppConfig';

interface AdditionalMetricsProps {
    data: AnnualData[];
    assumptions: Assumptions;
    info: CompanyInfo;
    config?: GuardrailConfig;
}

export const AdditionalMetrics: React.FC<AdditionalMetricsProps> = ({ data, assumptions, info, config = DEFAULT_CONFIG }) => {
    // Calculs des metriques manquantes
    const lastData = data[data.length - 1];
    const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);

    // Trouver les donnees de l'annee de base pour les calculs
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || lastData;
    const baseEPS = baseYearData?.earningsPerShare || 0;

    // Ratio Moyen Actuel
    const currentPE = baseEPS > 0 ? assumptions.currentPrice / baseEPS : 0;
    const currentPCF = assumptions.currentPrice / (lastData?.cashFlowPerShare || 1);
    const currentPBV = assumptions.currentPrice / (lastData?.bookValuePerShare || 1);
    // BUG #3P1-2 FIX: Validation pour eviter NaN quand currentPrice = 0
    const currentYield = assumptions.currentPrice > 0 && assumptions.currentDividend >= 0
      ? (assumptions.currentDividend / assumptions.currentPrice) * 100
      : 0;

    // Calcul du Forward P/E (P/E base sur les earnings projetes)
    const forwardEPS = baseEPS * (1 + assumptions.growthRateEPS / 100);
    const forwardPE = forwardEPS > 0 ? assumptions.currentPrice / forwardEPS : 0;

    // Calcul JPEGY (Jean-Sebastien's Price to Earning adjusted for Growth and Yield)
    // MEME LOGIQUE QUE KPIDashboard pour coherence
    // JPEGY = (Growth % + Yield %) / P/E
    const hasValidEPS = baseEPS > 0.01 && isFinite(baseEPS);
    const safeBasePE = hasValidEPS && assumptions.currentPrice > 0 && currentPE > 0 && currentPE <= config.ratios.pe.max * 10 ? currentPE : 0;
    const safeBaseYield = Math.max(0, Math.min(currentYield, 50)); // Keep yield hardcap at 50% for JPEGY sanity or use config? Using config.ratios.yield.max seems safer but JPEGY often allows higher yield impact. Let's stick to safe hardcap for JPEGY or config max * 2.
    // Actually, user wants configuration. Let's use config.ratios.yield.max but maybe multiplied if JPEGY allows outlier yields.
    // For now, let's just use the config limit for consistency.
    const safeYieldLimit = config.ratios.yield.max * 2.5; // Allow a bit more for "current" outlier yield before breaking JPEGY
    const safeBaseYieldVal = Math.max(0, Math.min(currentYield, safeYieldLimit));
    const growthPlusYield = (assumptions.growthRateEPS || 0) + safeBaseYieldVal;

    // JPEGY: (EPS_Growth + Dividend_Yield) / PE_Ratio
    // valider que growthPlusYield > 0.01 ET que basePE est valide
    // Retourner null si impossible a calculer (au lieu de 0)
    let jpegy: number | null = null;
    if (growthPlusYield > 0.01 && safeBasePE > 0 && hasValidEPS) {
      const rawJPEGY = growthPlusYield / safeBasePE;
      if (isFinite(rawJPEGY) && rawJPEGY >= 0 && rawJPEGY <= 100) {
        jpegy = rawJPEGY;
      }
    }

    // Forward JPEGY avec meme validation
    let forwardJpegy: number | null = null;
    if (growthPlusYield > 0.01 && forwardPE > 0 && forwardPE <= 1000 && hasValidEPS) {
      const rawForwardJPEGY = growthPlusYield / forwardPE;
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

    // Marges (estimees - a ameliorer avec vraies donnees)
    // Marges (estimees - a ameliorer avec vraies donnees)
    // On essaie de recuperer depuis info si disponible (via financials ou analysisData)
    // Pour l'instant on initialise a null pour eviter les fausses donnees
    // TODO: Connecter aux donnees reelles de FMP via info.financials quand disponibles
    const opMargin = info.financials?.incomeStatement?.[0]?.operatingIncomeRatio != null 
        ? info.financials.incomeStatement[0].operatingIncomeRatio * 100 
        : null;
    
    const netMargin = info.financials?.incomeStatement?.[0]?.netIncomeRatio != null 
        ? info.financials.incomeStatement[0].netIncomeRatio * 100 
        : null;

    // Ratio d'endettement (estime)
    const debtToEquity = info.financials?.balanceSheet?.[0]?.debtEquityRatio != null 
        ? info.financials.balanceSheet[0].debtEquityRatio 
        : null;

    // Taux de distribution dividende
    const payoutRatio = ((lastData?.dividendPerShare || 0) / (lastData?.earningsPerShare || 1)) * 100;

    // Rendement espere (formule Value Line) - Utiliser baseEPS au lieu de lastData pour coherence avec EvaluationDetails
    // Valider les entrees pour eviter les erreurs
    const safeGrowthRateEPS = Math.max(config.growth.min, Math.min(assumptions.growthRateEPS || 0, config.growth.max));
    const safeTargetPE = Math.max(config.ratios.pe.min, Math.min(assumptions.targetPE || 0, config.ratios.pe.max));
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

    // Multiple 3 ans - Utiliser le taux de croissance valide
    const multiple3Y = Math.pow(1 + safeGrowthRateEPS / 100, 3);

    // Prix limites (Achat/Vente)
    const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
    const floorPrice = avgLowPrice * 0.9;
    const buyLimit = floorPrice + (projectedPrice5Y - floorPrice) * 0.33;
    const sellLimit = projectedPrice5Y * 0.95;

    // Helper function pour obtenir la couleur et la position du JPEGY
    // Zones: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.2%)
    const getJpegyColor = (value: number | null): { textClass: string; bgClass: string; position: number } => {
        if (value === null || value <= 0) {
            return { textClass: 'text-gray-500', bgClass: 'bg-gray-100', position: 0 };
        }
        if (value <= 0.5) {
            // Vert pale (0 a 0.5) - 11.1% de la barre
            const position = (value / 0.5) * 11.1; // 0-11.1% de la barre
            return { textClass: 'text-green-300', bgClass: 'bg-green-100', position };
        } else if (value <= 1.5) {
            // Vert fonce (0.5 a 1.5) - 55.6% de la barre
            const position = 11.1 + ((value - 0.5) / 1.0) * 55.6; // 11.1-66.7% de la barre
            return { textClass: 'text-green-600', bgClass: 'bg-green-200', position };
        } else if (value <= 1.75) {
            // Jaune (1.5 a 1.75) - 5.6% de la barre
            const position = 66.7 + ((value - 1.5) / 0.25) * 5.6; // 66.7-72.3% de la barre
            return { textClass: 'text-yellow-500', bgClass: 'bg-yellow-100', position };
        } else if (value <= 2.0) {
            // Orange (1.75 a 2.0) - 5.6% de la barre
            const position = 72.3 + ((value - 1.75) / 0.25) * 5.6; // 72.3-77.9% de la barre
            return { textClass: 'text-orange-500', bgClass: 'bg-orange-200', position };
        } else {
            // Rouge (au-dessus de 2.0) - 22.2% de la barre
            const maxValue = 4.0;
            const position = Math.min(77.9 + ((value - 2.0) / (maxValue - 2.0)) * 22.2, 100);
            return { textClass: 'text-red-600', bgClass: 'bg-red-200', position };
        }
    };

    const jpegyColor = getJpegyColor(jpegy);
    const forwardJpegyColor = getJpegyColor(forwardJpegy);

    return (
        <div className="space-y-6">
            {/* Indicateur JPEGY */}
            <div className="bg-white p-5 rounded-lg shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center cursor-help" title="JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)\n\nMetrique proprietaire developpee par Jean-Sebastien (JSLAITM).\n\nFormule: P/E / (Croissance % + Yield %)\n\nPlus le ratio est bas, plus l'action est attractive.\n\nZones:\n- 0.0 - 0.5: Tres sous-evalue (vert pale)\n- 0.5 - 1.5: Sous-evalue a raisonnable (vert fonce)\n- 1.5 - 1.75: Legerement surevalue (jaune)\n- 1.75 - 2.0: Surevalue (orange)\n- > 2.0: Tres surevalue (rouge)">
                     JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Ratio = P/E / (Growth % + Yield %). Plus le ratio est bas, plus l'action est attractive.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* JPEGY (P/E Actuel) */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (P/E Actuel)</div>
                        <div className={`text-3xl font-bold mb-3 flex items-center gap-2 ${jpegy !== null ? jpegyColor.textClass : 'text-gray-500'}`}>
                            {jpegy !== null ? jpegy.toFixed(2) : (
                                <>
                                    <span>N/A</span>
                                    <span className="text-lg" title="JPEGY non calculable: EPS invalide ou (Growth + Yield) <= 0.01%"></span>
                                </>
                            )}
                        </div>
                        
                        {/* Zone de couleur avec indicateur */}
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3">
                            {/* Segments de couleur - proportions: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.1%) */}
                            <div className="absolute inset-0 flex">
                                <div className="bg-green-200 w-[11.1%]"></div>
                                <div className="bg-green-600 w-[55.6%]"></div>
                                <div className="bg-yellow-400 w-[5.6%]"></div>
                                <div className="bg-orange-500 w-[5.6%]"></div>
                                <div className="bg-red-600 w-[22.1%]"></div>
                            </div>
                            {/* Indicateur de position */}
                            {jpegy !== null && jpegy > 0 && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-black z-10 transition-all duration-300"
                                    style={{ left: `${jpegyColor.position}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                        {jpegy?.toFixed(2) ?? 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                            P/E: {currentPE > 0 ? currentPE.toFixed(2) : 'N/A'}x
                        </div>
                        <div className="text-xs text-gray-500">
                            {jpegy !== null ? (
                                <>Growth: {(assumptions.growthRateEPS || 0).toFixed(1)}% + Yield: {isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(2) : '0.00'}% = {isFinite(growthPlusYield) ? growthPlusYield.toFixed(2) : '0.00'}%</>
                            ) : (
                                <span className="text-orange-600"> JPEGY non calculable: EPS invalide ou (Growth + Yield) <= 0.01%</span>
                            )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-[10px] text-gray-400 space-y-1">
                                <div><strong>Source de calcul:</strong> P/E Actuel / (Taux de croissance EPS % + Rendement dividende %)</div>
                                <div><strong>Formule:</strong> JPEGY = {currentPE > 0 ? currentPE.toFixed(2) : 'P/E'} / ({(assumptions.growthRateEPS || 0).toFixed(1)}% + {isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(2) : '0.00'}%) = {jpegy !== null ? jpegy.toFixed(2) : 'N/A'}</div>
                                <div><strong>Fournisseur:</strong> Metrique proprietaire developpee par Jean-Sebastien (JSLAITM). Le fournisseur etablit cette metrique en ajustant le ratio P/E traditionnel par la somme du taux de croissance des benefices et du rendement du dividende, permettant une evaluation plus nuancee de la valorisation d'une action en tenant compte de sa capacite de croissance et de sa distribution de dividendes.</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* JPEGY (Forward P/E) */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600 mb-1">JPEGY (Forward P/E)</div>
                        <div className={`text-3xl font-bold mb-3 flex items-center gap-2 ${forwardJpegy !== null ? forwardJpegyColor.textClass : 'text-gray-500'}`}>
                            {forwardJpegy !== null ? forwardJpegy.toFixed(2) : (
                                <>
                                    <span>N/A</span>
                                    <span className="text-lg" title="Forward JPEGY non calculable: EPS invalide ou (Growth + Yield) <= 0.01%"></span>
                                </>
                            )}
                        </div>
                        
                        {/* Zone de couleur avec indicateur */}
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3">
                            {/* Segments de couleur - proportions: 0-0.5 (11.1%), 0.5-1.5 (55.6%), 1.5-1.75 (5.6%), 1.75-2.0 (5.6%), 2.0+ (22.1%) */}
                            <div className="absolute inset-0 flex">
                                <div className="bg-green-200 w-[11.1%]"></div>
                                <div className="bg-green-600 w-[55.6%]"></div>
                                <div className="bg-yellow-400 w-[5.6%]"></div>
                                <div className="bg-orange-500 w-[5.6%]"></div>
                                <div className="bg-red-600 w-[22.1%]"></div>
                            </div>
                            {/* Indicateur de position */}
                            {forwardJpegy !== null && forwardJpegy > 0 && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-black z-10 transition-all duration-300"
                                    style={{ left: `${forwardJpegyColor.position}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                        {forwardJpegy?.toFixed(2) ?? 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                            Forward P/E: {forwardPE > 0 ? forwardPE.toFixed(2) : 'N/A'}x
                        </div>
                        <div className="text-xs text-gray-500">
                            {forwardJpegy !== null ? (
                                <>Growth: {(assumptions.growthRateEPS || 0).toFixed(1)}% + Yield: {isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(2) : '0.00'}% = {isFinite(growthPlusYield) ? growthPlusYield.toFixed(2) : '0.00'}%</>
                            ) : (
                                <span className="text-orange-600"> Forward JPEGY non calculable: EPS invalide ou (Growth + Yield) <= 0.01%</span>
                            )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-[10px] text-gray-400 space-y-1">
                                <div><strong>Source de calcul:</strong> Forward P/E / (Taux de croissance EPS % + Rendement dividende %)</div>
                                <div><strong>Formule:</strong> Forward JPEGY = {forwardPE > 0 ? forwardPE.toFixed(2) : 'Forward P/E'} / ({(assumptions.growthRateEPS || 0).toFixed(1)}% + {isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(2) : '0.00'}%) = {forwardJpegy !== null ? forwardJpegy.toFixed(2) : 'N/A'}</div>
                                <div><strong>Fournisseur:</strong> Metrique proprietaire developpee par Jean-Sebastien (JSLAITM). Le fournisseur etablit cette metrique en utilisant le Forward P/E (base sur les benefices projetes) au lieu du P/E actuel, ajuste par la somme du taux de croissance des benefices et du rendement du dividende, offrant une perspective prospective de la valorisation.</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Legende des zones de couleur */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Legende des zones :</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-green-200 rounded"></div>
                            <span className="text-gray-600">0.0 - 0.5 (Vert pale)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-green-600 rounded"></div>
                            <span className="text-gray-600">0.5 - 1.5 (Vert fonce)</span>
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
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center cursor-help" title="Ratios Actuels vs Historiques\n\nCompare les ratios actuels avec les moyennes historiques.\n\nPermet de voir si l'action est:\n- Sous-evaluee (ratio actuel < historique)\n- Surevaluee (ratio actuel > historique)\n\nLes ratios verts indiquent une sous-evaluation relative.\nLes ratios rouges indiquent une surevaluation relative.">
                     Ratios Actuels vs Historiques
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-2 text-left">Metrique</th>
                                <th className="p-2 text-right">Actuel</th>
                                <th className="p-2 text-right">Historique Moyen</th>
                                <th className="p-2 text-right">Ecart</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="P/E (Price-to-Earnings)\n\nRatio Prix/Benefice actuel.\nSource: FMP key-metrics">P/E</td>
                                <td className="p-2 text-right cursor-help" title={`P/E Actuel: ${currentPE.toFixed(2)}x\n\nCalcule avec:\nPrix Actuel / BPA Actuel\n\n= ${formatCurrency(assumptions.currentPrice)} / ${baseEPS.toFixed(2)}\n\n= ${currentPE.toFixed(2)}x`}>{currentPE.toFixed(2)}</td>
                                <td className="p-2 text-right cursor-help" title={`P/E Historique Moyen: ${avgPE.toFixed(2)}x\n\nMoyenne des ratios P/E historiques calculee a partir des donnees des 10 dernieres annees.`}>{avgPE.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentPE < avgPE ? 'text-green-600' : 'text-red-600'}`} title={`Ecart: ${avgPE > 0 ? ((currentPE / avgPE - 1) * 100).toFixed(1) : '0.0'}%\n\n${currentPE < avgPE ? ' Sous-evalue par rapport a la moyenne historique' : ' Surevalue par rapport a la moyenne historique'}\n\nUn P/E inferieur a la moyenne historique peut indiquer une opportunite d'achat.`}>
                                    {avgPE > 0 ? ((currentPE / avgPE - 1) * 100).toFixed(1) : '0.0'}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="P/CF (Price-to-Cash Flow)\n\nRatio Prix/Cash Flow actuel.\nSource: FMP key-metrics">P/CF</td>
                                <td className="p-2 text-right cursor-help" title={`P/CF Actuel: ${currentPCF.toFixed(2)}x\n\nCalcule avec:\nPrix Actuel / Cash Flow par Action Actuel`}>{currentPCF.toFixed(2)}</td>
                                <td className="p-2 text-right cursor-help" title={`P/CF Historique Moyen: ${avgPCF.toFixed(2)}x\n\nMoyenne des ratios P/CF historiques calculee a partir des donnees des 10 dernieres annees.`}>{avgPCF.toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentPCF < avgPCF ? 'text-green-600' : 'text-red-600'}`} title={`Ecart: ${avgPCF > 0 ? ((currentPCF / avgPCF - 1) * 100).toFixed(1) : '0.0'}%\n\n${currentPCF < avgPCF ? ' Sous-evalue par rapport a la moyenne historique' : ' Surevalue par rapport a la moyenne historique'}`}>
                                    {avgPCF > 0 ? ((currentPCF / avgPCF - 1) * 100).toFixed(1) : '0.0'}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="P/BV (Price-to-Book Value)\n\nRatio Prix/Valeur Comptable actuel.\nSource: FMP key-metrics">P/BV</td>
                                <td className="p-2 text-right cursor-help" title={`P/BV Actuel: ${currentPBV.toFixed(2)}x\n\nCalcule avec:\nPrix Actuel / Book Value par Action Actuel`}>{currentPBV.toFixed(2)}</td>
                                <td className="p-2 text-right cursor-help" title={`P/BV Cible: ${(assumptions.targetPBV || 0).toFixed(2)}x\n\nRatio P/BV cible utilise pour vos projections a 5 ans.\nAuto-rempli avec la moyenne historique.`}>{(assumptions.targetPBV || 0).toFixed(2)}</td>
                                <td className={`p-2 text-right font-semibold cursor-help ${currentPBV < assumptions.targetPBV ? 'text-green-600' : 'text-red-600'}`} title={`Ecart: ${assumptions.targetPBV > 0 ? ((currentPBV / assumptions.targetPBV - 1) * 100).toFixed(1) : '0.0'}%\n\n${currentPBV < assumptions.targetPBV ? ' Sous-evalue par rapport au ratio cible' : ' Surevalue par rapport au ratio cible'}`}>
                                    {assumptions.targetPBV > 0 ? ((currentPBV / assumptions.targetPBV - 1) * 100).toFixed(1) : '0.0'}%
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 font-semibold cursor-help" title="Rendement DIV (Dividend Yield)\n\nRendement en dividendes actuel.\nSource: FMP key-metrics">Rendement DIV</td>
                                {/* BUG #3P1-2 FIX: Validation pour eviter NaN dans l'affichage */}
                                <td className="p-2 text-right cursor-help" title={`Yield Actuel: ${isFinite(currentYield) ? currentYield.toFixed(2) : 'N/A'}%\n\nCalcule avec:\n(Dividende Actuel / Prix Actuel) x 100`}>
                                  {isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(2) : 'N/A'}%
                                </td>
                                <td className="p-2 text-right cursor-help" title={`Yield Cible: ${(assumptions.targetYield || 0).toFixed(2)}%\n\nRendement en dividendes cible utilise pour vos projections a 5 ans.\nAuto-rempli avec la moyenne historique.`}>{(assumptions.targetYield || 0).toFixed(2)}%</td>
                                {/* BUG #3P1-2 FIX: Validation pour eviter NaN dans calcul d'ecart */}
                                <td className={`p-2 text-right font-semibold cursor-help ${isFinite(currentYield) && currentYield > assumptions.targetYield ? 'text-green-600' : 'text-red-600'}`} title={`Ecart: ${assumptions.targetYield > 0 && isFinite(currentYield) && !isNaN(currentYield) ? ((currentYield / assumptions.targetYield - 1) * 100).toFixed(1) : '0.0'}%\n\n${isFinite(currentYield) && currentYield > assumptions.targetYield ? ' Rendement superieur au rendement cible' : ' Rendement inferieur au rendement cible'}\n\nUn rendement superieur au cible peut indiquer une opportunite.`}>
                                    {assumptions.targetYield > 0 && isFinite(currentYield) && !isNaN(currentYield) ? ((currentYield / assumptions.targetYield - 1) * 100).toFixed(1) : '0.0'}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Marges et Qualite */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 cursor-help" title="Marges de Rentabilite\n\nMesurent l'efficacite operationnelle et la rentabilite de l'entreprise.\n\n- Marge Operationnelle: Efficacite operationnelle\n- Marge Nette: Rentabilite globale\n- Taux Distribution: Proportion des benefices distribues\n\nSource: FMP income-statement et key-metrics"> Marges</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between cursor-help" title={`Marge Operationnelle: ${opMargin !== null ? opMargin.toFixed(1) : 'N/A'}%\n\nFormule: (Resultat Operationnel / Chiffre d'Affaires) x 100\n\nMesure l'efficacite operationnelle de l'entreprise.\nSource: FMP income-statement`}>
                            <span className="text-gray-600">Marge Operationnelle</span>
                            <span className="font-semibold">{opMargin !== null ? `${opMargin.toFixed(1)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Marge Nette: ${netMargin !== null ? netMargin.toFixed(1) : 'N/A'}%\n\nFormule: (Benefice Net / Chiffre d'Affaires) x 100\n\nMesure la rentabilite globale de l'entreprise.\nSource: FMP income-statement`}>
                            <span className="text-gray-600">Marge Nette</span>
                            <span className="font-semibold">{netMargin !== null ? `${netMargin.toFixed(1)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Taux de Distribution (Payout Ratio): ${payoutRatio.toFixed(1)}%\n\nFormule: (Dividendes / Benefice Net) x 100\n\nMesure la proportion des benefices distribuee aux actionnaires.\nSource: FMP key-metrics`}>
                            <span className="text-gray-600">Taux Distribution DIV</span>
                            <span className="font-semibold">{payoutRatio.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 cursor-help" title="Structure Financiere\n\nMesure la sante financiere et l'efficacite d'utilisation des ressources.\n\n- Ratio d'Endettement: Niveau de dette\n- ROE: Rentabilite des capitaux propres\n- ROA: Efficacite d'utilisation des actifs\n\nSource: FMP balance-sheet-statement et key-metrics"> Structure Financiere</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between cursor-help" title={`Ratio d'Endettement (Debt-to-Equity): ${debtToEquity !== null ? debtToEquity.toFixed(2) : 'N/A'}\n\nFormule: Dette Totale / Capitaux Propres\n\nMesure le niveau d'endettement de l'entreprise.\nUn ratio eleve indique plus de risque financier.\nSource: FMP balance-sheet-statement`}>
                            <span className="text-gray-600">Ratio d'Endettement</span>
                            <span className="font-semibold">{debtToEquity !== null ? debtToEquity.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={info.roe !== null && info.roe !== undefined ? `ROE (Return on Equity): ${info.roe.toFixed(2)}%\n\nFormule: (Benefice Net / Capitaux Propres) x 100\n\nMesure la rentabilite des capitaux propres.\nUn ROE eleve indique une utilisation efficace des capitaux.\nSource: FMP key-metrics` : "ROE (Return on Equity): N/A\n\nDonnees non disponibles pour ce ticker.\nSource: FMP key-metrics"}>
                            <span className="text-gray-600">ROE</span>
                            <span className="font-semibold">
                                {info.roe !== null && info.roe !== undefined ? `${info.roe.toFixed(2)}%` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between cursor-help" title={info.roa !== null && info.roa !== undefined ? `ROA (Return on Assets): ${info.roa.toFixed(2)}%\n\nFormule: (Benefice Net / Actifs Totaux) x 100\n\nMesure l'efficacite d'utilisation des actifs.\nUn ROA eleve indique une bonne gestion des actifs.\nSource: FMP key-metrics` : "ROA (Return on Assets): N/A\n\nDonnees non disponibles pour ce ticker.\nSource: FMP key-metrics"}>
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
                            Source: FMP key-metrics (donnees non disponibles pour ce ticker)
                        </div>
                    )}
                </div>
            </div>

            {/* Rendement Espere (Value Line Style) */}
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                     Rendement Espere (5 ans)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-2 cursor-help" title={`Appreciation du Prix\n\nRendement annualise base uniquement sur l'appreciation du prix (sans dividendes).\n\nFormule:\n((Prix Projete / Prix Actuel)^(1/5) - 1) x 100\n\n= ${annualizedReturn.toFixed(1)}% / an\n\nTotal sur 5 ans: ${totalReturn.toFixed(1)}%`}>Appreciation du Prix</div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 cursor-help" title={`Appreciation annualisee: ${annualizedReturn.toFixed(1)}% / an\n\nCalculee avec:\n((Prix Projete (${formatCurrency(projectedPrice5Y)}) / Prix Actuel (${formatCurrency(assumptions.currentPrice)}))^(1/5) - 1) x 100\n\n= ${annualizedReturn.toFixed(1)}% / an\n\nTotal sur 5 ans: ${totalReturn.toFixed(1)}%`}>
                            {annualizedReturn.toFixed(1)}% / an
                        </div>
                        <div className="text-xs text-gray-500 mt-1 cursor-help" title={`Total sur 5 ans: ${totalReturn.toFixed(1)}%\n\nCalcule avec:\n((Prix Projete / Prix Actuel) - 1) x 100\n\n= ((${formatCurrency(projectedPrice5Y)} / ${formatCurrency(assumptions.currentPrice)}) - 1) x 100\n\n= ${totalReturn.toFixed(1)}%`}>
                            Total: {totalReturn.toFixed(1)}% sur 5 ans
                        </div>
                    </div>
                    <div>
                        {/* BUG #3P1-2 FIX: Validation pour eviter NaN dans tooltips et affichages */}
                        <div className="text-xs sm:text-sm text-gray-600 mb-2 cursor-help" title={`Rendement Total Espere\n\nRendement annualise incluant l'appreciation du prix ET les dividendes.\n\nFormule:\nAppreciation annualisee + Yield annuel\n\n= ${isFinite(annualizedReturn) ? annualizedReturn.toFixed(1) : '0.0'}% + ${isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(1) : '0.0'}%\n\n= ${isFinite(expectedReturn) ? expectedReturn.toFixed(1) : '0.0'}% / an`}>Rendement Total Espere</div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 cursor-help" title={`Rendement Total: ${isFinite(expectedReturn) ? expectedReturn.toFixed(1) : '0.0'}% / an\n\nDetail:\n- Appreciation: ${isFinite(annualizedReturn) ? annualizedReturn.toFixed(1) : '0.0'}% / an\n- Dividendes: ${isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(1) : '0.0'}% / an\n- Total: ${isFinite(expectedReturn) ? expectedReturn.toFixed(1) : '0.0'}% / an\n\nInclut les dividendes percus sur 5 ans.`}>
                            {isFinite(expectedReturn) && !isNaN(expectedReturn) ? expectedReturn.toFixed(1) : '0.0'}% / an
                        </div>
                        <div className="text-xs text-gray-500 mt-1 cursor-help" title={`Dividendes: ${isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(1) : '0.0'}% / an\n\nCalcule avec:\n(Dividende Actuel / Prix Actuel) x 100\n\n= (${(assumptions.currentDividend || 0).toFixed(2)} / ${formatCurrency(assumptions.currentPrice)}) x 100\n\n= ${isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(1) : '0.0'}% / an`}>
                            Incluant dividendes: {isFinite(currentYield) && !isNaN(currentYield) ? currentYield.toFixed(1) : '0.0'}% / an
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between cursor-help" title={`Prix Actuel: ${formatCurrency(assumptions.currentPrice)}\n\nPrix du marche en temps reel.\nSource: FMP API (quote)\n\nUtilise comme reference pour tous les calculs de rendement.`}>
                            <span className="text-gray-600">Prix Actuel</span>
                            <span className="font-semibold">{formatCurrency(assumptions.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Prix Projete (5 ans): ${formatCurrency(projectedPrice5Y)}\n\nCalcule avec:\nEPS Base (${baseEPS.toFixed(2)}) x (1 + ${safeGrowthRateEPS.toFixed(1)}%)5 x P/E Cible (${safeTargetPE.toFixed(1)}x)\n\n= ${formatCurrency(projectedPrice5Y)}\n\nBase sur vos hypotheses de croissance et de ratio P/E.`}>
                            <span className="text-gray-600">Prix Projete (5 ans)</span>
                            <span className="font-semibold">{formatCurrency(projectedPrice5Y)}</span>
                        </div>
                        <div className="flex justify-between cursor-help" title={`Multiple 3 ans: ${multiple3Y.toFixed(2)}x\n\nFacteur de croissance sur 3 ans base sur le taux de croissance EPS.\n\nFormule:\n(1 + Taux Croissance EPS / 100)3\n\n= (1 + ${safeGrowthRateEPS.toFixed(1)}% / 100)3\n\n= ${multiple3Y.toFixed(2)}x\n\nIndique le facteur de multiplication de la valeur sur 3 ans.`}>
                            <span className="text-gray-600">Multiple 3 ans</span>
                            <span className="font-semibold">{multiple3Y.toFixed(2)}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratio 3:1 (Potentiel de Rendement vs Potentiel de Baisse) */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4"> Ratio 3:1 (Potentiel vs Risque)</h3>
                <p className="text-xs text-gray-600 mb-4">
                    Le ratio 3:1 mesure le potentiel de rendement par rapport au risque de baisse. 
                    Un ratio >= 3:1 indique que le potentiel de hausse est au moins 3 fois superieur au risque de baisse.
                </p>
                {(() => {
                    // Calcul du risque de baisse (base sur le prix plancher historique)
                    const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
                    const floorPrice = avgLowPrice * 0.9;
                    const downsideRisk = assumptions.currentPrice > 0
                        ? ((assumptions.currentPrice - floorPrice) / assumptions.currentPrice) * 100
                        : 0;
                    
                    // Calcul du potentiel de hausse (base sur le rendement total) - Utiliser les valeurs validees
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
                                <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 cursor-help" title={`Potentiel de Hausse: ${upsidePotential.toFixed(1)}%\n\nCalcule avec:\n((Prix Projete - Prix Actuel) / Prix Actuel) x 100\n\n= ((${formatCurrency(projectedPrice5YLocal)} - ${formatCurrency(assumptions.currentPrice)}) / ${formatCurrency(assumptions.currentPrice)}) x 100\n\n= ${upsidePotential.toFixed(1)}%\n\nRepresente le gain potentiel si le prix atteint le prix projete.`}>
                                    <div className="text-xs text-green-700 font-semibold mb-1">Potentiel de Hausse</div>
                                    <div className="text-xl sm:text-2xl font-bold text-green-800">{upsidePotential.toFixed(1)}%</div>
                                    <div className="text-[10px] sm:text-xs text-green-600 mt-1 break-words">
                                        Prix projete: {formatCurrency(projectedPrice5YLocal)}
                                    </div>
                                </div>
                                <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200 cursor-help" title={`Risque de Baisse: ${downsideRisk.toFixed(1)}%\n\nCalcule avec:\n((Prix Actuel - Prix Plancher) / Prix Actuel) x 100\n\nPrix Plancher = Moyenne Prix Bas Historiques x 0.9\n= ${formatCurrency(avgLowPrice)} x 0.9 = ${formatCurrency(floorPrice)}\n\nRisque = ((${formatCurrency(assumptions.currentPrice)} - ${formatCurrency(floorPrice)}) / ${formatCurrency(assumptions.currentPrice)}) x 100\n\n= ${downsideRisk.toFixed(1)}%\n\nRepresente le risque de baisse jusqu'au prix plancher historique.`}>
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
                                            Formule: Potentiel de Hausse (%) / Risque de Baisse (%)
                                        </div>
                                    </div>
                                    <div className={`text-2xl sm:text-3xl md:text-4xl font-bold cursor-help ${
                                        isFavorable ? 'text-green-700' : 'text-yellow-700'
                                    }`} title={`Ratio 3:1: ${ratio31.toFixed(2)}:1\n\nFormule:\nPotentiel de Hausse (%) / Risque de Baisse (%)\n\n= ${upsidePotential.toFixed(1)}% / ${downsideRisk.toFixed(1)}%\n\n= ${ratio31.toFixed(2)}:1\n\n${isFavorable ? ' Favorable (>= 3:1): Le potentiel est au moins 3x superieur au risque' : ' Defavorable (< 3:1): Le risque est eleve par rapport au potentiel'}\n\nUn ratio >= 3:1 indique un bon rapport risque/rendement.`}>
                                        {ratio31.toFixed(2)}:1
                                    </div>
                                </div>
                                <div className={`mt-2 text-sm font-semibold ${
                                    isFavorable ? 'text-green-800' : 'text-yellow-800'
                                }`}>
                                    {isFavorable 
                                        ? ' Ratio favorable (>= 3:1) - Potentiel 3x superieur au risque'
                                        : ' Ratio defavorable (< 3:1) - Risque eleve par rapport au potentiel'
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Recommandation d'Achat/Vente */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4"> Zones de Prix Recommandees</h3>
                <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-green-800">Zone d'Achat</div>
                                <div className="text-sm text-gray-600">Prix attractif pour accumuler</div>
                            </div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 cursor-help break-words" title={`Zone d'Achat: <= ${formatCurrency(buyLimit)}\n\nCalcul:\nPrix Plancher + (Prix Cible 5 ans - Prix Plancher) x 33%\n\n= ${formatCurrency(floorPrice)} + (${formatCurrency(projectedPrice5Y)} - ${formatCurrency(floorPrice)}) x 33%\n\n= ${formatCurrency(buyLimit)}\n\nSi le prix actuel est <= ${formatCurrency(buyLimit)}, la recommandation est ACHAT.`}>
                                <= {formatCurrency(buyLimit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Hypotheses utilisees :</strong></div>
                                <div>- Prix plancher (floor) = {formatCurrency(avgLowPrice)} (moy. prix bas hist.) x 0.9 = {formatCurrency(floorPrice)}</div>
                                <div>- Prix cible 5 ans = {formatCurrency(baseEPS)} (EPS annee de base {assumptions.baseYear}) x (1 + {safeGrowthRateEPS.toFixed(1)}%)5 x {safeTargetPE.toFixed(1)}x (P/E cible) = {formatCurrency(projectedPrice5Y)}</div>
                                <div>- Limite d'achat = {formatCurrency(floorPrice)} + ({formatCurrency(projectedPrice5Y)} - {formatCurrency(floorPrice)}) x 33% = {formatCurrency(buyLimit)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-yellow-800">Zone de Conservation</div>
                                <div className="text-sm text-gray-600">Maintenir la position</div>
                            </div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 cursor-help break-words" title={`Zone de Conservation: ${formatCurrency(buyLimit)} - ${formatCurrency(sellLimit)}\n\nSi le prix actuel est entre ces deux limites, la recommandation est CONSERVER.\n\nLimite d'achat: ${formatCurrency(buyLimit)}\nLimite de vente: ${formatCurrency(sellLimit)} (Prix Cible 5 ans x 95%)`}>
                                {formatCurrency(buyLimit)} - {formatCurrency(sellLimit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-yellow-200">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Hypotheses utilisees :</strong></div>
                                <div>- Limite d'achat = {formatCurrency(buyLimit)} (voir Zone d'Achat)</div>
                                <div>- Limite de vente = {formatCurrency(projectedPrice5Y)} (prix cible 5 ans) x 95% = {formatCurrency(sellLimit)}</div>
                                <div>- Prix cible base sur : EPS {formatCurrency(baseEPS)} (annee {assumptions.baseYear}) x (1 + {safeGrowthRateEPS.toFixed(1)}%)5 x P/E {safeTargetPE.toFixed(1)}x</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-bold text-red-800">Zone de Vente</div>
                                <div className="text-sm text-gray-600">Prendre profits / Reduire</div>
                            </div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 cursor-help break-words" title={`Zone de Vente: >= ${formatCurrency(sellLimit)}\n\nCalcul:\nPrix Cible 5 ans x 95%\n\n= ${formatCurrency(projectedPrice5Y)} x 95%\n\n= ${formatCurrency(sellLimit)}\n\nSi le prix actuel est >= ${formatCurrency(sellLimit)}, la recommandation est VENTE (prendre profits).`}>
                                >= {formatCurrency(sellLimit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-red-200">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Hypotheses utilisees :</strong></div>
                                <div>- Prix cible 5 ans = {formatCurrency(baseEPS)} (EPS annee de base {assumptions.baseYear}) x (1 + {safeGrowthRateEPS.toFixed(1)}%)5 x {safeTargetPE.toFixed(1)}x (P/E cible) = {formatCurrency(projectedPrice5Y)}</div>
                                <div>- Limite de vente = {formatCurrency(projectedPrice5Y)} x 95% = {formatCurrency(sellLimit)}</div>
                                <div>- Base sur projection 5 ans avec croissance EPS {safeGrowthRateEPS.toFixed(1)}% et P/E cible {safeTargetPE.toFixed(1)}x</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                        <strong>Position Actuelle :</strong> <span className="cursor-help" title={`Prix Actuel: ${formatCurrency(assumptions.currentPrice)}\n\nCompare aux zones:\n- Zone d'Achat: <= ${formatCurrency(buyLimit)}\n- Zone de Conservation: ${formatCurrency(buyLimit)} - ${formatCurrency(sellLimit)}\n- Zone de Vente: >= ${formatCurrency(sellLimit)}\n\nRecommandation basee sur la position actuelle par rapport a ces zones.`}>{formatCurrency(assumptions.currentPrice)}</span>
                        {assumptions.currentPrice <= buyLimit && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded font-semibold cursor-help" title={`Recommandation: ACHAT\n\nLe prix actuel (${formatCurrency(assumptions.currentPrice)}) est dans la zone d'achat (<= ${formatCurrency(buyLimit)}).\n\nC'est un prix attractif pour accumuler des positions.`}>ACHAT</span>
                        )}
                        {assumptions.currentPrice > buyLimit && assumptions.currentPrice < sellLimit && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold cursor-help" title={`Recommandation: CONSERVER\n\nLe prix actuel (${formatCurrency(assumptions.currentPrice)}) est dans la zone de conservation (${formatCurrency(buyLimit)} - ${formatCurrency(sellLimit)}).\n\nMaintenez votre position actuelle.`}>CONSERVER</span>
                        )}
                        {assumptions.currentPrice >= sellLimit && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded font-semibold cursor-help" title={`Recommandation: VENDRE\n\nLe prix actuel (${formatCurrency(assumptions.currentPrice)}) est dans la zone de vente (>= ${formatCurrency(sellLimit)}).\n\nConsiderez prendre des profits ou reduire votre position.`}>VENDRE</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

