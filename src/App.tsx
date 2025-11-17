import React from 'react'
import ReactDOM from 'react-dom/client'

// ====================================================================
// GOB DASHBOARD - Solution temporaire
// ====================================================================
// Charge le fichier app.jsx existant via Babel dans le navigateur
// TODO: Scinder app.jsx en modules ES6 propres

declare const Chart: any
declare const Recharts: any
declare const LightweightCharts: any

const App: React.FC = () => {
    return (
        <div id="dashboard-loading" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0a0a0a',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid #374151',
                    borderTopColor: '#10b981',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }}></div>
                <p style={{ color: '#9ca3af', fontSize: '18px' }}>Chargement du Terminal Financier...</p>
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>Powered by JSL AI</p>
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default App;
