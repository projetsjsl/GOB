import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
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
import { InfoTab } from './components/InfoTab';
import { TickerSearch } from './components/TickerSearch';
import { ConfirmSyncDialog } from './components/ConfirmSyncDialog';
import { AdvancedSyncDialog, SyncOptions } from './components/AdvancedSyncDialog';
import { SyncReportDialog, SyncReportData } from './components/SyncReportDialog';
import { HistoricalVersionBanner } from './components/HistoricalVersionBanner';
import { NotificationManager } from './components/Notification';
import { SyncProgressBar } from './components/SyncProgressBar';
import { SyncLockOverlay } from './components/SyncLockOverlay';
import { LandingPage } from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InteractiveDemo } from './components/InteractiveDemo';
import { SupabaseLoadingProgress } from './components/SupabaseLoadingProgress';
import { AnnualData, Assumptions, CompanyInfo, Recommendation, AnalysisProfile } from './types';
import { calculateRowRatios, calculateAverage, projectFutureValue, formatCurrency, formatPercent, calculateCAGR, calculateRecommendation, autoFillAssumptionsFromFMPData, isMutualFund, calculateHistoricalGrowth } from './utils/calculations';
import { detectOutlierMetrics } from './utils/outlierDetection';
import { Cog6ToothIcon, CalculatorIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, Bars3Icon, ArrowPathIcon, ChartBarSquareIcon, InformationCircleIcon, ClockIcon, PresentationChartBarIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';
import { fetchCompanyData } from './services/financeApi';
import { saveSnapshot, hasManualEdits, loadSnapshot, listSnapshots } from './services/snapshotApi';
import { RestoreDataDialog } from './components/RestoreDataDialog';
import { UnifiedSettingsPanel } from './components/UnifiedSettingsPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { loadConfig, saveConfig, DEFAULT_CONFIG, GuardrailConfig } from './config/AppConfig';
import { invalidateValidationSettingsCache, sanitizeAssumptionsSync } from './utils/validation';
import { loadAllTickersFromSupabase, mapSourceToIsWatchlist } from './services/tickersApi';
import { loadProfilesBatchFromSupabase, loadProfileFromSupabase } from './services/supabaseDataLoader';
import { storage } from './utils/storage';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { autoCleanupProfiles } from './utils/cleanupProfiles';

// Lazy load heavy components for better initial load performance
const KPIDashboard = React.lazy(() => import('./components/KPIDashboard').then(m => ({ default: m.KPIDashboard })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const DataExplorerPanel = React.lazy(() => import('./components/DataExplorerPanel'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      <span className="text-gray-400 text-sm">Chargement...</span>
    </div>
  </div>
);


// Donnees initiales par defaut (VIDE - en attente de chargement)
const INITIAL_DATA: AnnualData[] = [];

const INITIAL_ASSUMPTIONS: Assumptions = {
    currentPrice: 0,
    currentDividend: 0,
    growthRateEPS: 0,
    growthRateSales: 0,
    growthRateCF: 0,
    growthRateBV: 0,
    growthRateDiv: 0,
    targetPE: 0,
    targetPCF: 0,
    targetPBV: 0,
    targetYield: 0,
    requiredReturn: 10.0, // Default sane value
    dividendPayoutRatio: 0,
    baseYear: new Date().getFullYear()
};

const INITIAL_INFO: CompanyInfo = {
    symbol: '',
    name: 'Chargement...',
    sector: '',
    securityRank: '',
    marketCap: '',
    logo: undefined,
    country: undefined,
    exchange: undefined,
    currency: 'USD',
    preferredSymbol: undefined
};

const DEFAULT_PROFILE: AnalysisProfile = {
    id: '',
    lastModified: Date.now(),
    data: INITIAL_DATA,
    assumptions: INITIAL_ASSUMPTIONS,
    info: INITIAL_INFO,
    notes: '',
    isWatchlist: false
};

//  Configurations chargees depuis Supabase (pas de hardcoding)
let STORAGE_KEY = 'finance_pro_profiles'; // Valeur par defaut, sera remplacee par Supabase
let CACHE_MAX_AGE_MS = 5 * 60 * 1000; // Valeur par defaut, sera remplacee par Supabase

//  Structure du cache avec timestamp pour invalidation automatique
interface CacheEntry {
    data: Record<string, AnalysisProfile>;
    timestamp: number;
}

//  Helper function pour sauvegarder avec timestamp (Supabase = source de verite, localStorage = cache)
//  NOUVEAU: Sauvegarder dans Supabase ET cache local (Supabase = source de verite)
const saveToSupabase = async (data: Record<string, AnalysisProfile>): Promise<void> => {
    try {
        // Sauvegarder dans Supabase (source de verite)
        const { saveProfilesBatchToSupabase } = await import('./services/profileApi');
        const result = await saveProfilesBatchToSupabase(data);
        
        if (result.failed > 0) {
            console.warn(` ${result.failed} profils n'ont pas pu etre sauvegardes dans Supabase:`, result.errors.slice(0, 5));
        }
        
        if (result.success > 0) {
            console.log(` ${result.success} profils sauvegardes dans Supabase`);
        }
    } catch (e) {
        console.warn('Failed to save to Supabase:', e);
    }
};

//  Cache local uniquement (pour performance, Supabase = source de verite)
const saveToCache = async (data: Record<string, AnalysisProfile>): Promise<void> => {
    try {
        const cacheEntry: CacheEntry = {
            data,
            timestamp: Date.now()
        };
        await storage.setItem(STORAGE_KEY, cacheEntry);
    } catch (e) {
        console.warn('Failed to save to cache:', e);
    }
};

//  Sauvegarder dans Supabase ET cache local
const saveProfiles = async (data: Record<string, AnalysisProfile>, saveToSupabaseFirst: boolean = true): Promise<void> => {
    if (saveToSupabaseFirst) {
        // Sauvegarder dans Supabase d'abord (source de verite)
        await saveToSupabase(data);
    }
    
    // Puis sauvegarder dans le cache local (pour performance)
    await saveToCache(data);
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
    const progressRef = useRef<HTMLDivElement>(null);
    const percent = total > 0 ? (current / total) * 100 : 0;

    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.style.width = `${percent}%`;
        }
    }, [percent]);

    return (
        <div className="w-full bg-slate-700 h-2 rounded-full mb-3 overflow-hidden">
            <div 
                ref={progressRef}
                className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out" 
            />
        </div>
    );
};

export default function App() {
    // --- VERSION INDICATOR ---
    useEffect(() => {
        console.log(' 3p1 App v2.1.0 - Filtres/Tri & Rapports Visuels actives');
        console.log(' Modifications disponibles:');
        console.log('   - Section "Filtres et Tri" en bas de sidebar');
        console.log('   - Bouton  Rapports dans Header');
        console.log('   - Bouton  Settings fonctionnel');
    }, []);

    // --- GLOBAL STATE & PERSISTENCE ---
    // Verifier si l'utilisateur a deja vu la landing page
    const [showLanding, setShowLanding] = useState(() => {
        const hasSeenLanding = localStorage.getItem('3p1-has-seen-landing');
        return hasSeenLanding !== 'true';
    });
    const [showDemo, setShowDemo] = useState(false); // Show interactive demo
    const [library, setLibrary] = useState<Record<string, AnalysisProfile>>({});
    const [activeId, setActiveId] = useState<string>('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'analysis' | 'info' | 'kpi'>('analysis');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showConfirmSync, setShowConfirmSync] = useState(false);
    const [showAdvancedSyncDialog, setShowAdvancedSyncDialog] = useState(false);
    const [isAdvancedSyncForBulk, setIsAdvancedSyncForBulk] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Etat pour la synchronisation d'un seul ticker
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

    // --- ADMIN DASHBOARD STATE ---
    const [showAdmin, setShowAdmin] = useState(false);
    const [showDataExplorer, setShowDataExplorer] = useState(false);
    const [isRepairing, setIsRepairing] = useState<string | null>(null);

    // --- CONFIG SYSTEM ---
    // BUG FIX: loadConfig() is async - use DEFAULT_CONFIG as initial state
    const [guardrailConfig, setGuardrailConfig] = useState<GuardrailConfig>(DEFAULT_CONFIG);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);

    // Load async config on mount
    useEffect(() => {
        loadConfig().then(setGuardrailConfig).catch(console.error);
    }, []);

    const handleSaveConfig = (newConfig: GuardrailConfig) => {
        setGuardrailConfig(newConfig);
        saveConfig(newConfig);
        showNotification('Configuration sauvegardee avec succes', 'success');
    };

    const handleSettingsClose = () => {
        setIsSettingsOpen(false);
        // Reload guardrail config after settings are saved (async)
        loadConfig().then(config => {
            setGuardrailConfig(config);
            // Invalider le cache pour recharger les nouveaux parametres
            invalidateValidationSettingsCache();
            showNotification('Parametres de validation mis a jour', 'success');
        }).catch(console.error);
    };

    // Keyboard shortcut to toggle admin (Ctrl+Shift+A)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setShowAdmin(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    /**
     * --- SUPABASE REALTIME SUBSCRIPTIONS ---
     * 
     * Synchronisation temps reel via Supabase Realtime pour coherence multi-utilisateurs.
     * 
     * Architecture :
     * - Ecoute les changements sur la table 'tickers'
     * - INSERT/DELETE -> Force rechargement complet (invalide cache)
     * - UPDATE -> Met a jour metriques ValueLine directement
     * - Synchronisation periodique (2 min) comme fallback
     * 
     * Gestion des race conditions :
     * - useRef pour onDataChange (evite closures stale)
     * - isMounted check (evite updates sur unmounted)
     * - Timeout avec cleanup (evite fuites memoire)
     * - Invalidation cache explicite
     * 
     * Performance :
     * - Delai de 100ms pour batch updates (evite rapid re-renders)
     * - Cache invalidation seulement si necessaire
     * - Cleanup automatique au demontage
     * 
     * @see useRealtimeSync hook pour l'implementation
     * @see loadTickersFromSupabase pour le rechargement
     */
    // Live sync: when any user adds/updates/deletes tickers, all clients see it instantly
    //  OPTIMISATION: Utiliser useRef pour eviter les closures stale et les race conditions
    const realtimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const loadTickersFromSupabaseRef = useRef<(() => Promise<void>) | null>(null);
    
    useRealtimeSync('tickers', (payload) => {
        console.log(' [3p1] Realtime ticker change:', payload.eventType, payload.new?.ticker || payload.old?.ticker);
        
        //  FIX: Annuler le timeout precedent pour eviter les race conditions
        if (realtimeTimeoutRef.current) {
            clearTimeout(realtimeTimeoutRef.current);
            realtimeTimeoutRef.current = null;
        }
        
        if (payload.eventType === 'INSERT' && payload.new) {
            const symbol = payload.new.ticker?.toUpperCase();
            if (symbol) {
                showNotification(` Nouveau ticker ajoute par un autre utilisateur: ${symbol}`, 'info');
                //  NOUVEAU : Invalider le cache localStorage automatiquement
                storage.removeItem(STORAGE_KEY).catch(console.warn);
                //  FORCER le rechargement complet depuis Supabase pour synchronisation
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null; // Invalider le cache
                //  FIX: Utiliser un timeout avec nettoyage pour eviter les fuites memoire
                realtimeTimeoutRef.current = setTimeout(() => {
                    realtimeTimeoutRef.current = null;
                    if (loadTickersFromSupabaseRef.current) {
                        loadTickersFromSupabaseRef.current();
                    }
                }, 300); // Reduit a 300ms pour reactivite
            }
        } else if (payload.eventType === 'DELETE' && payload.old) {
            const symbol = payload.old.ticker?.toUpperCase();
            if (symbol) {
                showNotification(` Ticker supprime par un autre utilisateur: ${symbol}`, 'warning');
                //  NOUVEAU : Invalider le cache localStorage automatiquement
                storage.removeItem(STORAGE_KEY).catch(console.warn);
                //  Supprimer du state local ET forcer rechargement
                setLibrary(prev => {
                    const updated = { ...prev };
                    delete updated[symbol];
                    return updated;
                });
                // Recharger depuis Supabase pour etre sur
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null;
                realtimeTimeoutRef.current = setTimeout(() => {
                    realtimeTimeoutRef.current = null;
                    if (loadTickersFromSupabaseRef.current) {
                        loadTickersFromSupabaseRef.current();
                    }
                }, 300);
            }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
            const symbol = payload.new.ticker?.toUpperCase();
            if (symbol) {
                showNotification(` Ticker mis a jour: ${symbol}`, 'info');
                //  NOUVEAU : Invalider le cache localStorage automatiquement
                storage.removeItem(STORAGE_KEY).catch(console.warn);
                //  Mettre a jour les metriques ValueLine ET recharger pour coherence
                setLibrary(prev => {
                    if (!prev[symbol]) return prev;
                    return {
                        ...prev,
                        [symbol]: {
                            ...prev[symbol],
                            isWatchlist: mapSourceToIsWatchlist(payload.new.source),
                            info: {
                                ...prev[symbol].info,
                                securityRank: payload.new.security_rank !== null && payload.new.security_rank !== undefined
                                    ? payload.new.security_rank
                                    : prev[symbol].info.securityRank,
                                earningsPredictability: payload.new.earnings_predictability !== null && payload.new.earnings_predictability !== undefined
                                    ? payload.new.earnings_predictability
                                    : prev[symbol].info.earningsPredictability,
                                priceGrowthPersistence: payload.new.price_growth_persistence !== null && payload.new.price_growth_persistence !== undefined
                                    ? payload.new.price_growth_persistence
                                    : prev[symbol].info.priceGrowthPersistence,
                                priceStability: payload.new.price_stability !== null && payload.new.price_stability !== undefined
                                    ? payload.new.price_stability
                                    : prev[symbol].info.priceStability,
                                beta: payload.new.beta !== null && payload.new.beta !== undefined
                                    ? payload.new.beta
                                    : prev[symbol].info.beta
                            }
                        }
                    };
                });
                // Recharger depuis Supabase pour synchronisation complete
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null;
                realtimeTimeoutRef.current = setTimeout(() => {
                    realtimeTimeoutRef.current = null;
                    if (loadTickersFromSupabaseRef.current) {
                        loadTickersFromSupabaseRef.current();
                    }
                }, 500); // Reduit a 500ms pour reactivite
            }
        }
    });
    
    //  FIX: Nettoyer le timeout au demontage pour eviter les fuites memoire
    useEffect(() => {
        return () => {
            if (realtimeTimeoutRef.current) {
                clearTimeout(realtimeTimeoutRef.current);
                realtimeTimeoutRef.current = null;
            }
        };
    }, []);

    // --- USER ROLE MANAGEMENT ---
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        try {
            // Check URL parameters first (allows direct link access as admin)
            const urlParams = new URLSearchParams(window.location.search);
            const urlRole = urlParams.get('role');
            const urlAdmin = urlParams.get('admin');
            
            if (urlRole === 'admin' || urlAdmin === 'true') {
                setIsAdmin(true);
                // Persist admin role in localStorage for session
                localStorage.setItem('3p1-admin', 'true');
                console.log(' Admin access granted via URL parameter');
                return;
            }
            
            // Check localStorage for persisted admin flag
            if (localStorage.getItem('3p1-admin') === 'true') {
                setIsAdmin(true);
                console.log(' Admin access granted via localStorage');
                return;
            }
            
            // Check sessionStorage (set by main dashboard login)
            const userJson = sessionStorage.getItem('gob-user');
            if (userJson) {
                const user = JSON.parse(userJson);
                // Check multiple possible admin indicators
                if (user.role === 'admin' || user.is_admin === true || user.username === 'admin' || user.id === 'admin') {
                    setIsAdmin(true);
                    console.log(' Admin access granted via sessionStorage');
                }
            }
        } catch (e) {
            console.warn('Failed to parse user role', e);
        }
    }, []);

    //  Fonction cachee pour toggle admin mode (double-clic sur logo)
    const handleToggleAdmin = () => {
        const newAdminState = !isAdmin;
        setIsAdmin(newAdminState);
        if (newAdminState) {
            localStorage.setItem('3p1-admin', 'true');
            console.log(' Mode admin active (double-clic sur logo)');
            showNotification(' Mode admin active', 'success');
        } else {
            localStorage.removeItem('3p1-admin');
            console.log(' Mode admin desactive (double-clic sur logo)');
            showNotification(' Mode admin desactive', 'info');
        }
    };


    const handleAdminRepair = async (tickerToRepair: string) => {
        setIsRepairing(tickerToRepair);
        try {
            console.log(` Admin: Repairing ${tickerToRepair}...`);
            const result = await fetchCompanyData(tickerToRepair);
            
            if (result.data && result.data.length > 0) {
                 const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                    result.data,
                    result.currentPrice,
                    INITIAL_ASSUMPTIONS
                );

                await saveSnapshot(
                    tickerToRepair,
                    result.data,
                    {
                        ...INITIAL_ASSUMPTIONS,
                        ...autoFilledAssumptions
                    },
                    {
                        symbol: tickerToRepair,
                        name: result.info.name || tickerToRepair,
                        ...result.info,
                        financials: result.financials, 
                        analysisData: result.analysisData 
                    } as CompanyInfo,
                    `Admin Repair - ${new Date().toLocaleString()}`,
                    true,
                    true
                );
                
                // Update local library if present
                setLibrary(prev => {
                   if (!prev[tickerToRepair]) return prev;
                   return {
                       ...prev,
                       [tickerToRepair]: {
                           ...prev[tickerToRepair],
                           data: result.data,
                           info: {
                               ...prev[tickerToRepair].info,
                               ...result.info,
                               financials: result.financials,
                               analysisData: result.analysisData
                           },
                           lastModified: Date.now()
                       }
                   };
                });
                
                showNotification(` Repaired ${tickerToRepair}`, 'success');
            } else {
                showNotification(` Failed to fetch data for ${tickerToRepair}`, 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification(` Error repairing ${tickerToRepair}`, 'error');
        } finally {
            setIsRepairing(null);
        }
    };

    // Historical Version State
    const [currentSnapshot, setCurrentSnapshot] = useState<{
        id: string;
        date: string;
        version: number;
        isHistorical: boolean;
    } | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Load from Storage (IndexedDB/LocalStorage) on Mount
    useEffect(() => {
        const loadFromStorage = async () => {
            try {
                //  NOUVEAU: Charger depuis Supabase d'abord (source de verite)
                console.log(' Chargement des profils depuis Supabase...');
                const { loadAllProfilesFromSupabase } = await import('./services/profileApi');
                const supabaseResult = await loadAllProfilesFromSupabase();
                
                let parsed: Record<string, AnalysisProfile> = {};
                
                if (supabaseResult.success && Object.keys(supabaseResult.profiles).length > 0) {
                    //  Utiliser les profils depuis Supabase
                    parsed = supabaseResult.profiles;
                    console.log(` ${Object.keys(parsed).length} profils charges depuis Supabase`);
                    
                    // Mettre a jour le cache local avec les donnees Supabase (cache uniquement, Supabase = source de verite)
                    await saveToCache(parsed);
                } else {
                    //  Fallback: Charger depuis cache local si Supabase echoue
                    console.log(' Echec chargement Supabase, fallback sur cache local...');
                    const saved = await storage.getItem(STORAGE_KEY);
                    if (saved) {
                        let cacheTimestamp: number | null = null;
                        
                        //  NOUVEAU : Verifier si c'est la nouvelle structure avec timestamp
                        if (saved && typeof saved === 'object' && 'data' in saved && 'timestamp' in saved) {
                            const cacheEntry = saved as CacheEntry;
                            cacheTimestamp = cacheEntry.timestamp;
                            parsed = cacheEntry.data;
                            
                            //  Verifier si le cache est obsolete (> 5 min)
                            const now = Date.now();
                            const cacheAge = now - cacheTimestamp;
                            if (cacheAge > CACHE_MAX_AGE_MS) {
                                console.log(` Cache obsolete (${Math.round(cacheAge / 1000 / 60)} min) - Ignore`);
                                parsed = {};
                            } else {
                                console.log(` Cache valide (${Math.round(cacheAge / 1000)}s) - Utilisation cache local`);
                            }
                        } else if (typeof saved === 'string') {
                            // Migration depuis ancien format (string)
                            try {
                               parsed = JSON.parse(saved);
                            } catch (e) {
                               console.error('Failed to parse stringified data', e);
                               parsed = {};
                            }
                        } else if (typeof saved === 'object') {
                            // Format direct
                            parsed = saved as Record<string, AnalysisProfile>;
                        }

                        // NETTOYER LES FONDS MUTUELS : Supprimer automatiquement les fonds mutuels existants
                        const cleaned: Record<string, AnalysisProfile> = {};
                        const removedMutualFunds: string[] = [];

                        for (const [symbol, profile] of Object.entries(parsed)) {
                            const companyName = (profile as AnalysisProfile)?.info?.name || '';
                            if (isMutualFund(symbol, companyName)) {
                                removedMutualFunds.push(symbol);
                            } else {
                                cleaned[symbol] = profile as AnalysisProfile;
                            }
                        }

                        if (removedMutualFunds.length > 0) {
                            console.log(` ${removedMutualFunds.length} fonds mutuel(s) supprime(s) automatiquement`);
                            //  Sauvegarder dans Supabase ET cache local
                            await saveProfiles(cleaned, true);
                        }

                        if (Object.keys(cleaned).length > 0) {
                            setLibrary(cleaned);
                            // Selectionner le premier ticker en ordre alphabetique
                            const sortedKeys = Object.keys(cleaned).sort((a, b) =>
                                (cleaned[a].info.preferredSymbol || a).localeCompare(cleaned[b].info.preferredSymbol || b)
                            );
                            setActiveId(sortedKeys[0]);
                        } else {
                            //  NOUVEAU : Cache vide ou obsolete -> Forcer chargement depuis Supabase
                            console.log(' Cache vide ou obsolete - Chargement depuis Supabase...');
                            setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                            setActiveId(DEFAULT_PROFILE.id);
                            // Marquer pour forcer le chargement depuis Supabase
                            hasLoadedTickersRef.current = false;
                            supabaseTickersCacheRef.current = null;
                        }
                    } else {
                        //  NOUVEAU : Aucun cache -> Forcer chargement depuis Supabase
                        console.log(' Aucun cache trouve - Chargement depuis Supabase...');
                        setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                        setActiveId(DEFAULT_PROFILE.id);
                        // Marquer pour forcer le chargement depuis Supabase
                        hasLoadedTickersRef.current = false;
                        supabaseTickersCacheRef.current = null;
                    }
                }
            } catch (e) {
                console.warn("Storage access failed", e);
                //  NOUVEAU : Erreur de cache -> Forcer chargement depuis Supabase
                console.log(' Erreur acces cache - Chargement depuis Supabase...');
                setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                setActiveId(DEFAULT_PROFILE.id);
                // Marquer pour forcer le chargement depuis Supabase
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null;
            }
            setIsInitialized(true);
        };
        
        loadFromStorage();
    }, []);

    // --- LOAD TICKERS FROM SUPABASE ON INITIALIZATION ---
    const [isLoadingTickers, setIsLoadingTickers] = useState(false);
    // Etats pour la progression du chargement Supabase
    const [supabaseProgress, setSupabaseProgress] = useState({
        current: 0,
        total: 0,
        startTime: null as number | null,
        message: ''
    });
    const [tickersLoadError, setTickersLoadError] = useState<string | null>(null);
    const hasLoadedTickersRef = useRef(false); // Flag pour eviter les chargements multiples
    const activeIdRef = useRef(activeId); // Ref pour acceder a activeId sans dependance
    const supabaseTickersCacheRef = useRef<{ data: any[]; timestamp: number } | null>(null); // Cache pour eviter les appels repetes
    const SUPABASE_CACHE_TTL = 60000; // Cache valide pendant 60 secondes
    const isLoadingProfileRef = useRef(false); // Flag pour eviter les sauvegardes pendant le chargement d'un profil

    // Mettre a jour la ref quand activeId change
    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    useEffect(() => {
        if (!isInitialized) return;
        
        // Eviter les chargements multiples
        if (hasLoadedTickersRef.current) {
            return;
        }

        //  Mise a jour automatique des prix a l'ouverture (remplace le cron continu)
        // NOTE: Desactive car l'endpoint /api/market-data-batch n'existe pas
        // Si necessaire, utiliser /api/marketdata/batch a la place
        const refreshPriceCacheIfNeeded = async () => {
            // Endpoint desactive - pas d'appel API inutile
            // Le cache sera mis a jour lors de la synchronisation normale
            return;
        };

        const loadTickersFromSupabase = async () => {
            // Eviter les chargements multiples simultanes
            if (isLoadingTickers) {
                console.log(' Chargement tickers deja en cours, ignore');
                return;
            }
            
            //  Stocker la fonction dans useRef pour utilisation dans useRealtimeSync
            loadTickersFromSupabaseRef.current = loadTickersFromSupabase;
            
            //  NE PAS marquer comme charge AVANT d'avoir reussi (pour permettre retry si echec)
            setIsLoadingTickers(true);
            setTickersLoadError(null);
            
            // Initialiser la progression
            setSupabaseProgress({
                current: 0,
                total: 0,
                startTime: Date.now(),
                message: 'Chargement de la liste des tickers...'
            });
            
            console.log(' Debut chargement tickers depuis Supabase...');

            try {
                const result = await loadAllTickersFromSupabase();

                if (!result.success) {
                    const errorMsg = result.error || 'Erreur lors du chargement des tickers';
                    console.error(' Echec chargement tickers:', errorMsg);
                    setTickersLoadError(errorMsg);
                    setIsLoadingTickers(false);
                    hasLoadedTickersRef.current = false; // Reessayer au prochain render
                    
                    //  Afficher notification d'erreur visible
                    showNotification(
                        ` Impossible de charger les tickers: ${errorMsg}\n\nVerifiez votre connexion et reessayez.`,
                        'error'
                    );
                    return;
                }
                
                //  Verifier qu'on a bien des tickers
                if (!result.tickers || result.tickers.length === 0) {
                    console.warn(' Aucun ticker retourne par l\'API');
                    setTickersLoadError('Aucun ticker trouve dans la base de donnees');
                    setIsLoadingTickers(false);
                    hasLoadedTickersRef.current = false;
                    
                    showNotification(
                        ' Aucun ticker trouve dans la base de donnees.\n\nVerifiez que des tickers sont actifs dans Supabase.',
                        'warning'
                    );
                    return;
                }
                
                console.log(` ${result.tickers.length} tickers charges depuis Supabase`);
                
                //  NETTOYAGE AUTOMATIQUE: Supprimer les profils obsoletes qui ne sont plus dans Supabase
                try {
                    const cleanupResult = await autoCleanupProfiles();
                    if (cleanupResult.removed > 0) {
                        console.log(` Nettoyage automatique: ${cleanupResult.removed} profils obsoletes supprimes de localStorage`);
                        // Recharger depuis localStorage apres nettoyage
                        const cleaned = await storage.getItem(STORAGE_KEY);
                        if (cleaned && typeof cleaned === 'object' && 'data' in cleaned) {
                            setLibrary(cleaned.data || {});
                        }
                    }
                } catch (cleanupError) {
                    console.warn(' Erreur lors du nettoyage automatique:', cleanupError);
                    // Ne pas bloquer le chargement si le nettoyage echoue
                }
                
                // Mettre a jour la progression pour le chargement des donnees
                const validTickers = result.tickers.filter(t => t.ticker && !isMutualFund(t.ticker, t.company_name));
                setSupabaseProgress({
                    current: 0,
                    total: validTickers.length,
                    startTime: Date.now(),
                    message: `Chargement des donnees pour ${validTickers.length} ticker(s)...`
                });
                
                //  Marquer comme charge seulement apres succes
                hasLoadedTickersRef.current = true;

                // Mettre a jour le cache pour handleSelectTicker
                supabaseTickersCacheRef.current = {
                    data: result.tickers,
                    timestamp: Date.now()
                };

                // Identifier les nouveaux tickers AVANT la mise a jour (utiliser setLibrary avec fonction)
                let newTickers: typeof result.tickers = [];

                //  MIGRATION : Creer un Map de source pour tous les tickers Supabase
                const sourceMap = new Map<string, 'team' | 'watchlist' | 'both' | 'manual'>();
                result.tickers.forEach(t => {
                    sourceMap.set(t.ticker.toUpperCase(), t.source);
                });

                // Merge intelligent : ne pas ecraser les profils existants
                setLibrary(prev => {
                    const existingSymbols = new Set(Object.keys(prev));
                    newTickers = result.tickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        // Exclure si deja dans library
                        if (existingSymbols.has(symbol)) {
                            //  FIX: Si c'est un profil squelette ou vide, on doit le recharger (le considerer comme nouveau)
                            const existingProfile = prev[symbol];
                            if (existingProfile._isSkeleton || !existingProfile.data || existingProfile.data.length === 0) {
                                // C'est un squelette/vide, on le garde dans newTickers pour declencher le chargement
                                console.log(` Reloading skeleton/empty profile: ${symbol}`);
                                return true;
                            }
                            // Sinon c'est un profil complet, on l'ignore
                            return false;
                        }
                        // Exclure les fonds mutuels
                        if (isMutualFund(symbol, t.company_name)) {
                            console.warn(` ${symbol}: Fonds mutuel detecte - exclu du chargement automatique`);
                            return false;
                        }
                        return true;
                    });
                    
                    //  DEBUG: Compter les team tickers dans newTickers vs deja dans library
                    const teamTickersInNew = newTickers.filter(t => t.source === 'team' || t.source === 'both');
                    const teamTickersAlreadyInLibrary = result.tickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return (t.source === 'team' || t.source === 'both') && existingSymbols.has(symbol);
                    });
                    
                    console.log(` Team tickers: ${teamTickersInNew.length} nouveaux a creer, ${teamTickersAlreadyInLibrary.length} deja dans library`);
                    if (teamTickersInNew.length > 0) {
                        console.log(`    Nouveaux:`, teamTickersInNew.map(t => t.ticker).join(', '));
                    }
                    if (teamTickersAlreadyInLibrary.length > 0) {
                        console.log(`    Deja dans library (seront mis a jour):`, teamTickersAlreadyInLibrary.map(t => t.ticker).join(', '));
                    }

                    const updated = { ...prev };
                    let newTickersCount = 0;
                    let migrationCount = 0;

                    //  MIGRATION : Corriger TOUS les profils existants qui ne sont pas dans Supabase
                    // Si un profil existe dans localStorage mais pas dans Supabase, le marquer comme 'manual' (null)
                    Object.keys(updated).forEach(symbol => {
                        if (!sourceMap.has(symbol)) {
                            // Ticker existe localement mais pas dans Supabase -> Normal (pas d'icone)
                            if (updated[symbol].isWatchlist !== null && updated[symbol].isWatchlist !== undefined) {
                                updated[symbol] = {
                                    ...updated[symbol],
                                    isWatchlist: null // Tickers normaux (hors Supabase)
                                };
                                migrationCount++;
                            }
                        }
                    });

                    result.tickers.forEach(supabaseTicker => {
                        const tickerSymbol = supabaseTicker.ticker.toUpperCase();
                        
                        // Si le profil existe deja, mettre a jour les metriques ValueLine depuis Supabase
                        if (updated[tickerSymbol]) {
                            //  MIGRATION FORCEE : Toujours mettre a jour isWatchlist depuis Supabase
                            // Les profils existants peuvent avoir un ancien isWatchlist incorrect
                            const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                            
                            // Mettre a jour les metriques ValueLine depuis Supabase (si elles existent)
                            const hasValueLineUpdates = supabaseTicker.security_rank || 
                                                       supabaseTicker.earnings_predictability || 
                                                       supabaseTicker.price_growth_persistence || 
                                                       supabaseTicker.price_stability;
                            
                            //  FORCER la mise a jour de isWatchlist meme si identique (migration)
                            // Cela corrige les profils existants qui ont un ancien etat incorrect
                            const needsUpdate = updated[tickerSymbol].isWatchlist !== shouldBeWatchlist || hasValueLineUpdates;
                            const isTeamTicker = supabaseTicker.source === 'team' || supabaseTicker.source === 'both';
                            
                            //  DEBUG: Log pour les team tickers existants
                            if (isTeamTicker && needsUpdate) {
                                console.log(`    Mise a jour team ticker existant: ${tickerSymbol} (isWatchlist: ${updated[tickerSymbol].isWatchlist} -> ${shouldBeWatchlist})`);
                            }
                            
                            if (needsUpdate) {
                                updated[tickerSymbol] = {
                                    ...updated[tickerSymbol],
                                    isWatchlist: shouldBeWatchlist, //  FORCER mise a jour depuis Supabase
                                    //  MULTI-UTILISATEUR : Supabase est la source de verite pour les metriques ValueLine
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
                                migrationCount++;
                                
                                // Si c'est le profil actif, mettre a jour aussi le state local
                                if (tickerSymbol === activeIdRef.current) {
                                    setInfo(updated[tickerSymbol].info);
                                    setIsWatchlist(shouldBeWatchlist ?? false);
                                }
                            } else if (updated[tickerSymbol].isWatchlist !== shouldBeWatchlist) {
                                //  Meme si pas d'autres updates, forcer isWatchlist pour migration
                                updated[tickerSymbol] = {
                                    ...updated[tickerSymbol],
                                    isWatchlist: shouldBeWatchlist
                                };
                                migrationCount++;
                                
                                // Si c'est le profil actif, mettre a jour aussi le state local
                                if (tickerSymbol === activeIdRef.current) {
                                    setIsWatchlist(shouldBeWatchlist ?? false);
                                }
                            }
                            return;
                        }

                        //  NOUVEAU : Creer un profil squelette IMMEDIATEMENT pour affichage
                        // Meme si le profil n'existe pas encore, on le cree avec les infos de base depuis Supabase
                        const isWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                        const isTeamTicker = supabaseTicker.source === 'team' || supabaseTicker.source === 'both';
                        
                        //  CRITIQUE : Ne pas utiliser INITIAL_ASSUMPTIONS (valeurs a 0) pour les squelettes
                        // Creer un objet assumptions minimal avec seulement les champs requis, sans valeurs inventees
                        updated[tickerSymbol] = {
                            id: tickerSymbol,
                            lastModified: Date.now(),
                            data: [], // Donnees vides pour l'instant
                            assumptions: {
                                //  Seulement les champs requis, pas de valeurs inventees (0)
                                currentPrice: 0, // Sera mis a jour lors du chargement FMP
                                currentDividend: 0,
                                baseYear: new Date().getFullYear(),
                                requiredReturn: 10.0, // Valeur par defaut raisonnable
                                //  Tous les autres champs sont undefined (pas 0) pour eviter les valeurs inventees
                                growthRateEPS: undefined,
                                growthRateSales: undefined,
                                growthRateCF: undefined,
                                growthRateBV: undefined,
                                growthRateDiv: undefined,
                                targetPE: undefined,
                                targetPCF: undefined,
                                targetPBV: undefined,
                                targetYield: undefined,
                                dividendPayoutRatio: undefined,
                                excludeEPS: false,
                                excludeCF: false,
                                excludeBV: false,
                                excludeDIV: false
                            } as Assumptions,
                            info: {
                                symbol: tickerSymbol,
                                name: supabaseTicker.company_name || tickerSymbol,
                                sector: supabaseTicker.sector || '',
                                securityRank: supabaseTicker.security_rank || 'N/A',
                                marketCap: 'N/A',
                                earningsPredictability: supabaseTicker.earnings_predictability,
                                priceGrowthPersistence: supabaseTicker.price_growth_persistence,
                                priceStability: supabaseTicker.price_stability,
                                beta: supabaseTicker.beta,
                                preferredSymbol: supabaseTicker.ticker
                            },
                            notes: '',
                            isWatchlist,
                            _isSkeleton: true // Flag pour indiquer que c'est un profil incomplet
                        };
                        
                        //  DEBUG: Log pour les team tickers crees
                        if (isTeamTicker) {
                            console.log(`    Creation profil squelette team ticker: ${tickerSymbol} (source: ${supabaseTicker.source}, isWatchlist: ${isWatchlist})`);
                        }
                        
                        newTickersCount++;
                    });

                    //  Sauvegarder UNIQUEMENT dans cache local (PAS Supabase - migration locale)
                    //  NE PAS sauvegarder dans Supabase lors de migration - donnees deja presentes
                    saveProfiles(updated, false).catch(e => console.warn('Failed to save profiles:', e));

                    if (newTickersCount > 0) {
                        console.log(` ${newTickersCount} nouveaux profils squelettes crees depuis Supabase`);
                        console.log(` Library apres migration: ${Object.keys(updated).length} profils (dont ${Object.keys(updated).filter(k => k !== DEFAULT_PROFILE.id).length} reels)`);
                    } else {
                        console.log(`i Aucun nouveau ticker - ${Object.keys(updated).length} profils deja dans library`);
                    }

                    //  DEBUG: Compter les profils avec isWatchlist=false apres migration
                    const portfolioCount = Object.values(updated).filter((p: any) => p.isWatchlist === false).length;
                    const watchlistCount = Object.values(updated).filter((p: any) => p.isWatchlist === true).length;
                    const normalCount = Object.values(updated).filter((p: any) => p.isWatchlist === null || p.isWatchlist === undefined).length;
                    
                    //  DEBUG: Identifier les team tickers manquants (apres creation profils squelettes)
                    const teamTickersInSupabaseAfter = result.tickers.filter(t => {
                        const source = t.source;
                        return source === 'team' || source === 'both';
                    });
                    const teamTickersInLibraryAfter = Object.values(updated).filter((p: any) => {
                        const symbol = p.id.toUpperCase();
                        return teamTickersInSupabaseAfter.some(t => t.ticker.toUpperCase() === symbol) && p.isWatchlist === false;
                    });
                    const missingTeamTickersAfter = teamTickersInSupabaseAfter.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return !updated[symbol] || updated[symbol].isWatchlist !== false;
                    });
                    
                    if (migrationCount > 0) {
                        console.log(` Migration: ${migrationCount} profil(s) mis a jour avec isWatchlist depuis Supabase`);
                    }
                    
                    if (teamTickersInSupabaseAfter.length !== teamTickersInLibraryAfter.length) {
                        console.warn(` ${teamTickersInSupabaseAfter.length} team tickers dans Supabase, mais seulement ${teamTickersInLibraryAfter.length} avec  dans library`);
                        if (missingTeamTickersAfter.length > 0) {
                            console.warn(`    ${missingTeamTickersAfter.length} team ticker(s) manquant(s) ou incorrect(s):`, missingTeamTickersAfter.map(t => `${t.ticker} (source: ${t.source})`).join(', '));
                        }
                    } else {
                        console.log(` Tous les ${teamTickersInSupabaseAfter.length} team tickers ont  (isWatchlist=false)`);
                    }
                    
                    console.log(` Apres migration - Portefeuille (): ${portfolioCount}, Watchlist (): ${watchlistCount}, Normaux: ${normalCount}, Total: ${Object.keys(updated).length}`);
                    
                    //  VERIFICATION: S'assurer que tous les team tickers ont isWatchlist=false
                    const teamTickersInSupabase = result.tickers.filter(t => {
                        const mapped = mapSourceToIsWatchlist(t.source);
                        return mapped === false; // Portefeuille
                    });
                    const teamTickersInLibrary = teamTickersInSupabase.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return updated[symbol] && updated[symbol].isWatchlist === false;
                    });
                    
                    // Separer les tickers manquants (pas dans localStorage) des incorrects (isWatchlist !== false)
                    const missingTickers = teamTickersInSupabase.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return !updated[symbol];
                    });
                    const incorrectTickers = teamTickersInSupabase.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return updated[symbol] && updated[symbol].isWatchlist !== false;
                    });
                    
                    if (teamTickersInSupabase.length !== teamTickersInLibrary.length) {
                        console.warn(` ${teamTickersInSupabase.length - teamTickersInLibrary.length} team ticker(s) manquant(s) ou incorrect(s) sur ${teamTickersInSupabase.length} attendus:`);
                        if (missingTickers.length > 0) {
                            console.warn(`    ${missingTickers.length} ticker(s) non charge(s) depuis FMP:`, missingTickers.map(t => t.ticker).join(', '));
                        }
                        if (incorrectTickers.length > 0) {
                            console.warn(`    ${incorrectTickers.length} ticker(s) avec isWatchlist incorrect:`, incorrectTickers.map(t => t.ticker).join(', '));
                        }
                        console.log(`    ${teamTickersInLibrary.length} ticker(s) correctement configure(s) dans localStorage`);
                    } else {
                        console.log(` Tous les ${teamTickersInSupabase.length} team tickers ont isWatchlist=false`);
                    }

                    return updated;
                });

                //  FIX: Apres migration, charger les donnees pour les profils squelettes
                // Utiliser setTimeout pour attendre que setLibrary soit termine
                setTimeout(async () => {
                    // Verifier le state actuel pour trouver les squelettes
                    setLibrary(currentLib => {
                        const skeletonTickers = Object.entries(currentLib)
                            .filter(([symbol, profile]) => {
                                if (symbol === DEFAULT_PROFILE.id) return false;
                                const p = profile as any;
                                return p._isSkeleton === true;
                            })
                            .map(([symbol]) => symbol);

                        if (skeletonTickers.length > 0) {
                            console.log(` Trouve ${skeletonTickers.length} squelettes a charger apres migration`);

                            // Creer la liste de tickers a partir de result.tickers
                            const tickersToLoad = result.tickers.filter(t => {
                                const symbol = t.ticker.toUpperCase();
                                return skeletonTickers.includes(symbol) && !isMutualFund(symbol, t.company_name);
                            });

                            if (tickersToLoad.length > 0) {
                                console.log(` Demarrage du chargement pour ${tickersToLoad.length} squelettes`);

                                // Charger en petits batches pour eviter les 500 errors
                                const loadSkeletonsInBackground = async () => {
                                    const batchSize = 10; // Petit batch pour eviter surcharge
                                    const delayBetweenBatches = 1000; // 1 seconde entre batches

                                    for (let i = 0; i < tickersToLoad.length; i += batchSize) {
                                        const batch = tickersToLoad.slice(i, i + batchSize);
                                        const batchNum = Math.floor(i / batchSize) + 1;
                                        const totalBatches = Math.ceil(tickersToLoad.length / batchSize);

                                        console.log(` Chargement squelettes batch ${batchNum}/${totalBatches}...`);

                                        // Charger depuis Supabase d'abord
                                        const tickerSymbols = batch.map(t => t.ticker.toUpperCase());
                                        const supabaseResults = await loadProfilesBatchFromSupabase(tickerSymbols);

                                        // Mettre a jour les profils avec les donnees Supabase ou FMP
                                        for (const supabaseTicker of batch) {
                                            const symbol = supabaseTicker.ticker.toUpperCase();
                                            const supabaseResult = supabaseResults[symbol];

                                            if (supabaseResult && supabaseResult.data && supabaseResult.data.length > 0) {
                                                // Donnees trouvees dans Supabase
                                                setLibrary(prev => ({
                                                    ...prev,
                                                    [symbol]: {
                                                        ...prev[symbol],
                                                        ...supabaseResult,
                                                        _isSkeleton: false
                                                    }
                                                }));
                                            } else {
                                                // Pas de donnees Supabase - charger depuis FMP
                                                try {
                                                    const fmpResult = await fetchCompanyData(symbol);
                                                    if (fmpResult && fmpResult.data && fmpResult.data.length > 0) {
                                                        setLibrary(prev => ({
                                                            ...prev,
                                                            [symbol]: {
                                                                ...prev[symbol],
                                                                data: fmpResult.data,
                                                                assumptions: {
                                                                    ...prev[symbol]?.assumptions,
                                                                    currentPrice: fmpResult.currentPrice || 0,
                                                                    currentDividend: fmpResult.currentDividend || 0
                                                                },
                                                                info: {
                                                                    ...prev[symbol]?.info,
                                                                    ...fmpResult.info
                                                                },
                                                                _isSkeleton: false
                                                            }
                                                        }));
                                                    }
                                                } catch (e) {
                                                    console.warn(` FMP fetch failed for ${symbol}:`, e);
                                                }
                                            }
                                        }

                                        // Delai entre batches
                                        if (i + batchSize < tickersToLoad.length) {
                                            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                                        }
                                    }

                                    console.log(` Chargement squelettes termine`);
                                };

                                // Lancer le chargement en arriere-plan
                                loadSkeletonsInBackground().catch(e => console.error('Erreur chargement squelettes:', e));
                            }
                        }

                        return currentLib; // Ne pas modifier le state
                    });
                }, 500); // Delai pour s'assurer que setLibrary est termine

                //  OPTIMISATION PERFORMANCE : Creer des profils "squelettes" immediatement
                // pour affichage instantane, puis charger les donnees FMP en arriere-plan
                if (newTickers.length > 0) {
                    // Filtrer les fonds mutuels AVANT tout appel API
                    const validTickers = newTickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        if (isMutualFund(symbol, t.company_name)) {
                            console.warn(` ${symbol}: Fonds mutuel detecte - profil NON cree (exclu automatiquement)`);
                            return false;
                        }
                        return true;
                    });

                    if (validTickers.length === 0) {
                        console.log(' Aucun ticker valide apres filtrage des fonds mutuels');
                        setIsLoadingTickers(false); //  Liberer le loading immediatement
                        return;
                    }

                    //  ETAPE 1 : Creer des profils "squelettes" immediatement pour affichage instantane
                    const skeletonProfiles: Record<string, AnalysisProfile> = {};
                    validTickers.forEach(supabaseTicker => {
                        const symbol = supabaseTicker.ticker.toUpperCase();
                        const isWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                        
                        //  CRITIQUE : Ne pas utiliser INITIAL_ASSUMPTIONS (valeurs a 0) pour les squelettes
                        skeletonProfiles[symbol] = {
                            id: symbol,
                            lastModified: Date.now(),
                            data: [], // Donnees vides pour l'instant
                            assumptions: {
                                //  Seulement les champs requis, pas de valeurs inventees (0)
                                currentPrice: 0,
                                currentDividend: 0,
                                baseYear: new Date().getFullYear(),
                                requiredReturn: 10.0,
                                //  Tous les autres champs sont undefined (pas 0) pour eviter les valeurs inventees
                                growthRateEPS: undefined,
                                growthRateSales: undefined,
                                growthRateCF: undefined,
                                growthRateBV: undefined,
                                growthRateDiv: undefined,
                                targetPE: undefined,
                                targetPCF: undefined,
                                targetPBV: undefined,
                                targetYield: undefined,
                                dividendPayoutRatio: undefined,
                                excludeEPS: false,
                                excludeCF: false,
                                excludeBV: false,
                                excludeDIV: false
                            } as Assumptions,
                            info: {
                                symbol: symbol,
                                name: supabaseTicker.company_name || symbol,
                                sector: supabaseTicker.sector || '',
                                securityRank: supabaseTicker.security_rank || 'N/A',
                                marketCap: 'N/A',
                                earningsPredictability: supabaseTicker.earnings_predictability,
                                priceGrowthPersistence: supabaseTicker.price_growth_persistence,
                                priceStability: supabaseTicker.price_stability,
                                beta: supabaseTicker.beta,
                                preferredSymbol: supabaseTicker.ticker
                            },
                            notes: '',
                            isWatchlist,
                            _isSkeleton: true // Flag pour indiquer que c'est un profil incomplet
                        };
                    });

                    // Ajouter les profils squelettes immediatement pour affichage
                    setLibrary(prev => {
                        const updated = { ...prev, ...skeletonProfiles };
                        console.log(` ${Object.keys(skeletonProfiles).length} profils squelettes ajoutes a library (total: ${Object.keys(updated).length})`);
                        //  Sauvegarder UNIQUEMENT dans cache local (PAS Supabase - squelettes temporaires!)
                        //  NE PAS sauvegarder squelettes dans Supabase - donnees incompletes
                    saveProfiles(updated, false).catch(e => console.warn('Failed to save profiles:', e));
                        return updated;
                    });

                    //  Liberer le loading immediatement pour afficher la liste
                    setIsLoadingTickers(false);
                    console.log(` ${validTickers.length} profils squelettes crees - affichage immediat`);


                    //  ETAPE 2 : Charger les donnees depuis Supabase d'abord, puis FMP si necessaire
                    // Utiliser requestIdleCallback pour ne pas bloquer l'UI
                    const loadFMPDataInBackground = async () => {
                        //  OPTIMISATION MASSIVE : Supabase est rapide, on peut charger de gros batchs
                        const batchSize = 50; // Increased to 50 for faster loading (Supabase handles this easily)
                        const delayBetweenBatches = 200; // Reduced delay to 200ms

                        console.log(` Demarrage du chargement optimise pour ${validTickers.length} tickers (Batch: ${batchSize})`);

                        let processedCount = 0;
                        for (let i = 0; i < validTickers.length; i += batchSize) {
                            const batch = validTickers.slice(i, i + batchSize);
                            
                            // Petit delai entre batches pour ne pas surcharger le navigateur (pas le serveur)
                            if (i > 0) {
                                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                            }

                            //  OPTIMISATION : Charger depuis Supabase en batch
                            const tickerSymbols = batch.map(t => t.ticker.toUpperCase());
                            const batchNumber = Math.floor(i/batchSize) + 1;
                            const totalBatches = Math.ceil(validTickers.length/batchSize);
                            console.log(` Chargement batch ${batchNumber}/${totalBatches}: ${tickerSymbols.length} tickers...`);
                            
                            // Mettre a jour la progression
                            setSupabaseProgress(prev => ({
                                ...prev,
                                message: `Chargement batch ${batchNumber}/${totalBatches}...`
                            }));
                            
                            const supabaseResults = await loadProfilesBatchFromSupabase(tickerSymbols);

                            // Traiter chaque resultat
                            await Promise.allSettled(

                                batch.map(async (supabaseTicker) => {
                                    if (!supabaseTicker.ticker) return; //  Guard clause: Skip invalid tickers
                                    
                                    const symbol = supabaseTicker.ticker.toUpperCase();
                                    if (!symbol || symbol.trim() === '') return; //  Double check
                                    
                                    const markAsInvalid = (reason: string) => {
                                        console.warn(` ${symbol}: ${reason} - Marking as invalid/loaded`);
                                        setLibrary(prev => ({
                                            ...prev,
                                            [symbol]: {
                                                ...prev[symbol],
                                                _isSkeleton: false,
                                                data: [],
                                                info: {
                                                    symbol,
                                                    name: prev[symbol]?.info?.name || symbol,
                                                    sector: '',
                                                    financials: { currency: 'USD' }, // minimal stub
                                                    analysisData: {}
                                                } as any
                                            }
                                        }));
                                    };

                                    const supabaseResult = supabaseResults[symbol];
                                    
                                    try {
                                        let result: any;
                                        
                                        //  LOGIQUE SIMPLIFIEE : Utiliser Supabase si disponible
                                        //  NE PAS appeler FMP ici - c'est ce qui causait les 429 et la lenteur
                                        if (supabaseResult && supabaseResult.source === 'supabase' && 
                                            supabaseResult.data && supabaseResult.data.length > 0) {
                                            //  CAS 1 : Snapshot Supabase existe -> Utiliser directement
                                            result = supabaseResult;
                                            // Log silencieux pour ne pas spammer la console
                                        } else {
                                            //  CAS 2 : Pas de snapshot -> Marquer comme N/A (sync manuelle requise)
                                            // NE PAS appeler FMP ici - l'utilisateur peut sync manuellement
                                            markAsInvalid('Pas de snapshot Supabase - sync requise');
                                            return;
                                        }
                                        
                                        //  Utiliser directement les donnees Supabase
                                        result = {
                                            data: supabaseResult.data,
                                            info: supabaseResult.info || {},
                                            currentPrice: supabaseResult.currentPrice || 0,
                                            assumptions: supabaseResult.assumptions,
                                            source: 'supabase' as const
                                        };
                                        
                                        // VALIDATION : Verifier que les donnees sont valides
                                        if (!result.data || result.data.length === 0) {
                                            markAsInvalid('Donnees vides apres chargement');
                                            return;
                                        }
                                        
                                        if (!result.currentPrice || result.currentPrice <= 0) {
                                            markAsInvalid(`Prix invalide: ${result.currentPrice}`);
                                            return;
                                        }
                                        
                                        // Verifier qu'on a au moins une annee avec des donnees valides
                                        const hasValidData = result.data.some((d: any) => 
                                            d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
                                        );
                                        
                                        if (!hasValidData) {
                                            markAsInvalid('Aucune annee avec donnees suffisantes (EPS/CF/BV > 0)');
                                            return;
                                        }
                                    
                                    //  TOUTES LES VALIDATIONS PASSEES - Creer le profil avec les donnees
                                    const isWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                                    
                                    // Si les assumptions viennent de Supabase, les utiliser, sinon auto-fill
                                    let baseAssumptions: Assumptions;
                                    if (result.assumptions && result.source === 'supabase') {
                                        baseAssumptions = {
                                            ...INITIAL_ASSUMPTIONS,
                                            ...result.assumptions,
                                            currentPrice: result.currentPrice
                                        };
                                    } else {
                                        baseAssumptions = autoFillAssumptionsFromFMPData(
                                            result.data,
                                            result.currentPrice,
                                            INITIAL_ASSUMPTIONS,
                                            result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
                                        ) as Assumptions;
                                    }
                                    
                                    // Detecter et exclure automatiquement les metriques avec prix cibles aberrants
                                    const outlierDetection = detectOutlierMetrics(result.data, baseAssumptions);
                                    
                                    if (outlierDetection.detectedOutliers.length > 0) {
                                        console.log(` ${symbol}: Metriques aberrantes auto-exclues: ${outlierDetection.detectedOutliers.join(', ')}`);
                                    }
                                    
                                    // Appliquer les exclusions detectees
                                    const finalAssumptions = {
                                        ...baseAssumptions,
                                        excludeEPS: outlierDetection.excludeEPS,
                                        excludeCF: outlierDetection.excludeCF,
                                        excludeBV: outlierDetection.excludeBV,
                                        excludeDIV: outlierDetection.excludeDIV
                                    };
                                    
                                    const newProfile: AnalysisProfile = {
                                        id: symbol,
                                        lastModified: Date.now(),
                                        data: result.data,
                                        assumptions: finalAssumptions,
                                        info: {
                                            symbol: symbol,
                                            name: result.info.name || supabaseTicker.company_name || symbol,
                                            sector: result.info.sector || supabaseTicker.sector || '',
                                            securityRank: supabaseTicker.security_rank || 'N/A',
                                            marketCap: result.info.marketCap || 'N/A',
                                            ...result.info,
                                            financials: result.financials,
                                            analysisData: result.analysisData,
                                            earningsPredictability: supabaseTicker.earnings_predictability,
                                            priceGrowthPersistence: supabaseTicker.price_growth_persistence,
                                            priceStability: supabaseTicker.price_stability,
                                            beta: result.info.beta || supabaseTicker.beta,
                                            preferredSymbol: supabaseTicker.ticker
                                        },
                                        notes: '',
                                        isWatchlist
                                    };
                                    
                                    //  Mettre a jour le profil
                                    setLibrary(prev => {
                                        if (!prev[symbol]) return prev;
                                        const updated = {
                                            ...prev,
                                            [symbol]: {
                                                ...newProfile,
                                                _isSkeleton: false
                                            }
                                        };
                                        //  NOUVEAU : Sauvegarder UNIQUEMENT dans cache local (PAS Supabase - donnees deja la!)
                                        //  NE PAS sauvegarder dans Supabase lors du chargement - evite boucle circulaire
                    saveProfiles(updated, false).catch(e => console.warn('Failed to save profiles:', e));
                                        return updated;
                                    });

                                    console.log(` ${symbol}: Profil mis a jour depuis ${result.source === 'supabase' ? 'Supabase' : 'FMP'}`);
                                    
                                    // Mettre a jour la progression
                                    processedCount++;
                                    setSupabaseProgress(prev => ({
                                        ...prev,
                                        current: processedCount,
                                        message: `Chargement ${processedCount}/${prev.total} ticker(s)...`
                                    }));
                                } catch (error) {
                                    console.error(` ${symbol}: Erreur chargement donnees:`, error);
                                    
                                    // Mettre a jour la progression meme en cas d'erreur
                                    processedCount++;
                                    setSupabaseProgress(prev => ({
                                        ...prev,
                                        current: processedCount
                                    }));
                                }
                            })
                        );
                        }
                        
                        // Finaliser la progression
                        setSupabaseProgress(prev => ({
                            ...prev,
                            current: prev.total,
                            message: 'Chargement termine'
                        }));
                        
                        // Masquer la progression apres 2 secondes
                        setTimeout(() => {
                            setSupabaseProgress({
                                current: 0,
                                total: 0,
                                startTime: null,
                                message: ''
                            });
                        }, 2000);
                    };

                    //  FIX: Appeler directement avec un petit delai pour laisser l'UI se mettre a jour
                    // requestIdleCallback ne fonctionne pas correctement avec les re-renders React
                    setTimeout(() => {
                        console.log(' Demarrage du chargement de donnees apres delai...');
                        loadFMPDataInBackground();
                    }, 500);
                } else {
                    // Aucun nouveau ticker - liberer le loading
                    setIsLoadingTickers(false);
                    setSupabaseProgress({
                        current: 0,
                        total: 0,
                        startTime: null,
                        message: ''
                    });
                }

            } catch (error: any) {
                console.error(' Erreur lors du chargement des tickers:', error);
                setTickersLoadError(error.message || 'Erreur inconnue');
                hasLoadedTickersRef.current = false; // Reessayer au prochain render
                setSupabaseProgress({
                    current: 0,
                    total: 0,
                    startTime: null,
                    message: ''
                });
            } finally {
                setIsLoadingTickers(false);
            }
        };

        //  Verifier et mettre a jour le cache prix en parallele (non-bloquant)
        refreshPriceCacheIfNeeded();
        
        // Charger les tickers
        loadTickersFromSupabase();

        //  Synchronisation periodique avec Supabase (toutes les 2 minutes)
        // Pour s'assurer que tous les utilisateurs voient les memes tickers
        const syncIntervalId = setInterval(() => {
            if (!isLoadingTickers && hasLoadedTickersRef.current) {
                console.log(' Synchronisation periodique avec Supabase pour coherence multi-utilisateurs...');
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null; // Invalider le cache
                loadTickersFromSupabase();
            }
        }, 120000); // 2 minutes

        //  Mise a jour automatique du cache prix toutes les 5 minutes pendant la session
        const intervalId = setInterval(() => {
            refreshPriceCacheIfNeeded();
        }, 5 * 60 * 1000); // 5 minutes

        // Nettoyer l'interval quand le composant est demonte ou la page est fermee
        return () => {
            clearInterval(intervalId);
            clearInterval(syncIntervalId);
        };
    }, [isInitialized]); // Seulement apres l'initialisation - pas de dependance a library pour eviter la boucle

    // --- ACTIVE SESSION STATE ---
    const [data, setData] = useState<AnnualData[]>(INITIAL_DATA);
    const [assumptions, _setAssumptionsRaw] = useState<Assumptions>(INITIAL_ASSUMPTIONS);
    const [info, setInfo] = useState<CompanyInfo>(INITIAL_INFO);
    const [notes, setNotes] = useState<string>('');
    const [isWatchlist, setIsWatchlist] = useState<boolean>(false);

    //  WRAPPER SIMPLE : Sanitis automatiquement toutes les mises a jour d'assumptions
    // Plus besoin de sanitis manuellement partout dans le code !
    const setAssumptions = (value: Assumptions | ((prev: Assumptions) => Assumptions)) => {
        if (typeof value === 'function') {
            _setAssumptionsRaw(prev => sanitizeAssumptionsSync(value(prev)));
        } else {
            _setAssumptionsRaw(sanitizeAssumptionsSync(value));
        }
    };

    // Load Active Profile when ID changes
    useEffect(() => {
        if (!isInitialized) return;
        const profile = library[activeId];
        if (profile) {
            // Marquer comme en cours de chargement pour eviter les sauvegardes inutiles
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
            
            // Reinitialiser le flag apres un court delai pour permettre les sauvegardes futures
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isLoadingProfileRef.current = false;
                });
            });
        } else {
            //  Profil non trouve dans la library - peut-etre un nouveau ticker ou chargement initial
            // Si c'est un profil squelette ou manquant, on tente de forcer le chargement
            // Afficher un avertissement si ce n'est pas le profil initial (ACN) ou si on vient de delete
            //  Verifier le ticker par defaut depuis Supabase (pas de hardcoding)
            (async () => {
                const { getConfigValue } = await import('./services/appConfigApi');
                const defaultTicker = await getConfigValue('default_ticker');
                if (activeId !== defaultTicker && activeId !== '') {
                    // Ne pas afficher d'erreur tout de suite, cela peut etre transitoire
                }
            })();
        }
        
        //  PRIORITE CRITIQUE : Si le profil actif est un squelette (vide), le charger IMMEDIATEMENT
        // Ne pas attendre le chargement en arriere-plan (trop lent)
        if (activeId && profile && (profile._isSkeleton || !profile.data || profile.data.length === 0)) {
            console.log(` Chargement PRIORITAIRE pour le profil actif: ${activeId}`);
            // Appeler performSync pour charger les donnees immediatement
            // Utiliser un timeout pour ne pas bloquer le rendu actuel
            const timeoutId = setTimeout(() => {
                // Verifier si toujours actif et vide
                const currentProfile = library[activeId];
                if (currentProfile && (currentProfile._isSkeleton || !currentProfile.data || currentProfile.data.length === 0)) {
                     performSync(false).catch(console.error);
                }
            }, 50); // Petit delai pour laisser l'interface s'afficher
            return () => clearTimeout(timeoutId);
        }
    }, [activeId, isInitialized, library]);

    // Afficher le demo si aucun ticker n'est selectionne ou si les donnees ne sont pas chargees
    //  IMPORTANT: Ce useEffect doit etre AVANT TOUS les early returns pour respecter les Rules of Hooks
    useEffect(() => {
        if (!isInitialized) return; // Skip si pas encore initialise
        if (showLanding) return; // Skip si on est sur la landing page
        if (showDemo) return; // Skip si le demo est deja affiche
        
        //  Verifier si l'utilisateur a deja ferme le demo manuellement
        const hasClosedDemo = localStorage.getItem('3p1-has-closed-demo');
        if (hasClosedDemo === 'true') {
            return; // Ne pas reafficher si l'utilisateur l'a ferme
        }
        
        const currentProfile = library[activeId] || DEFAULT_PROFILE;
        const currentProfileName = currentProfile.info.name;
        if (!activeId || currentProfileName === 'Chargement...') {
            // Attendre un peu pour que l'interface se charge
            const timer = setTimeout(() => {
                setShowDemo(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isInitialized, showLanding, activeId, showDemo]); //  Retirer 'library' des dependances pour eviter la boucle infinie

    // Save to Library when Active State Changes (optimise avec requestIdleCallback)
    useEffect(() => {
        if (!isInitialized) return;
        
        // Ne pas sauvegarder si on est en train de charger un profil
        if (isLoadingProfileRef.current) {
            return;
        }

        // Utiliser requestIdleCallback si disponible, sinon setTimeout avec delai plus court
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
                // Sauvegarder de maniere asynchrone pour ne pas bloquer le thread principal
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(async () => {
                        try {
                            //  Sauvegarder dans Supabase ET cache local
                            await saveProfiles(updated, true);
                        } catch (e) {
                            console.warn('Failed to save to Storage:', e);
                        }
                    }, { timeout: 1000 });
                } else {
                    // Fallback pour navigateurs sans requestIdleCallback
                    setTimeout(async () => {
                        try {
                            //  Sauvegarder dans Supabase ET cache local
                            await saveProfiles(updated, true);
                        } catch (e) {
                            console.warn('Failed to save to Storage:', e);
                        }
                    }, 0);
                }
                return updated;
            });
        };

        const timer = setTimeout(saveToStorage, 300); // Reduit de 500ms a 300ms

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
        // Ouvrir le dialogue avance au lieu du dialogue simple
        setIsAdvancedSyncForBulk(false);
        setShowAdvancedSyncDialog(true);
    };

    const performSync = async (saveCurrentVersion: boolean, syncOptions?: SyncOptions) => {
        setIsLoading(true);
        try {
            // Save current version if requested AND we have valid data
            if (saveCurrentVersion) {
                // Strict validation to prevent 400 errors from API
                const hasValidData = data && data.length > 0;
                const hasValidInfo = info && info.symbol && info.name;
                const hasValidAssumptions = assumptions && typeof assumptions === 'object';

                if (hasValidData && hasValidInfo && hasValidAssumptions) {
                    console.log(' Saving current version before sync...');
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
                        console.warn('Backup save warning:', saveResult.error);
                        // Non-blocking error
                    }
                } else {
                    console.log(' Skipping backup save: Incomplete data state', { hasValidData, hasValidInfo, hasValidAssumptions });
                }
            }

            // Fetch new data from API
            const result = await fetchCompanyData(activeId);

            // Keep existing history for Undo
            setPastData(prev => [...prev, data]);
            setFutureData([]);

            //  CRITIQUE : Declarer mergedData en dehors du if pour qu'il soit accessible partout
            let mergedData: AnnualData[] = data.length > 0 ? [...data] : [];

            // Update Data avec merge intelligent : preserver les donnees manuelles (sauf si forceReplace)
            if (result.data.length > 0 && syncOptions?.syncData) {
                // Merge intelligent : preserver les donnees manuelles (comme dans handleBulkSyncAllTickers)
                const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                
                // Si syncOnlyNewYears, ne traiter que les nouvelles annees
                if (syncOptions?.syncOnlyNewYears) {
                    result.data.forEach(newRow => {
                        const exists = mergedData.some(row => row.year === newRow.year);
                        if (!exists) {
                            mergedData.push({
                                ...newRow,
                                autoFetched: true,
                                dataSource: 'fmp-verified' as const //  Nouvelle annee directement de FMP = verifiee
                            });
                        }
                    });
                } else {
                    // Traitement normal : mettre a jour toutes les annees
                    mergedData = data.map((existingRow) => {
                        const newRow = newDataByYear.get(existingRow.year);
                        
                        // Si pas de nouvelle donnee pour cette annee, garder l'existant
                        if (!newRow) {
                            return existingRow;
                        }

                        // Si forceReplace est true, remplacer toutes les donnees (donnees FMP verifiees)
                        if (syncOptions?.forceReplace) {
                            return {
                                ...(newRow as AnnualData),
                                autoFetched: true,
                                dataSource: 'fmp-verified' as const //  Force replace = donnees FMP verifiees
                            };
                        }

                        // Si syncOnlyMissingMetrics, ne remplir que les champs vides (donnees ajustees)
                        if (syncOptions?.syncOnlyMissingMetrics) {
                            const updatedRow = { ...existingRow };
                            const typedNewRow = newRow as AnnualData;
                            let hasAdjustment = false;
                            // Mettre a jour uniquement les champs qui sont 0, null ou undefined
                            if ((existingRow.earningsPerShare === 0 || existingRow.earningsPerShare === null || existingRow.earningsPerShare === undefined) && typedNewRow.earningsPerShare > 0) {
                                updatedRow.earningsPerShare = typedNewRow.earningsPerShare;
                                hasAdjustment = true;
                            }
                            if ((existingRow.cashFlowPerShare === 0 || existingRow.cashFlowPerShare === null || existingRow.cashFlowPerShare === undefined) && typedNewRow.cashFlowPerShare > 0) {
                                updatedRow.cashFlowPerShare = typedNewRow.cashFlowPerShare;
                                hasAdjustment = true;
                            }
                            if ((existingRow.bookValuePerShare === 0 || existingRow.bookValuePerShare === null || existingRow.bookValuePerShare === undefined) && typedNewRow.bookValuePerShare > 0) {
                                updatedRow.bookValuePerShare = typedNewRow.bookValuePerShare;
                                hasAdjustment = true;
                            }
                            if ((existingRow.dividendPerShare === 0 || existingRow.dividendPerShare === null || existingRow.dividendPerShare === undefined) && typedNewRow.dividendPerShare > 0) {
                                updatedRow.dividendPerShare = typedNewRow.dividendPerShare;
                                hasAdjustment = true;
                            }
                            if ((existingRow.priceHigh === 0 || existingRow.priceHigh === null || existingRow.priceHigh === undefined) && typedNewRow.priceHigh > 0) {
                                updatedRow.priceHigh = typedNewRow.priceHigh;
                                hasAdjustment = true;
                            }
                            if ((existingRow.priceLow === 0 || existingRow.priceLow === null || existingRow.priceLow === undefined) && typedNewRow.priceLow > 0) {
                                updatedRow.priceLow = typedNewRow.priceLow;
                                hasAdjustment = true;
                            }
                            // Si on a fait des ajustements, marquer comme ajuste
                            if (hasAdjustment) {
                                updatedRow.dataSource = 'fmp-adjusted' as const;
                            }
                            return updatedRow;
                        }

                        // Si la donnee existante est manuelle, la garder
                        if (existingRow.autoFetched === false || existingRow.dataSource === 'manual') {
                            return existingRow; // Preserver la donnee manuelle
                        }

                        // Sinon, merger avec preservation des valeurs existantes (donnees ajustees)
                        //  CRITIQUE : Ne pas remplacer les valeurs existantes par des valeurs a 0
                        const newRowTyped = newRow as AnnualData;
                        const hasPreservedValues = 
                            (newRowTyped.earningsPerShare <= 0 && existingRow.earningsPerShare > 0) ||
                            (newRowTyped.cashFlowPerShare <= 0 && existingRow.cashFlowPerShare > 0) ||
                            (newRowTyped.bookValuePerShare <= 0 && existingRow.bookValuePerShare > 0) ||
                            (newRowTyped.dividendPerShare <= 0 && existingRow.dividendPerShare > 0) ||
                            (newRowTyped.priceHigh <= 0 && existingRow.priceHigh > 0) ||
                            (newRowTyped.priceLow <= 0 && existingRow.priceLow > 0);
                        
                        //  PRESERVER LE DATASOURCE ORIGINAL SI FMP-VERIFIED ET PAS DE PRESERVATION
                        // Si les donnees existantes sont 'fmp-verified' et qu'on n'a pas preserve de valeurs,
                        // on garde 'fmp-verified' pour que les donnees restent vertes
                        let finalDataSource: 'fmp-verified' | 'fmp-adjusted' | 'manual' | 'calculated';
                        if (hasPreservedValues) {
                            // Si on a preserve des valeurs, c'est forcement ajuste
                            finalDataSource = 'fmp-adjusted' as const;
                        } else if (existingRow.dataSource === 'fmp-verified') {
                            // Si les donnees existantes etaient deja verifiees et qu'on n'a rien preserve,
                            // on garde 'fmp-verified' pour que ca reste vert
                            finalDataSource = 'fmp-verified' as const;
                        } else {
                            // Sinon, on utilise les nouvelles donnees FMP qui sont verifiees
                            finalDataSource = 'fmp-verified' as const;
                        }
                        
                        return {
                            ...existingRow,
                            earningsPerShare: (newRowTyped.earningsPerShare > 0) ? newRowTyped.earningsPerShare : existingRow.earningsPerShare,
                            cashFlowPerShare: (newRowTyped.cashFlowPerShare > 0) ? newRowTyped.cashFlowPerShare : existingRow.cashFlowPerShare,
                            bookValuePerShare: (newRowTyped.bookValuePerShare > 0) ? newRowTyped.bookValuePerShare : existingRow.bookValuePerShare,
                            dividendPerShare: (newRowTyped.dividendPerShare > 0) ? newRowTyped.dividendPerShare : existingRow.dividendPerShare,
                            priceHigh: (newRowTyped.priceHigh > 0) ? newRowTyped.priceHigh : existingRow.priceHigh,
                            priceLow: (newRowTyped.priceLow > 0) ? newRowTyped.priceLow : existingRow.priceLow,
                            autoFetched: true,
                            dataSource: finalDataSource //  Preserve 'fmp-verified' si les donnees n'ont pas ete modifiees
                        };
                    });

                    // Ajouter les nouvelles annees qui n'existent pas dans les donnees existantes (donnees FMP verifiees)
                    result.data.forEach(newRow => {
                        const exists = mergedData.some(row => row.year === newRow.year);
                        if (!exists) {
                            mergedData.push({
                                ...newRow,
                                autoFetched: true,
                                dataSource: 'fmp-verified' as const //  Nouvelle annee directement de FMP = verifiee
                            });
                        }
                    });
                }

                // Trier par annee
                mergedData.sort((a, b) => a.year - b.year);
                
                console.log(' performSync: Donnees mergees pretes', {
                    mergedDataLength: mergedData.length,
                    mergedDataYears: mergedData.map(d => d.year),
                    lastYearEPS: mergedData[mergedData.length - 1]?.earningsPerShare,
                    lastYearCF: mergedData[mergedData.length - 1]?.cashFlowPerShare,
                    lastYearBV: mergedData[mergedData.length - 1]?.bookValuePerShare,
                    allMergedData: mergedData.map(d => ({
                        year: d.year,
                        eps: d.earningsPerShare,
                        cf: d.cashFlowPerShare,
                        bv: d.bookValuePerShare
                    }))
                });
                
                setData(mergedData);
            } else {
                console.warn(' performSync: Aucune donnee dans result.data', {
                    resultDataLength: result.data.length,
                    currentDataLength: data.length
                });
            }

            // Update Info (including logo and beta, but preserve ValueLine metrics)
            if (result.info && syncOptions?.syncInfo !== false) {
                //  MULTI-UTILISATEUR : Recharger les metriques ValueLine depuis Supabase lors de la synchronisation FMP
                // Pour garantir que tous les utilisateurs voient les memes valeurs
                const existingProfile = library[activeId];
                let preservedValueLineMetrics = {
                    securityRank: existingProfile?.info?.securityRank || result.info.securityRank || 'N/A',
                    earningsPredictability: existingProfile?.info?.earningsPredictability || result.info.earningsPredictability,
                    priceGrowthPersistence: existingProfile?.info?.priceGrowthPersistence || result.info.priceGrowthPersistence,
                    priceStability: existingProfile?.info?.priceStability || result.info.priceStability
                };
                
                // Recharger depuis Supabase pour garantir la coherence multi-utilisateurs
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
                    console.warn(' Impossible de recharger les metriques ValueLine depuis Supabase lors de la sync FMP:', error);
                    // Continuer avec les valeurs existantes en cas d'erreur
                }
                
                const updatedInfo = {
                    ...result.info,
                    ...preservedValueLineMetrics // Preserver les metriques ValueLine
                };
                
                // Ensure required fields are present
                const completeInfo: CompanyInfo = {
                    symbol: updatedInfo.symbol || activeId,
                    name: updatedInfo.name || activeId,
                    sector: updatedInfo.sector || '',
                    securityRank: updatedInfo.securityRank || 'N/A',
                    marketCap: updatedInfo.marketCap || 'N/A',
                    ...updatedInfo,
                    financials: result.financials, // Strategic: Store full financials
                    analysisData: result.analysisData // Strategic: Store premium analysis data
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

            // Auto-fill assumptions basees sur les donnees historiques FMP (fonction centralisee)
            //  IMPORTANT : On preserve les hypotheses existantes (orange) sauf si replaceOrangeData est true
            //  CRITIQUE : Utiliser mergedData (defini ci-dessus) au lieu de data (ancienne valeur)
            // mergedData contient les donnees mergees avec preservation des donnees manuelles
            const mergedDataForCalc = mergedData.length > 0 ? mergedData : result.data;
            // Si replaceOrangeData est true, passer undefined pour forcer le recalcul de toutes les assumptions
            const existingAssumptionsForCalc = syncOptions?.replaceOrangeData ? undefined : assumptions;
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                mergedDataForCalc, // Utiliser les donnees mergees au lieu de result.data
                result.currentPrice,
                existingAssumptionsForCalc, // Preserver les valeurs existantes seulement si replaceOrangeData est false
                result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
            );

            console.log(' Auto-filled assumptions in performSync (AVANT setAssumptions):', {
                growthEPS: autoFilledAssumptions.growthRateEPS,
                growthCF: autoFilledAssumptions.growthRateCF,
                growthBV: autoFilledAssumptions.growthRateBV,
                growthDiv: autoFilledAssumptions.growthRateDiv,
                targetPE: autoFilledAssumptions.targetPE,
                targetPCF: autoFilledAssumptions.targetPCF,
                targetPBV: autoFilledAssumptions.targetPBV,
                baseYear: autoFilledAssumptions.baseYear,
                currentPrice: autoFilledAssumptions.currentPrice,
                allAutoFilled: autoFilledAssumptions
            });

            setAssumptions(prev => {
                // Detecter les outliers si l'option est activee
                let outlierDetection = { 
                    detectedOutliers: [], 
                    excludeEPS: prev.excludeEPS || false,
                    excludeCF: prev.excludeCF || false,
                    excludeBV: prev.excludeBV || false,
                    excludeDIV: prev.excludeDIV || false
                };
                
                if (syncOptions?.recalculateOutliers !== false) {
                    const tempAssumptions = { ...prev, ...autoFilledAssumptions } as Assumptions;
                    outlierDetection = detectOutlierMetrics(mergedDataForCalc, tempAssumptions);
                }
                
                const updated = {
                    ...prev,
                    ...autoFilledAssumptions, // Mettre a jour avec les nouvelles valeurs calculees
                    // Preserver les exclusions si l'option est activee
                    excludeEPS: syncOptions?.preserveExclusions !== false ? (prev.excludeEPS || outlierDetection.excludeEPS) : outlierDetection.excludeEPS,
                    excludeCF: syncOptions?.preserveExclusions !== false ? (prev.excludeCF || outlierDetection.excludeCF) : outlierDetection.excludeCF,
                    excludeBV: syncOptions?.preserveExclusions !== false ? (prev.excludeBV || outlierDetection.excludeBV) : outlierDetection.excludeBV,
                    excludeDIV: syncOptions?.preserveExclusions !== false ? (prev.excludeDIV || outlierDetection.excludeDIV) : outlierDetection.excludeDIV
                };
                console.log(' setAssumptions: Assumptions mises a jour', {
                    prevGrowthEPS: prev.growthRateEPS,
                    newGrowthEPS: updated.growthRateEPS,
                    prevTargetPE: prev.targetPE,
                    newTargetPE: updated.targetPE,
                    allUpdated: updated
                });
                return updated;
            });

            // Detecter et exclure automatiquement les metriques avec prix cibles aberrants
            //  CRITIQUE : Utiliser mergedData (defini ci-dessus) qui contient les donnees mergees
            const finalData = mergedData.length > 0 ? mergedData : result.data;
            
            //  SIMPLIFIE : Plus besoin de sanitiser manuellement, setAssumptions le fait automatiquement !
            // Merger les assumptions (auto-filled prend priorite sur existantes)
            const finalAssumptions = {
                ...assumptions,
                ...autoFilledAssumptions // Les valeurs auto-remplies prennent priorite
            };
            
            const outlierDetection = detectOutlierMetrics(finalData, finalAssumptions);
            
            if (outlierDetection.detectedOutliers.length > 0) {
                console.log(` Metriques avec prix cibles aberrants detectees: ${outlierDetection.detectedOutliers.join(', ')}`);
                showNotification(
                    `Metriques exclues automatiquement (prix cibles aberrants): ${outlierDetection.detectedOutliers.join(', ')}`,
                    'warning'
                );
            }

            // Appliquer les exclusions detectees
            const assumptionsWithOutlierExclusions = {
                ...finalAssumptions,
                excludeEPS: outlierDetection.excludeEPS,
                excludeCF: outlierDetection.excludeCF,
                excludeBV: outlierDetection.excludeBV,
                excludeDIV: outlierDetection.excludeDIV
            };

            //  SIMPLIFIE : setAssumptions sanitis automatiquement !
            setAssumptions(assumptionsWithOutlierExclusions);

            // Auto-save snapshot after successful sync avec metadonnees de synchronisation
            //  saveSnapshot sanitis aussi, donc double protection
            console.log(' Auto-saving snapshot after API sync...');
            
            // Preparer les metadonnees de synchronisation pour performSync
            const syncStartTime = Date.now();
            const syncMetadata = {
                timestamp: new Date().toISOString(),
                source: 'fmp',
                dataRetrieved: {
                    years: finalData.length,
                    dataPoints: finalData.length * 6, // Approximation (EPS, CF, BV, DIV, priceHigh, priceLow)
                    hasProfile: !!result.info,
                    hasKeyMetrics: result.data.length > 0,
                    hasQuotes: !!result.currentPrice && result.currentPrice > 0,
                    hasFinancials: !!result.financials && result.financials.length > 0
                },
                outliers: {
                    detected: outlierDetection.detectedOutliers,
                    excluded: {
                        EPS: outlierDetection.excludeEPS,
                        CF: outlierDetection.excludeCF,
                        BV: outlierDetection.excludeBV,
                        DIV: outlierDetection.excludeDIV
                    },
                    reasons: {}
                },
                orangeData: {
                    growthRateEPS: assumptionsWithOutlierExclusions.growthRateEPS,
                    growthRateCF: assumptionsWithOutlierExclusions.growthRateCF,
                    growthRateBV: assumptionsWithOutlierExclusions.growthRateBV,
                    growthRateDiv: assumptionsWithOutlierExclusions.growthRateDiv,
                    targetPE: assumptionsWithOutlierExclusions.targetPE,
                    targetPCF: assumptionsWithOutlierExclusions.targetPCF,
                    targetPBV: assumptionsWithOutlierExclusions.targetPBV,
                    targetYield: assumptionsWithOutlierExclusions.targetYield,
                    wasReplaced: syncOptions?.replaceOrangeData || false
                },
                other: {
                    snapshotSaved: true,
                    assumptionsUpdated: true,
                    infoUpdated: syncOptions?.syncInfo !== false,
                    valueLineMetricsSynced: syncOptions?.syncValueLineMetrics || false
                },
                options: syncOptions || {},
                duration: Date.now() - syncStartTime,
                success: true
            };

            await saveSnapshot(
                activeId,
                finalData,
                assumptionsWithOutlierExclusions, // setAssumptions a deja sanitise, saveSnapshot sanitisera aussi
                info,
                `API sync - ${new Date().toLocaleString()}`,
                true,  // Mark as current
                true,  // Auto-fetched
                0,     // retryCount
                2,     // maxRetries
                syncMetadata // Metadonnees de synchronisation
            );

            showNotification(`Donnees synchronisees avec succes pour ${activeId}`, 'success');

        } catch (e) {
            const error = e as Error;
            let errorMessage = error.message;
            
            // Ameliorer les messages d'erreur pour l'utilisateur
            if (errorMessage.includes('not found') || errorMessage.includes('introuvable')) {
                errorMessage = `Symbole '${activeId}' introuvable dans FMP.\n\n` +
                    `Causes possibles:\n` +
                    `- Le symbole n'existe pas ou est mal orthographie\n` +
                    `- Le symbole necessite un format different (ex: BRK-B au lieu de BRK.B)\n` +
                    `- La cle API FMP n'est pas configuree ou invalide\n` +
                    `- Le ticker n'est pas disponible dans FMP (essayez un autre fournisseur)\n\n` +
                    `Verifiez les logs de la console pour plus de details.`;
            } else if (errorMessage.includes('API key') || errorMessage.includes('Invalid API')) {
                errorMessage = `Erreur de cle API FMP.\n\n` +
                    `La cle API FMP semble invalide ou non configuree.\n` +
                    `Verifiez FMP_API_KEY dans les variables d'environnement Vercel.`;
            } else if (errorMessage.includes('empty') || errorMessage.includes('vide')) {
                errorMessage = `Aucune donnee retournee pour '${activeId}'.\n\n` +
                    `FMP a retourne un tableau vide. Cela peut signifier:\n` +
                    `- Le ticker existe mais n'a pas de donnees historiques disponibles\n` +
                    `- Le ticker necessite un abonnement FMP premium\n` +
                    `- Le symbole doit etre formate differemment\n\n` +
                    `Verifiez les logs de la console pour plus de details.`;
            }
            
            console.error(' Erreur synchronisation:', error);
            showNotification(`Erreur lors de la recuperation des donnees : ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
            setCurrentSyncingTicker(undefined); //  Reinitialiser le ticker actuel
        }
    };

    const handleUpdateRow = (index: number, field: keyof AnnualData, value: number) => {
        // Block updates if viewing historical version in read-only mode
        if (isReadOnly) {
            showNotification('Cette version est en lecture seule. Deverrouillez-la pour la modifier.', 'warning');
            return;
        }

        setPastData(prev => [...prev, data]);
        setFutureData([]);

        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value, autoFetched: false, dataSource: 'manual' as const };
        setData(updated);
    };

    const handleUpdateAssumption = (key: keyof Assumptions, value: number | boolean) => {
        setAssumptions(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdateInfo = (key: keyof CompanyInfo, value: string | number) => {
        //  MULTI-UTILISATEUR : Empecher la modification des metriques ValueLine
        // Ces metriques viennent de Supabase et doivent rester synchronisees pour tous les utilisateurs
        const valueLineFields: (keyof CompanyInfo)[] = ['securityRank', 'earningsPredictability', 'priceGrowthPersistence', 'priceStability'];
        
        if (valueLineFields.includes(key)) {
            showNotification(
                ' Les metriques ValueLine ne peuvent pas etre modifiees localement.\n' +
                'Elles sont synchronisees depuis Supabase pour tous les utilisateurs.\n' +
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
        console.log(` Attempting to load snapshot: ${snapshotId}`);
        const result = await loadSnapshot(snapshotId);

        if (!result.success) {
            console.error(` Load failed: ${result.error}`);
            showNotification(`Erreur chargement: ${result.error}`, 'error');
            return;
        }

        const snapshot = result.snapshot;
        console.log(' Snapshot loaded:', snapshot);

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

        console.log(` Loaded snapshot v${snapshot.version} from ${snapshot.snapshot_date}`);
    };

    const handleRevertToCurrent = async () => {
        const result = await listSnapshots(activeId, 100);

        if (result.success && result.snapshots && result.snapshots.length > 0) {
            const currentSnap = result.snapshots.find(s => s.is_current);
            if (currentSnap) {
                await handleLoadSnapshot(currentSnap.id);
            } else {
                showNotification('Aucune version actuelle trouvee', 'warning');
            }
        }

        // Reset historical state
        setCurrentSnapshot(null);
        setIsReadOnly(false);
    };

    const handleUnlockVersion = () => {
        if (!confirm('Deverrouiller cette version pour modification?\n\nLes changements seront enregistres sur cette ancienne version.')) {
            return;
        }
        setIsReadOnly(false);
    };

    // --- RESTORE DATA HANDLERS ---
    const handleOpenRestoreDialog = async () => {
        // Charger la date de la derniere sauvegarde
        const result = await listSnapshots(activeId, 1);
        if (result.success && result.snapshots && result.snapshots.length > 0) {
            const latest = result.snapshots[0]; // Le plus recent est le premier
            setLatestSnapshotDate(latest.snapshot_date);
        }
        setShowRestoreDialog(true);
    };

    const handleRestoreFromSnapshot = async () => {
        try {
            const result = await listSnapshots(activeId, 100);

            if (result.success && result.snapshots && result.snapshots.length > 0) {
                // Trouver le snapshot actuel (is_current) ou le plus recent
                const currentSnap = result.snapshots.find(s => s.is_current) || result.snapshots[0];
                
                if (currentSnap) {
                    await handleLoadSnapshot(currentSnap.id);
                    showNotification('Donnees restaurees depuis la derniere sauvegarde', 'success');
                } else {
                    showNotification('Aucune sauvegarde trouvee', 'warning');
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
            showNotification(`Recalcul des donnees depuis FMP pour ${activeId}...`, 'info');
            
            // Recuperer les donnees FMP (comme lors d'un nouvel ajout)
            const result = await fetchCompanyData(activeId);
            
            // VALIDATION STRICTE
            if (!result.data || result.data.length === 0) {
                throw new Error(`Aucune donnee FMP retournee pour ${activeId}`);
            }
            
            if (!result.currentPrice || result.currentPrice <= 0) {
                throw new Error(`Prix actuel invalide (${result.currentPrice}) pour ${activeId}`);
            }
            
            const hasValidData = result.data.some(d => 
                d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
            );
            
            if (!hasValidData) {
                // Verifier si c'est un fonds mutuel
                if (isMutualFund(activeId, result.info.name)) {
                    throw new Error(`${activeId} est un fonds mutuel et ne peut pas etre analyse avec les ratios d'entreprise`);
                }
                throw new Error(`Aucune donnee financiere valide pour ${activeId}`);
            }

            // Merge intelligent : preserver les donnees manuelles (comme dans handleBulkSyncAllTickers)
            const existingProfile = library[activeId];
            const existingData = existingProfile?.data || data;
            const newDataByYear = new Map(result.data.map(row => [row.year, row]));
            
            const mergedData = existingData.map((existingRow) => {
                const newRow = newDataByYear.get(existingRow.year);
                
                // Si pas de nouvelle donnee pour cette annee, garder l'existant
                if (!newRow) {
                    return existingRow;
                }

                // Si la donnee existante est manuelle (autoFetched: false ou undefined), la garder
                if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                    return existingRow; // Preserver la donnee manuelle
                }

                // Sinon, utiliser la nouvelle donnee avec autoFetched: true
                return {
                    ...(newRow as AnnualData),
                    autoFetched: true
                };
            });

            // Ajouter les nouvelles annees qui n'existent pas dans les donnees existantes
            result.data.forEach(newRow => {
                const exists = mergedData.some(row => row.year === newRow.year);
                if (!exists) {
                    mergedData.push({
                        ...(newRow as AnnualData),
                        autoFetched: true
                    });
                }
            });

            // Trier par annee
            mergedData.sort((a, b) => a.year - b.year);

            // Auto-fill assumptions avec la fonction centralisee (comme lors d'un nouvel ajout)
            // Utiliser les donnees mergees pour le calcul
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                mergedData, // Utiliser les donnees mergees au lieu de result.data
                result.currentPrice,
                assumptions, // Preserver les exclusions existantes
                result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
            );

            // Detecter et exclure automatiquement les metriques avec prix cibles aberrants
            const tempAssumptions = {
                ...assumptions,
                ...autoFilledAssumptions
            } as Assumptions;
            const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
            
            if (outlierDetection.detectedOutliers.length > 0) {
                console.log(` Metriques avec prix cibles aberrants detectees: ${outlierDetection.detectedOutliers.join(', ')}`);
                showNotification(
                    `Metriques exclues automatiquement (prix cibles aberrants): ${outlierDetection.detectedOutliers.join(', ')}`,
                    'warning'
                );
            }

            // Appliquer les exclusions detectees
            const finalAssumptions = {
                ...tempAssumptions,
                excludeEPS: outlierDetection.excludeEPS,
                excludeCF: outlierDetection.excludeCF,
                excludeBV: outlierDetection.excludeBV,
                excludeDIV: outlierDetection.excludeDIV
            };

            // Mettre a jour les donnees et metriques
            setData(mergedData);
            setAssumptions(finalAssumptions);
            setInfo(prev => ({
                ...prev,
                ...result.info,
                // Preserver les metriques ValueLine
                securityRank: prev.securityRank || result.info.securityRank || 'N/A',
                earningsPredictability: prev.earningsPredictability || result.info.earningsPredictability,
                priceGrowthPersistence: prev.priceGrowthPersistence || result.info.priceGrowthPersistence,
                priceStability: prev.priceStability || result.info.priceStability
            }));

            // Mettre a jour dans la library
            setLibrary(prev => {
                const profile = prev[activeId];
                if (!profile) return prev;
                return {
                    ...prev,
                    [activeId]: {
                        ...profile,
                        data: mergedData, // Utiliser les donnees mergees au lieu de result.data
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

            showNotification(` Donnees recalculees depuis FMP avec succes pour ${activeId}`, 'success');
            console.log(` ${activeId}: Donnees recalculees depuis FMP`);
        } catch (error: any) {
            console.error(` ${activeId}: Erreur lors du recalcul FMP:`, error);
            showNotification(` Erreur: ${error.message}`, 'error');
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
            showNotification('Version sauvegardee avec succes!', 'success');
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
            showNotification('Nouvelle version sauvegardee!', 'success');
            // Reset to normal mode
            setCurrentSnapshot(null);
            setIsReadOnly(false);
        } else {
            showNotification(`Erreur: ${result.error}`, 'error');
        }
    };

    //  NOUVEAU : Fonction pour detecter si les donnees sont corrompues (toutes a 0)
    const hasCorruptedData = (data: AnnualData[]): boolean => {
        if (!data || data.length === 0) return true;
        // Verifier si TOUTES les annees ont toutes les valeurs a 0
        const allZero = data.every(row => 
            (!row.earningsPerShare || row.earningsPerShare === 0) &&
            (!row.cashFlowPerShare || row.cashFlowPerShare === 0) &&
            (!row.bookValuePerShare || row.bookValuePerShare === 0)
        );
        return allZero;
    };

    const handleSelectTicker = async (symbol: string) => {
        const upperSymbol = symbol.toUpperCase();
        if (library[upperSymbol]) {
            // Load existing profile data
            const existingProfile = library[upperSymbol];
            
            //  VERIFICATION CRITIQUE : Si c'est un profil squelette ou si les donnees sont vides, charger depuis Supabase puis FMP
            const isSkeleton = (existingProfile as any)._isSkeleton === true;
            const hasNoData = !existingProfile.data || existingProfile.data.length === 0;
            const hasNoPrice = !existingProfile.assumptions?.currentPrice || existingProfile.assumptions.currentPrice === 0;
            const hasCorruptedDataValue = hasCorruptedData(existingProfile.data || []);
            
            
            if (isSkeleton || hasNoData || hasNoPrice || hasCorruptedDataValue) {
                if (hasCorruptedDataValue) {
                    console.warn(` ${upperSymbol}: Donnees corrompues detectees (toutes les valeurs a 0) - Re-synchronisation forcee...`);
                    showNotification(` ${upperSymbol}: Donnees corrompues detectees. Re-synchronisation en cours...`, 'warning');
                }
                console.log(` ${upperSymbol}: Profil squelette ou donnees vides detectees - Tentative chargement Supabase puis FMP...`);
                
                //  NOUVEAU : Essayer d'abord de charger depuis Supabase (snapshot)
                try {
                    const { loadProfileFromSupabase } = await import('./services/supabaseDataLoader');
                    const supabaseProfile = await loadProfileFromSupabase(upperSymbol, false); // Ne pas fallback FMP ici
                    
                    if (supabaseProfile && supabaseProfile.source === 'supabase' && supabaseProfile.data && supabaseProfile.data.length > 0) {
                        console.log(` ${upperSymbol}: Charge depuis Supabase (snapshot)`);
                        
                        // Mettre a jour le profil avec les donnees Supabase
                        const updatedProfile: AnalysisProfile = {
                            id: upperSymbol,
                            lastModified: Date.now(),
                            data: supabaseProfile.data,
                            assumptions: supabaseProfile.assumptions || existingProfile.assumptions || INITIAL_ASSUMPTIONS,
                            info: {
                                ...existingProfile.info,
                                ...supabaseProfile.info
                            } as CompanyInfo,
                            notes: existingProfile.notes || '',
                            isWatchlist: existingProfile.isWatchlist ?? false
                        };
                        
                        // Retirer le flag squelette
                        delete (updatedProfile as any)._isSkeleton;
                        
                        // Mettre a jour la library
                        setLibrary(prev => ({
                            ...prev,
                            [upperSymbol]: updatedProfile
                        }));
                        
                        // Mettre a jour les states
                        setActiveId(upperSymbol);
                        setData(supabaseProfile.data);
                        setAssumptions(updatedProfile.assumptions);
                        setInfo(updatedProfile.info);
                        setNotes(updatedProfile.notes || '');
                        
                        showNotification(` ${upperSymbol} charge depuis Supabase`, 'success');
                        
                        //  FIX: Recuperer le prix en temps reel depuis l'API market data
                        // Meme apres chargement Supabase, le prix peut etre a 0 dans le snapshot
                        try {
                            console.log(` Tentative recuperation prix temps reel pour ${upperSymbol}...`);
                            const { fetchMarketData } = await import('./services/marketDataCache');
                            const marketData = await fetchMarketData(upperSymbol);
                            
                            if (marketData && marketData.currentPrice > 0) {
                                const priceUpdatedAssumptions = {
                                    ...updatedProfile.assumptions,
                                    currentPrice: marketData.currentPrice
                                };
                                setAssumptions(priceUpdatedAssumptions);
                                
                                // Aussi mettre a jour dans la library
                                setLibrary(prev => ({
                                    ...prev,
                                    [upperSymbol]: {
                                        ...prev[upperSymbol],
                                        assumptions: priceUpdatedAssumptions,
                                        lastModified: Date.now()
                                    }
                                }));
                                console.log(` Prix mis a jour pour ${upperSymbol}: $${marketData.currentPrice.toFixed(2)}`);
                            } else {
                                console.log(` Prix de marche non disponible pour ${upperSymbol}`);
                            }
                        } catch (priceError) {
                            console.warn(` Erreur recuperation prix pour ${upperSymbol}:`, priceError);
                        }
                        
                        return; //  Succes - ne pas continuer vers FMP
                    } else {
                        console.log(` ${upperSymbol}: Pas de snapshot Supabase disponible - Fallback FMP...`);
                        // Continuer vers FMP ci-dessous
                    }
                } catch (supabaseError) {
                    console.warn(` ${upperSymbol}: Erreur chargement Supabase (non bloquant):`, supabaseError);
                    // Continuer vers FMP ci-dessous
                }
                
                // Ne pas return ici, continuer pour charger les donnees FMP
            } else {
                //  Profil valide avec donnees - Charger normalement
                // Verifier et mettre a jour les metriques ValueLine depuis Supabase si disponibles
                // Utiliser le cache pour eviter les appels repetes
                try {
                    let supabaseTickers: any[] = [];
                    const now = Date.now();
                    
                    // Verifier si le cache est valide
                    if (supabaseTickersCacheRef.current && (now - supabaseTickersCacheRef.current.timestamp) < SUPABASE_CACHE_TTL) {
                        supabaseTickers = supabaseTickersCacheRef.current.data;
                    } else {
                        // Charger depuis Supabase et mettre a jour le cache
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
                            //  MULTI-UTILISATEUR : Supabase est la source de verite pour les metriques ValueLine
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
                            
                            // Mettre a jour dans la library si les metriques ont change
                            if (JSON.stringify(existingProfile.info) !== JSON.stringify(updatedInfo)) {
                                setLibrary(prev => ({
                                    ...prev,
                                    [upperSymbol]: {
                                        ...existingProfile,
                                        info: updatedInfo
                                    }
                                }));
                                setInfo(updatedInfo);
                                console.log(` Metriques ValueLine mises a jour depuis Supabase pour ${upperSymbol}`);
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
                    console.warn(` Impossible de charger les metriques ValueLine depuis Supabase pour ${upperSymbol}:`, error);
                    setInfo(existingProfile.info);
                }
                
                setActiveId(upperSymbol);
                setData(existingProfile.data);
                
                //  FIX: Mettre a jour le prix actuel depuis l'API de marche si le profil existe
                // Cela garantit que le prix est toujours a jour meme pour les profils en cache
                try {
                    console.log(` [ELSE BLOCK] Tentative recuperation prix temps reel pour ${upperSymbol}...`);
                    const { fetchMarketData } = await import('./services/marketDataCache');
                    const marketData = await fetchMarketData(upperSymbol);
                    
                    if (marketData && marketData.currentPrice > 0) {
                        const updatedAssumptions = {
                            ...existingProfile.assumptions,
                            currentPrice: marketData.currentPrice
                        };
                        setAssumptions(updatedAssumptions);
                        
                        // Aussi mettre a jour dans la library pour persistance
                        setLibrary(prev => ({
                            ...prev,
                            [upperSymbol]: {
                                ...prev[upperSymbol],
                                assumptions: updatedAssumptions,
                                lastModified: Date.now()
                            }
                        }));
                        console.log(` Prix mis a jour pour ${upperSymbol}: $${marketData.currentPrice.toFixed(2)}`);
                    } else {
                        setAssumptions(existingProfile.assumptions);
                        console.log(` Prix de marche non disponible pour ${upperSymbol}, utilisation du cache`);
                    }
                } catch (priceError) {
                    console.warn(` Erreur recuperation prix pour ${upperSymbol}:`, priceError);
                    setAssumptions(existingProfile.assumptions);
                }
                
                setNotes(existingProfile.notes);
                console.log(` Loaded existing profile for ${upperSymbol}`);
                return;
            }
        }

        //  RIGUEUR 100% : Ne pas creer de profil placeholder
        // Charger les donnees FMP AVANT de creer le profil
        try {
            showNotification(`Chargement des donnees pour ${upperSymbol}...`, 'info');
            const result = await fetchCompanyData(upperSymbol);
            
            // VALIDATION STRICTE : Verifier que les donnees sont valides
            if (!result.data || result.data.length === 0) {
                throw new Error(`Aucune donnee FMP retournee pour ${upperSymbol}`);
            }
            
            if (!result.currentPrice || result.currentPrice <= 0) {
                throw new Error(`Prix actuel invalide (${result.currentPrice}) pour ${upperSymbol}`);
            }
            
            // Verifier qu'on a au moins une annee avec des donnees valides
            const hasValidData = result.data.some(d => 
                d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
            );
            
            if (!hasValidData) {
                // Verifier si c'est un fonds mutuel
                if (isMutualFund(upperSymbol, result.info.name)) {
                    throw new Error(`${upperSymbol} est un fonds mutuel et ne peut pas etre analyse avec les ratios d'entreprise`);
                }
                throw new Error(`Aucune donnee financiere valide pour ${upperSymbol}`);
            }

            //  DETECTION : Profil existant (squelette ou vide) ou nouveau profil
            const existingProfile = library[upperSymbol];
            const isUpdatingSkeleton = existingProfile && ((existingProfile as any)._isSkeleton === true || !existingProfile.data || existingProfile.data.length === 0);
            const existingData = existingProfile?.data || [];

            //  MERGE INTELLIGENT : Preserver les donnees manuelles (orange) comme dans performSync
            const newDataByYear = new Map(result.data.map(row => [row.year, row]));
            
            const mergedData = existingData.map((existingRow) => {
                const newRow = newDataByYear.get(existingRow.year);
                
                // Si pas de nouvelle donnee pour cette annee, garder l'existant
                if (!newRow) {
                    return existingRow;
                }

                //  CRITIQUE : Si la donnee existante est manuelle, la garder
                if (existingRow.autoFetched === false || existingRow.dataSource === 'manual') {
                    return existingRow; // Preserver la donnee manuelle (orange)
                }

                // Sinon, merger avec preservation des valeurs existantes (donnees ajustees)
                //  CRITIQUE : Ne pas remplacer les valeurs existantes par des valeurs a 0
                const newRowTyped = newRow as AnnualData;
                const hasPreservedValues = 
                    (newRowTyped.earningsPerShare <= 0 && existingRow.earningsPerShare > 0) ||
                    (newRowTyped.cashFlowPerShare <= 0 && existingRow.cashFlowPerShare > 0) ||
                    (newRowTyped.bookValuePerShare <= 0 && existingRow.bookValuePerShare > 0) ||
                    (newRowTyped.dividendPerShare <= 0 && existingRow.dividendPerShare > 0) ||
                    (newRowTyped.priceHigh <= 0 && existingRow.priceHigh > 0) ||
                    (newRowTyped.priceLow <= 0 && existingRow.priceLow > 0);
                
                //  PRESERVER LE DATASOURCE ORIGINAL SI FMP-VERIFIED ET PAS DE PRESERVATION
                // Si les donnees existantes sont 'fmp-verified' et qu'on n'a pas preserve de valeurs,
                // on garde 'fmp-verified' pour que les donnees restent vertes
                let finalDataSource: 'fmp-verified' | 'fmp-adjusted' | 'manual' | 'calculated';
                if (hasPreservedValues) {
                    // Si on a preserve des valeurs, c'est forcement ajuste
                    finalDataSource = 'fmp-adjusted' as const;
                } else if (existingRow.dataSource === 'fmp-verified') {
                    // Si les donnees existantes etaient deja verifiees et qu'on n'a rien preserve,
                    // on garde 'fmp-verified' pour que ca reste vert
                    finalDataSource = 'fmp-verified' as const;
                } else {
                    // Sinon, on utilise les nouvelles donnees FMP qui sont verifiees
                    finalDataSource = 'fmp-verified' as const;
                }
                
                return {
                    ...existingRow,
                    earningsPerShare: (newRowTyped.earningsPerShare > 0) ? newRowTyped.earningsPerShare : existingRow.earningsPerShare,
                    cashFlowPerShare: (newRowTyped.cashFlowPerShare > 0) ? newRowTyped.cashFlowPerShare : existingRow.cashFlowPerShare,
                    bookValuePerShare: (newRowTyped.bookValuePerShare > 0) ? newRowTyped.bookValuePerShare : existingRow.bookValuePerShare,
                    dividendPerShare: (newRowTyped.dividendPerShare > 0) ? newRowTyped.dividendPerShare : existingRow.dividendPerShare,
                    priceHigh: (newRowTyped.priceHigh > 0) ? newRowTyped.priceHigh : existingRow.priceHigh,
                    priceLow: (newRowTyped.priceLow > 0) ? newRowTyped.priceLow : existingRow.priceLow,
                    autoFetched: true,
                    dataSource: finalDataSource //  Preserve 'fmp-verified' si les donnees n'ont pas ete modifiees
                };
            });

            // Ajouter les nouvelles annees qui n'existent pas dans les donnees existantes
            result.data.forEach(newRow => {
                const exists = mergedData.some(row => row.year === newRow.year);
                if (!exists) {
                    mergedData.push({
                        ...(newRow as AnnualData),
                        autoFetched: true
                    });
                }
            });

            // Trier par annee
            mergedData.sort((a, b) => a.year - b.year);

            //  IMPORTANT : Utiliser les donnees mergees (avec preservation des donnees manuelles) pour le calcul
            // Auto-fill assumptions basees sur les donnees historiques FMP (fonction centralisee)
            //  CRITIQUE : Preserver les hypotheses existantes (orange) sauf currentPrice
            //  NOUVEAU : autoFillAssumptionsFromFMPData preserve maintenant automatiquement les valeurs existantes
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                mergedData, //  Utiliser mergedData au lieu de result.data
                result.currentPrice,
                existingProfile?.assumptions || INITIAL_ASSUMPTIONS,
                result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
            );

            //  MERGE INTELLIGENT : Preserver les valeurs existantes (orange) AVANT d'appliquer les nouvelles
            // L'ordre est important : d'abord les nouvelles valeurs calculees, puis les valeurs existantes par-dessus
            // Cela garantit que les valeurs manuelles (orange) ne sont jamais ecrasees
            const existingAssumptions = existingProfile?.assumptions || INITIAL_ASSUMPTIONS;
            const tempAssumptions = {
                ...autoFilledAssumptions, // Nouvelles valeurs calculees (qui preservent deja les valeurs existantes)
                //  PRESERVER explicitement les valeurs existantes pour etre sur (double protection)
                growthRateEPS: existingAssumptions.growthRateEPS !== undefined && existingAssumptions.growthRateEPS !== 0 
                    ? existingAssumptions.growthRateEPS 
                    : autoFilledAssumptions.growthRateEPS,
                growthRateSales: existingAssumptions.growthRateSales !== undefined && existingAssumptions.growthRateSales !== 0 
                    ? existingAssumptions.growthRateSales 
                    : autoFilledAssumptions.growthRateSales,
                growthRateCF: existingAssumptions.growthRateCF !== undefined && existingAssumptions.growthRateCF !== 0 
                    ? existingAssumptions.growthRateCF 
                    : autoFilledAssumptions.growthRateCF,
                growthRateBV: existingAssumptions.growthRateBV !== undefined && existingAssumptions.growthRateBV !== 0 
                    ? existingAssumptions.growthRateBV 
                    : autoFilledAssumptions.growthRateBV,
                growthRateDiv: existingAssumptions.growthRateDiv !== undefined && existingAssumptions.growthRateDiv !== 0 
                    ? existingAssumptions.growthRateDiv 
                    : autoFilledAssumptions.growthRateDiv,
                // Preserver aussi les ratios cibles si definis
                targetPE: existingAssumptions.targetPE !== undefined && existingAssumptions.targetPE !== 0 
                    ? existingAssumptions.targetPE 
                    : autoFilledAssumptions.targetPE,
                targetPCF: existingAssumptions.targetPCF !== undefined && existingAssumptions.targetPCF !== 0 
                    ? existingAssumptions.targetPCF 
                    : autoFilledAssumptions.targetPCF,
                targetPBV: existingAssumptions.targetPBV !== undefined && existingAssumptions.targetPBV !== 0 
                    ? existingAssumptions.targetPBV 
                    : autoFilledAssumptions.targetPBV,
                targetYield: existingAssumptions.targetYield !== undefined && existingAssumptions.targetYield !== 0 
                    ? existingAssumptions.targetYield 
                    : autoFilledAssumptions.targetYield,
                // Preserver les autres valeurs existantes
                requiredReturn: existingAssumptions.requiredReturn || autoFilledAssumptions.requiredReturn,
                dividendPayoutRatio: existingAssumptions.dividendPayoutRatio || autoFilledAssumptions.dividendPayoutRatio,
                excludeEPS: existingAssumptions.excludeEPS,
                excludeCF: existingAssumptions.excludeCF,
                excludeBV: existingAssumptions.excludeBV,
                excludeDIV: existingAssumptions.excludeDIV
            } as Assumptions;
            const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
            
            if (outlierDetection.detectedOutliers.length > 0) {
                console.log(` ${upperSymbol}: Outliers detectes: ${outlierDetection.detectedOutliers.join(', ')}`);
            }

            //  SANITISER les assumptions finales pour appliquer les guardrails
            const finalAssumptions = sanitizeAssumptionsSync({
                ...tempAssumptions,
                excludeEPS: outlierDetection.excludeEPS,
                excludeCF: outlierDetection.excludeCF,
                excludeBV: outlierDetection.excludeBV,
                excludeDIV: outlierDetection.excludeDIV
            }) as Assumptions;

            const updatedProfile: AnalysisProfile = {
                id: upperSymbol,
                lastModified: Date.now(),
                data: mergedData, //  Utiliser mergedData au lieu de result.data
                assumptions: finalAssumptions, //  Utiliser finalAssumptions avec guardrails
                info: {
                    ...(existingProfile?.info || {}),
                    symbol: symbol,
                    name: result.info.name || symbol,
                    sector: result.info.sector || existingProfile?.info?.sector || '',
                    securityRank: result.info.securityRank || existingProfile?.info?.securityRank || 'N/A',
                    marketCap: result.info.marketCap || existingProfile?.info?.marketCap || 'N/A',
                    ...result.info
                },
                notes: existingProfile?.notes || '',
                isWatchlist: existingProfile?.isWatchlist ?? false
            };
            
            //  RETIRER LE FLAG SQUELETTE si present
            delete (updatedProfile as any)._isSkeleton;
            
            // Mettre a jour ou creer le profil
            setLibrary(prev => {
                const updated = {
                    ...prev,
                    [upperSymbol]: updatedProfile
                };
                
                //  NOUVEAU : Sauvegarder dans cache avec timestamp (fire and forget)
                        //  Sauvegarder dans Supabase ET cache local
                        saveProfiles(updated, true).catch(e => console.warn('Failed to save profiles:', e));
                
                return updated;
            });
            
            setActiveId(upperSymbol);
            setData(mergedData); //  Utiliser mergedData pour preserver les donnees orange
            setAssumptions(updatedProfile.assumptions);
            // Ensure required fields are present
            const completeInfo: CompanyInfo = {
                symbol: symbol,
                name: result.info.name || symbol,
                sector: result.info.sector || existingProfile?.info?.sector || '',
                securityRank: result.info.securityRank || existingProfile?.info?.securityRank || 'N/A',
                marketCap: result.info.marketCap || existingProfile?.info?.marketCap || 'N/A',
                ...result.info,
                ...(existingProfile?.info || {})
            };
            setInfo(completeInfo);
            setNotes(existingProfile?.notes || '');
            
            if (isUpdatingSkeleton) {
                showNotification(` ${upperSymbol} charge avec succes (profil mis a jour)`, 'success');
                console.log(` ${upperSymbol}: Profil squelette mis a jour avec donnees FMP valides`);
            } else {
                showNotification(` ${upperSymbol} charge avec succes`, 'success');
                console.log(` ${upperSymbol}: Profil cree avec donnees FMP valides`);
            }
        } catch (e) {
            const error = e as Error;
            console.error(` ${upperSymbol}: Erreur FMP - profil NON cree:`, error);
            showNotification(` Impossible de charger ${upperSymbol}: ${error.message}`, 'error');
            //  RIGUEUR 100% : Ne pas creer de profil si FMP echoue
        }
    };

    const handleDeleteTicker = async (id: string) => {
        // Delete from local storage and state
        const newLib = { ...library };
        delete newLib[id];
        setLibrary(newLib);
        //  Sauvegarder dans Supabase ET cache local
        await saveProfiles(newLib, true);

        // Update active ticker if needed
        if (activeId === id) {
            const remaining = Object.keys(newLib);
            if (remaining.length > 0) {
                // Selectionner le premier ticker en ordre alphabetique
                const sortedRemaining = remaining.sort((a, b) => 
                    (library[a]?.info?.preferredSymbol || a).localeCompare(library[b]?.info?.preferredSymbol || b)
                );
                setActiveId(sortedRemaining[0]);
            } else {
                setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                setActiveId(DEFAULT_PROFILE.id);
            }
        }

        // Delete from Supabase in background
        try {
            const response = await fetch('/api/remove-ticker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: id, confirm: true })
            });

            const result = await response.json();

            if (result.success) {
                console.log(` ${id} supprime de Supabase:`, result.removed_from);
                showNotification(` ${id} supprime definitivement`, 'success');
            } else {
                console.warn(` ${id} non trouve dans Supabase`, result);
            }
        } catch (error) {
            console.error(` Erreur suppression Supabase pour ${id}:`, error);
            // Ne pas bloquer l'UI - la suppression locale a deja ete faite
        }
    };

    const handleDuplicateTicker = (id: string) => {
        const newId = prompt(`Nom du nouveau profil (ex: ${id}_OPTIMISTE):`, `${id}_COPY`);
        if (newId) {
            const upperId = newId.toUpperCase();
            if (library[upperId]) {
                showNotification("Ce nom existe deja.", 'warning');
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
            //  Sauvegarder dans Supabase ET cache local
            saveProfiles(newLib, true).catch(e => {
                console.warn('Failed to save to cache:', e);
            });

            // If modifying currently active profile, sync local state
            if (id === activeId) {
                setIsWatchlist(updated.isWatchlist);
            }

            return newLib;
        });
    };

    const handleSetTickerType = (id: string, type: 'portfolio' | 'watchlist' | 'normal') => {
        setLibrary(prev => {
            const profile = prev[id];
            if (!profile) return prev;

            const updated = {
                ...profile,
                isWatchlist: type === 'portfolio' ? false : type === 'watchlist' ? true : null
            };

            const newLib = { ...prev, [id]: updated };
            //  Sauvegarder dans Supabase ET cache local
            saveProfiles(newLib, true).catch(e => {
                console.warn('Failed to save to cache:', e);
            });

            // If modifying currently active profile, sync local state
            if (id === activeId) {
                setIsWatchlist(updated.isWatchlist);
            }

            return newLib;
        });
    };

    const handleResetData = () => {
        if (confirm("Voulez-vous remettre a zero toutes les donnees historiques de ce profil ?")) {
            setData(INITIAL_DATA.map(d => ({ ...d, priceHigh: 0, priceLow: 0, earningsPerShare: 0, dividendPerShare: 0, cashFlowPerShare: 0, bookValuePerShare: 0 })));
        }
    };

    // --- BULK SYNC ALL TICKERS HANDLER ---
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [bulkSyncProgress, setBulkSyncProgress] = useState({ current: 0, total: 0 });
    const [syncStats, setSyncStats] = useState({ successCount: 0, errorCount: 0 });
    const [currentSyncingTicker, setCurrentSyncingTicker] = useState<string | undefined>(undefined);
    
    // Sync Control Refs & State
    const abortSync = useRef(false);
    const isSyncPaused = useRef(false);
    const [syncPausedState, setSyncPausedState] = useState(false);

    const handleBulkSyncAllTickers = async () => {
        // Ouvrir le dialogue avance pour la synchronisation en masse
        setIsAdvancedSyncForBulk(true);
        setShowAdvancedSyncDialog(true);
    };

    const handleSyncSelectedTickers = async (tickerIds: string[]) => {
        if (tickerIds.length === 0) {
            showNotification('Aucun ticker selectionne', 'warning');
            return;
        }
        // Stocker les tickers selectionnes pour le dialogue de synchronisation
        (window as any)._pendingSyncTickers = tickerIds;
        setIsAdvancedSyncForBulk(true);
        setShowAdvancedSyncDialog(true);
    };

    // Etat pour le rapport de synchronisation
    const [syncReportData, setSyncReportData] = useState<any>(null);
    const [showSyncReport, setShowSyncReport] = useState(false);

    const handleBulkSyncAllTickersWithOptions = async (options: SyncOptions, specificTickers?: string[]) => {
        setIsBulkSyncing(true);
        // Reset controls
        abortSync.current = false;
        isSyncPaused.current = false;
        setSyncPausedState(false);

        const allTickers = specificTickers || Object.keys(library);
        setBulkSyncProgress({ current: 0, total: allTickers.length });
        setSyncStats({ successCount: 0, errorCount: 0 });

        const startTime = Date.now();
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0; // Tickers introuvables dans FMP (404)
        const errors: string[] = [];
        const skippedTickers: string[] = []; // Tickers ignores car introuvables dans FMP
        
        //  Collecte des donnees pour le rapport detaille
        const tickerResults: any[] = [];
        
        //  OPTIMISATION CRITIQUE: Charger les tickers Supabase UNE SEULE FOIS au debut
        // et mettre en cache pour eviter des centaines d'appels API pendant la synchronisation
        let supabaseTickersCache: any[] | null = null;
        if (options.syncValueLineMetrics) {
            try {
                console.log(' Chargement initial des tickers Supabase pour metriques ValueLine...');
                const supabaseResult = await loadAllTickersFromSupabase();
                if (supabaseResult.success) {
                    supabaseTickersCache = supabaseResult.tickers;
                    console.log(` ${supabaseTickersCache.length} tickers Supabase charges et mis en cache pour toute la synchronisation`);
                } else {
                    console.warn(' Echec chargement initial tickers Supabase, metriques ValueLine non synchronisees');
                }
            } catch (error: any) {
                console.warn(' Erreur chargement initial tickers Supabase:', error.message);
            }
        }
        
        //  OPTIMISATION: Utiliser l'endpoint batch pour recuperer plusieurs tickers en une seule requete
        //  Charger les configurations depuis Supabase (pas de hardcoding)
        const { getConfigValue } = await import('./services/appConfigApi');
        const BATCH_API_SIZE = await getConfigValue('api_batch_size');
        const delayBetweenBatches = await getConfigValue('delay_between_batches_ms');
        const MAX_SYNC_TIME_MS = await getConfigValue('max_sync_time_ms');
        const startSyncTime = Date.now(); // Timestamp de debut pour timeout global

        //  FONCTION HELPER: Recuperer plusieurs tickers en batch
        const fetchCompanyDataBatch = async (tickerSymbols: string[], includeKeyMetrics: boolean = true): Promise<Map<string, any>> => {
            const results = new Map<string, any>();
            
            try {
                const symbolString = tickerSymbols.join(',');
                console.log(` [BATCH] Appel API pour ${tickerSymbols.length} tickers: ${symbolString.substring(0, 50)}...`);
                console.log(` [BATCH] includeKeyMetrics: ${includeKeyMetrics}`);
                // Inclure les key metrics seulement si demande (pour optimiser si on veut seulement syncInfo ou syncAssumptions)
                const url = `/api/fmp-company-data-batch-sync?symbols=${encodeURIComponent(symbolString)}&limit=${BATCH_API_SIZE}&includeKeyMetrics=${includeKeyMetrics}`;
                console.log(` [BATCH] URL: ${url.substring(0, 100)}...`);
                
                const response = await fetch(url);
                console.log(` [BATCH] Reponse HTTP: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(` [BATCH] Erreur HTTP ${response.status}:`, errorText.substring(0, 200));
                    throw new Error(`Batch API error: ${response.status}`);
                }
                
                const batchData = await response.json();
                console.log(` [BATCH] Donnees recues:`, {
                    success: batchData.success,
                    resultsCount: batchData.results?.length || 0,
                    stats: batchData.stats
                });
                
                if (batchData.success && batchData.results) {
                    console.log(` [BATCH] Batch API reponse: ${batchData.results.length} resultats`);
                    batchData.results.forEach((result: any) => {
                        if (result.success && result.data) {
                            const dataLength = result.data.data ? result.data.data.length : 0;
                            if (dataLength > 0) {
                                console.log(` [BATCH] ${result.symbol}: ${dataLength} annees de donnees, currentDividend: ${result.data.currentDividend || 0}`);
                            } else {
                                console.log(` [BATCH] ${result.symbol}: Profile trouve mais ${dataLength} annees de donnees`);
                            }
                            //  Stocker la structure complete (result.data contient data, info, currentPrice, currentDividend)
                            results.set(result.symbol.toUpperCase(), result.data);
                        } else {
                            console.warn(` [BATCH] ${result.symbol}: Echec ou donnees manquantes (success: ${result.success}, hasData: ${!!result.data})`);
                        }
                    });
                    console.log(` [BATCH] Total resultats stockes dans Map: ${results.size}`);
                } else {
                    console.error(` [BATCH] Batch API reponse invalide:`, batchData);
                }
            } catch (error: any) {
                console.error(` [BATCH] Erreur batch fetch:`, error.message, error);
            }
            
            return results;
        };

        //  FONCTION HELPER: fetchCompanyData avec timeout (fallback pour tickers individuels)
        const fetchCompanyDataWithTimeout = async (tickerSymbol: string): Promise<any> => {
            return Promise.race([
                fetchCompanyData(tickerSymbol),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout apres 30000ms`)), 30000)
                )
            ]);
        };

        try {
            console.log(` Debut synchronisation avec options: ${allTickers.length} tickers en ${Math.ceil(allTickers.length / BATCH_API_SIZE)} batches API`);
            console.log(' Options de synchronisation:', options);
            
            // Traiter par batch API pour optimiser les appels FMP
            for (let i = 0; i < allTickers.length; i += BATCH_API_SIZE) {
                // 0. Check for Pause or Abort
                if (abortSync.current) {
                    console.log(' Synchronisation arretee par l\'utilisateur.');
                    break;
                }

                //  TIMEOUT GLOBAL: Verifier si on depasse le temps maximum
                const elapsedTime = Date.now() - startSyncTime;
                if (elapsedTime > MAX_SYNC_TIME_MS) {
                    console.warn(` Timeout global atteint (${MAX_SYNC_TIME_MS / 1000 / 60} min). Arret de la synchronisation.`);
                    console.warn(` Progression: ${i}/${allTickers.length} tickers traites (${Math.round(i / allTickers.length * 100)}%)`);
                    break;
                }

            while (isSyncPaused.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const batch = allTickers.slice(i, i + BATCH_API_SIZE).filter(t => t && t.trim()); //  FIX: Filtrer les tickers vides

            //  VALIDATION: Ignorer les batches vides
            if (batch.length === 0) {
                console.warn(` Batch vide detecte a l'index ${i}, ignore`);
                continue;
            }

            // Attendre entre les batches API
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }

            //  OPTIMISATION: Filtrer les tickers qui ont vraiment besoin de donnees FMP
            // Avant d'appeler l'API batch, verifier quels tickers ont vraiment besoin de donnees
            const { shouldFetchFromFMP } = await import('./utils/syncOptimization');
            const tickersNeedingFMP: string[] = [];
            
            // Verifier chaque ticker du batch en parallele
            await Promise.all(
                batch.map(async (tickerSymbol) => {
                    const profile = library[tickerSymbol];
                    if (!profile) {
                        // Pas de profil - besoin de FMP
                        tickersNeedingFMP.push(tickerSymbol);
                        return;
                    }
                    
                    const needsFMP = await shouldFetchFromFMP(
                        tickerSymbol,
                        profile.data,
                        profile.assumptions.currentPrice || 0,
                        profile.info,
                        {
                            syncData: options.syncData,
                            syncInfo: options.syncInfo,
                            updateCurrentPrice: options.updateCurrentPrice,
                            syncOnlyNewYears: options.syncOnlyNewYears,
                            syncOnlyMissingMetrics: options.syncOnlyMissingMetrics
                        }
                    );
                    
                    if (needsFMP) {
                        tickersNeedingFMP.push(tickerSymbol);
                    } else {
                        console.log(` ${tickerSymbol}: Skip FMP - donnees deja disponibles`);
                    }
                })
            );
            
            //  OPTIMISATION: Recuperer seulement les tickers qui en ont besoin
            // Inclure les key metrics seulement si syncData est active
            const includeKeyMetrics = options.syncData;
            let batchResults = new Map<string, any>();
            
            if (tickersNeedingFMP.length > 0) {
                console.log(` Recuperation batch ${i / BATCH_API_SIZE + 1}/${Math.ceil(allTickers.length / BATCH_API_SIZE)}: ${tickersNeedingFMP.length}/${batch.length} tickers necessitent FMP`);
                console.log(` [BATCH] Options: syncData=${options.syncData}, syncAssumptions=${options.syncAssumptions}, syncInfo=${options.syncInfo}, includeKeyMetrics=${includeKeyMetrics}`);
                batchResults = await fetchCompanyDataBatch(tickersNeedingFMP, includeKeyMetrics);
            } else {
                console.log(` Batch ${i / BATCH_API_SIZE + 1}: Tous les tickers ont deja leurs donnees, skip FMP`);
            }

            // Traiter chaque ticker du batch (meme ceux qui n'ont pas besoin de FMP pour les assumptions)
            await Promise.allSettled(
                batch.map(async (tickerSymbol) => {
                    const tickerStartTime = Date.now();
                    const TICKER_TIMEOUT_MS = 60000; // 60 secondes max par ticker
                    
                    // Wrapper avec timeout pour eviter qu'un ticker bloque indefiniment
                    return Promise.race([
                        (async () => {
                            let tickerResult: any = {
                        ticker: tickerSymbol,
                        success: false,
                        timeMs: 0,
                        dataRetrieved: {
                            years: 0,
                            dataPoints: 0,
                            hasProfile: false,
                            hasKeyMetrics: false,
                            hasQuotes: false,
                            hasFinancials: false
                        },
                        outliers: {
                            detected: [],
                            excluded: { EPS: false, CF: false, BV: false, DIV: false },
                            reasons: {}
                        },
                        orangeData: {
                            wasReplaced: options.replaceOrangeData || false
                        },
                        currentPrice: 0,
                        zeroData: {
                            earningsPerShare: 0,
                            cashFlowPerShare: 0,
                            bookValuePerShare: 0,
                            dividendPerShare: 0,
                            reasons: {}
                        },
                        naData: {
                            fields: [],
                            reasons: {}
                        },
                        other: {
                            snapshotSaved: false,
                            assumptionsUpdated: false,
                            infoUpdated: false,
                            valueLineMetricsSynced: false
                        }
                    };

                    try {
                        //  Mettre a jour le ticker actuel pour l'overlay
                        setCurrentSyncingTicker(tickerSymbol);
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));

                        const profile = library[tickerSymbol];
                        if (!profile) {
                            console.warn(` ${tickerSymbol}: Profil non trouve`);
                            tickerResult.error = 'Profil non trouve';
                            tickerResult.timeMs = Date.now() - tickerStartTime;
                            tickerResults.push(tickerResult);
                            return;
                        }

                        // 1. Sauvegarder un snapshot avant la sync (si option activee)
                        if (options.saveBeforeSync) {
                            console.log(` Sauvegarde snapshot pour ${tickerSymbol}...`);
                            try {
                                const saveResult = await saveSnapshot(
                                    tickerSymbol,
                                    profile.data,
                                    profile.assumptions,
                                    profile.info,
                                    `Avant synchronisation (${options.replaceOrangeData ? 'avec remplacement donnees oranges' : 'standard'}) - ${new Date().toLocaleString()}`,
                                    false,
                                    false
                                );
                                if (saveResult.success) {
                                    tickerResult.other.snapshotSaved = true;
                                } else {
                                    console.warn(` ${tickerSymbol}: Echec sauvegarde snapshot avant sync: ${saveResult.error}`);
                                    // Ne pas bloquer la synchronisation si la sauvegarde echoue
                                }
                            } catch (saveError: any) {
                                console.warn(` ${tickerSymbol}: Erreur lors de la sauvegarde snapshot avant sync: ${saveError.message}`);
                                // Ne pas bloquer la synchronisation si la sauvegarde echoue
                            }
                        }

                        // 2.  OPTIMISATION: Analyser les besoins avant d'appeler FMP
                        if (!options.syncData && !options.syncAssumptions && !options.syncInfo) {
                            console.log(` ${tickerSymbol}: Aucune option de sync activee, ignore`);
                            return;
                        }

                        //  Verifier si on a vraiment besoin d'appeler FMP
                        const { shouldFetchFromFMP, analyzeSyncNeeds } = await import('./utils/syncOptimization');
                        const needsFMP = await shouldFetchFromFMP(
                            tickerSymbol,
                            profile.data,
                            profile.assumptions.currentPrice || 0,
                            profile.info,
                            {
                                syncData: options.syncData,
                                syncInfo: options.syncInfo,
                                updateCurrentPrice: options.updateCurrentPrice,
                                syncOnlyNewYears: options.syncOnlyNewYears,
                                syncOnlyMissingMetrics: options.syncOnlyMissingMetrics
                            }
                        );

                        if (!needsFMP) {
                            console.log(` ${tickerSymbol}: Toutes les donnees necessaires deja disponibles, skip FMP`);
                            // Mettre a jour seulement les assumptions si necessaire (sans appeler FMP)
                            if (options.syncAssumptions && profile.data.length > 0) {
                                const { autoFillAssumptionsFromFMPData } = await import('./utils/calculations');
                                const updatedAssumptions = autoFillAssumptionsFromFMPData(
                                    profile.data,
                                    profile.assumptions.currentPrice || 0,
                                    profile.assumptions,
                                    undefined // Pas de dividende depuis API dans ce cas (skip FMP)
                                );
                                
                                setLibrary(prev => ({
                                    ...prev,
                                    [tickerSymbol]: {
                                        ...profile,
                                        assumptions: { ...profile.assumptions, ...updatedAssumptions },
                                        lastModified: Date.now()
                                    }
                                }));
                                
                                tickerResult.other.assumptionsUpdated = true;
                                successCount++;
                                tickerResult.success = true;
                                setSyncStats(prev => ({ ...prev, successCount: prev.successCount + 1 }));
                                console.log(` ${tickerSymbol}: Assumptions mises a jour sans appel FMP`);
                            }
                            return;
                        }

                        console.log(` Synchronisation ${tickerSymbol}...`);
                        let result;
                        
                        // Essayer d'abord le batch result
                        if (batchResults.has(tickerSymbol)) {
                            const batchResult = batchResults.get(tickerSymbol);
                            //  FIX: La structure batch est { data: [...], info: {...}, currentPrice: ..., currentDividend: ... }
                            // batchResult est deja la structure complete depuis result.data
                            result = {
                                data: batchResult?.data || [],
                                info: batchResult?.info || {},
                                currentPrice: batchResult?.currentPrice || 0,
                                currentDividend: batchResult?.currentDividend || 0, //  NOUVEAU: Dividende actuel depuis batch
                                financials: batchResult?.financials || [],
                                analysisData: batchResult?.analysisData || null
                            };
                            console.log(` ${tickerSymbol}: Donnees recuperees du batch (data.length: ${result?.data?.length || 0}, currentDividend: ${result.currentDividend})`);
                            
                            //  OPTIMISATION: Filtrer les donnees FMP si necessaire
                            if (options.syncOnlyNewYears || options.syncOnlyMissingMetrics) {
                                const { filterFMPDataForSync } = await import('./utils/syncOptimization');
                                result.data = filterFMPDataForSync(result.data, profile.data, {
                                    syncOnlyNewYears: options.syncOnlyNewYears,
                                    syncOnlyMissingMetrics: options.syncOnlyMissingMetrics
                                });
                                console.log(` ${tickerSymbol}: Donnees FMP filtrees - ${result.data.length} annees a traiter`);
                            }
                        } else {
                            console.warn(` ${tickerSymbol}: Pas dans les resultats du batch, fallback vers appel individuel`);
                            // Fallback: appel individuel si pas dans le batch
                            try {
                                result = await fetchCompanyDataWithTimeout(tickerSymbol);
                                
                                //  OPTIMISATION: Filtrer les donnees FMP si necessaire
                                if (result && result.data && (options.syncOnlyNewYears || options.syncOnlyMissingMetrics)) {
                                    const { filterFMPDataForSync } = await import('./utils/syncOptimization');
                                    result.data = filterFMPDataForSync(result.data, profile.data, {
                                        syncOnlyNewYears: options.syncOnlyNewYears,
                                        syncOnlyMissingMetrics: options.syncOnlyMissingMetrics
                                    });
                                    console.log(` ${tickerSymbol}: Donnees FMP filtrees - ${result.data.length} annees a traiter`);
                                }
                            } catch (fetchError: any) {
                                // Detecter si c'est une erreur de rate limiting
                                const isRateLimitError = fetchError.message && (
                                    fetchError.message.includes('Rate limit') ||
                                    fetchError.message.includes('rate limit') ||
                                    fetchError.message.includes('429')
                                );
                                
                                if (isRateLimitError) {
                                    // Rate limiting - propager l'erreur pour arreter la synchronisation
                                    errorCount++;
                                    const errorMsg = `${tickerSymbol}: ${fetchError.message}`;
                                    errors.push(errorMsg);
                                    setSyncStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
                                    console.error(` ${errorMsg}`);
                                    console.error(` Rate limiting detecte - La synchronisation peut etre ralentie ou interrompue.`);
                                    // Continuer avec les autres tickers mais avec un delai plus long
                                    await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes
                                    return;
                                }
                                
                                // Detecter si c'est une erreur 404 (ticker introuvable dans FMP)
                                const isNotFoundError = fetchError.message && (
                                    fetchError.message.includes('introuvable') ||
                                    fetchError.message.includes('not found') ||
                                    fetchError.message.includes('404')
                                );
                                
                                if (isNotFoundError) {
                                    // Ticker introuvable dans FMP - ignorer ce ticker
                                    skippedCount++;
                                    skippedTickers.push(tickerSymbol);
                                    console.warn(` ${tickerSymbol}: Ignore (introuvable dans FMP). ${fetchError.message}`);
                                    return; // Sortir de la fonction pour ce ticker
                                }
                                // Autre erreur - la propager pour etre geree par le catch externe
                                throw fetchError;
                            }
                        }
                        
                        // Verifier que les donnees sont valides avant de continuer
                        // Accepter les tickers avec au moins un profile, meme sans donnees historiques
                        if (!result || !result.data) {
                            skippedCount++;
                            skippedTickers.push(tickerSymbol);
                            console.warn(` ${tickerSymbol}: Ignore (resultat invalide)`);
                            tickerResult.error = 'Resultat invalide';
                            tickerResult.timeMs = Date.now() - tickerStartTime;
                            tickerResults.push(tickerResult);
                            return; // Sortir de la fonction pour ce ticker
                        }
                        
                        // Si pas de donnees historiques mais profile disponible, synchroniser au moins les infos
                        if (result.data.length === 0) {
                            if (result.info && options.syncInfo) {
                                // Synchroniser au moins les informations du profile
                                console.log(`i ${tickerSymbol}: Profile trouve mais aucune donnee historique. Synchronisation des infos uniquement.`);
                                
                                // Mettre a jour les infos dans le profile
                                const updatedProfile = {
                                    ...profile,
                                    info: result.info
                                };
                                
                                // Mettre a jour le prix actuel dans les assumptions si disponible
                                if (result.currentPrice && options.updateCurrentPrice) {
                                    updatedProfile.assumptions = {
                                        ...profile.assumptions,
                                        currentPrice: result.currentPrice
                                    };
                                    tickerResult.currentPrice = result.currentPrice;
                                } else {
                                    tickerResult.currentPrice = result.currentPrice || profile.assumptions.currentPrice || 0;
                                }
                                
                                // Mettre a jour le library
                                setLibrary(prev => ({
                                    ...prev,
                                    [tickerSymbol]: updatedProfile
                                }));
                                
                                tickerResult.other.infoUpdated = true;
                                tickerResult.success = true;
                                tickerResult.dataRetrieved = {
                                    years: 0,
                                    dataPoints: 0,
                                    hasProfile: !!result.info,
                                    hasKeyMetrics: false,
                                    hasQuotes: !!(result.currentPrice && result.currentPrice > 0),
                                    hasFinancials: false
                                };
                                tickerResult.error = 'Aucune donnee historique disponible (infos synchronisees)';
                                tickerResult.timeMs = Date.now() - tickerStartTime;
                                tickerResults.push(tickerResult);
                                return;
                            } else {
                                // Pas de profile non plus, ignorer completement
                                skippedCount++;
                                skippedTickers.push(tickerSymbol);
                                console.warn(` ${tickerSymbol}: Ignore (aucune donnee disponible)`);
                                tickerResult.error = 'Aucune donnee disponible';
                                tickerResult.timeMs = Date.now() - tickerStartTime;
                                tickerResults.push(tickerResult);
                                return; // Sortir de la fonction pour ce ticker
                            }
                        }

                        //  Collecter les informations sur les donnees recuperees
                        tickerResult.dataRetrieved = {
                            years: result.data?.length || 0,
                            dataPoints: result.data?.length || 0,
                            hasProfile: !!result.info,
                            hasKeyMetrics: !!(result.data && result.data.length > 0),
                            hasQuotes: !!(result.currentPrice && result.currentPrice > 0),
                            hasFinancials: !!(result.financials && result.financials.length > 0)
                        };
                        tickerResult.currentPrice = result.currentPrice || 0;

                        // 3. Merge intelligent : preserver les donnees manuelles (sauf si forceReplace)
                        let mergedData = profile.data;
                        if (options.syncData && result.data.length > 0) {
                            const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                            
                                // Si syncOnlyNewYears, ne traiter que les nouvelles annees
                                if (options.syncOnlyNewYears) {
                                    result.data.forEach(newRow => {
                                        const exists = mergedData.some(row => row.year === newRow.year);
                                        if (!exists) {
                                            mergedData.push({
                                                ...(newRow as AnnualData),
                                                autoFetched: true,
                                                dataSource: 'fmp-verified' as const //  Nouvelle annee directement de FMP = verifiee
                                            });
                                        }
                                    });
                                } else {
                                    // Traitement normal : mettre a jour toutes les annees
                                    mergedData = profile.data.map((existingRow) => {
                                        const newRow = newDataByYear.get(existingRow.year);
                                        if (!newRow) return existingRow;
                                        
                                        // Si forceReplace est true, remplacer toutes les donnees (donnees FMP verifiees)
                                        if (options.forceReplace) {
                                            return {
                                                ...(newRow as AnnualData),
                                                autoFetched: true,
                                                dataSource: 'fmp-verified' as const //  Force replace = donnees FMP verifiees
                                            };
                                        }
                                        
                                        // Si syncOnlyMissingMetrics, ne remplir que les champs vides (donnees ajustees)
                                        if (options.syncOnlyMissingMetrics) {
                                            const updatedRow = { ...existingRow };
                                            const typedNewRow = newRow as AnnualData;
                                            let hasAdjustment = false;
                                            // Mettre a jour uniquement les champs qui sont 0, null ou undefined
                                            if ((existingRow.earningsPerShare === 0 || existingRow.earningsPerShare === null || existingRow.earningsPerShare === undefined) && typedNewRow.earningsPerShare > 0) {
                                                updatedRow.earningsPerShare = typedNewRow.earningsPerShare;
                                                hasAdjustment = true;
                                            }
                                            if ((existingRow.cashFlowPerShare === 0 || existingRow.cashFlowPerShare === null || existingRow.cashFlowPerShare === undefined) && typedNewRow.cashFlowPerShare > 0) {
                                                updatedRow.cashFlowPerShare = typedNewRow.cashFlowPerShare;
                                                hasAdjustment = true;
                                            }
                                            if ((existingRow.bookValuePerShare === 0 || existingRow.bookValuePerShare === null || existingRow.bookValuePerShare === undefined) && typedNewRow.bookValuePerShare > 0) {
                                                updatedRow.bookValuePerShare = typedNewRow.bookValuePerShare;
                                                hasAdjustment = true;
                                            }
                                            if ((existingRow.dividendPerShare === 0 || existingRow.dividendPerShare === null || existingRow.dividendPerShare === undefined) && typedNewRow.dividendPerShare > 0) {
                                                updatedRow.dividendPerShare = typedNewRow.dividendPerShare;
                                                hasAdjustment = true;
                                            }
                                            if ((existingRow.priceHigh === 0 || existingRow.priceHigh === null || existingRow.priceHigh === undefined) && typedNewRow.priceHigh > 0) {
                                                updatedRow.priceHigh = typedNewRow.priceHigh;
                                                hasAdjustment = true;
                                            }
                                            if ((existingRow.priceLow === 0 || existingRow.priceLow === null || existingRow.priceLow === undefined) && typedNewRow.priceLow > 0) {
                                                updatedRow.priceLow = typedNewRow.priceLow;
                                                hasAdjustment = true;
                                            }
                                            // Si on a fait des ajustements, marquer comme ajuste
                                            if (hasAdjustment) {
                                                updatedRow.dataSource = 'fmp-adjusted' as const;
                                            }
                                            return updatedRow;
                                        }
                                        
                                        // Si la donnee existante est manuelle, la garder
                                        if (existingRow.autoFetched === false || existingRow.dataSource === 'manual') {
                                            return existingRow;
                                        }
                                        
                                        // Sinon, merger avec preservation des valeurs existantes (donnees ajustees)
                                        //  CRITIQUE : Ne pas remplacer les valeurs existantes par des valeurs a 0
                                        const typedNewRow = newRow as AnnualData;
                                        const hasPreservedValues = 
                                            (typedNewRow.earningsPerShare <= 0 && existingRow.earningsPerShare > 0) ||
                                            (typedNewRow.cashFlowPerShare <= 0 && existingRow.cashFlowPerShare > 0) ||
                                            (typedNewRow.bookValuePerShare <= 0 && existingRow.bookValuePerShare > 0) ||
                                            (typedNewRow.dividendPerShare <= 0 && existingRow.dividendPerShare > 0) ||
                                            (typedNewRow.priceHigh <= 0 && existingRow.priceHigh > 0) ||
                                            (typedNewRow.priceLow <= 0 && existingRow.priceLow > 0);
                                        
                                        //  PRESERVER LE DATASOURCE ORIGINAL SI FMP-VERIFIED ET PAS DE PRESERVATION
                                        let finalDataSource: 'fmp-verified' | 'fmp-adjusted' | 'manual' | 'calculated';
                                        if (hasPreservedValues) {
                                            finalDataSource = 'fmp-adjusted' as const;
                                        } else if (existingRow.dataSource === 'fmp-verified') {
                                            finalDataSource = 'fmp-verified' as const;
                                        } else {
                                            finalDataSource = 'fmp-verified' as const;
                                        }
                                        
                                        return {
                                            ...existingRow,
                                            earningsPerShare: (typedNewRow.earningsPerShare > 0) ? typedNewRow.earningsPerShare : existingRow.earningsPerShare,
                                            cashFlowPerShare: (typedNewRow.cashFlowPerShare > 0) ? typedNewRow.cashFlowPerShare : existingRow.cashFlowPerShare,
                                            bookValuePerShare: (typedNewRow.bookValuePerShare > 0) ? typedNewRow.bookValuePerShare : existingRow.bookValuePerShare,
                                            dividendPerShare: (typedNewRow.dividendPerShare > 0) ? typedNewRow.dividendPerShare : existingRow.dividendPerShare,
                                            priceHigh: (typedNewRow.priceHigh > 0) ? typedNewRow.priceHigh : existingRow.priceHigh,
                                            priceLow: (typedNewRow.priceLow > 0) ? typedNewRow.priceLow : existingRow.priceLow,
                                            autoFetched: true,
                                            dataSource: finalDataSource //  Preserve 'fmp-verified' si les donnees n'ont pas ete modifiees
                                        };
                                    });

                                    // Ajouter les nouvelles annees (donnees FMP verifiees)
                                    result.data.forEach(newRow => {
                                        const exists = mergedData.some(row => row.year === newRow.year);
                                        if (!exists) {
                                            mergedData.push({
                                                ...(newRow as AnnualData),
                                                autoFetched: true,
                                                dataSource: 'fmp-verified' as const //  Nouvelle annee directement de FMP = verifiee
                                            });
                                        }
                                    });
                                }

                            mergedData.sort((a, b) => a.year - b.year);
                        }

                        // 4. Recalculer les metriques (si option activee)
                        let finalAssumptions = profile.assumptions;
                        if (options.syncAssumptions) {
                            // Si replaceOrangeData est true, passer undefined pour forcer le recalcul
                            const existingAssumptionsForCalc = options.replaceOrangeData ? undefined : profile.assumptions;
                            // Si updateCurrentPrice est false, preserver le prix actuel
                            const currentPriceForCalc = options.updateCurrentPrice ? result.currentPrice : profile.assumptions.currentPrice;
                            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                                mergedData,
                                currentPriceForCalc,
                                existingAssumptionsForCalc,
                                result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
                            );

                            // Detecter les outliers (si option activee)
                            const tempAssumptions = {
                                ...profile.assumptions,
                                ...autoFilledAssumptions
                            } as Assumptions;
                            
                            let outlierDetection = { 
                                detectedOutliers: [], 
                                excludeEPS: profile.assumptions.excludeEPS || false,
                                excludeCF: profile.assumptions.excludeCF || false,
                                excludeBV: profile.assumptions.excludeBV || false,
                                excludeDIV: profile.assumptions.excludeDIV || false
                            };
                            
                            if (options.recalculateOutliers) {
                                outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
                                
                                if (outlierDetection.detectedOutliers.length > 0) {
                                    console.log(` ${tickerSymbol}: Metriques avec prix cibles aberrants detectees: ${outlierDetection.detectedOutliers.join(', ')}`);
                                    
                                    //  Collecter les informations sur les outliers
                                    tickerResult.outliers.detected = outlierDetection.detectedOutliers;
                                    tickerResult.outliers.excluded = {
                                        EPS: outlierDetection.excludeEPS,
                                        CF: outlierDetection.excludeCF,
                                        BV: outlierDetection.excludeBV,
                                        DIV: outlierDetection.excludeDIV
                                    };
                                    
                                    // Calculer les raisons pour chaque outlier
                                    const currentPrice = tempAssumptions.currentPrice || 1;
                                    const calculateTargetPrice = (metric: string) => {
                                        // Cette logique devrait correspondre a calculateTargetPrices dans outlierDetection
                                        // Pour simplifier, on utilise les prix cibles calcules
                                        return 0; // Sera calcule plus bas
                                    };
                                    
                                    outlierDetection.detectedOutliers.forEach(metric => {
                                        const isExcluded = tickerResult.outliers.excluded[metric as keyof typeof tickerResult.outliers.excluded];
                                        if (isExcluded) {
                                            tickerResult.outliers.reasons[metric] = 'Prix cible aberrant detecte (>1.5 ou retour implausible)';
                                        }
                                    });
                                }
                            }

                            finalAssumptions = {
                                ...tempAssumptions,
                                // Preserver les exclusions si l'option est activee
                                excludeEPS: options.preserveExclusions ? (profile.assumptions.excludeEPS || outlierDetection.excludeEPS) : outlierDetection.excludeEPS,
                                excludeCF: options.preserveExclusions ? (profile.assumptions.excludeCF || outlierDetection.excludeCF) : outlierDetection.excludeCF,
                                excludeBV: options.preserveExclusions ? (profile.assumptions.excludeBV || outlierDetection.excludeBV) : outlierDetection.excludeBV,
                                excludeDIV: options.preserveExclusions ? (profile.assumptions.excludeDIV || outlierDetection.excludeDIV) : outlierDetection.excludeDIV
                            } as Assumptions;
                            
                            //  Collecter les informations sur les cases oranges
                            tickerResult.orangeData = {
                                growthRateEPS: finalAssumptions.growthRateEPS,
                                growthRateCF: finalAssumptions.growthRateCF,
                                growthRateBV: finalAssumptions.growthRateBV,
                                growthRateDiv: finalAssumptions.growthRateDiv,
                                targetPE: finalAssumptions.targetPE,
                                targetPCF: finalAssumptions.targetPCF,
                                targetPBV: finalAssumptions.targetPBV,
                                targetYield: finalAssumptions.targetYield,
                                wasReplaced: options.replaceOrangeData || false
                            };
                            tickerResult.other.assumptionsUpdated = true;
                        }

                        // 5. Mettre a jour le profil
                        let updatedInfo = profile.info;
                        if (options.syncInfo && result.info) {
                            updatedInfo = {
                                ...profile.info,
                                ...result.info,
                                name: result.info.name || profile.info.name
                            };
                            tickerResult.other.infoUpdated = true;
                            
                            // Synchroniser les metriques ValueLine depuis Supabase (si option activee)
                            //  OPTIMISATION: Utiliser le cache au lieu d'appeler l'API pour chaque ticker
                            if (options.syncValueLineMetrics && supabaseTickersCache) {
                                try {
                                    const supabaseTicker = supabaseTickersCache.find(t => t.ticker.toUpperCase() === tickerSymbol);
                                    if (supabaseTicker) {
                                            updatedInfo = {
                                                ...updatedInfo,
                                                securityRank: supabaseTicker.security_rank !== null && supabaseTicker.security_rank !== undefined
                                                    ? supabaseTicker.security_rank
                                                    : (updatedInfo.securityRank || 'N/A'),
                                                earningsPredictability: supabaseTicker.earnings_predictability !== null && supabaseTicker.earnings_predictability !== undefined
                                                    ? supabaseTicker.earnings_predictability
                                                    : updatedInfo.earningsPredictability,
                                                priceGrowthPersistence: supabaseTicker.price_growth_persistence !== null && supabaseTicker.price_growth_persistence !== undefined
                                                    ? supabaseTicker.price_growth_persistence
                                                    : updatedInfo.priceGrowthPersistence,
                                                priceStability: supabaseTicker.price_stability !== null && supabaseTicker.price_stability !== undefined
                                                    ? supabaseTicker.price_stability
                                                    : updatedInfo.priceStability
                                            };
                                            tickerResult.other.valueLineMetricsSynced = true;
                                        }
                                } catch (error) {
                                    console.warn(` Impossible de recharger les metriques ValueLine pour ${tickerSymbol}:`, error);
                                }
                            }
                        }

                        setLibrary(prev => {
                            const updated = {
                                ...prev,
                                [tickerSymbol]: {
                                    ...profile,
                                    data: mergedData,
                                    info: updatedInfo,
                                    assumptions: finalAssumptions,
                                    lastModified: Date.now()
                                }
                            };

                            // Sauvegarder avec IndexedDB (evite QuotaExceededError)
                            //  Sauvegarder dans Supabase ET cache local
                            saveProfiles(updated, true).catch(e => {
                                console.warn('Failed to save profiles:', e);
                            });

                            return updated;
                        });

                        //  Analyser les donnees pour le rapport
                        // Compter les donnees a zero
                        const zeroCounts = {
                            earningsPerShare: mergedData.filter(d => d.earningsPerShare === 0 || d.earningsPerShare === null).length,
                            cashFlowPerShare: mergedData.filter(d => d.cashFlowPerShare === 0 || d.cashFlowPerShare === null).length,
                            bookValuePerShare: mergedData.filter(d => d.bookValuePerShare === 0 || d.bookValuePerShare === null).length,
                            dividendPerShare: mergedData.filter(d => d.dividendPerShare === 0 || d.dividendPerShare === null).length
                        };
                        
                        tickerResult.zeroData = {
                            earningsPerShare: zeroCounts.earningsPerShare,
                            cashFlowPerShare: zeroCounts.cashFlowPerShare,
                            bookValuePerShare: zeroCounts.bookValuePerShare,
                            dividendPerShare: zeroCounts.dividendPerShare,
                            reasons: {
                                earningsPerShare: zeroCounts.earningsPerShare > 0 ? `${zeroCounts.earningsPerShare} annees avec EPS a 0 (pertes ou donnees manquantes)` : '',
                                cashFlowPerShare: zeroCounts.cashFlowPerShare > 0 ? `${zeroCounts.cashFlowPerShare} annees avec CF a 0 (CF negatif ou donnees manquantes)` : '',
                                bookValuePerShare: zeroCounts.bookValuePerShare > 0 ? `${zeroCounts.bookValuePerShare} annees avec BV a 0 (BV negatif ou donnees manquantes)` : '',
                                dividendPerShare: zeroCounts.dividendPerShare > 0 ? `${zeroCounts.dividendPerShare} annees avec DIV a 0 (pas de dividende ou donnees manquantes)` : ''
                            }
                        };
                        
                        // Detecter les donnees N/A
                        const naFields: string[] = [];
                        const naReasons: { [key: string]: string } = {};
                        
                        if (!tickerResult.currentPrice || tickerResult.currentPrice === 0) {
                            naFields.push('currentPrice');
                            naReasons.currentPrice = 'Prix actuel non disponible dans FMP';
                        }
                        
                        if (mergedData.length === 0) {
                            naFields.push('annualData');
                            naReasons.annualData = 'Aucune donnee historique disponible';
                        }
                        
                        if (!finalAssumptions.growthRateEPS && !finalAssumptions.growthRateCF) {
                            naFields.push('assumptions');
                            naReasons.assumptions = 'Impossible de calculer assumptions (donnees insuffisantes)';
                        }
                        
                        tickerResult.naData = {
                            fields: naFields,
                            reasons: naReasons
                        };

                        // 6. Sauvegarder le snapshot apres sync avec metadonnees detaillees
                        try {
                            // Preparer les metadonnees de synchronisation
                            const syncMetadata = {
                                timestamp: new Date().toISOString(),
                                source: 'fmp',
                                dataRetrieved: tickerResult.dataRetrieved,
                                outliers: tickerResult.outliers,
                                orangeData: tickerResult.orangeData,
                                zeroData: tickerResult.zeroData,
                                naData: tickerResult.naData,
                                other: tickerResult.other,
                                options: options,
                                duration: tickerResult.timeMs,
                                success: tickerResult.success,
                                error: tickerResult.error
                            };

                            const saveResult = await saveSnapshot(
                                tickerSymbol,
                                mergedData,
                                finalAssumptions,
                                updatedInfo,
                                `Apres synchronisation (${options.replaceOrangeData ? 'avec remplacement donnees oranges' : 'standard'}) - ${new Date().toLocaleString()}`,
                                true,
                                true,
                                0, // retryCount
                                2, // maxRetries
                                syncMetadata // Metadonnees de synchronisation
                            );
                            if (saveResult.success) {
                                tickerResult.other.snapshotSaved = true;
                            } else {
                                console.warn(` ${tickerSymbol}: Echec sauvegarde snapshot apres sync: ${saveResult.error}`);
                                // Ne pas bloquer la synchronisation si la sauvegarde echoue
                            }
                        } catch (saveError: any) {
                            console.warn(` ${tickerSymbol}: Erreur lors de la sauvegarde snapshot apres sync: ${saveError.message}`);
                            // Ne pas bloquer la synchronisation si la sauvegarde echoue
                        }

                        successCount++;
                        tickerResult.success = true;
                        tickerResult.timeMs = Date.now() - tickerStartTime;
                        tickerResults.push(tickerResult);
                        setSyncStats(prev => ({ ...prev, successCount: prev.successCount + 1 }));
                        console.log(` ${tickerSymbol}: Synchronise avec succes`);
                    } catch (error: any) {
                        errorCount++;
                        const errorMsg = `${tickerSymbol}: ${error.message || String(error)}`;
                        errors.push(errorMsg);
                        tickerResult.success = false;
                        tickerResult.error = error.message || String(error);
                        tickerResult.timeMs = Date.now() - tickerStartTime;
                        tickerResults.push(tickerResult);
                        setSyncStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
                        console.error(` ${errorMsg}`);
                    }
                        })(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error(`Timeout apres ${TICKER_TIMEOUT_MS / 1000}s`)), TICKER_TIMEOUT_MS)
                        )
                    ]).catch((timeoutError: any) => {
                        // Si timeout, enregistrer comme erreur mais continuer
                        errorCount++;
                        const errorMsg = `${tickerSymbol}: ${timeoutError.message || 'Timeout'}`;
                        errors.push(errorMsg);
                        const tickerResult: any = {
                            ticker: tickerSymbol,
                            success: false,
                            error: timeoutError.message || 'Timeout',
                            timeMs: Date.now() - tickerStartTime,
                            dataRetrieved: { years: 0, dataPoints: 0, hasProfile: false, hasKeyMetrics: false, hasQuotes: false, hasFinancials: false },
                            outliers: { detected: [], excluded: { EPS: false, CF: false, BV: false, DIV: false }, reasons: {} },
                            orangeData: { wasReplaced: false },
                            currentPrice: 0,
                            zeroData: { earningsPerShare: 0, cashFlowPerShare: 0, bookValuePerShare: 0, dividendPerShare: 0, reasons: {} },
                            naData: { fields: [], reasons: {} },
                            other: { snapshotSaved: false, assumptionsUpdated: false, infoUpdated: false, valueLineMetricsSynced: false }
                        };
                        tickerResults.push(tickerResult);
                        setSyncStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
                        //  Log timeout seulement en mode debug pour eviter spam console
                        const isDebugMode = typeof window !== 'undefined' && (localStorage.getItem('3p1-debug') === 'true' || window.location.search.includes('debug=true'));
                        if (isDebugMode) {
                            console.warn(` ${errorMsg}`);
                        }
                    });
                })
            );
            }

            //  Generer le rapport de synchronisation
            const endTime = Date.now();
            const totalDataPoints = tickerResults
                .filter(r => r.success)
                .reduce((sum, r) => sum + (r.dataRetrieved?.dataPoints || 0), 0);
            const totalOutliersDetected = tickerResults
                .filter(r => r.success)
                .reduce((sum, r) => sum + (r.outliers?.detected?.length || 0), 0);
            const totalOrangeDataReplaced = tickerResults
                .filter(r => r.success && r.orangeData?.wasReplaced)
                .length;
            const avgTimePerTicker = tickerResults.length > 0
                ? tickerResults.reduce((sum, r) => sum + r.timeMs, 0) / tickerResults.length
                : 0;

            const reportData = {
                startTime,
                endTime,
                totalTickers: allTickers.length,
                successCount,
                errorCount,
                skippedCount,
                options,
                tickerResults,
                globalStats: {
                    avgTimePerTicker,
                    totalDataPoints,
                    totalOutliersDetected,
                    totalOrangeDataReplaced
                }
            };

            // Afficher un resume detaille
            const totalProcessed = successCount + errorCount + skippedCount;
            const totalTickersProcessed = tickerResults.length;
            
            //  VERIFICATION 100%: S'assurer que tous les tickers ont ete traites
            if (totalTickersProcessed < allTickers.length) {
                const missingCount = allTickers.length - totalTickersProcessed;
                console.warn(` ATTENTION: ${missingCount} ticker(s) non traite(s) sur ${allTickers.length} total`);
                // Les tickers manquants sont probablement ceux qui n'ont pas ete ajoutes a tickerResults
                // (ex: timeout avant meme d'arriver au try/catch)
            }
            
            let summary = `Synchronisation terminee:\n ${successCount} succes`;
            
            if (skippedCount > 0) {
                summary += `\n ${skippedCount} ignores (introuvables dans FMP)`;
            }
            
            if (errorCount > 0) {
                summary += `\n ${errorCount} erreurs`;
            }
            
            //  AFFICHER LE TOTAL TRAITE pour confirmer 100%
            summary += `\n Total traite: ${totalTickersProcessed}/${allTickers.length} (${Math.round(totalTickersProcessed / allTickers.length * 100)}%)`;
            
            if (totalTickersProcessed === allTickers.length) {
                console.log(` 100% des tickers traites (${totalTickersProcessed}/${allTickers.length})`);
            } else {
                console.warn(` ${totalTickersProcessed}/${allTickers.length} tickers traites (${Math.round(totalTickersProcessed / allTickers.length * 100)}%)`);
            }
            
            // Log detaille
            if (skippedCount > 0) {
                console.warn(` Tickers ignores (introuvables dans FMP):\n${skippedTickers.slice(0, 20).join(', ')}${skippedTickers.length > 20 ? `\n... et ${skippedTickers.length - 20} autres` : ''}`);
            }
            
            if (errorCount > 0) {
                console.warn(` Erreurs:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... et ${errors.length - 10} autres` : ''}`);
            }
            
            // Notification avec bouton pour voir le rapport
            const notificationId = `bulk-sync-${Date.now()}`;
            if (errorCount > 0 || skippedCount > 0) {
                const notificationMessage = skippedCount > 0 && errorCount === 0
                    ? `${summary}\n\n${skippedTickers.length} ticker(s) ignore(s) car introuvable(s) dans FMP.`
                    : `${summary}\n\nVoir la console pour les details.`;
                
                setNotifications(prev => [...prev, {
                    id: notificationId,
                    message: notificationMessage,
                    type: skippedCount > 0 && errorCount === 0 ? 'warning' : 'error',
                    action: {
                        label: 'Voir Rapport Detaille',
                        onClick: () => {
                            setSyncReportData(reportData);
                            setShowSyncReport(true);
                        }
                    }
                }]);
            } else {
                console.log(` ${summary}`);
                setNotifications(prev => [...prev, {
                    id: notificationId,
                    message: summary,
                    type: 'success',
                    action: {
                        label: 'Voir Rapport Detaille',
                        onClick: () => {
                            setSyncReportData(reportData);
                            setShowSyncReport(true);
                        }
                    }
                }]);
            }
            
            //  Toujours afficher le rapport apres synchronisation
            setSyncReportData(reportData);
            setShowSyncReport(true);
        } catch (error: any) {
            console.error(' Erreur lors de la synchronisation en masse:', error);
            setNotifications(prev => [...prev, {
                id: `bulk-sync-error-${Date.now()}`,
                message: `Erreur lors de la synchronisation: ${error.message || String(error)}`,
                type: 'error'
            }]);
        } finally {
            setIsBulkSyncing(false);
            setBulkSyncProgress({ current: 0, total: 0 });
            setCurrentSyncingTicker(undefined); //  Reinitialiser le ticker actuel
        }
    };

    // Synchroniser uniquement une liste specifique de tickers (ex: ceux avec N/A)
    const handleSyncSpecificTickers = async (tickersToSync: string[]) => {
        if (tickersToSync.length === 0) {
            showNotification('Aucun ticker a synchroniser', 'warning');
            return;
        }

        if (!confirm(`Synchroniser ${tickersToSync.length} ticker(s) avec N/A ?\n\nTickers: ${tickersToSync.slice(0, 10).join(', ')}${tickersToSync.length > 10 ? `\n... et ${tickersToSync.length - 10} autres` : ''}\n\nChaque version sera sauvegardee avant la synchronisation.\nLes donnees manuelles et hypotheses (orange) seront preservees.`)) {
            return;
        }

        setIsBulkSyncing(true);
        setBulkSyncProgress({ current: 0, total: tickersToSync.length });
        setSyncStats({ successCount: 0, errorCount: 0 });

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Traiter par batch pour eviter de surcharger
        const batchSize = 3;
        const delayBetweenBatches = 1000;
        //  TIMEOUT: Timeout pour chaque appel FMP (30 secondes)
        const FMP_TIMEOUT_MS = 30000;

        //  FONCTION HELPER: fetchCompanyData avec timeout
        const fetchCompanyDataWithTimeout = async (tickerSymbol: string): Promise<any> => {
            return Promise.race([
                fetchCompanyData(tickerSymbol),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout apres ${FMP_TIMEOUT_MS}ms`)), FMP_TIMEOUT_MS)
                )
            ]);
        };

        try {
            console.log(` Debut synchronisation specifique: ${tickersToSync.length} tickers`);
            
            for (let i = 0; i < tickersToSync.length; i += batchSize) {
            const batch = tickersToSync.slice(i, i + batchSize);

            // Attendre entre les batches
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }

            // Traiter le batch en parallele (meme logique que handleBulkSyncAllTickers)
            await Promise.allSettled(
                batch.map(async (tickerSymbol) => {
                    try {
                        //  Mettre a jour le ticker actuel pour l'overlay
                        setCurrentSyncingTicker(tickerSymbol);
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));

                        const profile = library[tickerSymbol];
                        if (!profile) {
                            console.warn(` ${tickerSymbol}: Profil non trouve`);
                            return;
                        }

                        // 1. Sauvegarder un snapshot avant la sync
                        console.log(` Sauvegarde snapshot pour ${tickerSymbol}...`);
                        try {
                            const saveResult = await saveSnapshot(
                                tickerSymbol,
                                profile.data,
                                profile.assumptions,
                                profile.info,
                                `Avant synchronisation (N/A) - ${new Date().toLocaleString()}`,
                                false,
                                false
                            );
                            if (!saveResult.success) {
                                console.warn(` ${tickerSymbol}: Echec sauvegarde snapshot avant sync: ${saveResult.error}`);
                            }
                        } catch (saveError: any) {
                            console.warn(` ${tickerSymbol}: Erreur lors de la sauvegarde snapshot avant sync: ${saveError.message}`);
                        }

                        // 2. Charger les nouvelles donnees FMP avec timeout
                        console.log(` Synchronisation ${tickerSymbol}...`);
                        const result = await fetchCompanyDataWithTimeout(tickerSymbol);

                        // 3. Merge intelligent : preserver les donnees manuelles
                        const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                        
                        const mergedData = profile.data.map((existingRow) => {
                            const newRow = newDataByYear.get(existingRow.year);
                            if (!newRow) return existingRow;
                            if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                                return existingRow;
                            }
                            //  CRITIQUE : Ne pas remplacer les valeurs existantes par des valeurs a 0
                            const newRowTyped = newRow as AnnualData;
                            return {
                                ...existingRow,
                                earningsPerShare: (newRowTyped.earningsPerShare > 0) ? newRowTyped.earningsPerShare : existingRow.earningsPerShare,
                                cashFlowPerShare: (newRowTyped.cashFlowPerShare > 0) ? newRowTyped.cashFlowPerShare : existingRow.cashFlowPerShare,
                                bookValuePerShare: (newRowTyped.bookValuePerShare > 0) ? newRowTyped.bookValuePerShare : existingRow.bookValuePerShare,
                                dividendPerShare: (newRowTyped.dividendPerShare > 0) ? newRowTyped.dividendPerShare : existingRow.dividendPerShare,
                                priceHigh: (newRowTyped.priceHigh > 0) ? newRowTyped.priceHigh : existingRow.priceHigh,
                                priceLow: (newRowTyped.priceLow > 0) ? newRowTyped.priceLow : existingRow.priceLow,
                                autoFetched: true
                            };
                        });

                        // Ajouter les nouvelles annees
                        result.data.forEach(newRow => {
                            const exists = mergedData.some(row => row.year === newRow.year);
                            if (!exists) {
                                mergedData.push({
                                    ...(newRow as AnnualData),
                                    autoFetched: true
                                });
                            }
                        });

                        mergedData.sort((a, b) => a.year - b.year);

                        // 4. Recalculer les metriques
                        const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                            mergedData,
                            result.currentPrice,
                            profile.assumptions,
                            result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
                        );

                        // 5. Detecter les outliers
                        const tempAssumptions = {
                            ...profile.assumptions,
                            ...autoFilledAssumptions
                        } as Assumptions;
                        const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
                        
                        if (outlierDetection.detectedOutliers.length > 0) {
                            console.log(` ${tickerSymbol}: Metriques avec prix cibles aberrants detectees: ${outlierDetection.detectedOutliers.join(', ')}`);
                        }

                        const finalAssumptions: Assumptions = {
                            ...tempAssumptions,
                            excludeEPS: outlierDetection.excludeEPS,
                            excludeCF: outlierDetection.excludeCF,
                            excludeBV: outlierDetection.excludeBV,
                            excludeDIV: outlierDetection.excludeDIV
                        } as Assumptions;

                        // 6. Mettre a jour le profil
                        setLibrary(prev => {
                            const updated = {
                                ...prev,
                                [tickerSymbol]: {
                                    ...profile,
                                    data: mergedData,
                                    info: {
                                        ...profile.info,
                                        ...result.info,
                                        name: result.info.name || profile.info.name
                                    },
                                    assumptions: finalAssumptions,
                                    lastModified: Date.now()
                                }
                            };

                            // Sauvegarder avec IndexedDB (evite QuotaExceededError)
                            //  Sauvegarder dans Supabase ET cache local
                            saveProfiles(updated, true).catch(e => {
                                console.warn('Failed to save profiles:', e);
                            });

                            return updated;
                        });

                        // 7. Sauvegarder le snapshot apres sync
                        try {
                            const saveResult = await saveSnapshot(
                                tickerSymbol,
                                mergedData,
                                finalAssumptions,
                                {
                                    ...profile.info,
                                    ...result.info
                                },
                                `Synchronisation (N/A) - ${new Date().toLocaleString()}`,
                                true,
                                true
                            );
                            if (!saveResult.success) {
                                console.warn(` ${tickerSymbol}: Echec sauvegarde snapshot apres sync: ${saveResult.error}`);
                            }
                        } catch (saveError: any) {
                            console.warn(` ${tickerSymbol}: Erreur lors de la sauvegarde snapshot apres sync: ${saveError.message}`);
                        }

                        successCount++;
                        setSyncStats({ successCount, errorCount });
                        console.log(` ${tickerSymbol} synchronise avec succes`);

                    } catch (error: any) {
                        errorCount++;
                        setSyncStats({ successCount, errorCount });
                        const errorMsg = `${tickerSymbol}: ${error.message || 'Erreur inconnue'}`;
                        errors.push(errorMsg);
                        console.error(` Erreur sync ${tickerSymbol}:`, error);
                    }
                })
            );
            }

            console.log(` Synchronisation specifique terminee: ${successCount} succes, ${errorCount} erreurs`);
        } catch (error: any) {
            //  GESTION ERREUR GLOBALE: S'assurer que le sync se termine meme en cas d'erreur fatale
            console.error(' Erreur fatale pendant la synchronisation specifique:', error);
            errorCount++;
            errors.push(`Erreur fatale: ${error.message || 'Erreur inconnue'}`);
        } finally {
            //  GARANTIE: Toujours reinitialiser l'etat, meme en cas d'erreur
            setIsBulkSyncing(false);
            setBulkSyncProgress({ current: 0, total: 0 });
            setCurrentSyncingTicker(undefined); //  Reinitialiser le ticker actuel

            // Afficher le resultat
            const message = `Synchronisation terminee\n\n` +
                `Reussies: ${successCount}\n` +
                `Erreurs: ${errorCount}` +
                (errors.length > 0 ? `\n\nErreurs:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... et ${errors.length - 5} autres` : ''}` : '');
            
            showNotification(message, errorCount > 0 ? 'warning' : 'success');
            console.log(` ${message}`);
        }
    };

    /**
     * --- SYNC FROM SUPABASE HANDLER ---
     * 
     * Synchronise les tickers depuis Supabase vers l'application locale.
     * 
     * Processus :
     * 1. Charge tous les tickers actifs depuis Supabase (avec fallback sur plusieurs APIs)
     * 2. Filtre par capitalisation minimale (2B USD) pour eviter les small caps
     * 3. Exclut les fonds mutuels (isMutualFund check)
     * 4. Cree des profils "squelettes" pour affichage immediat
     * 5. Charge les donnees FMP en arriere-plan par batch (5 tickers/batch)
     * 6. Collecte les erreurs par type et affiche un resume groupe
     * 
     * Gestion des erreurs :
     * - Tickers introuvables dans FMP -> Resume groupe
     * - Capitalisation < 2B -> Resume groupe
     * - Donnees invalides -> Resume groupe
     * - Autres erreurs -> Resume groupe
     * 
     * @see loadAllTickersFromSupabase pour la strategie de fallback API
     * @see mapSourceToIsWatchlist pour le mapping source -> isWatchlist
     */
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

            //  MIGRATION : Creer un Map de source pour tous les tickers Supabase
            const sourceMap = new Map<string, 'team' | 'watchlist' | 'both' | 'manual'>();
            result.tickers.forEach(t => {
                sourceMap.set(t.ticker.toUpperCase(), t.source);
            });

            // Merge intelligent : ne pas ecraser les profils existants
            setLibrary(prev => {
                const updated = { ...prev };
                let migrationCount = 0;

                //  MIGRATION : Corriger TOUS les profils existants qui ne sont pas dans Supabase
                // Si un profil existe dans localStorage mais pas dans Supabase, le marquer comme 'manual' (null)
                Object.keys(updated).forEach(symbol => {
                    if (!sourceMap.has(symbol)) {
                        // Ticker existe localement mais pas dans Supabase -> Normal (pas d'icone)
                        if (updated[symbol].isWatchlist !== null && updated[symbol].isWatchlist !== undefined) {
                            updated[symbol] = {
                                ...updated[symbol],
                                isWatchlist: null // Tickers normaux (hors Supabase)
                            };
                            migrationCount++;
                        }
                    }
                });

                result.tickers.forEach(supabaseTicker => {
                    const tickerSymbol = supabaseTicker.ticker.toUpperCase();
                    const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                    
                    if (updated[tickerSymbol]) {
                        //  MIGRATION FORCEE : Toujours mettre a jour isWatchlist depuis Supabase
                        // Les profils existants peuvent avoir un ancien isWatchlist incorrect
                        const hasValueLineUpdates = supabaseTicker.security_rank || 
                                                   supabaseTicker.earnings_predictability || 
                                                   supabaseTicker.price_growth_persistence || 
                                                   supabaseTicker.price_stability;
                        
                        //  MIGRATION FORCEE : Toujours mettre a jour isWatchlist depuis Supabase
                        // Meme si isWatchlist semble deja correct, forcer la mise a jour pour garantir la coherence
                        const needsValueLineUpdate = hasValueLineUpdates;
                        const needsIsWatchlistUpdate = updated[tickerSymbol].isWatchlist !== shouldBeWatchlist;
                        
                        //  FORCER la mise a jour si isWatchlist est different OU s'il y a des mises a jour ValueLine
                        if (needsIsWatchlistUpdate || needsValueLineUpdate) {
                            updated[tickerSymbol] = {
                                ...updated[tickerSymbol],
                                isWatchlist: shouldBeWatchlist, //  FORCER mise a jour depuis Supabase
                                //  MULTI-UTILISATEUR : Supabase est la source de verite pour les metriques ValueLine
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
                            
                            if (needsIsWatchlistUpdate) {
                                migrationCount++;
                            }
                            updatedTickersCount++;
                            
                            // Si c'est le profil actif, mettre a jour aussi le state local
                            if (tickerSymbol === activeId) {
                                setInfo(updated[tickerSymbol].info);
                                setIsWatchlist(shouldBeWatchlist ?? false);
                            }
                        }
                        return;
                    }

                    //  RIGUEUR 100% : Ne pas creer de profil placeholder ici
                    // Le profil sera cree uniquement si FMP reussit (voir code apres)
                    // On marque juste le ticker comme "a charger"
                    newTickersCount++;
                });

                //  NOUVEAU : Sauvegarder dans cache avec timestamp (fire and forget)
                        //  Sauvegarder dans Supabase ET cache local
                        saveProfiles(updated, true).catch(e => console.warn('Failed to save profiles:', e));

                //  DEBUG: Compter les profils avec isWatchlist=false apres migration
                const portfolioCount = Object.values(updated).filter((p: any) => p.isWatchlist === false).length;
                const watchlistCount = Object.values(updated).filter((p: any) => p.isWatchlist === true).length;
                const normalCount = Object.values(updated).filter((p: any) => p.isWatchlist === null || p.isWatchlist === undefined).length;
                
                if (migrationCount > 0) {
                    console.log(` Migration: ${migrationCount} profil(s) mis a jour avec isWatchlist depuis Supabase`);
                }
                
                console.log(` Apres migration (handleSyncFromSupabase) - Portefeuille (): ${portfolioCount}, Watchlist (): ${watchlistCount}, Normaux: ${normalCount}, Total: ${Object.keys(updated).length}`);
                
                //  VERIFICATION: S'assurer que tous les team tickers ont isWatchlist=false
                const teamTickersInSupabase = result.tickers.filter(t => {
                    const mapped = mapSourceToIsWatchlist(t.source);
                    return mapped === false; // Portefeuille
                });
                const teamTickersInLibrary = teamTickersInSupabase.filter(t => {
                    const symbol = t.ticker.toUpperCase();
                    return updated[symbol] && updated[symbol].isWatchlist === false;
                });
                
                // Separer les tickers manquants (pas dans localStorage) des incorrects (isWatchlist !== false)
                const missingTickers = teamTickersInSupabase.filter(t => {
                    const symbol = t.ticker.toUpperCase();
                    return !updated[symbol];
                });
                const incorrectTickers = teamTickersInSupabase.filter(t => {
                    const symbol = t.ticker.toUpperCase();
                    return updated[symbol] && updated[symbol].isWatchlist !== false;
                });
                
                if (teamTickersInSupabase.length !== teamTickersInLibrary.length) {
                    console.warn(` ${teamTickersInSupabase.length - teamTickersInLibrary.length} team ticker(s) manquant(s) ou incorrect(s) sur ${teamTickersInSupabase.length} attendus:`);
                    if (missingTickers.length > 0) {
                        console.warn(`    ${missingTickers.length} ticker(s) non charge(s) depuis FMP:`, missingTickers.map(t => t.ticker).join(', '));
                    }
                    if (incorrectTickers.length > 0) {
                        console.warn(`    ${incorrectTickers.length} ticker(s) avec isWatchlist incorrect:`, incorrectTickers.map(t => t.ticker).join(', '));
                    }
                    console.log(`    ${teamTickersInLibrary.length} ticker(s) correctement configure(s) dans localStorage`);
                } else {
                    console.log(` Tous les ${teamTickersInSupabase.length} team tickers ont isWatchlist=false`);
                }

                return updated;
            });

            //  FONCTION UTILITAIRE: Parser marketCap depuis format string (ex: "2.5B", "500M") vers nombre
            const parseMarketCapToNumber = (marketCapStr: string | null | undefined): number => {
                if (!marketCapStr || marketCapStr === 'N/A' || marketCapStr === '0') return 0;
                
                // Si c'est deja un nombre (string numerique)
                const numValue = parseFloat(marketCapStr);
                if (!isNaN(numValue) && !marketCapStr.match(/[A-Za-z]/)) {
                    return numValue;
                }
                
                // Parser format "2.5B", "500M", "1.2T"
                const match = marketCapStr.toUpperCase().match(/^([\d.]+)([BMKT]?)$/);
                if (!match) return 0;
                
                const value = parseFloat(match[1]);
                const suffix = match[2];
                
                switch (suffix) {
                    case 'T': return value * 1000000000000;
                    case 'B': return value * 1000000000;
                    case 'M': return value * 1000000;
                    case 'K': return value * 1000;
                    default: return value;
                }
            };

            //  FILTRE CAPITALISATION: Minimum 2 milliards USD
            const MIN_MARKET_CAP = 2000000000; // 2 milliards

            // Charger les donnees FMP pour les nouveaux tickers en arriere-plan
            // Exclure les fonds mutuels et les titres de moins de 2 milliards
            const newTickers = result.tickers.filter(t => {
                const symbol = t.ticker.toUpperCase();
                
                // Verifier si fonds mutuel
                if (isMutualFund(symbol, t.company_name)) {
                    console.warn(` ${symbol}: Fonds mutuel detecte - exclu de la synchronisation`);
                    return false;
                }

                //  FILTRE CAPITALISATION: Verifier market_cap depuis Supabase si disponible
                if (t.market_cap) {
                    const marketCapNum = typeof t.market_cap === 'number' 
                        ? t.market_cap 
                        : parseMarketCapToNumber(String(t.market_cap));
                    
                    if (marketCapNum > 0 && marketCapNum < MIN_MARKET_CAP) {
                        console.warn(` ${symbol}: Capitalisation boursiere trop faible (${t.market_cap} < 2B) - exclu de la synchronisation`);
                        return false;
                    }
                }

                // Si deja dans library
                if (library[symbol]) {
                    const profile = library[symbol];
                    // Verifier si les donnees sont valides (au moins une annee avec EPS ou CF > 0)
                    const hasValidData = profile.data && profile.data.length > 0 && profile.data.some(d => 
                        d.earningsPerShare !== 0 || d.cashFlowPerShare !== 0
                    );
                    
                    if (hasValidData) {
                        return false; // Donnees valides, on passe
                    }
                    // On laisse passer pour re-fetch FMP (pas de log individuel pour reduire le bruit)
                }

                return true;
            });

            if (newTickers.length > 0) {
                //  Taille du batch depuis Supabase (pas de hardcoding)
                const { getConfigValue } = await import('./services/appConfigApi');
                const batchSize = await getConfigValue('profile_batch_size');
                const delayBetweenBatches = 500;
                
                //  Collecter les erreurs pour afficher un resume a la fin
                const errorSummary = {
                    notFound: [] as string[],
                    noData: [] as string[],
                    invalidPrice: [] as string[],
                    invalidData: [] as string[],
                    lowMarketCap: [] as string[],
                    other: [] as Array<{symbol: string, error: string}>
                };
                let successCount = 0;

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
                                
                                // VALIDATION STRICTE : Verifier que les donnees sont valides
                                if (!result.data || result.data.length === 0) {
                                    errorSummary.noData.push(symbol);
                                    return;
                                }
                                
                                if (!result.currentPrice || result.currentPrice <= 0) {
                                    errorSummary.invalidPrice.push(symbol);
                                    return;
                                }
                                
                                const hasValidData = result.data.some(d => 
                                    d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
                                );
                                
                                if (!hasValidData) {
                                    errorSummary.invalidData.push(symbol);
                                    return;
                                }
                                
                                //  FILTRE CAPITALISATION: Verifier marketCap depuis FMP
                                const parseMarketCapToNumber = (marketCapStr: string | null | undefined): number => {
                                    if (!marketCapStr || marketCapStr === 'N/A' || marketCapStr === '0') return 0;
                                    const match = marketCapStr.toUpperCase().match(/^([\d.]+)([BMKT]?)$/);
                                    if (!match) return 0;
                                    const value = parseFloat(match[1]);
                                    const suffix = match[2];
                                    switch (suffix) {
                                        case 'T': return value * 1000000000000;
                                        case 'B': return value * 1000000000;
                                        case 'M': return value * 1000000;
                                        case 'K': return value * 1000;
                                        default: return value;
                                    }
                                };
                                
                                const MIN_MARKET_CAP = 2000000000; // 2 milliards
                                if (result.info.marketCap) {
                                    const marketCapNum = parseMarketCapToNumber(result.info.marketCap);
                                    if (marketCapNum > 0 && marketCapNum < MIN_MARKET_CAP) {
                                        errorSummary.lowMarketCap.push(symbol);
                                        return;
                                    }
                                }
                                
                                //  TOUTES LES VALIDATIONS PASSEES - Creer le profil avec les donnees reelles
                                const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                                
                                // Auto-fill assumptions basees sur les donnees historiques FMP (fonction centralisee)
                                //  autoFillAssumptionsFromFMPData sanitis deja les valeurs, mais on double-verifie
                                const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                                    result.data,
                                    result.currentPrice,
                                    INITIAL_ASSUMPTIONS,
                                    result.currentDividend //  NOUVEAU: Dividende actuel depuis l'API
                                );
                                
                                //  SANITISER une deuxieme fois pour etre absolument sur (les parametres peuvent avoir change)
                                const sanitizedAutoFilled = sanitizeAssumptionsSync(autoFilledAssumptions);
                                
                                // Detecter et exclure automatiquement les metriques avec prix cibles aberrants
                                const tempAssumptions = {
                                    ...INITIAL_ASSUMPTIONS,
                                    ...sanitizedAutoFilled
                                } as Assumptions;
                                const outlierDetection = detectOutlierMetrics(result.data, tempAssumptions);
                                
                                // Appliquer les exclusions detectees
                                const finalAssumptions = {
                                    ...tempAssumptions,
                                    excludeEPS: outlierDetection.excludeEPS,
                                    excludeCF: outlierDetection.excludeCF,
                                    excludeBV: outlierDetection.excludeBV,
                                    excludeDIV: outlierDetection.excludeDIV
                                };
                                
                                const newProfile: AnalysisProfile = {
                                    id: symbol,
                                    lastModified: Date.now(),
                                    data: result.data,
                                    assumptions: finalAssumptions,
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
                                    
                                    // Sauvegarder avec IndexedDB (evite QuotaExceededError)
                                    //  Sauvegarder dans Supabase ET cache local
                            saveProfiles(updated, true).catch(e => {
                                        console.warn('Failed to save profiles:', e);
                                    });
                                    
                                    return updated;
                                });
                                
                                successCount++;
                            } catch (error: any) {
                                const errorMsg = error?.message || String(error);
                                if (errorMsg.includes('introuvable') || errorMsg.includes('404') || errorMsg.includes('not found')) {
                                    errorSummary.notFound.push(symbol);
                                } else {
                                    errorSummary.other.push({ symbol, error: errorMsg });
                                }
                                //  RIGUEUR 100% : Ne pas creer de profil si FMP echoue
                            }
                        })
                    );
                }
                
                //  Afficher un resume des erreurs au lieu de logger chaque erreur individuellement
                const totalErrors = errorSummary.notFound.length + errorSummary.noData.length + 
                    errorSummary.invalidPrice.length + errorSummary.invalidData.length + 
                    errorSummary.lowMarketCap.length + errorSummary.other.length;
                
                if (totalErrors > 0) {
                    console.group(` Resume synchronisation: ${successCount} succes, ${totalErrors} erreurs`);
                    if (errorSummary.notFound.length > 0) {
                        console.warn(` ${errorSummary.notFound.length} ticker(s) introuvable(s) dans FMP: ${errorSummary.notFound.slice(0, 10).join(', ')}${errorSummary.notFound.length > 10 ? ` (+${errorSummary.notFound.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.lowMarketCap.length > 0) {
                        console.warn(` ${errorSummary.lowMarketCap.length} ticker(s) avec capitalisation < 2B: ${errorSummary.lowMarketCap.slice(0, 10).join(', ')}${errorSummary.lowMarketCap.length > 10 ? ` (+${errorSummary.lowMarketCap.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.noData.length > 0) {
                        console.warn(` ${errorSummary.noData.length} ticker(s) sans donnees: ${errorSummary.noData.slice(0, 10).join(', ')}${errorSummary.noData.length > 10 ? ` (+${errorSummary.noData.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.invalidData.length > 0) {
                        console.warn(` ${errorSummary.invalidData.length} ticker(s) avec donnees invalides: ${errorSummary.invalidData.slice(0, 10).join(', ')}${errorSummary.invalidData.length > 10 ? ` (+${errorSummary.invalidData.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.other.length > 0) {
                        console.warn(` ${errorSummary.other.length} autre(s) erreur(s): ${errorSummary.other.slice(0, 5).map(e => e.symbol).join(', ')}${errorSummary.other.length > 5 ? ` (+${errorSummary.other.length - 5} autres)` : ''}`);
                    }
                    console.groupEnd();
                }
            }

            // Afficher un message de succes
            const message = newTickersCount > 0 
                ? `${newTickersCount} nouveau(x) ticker(s) ajoute(s)${updatedTickersCount > 0 ? `, ${updatedTickersCount} mis a jour` : ''}`
                : updatedTickersCount > 0
                ? `${updatedTickersCount} ticker(s) mis a jour`
                : 'Synchronisation terminee (aucun changement)';
            
            showNotification(message, 'success');
            console.log(` ${message}`);

        } catch (error: any) {
            console.error(' Erreur lors de la synchronisation:', error);
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
    
    //  FIX: Calculer le prix cible moyen (au lieu d'utiliser seulement le prix cible BPA)
    // Cette logique correspond a celle de EvaluationDetails pour garantir la coherence
    const calculateAverageTargetPrice = useMemo(() => {
      const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
      const baseValues = {
        eps: Math.max(baseYearData?.earningsPerShare || 0, 0),
        cf: Math.max(baseYearData?.cashFlowPerShare || 0, 0),
        bv: Math.max(baseYearData?.bookValuePerShare || 0, 0),
        div: Math.max(assumptions.currentDividend || 0, 0)
      };
      
      //  FIX: Utiliser la croissance historique 5 ans si les taux sont 0 ou undefined
      const safeGrowthEPS = (assumptions.growthRateEPS !== undefined && assumptions.growthRateEPS !== 0)
        ? assumptions.growthRateEPS
        : calculateHistoricalGrowth(data, 'earningsPerShare', 5);
      const safeGrowthCF = (assumptions.growthRateCF !== undefined && assumptions.growthRateCF !== 0)
        ? assumptions.growthRateCF
        : calculateHistoricalGrowth(data, 'cashFlowPerShare', 5);
      const safeGrowthBV = (assumptions.growthRateBV !== undefined && assumptions.growthRateBV !== 0)
        ? assumptions.growthRateBV
        : calculateHistoricalGrowth(data, 'bookValuePerShare', 5);
      const safeGrowthDiv = (assumptions.growthRateDiv !== undefined && assumptions.growthRateDiv !== 0)
        ? assumptions.growthRateDiv
        : calculateHistoricalGrowth(data, 'dividendPerShare', 5);
      
      // Calculer les projections 5 ans avec les taux securises
      const futureValues = {
        eps: projectFutureValue(baseValues.eps, safeGrowthEPS, 5),
        cf: projectFutureValue(baseValues.cf, safeGrowthCF, 5),
        bv: projectFutureValue(baseValues.bv, safeGrowthBV, 5),
        div: projectFutureValue(baseValues.div, safeGrowthDiv, 5)
      };
      
      // Calculer les prix cibles pour chaque metrique
      const targets = {
        eps: futureValues.eps > 0 && assumptions.targetPE > 0 ? futureValues.eps * assumptions.targetPE : null,
        cf: futureValues.cf > 0 && assumptions.targetPCF > 0 ? futureValues.cf * assumptions.targetPCF : null,
        bv: futureValues.bv > 0 && assumptions.targetPBV > 0 ? futureValues.bv * assumptions.targetPBV : null,
        div: futureValues.div > 0 && assumptions.targetYield > 0 ? futureValues.div / (assumptions.targetYield / 100) : null
      };
      
      // Filtrer les metriques exclues et valides
      const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
      const maxReasonableTarget = currentPrice * 50; // Multiplicateur raisonnable
      const minReasonableTarget = currentPrice * 0.1;
      
      const validTargets = [
        !assumptions.excludeEPS && targets.eps !== null && targets.eps > 0 && targets.eps >= minReasonableTarget && targets.eps <= maxReasonableTarget && isFinite(targets.eps) ? targets.eps : null,
        !assumptions.excludeCF && targets.cf !== null && targets.cf > 0 && targets.cf >= minReasonableTarget && targets.cf <= maxReasonableTarget && isFinite(targets.cf) ? targets.cf : null,
        !assumptions.excludeBV && targets.bv !== null && targets.bv > 0 && targets.bv >= minReasonableTarget && targets.bv <= maxReasonableTarget && isFinite(targets.bv) ? targets.bv : null,
        !assumptions.excludeDIV && targets.div !== null && targets.div > 0 && targets.div >= minReasonableTarget && targets.div <= maxReasonableTarget && isFinite(targets.div) ? targets.div : null
      ].filter((t): t is number => t !== null && t > 0 && isFinite(t));
      
      return validTargets.length > 0
        ? validTargets.reduce((a, b) => a + b, 0) / validTargets.length
        : targetPrice; // Fallback sur prix cible BPA si aucun target valide
    }, [data, assumptions, targetPrice]);
    
    // Utiliser le prix cible moyen pour le graphique
    const chartTargetPrice = calculateAverageTargetPrice;

    const availableYears = data.map(d => d.year);

    //  Overlay de verrouillage pendant la synchronisation (bulk ou single)
    const isSyncing = isBulkSyncing || isLoading;

    if (!isInitialized) return <div className="flex items-center justify-center h-screen text-slate-500">Chargement...</div>;

    // Get profile before early returns
    const profile = library[activeId] || DEFAULT_PROFILE;

    // Show landing page on first visit
    if (showLanding) {
        return <LandingPage onGetStarted={() => {
            setShowLanding(false);
            localStorage.setItem('3p1-has-seen-landing', 'true');
            // Afficher le demo apres la landing page si aucun ticker n'est selectionne
            setTimeout(() => {
                if (!activeId || Object.keys(library).length === 0) {
                    setShowDemo(true);
                }
            }, 500);
        }} />;
    }

    if (showAdmin) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-900 pointer-events-auto">
                <button
                    onClick={() => setShowAdmin(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded z-50 hover:bg-slate-700 pointer-events-auto"
                >
                    Close Admin
                </button>
                <div className="h-full w-full">
                     <ErrorBoundary>
                         <Suspense fallback={<LoadingFallback />}>
                             <AdminDashboard onRepair={handleAdminRepair} isRepairing={isRepairing} />
                         </Suspense>
                     </ErrorBoundary>
            </div>
        </div>
        );
    }


    // Handler generique pour mettre a jour un profil complet (utilise par KPIDashboard)
    const handleUpdateProfile = (id: string, updates: Partial<AnalysisProfile>) => {
        setLibrary(prev => {
            if (!prev[id]) return prev;
            
            const updatedProfile = { 
                ...prev[id], 
                ...updates,
                // Ne pas ecraser lastModified si fourni dans updates, sinon update
                lastModified: updates.lastModified || Date.now()
            };
            
            const updatedLibrary = { 
                ...prev, 
                [id]: updatedProfile 
            };
            
            // Persister les changements
            //  NOUVEAU : Sauvegarder dans cache avec timestamp
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    //  Sauvegarder dans Supabase ET cache local
                    saveProfiles(updatedLibrary, true).catch(e => console.warn('Failed to save profiles:', e));
                });
            } else {
                //  Sauvegarder dans Supabase ET cache local
                saveProfiles(updatedLibrary, true).catch(e => console.warn('Failed to save profiles:', e));
            }
            
            return updatedLibrary;
        });
    };

    return (
        <>
            {/*  Overlay de verrouillage pendant la synchronisation */}
            {(isBulkSyncing || isLoading) && (
                <SyncLockOverlay
                    isActive={isBulkSyncing || isLoading}
                    current={isBulkSyncing ? bulkSyncProgress.current : (isLoading ? 1 : 0)}
                    total={isBulkSyncing ? bulkSyncProgress.total : (isLoading ? 1 : 0)}
                    successCount={isBulkSyncing ? syncStats.successCount : 0}
                    errorCount={isBulkSyncing ? syncStats.errorCount : 0}
                    currentTicker={currentSyncingTicker || (isLoading ? activeId : undefined)}
                    onAbort={isBulkSyncing ? () => { abortSync.current = true; } : undefined}
                />
            )}

            {/* Desactiver toutes les interactions pendant la synchronisation */}
            <div 
                className={`flex h-screen bg-gray-100 font-sans text-slate-800 overflow-hidden ${isSyncing ? 'pointer-events-none opacity-50' : ''}`}
                style={isSyncing ? { cursor: 'not-allowed', userSelect: 'none' } : {}}
            >

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
                        profiles={Object.values(library).filter(p => p.id !== DEFAULT_PROFILE.id)}
                        currentId={activeId}
                        onSelect={handleSelectTicker}
                        onAdd={handleAddTicker}
                        onDelete={handleDeleteTicker}
                        onDuplicate={handleDuplicateTicker}
                        onToggleWatchlist={handleToggleWatchlist}
                        onSetTickerType={handleSetTickerType}
                        onLoadVersion={handleLoadSnapshot}
                        onSyncFromSupabase={handleSyncFromSupabase}
                        isLoadingTickers={isLoadingTickers}
                        onBulkSyncAll={handleBulkSyncAllTickers}
                        onSyncSelected={handleSyncSelectedTickers}
                        isBulkSyncing={isBulkSyncing}
                        bulkSyncProgress={bulkSyncProgress}
                        onOpenAdmin={() => setShowAdmin(true)}
                        onOpenDataExplorer={() => setShowDataExplorer(true)}
                        isAdmin={isAdmin}
                        onToggleAdmin={handleToggleAdmin}
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
                                <h1 className="text-base sm:text-xl md:text-2xl font-extrabold truncate flex-1 sm:flex-none bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                                  <span className="inline-block">JLab</span>
                                  <span className="inline-block ml-1.5 text-blue-500">3p1</span>
                                </h1>
                            </div>

                            {/* VIEW TABS */}
                            <div className="flex bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                                <button
                                    onClick={() => setCurrentView('analysis')}
                                    title="Tableau de bord principal"
                                    className={`p-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                                        currentView === 'analysis' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    <ChartBarSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden xs:inline">Analyse</span>
                                </button>
                                <button
                                    onClick={() => setCurrentView('kpi')}
                                    title="Tableau de bord KPI et classement"
                                    className={`p-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                                        currentView === 'kpi' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    <PresentationChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden xs:inline">KPIs & Classement</span>
                                </button>
                                <button
                                    onClick={() => setCurrentView('info')}
                                    title="Mode d'emploi et documentation"
                                    className={`p-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                                        currentView === 'info' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden xs:inline">Mode d'emploi</span>
                                </button>
                            </div>
                        </div>

                        {/* Header - Affiche seulement pour les vues Analysis et Info, pas pour KPI */}
                        {currentView !== 'kpi' && (
                            <Header
                                info={info}
                                assumptions={assumptions}
                                availableYears={availableYears}
                                recommendation={recommendation}
                                isWatchlist={isWatchlist}
                                onUpdateInfo={handleUpdateInfo}
                                onUpdateAssumption={handleUpdateAssumption}
                                onFetchData={profile?.info?.symbol ? handleFetchData : undefined}
                                onRestoreData={profile && profile.data.length > 0 ? () => setShowRestoreDialog(true) : undefined}
                                showSyncButton={true}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                                onOpenReports={() => setIsReportsOpen(true)}
                                activeSymbol={activeId || info.symbol || undefined}
                            />
                        )}

                        {/* CONDITIONAL RENDER: ANALYSIS VS INFO VS KPI */}
                        {currentView === 'info' ? (
                            <InfoTab />
                        ) : currentView === 'kpi' ? (
                            <ErrorBoundary>
                                <Suspense fallback={<LoadingFallback />}>
                                    <KPIDashboard
                                        profiles={Object.values(library)}
                                        currentId={activeId}
                                        onSelect={handleSelectTicker}
                                        onBulkSync={handleBulkSyncAllTickers}
                                        onSyncNA={handleSyncSpecificTickers}
                                        isBulkSyncing={isBulkSyncing}
                                        onUpdateProfile={handleUpdateProfile}
                                        onOpenSettings={() => setIsSettingsOpen(true)}
                                    />
                                </Suspense>
                            </ErrorBoundary>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6" data-demo="features">

                                {/* LEFT COLUMN - MAIN DATA */}
                                <div className="lg:col-span-3 order-2 lg:order-1">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                            Donnees Historiques
                                            {historicalCAGR_EPS != null && isFinite(historicalCAGR_EPS) && historicalCAGR_EPS > 0 && (
                                                <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full" title="Taux de croissance annuel compose des EPS sur la periode affichee">
                                                    CAGR EPS: {historicalCAGR_EPS.toFixed(1)}%
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-0.5 no-print">
                                            <button onClick={undo} disabled={pastData.length === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30" title=" Annuler la derniere modification\n\nAnnule la derniere modification effectuee sur les donnees historiques.\n\n Fonctionnalites:\n- Permet de revenir en arriere sur les changements\n- Fonctionne avec toutes les modifications (EPS, CF, BV, Dividendes, Prix)\n- Historique illimite (tant que vous ne quittez pas la page)\n\n Raccourci: Ctrl+Z (Cmd+Z sur Mac)" aria-label="Annuler la modification">
                                                <ArrowUturnLeftIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px bg-gray-200 my-1"></div>
                                            <button onClick={redo} disabled={futureData.length === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30" title=" Retablir la modification annulee\n\nRetablit la derniere modification que vous avez annulee.\n\n Fonctionnalites:\n- Permet de refaire une action annulee\n- Fonctionne avec toutes les modifications\n- Disponible uniquement si vous avez annule une action\n\n Raccourci: Ctrl+Shift+Z (Cmd+Shift+Z sur Mac)" aria-label="Retablir la modification">
                                                <ArrowUturnRightIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px bg-gray-200 my-1"></div>
                                            <button onClick={handleResetData} className="p-1.5 rounded hover:bg-red-50 text-red-600" title=" Reinitialiser les donnees\n\nReinitialise toutes les donnees historiques a leurs valeurs d'origine.\n\n Attention:\n- Cette action est irreversible\n- Toutes vos modifications manuelles seront perdues\n- Les donnees seront restaurees depuis la derniere synchronisation FMP\n- Les hypotheses ne sont PAS affectees\n\n Utilisation:\n- Utile si vous avez fait des erreurs de saisie\n- Permet de repartir de zero avec les donnees FMP\n- Confirmation requise avant execution" aria-label="Reinitialiser toutes les donnees">
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
                                        targetPrice={chartTargetPrice}
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

                                    {/* Historical Ranges Table - Aide pour les hypotheses */}
                                    <HistoricalRangesTable
                                        data={data}
                                        info={profile.info}
                                        sector={profile.info?.sector}
                                        assumptions={assumptions}
                                    />

                                    <div className="mt-8">
                                        <AdditionalMetrics
                                            data={profile.data}
                                            assumptions={profile.assumptions}
                                            info={profile.info}
                                            config={guardrailConfig}
                                        />
                                    </div>

                                    {/* Data Sources and Methodology Info */}
                                    <DataSourcesInfo />

                                </div>

                                {/* RIGHT COLUMN - SUMMARY & PARAMS */}
                                <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6 no-print order-1 lg:order-2">

                                    {/* Summary Card */}
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg">
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 border-b border-slate-600 pb-2">Resume Executif</h2>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            L'analyse de {info.name} suggere une position <strong className="text-white uppercase">{recommendation}</strong> au prix actuel de {formatCurrency(assumptions.currentPrice)}.
                                        </p>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            {targetPrice && targetPrice > 0 && assumptions.currentPrice > 0 ? (
                                                <>
                                                    Le titre se negocie a <strong className="text-white">
                                                        {(() => {
                                                            const diff = Math.abs(1 - (assumptions.currentPrice / targetPrice)) * 100;
                                                            return isFinite(diff) && !isNaN(diff) ? formatPercent(diff) : 'N/A';
                                                        })()} {assumptions.currentPrice < targetPrice ? 'sous' : 'au-dessus de'}
                                                    </strong> l'objectif de prix EPS de {formatCurrency(targetPrice)}.
                                                </>
                                            ) : (
                                                <span className="text-slate-400">Donnees insuffisantes pour calculer la position relative au prix cible EPS.</span>
                                            )}
                                        </p>

                                        {/* Note: Les metriques ValueLine sont affichees dans le Header (barre superieure) et dans la section Configuration ci-dessous */}
                                        {info.beta !== undefined && info.beta !== null && isFinite(info.beta) && (
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
                                                <label htmlFor="config-company-name" className="block text-xs text-gray-500 mb-1">Nom Societe</label>
                                                <input
                                                    id="config-company-name"
                                                    type="text"
                                                    value={info.name}
                                                    onChange={(e) => handleUpdateInfo('name', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="config-company-sector" className="block text-xs text-gray-500 mb-1">Secteur</label>
                                                <input
                                                    id="config-company-sector"
                                                    type="text"
                                                    value={info.sector}
                                                    onChange={(e) => handleUpdateInfo('sector', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="config-company-marketcap" className="block text-xs text-gray-500 mb-1">Capitalisation</label>
                                                <input
                                                    id="config-company-marketcap"
                                                    type="text"
                                                    value={info.marketCap}
                                                    onChange={(e) => handleUpdateInfo('marketCap', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Financial Strength (ValueLine 3 dec 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronise depuis Supabase - Lecture seule"></span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.securityRank}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="A+, A, B+, etc."
                                                    title="Cette metrique est synchronisee depuis Supabase et ne peut pas etre modifiee localement"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Earnings Predictability (ValueLine 3 dec 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronise depuis Supabase - Lecture seule"></span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.earningsPredictability || ''}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="100, 95, 90, etc."
                                                    title="Cette metrique est synchronisee depuis Supabase et ne peut pas etre modifiee localement"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Price Growth Persistence (ValueLine 3 dec 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronise depuis Supabase - Lecture seule"></span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.priceGrowthPersistence || ''}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="95, 90, 85, etc."
                                                    title="Cette metrique est synchronisee depuis Supabase et ne peut pas etre modifiee localement"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex text-xs text-gray-500 mb-1 items-center gap-1">
                                                    Price Stability (ValueLine 3 dec 2025)
                                                    <span className="text-[10px] text-blue-600" title="Synchronise depuis Supabase - Lecture seule"></span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={info.priceStability || ''}
                                                    readOnly
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                                                    placeholder="100, 95, 90, etc."
                                                    title="Cette metrique est synchronisee depuis Supabase et ne peut pas etre modifiee localement"
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
                                                        title="Beta recupere automatiquement via API FMP"
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
            {/* Ancien dialogue simple (garde pour compatibilite) */}
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

            {/* Nouveau dialogue avance */}
            <AdvancedSyncDialog
                isOpen={showAdvancedSyncDialog}
                ticker={isAdvancedSyncForBulk ? undefined : activeId}
                hasManualData={hasManualEdits(data)}
                totalTickers={isAdvancedSyncForBulk 
                    ? ((window as any)._pendingSyncTickers?.length || Object.keys(library).length) 
                    : 1}
                onCancel={() => {
                    setShowAdvancedSyncDialog(false);
                    (window as any)._pendingSyncTickers = null;
                }}
                onConfirm={async (options) => {
                    setShowAdvancedSyncDialog(false);
                    if (isAdvancedSyncForBulk) {
                        const pendingTickers = (window as any)._pendingSyncTickers;
                        await handleBulkSyncAllTickersWithOptions(options, pendingTickers);
                        (window as any)._pendingSyncTickers = null;
                    } else {
                        await performSync(options.saveBeforeSync, options);
                    }
                }}
                isSyncing={isAdvancedSyncForBulk ? isBulkSyncing : isLoading}
            />

            {/* Interactive Demo */}
            {showDemo && (!activeId || profile.info.name === 'Chargement...') && (
                <InteractiveDemo
                    onClose={() => {
                        setShowDemo(false);
                        //  Memoriser que l'utilisateur a ferme le demo pour ne pas le reafficher
                        localStorage.setItem('3p1-has-closed-demo', 'true');
                    }}
                    onSelectTicker={() => {
                        setIsSidebarOpen(true);
                    }}
                    onLoadDefaultTicker={async () => {
                        // Charger ACN par defaut quand le demo se ferme
                        const defaultTicker = 'ACN';
                        const upperTicker = defaultTicker.toUpperCase();
                        
                        // Si ACN n'existe pas dans la library, creer un profil squelette
                        if (!library[upperTicker]) {
                            console.log(` Creation profil squelette pour ${upperTicker}...`);
                            const skeletonProfile: AnalysisProfile = {
                                id: upperTicker,
                                lastModified: Date.now(),
                                data: [],
                                assumptions: INITIAL_ASSUMPTIONS,
                                info: {
                                    ...INITIAL_INFO,
                                    symbol: upperTicker,
                                    name: 'Chargement...'
                                },
                                notes: '',
                                isWatchlist: null
                            };
                            
                            // Marquer comme squelette
                            (skeletonProfile as any)._isSkeleton = true;
                            
                            // Ajouter a la library
                            setLibrary(prev => {
                                const updated = {
                                    ...prev,
                                    [upperTicker]: skeletonProfile
                                };
                                //  Sauvegarder dans Supabase ET cache local
                                saveProfiles(updated, true).catch(e => console.warn('Erreur sauvegarde profils:', e));
                                return updated;
                            });
                        }
                        
                        // Selectionner ACN (handleSelectTicker chargera les donnees depuis Supabase puis FMP)
                        //  FORCER le chargement meme si le profil existe deja mais est vide
                        await handleSelectTicker(upperTicker);
                        
                        //  DOUBLE VERIFICATION : Si apres handleSelectTicker les donnees sont toujours vides, forcer le chargement FMP
                        setTimeout(async () => {
                            const currentProfile = library[upperTicker];
                            if (currentProfile && (!currentProfile.data || currentProfile.data.length === 0)) {
                                console.log(` ${upperTicker}: Donnees toujours vides apres handleSelectTicker - Forcer chargement FMP...`);
                                try {
                                    const { fetchCompanyData } = await import('./services/financeApi');
                                    showNotification(`Chargement des donnees FMP pour ${upperTicker}...`, 'info');
                                    const result = await fetchCompanyData(upperTicker);
                                    
                                    if (result.data && result.data.length > 0 && result.currentPrice > 0) {
                                        const updatedProfile: AnalysisProfile = {
                                            id: upperTicker,
                                            lastModified: Date.now(),
                                            data: result.data,
                                            assumptions: autoFillAssumptionsFromFMPData(result.data, result.currentPrice, INITIAL_ASSUMPTIONS, result.currentDividend) as Assumptions,
                                            info: result.info,
                                            notes: '',
                                            isWatchlist: null
                                        };
                                        
                                        // Retirer le flag squelette
                                        delete (updatedProfile as any)._isSkeleton;
                                        
                                        setLibrary(prev => ({
                                            ...prev,
                                            [upperTicker]: updatedProfile
                                        }));
                                        
                                        // Mettre a jour les states si c'est toujours le ticker actif
                                        if (activeId === upperTicker) {
                                            setData(updatedProfile.data);
                                            setAssumptions(updatedProfile.assumptions);
                                            setInfo(updatedProfile.info);
                                        }
                                        
                                        showNotification(` ${upperTicker} charge depuis FMP`, 'success');
                                        console.log(` ${upperTicker}: Donnees FMP chargees avec succes`);
                                    }
                                } catch (error) {
                                    console.error(` ${upperTicker}: Erreur chargement FMP force:`, error);
                                    showNotification(` Impossible de charger ${upperTicker} depuis FMP`, 'error');
                                }
                            }
                        }, 1000); // Attendre 1 seconde pour laisser handleSelectTicker terminer
                    }}
                />
            )}

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
            {/* Indicateur de progression Supabase */}
            <SupabaseLoadingProgress
                isLoading={isLoadingTickers && supabaseProgress.total > 0}
                current={supabaseProgress.current}
                total={supabaseProgress.total}
                startTime={supabaseProgress.startTime}
                message={supabaseProgress.message}
            />

            <NotificationManager
                notifications={notifications}
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />

            {/* UNIFIED SETTINGS PANEL */}
            <UnifiedSettingsPanel
                isOpen={isSettingsOpen}
                onClose={handleSettingsClose}
            />

            {/* REPORTS PANEL */}
            {profile && (
                <ReportsPanel
                    data={profile.data}
                    assumptions={profile.assumptions}
                    info={profile.info}
                    isOpen={isReportsOpen}
                    onClose={() => setIsReportsOpen(false)}
                />
            )}

            {/* DATA EXPLORER PANEL */}
            <Suspense fallback={<LoadingFallback />}>
                <DataExplorerPanel
                    isOpen={showDataExplorer}
                    onClose={() => setShowDataExplorer(false)}
                    onSyncSelected={async (tickers) => {
                        setShowDataExplorer(false);
                        // Open advanced sync dialog for the selected tickers
                        setIsAdvancedSyncForBulk(true);
                        setShowAdvancedSyncDialog(true);
                        // Custom logic to handle the sync after individual selection
                        // We'll use a temporary state to store the tickers being synced
                        // if we want to sync a specific subset
                        (window as any)._pendingSyncTickers = tickers;
                    }}
                />
            </Suspense>

            <SyncReportDialog
                isOpen={showSyncReport}
                reportData={syncReportData}
                onClose={() => setShowSyncReport(false)}
                onRetryTicker={async (ticker) => {
                    if (syncReportData?.options) {
                        const profile = library[ticker];
                        if (profile) {
                            setIsLoading(true);
                            try {
                                await performSync(false, syncReportData.options);
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                }}
                onRetryFailed={async () => {
                    if (syncReportData?.options && syncReportData?.tickerResults) {
                        const failedTickers = syncReportData.tickerResults
                            .filter((r: any) => !r.success && !r.error?.includes('introuvable'))
                            .map((r: any) => r.ticker);
                        
                        if (failedTickers.length > 0) {
                            setIsBulkSyncing(true);
                            try {
                                const options = { ...syncReportData.options, syncAllTickers: false };
                                await handleBulkSyncAllTickersWithOptions(options, failedTickers);
                            } finally {
                                setIsBulkSyncing(false);
                                setCurrentSyncingTicker(undefined); //  Reinitialiser le ticker actuel
                            }
                        }
                    }
                }}
            />
        </div>
        </>
    );
}