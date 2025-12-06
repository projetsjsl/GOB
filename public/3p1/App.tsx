import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HistoricalTable } from './components/HistoricalTable';
import { ValuationCharts } from './components/ValuationCharts';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { SensitivityTable } from './components/SensitivityTable';
import { SensitivityTablePCF } from './components/SensitivityTablePCF';
import { NotesEditor } from './components/NotesEditor';
import { EvaluationDetails } from './components/EvaluationDetails';
import { HistoricalRangesTable } from './components/HistoricalRangesTable';
import { DataSourcesInfo } from './components/DataSourcesInfo';
import { AdditionalMetrics } from './components/AdditionalMetrics';
import { KPIDashboard } from './components/KPIDashboard';
import { InfoTab } from './components/InfoTab';
import { TickerSearch } from './components/TickerSearch';
import { ConfirmSyncDialog } from './components/ConfirmSyncDialog';
import { HistoricalVersionBanner } from './components/HistoricalVersionBanner';
import { NotificationManager } from './components/Notification';
import { AnnualData, Assumptions, CompanyInfo, Recommendation, AnalysisProfile } from './types';
import { calculateRowRatios, calculateAverage, projectFutureValue, formatCurrency, formatPercent, calculateCAGR, calculateRecommendation, autoFillAssumptionsFromFMPData } from './utils/calculations';
import { detectOutlierMetrics } from './utils/outlierDetection';
import { Cog6ToothIcon, CalculatorIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, Bars3Icon, ArrowPathIcon, ChartBarSquareIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { fetchCompanyData } from './services/financeApi';
import { saveSnapshot, hasManualEdits, loadSnapshot, listSnapshots } from './services/snapshotApi';
import { RestoreDataDialog } from './components/RestoreDataDialog';
import { loadAllTickersFromSupabase, mapSourceToIsWatchlist } from './services/tickersApi';

// Données initiales par défaut (placeholder uniquement - les données réelles sont toujours récupérées depuis l'API FMP)
// Ces données ne sont utilisées que temporairement avant le chargement des données réelles depuis l'API
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
    marketCap: '156.4B',
    logo: undefined,
    country: undefined,
    exchange: undefined,
    currency: 'USD',
    preferredSymbol: undefined
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
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'analysis' | 'info' | 'kpi'>('analysis');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showConfirmSync, setShowConfirmSync] = useState(false);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [latestSnapshotDate, setLatestSnapshotDate] = useState<string | undefined>(undefined);
    const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

    // Helper function pour afficher des notifications
    const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

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

    // --- LOAD TICKERS FROM SUPABASE ON INITIALIZATION ---
    const [isLoadingTickers, setIsLoadingTickers] = useState(false);
    const [tickersLoadError, setTickersLoadError] = useState<string | null>(null);
    const hasLoadedTickersRef = useRef(false); // Flag pour éviter les chargements multiples
    const activeIdRef = useRef(activeId); // Ref pour accéder à activeId sans dépendance
    const supabaseTickersCacheRef = useRef<{ data: any[]; timestamp: number } | null>(null); // Cache pour éviter les appels répétés
    const SUPABASE_CACHE_TTL = 60000; // Cache valide pendant 60 secondes
    const isLoadingProfileRef = useRef(false); // Flag pour éviter les sauvegardes pendant le chargement d'un profil

    // Mettre à jour la ref quand activeId change
    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    useEffect(() => {
        if (!isInitialized) return;
        
        // Éviter les chargements multiples
        if (hasLoadedTickersRef.current) {
            return;
        }

        const loadTickersFromSupabase = async () => {
            hasLoadedTickersRef.current = true; // Marquer comme chargé
            setIsLoadingTickers(true);
            setTickersLoadError(null);

            try {
                const result = await loadAllTickersFromSupabase();

                if (!result.success) {
                    setTickersLoadError(result.error || 'Erreur lors du chargement des tickers');
                    setIsLoadingTickers(false);
                    hasLoadedTickersRef.current = false; // Réessayer au prochain render
                    return;
                }

                // Mettre à jour le cache pour handleSelectTicker
                supabaseTickersCacheRef.current = {
                    data: result.tickers,
                    timestamp: Date.now()
                };

                // Identifier les nouveaux tickers AVANT la mise à jour (utiliser setLibrary avec fonction)
                let newTickers: typeof result.tickers = [];

                // Merge intelligent : ne pas écraser les profils existants
                setLibrary(prev => {
                    const existingSymbols = new Set(Object.keys(prev));
                    newTickers = result.tickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return !existingSymbols.has(symbol);
                    });

                    const updated = { ...prev };
                    let newTickersCount = 0;

                    result.tickers.forEach(supabaseTicker => {
                        const tickerSymbol = supabaseTicker.ticker.toUpperCase();
                        
                        // Si le profil existe déjà, mettre à jour les métriques ValueLine depuis Supabase
                        if (updated[tickerSymbol]) {
                            // Mettre à jour isWatchlist si nécessaire (basé sur source Supabase)
                            const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                            
                            // Mettre à jour les métriques ValueLine depuis Supabase (si elles existent)
                            const hasValueLineUpdates = supabaseTicker.security_rank || 
                                                       supabaseTicker.earnings_predictability || 
                                                       supabaseTicker.price_growth_persistence || 
                                                       supabaseTicker.price_stability;
                            
                            if (updated[tickerSymbol].isWatchlist !== shouldBeWatchlist || hasValueLineUpdates) {
                                updated[tickerSymbol] = {
                                    ...updated[tickerSymbol],
                                    isWatchlist: shouldBeWatchlist,
                                    // ⚠️ MULTI-UTILISATEUR : Supabase est la source de vérité pour les métriques ValueLine
                                    // Toujours utiliser Supabase si disponible, sinon garder valeur existante
                                    info: {
                                        ...updated[tickerSymbol].info,
                                        securityRank: supabaseTicker.security_rank !== null && supabaseTicker.security_rank !== undefined 
                                            ? supabaseTicker.security_rank 
                                            : (updated[tickerSymbol].info.securityRank || 'N/A'),
                                        earningsPredictability: supabaseTicker.earnings_predictability !== null && supabaseTicker.earnings_predictability !== undefined
                                            ? supabaseTicker.earnings_predictability
                                            : updated[tickerSymbol].info.earningsPredictability,
                                        priceGrowthPersistence: supabaseTicker.price_growth_persistence !== null && supabaseTicker.price_growth_persistence !== undefined
                                            ? supabaseTicker.price_growth_persistence
                                            : updated[tickerSymbol].info.priceGrowthPersistence,
                                        priceStability: supabaseTicker.price_stability !== null && supabaseTicker.price_stability !== undefined
                                            ? supabaseTicker.price_stability
                                            : updated[tickerSymbol].info.priceStability,
                                        beta: supabaseTicker.beta !== null && supabaseTicker.beta !== undefined
                                            ? supabaseTicker.beta
                                            : updated[tickerSymbol].info.beta
                                    }
                                };
                                
                                // Si c'est le profil actif, mettre à jour aussi le state local
                                if (tickerSymbol === activeIdRef.current) {
                                    setInfo(updated[tickerSymbol].info);
                                }
                            }
                            return;
                        }

                        // ⚠️ RIGUEUR 100% : Ne pas créer de profil placeholder ici
                        // Le profil sera créé uniquement si FMP réussit (voir code après)
                        // On marque juste le ticker comme "à charger"
                        newTickersCount++;
                    });

                    // Sauvegarder dans localStorage
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    } catch (e) {
                        console.warn('Failed to save to LocalStorage:', e);
                    }

                    if (newTickersCount > 0) {
                        console.log(`✅ ${newTickersCount} nouveaux tickers chargés depuis Supabase`);
                    }

                    return updated;
                });

                // ⚠️ RIGUEUR 100% : Ne créer des profils QUE si FMP réussit
                // Charger les données FMP AVANT de créer les profils (batch avec délai)
                if (newTickers.length > 0) {
                    // Charger par batch de 5 avec délai de 500ms entre chaque batch
                    const batchSize = 5;
                    const delayBetweenBatches = 500;

                    for (let i = 0; i < newTickers.length; i += batchSize) {
                        const batch = newTickers.slice(i, i + batchSize);
                        
                        // Attendre avant de charger le batch suivant
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                        }

                        // Charger les données FMP pour ce batch en parallèle
                        await Promise.allSettled(
                            batch.map(async (supabaseTicker) => {
                                const symbol = supabaseTicker.ticker.toUpperCase();
                                try {
                                    const result = await fetchCompanyData(symbol);
                                    
                                    // VALIDATION STRICTE : Vérifier que les données sont valides
                                    if (!result.data || result.data.length === 0) {
                                        console.error(`❌ ${symbol}: Aucune donnée FMP retournée - profil NON créé`);
                                        return;
                                    }
                                    
                                    if (!result.currentPrice || result.currentPrice <= 0) {
                                        console.error(`❌ ${symbol}: Prix actuel invalide (${result.currentPrice}) - profil NON créé`);
                                        return;
                                    }
                                    
                                    // Vérifier qu'on a au moins une année avec des données valides
                                    const hasValidData = result.data.some(d => 
                                        d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
                                    );
                                    
                                    if (!hasValidData) {
                                        console.error(`❌ ${symbol}: Aucune donnée financière valide - profil NON créé`);
                                        return;
                                    }
                                    
                                    // ✅ TOUTES LES VALIDATIONS PASSÉES - Créer le profil avec les données réelles
                                    const isWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                                    
                                    // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
                                    const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                                        result.data,
                                        result.currentPrice,
                                        INITIAL_ASSUMPTIONS
                                    );
                                    
                                    const newProfile: AnalysisProfile = {
                                        id: symbol,
                                        lastModified: Date.now(),
                                        data: result.data,
                                        assumptions: {
                                            ...INITIAL_ASSUMPTIONS,
                                            ...autoFilledAssumptions
                                        },
                                        info: {
                                            symbol: symbol,
                                            name: result.info.name || supabaseTicker.company_name || symbol,
                                            sector: result.info.sector || supabaseTicker.sector || '',
                                            securityRank: supabaseTicker.security_rank || 'N/A',
                                            marketCap: result.info.marketCap || 'N/A',
                                            ...result.info,
                                            earningsPredictability: supabaseTicker.earnings_predictability,
                                            priceGrowthPersistence: supabaseTicker.price_growth_persistence,
                                            priceStability: supabaseTicker.price_stability,
                                            beta: result.info.beta || supabaseTicker.beta,
                                            preferredSymbol: supabaseTicker.ticker
                                        },
                                        notes: '',
                                        isWatchlist
                                    };
                                    
                                    // Créer le profil UNIQUEMENT avec des données valides
                                    setLibrary(prev => {
                                        const updated = {
                                            ...prev,
                                            [symbol]: newProfile
                                        };
                                        
                                        try {
                                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                                        } catch (e) {
                                            console.warn('Failed to save to LocalStorage:', e);
                                        }
                                        
                                        return updated;
                                    });
                                    
                                    console.log(`✅ ${symbol}: Profil créé avec données FMP valides`);
                                } catch (error) {
                                    console.error(`❌ ${symbol}: Erreur FMP - profil NON créé:`, error);
                                    // ⚠️ RIGUEUR 100% : Ne pas créer de profil si FMP échoue
                                }
                            })
                        );
                    }
                }

            } catch (error: any) {
                console.error('❌ Erreur lors du chargement des tickers:', error);
                setTickersLoadError(error.message || 'Erreur inconnue');
                hasLoadedTickersRef.current = false; // Réessayer au prochain render
            } finally {
                setIsLoadingTickers(false);
            }
        };

        loadTickersFromSupabase();
    }, [isInitialized]); // Seulement après l'initialisation - pas de dépendance à library pour éviter la boucle

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
            // Marquer comme en cours de chargement pour éviter les sauvegardes inutiles
            isLoadingProfileRef.current = true;
            
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
            
            // Réinitialiser le flag après un court délai pour permettre les sauvegardes futures
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isLoadingProfileRef.current = false;
                });
            });
        } else {
            // ⚠️ Profil non trouvé dans la library - données placeholder affichées
            // Afficher un avertissement si ce n'est pas le profil initial (ACN)
            if (activeId !== 'ACN') {
                showNotification(
                    `⚠️ Le ticker ${activeId} n'est pas dans votre portefeuille. Cliquez sur "Sync. Données" pour charger les données depuis l'API ou ajoutez-le depuis la sidebar.`,
                    'warning'
                );
            }
        }
    }, [activeId, isInitialized, library]);

    // Save to Library when Active State Changes (optimisé avec requestIdleCallback)
    useEffect(() => {
        if (!isInitialized) return;
        
        // Ne pas sauvegarder si on est en train de charger un profil
        if (isLoadingProfileRef.current) {
            return;
        }

        // Utiliser requestIdleCallback si disponible, sinon setTimeout avec délai plus court
        const saveToStorage = () => {
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
                // Sauvegarder de manière asynchrone pour ne pas bloquer le thread principal
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(() => {
                        try {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                        } catch (e) {
                            console.warn('Failed to save to LocalStorage:', e);
                        }
                    }, { timeout: 1000 });
                } else {
                    // Fallback pour navigateurs sans requestIdleCallback
                    setTimeout(() => {
                        try {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                        } catch (e) {
                            console.warn('Failed to save to LocalStorage:', e);
                        }
                    }, 0);
                }
                return updated;
            });
        };

        const timer = setTimeout(saveToStorage, 300); // Réduit de 500ms à 300ms

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
                    showNotification(`Erreur lors de la sauvegarde: ${saveResult.error}`, 'error');
                    // Continue anyway?
                }
            }

            // Fetch new data from API
            const result = await fetchCompanyData(activeId);

            // Keep existing history for Undo
            setPastData(prev => [...prev, data]);
            setFutureData([]);

            // Update Data avec merge intelligent : préserver les données manuelles
            if (result.data.length > 0) {
                // Merge intelligent : préserver les données manuelles (comme dans handleBulkSyncAllTickers)
                const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                
                const mergedData = data.map((existingRow) => {
                    const newRow = newDataByYear.get(existingRow.year);
                    
                    // Si pas de nouvelle donnée pour cette année, garder l'existant
                    if (!newRow) {
                        return existingRow;
                    }

                    // Si la donnée existante est manuelle (autoFetched: false ou undefined), la garder
                    if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                        return existingRow; // Préserver la donnée manuelle
                    }

                    // Sinon, utiliser la nouvelle donnée avec autoFetched: true
                    return {
                        ...newRow,
                        autoFetched: true
                    };
                });

                // Ajouter les nouvelles années qui n'existent pas dans les données existantes
                result.data.forEach(newRow => {
                    const exists = mergedData.some(row => row.year === newRow.year);
                    if (!exists) {
                        mergedData.push({
                            ...newRow,
                            autoFetched: true
                        });
                    }
                });

                // Trier par année
                mergedData.sort((a, b) => a.year - b.year);
                
                setData(mergedData);
            }

            // Update Info (including logo and beta, but preserve ValueLine metrics)
            if (result.info) {
                // ⚠️ MULTI-UTILISATEUR : Recharger les métriques ValueLine depuis Supabase lors de la synchronisation FMP
                // Pour garantir que tous les utilisateurs voient les mêmes valeurs
                const existingProfile = library[activeId];
                let preservedValueLineMetrics = {
                    securityRank: existingProfile?.info?.securityRank || result.info.securityRank || 'N/A',
                    earningsPredictability: existingProfile?.info?.earningsPredictability || result.info.earningsPredictability,
                    priceGrowthPersistence: existingProfile?.info?.priceGrowthPersistence || result.info.priceGrowthPersistence,
                    priceStability: existingProfile?.info?.priceStability || result.info.priceStability
                };
                
                // Recharger depuis Supabase pour garantir la cohérence multi-utilisateurs
                try {
                    const supabaseResult = await loadAllTickersFromSupabase();
                    if (supabaseResult.success) {
                        const supabaseTicker = supabaseResult.tickers.find(t => t.ticker.toUpperCase() === activeId);
                        if (supabaseTicker) {
                            preservedValueLineMetrics = {
                                securityRank: supabaseTicker.security_rank !== null && supabaseTicker.security_rank !== undefined
                                    ? supabaseTicker.security_rank
                                    : (preservedValueLineMetrics.securityRank || 'N/A'),
                                earningsPredictability: supabaseTicker.earnings_predictability !== null && supabaseTicker.earnings_predictability !== undefined
                                    ? supabaseTicker.earnings_predictability
                                    : preservedValueLineMetrics.earningsPredictability,
                                priceGrowthPersistence: supabaseTicker.price_growth_persistence !== null && supabaseTicker.price_growth_persistence !== undefined
                                    ? supabaseTicker.price_growth_persistence
                                    : preservedValueLineMetrics.priceGrowthPersistence,
                                priceStability: supabaseTicker.price_stability !== null && supabaseTicker.price_stability !== undefined
                                    ? supabaseTicker.price_stability
                                    : preservedValueLineMetrics.priceStability
                            };
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Impossible de recharger les métriques ValueLine depuis Supabase lors de la sync FMP:', error);
                    // Continuer avec les valeurs existantes en cas d'erreur
                }
                
                const updatedInfo = {
                    ...result.info,
                    ...preservedValueLineMetrics // Préserver les métriques ValueLine
                };
                
                // Ensure required fields are present
                const completeInfo: CompanyInfo = {
                    symbol: updatedInfo.symbol || activeId,
                    name: updatedInfo.name || activeId,
                    sector: updatedInfo.sector || '',
                    securityRank: updatedInfo.securityRank || 'N/A',
                    marketCap: updatedInfo.marketCap || 'N/A',
                    ...updatedInfo
                };
                setInfo(completeInfo);
                // Also update in library to persist logo and beta
                setLibrary(prev => {
                    const profile = prev[activeId];
                    if (!profile) return prev;
                    return {
                        ...prev,
                        [activeId]: {
                            ...profile,
                            info: { ...profile.info, ...updatedInfo }
                        }
                    };
                });
            }

            // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
            // ⚠️ IMPORTANT : On préserve les hypothèses existantes (orange) sauf currentPrice
            // Utiliser les données mergées (avec préservation des données manuelles) pour le calcul
            const mergedDataForCalc = data.length > 0 ? data : result.data;
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                mergedDataForCalc, // Utiliser les données mergées au lieu de result.data
                result.currentPrice,
                assumptions // Préserver les valeurs existantes (excludeEPS, excludeCF, etc.)
            );

            setAssumptions(prev => ({
                ...prev,
                ...autoFilledAssumptions // Mettre à jour avec les nouvelles valeurs calculées
            }));

            console.log('✅ Auto-filled assumptions in performSync:', {
                growthEPS: autoFilledAssumptions.growthRateEPS,
                targetPE: autoFilledAssumptions.targetPE,
                targetPCF: autoFilledAssumptions.targetPCF,
                targetPBV: autoFilledAssumptions.targetPBV
            });

            // Détecter et exclure automatiquement les métriques avec prix cibles aberrants
            const finalData = data.length > 0 ? data : result.data; // Utiliser les données mergées
            const finalAssumptions = {
                ...assumptions,
                ...autoFilledAssumptions // Inclure les métriques recalculées
            };
            
            const outlierDetection = detectOutlierMetrics(finalData, finalAssumptions);
            
            if (outlierDetection.detectedOutliers.length > 0) {
                console.log(`⚠️ Métriques avec prix cibles aberrants détectées: ${outlierDetection.detectedOutliers.join(', ')}`);
                showNotification(
                    `Métriques exclues automatiquement (prix cibles aberrants): ${outlierDetection.detectedOutliers.join(', ')}`,
                    'warning'
                );
            }

            // Appliquer les exclusions détectées
            const assumptionsWithOutlierExclusions = {
                ...finalAssumptions,
                excludeEPS: outlierDetection.excludeEPS,
                excludeCF: outlierDetection.excludeCF,
                excludeBV: outlierDetection.excludeBV,
                excludeDIV: outlierDetection.excludeDIV
            };

            // Mettre à jour les assumptions dans le state
            setAssumptions(assumptionsWithOutlierExclusions);

            // Auto-save snapshot after successful sync
            console.log('💾 Auto-saving snapshot after API sync...');
            await saveSnapshot(
                activeId,
                finalData,
                assumptionsWithOutlierExclusions, // Inclure les exclusions automatiques
                info,
                `API sync - ${new Date().toLocaleString()}`,
                true,  // Mark as current
                true   // Auto-fetched
            );

            showNotification(`Données synchronisées avec succès pour ${activeId}`, 'success');

        } catch (e) {
            const error = e as Error;
            let errorMessage = error.message;
            
            // Améliorer les messages d'erreur pour l'utilisateur
            if (errorMessage.includes('not found') || errorMessage.includes('introuvable')) {
                errorMessage = `Symbole '${activeId}' introuvable dans FMP.\n\n` +
                    `Causes possibles:\n` +
                    `• Le symbole n'existe pas ou est mal orthographié\n` +
                    `• Le symbole nécessite un format différent (ex: BRK-B au lieu de BRK.B)\n` +
                    `• La clé API FMP n'est pas configurée ou invalide\n` +
                    `• Le ticker n'est pas disponible dans FMP (essayez un autre fournisseur)\n\n` +
                    `Vérifiez les logs de la console pour plus de détails.`;
            } else if (errorMessage.includes('API key') || errorMessage.includes('Invalid API')) {
                errorMessage = `Erreur de clé API FMP.\n\n` +
                    `La clé API FMP semble invalide ou non configurée.\n` +
                    `Vérifiez FMP_API_KEY dans les variables d'environnement Vercel.`;
            } else if (errorMessage.includes('empty') || errorMessage.includes('vide')) {
                errorMessage = `Aucune donnée retournée pour '${activeId}'.\n\n` +
                    `FMP a retourné un tableau vide. Cela peut signifier:\n` +
                    `• Le ticker existe mais n'a pas de données historiques disponibles\n` +
                    `• Le ticker nécessite un abonnement FMP premium\n` +
                    `• Le symbole doit être formaté différemment\n\n` +
                    `Vérifiez les logs de la console pour plus de détails.`;
            }
            
            console.error('❌ Erreur synchronisation:', error);
            showNotification(`Erreur lors de la récupération des données : ${errorMessage}`, 'error');
        }
    };

    const handleUpdateRow = (index: number, field: keyof AnnualData, value: number) => {
        // Block updates if viewing historical version in read-only mode
        if (isReadOnly) {
            showNotification('Cette version est en lecture seule. Déverrouillez-la pour la modifier.', 'warning');
            return;
        }

        setPastData(prev => [...prev, data]);
        setFutureData([]);

        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value, autoFetched: false };
        setData(updated);
    };

    const handleUpdateAssumption = (key: keyof Assumptions, value: number | boolean) => {
        setAssumptions(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdateInfo = (key: keyof CompanyInfo, value: string | number) => {
        // ⚠️ MULTI-UTILISATEUR : Empêcher la modification des métriques ValueLine
        // Ces métriques viennent de Supabase et doivent rester synchronisées pour tous les utilisateurs
        const valueLineFields: (keyof CompanyInfo)[] = ['securityRank', 'earningsPredictability', 'priceGrowthPersistence', 'priceStability'];
        
        if (valueLineFields.includes(key)) {
            showNotification(
                '⚠️ Les métriques ValueLine ne peuvent pas être modifiées localement.\n' +
                'Elles sont synchronisées depuis Supabase pour tous les utilisateurs.\n' +
                'Pour modifier ces valeurs, utilisez l\'interface d\'administration Supabase.',
                'warning'
            );
            return; // Ne pas permettre la modification
        }
        
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
            showNotification(`Erreur chargement: ${result.error}`, 'error');
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
                showNotification('Aucune version actuelle trouvée', 'warning');
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

    // --- RESTORE DATA HANDLERS ---
    const handleOpenRestoreDialog = async () => {
        // Charger la date de la dernière sauvegarde
        const result = await listSnapshots(activeId, 1);
        if (result.success && result.snapshots && result.snapshots.length > 0) {
            const latest = result.snapshots[0]; // Le plus récent est le premier
            setLatestSnapshotDate(latest.snapshot_date);
        }
        setShowRestoreDialog(true);
    };

    const handleRestoreFromSnapshot = async () => {
        try {
            const result = await listSnapshots(activeId, 50);

            if (result.success && result.snapshots && result.snapshots.length > 0) {
                // Trouver le snapshot actuel (is_current) ou le plus récent
                const currentSnap = result.snapshots.find(s => s.is_current) || result.snapshots[0];
                
                if (currentSnap) {
                    await handleLoadSnapshot(currentSnap.id);
                    showNotification('Données restaurées depuis la dernière sauvegarde', 'success');
                } else {
                    showNotification('Aucune sauvegarde trouvée', 'warning');
                }
            } else {
                showNotification('Aucune sauvegarde disponible', 'warning');
            }
        } catch (error: any) {
            console.error('Erreur lors de la restauration:', error);
            showNotification(`Erreur: ${error.message}`, 'error');
        }
    };

    const handleRecalculateFromFMP = async () => {
        try {
            showNotification(`Recalcul des données depuis FMP pour ${activeId}...`, 'info');
            
            // Récupérer les données FMP (comme lors d'un nouvel ajout)
            const result = await fetchCompanyData(activeId);
            
            // VALIDATION STRICTE
            if (!result.data || result.data.length === 0) {
                throw new Error(`Aucune donnée FMP retournée pour ${activeId}`);
            }
            
            if (!result.currentPrice || result.currentPrice <= 0) {
                throw new Error(`Prix actuel invalide (${result.currentPrice}) pour ${activeId}`);
            }
            
            const hasValidData = result.data.some(d => 
                d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
            );
            
            if (!hasValidData) {
                throw new Error(`Aucune donnée financière valide pour ${activeId}`);
            }

            // Merge intelligent : préserver les données manuelles (comme dans handleBulkSyncAllTickers)
            const existingProfile = library[activeId];
            const existingData = existingProfile?.data || data;
            const newDataByYear = new Map(result.data.map(row => [row.year, row]));
            
            const mergedData = existingData.map((existingRow) => {
                const newRow = newDataByYear.get(existingRow.year);
                
                // Si pas de nouvelle donnée pour cette année, garder l'existant
                if (!newRow) {
                    return existingRow;
                }

                // Si la donnée existante est manuelle (autoFetched: false ou undefined), la garder
                if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                    return existingRow; // Préserver la donnée manuelle
                }

                // Sinon, utiliser la nouvelle donnée avec autoFetched: true
                return {
                    ...newRow,
                    autoFetched: true
                };
            });

            // Ajouter les nouvelles années qui n'existent pas dans les données existantes
            result.data.forEach(newRow => {
                const exists = mergedData.some(row => row.year === newRow.year);
                if (!exists) {
                    mergedData.push({
                        ...newRow,
                        autoFetched: true
                    });
                }
            });

            // Trier par année
            mergedData.sort((a, b) => a.year - b.year);

            // Auto-fill assumptions avec la fonction centralisée (comme lors d'un nouvel ajout)
            // Utiliser les données mergées pour le calcul
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                mergedData, // Utiliser les données mergées au lieu de result.data
                result.currentPrice,
                assumptions // Préserver les exclusions existantes
            );

            // Détecter et exclure automatiquement les métriques avec prix cibles aberrants
            const tempAssumptions = {
                ...assumptions,
                ...autoFilledAssumptions
            };
            const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
            
            if (outlierDetection.detectedOutliers.length > 0) {
                console.log(`⚠️ Métriques avec prix cibles aberrants détectées: ${outlierDetection.detectedOutliers.join(', ')}`);
                showNotification(
                    `Métriques exclues automatiquement (prix cibles aberrants): ${outlierDetection.detectedOutliers.join(', ')}`,
                    'warning'
                );
            }

            // Appliquer les exclusions détectées
            const finalAssumptions = {
                ...tempAssumptions,
                excludeEPS: outlierDetection.excludeEPS,
                excludeCF: outlierDetection.excludeCF,
                excludeBV: outlierDetection.excludeBV,
                excludeDIV: outlierDetection.excludeDIV
            };

            // Mettre à jour les données et métriques
            setData(mergedData);
            setAssumptions(finalAssumptions);
            setInfo(prev => ({
                ...prev,
                ...result.info,
                // Préserver les métriques ValueLine
                securityRank: prev.securityRank || result.info.securityRank || 'N/A',
                earningsPredictability: prev.earningsPredictability || result.info.earningsPredictability,
                priceGrowthPersistence: prev.priceGrowthPersistence || result.info.priceGrowthPersistence,
                priceStability: prev.priceStability || result.info.priceStability
            }));

            // Mettre à jour dans la library
            setLibrary(prev => {
                const profile = prev[activeId];
                if (!profile) return prev;
                return {
                    ...prev,
                    [activeId]: {
                        ...profile,
                        data: mergedData, // Utiliser les données mergées au lieu de result.data
                        assumptions: finalAssumptions, // Inclure les exclusions automatiques
                        info: {
                            ...profile.info,
                            ...result.info,
                            securityRank: profile.info.securityRank || result.info.securityRank || 'N/A',
                            earningsPredictability: profile.info.earningsPredictability || result.info.earningsPredictability,
                            priceGrowthPersistence: profile.info.priceGrowthPersistence || result.info.priceGrowthPersistence,
                            priceStability: profile.info.priceStability || result.info.priceStability
                        },
                        lastModified: Date.now()
                    }
                };
            });

            // Reset historical state
            setCurrentSnapshot(null);
            setIsReadOnly(false);

            showNotification(`✅ Données recalculées depuis FMP avec succès pour ${activeId}`, 'success');
            console.log(`✅ ${activeId}: Données recalculées depuis FMP`);
        } catch (error: any) {
            console.error(`❌ ${activeId}: Erreur lors du recalcul FMP:`, error);
            showNotification(`❌ Erreur: ${error.message}`, 'error');
        }
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
            showNotification('Version sauvegardée avec succès!', 'success');
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
            showNotification(`Erreur lors de la sauvegarde: ${result.error}`, 'error');
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
            showNotification('Nouvelle version sauvegardée!', 'success');
            // Reset to normal mode
            setCurrentSnapshot(null);
            setIsReadOnly(false);
        } else {
            showNotification(`Erreur: ${result.error}`, 'error');
        }
    };

    const handleSelectTicker = async (symbol: string) => {
        const upperSymbol = symbol.toUpperCase();
        if (library[upperSymbol]) {
            // Load existing profile data
            const existingProfile = library[upperSymbol];
            
            // Vérifier et mettre à jour les métriques ValueLine depuis Supabase si disponibles
            // Utiliser le cache pour éviter les appels répétés
            try {
                let supabaseTickers: any[] = [];
                const now = Date.now();
                
                // Vérifier si le cache est valide
                if (supabaseTickersCacheRef.current && (now - supabaseTickersCacheRef.current.timestamp) < SUPABASE_CACHE_TTL) {
                    supabaseTickers = supabaseTickersCacheRef.current.data;
                } else {
                    // Charger depuis Supabase et mettre à jour le cache
                    const supabaseResult = await loadAllTickersFromSupabase();
                    if (supabaseResult.success) {
                        supabaseTickers = supabaseResult.tickers;
                        supabaseTickersCacheRef.current = {
                            data: supabaseTickers,
                            timestamp: now
                        };
                    }
                }
                
                if (supabaseTickers.length > 0) {
                    const supabaseTicker = supabaseTickers.find(t => t.ticker.toUpperCase() === upperSymbol);
                    if (supabaseTicker) {
                        // ⚠️ MULTI-UTILISATEUR : Supabase est la source de vérité pour les métriques ValueLine
                        // Toujours utiliser Supabase si disponible, sinon garder valeur existante
                        const updatedInfo = {
                            ...existingProfile.info,
                            securityRank: supabaseTicker.security_rank !== null && supabaseTicker.security_rank !== undefined
                                ? supabaseTicker.security_rank
                                : (existingProfile.info.securityRank || 'N/A'),
                            earningsPredictability: supabaseTicker.earnings_predictability !== null && supabaseTicker.earnings_predictability !== undefined
                                ? supabaseTicker.earnings_predictability
                                : existingProfile.info.earningsPredictability,
                            priceGrowthPersistence: supabaseTicker.price_growth_persistence !== null && supabaseTicker.price_growth_persistence !== undefined
                                ? supabaseTicker.price_growth_persistence
                                : existingProfile.info.priceGrowthPersistence,
                            priceStability: supabaseTicker.price_stability !== null && supabaseTicker.price_stability !== undefined
                                ? supabaseTicker.price_stability
                                : existingProfile.info.priceStability,
                            beta: supabaseTicker.beta !== null && supabaseTicker.beta !== undefined
                                ? supabaseTicker.beta
                                : existingProfile.info.beta
                        };
                        
                        // Mettre à jour dans la library si les métriques ont changé
                        if (JSON.stringify(existingProfile.info) !== JSON.stringify(updatedInfo)) {
                            setLibrary(prev => ({
                                ...prev,
                                [upperSymbol]: {
                                    ...existingProfile,
                                    info: updatedInfo
                                }
                            }));
                            setInfo(updatedInfo);
                            console.log(`✅ Métriques ValueLine mises à jour depuis Supabase pour ${upperSymbol}`);
                        } else {
                            setInfo(existingProfile.info);
                        }
                    } else {
                        setInfo(existingProfile.info);
                    }
                } else {
                    setInfo(existingProfile.info);
                }
            } catch (error) {
                console.warn(`⚠️ Impossible de charger les métriques ValueLine depuis Supabase pour ${upperSymbol}:`, error);
                setInfo(existingProfile.info);
            }
            
            setActiveId(upperSymbol);
            setData(existingProfile.data);
            setAssumptions(existingProfile.assumptions);
            setNotes(existingProfile.notes);
            console.log(`✅ Loaded existing profile for ${upperSymbol}`);
            return;
        }

        // ⚠️ RIGUEUR 100% : Ne pas créer de profil placeholder
        // Charger les données FMP AVANT de créer le profil
        try {
            showNotification(`Chargement des données pour ${upperSymbol}...`, 'info');
            const result = await fetchCompanyData(upperSymbol);
            
            // VALIDATION STRICTE : Vérifier que les données sont valides
            if (!result.data || result.data.length === 0) {
                throw new Error(`Aucune donnée FMP retournée pour ${upperSymbol}`);
            }
            
            if (!result.currentPrice || result.currentPrice <= 0) {
                throw new Error(`Prix actuel invalide (${result.currentPrice}) pour ${upperSymbol}`);
            }
            
            // Vérifier qu'on a au moins une année avec des données valides
            const hasValidData = result.data.some(d => 
                d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
            );
            
            if (!hasValidData) {
                throw new Error(`Aucune donnée financière valide pour ${upperSymbol}`);
            }

            // ✅ TOUTES LES VALIDATIONS PASSÉES - Créer le profil avec les données réelles
            // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                result.data,
                result.currentPrice,
                INITIAL_ASSUMPTIONS
            );

            const newProfile: AnalysisProfile = {
                id: upperSymbol,
                lastModified: Date.now(),
                data: result.data,
                assumptions: {
                    ...INITIAL_ASSUMPTIONS,
                    ...autoFilledAssumptions
                },
                info: {
                    symbol: symbol,
                    name: result.info.name || symbol,
                    sector: result.info.sector || '',
                    securityRank: result.info.securityRank || 'N/A',
                    marketCap: result.info.marketCap || 'N/A',
                    ...result.info
                },
                notes: '',
                isWatchlist: false
            };
            
            // Créer le profil UNIQUEMENT avec des données valides
            setLibrary(prev => {
                const updated = {
                    ...prev,
                    [upperSymbol]: newProfile
                };
                
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch (e) {
                    console.warn('Failed to save to LocalStorage:', e);
                }
                
                return updated;
            });
            
            setActiveId(upperSymbol);
            setData(result.data);
            setAssumptions(newProfile.assumptions);
            // Ensure required fields are present
            const completeInfo: CompanyInfo = {
                symbol: symbol,
                name: result.info.name || symbol,
                sector: result.info.sector || '',
                securityRank: result.info.securityRank || 'N/A',
                marketCap: result.info.marketCap || 'N/A',
                ...result.info
            };
            setInfo(completeInfo);
            setNotes('');
            
            showNotification(`✅ ${upperSymbol} chargé avec succès`, 'success');
            console.log(`✅ ${upperSymbol}: Profil créé avec données FMP valides`);
        } catch (e) {
            const error = e as Error;
            console.error(`❌ ${upperSymbol}: Erreur FMP - profil NON créé:`, error);
            showNotification(`❌ Impossible de charger ${upperSymbol}: ${error.message}`, 'error');
            // ⚠️ RIGUEUR 100% : Ne pas créer de profil si FMP échoue
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
                showNotification("Ce nom existe déjà.", 'warning');
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

    // --- BULK SYNC ALL TICKERS HANDLER ---
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [bulkSyncProgress, setBulkSyncProgress] = useState({ current: 0, total: 0 });

    const handleBulkSyncAllTickers = async () => {
        if (!confirm(`Synchroniser tous les ${Object.keys(library).length} tickers ?\n\nChaque version sera sauvegardée avant la synchronisation.\nLes données manuelles et hypothèses (orange) seront préservées.`)) {
            return;
        }

        setIsBulkSyncing(true);
        const allTickers = Object.keys(library);
        setBulkSyncProgress({ current: 0, total: allTickers.length });

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Traiter par batch pour éviter de surcharger
        const batchSize = 3;
        const delayBetweenBatches = 1000;

        for (let i = 0; i < allTickers.length; i += batchSize) {
            const batch = allTickers.slice(i, i + batchSize);

            // Attendre entre les batches
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }

            // Traiter le batch en parallèle
            await Promise.allSettled(
                batch.map(async (tickerSymbol) => {
                    try {
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));

                        const profile = library[tickerSymbol];
                        if (!profile) return;

                        // 1. Sauvegarder un snapshot avant la sync
                        console.log(`💾 Sauvegarde snapshot pour ${tickerSymbol}...`);
                        await saveSnapshot(
                            tickerSymbol,
                            profile.data,
                            profile.assumptions,
                            profile.info,
                            `Avant synchronisation globale - ${new Date().toLocaleString()}`,
                            false, // Not current (on va le remplacer)
                            false  // Not auto-fetched
                        );

                        // 2. Charger les nouvelles données FMP
                        console.log(`🔄 Synchronisation ${tickerSymbol}...`);
                        const result = await fetchCompanyData(tickerSymbol);

                        // 3. Merge intelligent : préserver les données manuelles
                        // Créer un map des nouvelles données par année pour faciliter le merge
                        const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                        
                        const mergedData = profile.data.map((existingRow) => {
                            const newRow = newDataByYear.get(existingRow.year);
                            
                            // Si pas de nouvelle donnée pour cette année, garder l'existant
                            if (!newRow) {
                                return existingRow;
                            }

                            // Si la donnée existante est manuelle (autoFetched: false ou undefined), la garder
                            if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                                return existingRow; // Préserver la donnée manuelle
                            }

                            // Sinon, utiliser la nouvelle donnée avec autoFetched: true
                            return {
                                ...newRow,
                                autoFetched: true
                            };
                        });

                        // Ajouter les nouvelles années qui n'existent pas dans les données existantes
                        result.data.forEach(newRow => {
                            const exists = mergedData.some(row => row.year === newRow.year);
                            if (!exists) {
                                mergedData.push({
                                    ...newRow,
                                    autoFetched: true
                                });
                            }
                        });

                        // Trier par année
                        mergedData.sort((a, b) => a.year - b.year);

                        // 4. Recalculer les métriques avec la fonction centralisée (bonnes pratiques cohérentes)
                        // ⚠️ IMPORTANT : On préserve les exclusions (excludeEPS, excludeCF, etc.) mais on recalcule tout le reste
                        const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                            mergedData, // Utiliser les données mergées (avec préservation des données manuelles)
                            result.currentPrice,
                            profile.assumptions // Préserver les valeurs existantes (excludeEPS, excludeCF, etc.)
                        );

                        // 5. Détecter et exclure automatiquement les métriques avec prix cibles aberrants
                        const tempAssumptions = {
                            ...profile.assumptions,
                            ...autoFilledAssumptions
                        };
                        const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
                        
                        if (outlierDetection.detectedOutliers.length > 0) {
                            console.log(`⚠️ ${tickerSymbol}: Métriques avec prix cibles aberrants détectées: ${outlierDetection.detectedOutliers.join(', ')}`);
                        }

                        // Appliquer les exclusions détectées
                        const finalAssumptions = {
                            ...tempAssumptions,
                            excludeEPS: outlierDetection.excludeEPS,
                            excludeCF: outlierDetection.excludeCF,
                            excludeBV: outlierDetection.excludeBV,
                            excludeDIV: outlierDetection.excludeDIV
                        };

                        // 6. Mettre à jour le profil avec les nouvelles métriques calculées et exclusions automatiques
                        setLibrary(prev => {
                            const updated = {
                                ...prev,
                                [tickerSymbol]: {
                                    ...profile,
                                    data: mergedData,
                                    info: {
                                        ...profile.info,
                                        ...result.info, // Mettre à jour les infos (nom, secteur, etc.)
                                        // S'assurer que le nom de FMP remplace toujours celui de Supabase
                                        name: result.info.name || profile.info.name
                                    },
                                    assumptions: finalAssumptions, // Inclure les exclusions automatiques
                                    lastModified: Date.now()
                                }
                            };

                            try {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                            } catch (e) {
                                console.warn('Failed to save to LocalStorage:', e);
                            }

                            return updated;
                        });

                        // 7. Sauvegarder le snapshot après sync avec les nouvelles métriques et exclusions automatiques
                        await saveSnapshot(
                            tickerSymbol,
                            mergedData,
                            finalAssumptions, // Inclure les exclusions automatiques
                            {
                                ...profile.info,
                                ...result.info
                            },
                            `Synchronisation globale - ${new Date().toLocaleString()}`,
                            true,  // Mark as current
                            true   // Auto-fetched
                        );

                        successCount++;
                        console.log(`✅ ${tickerSymbol} synchronisé avec succès`);

                    } catch (error: any) {
                        errorCount++;
                        const errorMsg = `${tickerSymbol}: ${error.message || 'Erreur inconnue'}`;
                        errors.push(errorMsg);
                        console.error(`❌ Erreur sync ${tickerSymbol}:`, error);
                    }
                })
            );
        }

        setIsBulkSyncing(false);
        setBulkSyncProgress({ current: 0, total: 0 });

        // Afficher le résultat
        const message = `Synchronisation terminée\n\n` +
            `Réussies: ${successCount}\n` +
            `Erreurs: ${errorCount}` +
            (errors.length > 0 ? `\n\nErreurs:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... et ${errors.length - 5} autres` : ''}` : '');
        
        showNotification(message, errorCount > 0 ? 'warning' : 'success');
        console.log(`✅ ${message}`);
    };

    // --- SYNC FROM SUPABASE HANDLER ---
    const handleSyncFromSupabase = async () => {
        setIsLoadingTickers(true);
        setTickersLoadError(null);

        try {
            const result = await loadAllTickersFromSupabase();

            if (!result.success) {
                setTickersLoadError(result.error || 'Erreur lors de la synchronisation');
                showNotification(`Erreur: ${result.error || 'Impossible de synchroniser avec Supabase'}`, 'error');
                setIsLoadingTickers(false);
                return;
            }

            let newTickersCount = 0;
            let updatedTickersCount = 0;

            // Merge intelligent : ne pas écraser les profils existants
            setLibrary(prev => {
                const updated = { ...prev };

                result.tickers.forEach(supabaseTicker => {
                    const tickerSymbol = supabaseTicker.ticker.toUpperCase();
                    const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                    
                    if (updated[tickerSymbol]) {
                        // Mettre à jour isWatchlist et métriques ValueLine si nécessaire
                        const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                        const hasValueLineUpdates = supabaseTicker.security_rank || 
                                                   supabaseTicker.earnings_predictability || 
                                                   supabaseTicker.price_growth_persistence || 
                                                   supabaseTicker.price_stability;
                        
                        if (updated[tickerSymbol].isWatchlist !== shouldBeWatchlist || hasValueLineUpdates) {
                            updated[tickerSymbol] = {
                                ...updated[tickerSymbol],
                                isWatchlist: shouldBeWatchlist,
                                // ⚠️ MULTI-UTILISATEUR : Supabase est la source de vérité pour les métriques ValueLine
                                // Toujours utiliser Supabase si disponible, sinon garder valeur existante
                                info: {
                                    ...updated[tickerSymbol].info,
                                    securityRank: supabaseTicker.security_rank !== null && supabaseTicker.security_rank !== undefined
                                        ? supabaseTicker.security_rank
                                        : (updated[tickerSymbol].info.securityRank || 'N/A'),
                                    earningsPredictability: supabaseTicker.earnings_predictability !== null && supabaseTicker.earnings_predictability !== undefined
                                        ? supabaseTicker.earnings_predictability
                                        : updated[tickerSymbol].info.earningsPredictability,
                                    priceGrowthPersistence: supabaseTicker.price_growth_persistence !== null && supabaseTicker.price_growth_persistence !== undefined
                                        ? supabaseTicker.price_growth_persistence
                                        : updated[tickerSymbol].info.priceGrowthPersistence,
                                    priceStability: supabaseTicker.price_stability !== null && supabaseTicker.price_stability !== undefined
                                        ? supabaseTicker.price_stability
                                        : updated[tickerSymbol].info.priceStability,
                                    beta: supabaseTicker.beta !== null && supabaseTicker.beta !== undefined
                                        ? supabaseTicker.beta
                                        : updated[tickerSymbol].info.beta
                                }
                            };
                            updatedTickersCount++;
                            
                            // Si c'est le profil actif, mettre à jour aussi le state local
                            if (tickerSymbol === activeId) {
                                setInfo(updated[tickerSymbol].info);
                            }
                        }
                        return;
                    }

                    // ⚠️ RIGUEUR 100% : Ne pas créer de profil placeholder ici
                    // Le profil sera créé uniquement si FMP réussit (voir code après)
                    // On marque juste le ticker comme "à charger"
                    newTickersCount++;
                });

                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch (e) {
                    console.warn('Failed to save to LocalStorage:', e);
                }

                return updated;
            });

            // Charger les données FMP pour les nouveaux tickers en arrière-plan
            const newTickers = result.tickers.filter(t => {
                const symbol = t.ticker.toUpperCase();
                return !library[symbol];
            });

            if (newTickers.length > 0) {
                const batchSize = 5;
                const delayBetweenBatches = 500;

                for (let i = 0; i < newTickers.length; i += batchSize) {
                    const batch = newTickers.slice(i, i + batchSize);
                    
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                    }

                    await Promise.allSettled(
                        batch.map(async (supabaseTicker) => {
                            const symbol = supabaseTicker.ticker.toUpperCase();
                            try {
                                const result = await fetchCompanyData(symbol);
                                
                                // VALIDATION STRICTE : Vérifier que les données sont valides
                                if (!result.data || result.data.length === 0) {
                                    console.error(`❌ ${symbol}: Aucune donnée FMP retournée - profil NON créé`);
                                    return;
                                }
                                
                                if (!result.currentPrice || result.currentPrice <= 0) {
                                    console.error(`❌ ${symbol}: Prix actuel invalide (${result.currentPrice}) - profil NON créé`);
                                    return;
                                }
                                
                                const hasValidData = result.data.some(d => 
                                    d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
                                );
                                
                                if (!hasValidData) {
                                    console.error(`❌ ${symbol}: Aucune donnée financière valide - profil NON créé`);
                                    return;
                                }
                                
                                // ✅ TOUTES LES VALIDATIONS PASSÉES - Créer le profil avec les données réelles
                                const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                                
                                // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
                                const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                                    result.data,
                                    result.currentPrice,
                                    INITIAL_ASSUMPTIONS
                                );
                                
                                const newProfile: AnalysisProfile = {
                                    id: symbol,
                                    lastModified: Date.now(),
                                    data: result.data,
                                    assumptions: {
                                        ...INITIAL_ASSUMPTIONS,
                                        ...autoFilledAssumptions
                                    },
                                    info: {
                                        symbol: symbol,
                                        name: result.info.name || supabaseTicker.company_name || symbol,
                                        sector: result.info.sector || supabaseTicker.sector || '',
                                        marketCap: result.info.marketCap || 'N/A',
                                        ...result.info,
                                        securityRank: supabaseTicker.security_rank || 'N/A',
                                        earningsPredictability: supabaseTicker.earnings_predictability,
                                        priceGrowthPersistence: supabaseTicker.price_growth_persistence,
                                        priceStability: supabaseTicker.price_stability,
                                        beta: result.info.beta || supabaseTicker.beta,
                                        preferredSymbol: supabaseTicker.ticker
                                    },
                                    notes: '',
                                    isWatchlist: shouldBeWatchlist
                                };
                                
                                setLibrary(prev => {
                                    const updated = {
                                        ...prev,
                                        [symbol]: newProfile
                                    };
                                    
                                    try {
                                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                                    } catch (e) {
                                        console.warn('Failed to save to LocalStorage:', e);
                                    }
                                    
                                    return updated;
                                });
                                
                                console.log(`✅ ${symbol}: Profil créé avec données FMP valides`);
                            } catch (error) {
                                console.error(`❌ ${symbol}: Erreur FMP - profil NON créé:`, error);
                                // ⚠️ RIGUEUR 100% : Ne pas créer de profil si FMP échoue
                            }
                        })
                    );
                }
            }

            // Afficher un message de succès
            const message = newTickersCount > 0 
                ? `${newTickersCount} nouveau(x) ticker(s) ajouté(s)${updatedTickersCount > 0 ? `, ${updatedTickersCount} mis à jour` : ''}`
                : updatedTickersCount > 0
                ? `${updatedTickersCount} ticker(s) mis à jour`
                : 'Synchronisation terminée (aucun changement)';
            
            showNotification(message, 'success');
            console.log(`✅ ${message}`);

        } catch (error: any) {
            console.error('❌ Erreur lors de la synchronisation:', error);
            setTickersLoadError(error.message || 'Erreur inconnue');
            showNotification(`Erreur: ${error.message || 'Impossible de synchroniser avec Supabase'}`, 'error');
        } finally {
            setIsLoadingTickers(false);
        }
    };

    // --- CALCULATIONS CORE ---
    // Use central logic to ensure chart matches sidebar
    const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
    const baseEPS = baseYearData?.earningsPerShare || 0;
    const baseCF = baseYearData?.cashFlowPerShare || 0;
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
            {/* Overlay pour mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <div
                className={`bg-slate-900 h-full transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
                    isSidebarOpen 
                        ? 'w-72 fixed md:relative z-50 md:z-auto' 
                        : 'w-0 md:w-0'
                } no-print`}
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
                        onSyncFromSupabase={handleSyncFromSupabase}
                        isLoadingTickers={isLoadingTickers}
                        onBulkSyncAll={handleBulkSyncAllTickers}
                        isBulkSyncing={isBulkSyncing}
                        bulkSyncProgress={bulkSyncProgress}
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

                <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 print-full-width">
                    <div className="max-w-7xl mx-auto w-full">

                        {/* TOP BAR & NAVIGATION */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 no-print">
                            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors flex-shrink-0"
                                    title={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
                                >
                                    <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                <button
                                    onClick={() => setCurrentView(currentView === 'kpi' ? 'analysis' : 'kpi')}
                                    className={`px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                                        currentView === 'kpi' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                    title="Basculer entre vue Analyse et vue KPI"
                                >
                                    <ChartBarSquareIcon className="w-4 h-4 sm:w-5 sm:h-5 inline sm:mr-2" />
                                    <span className="hidden sm:inline">{currentView === 'kpi' ? 'Vue Analyse' : 'Vue KPI'}</span>
                                </button>
                                <button
                                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isRightSidebarOpen 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                    title="Afficher/Masquer l'historique"
                                >
                                    <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                <h1 className="text-base sm:text-xl font-bold text-gray-700 truncate flex-1 sm:flex-none">Analyse Financière Pro</h1>
                            </div>

                            {/* VIEW TABS */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex items-center gap-1 w-full sm:w-auto">
                                <button
                                    onClick={() => setCurrentView('analysis')}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${currentView === 'analysis'
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <ChartBarSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden xs:inline">Analyse</span>
                                </button>
                                <button
                                    onClick={() => setCurrentView('info')}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${currentView === 'info'
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden xs:inline">Mode d'emploi</span>
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
                                    onRestoreData={handleOpenRestoreDialog}
                                    showSyncButton={currentView === 'analysis'}
                                />

                        {/* CONDITIONAL RENDER: ANALYSIS VS INFO VS KPI */}
                        {currentView === 'info' ? (
                            <InfoTab />
                        ) : currentView === 'kpi' ? (
                            <KPIDashboard
                                key={`kpi-${Object.keys(library).length}-${Object.values(library).reduce((sum, p) => sum + p.lastModified, 0)}`}
                                profiles={Object.values(library)}
                                currentId={activeId}
                                onSelect={setActiveId}
                            />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">

                                {/* LEFT COLUMN - MAIN DATA */}
                                <div className="lg:col-span-3 order-2 lg:order-1">
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6">
                                        {/* Sensitivity Matrix P/E */}
                                        <SensitivityTable
                                            baseEPS={baseEPS}
                                            baseGrowth={assumptions.growthRateEPS}
                                            basePE={assumptions.targetPE}
                                        />
                                        {/* Sensitivity Matrix P/FCF */}
                                        <SensitivityTablePCF
                                            baseCF={baseCF}
                                            baseGrowth={assumptions.growthRateCF}
                                            basePCF={assumptions.targetPCF}
                                        />
                                    </div>
                                    
                                    <div className="mb-6">
                                        {/* Analyst Notes */}
                                        <NotesEditor initialNotes={notes} onSave={setNotes} />
                                    </div>

                                    {/* Comprehensive Evaluation Grid */}
                                    <EvaluationDetails
                                        data={data}
                                        assumptions={assumptions}
                                        onUpdateAssumption={handleUpdateAssumption}
                                        info={info}
                                        sector={info.sector}
                                    />

                                    {/* Historical Ranges Table - Aide pour les hypothèses */}
                                    <HistoricalRangesTable
                                        data={data}
                                        info={info}
                                        sector={info.sector}
                                        assumptions={assumptions}
                                    />

                                    <div className="mt-8">
                                        <AdditionalMetrics
                                            data={data}
                                            assumptions={assumptions}
                                            info={info}
                                        />
                                    </div>

                                    {/* Data Sources and Methodology Info */}
                                    <DataSourcesInfo />

                                </div>

                                {/* RIGHT COLUMN - SUMMARY & PARAMS */}
                                <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6 no-print order-1 lg:order-2">

                                    {/* Summary Card */}
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 border-b border-slate-600 pb-2">Résumé Exécutif</h2>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            L'analyse de {info.name} suggère une position <strong className="text-white uppercase">{recommendation}</strong> au prix actuel de {formatCurrency(assumptions.currentPrice)}.
                                        </p>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            Le titre se négocie à <strong className="text-white">{formatPercent(Math.abs(1 - (assumptions.currentPrice / targetPrice)) * 100)} {assumptions.currentPrice < targetPrice ? 'sous' : 'au-dessus de'}</strong> l'objectif de prix EPS de {formatCurrency(targetPrice)}.
                                        </p>

                                        {/* Note: Les métriques ValueLine sont affichées dans le Header (barre supérieure) et dans la section Configuration ci-dessous */}
                                        {info.beta !== undefined && info.beta !== null && (
                                            <div className="bg-slate-700/50 p-3 rounded mt-6">
                                                <div className="text-xs text-slate-400 uppercase">Beta</div>
                                                <div className="text-2xl font-bold text-blue-400">{info.beta.toFixed(2)}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">Source: API FMP</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Editable Company Info */}
                                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
                                        <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase mb-2 sm:mb-3 flex items-center gap-2">
                                            <Cog6ToothIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Configuration
                                        </h3>
                                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
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
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Financial Strength (ValueLine 3 déc 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronisé depuis Supabase - Lecture seule">🔒</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.securityRank}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="A+, A, B+, etc."
                                                    title="Cette métrique est synchronisée depuis Supabase et ne peut pas être modifiée localement"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Earnings Predictability (ValueLine 3 déc 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronisé depuis Supabase - Lecture seule">🔒</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.earningsPredictability || ''}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="100, 95, 90, etc."
                                                    title="Cette métrique est synchronisée depuis Supabase et ne peut pas être modifiée localement"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Price Growth Persistence (ValueLine 3 déc 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronisé depuis Supabase - Lecture seule">🔒</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.priceGrowthPersistence || ''}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="95, 90, 85, etc."
                                                    title="Cette métrique est synchronisée depuis Supabase et ne peut pas être modifiée localement"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Price Stability (ValueLine 3 déc 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronisé depuis Supabase - Lecture seule">🔒</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.priceStability || ''}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="100, 95, 90, etc."
                                                    title="Cette métrique est synchronisée depuis Supabase et ne peut pas être modifiée localement"
                                                />
                                            </div>
                                            {info.beta !== undefined && info.beta !== null && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Beta (API FMP)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={info.beta}
                                                        onChange={(e) => handleUpdateInfo('beta', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                        readOnly
                                                        title="Beta récupéré automatiquement via API FMP"
                                                    />
                                                </div>
                                            )}
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

            {/* Restore Data Dialog */}
            <RestoreDataDialog
                isOpen={showRestoreDialog}
                onClose={() => setShowRestoreDialog(false)}
                onRestoreFromSnapshot={handleRestoreFromSnapshot}
                onRecalculateFromFMP={handleRecalculateFromFMP}
                latestSnapshotDate={latestSnapshotDate}
            />

            {/* RIGHT SIDEBAR - HISTORIQUE */}
            <RightSidebar
                ticker={activeId}
                onLoadVersion={handleLoadSnapshot}
                isOpen={isRightSidebarOpen}
                onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            />

            {/* NOTIFICATIONS */}
            <NotificationManager
                notifications={notifications}
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />
        </div>
    );
}