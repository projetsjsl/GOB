import React, { useState, useEffect } from 'react';

// Import des tabs
import AdminJSLaiTab from './tabs/AdminJSLaiTab';
import PlusTab from './tabs/PlusTab';
import DansWatchlistTab from './tabs/DansWatchlistTab';
import StocksNewsTab from './tabs/StocksNewsTab';
import IntelliStocksTab from './tabs/IntelliStocksTab';
import EconomicCalendarTab from './tabs/EconomicCalendarTab';
import type { TabName } from '../types';

export const BetaCombinedDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabName>('stocks-news');
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Props minimales pour les tabs (à enrichir progressivement)
    const tabProps = { isDarkMode };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'stocks-news': return <StocksNewsTab {...tabProps} />;
            case 'admin-jslai': return <AdminJSLaiTab {...tabProps} />;
            case 'plus': return <PlusTab {...tabProps} />;
            case 'watchlist': return <DansWatchlistTab {...tabProps} />;
            case 'intellistocks': return <IntelliStocksTab {...tabProps} />;
            case 'economic-calendar': return <EconomicCalendarTab {...tabProps} />;
            default: return <StocksNewsTab {...tabProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">GOB Financial Dashboard</h1>
                </div>
            </header>
            <nav className="bg-gray-800 border-b border-gray-700 sticky top-16 z-40">
                <div className="container mx-auto px-4 py-2 flex space-x-2 overflow-x-auto">
                    {['stocks-news', 'intellistocks', 'economic-calendar', 'plus'].map(id => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as TabName)}
                            className={"px-4 py-2 rounded-lg " + (activeTab === id ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300")}
                        >
                            {id}
                        </button>
                    ))}
                </div>
            </nav>
            <main className="container mx-auto px-4 py-6">
                {renderActiveTab()}
            </main>
        </div>
    );
};

export default BetaCombinedDashboard;
