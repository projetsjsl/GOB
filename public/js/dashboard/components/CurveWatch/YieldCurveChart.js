/**
 * YieldCurveChart - Interactive yield curve visualization
 *
 * Features:
 * - US & Canada curves on same chart
 * - Custom tooltips with detailed info
 * - Zoom/pan with Brush component
 * - Responsive design
 */

const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
        ResponsiveContainer, ReferenceLine, Brush } = window.Recharts || {};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, colors }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      backgroundColor: colors.tooltip,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <p style={{
        margin: '0 0 8px 0',
        fontWeight: '600',
        color: colors.text,
        fontSize: '14px'
      }}>
        Maturité: {label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: entry.color
          }} />
          <span style={{ color: colors.textMuted, fontSize: '12px' }}>
            {entry.name}:
          </span>
          <span style={{
            fontWeight: '600',
            color: colors.text,
            fontSize: '13px'
          }}>
            {entry.value?.toFixed(3)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom Legend
const CustomLegend = ({ payload, colors }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      paddingTop: '8px'
    }}>
      {payload.map((entry, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            width: '16px',
            height: '3px',
            borderRadius: '2px',
            backgroundColor: entry.color
          }} />
          <span style={{
            fontSize: '12px',
            color: colors.textMuted
          }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

window.YieldCurveChart = ({ data, colors, showUS, showCanada, isDark }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted
      }}>
        Aucune donnée disponible
      </div>
    );
  }

  // Calculate Y-axis domain
  const allRates = data.flatMap(d => [
    showUS ? d.us : null,
    showCanada ? d.canada : null
  ]).filter(r => r !== null);

  const minRate = Math.floor(Math.min(...allRates) * 10) / 10 - 0.2;
  const maxRate = Math.ceil(Math.max(...allRates) * 10) / 10 + 0.2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.grid}
          opacity={0.5}
        />

        <XAxis
          dataKey="maturity"
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11 }}
          tickLine={{ stroke: colors.grid }}
        />

        <YAxis
          domain={[minRate, maxRate]}
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11 }}
          tickLine={{ stroke: colors.grid }}
          tickFormatter={(value) => `${value.toFixed(1)}%`}
          width={50}
        />

        <Tooltip
          content={<CustomTooltip colors={colors} />}
          cursor={{ stroke: colors.textMuted, strokeDasharray: '5 5' }}
        />

        <Legend
          content={<CustomLegend colors={colors} />}
        />

        {/* Reference line at 0% */}
        <ReferenceLine
          y={0}
          stroke={colors.textMuted}
          strokeDasharray="3 3"
          opacity={0.5}
        />

        {/* US Treasury Line */}
        {showUS && (
          <Line
            type="monotone"
            dataKey="us"
            name="US Treasury"
            stroke={colors.usLine}
            strokeWidth={2.5}
            dot={{ fill: colors.usLine, strokeWidth: 0, r: 4 }}
            activeDot={{ fill: colors.usLine, strokeWidth: 2, stroke: '#ffffff', r: 6 }}
            connectNulls
          />
        )}

        {/* Canada Line */}
        {showCanada && (
          <Line
            type="monotone"
            dataKey="canada"
            name="Canada"
            stroke={colors.canadaLine}
            strokeWidth={2.5}
            dot={{ fill: colors.canadaLine, strokeWidth: 0, r: 4 }}
            activeDot={{ fill: colors.canadaLine, strokeWidth: 2, stroke: '#ffffff', r: 6 }}
            connectNulls
          />
        )}

        {/* Brush for zoom/pan */}
        <Brush
          dataKey="maturity"
          height={25}
          stroke={colors.usLine}
          fill={isDark ? '#1a1a2e' : '#f8f9fa'}
          tickFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

console.log('YieldCurveChart loaded');
