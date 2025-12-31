import type React from 'react';

declare global {
  const Chart: unknown;

  interface Window {
    AdvancedAnalysisTab?: React.ComponentType<any>;
    Recharts?: unknown;
    LightweightCharts?: unknown;
  }
}

export {};
