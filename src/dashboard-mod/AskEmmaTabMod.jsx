import React from 'react';

// Wrapper module for AskEmmaTab; uses global component if present
export const AskEmmaTab = () => {
    if (typeof window !== 'undefined' && window.AskEmmaTab) {
        return React.createElement(window.AskEmmaTab);
    }
    return (
        <div className="p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
            AskEmmaTab module indisponible (component global manquant).
        </div>
    );
};
