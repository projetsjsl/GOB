// EconomicEventsModal.js
// Economic calendar with stock correlation analysis

const { useState, useEffect } = React;

const EconomicEventsModal = ({ symbol, stockData, watchlist, onClose }) => {
    const [economicData, setEconomicData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImpact, setSelectedImpact] = useState('all'); // all, high, medium, low

    useEffect(() => {
        fetchEconomicEvents();
    }, []);

    const fetchEconomicEvents = async () => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE_URL = window.location.origin || '';

            const response = await fetch(`${API_BASE_URL}/api/calendar-economic`);

            if (!response.ok) {
                throw new Error(`Economic calendar API error: ${response.status}`);
            }

            const result = await response.json();
            setEconomicData(result.data || []);

        } catch (err) {
            console.error('Economic events error:', err);
            setError(err.message || 'Failed to fetch economic calendar');
            setEconomicData([]);
        } finally {
            setLoading(false);
        }
    };

    const getImpactBadge = (impact) => {
        switch (impact) {
            case 3:
            case 'high':
            case 'High':
                return 'bg-red-900/30 text-red-400 border-red-500/30';
            case 2:
            case 'medium':
            case 'Medium':
                return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
            case 1:
            case 'low':
            case 'Low':
                return 'bg-green-900/30 text-green-400 border-green-500/30';
            default:
                return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
        }
    };

    const getImpactText = (impact) => {
        if (impact === 3 || impact === 'high' || impact === 'High') return 'HIGH';
        if (impact === 2 || impact === 'medium' || impact === 'Medium') return 'MED';
        if (impact === 1 || impact === 'low' || impact === 'Low') return 'LOW';
        return 'N/A';
    };

    const filterEvents = (events) => {
        if (selectedImpact === 'all') return events;
        const impactMap = { high: 3, medium: 2, low: 1 };
        const targetImpact = impactMap[selectedImpact];
        return events.filter(e => e.impact === targetImpact);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-sky-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-900/40 to-indigo-900/40 border-b border-sky-500/30 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-sky-500/20 flex items-center justify-center">
                            <i className="iconoir-globe text-sky-400 text-3xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Economic Events Calendar</h2>
                            <p className="text-gray-400 text-sm">Next 7 days • Impact on your portfolio</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-cancel text-gray-400 text-xl"></i>
                    </button>
                </div>

                {/* Impact Filter */}
                <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700 flex gap-3">
                    <button
                        onClick={() => setSelectedImpact('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedImpact === 'all' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        All Events
                    </button>
                    <button
                        onClick={() => setSelectedImpact('high')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedImpact === 'high' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        High Impact
                    </button>
                    <button
                        onClick={() => setSelectedImpact('medium')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedImpact === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        Medium Impact
                    </button>
                    <button
                        onClick={() => setSelectedImpact('low')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedImpact === 'low' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        Low Impact
                    </button>
                    <button
                        onClick={fetchEconomicEvents}
                        disabled={loading}
                        className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-lg">Loading economic calendar...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                            <h3 className="text-red-400 font-bold mb-2">Error Loading Events</h3>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    ) : economicData.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No economic events scheduled for the next 7 days
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {economicData.map((day, dayIndex) => {
                                const filteredEvents = filterEvents(day.events || []);

                                if (filteredEvents.length === 0) return null;

                                return (
                                    <div key={dayIndex} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                                        <h3 className="text-lg font-bold text-white mb-4">{day.date}</h3>

                                        <div className="space-y-3">
                                            {filteredEvents.map((event, eventIndex) => (
                                                <div
                                                    key={eventIndex}
                                                    className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                                                >
                                                    {/* Time */}
                                                    <div className="text-gray-400 text-sm min-w-[80px]">
                                                        {event.time || 'All Day'}
                                                    </div>

                                                    {/* Event Details */}
                                                    <div className="flex-1">
                                                        <div className="text-white font-semibold mb-1">
                                                            {event.event}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                                            <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                                                                {event.currency || 'USD'}
                                                            </span>
                                                            {event.forecast !== 'N/A' && (
                                                                <span>Forecast: {event.forecast}</span>
                                                            )}
                                                            {event.previous !== 'N/A' && (
                                                                <span>Previous: {event.previous}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Impact Badge */}
                                                    <div className={`px-3 py-1 rounded-lg border font-bold text-xs ${getImpactBadge(event.impact)}`}>
                                                        {getImpactText(event.impact)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <i className="iconoir-database text-sky-400 mr-1"></i>
                        Economic data from FMP + fallback sources
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

window.EconomicEventsModal = EconomicEventsModal;
