import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  LineChart, Line, CartesianGrid, Legend, Brush, ComposedChart
} from 'recharts';
import { AnnualData, Recommendation } from '../types';
import { calculateRowRatios, formatCurrency } from '../utils/calculations';

interface ValuationChartsProps {
  history: AnnualData[];
  currentPrice: number;
  buyPrice: number;
  sellPrice: number;
  recommendation: Recommendation;
  targetPrice: number;
}

const CustomTooltipPriceRange = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // We need to find the specific payload items for low and spread to reconstruct High
    // However, since we pass the full data object in payload, we can access it directly
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
        <p className="font-bold text-gray-700 mb-2">{label}</p>
        <p className="text-sm text-blue-600">
          <span className="font-semibold">Haut:</span> {formatCurrency(data.high)}
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Bas:</span> {formatCurrency(data.low)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
            Écart: {formatCurrency(data.high - data.low)}
        </p>
      </div>
    );
  }
  return null;
};

export const ValuationCharts: React.FC<ValuationChartsProps> = ({
  history,
  currentPrice,
  buyPrice,
  sellPrice,
  recommendation,
  targetPrice
}) => {
  
  // Prepare data for range chart
  const rangeData = [
    {
      name: 'Zone',
      buy: buyPrice,
      hold: sellPrice - buyPrice,
      sell: (sellPrice * 1.2) - sellPrice, // visual cap
    }
  ];

  // Prepare data for Price Range Bar Chart
  const priceRangeBarData = history
    .filter(row => row.priceHigh > 0)
    .map(row => ({
      year: row.year,
      low: row.priceLow,
      spread: row.priceHigh - row.priceLow,
      high: row.priceHigh, // kept for tooltip
      current: currentPrice // for reference
    }));

  // Helper for color based on recommendation
  const getRecColor = (rec: Recommendation) => {
    switch(rec) {
      case Recommendation.BUY: return '#16a34a'; // green-600
      case Recommendation.SELL: return '#dc2626'; // red-600
      default: return '#ca8a04'; // yellow-600
    }
  };

  // Prepare data for Ratios Chart
  const ratioData = history
    .filter(row => row.priceHigh > 0 && row.priceLow > 0)
    .map(row => {
      const ratios = calculateRowRatios(row);
      return {
        year: row.year,
        avgPE: (ratios.peHigh + ratios.peLow) / 2,
        avgPCF: (ratios.pcfHigh + ratios.pcfLow) / 2,
      };
    });

  return (
    <div className="flex flex-col gap-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Evolution Chart */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Historique Prix vs BPA</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#2563eb" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#dc2626" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="priceHigh" stroke="#93c5fd" name="Prix Haut" dot={false} strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="priceLow" stroke="#1e40af" name="Prix Bas" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="earningsPerShare" stroke="#dc2626" name="BPA (EPS)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Valuation Gauge / Range */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Positionnement Prix Actuel</h3>
          <div className="flex-1 flex flex-col justify-center">
              <div className="h-16 relative mb-8 mt-4">
                  {/* Custom Range Bar */}
                  <div className="absolute left-0 right-0 top-0 bottom-0 rounded-full overflow-hidden flex">
                      <div style={{flex: buyPrice}} className="bg-green-200 border-r border-white flex items-center justify-center text-xs font-bold text-green-800">ACHAT</div>
                      <div style={{flex: sellPrice - buyPrice}} className="bg-yellow-100 border-r border-white flex items-center justify-center text-xs font-bold text-yellow-800">CONSERVER</div>
                      <div style={{flex: (sellPrice * 1.5) - sellPrice}} className="bg-red-200 flex items-center justify-center text-xs font-bold text-red-800">VENTE</div>
                  </div>
                  
                  {/* Cursor for Current Price */}
                  <div 
                      className="absolute top-[-8px] bottom-[-8px] w-1 bg-black z-10 transition-all duration-500 ease-out"
                      style={{ left: `${Math.min(Math.max((currentPrice / (sellPrice * 1.5)) * 100, 0), 100)}%` }}
                  >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                          {currentPrice.toFixed(2)}$
                      </div>
                  </div>

                  {/* Target Price Marker */}
                  <div 
                      className="absolute top-0 bottom-0 w-1 bg-blue-500 z-0 border-l border-dashed border-white"
                      style={{ left: `${Math.min(Math.max((targetPrice / (sellPrice * 1.5)) * 100, 0), 100)}%` }}
                  >
                       <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-blue-600 text-xs font-bold whitespace-nowrap">
                          Cible: {targetPrice.toFixed(2)}$
                      </div>
                  </div>
              </div>

              <div className="text-center">
                  <span className="text-gray-500 text-sm mr-2">Recommandation :</span>
                  <span className="text-2xl font-black uppercase" style={{ color: getRecColor(recommendation) }}>
                      {recommendation}
                  </span>
              </div>
              <p className="text-center text-gray-500 text-xs mt-2 px-6">
                  Le titre est considéré à l'ACHAT sous {buyPrice.toFixed(2)}$, à CONSERVER entre {buyPrice.toFixed(2)}$ et {sellPrice.toFixed(2)}$, et à la VENTE au-dessus de {sellPrice.toFixed(2)}$.
              </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEW CHART: Price High/Low Bars with Current Price Reference */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Plages de Prix Annuelles vs Actuel</h3>
            <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={priceRangeBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipPriceRange />} cursor={{fill: 'transparent'}} />
                
                {/* Invisible bar to push the start of the visible bar to 'low' */}
                <Bar dataKey="low" stackId="a" fill="transparent" />
                {/* Visible bar representing the spread (High - Low) */}
                <Bar dataKey="spread" stackId="a" fill="#93c5fd" radius={[4, 4, 4, 4]} barSize={30} name="Plage Prix" />
                
                <ReferenceLine 
                    y={currentPrice} 
                    stroke="#16a34a" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                        value: `Actuel: ${currentPrice}$`, 
                        position: 'insideTopRight', 
                        fill: '#16a34a', 
                        fontSize: 12, 
                        fontWeight: 'bold',
                        dy: -10
                    }} 
                />
                </ComposedChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Interactive Ratios Chart */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Évolution Historique des Ratios (P/E vs P/CF)</h3>
            <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                data={ratioData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                    dataKey="year" 
                    tick={{fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                />
                <YAxis 
                    tick={{fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={['auto', 'auto']}
                />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [value.toFixed(1) + 'x', '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                
                <Line 
                    type="monotone" 
                    dataKey="avgPE" 
                    stroke="#dc2626" 
                    name="P/E Moyen" 
                    strokeWidth={2} 
                    dot={{ r: 4, strokeWidth: 0, fill: '#dc2626' }} 
                    activeDot={{ r: 6 }} 
                />
                <Line 
                    type="monotone" 
                    dataKey="avgPCF" 
                    stroke="#16a34a" 
                    name="P/CF Moyen" 
                    strokeWidth={2} 
                    dot={{ r: 4, strokeWidth: 0, fill: '#16a34a' }} 
                    activeDot={{ r: 6 }} 
                />
                
                <Brush 
                    dataKey="year" 
                    height={30} 
                    stroke="#cbd5e1" 
                    fill="#f8fafc" 
                    tickFormatter={(value) => value.toString()}
                />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};