import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';
import { AnnualData } from '../types';
import { calculateRowRatios } from '../utils/calculations';

interface RatiosChartProps {
  data: AnnualData[];
}

export const RatiosChart: React.FC<RatiosChartProps> = ({ data }) => {
  // Transform data for chart
  const chartData = data.map(row => {
    const ratios = calculateRowRatios(row);
    return {
      year: row.year,
      avgPE: ratios.avgPE || 0,
      avgPCF: ratios.avgPCF || 0
    };
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">
        Évolution Historique des Ratios (P/E vs P/CF)
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
              formatter={(value: number) => [value.toFixed(2) + 'x', '']}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
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

            {/* Brush component for Zoom and Pan */}
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
  );
};