import React from 'react';

// Modular wrapper: delegate to global AskEmmaTab until fully migrated
export const AskEmmaTab = () => {
    if (typeof window !== 'undefined' && window.AskEmmaTab) {
        return React.createElement(window.AskEmmaTab);
    }
    return React.createElement(
        'div',
        { className: 'p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800' },
        "AskEmmaTab module indisponible (component global manquant)."
    );
};
