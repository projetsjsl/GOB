import React from 'react';

// Lightweight module wrapper to use the existing global EmailBriefingsTab if present
export const EmailBriefingsTab = () => {
    if (typeof window !== 'undefined' && window.EmailBriefingsTab) {
        return React.createElement(window.EmailBriefingsTab);
    }
    return (
        <div className="p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
            EmailBriefingsTab module indisponible (component global manquant).
        </div>
    );
};
