import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Try to find the specific container for the dashboard integration first,
// otherwise fallback to 'root' for standalone development
const rootElement = document.getElementById('finance-pro-root') || document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);