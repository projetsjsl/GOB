import React from 'react';

// Wrapper module for IntelliStocksTab; uses global component if present
export const IntelliStocksTab = () => {
    if (typeof window !== 'undefined' && window.IntelliStocksTab) {
        return React.createElement(window.IntelliStocksTab);
    }
    return (
        <div className="p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
            IntelliStocksTab module indisponible (component global manquant).
        </div>
    );
};
