import React from 'react';

// Modular wrapper: delegate to global StocksNewsTab until fully migrated
export const StocksNewsTab = () => {
    if (typeof window !== 'undefined' && window.StocksNewsTab) {
        return React.createElement(window.StocksNewsTab);
    }
    return React.createElement(
        'div',
        { className: 'p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800' },
        'StocksNewsTab module indisponible (component global manquant).'
    );
};
