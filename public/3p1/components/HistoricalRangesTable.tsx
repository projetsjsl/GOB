import React, { useMemo } from 'react';
import { AnnualData, CompanyInfo, Assumptions } from '../types';
import { calculateCAGR, projectFutureValue } from '../utils/calculations';

interface HistoricalRangesTableProps {
  data: AnnualData[];
  info: CompanyInfo;
  sector?: string;
  assumptions: Assumptions;
}

interface Range {
  min: number;
  max: number;
  avg: number;
  current?: number;
}

export const HistoricalRangesTable: React.FC<HistoricalRangesTableProps> = ({ data, info, sector, assumptions }) => {
  
  // Calculer les intervalles historiques du titre
  const titleRanges = useMemo(() => {
    const validData = data.filter(d => d.priceHigh > 0 && d.priceLow > 0 && d.earningsPerShare > 0);
    
    if (validData.length === 0) {
      return null;
    }

    // Calculer les ratios P/E historiques
    const peRatios: number[] = [];
    const pcfRatios: number[] = [];
    const pbvRatios: number[] = [];
    const yields: number[] = [];
    const epsGrowthRates: number[] = [];
    const cfGrowthRates: number[] = [];
    const bvGrowthRates: number[] = [];
    const divGrowthRates: number[] = [];

    validData.forEach((row, idx) => {
      if (row.earningsPerShare > 0) {
        const peHigh = row.priceHigh / row.earningsPerShare;
        const peLow = row.priceLow / row.earningsPerShare;
        peRatios.push(peHigh, peLow);
      }

      if (row.cashFlowPerShare > 0) {
        const pcfHigh = row.priceHigh / row.cashFlowPerShare;
        const pcfLow = row.priceLow / row.cashFlowPerShare;
        pcfRatios.push(pcfHigh, pcfLow);
      }

      if (row.bookValuePerShare > 0) {
        const pbvHigh = row.priceHigh / row.bookValuePerShare;
        const pbvLow = row.priceLow / row.bookValuePerShare;
        pbvRatios.push(pbvHigh, pbvLow);
      }

      if (row.priceHigh > 0 && row.dividendPerShare > 0) {
        const yieldValue = (row.dividendPerShare / row.priceHigh) * 100;
        yields.push(yieldValue);
      }

      // Calculer les taux de croissance entre années consécutives
      if (idx > 0) {
        const prevRow = validData[idx - 1];
        
        if (prevRow.earningsPerShare > 0 && row.earningsPerShare > 0) {
          const growth = ((row.earningsPerShare - prevRow.earningsPerShare) / prevRow.earningsPerShare) * 100;
          epsGrowthRates.push(growth);
        }

        if (prevRow.cashFlowPerShare > 0 && row.cashFlowPerShare > 0) {
          const growth = ((row.cashFlowPerShare - prevRow.cashFlowPerShare) / prevRow.cashFlowPerShare) * 100;
          cfGrowthRates.push(growth);
        }

        if (prevRow.bookValuePerShare > 0 && row.bookValuePerShare > 0) {
          const growth = ((row.bookValuePerShare - prevRow.bookValuePerShare) / prevRow.bookValuePerShare) * 100;
          bvGrowthRates.push(growth);
        }

        if (prevRow.dividendPerShare > 0 && row.dividendPerShare > 0) {
          const growth = ((row.dividendPerShare - prevRow.dividendPerShare) / prevRow.dividendPerShare) * 100;
          divGrowthRates.push(growth);
        }
      }
    });

    // Calculer CAGR sur toute la période
    const firstRow = validData[0];
    const lastRow = validData[validData.length - 1];
    const yearsDiff = lastRow.year - firstRow.year;

    const epsCAGR = firstRow.earningsPerShare > 0 && lastRow.earningsPerShare > 0
      ? calculateCAGR(firstRow.earningsPerShare, lastRow.earningsPerShare, yearsDiff)
      : null;
    
    const cfCAGR = firstRow.cashFlowPerShare > 0 && lastRow.cashFlowPerShare > 0
      ? calculateCAGR(firstRow.cashFlowPerShare, lastRow.cashFlowPerShare, yearsDiff)
      : null;
    
    const bvCAGR = firstRow.bookValuePerShare > 0 && lastRow.bookValuePerShare > 0
      ? calculateCAGR(firstRow.bookValuePerShare, lastRow.bookValuePerShare, yearsDiff)
      : null;
    
    const divCAGR = firstRow.dividendPerShare > 0 && lastRow.dividendPerShare > 0
      ? calculateCAGR(firstRow.dividendPerShare, lastRow.dividendPerShare, yearsDiff)
      : null;

    const calculateRange = (values: number[]): Range | null => {
      if (values.length === 0) return null;
      const filtered = values.filter(v => isFinite(v) && v > -100 && v < 1000); // Filtrer valeurs aberrantes
      if (filtered.length === 0) return null;
      return {
        min: Math.min(...filtered),
        max: Math.max(...filtered),
        avg: filtered.reduce((a, b) => a + b, 0) / filtered.length
      };
    };

    return {
      pe: calculateRange(peRatios),
      pcf: calculateRange(pcfRatios),
      pbv: calculateRange(pbvRatios),
      yield: calculateRange(yields),
      epsGrowth: epsCAGR !== null ? { min: epsCAGR, max: epsCAGR, avg: epsCAGR } : calculateRange(epsGrowthRates),
      cfGrowth: cfCAGR !== null ? { min: cfCAGR, max: cfCAGR, avg: cfCAGR } : calculateRange(cfGrowthRates),
      bvGrowth: bvCAGR !== null ? { min: bvCAGR, max: bvCAGR, avg: bvCAGR } : calculateRange(bvGrowthRates),
      divGrowth: divCAGR !== null ? { min: divCAGR, max: divCAGR, avg: divCAGR } : calculateRange(divGrowthRates)
    };
  }, [data]);

  // Valeurs de référence sectorielles (à remplacer par données réelles plus tard)
  const sectorRanges = useMemo(() => {
    // Valeurs typiques par secteur (peuvent être remplacées par API)
    const sectorDefaults: Record<string, any> = {
      'Technology': {
        pe: { min: 15, max: 35, avg: 25 },
        pcf: { min: 12, max: 28, avg: 20 },
        pbv: { min: 3, max: 8, avg: 5.5 },
        yield: { min: 0.5, max: 2.5, avg: 1.5 },
        epsGrowth: { min: 8, max: 20, avg: 14 },
        cfGrowth: { min: 8, max: 20, avg: 14 },
        bvGrowth: { min: 5, max: 15, avg: 10 },
        divGrowth: { min: 0, max: 10, avg: 5 }
      },
      'Financials': {
        pe: { min: 8, max: 18, avg: 12 },
        pcf: { min: 6, max: 15, avg: 10 },
        pbv: { min: 0.8, max: 2.5, avg: 1.5 },
        yield: { min: 2, max: 5, avg: 3.5 },
        epsGrowth: { min: 5, max: 12, avg: 8 },
        cfGrowth: { min: 5, max: 12, avg: 8 },
        bvGrowth: { min: 3, max: 10, avg: 6 },
        divGrowth: { min: 2, max: 8, avg: 5 }
      },
      'Healthcare': {
        pe: { min: 18, max: 40, avg: 28 },
        pcf: { min: 15, max: 32, avg: 23 },
        pbv: { min: 4, max: 10, avg: 7 },
        yield: { min: 0, max: 2, avg: 1 },
        epsGrowth: { min: 10, max: 25, avg: 17 },
        cfGrowth: { min: 10, max: 25, avg: 17 },
        bvGrowth: { min: 8, max: 18, avg: 13 },
        divGrowth: { min: 0, max: 5, avg: 2 }
      },
      'Consumer': {
        pe: { min: 12, max: 25, avg: 18 },
        pcf: { min: 10, max: 22, avg: 16 },
        pbv: { min: 2, max: 6, avg: 4 },
        yield: { min: 1.5, max: 4, avg: 2.5 },
        epsGrowth: { min: 6, max: 15, avg: 10 },
        cfGrowth: { min: 6, max: 15, avg: 10 },
        bvGrowth: { min: 4, max: 12, avg: 8 },
        divGrowth: { min: 3, max: 8, avg: 5 }
      },
      'Energy': {
        pe: { min: 8, max: 20, avg: 14 },
        pcf: { min: 5, max: 15, avg: 10 },
        pbv: { min: 1, max: 3, avg: 2 },
        yield: { min: 3, max: 7, avg: 5 },
        epsGrowth: { min: -5, max: 15, avg: 5 },
        cfGrowth: { min: -5, max: 15, avg: 5 },
        bvGrowth: { min: 2, max: 10, avg: 6 },
        divGrowth: { min: 2, max: 10, avg: 6 }
      }
    };

    // Essayer de trouver le secteur dans les defaults
    const sectorKey = sector || info.sector || '';
    const normalizedSector = sectorKey.toLowerCase();
    
    // Mapping des secteurs
    let matchedSector = null;
    if (normalizedSector.includes('tech') || normalizedSector.includes('technologie')) {
      matchedSector = sectorDefaults['Technology'];
    } else if (normalizedSector.includes('finance') || normalizedSector.includes('financial')) {
      matchedSector = sectorDefaults['Financials'];
    } else if (normalizedSector.includes('health') || normalizedSector.includes('santé')) {
      matchedSector = sectorDefaults['Healthcare'];
    } else if (normalizedSector.includes('consumer') || normalizedSector.includes('consommation')) {
      matchedSector = sectorDefaults['Consumer'];
    } else if (normalizedSector.includes('energy') || normalizedSector.includes('énergie')) {
      matchedSector = sectorDefaults['Energy'];
    }

    // Valeurs par défaut génériques si secteur non trouvé
    return matchedSector || {
      pe: { min: 10, max: 25, avg: 17 },
      pcf: { min: 8, max: 20, avg: 14 },
      pbv: { min: 2, max: 6, avg: 4 },
      yield: { min: 1, max: 4, avg: 2.5 },
      epsGrowth: { min: 5, max: 15, avg: 10 },
      cfGrowth: { min: 5, max: 15, avg: 10 },
      bvGrowth: { min: 3, max: 12, avg: 7 },
      divGrowth: { min: 1, max: 8, avg: 4 }
    };
  }, [sector, info.sector]);

  // Calculer les projections 5 ans pour le titre (basées sur les assumptions actuelles)
  const title5YearProjections = useMemo(() => {
    if (!titleRanges) return null;

    // Utiliser les valeurs de base actuelles depuis les assumptions
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
    const baseEPS = baseYearData?.earningsPerShare || 0;
    const baseCF = baseYearData?.cashFlowPerShare || 0;
    const baseBV = baseYearData?.bookValuePerShare || 0;
    const baseDiv = assumptions.currentDividend || 0;

    // Projections 5 ans avec les taux de croissance actuels
    const eps5Y = projectFutureValue(baseEPS, assumptions.growthRateEPS, 5);
    const cf5Y = projectFutureValue(baseCF, assumptions.growthRateCF, 5);
    const bv5Y = projectFutureValue(baseBV, assumptions.growthRateBV, 5);
    const div5Y = projectFutureValue(baseDiv, assumptions.growthRateDiv, 5);

    // Calculer les ratios projetés
    const targetPriceEPS = eps5Y * assumptions.targetPE;
    const targetPriceCF = cf5Y * assumptions.targetPCF;
    const targetPriceBV = bv5Y * assumptions.targetPBV;
    const targetPriceDiv = assumptions.targetYield > 0 ? div5Y / (assumptions.targetYield / 100) : 0;

    // Pour les ratios, utiliser les ratios cibles actuels
    return {
      pe: { min: assumptions.targetPE * 0.9, max: assumptions.targetPE * 1.1, avg: assumptions.targetPE },
      pcf: { min: assumptions.targetPCF * 0.9, max: assumptions.targetPCF * 1.1, avg: assumptions.targetPCF },
      pbv: { min: assumptions.targetPBV * 0.9, max: assumptions.targetPBV * 1.1, avg: assumptions.targetPBV },
      yield: { min: assumptions.targetYield * 0.9, max: assumptions.targetYield * 1.1, avg: assumptions.targetYield },
      epsGrowth: { min: assumptions.growthRateEPS * 0.8, max: assumptions.growthRateEPS * 1.2, avg: assumptions.growthRateEPS },
      cfGrowth: { min: assumptions.growthRateCF * 0.8, max: assumptions.growthRateCF * 1.2, avg: assumptions.growthRateCF },
      bvGrowth: { min: assumptions.growthRateBV * 0.8, max: assumptions.growthRateBV * 1.2, avg: assumptions.growthRateBV },
      divGrowth: { min: assumptions.growthRateDiv * 0.8, max: assumptions.growthRateDiv * 1.2, avg: assumptions.growthRateDiv }
    };
  }, [titleRanges, assumptions, data]);

  // Projections 5 ans typiques pour le secteur (basées sur les moyennes sectorielles)
  const sector5YearProjections = useMemo(() => {
    // Utiliser les moyennes sectorielles comme base pour les projections
    return {
      pe: { min: sectorRanges.pe.avg * 0.9, max: sectorRanges.pe.avg * 1.1, avg: sectorRanges.pe.avg },
      pcf: { min: sectorRanges.pcf.avg * 0.9, max: sectorRanges.pcf.avg * 1.1, avg: sectorRanges.pcf.avg },
      pbv: { min: sectorRanges.pbv.avg * 0.9, max: sectorRanges.pbv.avg * 1.1, avg: sectorRanges.pbv.avg },
      yield: { min: sectorRanges.yield.avg * 0.9, max: sectorRanges.yield.avg * 1.1, avg: sectorRanges.yield.avg },
      epsGrowth: { min: sectorRanges.epsGrowth.avg * 0.8, max: sectorRanges.epsGrowth.avg * 1.2, avg: sectorRanges.epsGrowth.avg },
      cfGrowth: { min: sectorRanges.cfGrowth.avg * 0.8, max: sectorRanges.cfGrowth.avg * 1.2, avg: sectorRanges.cfGrowth.avg },
      bvGrowth: { min: sectorRanges.bvGrowth.avg * 0.8, max: sectorRanges.bvGrowth.avg * 1.2, avg: sectorRanges.bvGrowth.avg },
      divGrowth: { min: sectorRanges.divGrowth.avg * 0.8, max: sectorRanges.divGrowth.avg * 1.2, avg: sectorRanges.divGrowth.avg }
    };
  }, [sectorRanges]);

  const formatRange = (range: Range | null, suffix: string = '') => {
    if (!range) return 'N/A';
    return `${range.min.toFixed(1)} - ${range.max.toFixed(1)}${suffix} (moy: ${range.avg.toFixed(1)}${suffix})`;
  };

  const formatGrowthRange = (range: Range | null) => {
    if (!range) return 'N/A';
    return `${range.min.toFixed(1)}% - ${range.max.toFixed(1)}% (moy: ${range.avg.toFixed(1)}%)`;
  };

  if (!titleRanges) {
    return (
      <div className="bg-white p-5 rounded-lg shadow border border-gray-200 mt-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Intervalles de Référence</h3>
        <p className="text-sm text-gray-500">Données insuffisantes pour calculer les intervalles historiques</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-200 mt-6 print-break-inside-avoid">
      <h3 className="text-lg font-bold text-gray-700 mb-4">
        📊 Intervalles de Référence Historiques
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Utilisez ces intervalles pour guider vos hypothèses (champs orange). Les valeurs du titre sont calculées à partir de vos données historiques. Les valeurs du secteur sont des références typiques.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-2 text-left border">Métrique</th>
              <th className="p-2 border bg-blue-50">Titre Historique</th>
              <th className="p-2 border bg-purple-50">Secteur Typique</th>
              <th className="p-2 border bg-green-50">5 Ans Titre</th>
              <th className="p-2 border bg-yellow-50">5 Ans Secteur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* P/E Ratio */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">P/E Ratio</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatRange(titleRanges.pe, 'x')}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatRange(sectorRanges.pe, 'x')}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatRange(title5YearProjections.pe, 'x') : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatRange(sector5YearProjections.pe, 'x')}
              </td>
            </tr>

            {/* P/CF Ratio */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">P/CF Ratio</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatRange(titleRanges.pcf, 'x')}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatRange(sectorRanges.pcf, 'x')}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatRange(title5YearProjections.pcf, 'x') : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatRange(sector5YearProjections.pcf, 'x')}
              </td>
            </tr>

            {/* P/BV Ratio */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">P/BV Ratio</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatRange(titleRanges.pbv, 'x')}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatRange(sectorRanges.pbv, 'x')}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatRange(title5YearProjections.pbv, 'x') : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatRange(sector5YearProjections.pbv, 'x')}
              </td>
            </tr>

            {/* Dividend Yield */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">Dividend Yield</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatRange(titleRanges.yield, '%')}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatRange(sectorRanges.yield, '%')}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatRange(title5YearProjections.yield, '%') : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatRange(sector5YearProjections.yield, '%')}
              </td>
            </tr>

            {/* EPS Growth */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">Croissance BPA (EPS)</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatGrowthRange(titleRanges.epsGrowth)}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatGrowthRange(sectorRanges.epsGrowth)}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatGrowthRange(title5YearProjections.epsGrowth) : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatGrowthRange(sector5YearProjections.epsGrowth)}
              </td>
            </tr>

            {/* CF Growth */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">Croissance CFA</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatGrowthRange(titleRanges.cfGrowth)}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatGrowthRange(sectorRanges.cfGrowth)}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatGrowthRange(title5YearProjections.cfGrowth) : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatGrowthRange(sector5YearProjections.cfGrowth)}
              </td>
            </tr>

            {/* BV Growth */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">Croissance BV</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatGrowthRange(titleRanges.bvGrowth)}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatGrowthRange(sectorRanges.bvGrowth)}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatGrowthRange(title5YearProjections.bvGrowth) : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatGrowthRange(sector5YearProjections.bvGrowth)}
              </td>
            </tr>

            {/* Dividend Growth */}
            <tr>
              <td className="p-3 text-left font-bold text-gray-700 border">Croissance Dividende</td>
              <td className="p-3 text-center border bg-blue-50 text-blue-800">
                {formatGrowthRange(titleRanges.divGrowth)}
              </td>
              <td className="p-3 text-center border bg-purple-50 text-purple-800">
                {formatGrowthRange(sectorRanges.divGrowth)}
              </td>
              <td className="p-3 text-center border bg-green-50 text-green-800">
                {title5YearProjections ? formatGrowthRange(title5YearProjections.divGrowth) : 'N/A'}
              </td>
              <td className="p-3 text-center border bg-yellow-50 text-yellow-800">
                {formatGrowthRange(sector5YearProjections.divGrowth)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Titre Historique:</strong> Calculé à partir de vos données historiques ({data[0]?.year || 'N/A'} - {data[data.length - 1]?.year || 'N/A'})</p>
        <p><strong>Secteur Typique:</strong> Valeurs de référence pour le secteur {info.sector || 'non spécifié'}</p>
        <p><strong>5 Ans Titre:</strong> Projections basées sur vos hypothèses actuelles (champs orange)</p>
        <p><strong>5 Ans Secteur:</strong> Projections typiques pour le secteur basées sur les moyennes sectorielles</p>
      </div>
    </div>
  );
};

