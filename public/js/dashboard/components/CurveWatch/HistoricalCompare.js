/**
 * HistoricalCompare - Compare current yield curve with historical date
 *
 * Features:
 * - Side-by-side comparison
 * - Difference highlighting
 * - Multiple lines for current vs historical
 */

// Custom Tooltip for Compare
const CompareTooltip = ({ active, payload, label, colors, compareDate }) => {
  if (!active || !payload || !payload.length) return null;

  // Group payload by current vs compare
  const currentUS = payload.find(p => p.dataKey === 'us');
  const currentCA = payload.find(p => p.dataKey === 'canada');
  const compareUS = payload.find(p => p.dataKey === 'usCompare');
  const compareCA = payload.find(p => p.dataKey === 'canadaCompare');

  return (
    <div style={{
      backgroundColor: colors.tooltip,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '200px'
    }}>
      <p style={{
        margin: '0 0 10px 0',
        fontWeight: '600',
        color: colors.text,
        fontSize: '14px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '8px'
      }}>
        Maturite: {label}
      </p>

      {/* Current values */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '4px', fontWeight: '600' }}>
          AUJOURD'HUI
        </div>
        {currentUS && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: colors.usLine, fontSize: '12px' }}>US:</span>
            <span style={{ fontWeight: '600', color: colors.text, fontSize: '12px' }}>
              {currentUS.value?.toFixed(3)}%
            </span>
          </div>
        )}
        {currentCA && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.canadaLine, fontSize: '12px' }}>Canada:</span>
            <span style={{ fontWeight: '600', color: colors.text, fontSize: '12px' }}>
              {currentCA.value?.toFixed(3)}%
            </span>
          </div>
        )}
      </div>

      {/* Compare values */}
      {(compareUS || compareCA) && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '4px', fontWeight: '600' }}>
            {compareDate || 'DATE COMPAREE'}
          </div>
          {compareUS && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: colors.usLine, fontSize: '12px', opacity: 0.6 }}>US:</span>
              <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                {compareUS.value?.toFixed(3)}%
              </span>
            </div>
          )}
          {compareCA && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: colors.canadaLine, fontSize: '12px', opacity: 0.6 }}>Canada:</span>
              <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                {compareCA.value?.toFixed(3)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Difference */}
      {(compareUS || compareCA) && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '8px' }}>
          <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '4px', fontWeight: '600' }}>
            VARIATION
          </div>
          {currentUS && compareUS && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: colors.usLine, fontSize: '12px' }}>US:</span>
              <span style={{
                fontWeight: '600',
                fontSize: '12px',
                color: (currentUS.value - compareUS.value) > 0 ? colors.spreadNegative : colors.spreadPositive
              }}>
                {(currentUS.value - compareUS.value) > 0 ? '+' : ''}
                {(currentUS.value - compareUS.value).toFixed(3)}%
              </span>
            </div>
          )}
          {currentCA && compareCA && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: colors.canadaLine, fontSize: '12px' }}>Canada:</span>
              <span style={{
                fontWeight: '600',
                fontSize: '12px',
                color: (currentCA.value - compareCA.value) > 0 ? colors.spreadNegative : colors.spreadPositive
              }}>
                {(currentCA.value - compareCA.value) > 0 ? '+' : ''}
                {(currentCA.value - compareCA.value).toFixed(3)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

window.HistoricalCompare = ({ currentData, compareData, colors, showUS, showCanada, isDark }) => {
  // Safe access to Recharts with UMD format support
  const RechartsLib = (window.Recharts && (window.Recharts.default || window.Recharts)) || {};
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine } = RechartsLib;

  if (!LineChart || !ResponsiveContainer) {
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

  // Check if we have compare data
  const hasCompare = compareData && (compareData.us || compareData.canada);

  if (!currentData || currentData.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted
      }}>
        Aucune donnee disponible
      </div>
    );
  }

  if (!hasCompare) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted,
        gap: '12px'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
          <path d="M9 16l2 2 4-4"/>
        </svg>
        <span style={{ fontSize: '14px' }}>Selectionnez une date pour comparer</span>
        <span style={{ fontSize: '11px', maxWidth: '300px', textAlign: 'center' }}>
          Utilisez le selecteur de date ci-dessus pour comparer la courbe actuelle avec une date historique
        </span>
      </div>
    );
  }

  // Calculate Y-axis domain
  const allRates = currentData.flatMap(d => [
    showUS ? d.us : null,
    showCanada ? d.canada : null,
    showUS && hasCompare ? d.usCompare : null,
    showCanada && hasCompare ? d.canadaCompare : null
  ]).filter(r => r !== null);

  const minRate = Math.floor(Math.min(...allRates) * 10) / 10 - 0.2;
  const maxRate = Math.ceil(Math.max(...allRates) * 10) / 10 + 0.2;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={currentData}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
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
          content={<CompareTooltip colors={colors} compareDate={compareData?.date} />}
          cursor={{ stroke: colors.textMuted, strokeDasharray: '5 5' }}
        />

        <Legend
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <span style={{ color: colors.textMuted, fontSize: '11px' }}>{value}</span>
          )}
        />

        {/* Current US Line */}
        {showUS && (
          <Line
            type="monotone"
            dataKey="us"
            name="US (Aujourd'hui)"
            stroke={colors.usLine}
            strokeWidth={2.5}
            dot={{ fill: colors.usLine, strokeWidth: 0, r: 4 }}
            activeDot={{ fill: colors.usLine, strokeWidth: 2, stroke: '#ffffff', r: 6 }}
            connectNulls
          />
        )}

        {/* Current Canada Line */}
        {showCanada && (
          <Line
            type="monotone"
            dataKey="canada"
            name="Canada (Aujourd'hui)"
            stroke={colors.canadaLine}
            strokeWidth={2.5}
            dot={{ fill: colors.canadaLine, strokeWidth: 0, r: 4 }}
            activeDot={{ fill: colors.canadaLine, strokeWidth: 2, stroke: '#ffffff', r: 6 }}
            connectNulls
          />
        )}

        {/* Compare US Line (dashed) */}
        {showUS && hasCompare && (
          <Line
            type="monotone"
            dataKey="usCompare"
            name={`US (${compareData?.date})`}
            stroke={colors.usLine}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ fill: colors.usLine, strokeWidth: 0, r: 3, opacity: 0.5 }}
            activeDot={{ fill: colors.usLine, strokeWidth: 2, stroke: '#ffffff', r: 5, opacity: 0.8 }}
            opacity={0.5}
            connectNulls
          />
        )}

        {/* Compare Canada Line (dashed) */}
        {showCanada && hasCompare && (
          <Line
            type="monotone"
            dataKey="canadaCompare"
            name={`Canada (${compareData?.date})`}
            stroke={colors.canadaLine}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ fill: colors.canadaLine, strokeWidth: 0, r: 3, opacity: 0.5 }}
            activeDot={{ fill: colors.canadaLine, strokeWidth: 2, stroke: '#ffffff', r: 5, opacity: 0.8 }}
            opacity={0.5}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

console.log('HistoricalCompare loaded');
