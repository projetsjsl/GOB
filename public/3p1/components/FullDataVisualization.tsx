import React, { useMemo } from 'react';
import { AnnualData, Assumptions, CompanyInfo } from '../types';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  ScatterChart, Scatter, ComposedChart, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { formatCurrency, formatPercent, calculateRowRatios } from '../utils/calculations';
import { TrendingUpIcon, TrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface FullDataVisualizationProps {
  data: AnnualData[];
  assumptions: Assumptions;
  info: CompanyInfo;
}

export const FullDataVisualization: React.FC<FullDataVisualizationProps> = ({ 
  data, 
  assumptions, 
  info 
}) => {
  // Preparer toutes les donnees pour visualisation
  const visualizationData = useMemo(() => {
    return data.map(row => {
      const ratios = calculateRowRatios(row);
      return {
        year: row.year,
        // Donnees financieres
        EPS: row.earningsPerShare,
        CF: row.cashFlowPerShare,
        BV: row.bookValuePerShare,
        DIV: row.dividendPerShare,
        // Prix
        PriceHigh: row.priceHigh,
        PriceLow: row.priceLow,
        PriceAvg: (row.priceHigh + row.priceLow) / 2,
        // Ratios
        PE_High: ratios.peHigh,
        PE_Low: ratios.peLow,
        PE_Avg: (ratios.peHigh + ratios.peLow) / 2,
        PCF_High: ratios.pcfHigh,
        PCF_Low: ratios.pcfLow,
        PCF_Avg: (ratios.pcfHigh + ratios.pcfLow) / 2,
        PBV_High: ratios.pbvHigh,
        PBV_Low: ratios.pbvLow,
        PBV_Avg: (ratios.pbvHigh + ratios.pbvLow) / 2,
        Yield: ratios.yield,
        // Croissance (calculee)
        EPS_Growth: row.year > data[0]?.year 
          ? ((row.earningsPerShare - (data.find(d => d.year === row.year - 1)?.earningsPerShare || 0)) / 
             Math.max(data.find(d => d.year === row.year - 1)?.earningsPerShare || 1, 0.01)) * 100
          : 0,
        CF_Growth: row.year > data[0]?.year
          ? ((row.cashFlowPerShare - (data.find(d => d.year === row.year - 1)?.cashFlowPerShare || 0)) / 
             Math.max(data.find(d => d.year === row.year - 1)?.cashFlowPerShare || 1, 0.01)) * 100
          : 0,
        // Flags
        isEstimate: row.isEstimate || false
      };
    });
  }, [data]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const epsValues = data.map(d => d.earningsPerShare).filter(v => v > 0);
    const cfValues = data.map(d => d.cashFlowPerShare).filter(v => v > 0);
    const bvValues = data.map(d => d.bookValuePerShare).filter(v => v > 0);
    
    const calculateStats = (values: number[]) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0 };
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      return { avg, min, max, stdDev };
    };

    return {
      eps: calculateStats(epsValues),
      cf: calculateStats(cfValues),
      bv: calculateStats(bvValues)
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6" />
          Visualisation Complete des Donnees - {info.symbol}
        </h2>
        <p className="text-indigo-100 text-sm mt-1">
          Analyse visuelle complete de toutes les donnees historiques, ratios et metriques
        </p>
      </div>

      {/* Graphique 1: Donnees Financieres Principales */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Donnees Financieres Principales</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visualizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name.includes('Growth')) return formatPercent(value);
                  return formatCurrency(value);
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="EPS" fill="#3b82f6" fillOpacity={0.6} stroke="#3b82f6" name="EPS" />
              <Area yAxisId="left" type="monotone" dataKey="CF" fill="#10b981" fillOpacity={0.6} stroke="#10b981" name="CF" />
              <Area yAxisId="left" type="monotone" dataKey="BV" fill="#f59e0b" fillOpacity={0.6} stroke="#f59e0b" name="BV" />
              <Line yAxisId="left" type="monotone" dataKey="DIV" stroke="#ef4444" strokeWidth={2} name="DIV" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 2: Prix et Plages */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Evolution des Prix (High/Low/Avg)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visualizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="PriceLow" fill="#93c5fd" name="Prix Low" />
              <Bar dataKey="PriceHigh" fill="#3b82f6" name="Prix High" />
              <Line type="monotone" dataKey="PriceAvg" stroke="#1e40af" strokeWidth={3} name="Prix Moyen" />
              <Line 
                type="monotone" 
                dataKey={() => assumptions.currentPrice} 
                stroke="#16a34a" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                name="Prix Actuel"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 3: Ratios P/E, P/CF, P/BV */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Ratios de Valorisation</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visualizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="PE_Avg" stroke="#3b82f6" strokeWidth={2} name="P/E Moyen" />
              <Line type="monotone" dataKey="PCF_Avg" stroke="#10b981" strokeWidth={2} name="P/CF Moyen" />
              <Line type="monotone" dataKey="PBV_Avg" stroke="#f59e0b" strokeWidth={2} name="P/BV Moyen" />
              <Line 
                type="monotone" 
                dataKey={() => assumptions.targetPE} 
                stroke="#3b82f6" 
                strokeDasharray="5 5"
                strokeWidth={1}
                name="P/E Cible"
              />
              <Line 
                type="monotone" 
                dataKey={() => assumptions.targetPCF} 
                stroke="#10b981" 
                strokeDasharray="5 5"
                strokeWidth={1}
                name="P/CF Cible"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 4: Croissance */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Taux de Croissance Annuel</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visualizationData.filter(d => d.year > data[0]?.year)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatPercent(value)} />
              <Legend />
              <Bar dataKey="EPS_Growth" fill="#3b82f6" name="Croissance EPS" />
              <Bar dataKey="CF_Growth" fill="#10b981" name="Croissance CF" />
              <Line 
                type="monotone" 
                dataKey={() => assumptions.growthRateEPS} 
                stroke="#1e40af" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Croissance EPS Cible"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 5: Scatter Plot Ratios vs Prix */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Correlation Ratios vs Prix</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={visualizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="PE_Avg" name="P/E" />
              <YAxis dataKey="PriceAvg" name="Prix" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Donnees" dataKey="PriceAvg" fill="#3b82f6">
                {visualizationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isEstimate ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistiques Resumees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-semibold mb-2">EPS - Statistiques</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Moyenne:</span>
              <span className="font-bold">{formatCurrency(stats.eps.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span>Min:</span>
              <span>{formatCurrency(stats.eps.min)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max:</span>
              <span>{formatCurrency(stats.eps.max)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ecart-type:</span>
              <span>{formatCurrency(stats.eps.stdDev)}</span>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-semibold mb-2">CF - Statistiques</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Moyenne:</span>
              <span className="font-bold">{formatCurrency(stats.cf.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span>Min:</span>
              <span>{formatCurrency(stats.cf.min)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max:</span>
              <span>{formatCurrency(stats.cf.max)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ecart-type:</span>
              <span>{formatCurrency(stats.cf.stdDev)}</span>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600 font-semibold mb-2">BV - Statistiques</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Moyenne:</span>
              <span className="font-bold">{formatCurrency(stats.bv.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span>Min:</span>
              <span>{formatCurrency(stats.bv.min)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max:</span>
              <span>{formatCurrency(stats.bv.max)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ecart-type:</span>
              <span>{formatCurrency(stats.bv.stdDev)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

