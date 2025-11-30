import React, { useState, useMemo } from 'react';
import { StockChartData } from '../types';

interface StockChartProps {
  data: StockChartData;
  onClose: () => void;
}

const StockChart: React.FC<StockChartProps> = ({ data, onClose }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; date: string } | null>(null);

  const { points, minPrice, maxPrice, width, height } = useMemo(() => {
    const width = 800;
    const height = 300;
    const padding = 40;

    const prices = data.data.map(d => d.price);
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);
    
    // Add some padding to Y axis
    const range = maxPrice - minPrice;
    minPrice -= range * 0.1;
    maxPrice += range * 0.1;

    const points = data.data.map((d, i) => {
      const x = padding + (i / (data.data.length - 1)) * (width - padding * 2);
      const y = height - (padding + ((d.price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2));
      return { x, y, price: d.price, date: d.date };
    });

    return { points, minPrice, maxPrice, width, height };
  }, [data]);

  // Generate SVG Path
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  
  // Generate Area Path (for gradient)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const isPositive = data.trend === 'up';
  const strokeColor = isPositive ? '#10b981' : '#ef4444'; // Emerald vs Red
  const gradientId = `gradient-${data.symbol}`;

  return (
    <div className="w-full bg-slate-850 rounded-2xl border border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-start">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="text-2xl font-bold text-white">{data.symbol}</h3>
            <span className={`text-lg font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{data.changePercent}%
            </span>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Performance Historique ({data.period})</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative p-4" onMouseLeave={() => setHoveredPoint(null)}>
        {/* Tooltip Overlay */}
        {hoveredPoint && (
           <div 
             className="absolute z-10 pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-lg transform -translate-x-1/2 -translate-y-full mb-2"
             style={{ left: hoveredPoint.x, top: hoveredPoint.y - 10 }}
           >
             <p className="text-xs text-slate-400">{hoveredPoint.date}</p>
             <p className="text-sm font-bold text-white">
               {hoveredPoint.price.toFixed(2)} {data.currency}
             </p>
           </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto touch-none">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = height - (40 + tick * (height - 80));
            return (
              <g key={tick}>
                <line x1="40" y1={y} x2={width - 40} y2={y} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                {/* Y Axis Labels */}
                <text x="35" y={y} dy="4" textAnchor="end" className="text-[10px] fill-slate-500" style={{fontSize: '10px'}}>
                  {(minPrice + tick * (maxPrice - minPrice)).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line Graph */}
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Points (Invisible but hoverable) */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="transparent"
              onMouseEnter={() => setHoveredPoint(p)}
              className="cursor-crosshair"
            />
          ))}

          {/* Active Point Highlight */}
          {hoveredPoint && (
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="white" stroke={strokeColor} strokeWidth="2" />
          )}
        </svg>
        
        {/* X Axis Labels (Simplified) */}
        <div className="flex justify-between px-10 mt-2 text-xs text-slate-500">
          <span>{points[0]?.date}</span>
          <span>{points[Math.floor(points.length / 2)]?.date}</span>
          <span>{points[points.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
};

export default StockChart;