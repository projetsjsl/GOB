import React, { useState } from 'react';

// Full module (thin wrapper) leveraging globals for data/handlers
export const EmailBriefingsTabFull = () => {
    const dashboard = window.BetaCombinedDashboard || {};
    const isDarkMode = dashboard.isDarkMode ?? true;
    const Tab = window.EmailBriefingsTab;
    if (Tab) return React.createElement(Tab, { isDarkMode });
    return (
        <div className="p-4 rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
            EmailBriefingsTab indisponible (component global manquant).
        </div>
    );
};
