import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HistoricalTable } from './components/HistoricalTable';
import { ValuationCharts } from './components/ValuationCharts';
// ... other imports

// ... inside App component
// <Header ... /> -> commented out in render
import { Sidebar } from './components/Sidebar';
import { SensitivityTable } from './components/SensitivityTable';
import { NotesEditor } from './components/NotesEditor';
import { EvaluationDetails } from './components/EvaluationDetails';
import { InfoTab } from './components/InfoTab';
import { TickerSearch } from './components/TickerSearch';
import { ConfirmSyncDialog } from './components/ConfirmSyncDialog';
import { HistoricalVersionBanner } from './components/HistoricalVersionBanner';
import { AnnualData, Assumptions, CompanyInfo, Recommendation, AnalysisProfile } from './types';
import { calculateRowRatios, calculateAverage, projectFutureValue, formatCurrency, formatPercent, calculateCAGR, calculateRecommendation } from './utils/calculations';
import { Cog6ToothIcon, CalculatorIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, Bars3Icon, ArrowPathIcon, ChartBarSquareIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { fetchCompanyData } from './services/financeApi';
import { saveSnapshot, hasManualEdits, loadSnapshot, listSnapshots } from './services/snapshotApi';

// Initial Mock Data mirroring the image
const INITIAL_DATA: AnnualData[] = [
    { year: 2021, priceHigh: 417.40, priceLow: 241.70, cashFlowPerShare: 11.96, dividendPerShare: 3.52, bookValuePerShare: 30.87, earningsPerShare: 8.80 },
    { year: 2022, priceHigh: 415.50, priceLow: 243.00, cashFlowPerShare: 14.19, dividendPerShare: 3.88, bookValuePerShare: 35.00, earningsPerShare: 10.71 },
    { year: 2023, priceHigh: 355.40, priceLow: 242.80, cashFlowPerShare: 15.46, dividendPerShare: 4.48, bookValuePerShare: 40.87, earningsPerShare: 11.67 },
    { year: 2024, priceHigh: 387.50, priceLow: 278.70, cashFlowPerShare: 15.61, dividendPerShare: 5.16, bookValuePerShare: 45.24, earningsPerShare: 11.95 },
    { year: 2025, priceHigh: 398.30, priceLow: 229.40, cashFlowPerShare: 16.13, dividendPerShare: 5.92, bookValuePerShare: 50.16, earningsPerShare: 12.93, isEstimate: true },
    { year: 2026, priceHigh: 0, priceLow: 0, cashFlowPerShare: 17.90, dividendPerShare: 0, bookValuePerShare: 53.40, earningsPerShare: 13.75, isEstimate: true },
];

const INITIAL_ASSUMPTIONS: Assumptions = {
    currentPrice: 250.00,
    currentDividend: 6.00,
    growthRateEPS: 5.0,
    growthRateSales: 5.0,
    growthRateCF: 5.0,
    growthRateBV: 3.0,
    growthRateDiv: 1.0,
    targetPE: 23.0,
    targetPCF: 18.0,
    targetPBV: 6.0,
    targetYield: 1.8,
    requiredReturn: 10.0,
    dividendPayoutRatio: 35.0,
    baseYear: 2025
};

const INITIAL_INFO: CompanyInfo = {
    symbol: 'ACN',
    name: 'Accenture PLC',
    sector: 'Services TI',
    securityRank: 'A+',
    marketCap: '156.4B'
};

const DEFAULT_PROFILE: AnalysisProfile = {
    id: 'ACN',
    lastModified: Date.now(),
    data: INITIAL_DATA,
    assumptions: INITIAL_ASSUMPTIONS,
    info: INITIAL_INFO,
    notes: '',
    isWatchlist: false
};

const STORAGE_KEY = 'finance_pro_profiles';

export default function App() {
    // --- GLOBAL STATE & PERSISTENCE ---
    const [library, setLibrary] = useState<Record<string, AnalysisProfile>>({});
    const [activeId, setActiveId] = useState<string>('ACN');
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'analysis' | 'info'>('analysis');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showConfirmSync, setShowConfirmSync] = useState(false);

    // Historical Version State
    const [currentSnapshot, setCurrentSnapshot] = useState<{
        id: string;
        date: string;
        version: number;
        isHistorical: boolean;
    } | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Load from LocalStorage on Mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setLibrary(parsed);
                    if (Object.keys(parsed).length > 0) {
                        setActiveId(Object.keys(parsed)[0]);
                    } else {
                        setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                    }
                } catch (e) {
                    console.error("Failed to parse profiles from localStorage", e);
                    setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                }
            } else {
                setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
            }
        } catch (e) {
            console.warn("LocalStorage access failed", e);
            setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
        }
        setIsInitialized(true);
    }, []);



    // --- ACTIVE SESSION STATE ---
    const [data, setData] = useState<AnnualData[]>(INITIAL_DATA);
    const [assumptions, setAssumptions] = useState<Assumptions>(INITIAL_ASSUMPTIONS);
    const [info, setInfo] = useState<CompanyInfo>(INITIAL_INFO);
    const [notes, setNotes] = useState<string>('');
    const [isWatchlist, setIsWatchlist] = useState<boolean>(false);

    // Load Active Profile when ID changes
    useEffect(() => {
        if (!isInitialized) return;
        const profile = library[activeId];
        if (profile) {
            setData(profile.data);
            setAssumptions({
                ...INITIAL_ASSUMPTIONS, // ensure new fields are populated for old profiles
                ...profile.assumptions
            });
            setInfo(profile.info);
            setNotes(profile.notes || '');
            setIsWatchlist(!!profile.isWatchlist);
            // Clear Undo/Redo stacks on switch
            setPastData([]);
            setFutureData([]);
        }
    }, [activeId, isInitialized]);

    // Save to Library when Active State Changes
    useEffect(() => {
        if (!isInitialized) return;

        const timer = setTimeout(() => {
            setLibrary(prev => {
                const updated = {
                    ...prev,
                    [activeId]: {
                        id: activeId,
                        lastModified: Date.now(),
                        data,
                        assumptions,
                        info,
                        notes,
                        isWatchlist
                    }
                };
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch (e) {
                    console.warn('Failed to save to LocalStorage:', e);
                }
                return updated;
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [data, assumptions, info, notes, isWatchlist, activeId, isInitialized]);


    // --- UNDO/REDO STATE ---
    const [pastData, setPastData] = useState<AnnualData[][]>([]);
    const [futureData, setFutureData] = useState<AnnualData[][]>([]);

    const undo = () => {
        if (pastData.length === 0) return;
        const previous = pastData[pastData.length - 1];
        const newPast = pastData.slice(0, pastData.length - 1);

        setFutureData([data, ...futureData]);
        setData(previous);
        setPastData(newPast);
    };

    const redo = () => {
        if (futureData.length === 0) return;
        const next = futureData[0];
        const newFuture = futureData.slice(1);

        setPastData([...pastData, data]);
        setData(next);
        setFutureData(newFuture);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    redo();
                } else {
                    e.preventDefault();
                    undo();
                }
            }
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pastData, futureData, data]);

    // --- HANDLERS ---

    const handleFetchData = async () => {
        // Check if manual edits exist
        const hasEdits = hasManualEdits(data);

        if (hasEdits) {
            // Show confirmation dialog
            setShowConfirmSync(true);
        } else {
            // No manual edits, sync directly
            await performSync(false);
        }
    };

    const performSync = async (saveCurrentVersion: boolean) => {
        try {
            // Save current version if requested
            if (saveCurrentVersion) {
                console.log('💾 Saving current version before sync...');
                const saveResult = await saveSnapshot(
                    activeId,
                    data,
                    assumptions,
                    info,
                    `Before API sync - ${new Date().toLocaleString()}`,
                    false, // Not current (we're about to replace it)
                    false  // Not auto-fetched
                );

                if (!saveResult.success) {
                    console.error('Failed to save snapshot:', saveResult.error);
                    alert(`Erreur lors de la sauvegarde: ${saveResult.error}`);
                    // Continue anyway?
                }
            }

            // Fetch new data from API
            const result = await fetchCompanyData(activeId);

            // Keep existing history for Undo
            setPastData(prev => [...prev, data]);
            setFutureData([]);

            // Update Data
            if (result.data.length > 0) {
                setData(result.data);
            }

            // Update Info
            if (result.info) {
                setInfo(prev => ({ ...prev, ...result.info }));
            }

            // Update Price Assumption
            if (result.currentPrice > 0) {
                setAssumptions(prev => ({
                    ...prev,
                    currentPrice: result.currentPrice,
                    // Try to update current dividend from latest year data if available
                    currentDividend: result.data.length > 0 ? result.data[result.data.length - 1].dividendPerShare : prev.currentDividend,
                    baseYear: result.data.length > 0 ? result.data[result.data.length - 1].year : prev.baseYear
                }));
            }

            // Auto-save snapshot after successful sync
            console.log('💾 Auto-saving snapshot after API sync...');
            await saveSnapshot(
                activeId,
                result.data,
                assumptions,
                info,
                `API sync - ${new Date().toLocaleString()}`,
                true,  // Mark as current
                true   // Auto-fetched
            );

            alert(`Données synchronisées avec succès pour ${activeId}`);

        } catch (e) {
            alert(`Erreur lors de la récupération des données : ${(e as Error).message}`);
        }
    };

    const handleUpdateRow = (index: number, field: keyof AnnualData, value: number) => {
        // Block updates if viewing historical version in read-only mode
        if (isReadOnly) {
            alert('Cette version est en lecture seule. Déverrouillez-la pour la modifier.');
            return;
        }

        setPastData(prev => [...prev, data]);
        setFutureData([]);

        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value, autoFetched: false };
        setData(updated);
    };

    const handleUpdateAssumption = (key: keyof Assumptions, value: number) => {
        setAssumptions(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdateInfo = (key: keyof CompanyInfo, value: string) => {
        setInfo(prev => ({ ...prev, [key]: value }));
    };

    const handleAddTicker = () => {
        setIsSearchOpen(true);
    };

    // --- SNAPSHOT MANAGEMENT HANDLERS ---

    const handleLoadSnapshot = async (snapshotId: string) => {
        console.log(`🔄 Attempting to load snapshot: ${snapshotId}`);
        const result = await loadSnapshot(snapshotId);

        if (!result.success) {
            console.error(`❌ Load failed: ${result.error}`);
            alert(`Erreur chargement: ${result.error}`);
            return;
        }

        const snapshot = result.snapshot;
        console.log('✅ Snapshot loaded:', snapshot);

        // Set historical version state
        setCurrentSnapshot({
            id: snapshot.id,
            date: snapshot.snapshot_date,
            version: snapshot.version,
            isHistorical: !snapshot.is_current
        });

        // Enable read-only mode for historical versions
        setIsReadOnly(!snapshot.is_current);

        // Load data
        setData(snapshot.annual_data);
        setAssumptions(snapshot.assumptions);
        setInfo(snapshot.company_info);

        console.log(`📜 Loaded snapshot v${snapshot.version} from ${snapshot.snapshot_date}`);
    };

    const handleRevertToCurrent = async () => {
        const result = await listSnapshots(activeId, 50);

        if (result.success && result.snapshots && result.snapshots.length > 0) {
            const currentSnap = result.snapshots.find(s => s.is_current);
            if (currentSnap) {
                await handleLoadSnapshot(currentSnap.id);
            } else {
                alert('Aucune version actuelle trouvée');
            }
        }

        // Reset historical state
        setCurrentSnapshot(null);
        setIsReadOnly(false);
    };

    const handleUnlockVersion = () => {
        if (!confirm('Déverrouiller cette version pour modification?\n\nLes changements seront enregistrés sur cette ancienne version.')) {
            return;
        }
        setIsReadOnly(false);
    };

    const handleManualSave = async () => {
        const defaultNote = `Sauvegarde manuelle - ${new Date().toLocaleString()}`;
        const note = prompt('Notes pour cette sauvegarde (optionnel):', defaultNote);

        if (note === null) return; // Cancelled

        const result = await saveSnapshot(
            activeId,
            data,
            assumptions,
            info,
            note || defaultNote,
            true,  // Mark as current (since it's a manual save of current state)
            false  // Not auto-fetched (user might have edited)
        );

        if (result.success) {
            alert('✅ Version sauvegardée avec succès!');
            // Update current snapshot state to reflect this new version
            if (result.snapshot) {
                setCurrentSnapshot({
                    id: result.snapshot.id,
                    date: result.snapshot.snapshot_date,
                    version: result.snapshot.version,
                    isHistorical: false
                });
            }
        } else {
            alert(`Erreur lors de la sauvegarde: ${result.error}`);
        }
    };

    // --- EVENT LISTENERS ---
    useEffect(() => {
        const handleSaveDialog = () => {
            handleManualSave();
        };
        window.addEventListener('open-save-dialog', handleSaveDialog);
        return () => window.removeEventListener('open-save-dialog', handleSaveDialog);
    }, [data, assumptions, info, notes, activeId]); // Dependencies for closure capture

    const handleSaveAsNew = async () => {
        const notes = prompt('Notes pour cette nouvelle version (optionnel):');

        const result = await saveSnapshot(
            activeId,
            data,
            assumptions,
            info,
            notes || `Copie de v${currentSnapshot?.version || '?'} - ${new Date().toLocaleString()}`,
            true,  // Mark as current
            false  // Not auto-fetched
        );

        if (result.success) {
            alert('✅ Nouvelle version sauvegardée!');
            // Reset to normal mode
            setCurrentSnapshot(null);
            setIsReadOnly(false);
        } else {
            alert(`Erreur: ${result.error}`);
        }
    };

    const handleSelectTicker = async (symbol: string) => {
        const upperSymbol = symbol.toUpperCase();
        if (library[upperSymbol]) {
            alert("Ce ticker existe déjà.");
            setActiveId(upperSymbol);
            return;
        }

        // Create placeholder profile
        const newProfile: AnalysisProfile = {
            id: upperSymbol,
            lastModified: Date.now(),
            data: INITIAL_DATA.map(d => ({ ...d, priceHigh: 0, priceLow: 0, year: 2024 })),
            assumptions: { ...INITIAL_ASSUMPTIONS, currentPrice: 100, currentDividend: 0 },
            info: { ...INITIAL_INFO, symbol: upperSymbol, name: 'Chargement...', marketCap: '-' },
            notes: '',
            isWatchlist: false
        };
        setLibrary(prev => ({ ...prev, [upperSymbol]: newProfile }));
        setActiveId(upperSymbol);

        // Auto-fetch data
        try {
            const result = await fetchCompanyData(upperSymbol);

            // Auto-fill assumptions based on historical data
            const validHistory = result.data.filter(d => d.priceHigh > 0 && d.priceLow > 0);

            // Find last year with valid EPS
            const lastValidData = [...result.data].reverse().find(d => d.earningsPerShare > 0) || result.data[result.data.length - 1];
            const lastData = result.data[result.data.length - 1];
            const firstData = result.data[0];
            const yearsDiff = lastValidData.year - firstData.year;

            // Calculate historical CAGRs
            const histGrowthEPS = calculateCAGR(firstData.earningsPerShare, lastValidData.earningsPerShare, yearsDiff);
            const histGrowthSales = calculateCAGR(firstData.cashFlowPerShare, lastValidData.cashFlowPerShare, yearsDiff);
            const histGrowthBV = calculateCAGR(firstData.bookValuePerShare, lastValidData.bookValuePerShare, yearsDiff);
            const histGrowthDiv = calculateCAGR(firstData.dividendPerShare, lastValidData.dividendPerShare, yearsDiff);

            // Calculate Average Ratios
            const avgPE = validHistory.length > 0
                ? calculateAverage(validHistory.map(d => (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2))
                : 15;

            const avgPCF = validHistory.length > 0
                ? calculateAverage(validHistory.map(d => (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2))
                : 10;

            const avgYield = validHistory.length > 0
                ? calculateAverage(validHistory.map(d => (d.dividendPerShare / d.priceHigh) * 100))
                : 2.0;

            setAssumptions(prev => ({
                ...prev,
                currentPrice: result.currentPrice,
                currentDividend: lastData.dividendPerShare,
                baseYear: lastValidData.year, // Use valid data year
                growthRateEPS: Math.min(Math.max(histGrowthEPS, 0), 20),
                growthRateSales: Math.min(Math.max(histGrowthSales, 0), 20),
                growthRateCF: Math.min(Math.max(histGrowthSales, 0), 20),
                growthRateBV: Math.min(Math.max(histGrowthBV, 0), 20),
                growthRateDiv: Math.min(Math.max(histGrowthDiv, 0), 20),
                targetPE: parseFloat(avgPE.toFixed(1)),
                targetPCF: parseFloat(avgPCF.toFixed(1)),
                targetYield: parseFloat(avgYield.toFixed(2))
            }));
            setData(result.data);
            setInfo(prev => ({ ...prev, ...result.info }));
        } catch (e) {
            console.error('Auto-fetch failed:', e);
            // Profile already created, user can manually sync later
        }
    };

    const handleDeleteTicker = (id: string) => {
        const newLib = { ...library };
        delete newLib[id];
        setLibrary(newLib);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLib));

        if (activeId === id) {
            const remaining = Object.keys(newLib);
            if (remaining.length > 0) {
                setActiveId(remaining[0]);
            } else {
                setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                setActiveId(DEFAULT_PROFILE.id);
            }
        }
    };

    const handleDuplicateTicker = (id: string) => {
        const newId = prompt(`Nom du nouveau profil (ex: ${id}_OPTIMISTE):`, `${id}_COPY`);
        if (newId) {
            const upperId = newId.toUpperCase();
            if (library[upperId]) {
                alert("Ce nom existe déjà.");
                return;
            }
            const source = library[id];
            const newProfile = {
                ...source,
                id: upperId,
                lastModified: Date.now(),
                info: { ...source.info, symbol: upperId }
            };
            setLibrary(prev => ({ ...prev, [upperId]: newProfile }));
            setActiveId(upperId);
        }
    };

    const handleToggleWatchlist = (id: string) => {
        setLibrary(prev => {
            const profile = prev[id];
            if (!profile) return prev;

            const updated = {
                ...profile,
                isWatchlist: !profile.isWatchlist
            };

            const newLib = { ...prev, [id]: updated };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newLib));

            // If modifying currently active profile, sync local state
            if (id === activeId) {
                setIsWatchlist(updated.isWatchlist);
            }

            return newLib;
        });
    };

    const handleResetData = () => {
        if (confirm("Voulez-vous remettre à zéro toutes les données historiques de ce profil ?")) {
            setData(INITIAL_DATA.map(d => ({ ...d, priceHigh: 0, priceLow: 0, earningsPerShare: 0, dividendPerShare: 0, cashFlowPerShare: 0, bookValuePerShare: 0 })));
        }
    };

    // --- CALCULATIONS CORE ---
    // Use central logic to ensure chart matches sidebar
    const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
    const baseEPS = baseYearData?.earningsPerShare || 0;
    const effectiveBaseYear = baseYearData?.year || new Date().getFullYear();

    // History CAGR
    const firstYearData = data[0];
    const historicalCAGR_EPS = calculateCAGR(firstYearData?.earningsPerShare || 0, baseEPS, effectiveBaseYear - (firstYearData?.year || effectiveBaseYear));

    // Get Valuation Status
    const { recommendation, targetPrice, buyLimit, sellLimit } = calculateRecommendation(data, assumptions);

    const availableYears = data.map(d => d.year);

    if (!isInitialized) return <div className="flex items-center justify-center h-screen text-slate-500">Chargement...</div>;

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-slate-800 overflow-hidden">

            {/* SIDEBAR NAVIGATION */}
            <div
                className={`bg-slate-900 h-full transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${isSidebarOpen ? 'w-72' : 'w-0'} no-print`}
            >
                <div className="w-72 h-full">
                    <Sidebar
                        profiles={Object.values(library)}
                        currentId={activeId}
                        onSelect={setActiveId}
                        onAdd={handleAddTicker}
                        onDelete={handleDeleteTicker}
                        onDuplicate={handleDuplicateTicker}
                        onToggleWatchlist={handleToggleWatchlist}
                        onLoadVersion={handleLoadSnapshot}
                    />
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Historical Version Banner (if viewing old version) */}
                {currentSnapshot && currentSnapshot.isHistorical && (
                    <HistoricalVersionBanner
                        snapshotDate={currentSnapshot.date}
                        snapshotVersion={currentSnapshot.version}
                        isLocked={isReadOnly}
                        onUnlock={handleUnlockVersion}
                        onRevertToCurrent={handleRevertToCurrent}
                        onSaveAsNew={handleSaveAsNew}
                    />
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-8 print-full-width">
                    <div className="max-w-7xl mx-auto">

                        {/* TOP BAR & NAVIGATION */}
                        <div className="flex items-center justify-between mb-6 no-print">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    title={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
                                >
                                    <Bars3Icon className="w-6 h-6" />
                                </button>
                                {!isSidebarOpen && (
                                    <h1 className="text-xl font-bold text-gray-700">Analyse Financière Pro</h1>
                                )}
                            </div>

                            {/* VIEW TABS */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentView('analysis')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'analysis'
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <ChartBarSquareIcon className="w-5 h-5" />
                                    Analyse
                                </button>
                                <button
                                    onClick={() => setCurrentView('info')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'info'
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <InformationCircleIcon className="w-5 h-5" />
                                    Mode d'emploi
                                </button>
                            </div>
                        </div>

                        <Header
                            info={info}
                            assumptions={assumptions}
                            availableYears={availableYears}
                            recommendation={recommendation}
                            isWatchlist={isWatchlist}
                            onUpdateInfo={handleUpdateInfo}
                            onUpdateAssumption={handleUpdateAssumption}
                            onFetchData={handleFetchData}
                        />
                        {/* <div className="p-4 bg-yellow-100 text-yellow-800">Header désactivé pour débogage</div> */}

                        {/* CONDITIONAL RENDER: ANALYSIS VS INFO */}
                        {currentView === 'info' ? (
                            <InfoTab />
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                                {/* LEFT COLUMN - MAIN DATA */}
                                <div className="xl:col-span-3">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                            Données Historiques
                                            {historicalCAGR_EPS > 0 && (
                                                <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full" title="Taux de croissance annuel composé des EPS sur la période affichée">
                                                    CAGR EPS: {historicalCAGR_EPS.toFixed(1)}%
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-0.5 no-print">
                                            <button onClick={undo} disabled={pastData.length === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30">
                                                <ArrowUturnLeftIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px bg-gray-200 my-1"></div>
                                            <button onClick={redo} disabled={futureData.length === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30">
                                                <ArrowUturnRightIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px bg-gray-200 my-1"></div>
                                            <button onClick={handleResetData} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Réinitialiser les données">
                                                <ArrowPathIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <HistoricalTable data={data} onUpdateRow={handleUpdateRow} />

                                    <ValuationCharts
                                        history={validHistory}
                                        currentPrice={assumptions.currentPrice}
                                        buyPrice={buyLimit}
                                        sellPrice={sellLimit}
                                        targetPrice={targetPrice}
                                        recommendation={recommendation}
                                    />

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        {/* Sensitivity Matrix */}
                                        <SensitivityTable
                                            baseEPS={baseEPS}
                                            baseGrowth={assumptions.growthRateEPS}
                                            basePE={assumptions.targetPE}
                                        />
                                        {/* Analyst Notes */}
                                        <NotesEditor initialNotes={notes} onSave={setNotes} />
                                    </div>

                                    {/* Comprehensive Evaluation Grid */}
                                    <EvaluationDetails
                                        data={data}
                                        assumptions={assumptions}
                                        onUpdateAssumption={handleUpdateAssumption}
                                    />

                                </div>

                                {/* RIGHT COLUMN - SUMMARY & PARAMS */}
                                <div className="xl:col-span-1 space-y-6 no-print">

                                    {/* Summary Card */}
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-lg shadow-lg">
                                        <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2">Résumé Exécutif</h2>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            L'analyse de {info.name} suggère une position <strong className="text-white uppercase">{recommendation}</strong> au prix actuel de {formatCurrency(assumptions.currentPrice)}.
                                        </p>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            Le titre se négocie à <strong className="text-white">{formatPercent(Math.abs(1 - (assumptions.currentPrice / targetPrice)) * 100)} {assumptions.currentPrice < targetPrice ? 'sous' : 'au-dessus de'}</strong> l'objectif de prix EPS de {formatCurrency(targetPrice)}.
                                        </p>

                                        <div className="bg-slate-700/50 p-3 rounded mt-6">
                                            <div className="text-xs text-slate-400 uppercase">Score de Sécurité</div>
                                            <div className="text-2xl font-bold text-green-400">{info.securityRank}</div>
                                        </div>
                                    </div>

                                    {/* Editable Company Info */}
                                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                            <Cog6ToothIcon className="w-4 h-4" />
                                            Configuration
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Nom Société</label>
                                                <input
                                                    type="text"
                                                    value={info.name}
                                                    onChange={(e) => handleUpdateInfo('name', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Secteur</label>
                                                <input
                                                    type="text"
                                                    value={info.sector}
                                                    onChange={(e) => handleUpdateInfo('sector', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Capitalisation</label>
                                                <input
                                                    type="text"
                                                    value={info.marketCap}
                                                    onChange={(e) => handleUpdateInfo('marketCap', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Score Sécurité</label>
                                                <input
                                                    type="text"
                                                    value={info.securityRank}
                                                    onChange={(e) => handleUpdateInfo('securityRank', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div className="pt-2 mt-2 border-t border-gray-100">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isWatchlist}
                                                        onChange={() => handleToggleWatchlist(activeId)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs text-gray-600">Suivre seulement (Watchlist)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    {/* TickerSearch Modal Placeholder */}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Ticker Search Modal */}
            {isSearchOpen && (
                <TickerSearch
                    onSelect={handleSelectTicker}
                    onClose={() => setIsSearchOpen(false)}
                />
            )}

            {/* Confirmation Dialog for API Sync */}
            <ConfirmSyncDialog
                isOpen={showConfirmSync}
                ticker={activeId}
                hasManualData={hasManualEdits(data)}
                onCancel={() => setShowConfirmSync(false)}
                onConfirm={async (saveSnapshot) => {
                    setShowConfirmSync(false);
                    await performSync(saveSnapshot);
                }}
            />
        </div>
    );
}