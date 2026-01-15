/**
 * SpreadChart - 10Y-2Y Spread Historical Chart
 *
 * Features:
 * - Area chart showing spread over time
 * - Reference line at 0 (inversion indicator)
 * - Color coding for positive/negative spread
 * - Zoom/pan capabilities
 */

// Custom Tooltip for Spread
const SpreadTooltip = ({ active, payload, label, colors }) => {
  if (!active || !payload || !payload.length) return null;

  const spread = payload[0]?.value;
  const isInverted = spread < 0;

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
        fontWeight: '500',
        color: colors.textMuted,
        fontSize: '12px'
      }}>
        {label}
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          fontWeight: '700',
          color: isInverted ? colors.spreadNegative : colors.spreadPositive,
          fontSize: '18px'
        }}>
          {spread?.toFixed(2)}%
        </span>
        <span style={{
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: isInverted ? colors.spreadNegative : colors.spreadPositive,
          color: '#ffffff'
        }}>
          {isInverted ? 'INVERSEE' : 'NORMALE'}
        </span>
      </div>
      <p style={{
        margin: '8px 0 0 0',
        fontSize: '10px',
        color: colors.textMuted
      }}>
        Spread 10Y - 2Y US Treasury
      </p>
    </div>
  );
};

window.SpreadChart = ({ data, colors, isDark }) => {
  // Safe access to Recharts with UMD format support
  const RechartsLib = (window.Recharts && (window.Recharts.default || window.Recharts)) || {};
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, Brush } = RechartsLib;

  if (!AreaChart || !ResponsiveContainer) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors?.textMuted || '#888888'
      }}>
        Chargement du graphique...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted,
        gap: '8px'
      }}>
        <span>Aucune donnee historique disponible</span>
        <span style={{ fontSize: '11px' }}>
          Les donnees seront collectees automatiquement chaque jour
        </span>
      </div>
    );
  }

  // Calculate domain with some padding
  const spreads = data.map(d => d.spread).filter(s => s !== null);
  const minSpread = Math.min(...spreads, 0);
  const maxSpread = Math.max(...spreads, 1);
  const padding = (maxSpread - minSpread) * 0.1;

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
  };

  // Gradient ID
  const gradientId = 'spreadGradient';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.spreadPositive} stopOpacity={0.4} />
            <stop offset="50%" stopColor={colors.spreadPositive} stopOpacity={0.1} />
            <stop offset="50%" stopColor={colors.spreadNegative} stopOpacity={0.1} />
            <stop offset="100%" stopColor={colors.spreadNegative} stopOpacity={0.4} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.grid}
          opacity={0.5}
        />

        <XAxis
          dataKey="date"
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 10 }}
          tickLine={{ stroke: colors.grid }}
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />

        <YAxis
          domain={[minSpread - padding, maxSpread + padding]}
          stroke={colors.textMuted}
          tick={{ fill: colors.textMuted, fontSize: 11 }}
          tickLine={{ stroke: colors.grid }}
          tickFormatter={(value) => `${value.toFixed(2)}%`}
          width={55}
        />

        <Tooltip
          content={<SpreadTooltip colors={colors} />}
          cursor={{ stroke: colors.textMuted, strokeDasharray: '5 5' }}
        />

        {/* Reference line at 0 - Inversion threshold */}
        <ReferenceLine
          y={0}
          stroke={colors.spreadNegative}
          strokeWidth={2}
          strokeDasharray="8 4"
          label={{
            value: 'Zone d\'inversion',
            fill: colors.spreadNegative,
            fontSize: 10,
            position: 'insideTopRight'
          }}
        />

        {/* Spread Area */}
        <Area
          type="monotone"
          dataKey="spread"
          name="Spread 10Y-2Y"
          stroke={colors.usLine}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{
            fill: colors.usLine,
            strokeWidth: 2,
            stroke: '#ffffff',
            r: 5
          }}
        />

        {/* Brush for zoom/pan */}
        <Brush
          dataKey="date"
          height={25}
          stroke={colors.usLine}
          fill={isDark ? '#1a1a2e' : '#f8f9fa'}
          tickFormatter={formatDate}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

console.log('SpreadChart loaded');
