import React, { useState, useEffect, useCallback, useMemo } from 'react';

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
    revenue?: number;
    netIncome?: number;
    eps?: number;
    dividend?: number;
    bookValue?: number;
    roe?: number;
    roa?: number;
    debtToEquity?: number;
    currentRatio?: number;
    grossMargin?: number;
    operatingMargin?: number;
    netMargin?: number;
    freeCashFlow?: number;
    shares?: number;
    price?: number;
    pe?: number;
    pb?: number;
    dividendYield?: number;
    // Legacy fields from 3p1
    priceHigh?: number;
    priceLow?: number;
    cashFlowPerShare?: number;
    dividendPerShare?: number;
    bookValuePerShare?: number;
    earningsPerShare?: number;
}

interface ScreenerFilter {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
}

type ViewMode = 'overview' | 'screener' | 'compare' | 'ratios';

interface FinanceProViewProps {
    onSelectTicker?: (ticker: string) => void;
}

export const FinanceProView: React.FC<FinanceProViewProps> = ({ onSelectTicker }) => {
    // State
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [allSnapshots, setAllSnapshots] = useState<FinanceSnapshot[]>([]);
    const [selectedTicker, setSelectedTicker] = useState<string>('');
    const [snapshotData, setSnapshotData] = useState<FinanceSnapshot | null>(null);

    // Screener state
    const [screenerResults, setScreenerResults] = useState<any[]>([]);
    const [screenerFilters, setScreenerFilters] = useState<ScreenerFilter[]>([]);

    // Compare state
    const [compareList, setCompareList] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
    const [compareData, setCompareData] = useState<Record<string, FinanceSnapshot>>({});

    // Search/filter
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'ticker' | 'years' | 'roe' | 'margin'>('ticker');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // API base
    const apiBase = typeof window !== 'undefined' ? window.location.origin : '';

    // Available metrics
    const availableMetrics = [
        { key: 'roe', label: 'ROE', format: 'percent' },
        { key: 'roa', label: 'ROA', format: 'percent' },
        { key: 'netMargin', label: 'Net Margin', format: 'percent' },
        { key: 'grossMargin', label: 'Gross Margin', format: 'percent' },
        { key: 'debtToEquity', label: 'Debt/Equity', format: 'ratio' },
        { key: 'currentRatio', label: 'Current Ratio', format: 'ratio' },
        { key: 'earningsPerShare', label: 'EPS', format: 'currency' },
        { key: 'bookValuePerShare', label: 'Book Value', format: 'currency' },
        { key: 'dividendPerShare', label: 'Dividend', format: 'currency' },
    ];

    // Format helpers
    const formatCurrency = (value: number) => {
        if (!value && value !== 0) return 'N/A';
        if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toFixed(2)}`;
    };

    const formatPercent = (value: number) => {
        if (!value && value !== 0) return 'N/A';
        // Handle both decimal (0.15) and percentage (15) formats
        const pct = Math.abs(value) < 1 ? value * 100 : value;
        return `${pct.toFixed(2)}%`;
    };

    const formatValue = (value: number, format: string) => {
        switch (format) {
            case 'currency': return formatCurrency(value);
            case 'percent': return formatPercent(value);
            case 'ratio': return value?.toFixed(2) || 'N/A';
            default: return value?.toFixed(2) || 'N/A';
        }
    };

    const getGainColor = (value: number) => {
        if (value > 0) return 'text-green-500';
        if (value < 0) return 'text-red-500';
        return 'text-gray-500';
    };

    const getRatioColor = (value: number, goodAbove: number, badBelow: number) => {
        if (value >= goodAbove) return 'text-green-500';
        if (value <= badBelow) return 'text-red-500';
        return 'text-yellow-500';
    };

    // Fetch all snapshots
    const fetchAllSnapshots = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBase}/api/finance-snapshots?all=true&current=true&limit=2000`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setAllSnapshots(data.data || []);
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching snapshots:', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    // Fetch single snapshot
    const fetchSnapshot = useCallback(async (ticker: string) => {
        try {
            const response = await fetch(`${apiBase}/api/finance-snapshots?ticker=${ticker}&current=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.length > 0) {
                    setSnapshotData(data.data[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching snapshot:', err);
        }
    }, [apiBase]);

    // Fetch compare data
    const fetchCompareData = useCallback(async (tickers: string[]) => {
        setLoading(true);
        try {
            const results: Record<string, FinanceSnapshot> = {};
            await Promise.all(tickers.filter(t => t).map(async (ticker) => {
                const response = await fetch(`${apiBase}/api/finance-snapshots?ticker=${ticker}&current=true`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.length > 0) {
                        results[ticker] = data.data[0];
                    }
                }
            }));
            setCompareData(results);
        } catch (err) {
            console.error('Error fetching compare data:', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    // Run screener
    const runScreener = useCallback(() => {
        const results: any[] = [];

        for (const snapshot of allSnapshots) {
            if (!snapshot.annual_data?.length) continue;

            const latestYear = snapshot.annual_data[0];
            let passesFilters = true;

            for (const filter of screenerFilters) {
                const value = latestYear[filter.metric as keyof AnnualData] as number;
                if (value === undefined || value === null) continue;

                switch (filter.operator) {
                    case 'gt': passesFilters = value > filter.value; break;
                    case 'lt': passesFilters = value < filter.value; break;
                    case 'gte': passesFilters = value >= filter.value; break;
                    case 'lte': passesFilters = value <= filter.value; break;
                    case 'eq': passesFilters = Math.abs(value - filter.value) < 0.001; break;
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

        setScreenerResults(results.slice(0, 100));
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

    // Stats summary
    const stats = useMemo(() => {
        const total = allSnapshots.length;
        const avgYears = allSnapshots.reduce((sum, s) => sum + (s.annual_data?.length || 0), 0) / (total || 1);
        const with30Years = allSnapshots.filter(s => s.annual_data?.length >= 30).length;
        const with20Years = allSnapshots.filter(s => s.annual_data?.length >= 20).length;
        return { total, avgYears, with30Years, with20Years };
    }, [allSnapshots]);

    // Filtered and sorted snapshots
    const filteredSnapshots = useMemo(() => {
        let result = [...allSnapshots];

        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.ticker.toLowerCase().includes(term) ||
                s.company_info?.companyName?.toLowerCase().includes(term)
            );
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'ticker':
                    comparison = a.ticker.localeCompare(b.ticker);
                    break;
                case 'years':
                    comparison = (b.annual_data?.length || 0) - (a.annual_data?.length || 0);
                    break;
                case 'roe':
                    const roeA = a.annual_data?.[0]?.roe || a.annual_data?.[0]?.earningsPerShare || 0;
                    const roeB = b.annual_data?.[0]?.roe || b.annual_data?.[0]?.earningsPerShare || 0;
                    comparison = roeB - roeA;
                    break;
                case 'margin':
                    const marginA = a.annual_data?.[0]?.netMargin || 0;
                    const marginB = b.annual_data?.[0]?.netMargin || 0;
                    comparison = marginB - marginA;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [allSnapshots, searchTerm, sortBy, sortOrder]);

    // Handle ticker click
    const handleTickerClick = (ticker: string) => {
        setSelectedTicker(ticker);
        if (onSelectTicker) {
            onSelectTicker(ticker);
        }
    };

    // Render stats bar
    const renderStatsBar = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="text-gray-500 text-xs">Total Tickers</div>
                <div className="text-xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="text-gray-500 text-xs">Avg Years Data</div>
                <div className="text-xl font-bold text-blue-600">{stats.avgYears.toFixed(1)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="text-gray-500 text-xs">30+ Years</div>
                <div className="text-xl font-bold text-green-600">{stats.with30Years}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="text-gray-500 text-xs">20+ Years</div>
                <div className="text-xl font-bold text-yellow-600">{stats.with20Years}</div>
            </div>
        </div>
    );

    // Render navigation
    const renderNav = () => (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'screener', label: 'Screener', icon: '🔍' },
                { id: 'compare', label: 'Compare', icon: '⚖️' },
                { id: 'ratios', label: 'Ratios', icon: '📈' },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setViewMode(item.id as ViewMode)}
                    className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                        viewMode === item.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    {item.icon} {item.label}
                </button>
            ))}
        </div>
    );

    // Render overview
    const renderOverview = () => (
        <div>
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search ticker or company..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                    <option value="ticker">Sort by Ticker</option>
                    <option value="years">Sort by Years of Data</option>
                    <option value="roe">Sort by ROE/EPS</option>
                    <option value="margin">Sort by Margin</option>
                </select>
                <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Ticker</th>
                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Company</th>
                                <th className="px-3 py-2 text-right text-gray-600 font-medium">Years</th>
                                <th className="px-3 py-2 text-right text-gray-600 font-medium">EPS</th>
                                <th className="px-3 py-2 text-right text-gray-600 font-medium">Book Value</th>
                                <th className="px-3 py-2 text-right text-gray-600 font-medium">Dividend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSnapshots.slice(0, 100).map((snapshot, idx) => {
                                const latest = snapshot.annual_data?.[0];
                                return (
                                    <tr
                                        key={snapshot.id}
                                        onClick={() => handleTickerClick(snapshot.ticker)}
                                        className={`border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                        }`}
                                    >
                                        <td className="px-3 py-2 font-bold text-blue-600">{snapshot.ticker}</td>
                                        <td className="px-3 py-2 text-gray-700 truncate max-w-[200px]">
                                            {snapshot.company_info?.companyName || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800 font-medium">
                                            {snapshot.annual_data?.length || 0}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {latest?.earningsPerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {latest?.bookValuePerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-green-600">
                                            {latest?.dividendPerShare?.toFixed(2) || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredSnapshots.length > 100 && (
                    <div className="px-3 py-2 bg-gray-50 text-gray-500 text-sm text-center">
                        Showing 100 of {filteredSnapshots.length} results
                    </div>
                )}
            </div>
        </div>
    );

    // Render screener
    const renderScreener = () => (
        <div>
            {/* Filter Builder */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Screener Filters</h3>
                <div className="space-y-2">
                    {screenerFilters.map((filter, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <select
                                value={filter.metric}
                                onChange={(e) => {
                                    const newFilters = [...screenerFilters];
                                    newFilters[idx].metric = e.target.value;
                                    setScreenerFilters(newFilters);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                                <option value="gt">&gt;</option>
                                <option value="gte">&gt;=</option>
                                <option value="lt">&lt;</option>
                                <option value="lte">&lt;=</option>
                                <option value="eq">=</option>
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                value={filter.value}
                                onChange={(e) => {
                                    const newFilters = [...screenerFilters];
                                    newFilters[idx].value = parseFloat(e.target.value) || 0;
                                    setScreenerFilters(newFilters);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                            />
                            <button
                                onClick={() => setScreenerFilters(screenerFilters.filter((_, i) => i !== idx))}
                                className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                        onClick={() => setScreenerFilters([...screenerFilters, { metric: 'roe', operator: 'gt', value: 0.15 }])}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                        + Add Filter
                    </button>
                    <button
                        onClick={runScreener}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                        Run Screener
                    </button>
                </div>

                {/* Preset Filters */}
                <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                        onClick={() => {
                            setScreenerFilters([
                                { metric: 'earningsPerShare', operator: 'gt', value: 5 },
                            ]);
                        }}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                    >
                        EPS &gt; $5
                    </button>
                    <button
                        onClick={() => {
                            setScreenerFilters([
                                { metric: 'dividendPerShare', operator: 'gt', value: 1 },
                            ]);
                        }}
                        className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"
                    >
                        Dividend &gt; $1
                    </button>
                    <button
                        onClick={() => {
                            setScreenerFilters([
                                { metric: 'bookValuePerShare', operator: 'gt', value: 20 },
                            ]);
                        }}
                        className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100"
                    >
                        Book Value &gt; $20
                    </button>
                </div>
            </div>

            {/* Results */}
            {screenerResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Results: {screenerResults.length}</span>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Ticker</th>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Company</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Years</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">EPS</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Book Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {screenerResults.map((result, idx) => (
                                    <tr
                                        key={result.ticker}
                                        onClick={() => handleTickerClick(result.ticker)}
                                        className={`border-t border-gray-100 hover:bg-blue-50 cursor-pointer ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                        }`}
                                    >
                                        <td className="px-3 py-2 font-bold text-blue-600">{result.ticker}</td>
                                        <td className="px-3 py-2 text-gray-700 truncate max-w-[200px]">
                                            {result.companyInfo?.companyName || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">{result.yearsOfData}</td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {result.latestData?.earningsPerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {result.latestData?.bookValuePerShare?.toFixed(2) || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // Render compare
    const renderCompare = () => (
        <div>
            {/* Ticker Selector */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Compare Stocks</h3>
                <div className="flex gap-2 flex-wrap items-center">
                    {compareList.map((ticker, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => {
                                    const newList = [...compareList];
                                    newList[idx] = e.target.value.toUpperCase();
                                    setCompareList(newList);
                                }}
                                className="bg-transparent w-16 text-sm font-medium outline-none"
                            />
                            <button
                                onClick={() => setCompareList(compareList.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 text-xs"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setCompareList([...compareList, ''])}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                        + Add
                    </button>
                    <button
                        onClick={() => fetchCompareData(compareList.filter(t => t))}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                        Compare
                    </button>
                </div>
            </div>

            {/* Comparison Table */}
            {Object.keys(compareData).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Metric</th>
                                    {compareList.filter(t => t && compareData[t]).map(ticker => (
                                        <th key={ticker} className="px-3 py-2 text-center text-blue-600 font-bold">
                                            {ticker}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-2 text-gray-600">Years of Data</td>
                                    {compareList.filter(t => t && compareData[t]).map(ticker => (
                                        <td key={ticker} className="px-3 py-2 text-center text-gray-800">
                                            {compareData[ticker]?.annual_data?.length || 0}
                                        </td>
                                    ))}
                                </tr>
                                {availableMetrics.slice(0, 6).map((metric, idx) => {
                                    const values = compareList
                                        .filter(t => t && compareData[t])
                                        .map(ticker => ({
                                            ticker,
                                            value: compareData[ticker]?.annual_data?.[0]?.[metric.key as keyof AnnualData] as number
                                        }));
                                    const maxValue = Math.max(...values.map(v => v.value || 0));

                                    return (
                                        <tr key={metric.key} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                            <td className="px-3 py-2 text-gray-600">{metric.label}</td>
                                            {values.map(({ ticker, value }) => (
                                                <td
                                                    key={ticker}
                                                    className={`px-3 py-2 text-center ${
                                                        value === maxValue && metric.key !== 'debtToEquity'
                                                            ? 'text-green-600 font-bold'
                                                            : 'text-gray-800'
                                                    }`}
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
            )}
        </div>
    );

    // Render ratios (for selected ticker)
    const renderRatios = () => {
        if (!snapshotData) {
            return (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500 mb-3">Select a ticker to view detailed ratios</p>
                    <div className="flex gap-2 justify-center">
                        <input
                            type="text"
                            value={selectedTicker}
                            onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                            placeholder="Enter ticker..."
                            className="px-3 py-2 border border-gray-300 rounded-lg w-32 text-center"
                        />
                        <button
                            onClick={() => fetchSnapshot(selectedTicker)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Load
                        </button>
                    </div>
                </div>
            );
        }

        const data = snapshotData.annual_data || [];

        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <input
                        type="text"
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                        className="px-3 py-2 border border-gray-300 rounded-lg w-24 font-bold"
                    />
                    <h3 className="text-lg font-bold text-gray-800">
                        {snapshotData.company_info?.companyName || selectedTicker}
                    </h3>
                    <span className="text-sm text-gray-500">({data.length} years)</span>
                </div>

                {/* Historical Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Year</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">EPS</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Book Value</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Dividend</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Cash Flow</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Price High</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Price Low</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 30).map((year, idx) => (
                                    <tr key={year.year} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="px-3 py-2 font-bold text-gray-800">{year.year}</td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {year.earningsPerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {year.bookValuePerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-green-600">
                                            {year.dividendPerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {year.cashFlowPerShare?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {year.priceHigh?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {year.priceLow?.toFixed(2) || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
            );
        }

        switch (viewMode) {
            case 'overview': return renderOverview();
            case 'screener': return renderScreener();
            case 'compare': return renderCompare();
            case 'ratios': return renderRatios();
            default: return renderOverview();
        }
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Finance Pro</h2>
                <p className="text-sm text-gray-500">
                    Analyse fondamentale avec jusqu'à 30 ans de données historiques
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Stats Bar */}
            {renderStatsBar()}

            {/* Navigation */}
            {renderNav()}

            {/* Content */}
            {renderContent()}
        </div>
    );
};

export default FinanceProView;
