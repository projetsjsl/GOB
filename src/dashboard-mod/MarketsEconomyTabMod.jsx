import React from 'react';

// Wrapper module for MarketsEconomyTab; uses global component if present
export const MarketsEconomyTab = () => {
    if (typeof window !== 'undefined' && window.MarketsEconomyTab) {
        return React.createElement(window.MarketsEconomyTab);
    }
    return (
        <div className="p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
            MarketsEconomyTab module indisponible (component global manquant).
        </div>
    );
};
