/**
 * RateCards - Display key interest rates in card format
 *
 * Shows: 2Y, 5Y, 10Y, 30Y rates for US and Canada
 * With change indicators
 */

window.RateCards = ({ usData, canadaData, colors, showUS, showCanada }) => {
  // Key maturities to display
  const keyMaturities = ['2Y', '5Y', '10Y', '30Y'];

  // Get rate data for a specific maturity
  const getRate = (data, maturity) => {
    if (!data?.rates) return null;
    return data.rates.find(r => r.maturity === maturity);
  };

  // Calculate spread
  const getSpread = (data) => {
    if (!data?.rates) return null;
    const rate10Y = data.rates.find(r => r.maturity === '10Y');
    const rate2Y = data.rates.find(r => r.maturity === '2Y');
    if (rate10Y && rate2Y) {
      return rate10Y.rate - rate2Y.rate;
    }
    return null;
  };

  const usSpread = getSpread(usData);
  const canadaSpread = getSpread(canadaData);

  // Card style
  const cardContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '8px'
  };

  const cardStyle = (accentColor) => ({
    backgroundColor: colors.background,
    borderRadius: '8px',
    padding: '8px 10px',
    border: `1px solid ${colors.border}`,
    borderLeft: `3px solid ${accentColor}`,
    minWidth: '80px'
  });

  const labelStyle = {
    fontSize: '10px',
    color: colors.textMuted,
    marginBottom: '2px',
    fontWeight: '500'
  };

  const valueStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text
  };

  const changeStyle = (change) => ({
    fontSize: '10px',
    fontWeight: '500',
    color: change > 0 ? colors.spreadNegative : change < 0 ? colors.spreadPositive : colors.textMuted
  });

  const spreadCardStyle = (isInverted) => ({
    backgroundColor: isInverted ? `${colors.spreadNegative}15` : `${colors.spreadPositive}15`,
    borderRadius: '8px',
    padding: '8px 10px',
    border: `1px solid ${isInverted ? colors.spreadNegative : colors.spreadPositive}`,
    minWidth: '90px',
    textAlign: 'center'
  });

  // Render a rate card
  const RateCard = ({ maturity, rate, change, accentColor }) => {
    if (rate === null || rate === undefined) return null;

    return (
      <div style={cardStyle(accentColor)}>
        <div style={labelStyle}>{maturity}</div>
        <div style={valueStyle}>{rate.toFixed(2)}%</div>
        {change !== null && change !== undefined && (
          <div style={changeStyle(change)}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}
          </div>
        )}
      </div>
    );
  };

  // Render spread card
  const SpreadCard = ({ label, spread, accentColor }) => {
    if (spread === null) return null;
    const isInverted = spread < 0;

    return (
      <div style={spreadCardStyle(isInverted)}>
        <div style={{ ...labelStyle, color: isInverted ? colors.spreadNegative : colors.spreadPositive }}>
          {label} 10Y-2Y
        </div>
        <div style={{
          ...valueStyle,
          color: isInverted ? colors.spreadNegative : colors.spreadPositive
        }}>
          {spread.toFixed(2)}%
        </div>
        <div style={{
          fontSize: '9px',
          fontWeight: '600',
          padding: '2px 4px',
          borderRadius: '3px',
          backgroundColor: isInverted ? colors.spreadNegative : colors.spreadPositive,
          color: '#ffffff',
          marginTop: '2px',
          display: 'inline-block'
        }}>
          {isInverted ? 'INVERSÉE' : 'NORMALE'}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* US Rates */}
      {showUS && usData && (
        <div>
          <div style={{
            fontSize: '11px',
            color: colors.usLine,
            fontWeight: '600',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.usLine
            }} />
            US Treasury
          </div>
          <div style={cardContainerStyle}>
            {keyMaturities.map(maturity => {
              const rateData = getRate(usData, maturity);
              return rateData ? (
                <RateCard
                  key={`us-${maturity}`}
                  maturity={maturity}
                  rate={rateData.rate}
                  change={rateData.change1M}
                  accentColor={colors.usLine}
                />
              ) : null;
            })}
            <SpreadCard label="US" spread={usSpread} accentColor={colors.usLine} />
          </div>
        </div>
      )}

      {/* Canada Rates */}
      {showCanada && canadaData && (
        <div>
          <div style={{
            fontSize: '11px',
            color: colors.canadaLine,
            fontWeight: '600',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.canadaLine
            }} />
            Canada
          </div>
          <div style={cardContainerStyle}>
            {keyMaturities.map(maturity => {
              const rateData = getRate(canadaData, maturity);
              return rateData ? (
                <RateCard
                  key={`ca-${maturity}`}
                  maturity={maturity}
                  rate={rateData.rate}
                  change={rateData.change1M}
                  accentColor={colors.canadaLine}
                />
              ) : null;
            })}
            <SpreadCard label="CA" spread={canadaSpread} accentColor={colors.canadaLine} />
          </div>
        </div>
      )}
    </div>
  );
};

console.log('RateCards loaded');
