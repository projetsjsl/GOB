import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import type { TabProps } from '../../types';

// Types pour Finance Pro
interface FinanceSnapshot {
    id: string;
    ticker: string;
    snapshot_date: string;
    is_current: boolean;
    version: number;
    annual_data: AnnualData[];
    assumptions: any;
    company_info: any;
    notes: string;
    created_at: string;
}

interface AnnualData {
    year: number;
    revenue: number;
    netIncome: number;
    eps: number;
    dividend: number;
    bookValue: number;
    roe: number;
    roa: number;
    debtToEquity: number;
    currentRatio: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    freeCashFlow: number;
    shares: number;
    price?: number;
    pe?: number;
    pb?: number;
    dividendYield?: number;
}

interface PortfolioPosition {
    ticker: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    gain: number;
    gainPercent: number;
    sector: string;
    companyName: string;
}

interface ScreenerFilter {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
}

type ViewMode = 'portfolio' | 'analysis' | 'screener' | 'compare' | 'ratios' | 'history';

export const FinanceProTab: React.FC<TabProps> = memo((props) => {
    const {
        isDarkMode = true,
        API_BASE_URL = '',
        tickers = [],
    } = props;

    const apiBase = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    // State
    const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Portfolio state
    const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([]);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [portfolioGain, setPortfolioGain] = useState(0);

    // Analysis state
    const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
    const [snapshotData, setSnapshotData] = useState<FinanceSnapshot | null>(null);
    const [allSnapshots, setAllSnapshots] = useState<FinanceSnapshot[]>([]);

    // Screener state
    const [screenerResults, setScreenerResults] = useState<any[]>([]);
    const [screenerFilters, setScreenerFilters] = useState<ScreenerFilter[]>([]);

    // Compare state
    const [compareList, setCompareList] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
    const [compareData, setCompareData] = useState<Record<string, FinanceSnapshot>>({});

    // Metrics to display
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
        'revenue', 'netIncome', 'eps', 'roe', 'debtToEquity', 'freeCashFlow'
    ]);

    // Available metrics
    const availableMetrics = [
        { key: 'revenue', label: 'Revenue', format: 'currency' },
        { key: 'netIncome', label: 'Net Income', format: 'currency' },
        { key: 'eps', label: 'EPS', format: 'number' },
        { key: 'dividend', label: 'Dividend', format: 'currency' },
        { key: 'bookValue', label: 'Book Value', format: 'currency' },
        { key: 'roe', label: 'ROE', format: 'percent' },
        { key: 'roa', label: 'ROA', format: 'percent' },
        { key: 'debtToEquity', label: 'Debt/Equity', format: 'ratio' },
        { key: 'currentRatio', label: 'Current Ratio', format: 'ratio' },
        { key: 'grossMargin', label: 'Gross Margin', format: 'percent' },
        { key: 'operatingMargin', label: 'Operating Margin', format: 'percent' },
        { key: 'netMargin', label: 'Net Margin', format: 'percent' },
        { key: 'freeCashFlow', label: 'Free Cash Flow', format: 'currency' },
        { key: 'shares', label: 'Shares Outstanding', format: 'number' },
        { key: 'pe', label: 'P/E Ratio', format: 'ratio' },
        { key: 'pb', label: 'P/B Ratio', format: 'ratio' },
        { key: 'dividendYield', label: 'Dividend Yield', format: 'percent' },
    ];

    // Format helpers
    const formatCurrency = (value: number) => {
        if (!value && value !== 0) return 'N/A';
        if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
        return `$${value.toFixed(2)}`;
    };

    const formatPercent = (value: number) => {
        if (!value && value !== 0) return 'N/A';
        return `${(value * 100).toFixed(2)}%`;
    };

    const formatNumber = (value: number) => {
        if (!value && value !== 0) return 'N/A';
        if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
        return value.toFixed(2);
    };

    const formatValue = (value: number, format: string) => {
        switch (format) {
            case 'currency': return formatCurrency(value);
            case 'percent': return formatPercent(value);
            case 'ratio': return value?.toFixed(2) || 'N/A';
            default: return formatNumber(value);
        }
    };

    // Fetch snapshot for a ticker
    const fetchSnapshot = useCallback(async (ticker: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBase}/api/finance-snapshots?ticker=${ticker}&current=true`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.success && data.data?.length > 0) {
                setSnapshotData(data.data[0]);
            } else {
                setError(`No data found for ${ticker}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    // Fetch all snapshots for stats
    const fetchAllSnapshots = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/finance-snapshots?all=true&current=true`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setAllSnapshots(data.data || []);
            }
        } catch (err: any) {
            console.error('Error fetching all snapshots:', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    // Fetch multiple snapshots for comparison
    const fetchCompareData = useCallback(async (tickers: string[]) => {
        setLoading(true);
        try {
            const results: Record<string, FinanceSnapshot> = {};
            await Promise.all(tickers.map(async (ticker) => {
                const response = await fetch(`${apiBase}/api/finance-snapshots?ticker=${ticker}&current=true`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.length > 0) {
                        results[ticker] = data.data[0];
                    }
                }
            }));
            setCompareData(results);
        } catch (err: any) {
            console.error('Error fetching compare data:', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    // Calculate portfolio value
    const calculatePortfolio = useCallback(async () => {
        if (tickers.length === 0) return;

        setLoading(true);
        try {
            const positions: PortfolioPosition[] = [];
            let totalValue = 0;
            let totalCost = 0;

            for (const ticker of tickers.slice(0, 20)) {
                const response = await fetch(`${apiBase}/api/fmp-company-data?symbol=${ticker}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const shares = Math.floor(Math.random() * 100) + 10; // Mock shares
                        const avgCost = data.currentPrice * (0.8 + Math.random() * 0.4); // Mock avg cost
                        const value = shares * data.currentPrice;
                        const gain = value - (shares * avgCost);

                        positions.push({
                            ticker,
                            shares,
                            avgCost,
                            currentPrice: data.currentPrice,
                            value,
                            gain,
                            gainPercent: (gain / (shares * avgCost)) * 100,
                            sector: data.profile?.sector || 'Unknown',
                            companyName: data.profile?.companyName || ticker,
                        });

                        totalValue += value;
                        totalCost += shares * avgCost;
                    }
                }
            }

            setPortfolioPositions(positions.sort((a, b) => b.value - a.value));
            setPortfolioValue(totalValue);
            setPortfolioGain(totalValue - totalCost);
        } catch (err: any) {
            console.error('Error calculating portfolio:', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase, tickers]);

    // Run screener
    const runScreener = useCallback(async () => {
        setLoading(true);
        try {
            const results: any[] = [];

            for (const snapshot of allSnapshots) {
                if (!snapshot.annual_data?.length) continue;

                const latestYear = snapshot.annual_data[0];
                let passesFilters = true;

                for (const filter of screenerFilters) {
                    const value = latestYear[filter.metric as keyof AnnualData] as number;
                    if (value === undefined) continue;

                    switch (filter.operator) {
                        case 'gt': passesFilters = value > filter.value; break;
                        case 'lt': passesFilters = value < filter.value; break;
                        case 'gte': passesFilters = value >= filter.value; break;
                        case 'lte': passesFilters = value <= filter.value; break;
                        case 'eq': passesFilters = value === filter.value; break;
                    }

                    if (!passesFilters) break;
                }

                if (passesFilters) {
                    results.push({
                        ticker: snapshot.ticker,
                        companyInfo: snapshot.company_info,
                        latestData: latestYear,
                        yearsOfData: snapshot.annual_data.length,
                    });
                }
            }

            setScreenerResults(results.slice(0, 50));
        } catch (err: any) {
            console.error('Error running screener:', err);
        } finally {
            setLoading(false);
        }
    }, [allSnapshots, screenerFilters]);

    // Initial load
    useEffect(() => {
        fetchAllSnapshots();
    }, [fetchAllSnapshots]);

    useEffect(() => {
        if (selectedTicker) {
            fetchSnapshot(selectedTicker);
        }
    }, [selectedTicker, fetchSnapshot]);

    useEffect(() => {
        if (viewMode === 'compare' && compareList.length > 0) {
            fetchCompareData(compareList);
        }
    }, [viewMode, compareList, fetchCompareData]);

    useEffect(() => {
        if (viewMode === 'portfolio') {
            calculatePortfolio();
        }
    }, [viewMode, calculatePortfolio]);

    // Calculate growth rates
    const calculateGrowth = (data: AnnualData[], metric: keyof AnnualData) => {
        if (!data || data.length < 2) return { cagr1: 0, cagr5: 0, cagr10: 0 };

        const getValue = (years: number) => {
            if (data.length <= years) return null;
            const start = data[years][metric] as number;
            const end = data[0][metric] as number;
            if (!start || !end || start <= 0) return null;
            return Math.pow(end / start, 1 / years) - 1;
        };

        return {
            cagr1: getValue(1) || 0,
            cagr5: getValue(5) || 0,
            cagr10: getValue(10) || 0,
        };
    };

    // Sector allocation from portfolio
    const sectorAllocation = useMemo(() => {
        const sectors: Record<string, number> = {};
        portfolioPositions.forEach(pos => {
            sectors[pos.sector] = (sectors[pos.sector] || 0) + pos.value;
        });
        return Object.entries(sectors)
            .map(([sector, value]) => ({
                sector,
                value,
                percent: (value / portfolioValue) * 100,
            }))
            .sort((a, b) => b.value - a.value);
    }, [portfolioPositions, portfolioValue]);

    // Stats summary
    const statsummary = useMemo(() => {
        return {
            totalTickers: allSnapshots.length,
            avgYearsData: allSnapshots.reduce((sum, s) => sum + (s.annual_data?.length || 0), 0) / (allSnapshots.length || 1),
            with30Years: allSnapshots.filter(s => s.annual_data?.length >= 30).length,
            with20Years: allSnapshots.filter(s => s.annual_data?.length >= 20).length,
        };
    }, [allSnapshots]);

    // Color helpers
    const getGainColor = (value: number) => {
        if (value > 0) return 'text-green-400';
        if (value < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    const getRatioColor = (value: number, goodAbove: number, badBelow: number) => {
        if (value >= goodAbove) return 'text-green-400';
        if (value <= badBelow) return 'text-red-400';
        return 'text-yellow-400';
    };

    // Render navigation
    const renderNav = () => (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
                { id: 'portfolio', label: 'Portfolio', icon: '💼' },
                { id: 'analysis', label: 'Analysis', icon: '📊' },
                { id: 'screener', label: 'Screener', icon: '🔍' },
                { id: 'compare', label: 'Compare', icon: '⚖️' },
                { id: 'ratios', label: 'Ratios', icon: '📈' },
                { id: 'history', label: 'History', icon: '📅' },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setViewMode(item.id as ViewMode)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                        viewMode === item.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    {item.icon} {item.label}
                </button>
            ))}
        </div>
    );

    // Render stats bar
    const renderStatsBar = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Total Tickers</div>
                <div className="text-2xl font-bold text-white">{statsummary.totalTickers}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg Years Data</div>
                <div className="text-2xl font-bold text-blue-400">{statsummary.avgYearsData.toFixed(1)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">30+ Years</div>
                <div className="text-2xl font-bold text-green-400">{statsummary.with30Years}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">20+ Years</div>
                <div className="text-2xl font-bold text-yellow-400">{statsummary.with20Years}</div>
            </div>
        </div>
    );

    // Render portfolio view
    const renderPortfolio = () => (
        <div>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
                    <div className="text-gray-300 text-sm mb-1">Total Portfolio Value</div>
                    <div className="text-3xl font-bold text-white">{formatCurrency(portfolioValue)}</div>
                </div>
                <div className={`bg-gradient-to-br ${portfolioGain >= 0 ? 'from-green-900 to-green-800' : 'from-red-900 to-red-800'} rounded-xl p-6`}>
                    <div className="text-gray-300 text-sm mb-1">Total Gain/Loss</div>
                    <div className={`text-3xl font-bold ${getGainColor(portfolioGain)}`}>
                        {portfolioGain >= 0 ? '+' : ''}{formatCurrency(portfolioGain)}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6">
                    <div className="text-gray-300 text-sm mb-1">Positions</div>
                    <div className="text-3xl font-bold text-white">{portfolioPositions.length}</div>
                </div>
            </div>

            {/* Sector Allocation */}
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Sector Allocation</h3>
                <div className="space-y-2">
                    {sectorAllocation.map(({ sector, value, percent }) => (
                        <div key={sector} className="flex items-center gap-4">
                            <div className="w-32 text-gray-300 truncate">{sector}</div>
                            <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <div className="w-20 text-right text-gray-300">{percent.toFixed(1)}%</div>
                            <div className="w-24 text-right text-white font-medium">{formatCurrency(value)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Positions Table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-gray-400">Ticker</th>
                                <th className="px-4 py-3 text-left text-gray-400">Company</th>
                                <th className="px-4 py-3 text-right text-gray-400">Shares</th>
                                <th className="px-4 py-3 text-right text-gray-400">Avg Cost</th>
                                <th className="px-4 py-3 text-right text-gray-400">Current</th>
                                <th className="px-4 py-3 text-right text-gray-400">Value</th>
                                <th className="px-4 py-3 text-right text-gray-400">Gain/Loss</th>
                                <th className="px-4 py-3 text-right text-gray-400">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolioPositions.map((pos, idx) => (
                                <tr
                                    key={pos.ticker}
                                    className={`border-t border-gray-700 hover:bg-gray-700/50 cursor-pointer ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}`}
                                    onClick={() => {
                                        setSelectedTicker(pos.ticker);
                                        setViewMode('analysis');
                                    }}
                                >
                                    <td className="px-4 py-3 font-bold text-blue-400">{pos.ticker}</td>
                                    <td className="px-4 py-3 text-gray-300 truncate max-w-xs">{pos.companyName}</td>
                                    <td className="px-4 py-3 text-right text-white">{pos.shares}</td>
                                    <td className="px-4 py-3 text-right text-gray-300">${pos.avgCost.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-white">${pos.currentPrice.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(pos.value)}</td>
                                    <td className={`px-4 py-3 text-right ${getGainColor(pos.gain)}`}>
                                        {pos.gain >= 0 ? '+' : ''}{formatCurrency(pos.gain)}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${getGainColor(pos.gainPercent)}`}>
                                        {pos.gainPercent >= 0 ? '+' : ''}{pos.gainPercent.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Render analysis view
    const renderAnalysis = () => {
        if (!snapshotData) {
            return (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">Select a ticker to analyze</div>
                    <input
                        type="text"
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter ticker..."
                    />
                </div>
            );
        }

        const data = snapshotData.annual_data || [];
        const latestYear = data[0];
        const revenueGrowth = calculateGrowth(data, 'revenue');
        const epsGrowth = calculateGrowth(data, 'eps');

        return (
            <div>
                {/* Ticker Selector */}
                <div className="flex items-center gap-4 mb-6">
                    <input
                        type="text"
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-32"
                    />
                    <h2 className="text-2xl font-bold text-white">
                        {snapshotData.company_info?.companyName || selectedTicker}
                    </h2>
                    <span className="text-gray-400">{data.length} years of data</span>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {latestYear && (
                        <>
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-gray-400 text-xs">Revenue</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(latestYear.revenue)}</div>
                                <div className={`text-sm ${getGainColor(revenueGrowth.cagr5)}`}>
                                    CAGR 5Y: {formatPercent(revenueGrowth.cagr5)}
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-gray-400 text-xs">Net Income</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(latestYear.netIncome)}</div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-gray-400 text-xs">EPS</div>
                                <div className="text-xl font-bold text-white">${latestYear.eps?.toFixed(2)}</div>
                                <div className={`text-sm ${getGainColor(epsGrowth.cagr5)}`}>
                                    CAGR 5Y: {formatPercent(epsGrowth.cagr5)}
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-gray-400 text-xs">ROE</div>
                                <div className={`text-xl font-bold ${getRatioColor(latestYear.roe * 100, 15, 5)}`}>
                                    {formatPercent(latestYear.roe)}
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-gray-400 text-xs">Debt/Equity</div>
                                <div className={`text-xl font-bold ${getRatioColor(2 - latestYear.debtToEquity, 1, 0)}`}>
                                    {latestYear.debtToEquity?.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-gray-400 text-xs">FCF</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(latestYear.freeCashFlow)}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Historical Data Table */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                        <h3 className="text-lg font-semibold">Historical Financial Data</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-400 sticky left-0 bg-gray-900">Year</th>
                                    <th className="px-3 py-2 text-right text-gray-400">Revenue</th>
                                    <th className="px-3 py-2 text-right text-gray-400">Net Income</th>
                                    <th className="px-3 py-2 text-right text-gray-400">EPS</th>
                                    <th className="px-3 py-2 text-right text-gray-400">ROE</th>
                                    <th className="px-3 py-2 text-right text-gray-400">ROA</th>
                                    <th className="px-3 py-2 text-right text-gray-400">D/E</th>
                                    <th className="px-3 py-2 text-right text-gray-400">Net Margin</th>
                                    <th className="px-3 py-2 text-right text-gray-400">FCF</th>
                                    <th className="px-3 py-2 text-right text-gray-400">Dividend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 30).map((year, idx) => (
                                    <tr
                                        key={year.year}
                                        className={`border-t border-gray-700 ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}`}
                                    >
                                        <td className="px-3 py-2 font-bold text-white sticky left-0 bg-inherit">{year.year}</td>
                                        <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(year.revenue)}</td>
                                        <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(year.netIncome)}</td>
                                        <td className="px-3 py-2 text-right text-white">${year.eps?.toFixed(2) || 'N/A'}</td>
                                        <td className={`px-3 py-2 text-right ${getRatioColor(year.roe * 100, 15, 5)}`}>
                                            {formatPercent(year.roe)}
                                        </td>
                                        <td className={`px-3 py-2 text-right ${getRatioColor(year.roa * 100, 10, 3)}`}>
                                            {formatPercent(year.roa)}
                                        </td>
                                        <td className={`px-3 py-2 text-right ${getRatioColor(2 - year.debtToEquity, 1, 0)}`}>
                                            {year.debtToEquity?.toFixed(2) || 'N/A'}
                                        </td>
                                        <td className={`px-3 py-2 text-right ${getRatioColor(year.netMargin * 100, 15, 5)}`}>
                                            {formatPercent(year.netMargin)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(year.freeCashFlow)}</td>
                                        <td className="px-3 py-2 text-right text-green-400">${year.dividend?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Render screener view
    const renderScreener = () => (
        <div>
            {/* Filter Builder */}
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Screener Filters</h3>
                <div className="space-y-3">
                    {screenerFilters.map((filter, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <select
                                value={filter.metric}
                                onChange={(e) => {
                                    const newFilters = [...screenerFilters];
                                    newFilters[idx].metric = e.target.value;
                                    setScreenerFilters(newFilters);
                                }}
                                className="px-3 py-2 bg-gray-700 rounded-lg text-white"
                            >
                                {availableMetrics.map(m => (
                                    <option key={m.key} value={m.key}>{m.label}</option>
                                ))}
                            </select>
                            <select
                                value={filter.operator}
                                onChange={(e) => {
                                    const newFilters = [...screenerFilters];
                                    newFilters[idx].operator = e.target.value as any;
                                    setScreenerFilters(newFilters);
                                }}
                                className="px-3 py-2 bg-gray-700 rounded-lg text-white"
                            >
                                <option value="gt">&gt;</option>
                                <option value="gte">&gt;=</option>
                                <option value="lt">&lt;</option>
                                <option value="lte">&lt;=</option>
                                <option value="eq">=</option>
                            </select>
                            <input
                                type="number"
                                value={filter.value}
                                onChange={(e) => {
                                    const newFilters = [...screenerFilters];
                                    newFilters[idx].value = parseFloat(e.target.value);
                                    setScreenerFilters(newFilters);
                                }}
                                className="px-3 py-2 bg-gray-700 rounded-lg text-white w-32"
                            />
                            <button
                                onClick={() => setScreenerFilters(screenerFilters.filter((_, i) => i !== idx))}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setScreenerFilters([...screenerFilters, { metric: 'roe', operator: 'gt', value: 0.15 }])}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                        >
                            + Add Filter
                        </button>
                        <button
                            onClick={runScreener}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
                        >
                            Run Screener
                        </button>
                    </div>
                </div>

                {/* Preset Filters */}
                <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                        onClick={() => setScreenerFilters([
                            { metric: 'roe', operator: 'gt', value: 0.15 },
                            { metric: 'debtToEquity', operator: 'lt', value: 1 },
                        ])}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                    >
                        High Quality
                    </button>
                    <button
                        onClick={() => setScreenerFilters([
                            { metric: 'dividendYield', operator: 'gt', value: 0.03 },
                        ])}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                    >
                        Dividend 3%+
                    </button>
                    <button
                        onClick={() => setScreenerFilters([
                            { metric: 'netMargin', operator: 'gt', value: 0.20 },
                        ])}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                    >
                        High Margin
                    </button>
                    <button
                        onClick={() => setScreenerFilters([
                            { metric: 'freeCashFlow', operator: 'gt', value: 1000000000 },
                        ])}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                    >
                        FCF &gt; $1B
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Results ({screenerResults.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-gray-400">Ticker</th>
                                <th className="px-4 py-3 text-left text-gray-400">Company</th>
                                <th className="px-4 py-3 text-right text-gray-400">Years</th>
                                <th className="px-4 py-3 text-right text-gray-400">Revenue</th>
                                <th className="px-4 py-3 text-right text-gray-400">ROE</th>
                                <th className="px-4 py-3 text-right text-gray-400">D/E</th>
                                <th className="px-4 py-3 text-right text-gray-400">Net Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {screenerResults.map((result, idx) => (
                                <tr
                                    key={result.ticker}
                                    className={`border-t border-gray-700 hover:bg-gray-700/50 cursor-pointer ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}`}
                                    onClick={() => {
                                        setSelectedTicker(result.ticker);
                                        setViewMode('analysis');
                                    }}
                                >
                                    <td className="px-4 py-3 font-bold text-blue-400">{result.ticker}</td>
                                    <td className="px-4 py-3 text-gray-300 truncate max-w-xs">
                                        {result.companyInfo?.companyName || result.ticker}
                                    </td>
                                    <td className="px-4 py-3 text-right text-white">{result.yearsOfData}</td>
                                    <td className="px-4 py-3 text-right text-white">
                                        {formatCurrency(result.latestData?.revenue)}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${getRatioColor((result.latestData?.roe || 0) * 100, 15, 5)}`}>
                                        {formatPercent(result.latestData?.roe)}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${getRatioColor(2 - (result.latestData?.debtToEquity || 0), 1, 0)}`}>
                                        {result.latestData?.debtToEquity?.toFixed(2) || 'N/A'}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${getRatioColor((result.latestData?.netMargin || 0) * 100, 15, 5)}`}>
                                        {formatPercent(result.latestData?.netMargin)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Render compare view
    const renderCompare = () => (
        <div>
            {/* Ticker Selector */}
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Compare Stocks</h3>
                <div className="flex gap-2 flex-wrap items-center">
                    {compareList.map((ticker, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-gray-700 rounded-lg px-3 py-2">
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => {
                                    const newList = [...compareList];
                                    newList[idx] = e.target.value.toUpperCase();
                                    setCompareList(newList);
                                }}
                                className="bg-transparent w-20 text-white outline-none"
                            />
                            <button
                                onClick={() => setCompareList(compareList.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300"
                            >
                                x
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setCompareList([...compareList, ''])}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                    >
                        + Add
                    </button>
                    <button
                        onClick={() => fetchCompareData(compareList.filter(t => t))}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
                    >
                        Compare
                    </button>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-gray-400 sticky left-0 bg-gray-900">Metric</th>
                                {compareList.filter(t => t && compareData[t]).map(ticker => (
                                    <th key={ticker} className="px-4 py-3 text-center text-blue-400 font-bold">
                                        {ticker}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {availableMetrics.slice(0, 12).map((metric, idx) => {
                                const values = compareList
                                    .filter(t => t && compareData[t])
                                    .map(ticker => ({
                                        ticker,
                                        value: compareData[ticker]?.annual_data?.[0]?.[metric.key as keyof AnnualData] as number
                                    }));
                                const maxValue = Math.max(...values.map(v => v.value || 0));

                                return (
                                    <tr
                                        key={metric.key}
                                        className={`border-t border-gray-700 ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}`}
                                    >
                                        <td className="px-4 py-3 text-gray-300 sticky left-0 bg-inherit">{metric.label}</td>
                                        {values.map(({ ticker, value }) => (
                                            <td
                                                key={ticker}
                                                className={`px-4 py-3 text-center ${value === maxValue && metric.key !== 'debtToEquity' ? 'text-green-400 font-bold' : 'text-white'}`}
                                            >
                                                {formatValue(value, metric.format)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Render ratios view
    const renderRatios = () => {
        if (!snapshotData?.annual_data?.length) {
            return (
                <div className="text-center py-12 text-gray-400">
                    Select a ticker first to view detailed ratios
                </div>
            );
        }

        const data = snapshotData.annual_data;
        const latest = data[0];
        const prev = data[1];

        const ratioGroups = [
            {
                title: 'Profitability',
                ratios: [
                    { label: 'Return on Equity (ROE)', value: latest.roe, prev: prev?.roe, format: 'percent', good: 0.15 },
                    { label: 'Return on Assets (ROA)', value: latest.roa, prev: prev?.roa, format: 'percent', good: 0.10 },
                    { label: 'Gross Margin', value: latest.grossMargin, prev: prev?.grossMargin, format: 'percent', good: 0.40 },
                    { label: 'Operating Margin', value: latest.operatingMargin, prev: prev?.operatingMargin, format: 'percent', good: 0.20 },
                    { label: 'Net Margin', value: latest.netMargin, prev: prev?.netMargin, format: 'percent', good: 0.15 },
                ]
            },
            {
                title: 'Leverage & Liquidity',
                ratios: [
                    { label: 'Debt to Equity', value: latest.debtToEquity, prev: prev?.debtToEquity, format: 'ratio', good: 0.5, lower: true },
                    { label: 'Current Ratio', value: latest.currentRatio, prev: prev?.currentRatio, format: 'ratio', good: 1.5 },
                ]
            },
            {
                title: 'Valuation',
                ratios: [
                    { label: 'P/E Ratio', value: latest.pe, prev: prev?.pe, format: 'ratio', good: 15, lower: true },
                    { label: 'P/B Ratio', value: latest.pb, prev: prev?.pb, format: 'ratio', good: 3, lower: true },
                    { label: 'Dividend Yield', value: latest.dividendYield, prev: prev?.dividendYield, format: 'percent', good: 0.02 },
                ]
            }
        ];

        return (
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <input
                        type="text"
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-32"
                    />
                    <h2 className="text-2xl font-bold text-white">
                        {snapshotData.company_info?.companyName || selectedTicker} - Key Ratios
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ratioGroups.map(group => (
                        <div key={group.title} className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-blue-400">{group.title}</h3>
                            <div className="space-y-4">
                                {group.ratios.map(ratio => {
                                    const change = ratio.prev ? ratio.value - ratio.prev : 0;
                                    const isGood = ratio.lower
                                        ? ratio.value <= ratio.good
                                        : ratio.value >= ratio.good;

                                    return (
                                        <div key={ratio.label}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-gray-400 text-sm">{ratio.label}</span>
                                                <span className={`font-bold ${isGood ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {ratio.format === 'percent' ? formatPercent(ratio.value) : ratio.value?.toFixed(2) || 'N/A'}
                                                </span>
                                            </div>
                                            {change !== 0 && (
                                                <div className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    vs prev year: {change > 0 ? '+' : ''}{ratio.format === 'percent' ? formatPercent(change) : change.toFixed(2)}
                                                </div>
                                            )}
                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                                                <div
                                                    className={`h-full rounded-full ${isGood ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    style={{
                                                        width: `${Math.min(100, (ratio.format === 'percent' ? ratio.value * 100 : ratio.value) / (ratio.good * (ratio.format === 'percent' ? 100 : 1)) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render history view
    const renderHistory = () => {
        if (!snapshotData?.annual_data?.length) {
            return (
                <div className="text-center py-12 text-gray-400">
                    Select a ticker first to view historical data
                </div>
            );
        }

        const data = snapshotData.annual_data;

        // Prepare chart data (simple bar representation)
        const chartMetrics = ['revenue', 'netIncome', 'eps', 'freeCashFlow'];

        return (
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <input
                        type="text"
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white w-32"
                    />
                    <h2 className="text-2xl font-bold text-white">
                        {snapshotData.company_info?.companyName || selectedTicker} - Historical Trends
                    </h2>
                </div>

                {/* Metric Selector */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {availableMetrics.slice(0, 10).map(metric => (
                        <button
                            key={metric.key}
                            onClick={() => {
                                if (selectedMetrics.includes(metric.key)) {
                                    setSelectedMetrics(selectedMetrics.filter(m => m !== metric.key));
                                } else {
                                    setSelectedMetrics([...selectedMetrics, metric.key]);
                                }
                            }}
                            className={`px-3 py-1 rounded-lg text-sm ${
                                selectedMetrics.includes(metric.key)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {metric.label}
                        </button>
                    ))}
                </div>

                {/* Simple bar charts for each metric */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedMetrics.slice(0, 4).map(metricKey => {
                        const metric = availableMetrics.find(m => m.key === metricKey);
                        if (!metric) return null;

                        const values = data.slice(0, 20).reverse().map(d => ({
                            year: d.year,
                            value: d[metricKey as keyof AnnualData] as number
                        }));
                        const maxValue = Math.max(...values.map(v => Math.abs(v.value || 0)));

                        return (
                            <div key={metricKey} className="bg-gray-800 rounded-xl p-4">
                                <h4 className="text-lg font-semibold mb-4">{metric.label}</h4>
                                <div className="space-y-2">
                                    {values.slice(-10).map(({ year, value }) => (
                                        <div key={year} className="flex items-center gap-2">
                                            <span className="text-gray-400 w-12 text-sm">{year}</span>
                                            <div className="flex-1 bg-gray-700 rounded h-6 overflow-hidden">
                                                <div
                                                    className={`h-full ${value >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.abs(value) / maxValue * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-white text-sm w-24 text-right">
                                                {formatValue(value, metric.format)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Growth Analysis */}
                <div className="bg-gray-800 rounded-xl p-4 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Compound Annual Growth Rates (CAGR)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['revenue', 'netIncome', 'eps', 'freeCashFlow'].map(metricKey => {
                            const growth = calculateGrowth(data, metricKey as keyof AnnualData);
                            const metric = availableMetrics.find(m => m.key === metricKey);

                            return (
                                <div key={metricKey} className="bg-gray-700 rounded-lg p-3">
                                    <div className="text-gray-400 text-sm mb-2">{metric?.label}</div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-xs text-gray-500">1Y</div>
                                            <div className={getGainColor(growth.cagr1)}>
                                                {formatPercent(growth.cagr1)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">5Y</div>
                                            <div className={getGainColor(growth.cagr5)}>
                                                {formatPercent(growth.cagr5)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">10Y</div>
                                            <div className={getGainColor(growth.cagr10)}>
                                                {formatPercent(growth.cagr10)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // Render content based on view mode
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            );
        }

        switch (viewMode) {
            case 'portfolio': return renderPortfolio();
            case 'analysis': return renderAnalysis();
            case 'screener': return renderScreener();
            case 'compare': return renderCompare();
            case 'ratios': return renderRatios();
            case 'history': return renderHistory();
            default: return renderPortfolio();
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Finance Pro</h1>
                <p className="text-gray-400">
                    Portfolio management, fundamental analysis, and stock screening with up to 30 years of historical data
                </p>
            </div>

            {/* Stats Bar */}
            {renderStatsBar()}

            {/* Navigation */}
            {renderNav()}

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Content */}
            {renderContent()}
        </div>
    );
});

// Set display name for debugging
FinanceProTab.displayName = 'FinanceProTab';

export default FinanceProTab;
