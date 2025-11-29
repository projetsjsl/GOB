import React from 'react';

// Wrapper component: delegates to existing global AdminJSLaiTab until full modular port.
export const AdminJSLaiTab = (props = {}) => {
    if (typeof window !== 'undefined' && typeof window.AdminJSLaiTab === 'function') {
        return React.createElement(window.AdminJSLaiTab, props);
    }

    return (
        <div className="p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
            AdminJSLaiTab module indisponible (component global manquant).
        </div>
    );
};
