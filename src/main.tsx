import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Les bibliotheques globales (Chart.js, Recharts, TradingView) sont
// chargees via CDN dans index.html et disponibles via window

console.log(' Vite + React + TypeScript charge');
console.log(' Verification des bibliotheques CDN:');
console.log('  Chart.js:', typeof Chart !== 'undefined' ? '' : '');
console.log('  Recharts:', typeof window.Recharts !== 'undefined' ? '' : '');
console.log('  LightweightCharts:', typeof window.LightweightCharts !== 'undefined' ? '' : '');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
