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
import { HistoricalVersionBanner } from './components/HistoricalVersionBanner';
import { NotificationManager } from './components/Notification';
import { SyncProgressBar } from './components/SyncProgressBar';
import { LandingPage } from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnnualData, Assumptions, CompanyInfo, Recommendation, AnalysisProfile } from './types';
import { calculateRowRatios, calculateAverage, projectFutureValue, formatCurrency, formatPercent, calculateCAGR, calculateRecommendation, autoFillAssumptionsFromFMPData, isMutualFund } from './utils/calculations';
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

// Lazy load heavy components for better initial load performance
const KPIDashboard = React.lazy(() => import('./components/KPIDashboard').then(m => ({ default: m.KPIDashboard })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      <span className="text-gray-400 text-sm">Chargement...</span>
    </div>
  </div>
);


// Données initiales par défaut (VIDE - en attente de chargement)
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

const STORAGE_KEY = 'finance_pro_profiles';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes - Cache invalidation automatique

// ✅ Structure du cache avec timestamp pour invalidation automatique
interface CacheEntry {
    data: Record<string, AnalysisProfile>;
    timestamp: number;
}

// ✅ Helper function pour sauvegarder avec timestamp (Supabase = source de vérité, localStorage = cache)
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
        console.log('🚀 3p1 App v2.1.0 - Filtres/Tri & Rapports Visuels activés');
        console.log('✅ Modifications disponibles:');
        console.log('   - Section "Filtres et Tri" en bas de sidebar');
        console.log('   - Bouton 📊 Rapports dans Header');
        console.log('   - Bouton ⚙️ Settings fonctionnel');
    }, []);

    // --- GLOBAL STATE & PERSISTENCE ---
    const [showLanding, setShowLanding] = useState(true); // Show landing page by default
    const [library, setLibrary] = useState<Record<string, AnalysisProfile>>({});
    const [activeId, setActiveId] = useState<string>('');
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

    // --- ADMIN DASHBOARD STATE ---
    const [showAdmin, setShowAdmin] = useState(false);
    const [isRepairing, setIsRepairing] = useState<string | null>(null);

    // --- CONFIG SYSTEM ---
    const [guardrailConfig, setGuardrailConfig] = useState<GuardrailConfig>(() => loadConfig());
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);

    const handleSaveConfig = (newConfig: GuardrailConfig) => {
        setGuardrailConfig(newConfig);
        saveConfig(newConfig);
        showNotification('Configuration sauvegardée avec succès', 'success');
    };

    const handleSettingsClose = () => {
        setIsSettingsOpen(false);
        // Reload guardrail config after settings are saved
        setGuardrailConfig(loadConfig());
        // Invalider le cache pour recharger les nouveaux paramètres
        invalidateValidationSettingsCache();
        showNotification('Paramètres de validation mis à jour', 'success');
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
     * Synchronisation temps réel via Supabase Realtime pour cohérence multi-utilisateurs.
     * 
     * Architecture :
     * - Écoute les changements sur la table 'tickers'
     * - INSERT/DELETE → Force rechargement complet (invalide cache)
     * - UPDATE → Met à jour métriques ValueLine directement
     * - Synchronisation périodique (2 min) comme fallback
     * 
     * Gestion des race conditions :
     * - useRef pour onDataChange (évite closures stale)
     * - isMounted check (évite updates sur unmounted)
     * - Timeout avec cleanup (évite fuites mémoire)
     * - Invalidation cache explicite
     * 
     * Performance :
     * - Délai de 100ms pour batch updates (évite rapid re-renders)
     * - Cache invalidation seulement si nécessaire
     * - Cleanup automatique au démontage
     * 
     * @see useRealtimeSync hook pour l'implémentation
     * @see loadTickersFromSupabase pour le rechargement
     */
    // Live sync: when any user adds/updates/deletes tickers, all clients see it instantly
    // ✅ OPTIMISATION: Utiliser useRef pour éviter les closures stale et les race conditions
    const realtimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const loadTickersFromSupabaseRef = useRef<(() => Promise<void>) | null>(null);
    
    useRealtimeSync('tickers', (payload) => {
        console.log('📡 [3p1] Realtime ticker change:', payload.eventType, payload.new?.ticker || payload.old?.ticker);
        
        // ✅ FIX: Annuler le timeout précédent pour éviter les race conditions
        if (realtimeTimeoutRef.current) {
            clearTimeout(realtimeTimeoutRef.current);
            realtimeTimeoutRef.current = null;
        }
        
        if (payload.eventType === 'INSERT' && payload.new) {
            const symbol = payload.new.ticker?.toUpperCase();
            if (symbol) {
                showNotification(`📡 Nouveau ticker ajouté par un autre utilisateur: ${symbol}`, 'info');
                // ✅ NOUVEAU : Invalider le cache localStorage automatiquement
                storage.removeItem(STORAGE_KEY).catch(console.warn);
                // ✅ FORCER le rechargement complet depuis Supabase pour synchronisation
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null; // Invalider le cache
                // ✅ FIX: Utiliser un timeout avec nettoyage pour éviter les fuites mémoire
                realtimeTimeoutRef.current = setTimeout(() => {
                    realtimeTimeoutRef.current = null;
                    if (loadTickersFromSupabaseRef.current) {
                        loadTickersFromSupabaseRef.current();
                    }
                }, 300); // Réduit à 300ms pour réactivité
            }
        } else if (payload.eventType === 'DELETE' && payload.old) {
            const symbol = payload.old.ticker?.toUpperCase();
            if (symbol) {
                showNotification(`📡 Ticker supprimé par un autre utilisateur: ${symbol}`, 'warning');
                // ✅ NOUVEAU : Invalider le cache localStorage automatiquement
                storage.removeItem(STORAGE_KEY).catch(console.warn);
                // ✅ Supprimer du state local ET forcer rechargement
                setLibrary(prev => {
                    const updated = { ...prev };
                    delete updated[symbol];
                    return updated;
                });
                // Recharger depuis Supabase pour être sûr
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
                showNotification(`📡 Ticker mis à jour: ${symbol}`, 'info');
                // ✅ NOUVEAU : Invalider le cache localStorage automatiquement
                storage.removeItem(STORAGE_KEY).catch(console.warn);
                // ✅ Mettre à jour les métriques ValueLine ET recharger pour cohérence
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
                // Recharger depuis Supabase pour synchronisation complète
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null;
                realtimeTimeoutRef.current = setTimeout(() => {
                    realtimeTimeoutRef.current = null;
                    if (loadTickersFromSupabaseRef.current) {
                        loadTickersFromSupabaseRef.current();
                    }
                }, 500); // Réduit à 500ms pour réactivité
            }
        }
    });
    
    // ✅ FIX: Nettoyer le timeout au démontage pour éviter les fuites mémoire
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
                console.log('🔐 Admin access granted via URL parameter');
                return;
            }
            
            // Check localStorage for persisted admin flag
            if (localStorage.getItem('3p1-admin') === 'true') {
                setIsAdmin(true);
                console.log('🔐 Admin access granted via localStorage');
                return;
            }
            
            // Check sessionStorage (set by main dashboard login)
            const userJson = sessionStorage.getItem('gob-user');
            if (userJson) {
                const user = JSON.parse(userJson);
                // Check multiple possible admin indicators
                if (user.role === 'admin' || user.is_admin === true || user.username === 'admin' || user.id === 'admin') {
                    setIsAdmin(true);
                    console.log('🔐 Admin access granted via sessionStorage');
                }
            }
        } catch (e) {
            console.warn('Failed to parse user role', e);
        }
    }, []);

    // ✅ Fonction cachée pour toggle admin mode (double-clic sur logo)
    const handleToggleAdmin = () => {
        const newAdminState = !isAdmin;
        setIsAdmin(newAdminState);
        if (newAdminState) {
            localStorage.setItem('3p1-admin', 'true');
            console.log('🔐 Mode admin activé (double-clic sur logo)');
            showNotification('🔐 Mode admin activé', 'success');
        } else {
            localStorage.removeItem('3p1-admin');
            console.log('🔓 Mode admin désactivé (double-clic sur logo)');
            showNotification('🔓 Mode admin désactivé', 'info');
        }
    };


    const handleAdminRepair = async (tickerToRepair: string) => {
        setIsRepairing(tickerToRepair);
        try {
            console.log(`🔧 Admin: Repairing ${tickerToRepair}...`);
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
                
                showNotification(`✅ Repaired ${tickerToRepair}`, 'success');
            } else {
                showNotification(`❌ Failed to fetch data for ${tickerToRepair}`, 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification(`❌ Error repairing ${tickerToRepair}`, 'error');
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
                const saved = await storage.getItem(STORAGE_KEY);
                if (saved) {
                    let parsed: Record<string, AnalysisProfile> | CacheEntry = saved;
                    let cacheTimestamp: number | null = null;
                    
                    // ✅ NOUVEAU : Vérifier si c'est la nouvelle structure avec timestamp
                    if (saved && typeof saved === 'object' && 'data' in saved && 'timestamp' in saved) {
                        const cacheEntry = saved as CacheEntry;
                        cacheTimestamp = cacheEntry.timestamp;
                        parsed = cacheEntry.data;
                        
                        // ✅ Vérifier si le cache est obsolète (> 5 min)
                        const now = Date.now();
                        const cacheAge = now - cacheTimestamp;
                        if (cacheAge > CACHE_MAX_AGE_MS) {
                            console.log(`🔄 Cache obsolète (${Math.round(cacheAge / 1000 / 60)} min) - Rechargement depuis Supabase...`);
                            // Invalider le cache et recharger depuis Supabase
                            await storage.removeItem(STORAGE_KEY);
                            parsed = {};
                        } else {
                            console.log(`✅ Cache valide (${Math.round(cacheAge / 1000)}s) - Utilisation cache localStorage`);
                        }
                    } else if (typeof saved === 'string') {
                        // Migration depuis ancien format (string)
                        try {
                           parsed = JSON.parse(saved);
                        } catch (e) {
                           console.error('Failed to parse stringified data', e);
                           parsed = {};
                        }
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
                        console.log(`🧹 ${removedMutualFunds.length} fonds mutuel(s) supprimé(s) automatiquement`);
                        await saveToCache(cleaned);
                    }
                    
                    if (Object.keys(cleaned).length > 0) {
                        setLibrary(cleaned);
                        // Sélectionner le premier ticker en ordre alphabétique
                        const sortedKeys = Object.keys(cleaned).sort((a, b) => 
                            (cleaned[a].info.preferredSymbol || a).localeCompare(cleaned[b].info.preferredSymbol || b)
                        );
                        setActiveId(sortedKeys[0]);
                    } else {
                        // ✅ NOUVEAU : Cache vide ou obsolète → Forcer chargement depuis Supabase
                        console.log('📡 Cache vide ou obsolète - Chargement depuis Supabase...');
                        setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                        setActiveId(DEFAULT_PROFILE.id);
                        // Marquer pour forcer le chargement depuis Supabase
                        hasLoadedTickersRef.current = false;
                        supabaseTickersCacheRef.current = null;
                    }
                } else {
                    // ✅ NOUVEAU : Aucun cache → Forcer chargement depuis Supabase
                    console.log('📡 Aucun cache trouvé - Chargement depuis Supabase...');
                    setLibrary({ [DEFAULT_PROFILE.id]: DEFAULT_PROFILE });
                    setActiveId(DEFAULT_PROFILE.id);
                    // Marquer pour forcer le chargement depuis Supabase
                    hasLoadedTickersRef.current = false;
                    supabaseTickersCacheRef.current = null;
                }
            } catch (e) {
                console.warn("Storage access failed", e);
                // ✅ NOUVEAU : Erreur de cache → Forcer chargement depuis Supabase
                console.log('📡 Erreur accès cache - Chargement depuis Supabase...');
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

        // ✅ Mise à jour automatique des prix à l'ouverture (remplace le cron continu)
        const refreshPriceCacheIfNeeded = async () => {
            try {
                // Vérifier si le cache est frais (< 15 minutes) avec un ticker exemple
                const response = await fetch('/api/market-data-batch?tickers=AAPL&checkOnly=true');
                
                // Si l'endpoint n'existe pas (404), ignorer silencieusement
                if (response.status === 404) {
                    console.log('ℹ️ Endpoint market-data-batch non disponible - Ignoré');
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const result = await response.json();
                
                // Si le cache est expiré ou manquant, déclencher la mise à jour
                if (result.stats?.stale > 0 || result.stats?.missing > 0) {
                    console.log('🔄 Cache prix expiré - Mise à jour automatique...');
                    // Déclencher la mise à jour en arrière-plan (non-bloquant)
                    fetch('/api/fmp-batch-sync', { method: 'POST' })
                        .then(() => console.log('✅ Cache prix mis à jour'))
                        .catch(err => console.warn('⚠️ Erreur mise à jour cache prix:', err));
                } else {
                    console.log('✅ Cache prix frais - Pas de mise à jour nécessaire');
                }
            } catch (error: any) {
                // Ignorer les erreurs 404 (endpoint non disponible)
                if (error.message?.includes('404') || error.message?.includes('The page c')) {
                    console.log('ℹ️ Endpoint market-data-batch non disponible - Ignoré');
                    return;
                }
                console.warn('⚠️ Erreur vérification cache prix:', error);
                // Non-bloquant - continuer le chargement même si la vérification échoue
            }
        };

        const loadTickersFromSupabase = async () => {
            // Éviter les chargements multiples simultanés
            if (isLoadingTickers) {
                console.log('⏳ Chargement tickers déjà en cours, ignoré');
                return;
            }
            
            // ✅ Stocker la fonction dans useRef pour utilisation dans useRealtimeSync
            loadTickersFromSupabaseRef.current = loadTickersFromSupabase;
            
            // ✅ NE PAS marquer comme chargé AVANT d'avoir réussi (pour permettre retry si échec)
            setIsLoadingTickers(true);
            setTickersLoadError(null);
            
            console.log('📡 Début chargement tickers depuis Supabase...');

            try {
                const result = await loadAllTickersFromSupabase();

                if (!result.success) {
                    const errorMsg = result.error || 'Erreur lors du chargement des tickers';
                    console.error('❌ Échec chargement tickers:', errorMsg);
                    setTickersLoadError(errorMsg);
                    setIsLoadingTickers(false);
                    hasLoadedTickersRef.current = false; // Réessayer au prochain render
                    
                    // ✅ Afficher notification d'erreur visible
                    showNotification(
                        `❌ Impossible de charger les tickers: ${errorMsg}\n\nVérifiez votre connexion et réessayez.`,
                        'error'
                    );
                    return;
                }
                
                // ✅ Vérifier qu'on a bien des tickers
                if (!result.tickers || result.tickers.length === 0) {
                    console.warn('⚠️ Aucun ticker retourné par l\'API');
                    setTickersLoadError('Aucun ticker trouvé dans la base de données');
                    setIsLoadingTickers(false);
                    hasLoadedTickersRef.current = false;
                    
                    showNotification(
                        '⚠️ Aucun ticker trouvé dans la base de données.\n\nVérifiez que des tickers sont actifs dans Supabase.',
                        'warning'
                    );
                    return;
                }
                
                console.log(`✅ ${result.tickers.length} tickers chargés depuis Supabase`);
                
                // ✅ Marquer comme chargé seulement après succès
                hasLoadedTickersRef.current = true;

                // Mettre à jour le cache pour handleSelectTicker
                supabaseTickersCacheRef.current = {
                    data: result.tickers,
                    timestamp: Date.now()
                };

                // Identifier les nouveaux tickers AVANT la mise à jour (utiliser setLibrary avec fonction)
                let newTickers: typeof result.tickers = [];

                // ✅ MIGRATION : Créer un Map de source pour tous les tickers Supabase
                const sourceMap = new Map<string, 'team' | 'watchlist' | 'both' | 'manual'>();
                result.tickers.forEach(t => {
                    sourceMap.set(t.ticker.toUpperCase(), t.source);
                });

                // Merge intelligent : ne pas écraser les profils existants
                setLibrary(prev => {
                    const existingSymbols = new Set(Object.keys(prev));
                    newTickers = result.tickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        // Exclure si déjà dans library
                        if (existingSymbols.has(symbol)) {
                            return false;
                        }
                        // Exclure les fonds mutuels
                        if (isMutualFund(symbol, t.company_name)) {
                            console.warn(`⚠️ ${symbol}: Fonds mutuel détecté - exclu du chargement automatique`);
                            return false;
                        }
                        return true;
                    });
                    
                    // ✅ DEBUG: Compter les team tickers dans newTickers vs déjà dans library
                    const teamTickersInNew = newTickers.filter(t => t.source === 'team' || t.source === 'both');
                    const teamTickersAlreadyInLibrary = result.tickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return (t.source === 'team' || t.source === 'both') && existingSymbols.has(symbol);
                    });
                    
                    console.log(`📊 Team tickers: ${teamTickersInNew.length} nouveaux à créer, ${teamTickersAlreadyInLibrary.length} déjà dans library`);
                    if (teamTickersInNew.length > 0) {
                        console.log(`   ➕ Nouveaux:`, teamTickersInNew.map(t => t.ticker).join(', '));
                    }
                    if (teamTickersAlreadyInLibrary.length > 0) {
                        console.log(`   🔄 Déjà dans library (seront mis à jour):`, teamTickersAlreadyInLibrary.map(t => t.ticker).join(', '));
                    }

                    const updated = { ...prev };
                    let newTickersCount = 0;
                    let migrationCount = 0;

                    // ✅ MIGRATION : Corriger TOUS les profils existants qui ne sont pas dans Supabase
                    // Si un profil existe dans localStorage mais pas dans Supabase, le marquer comme 'manual' (null)
                    Object.keys(updated).forEach(symbol => {
                        if (!sourceMap.has(symbol)) {
                            // Ticker existe localement mais pas dans Supabase → Normal (pas d'icône)
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
                        
                        // Si le profil existe déjà, mettre à jour les métriques ValueLine depuis Supabase
                        if (updated[tickerSymbol]) {
                            // ✅ MIGRATION FORCÉE : Toujours mettre à jour isWatchlist depuis Supabase
                            // Les profils existants peuvent avoir un ancien isWatchlist incorrect
                            const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                            
                            // Mettre à jour les métriques ValueLine depuis Supabase (si elles existent)
                            const hasValueLineUpdates = supabaseTicker.security_rank || 
                                                       supabaseTicker.earnings_predictability || 
                                                       supabaseTicker.price_growth_persistence || 
                                                       supabaseTicker.price_stability;
                            
                            // ✅ FORCER la mise à jour de isWatchlist même si identique (migration)
                            // Cela corrige les profils existants qui ont un ancien état incorrect
                            const needsUpdate = updated[tickerSymbol].isWatchlist !== shouldBeWatchlist || hasValueLineUpdates;
                            const isTeamTicker = supabaseTicker.source === 'team' || supabaseTicker.source === 'both';
                            
                            // ✅ DEBUG: Log pour les team tickers existants
                            if (isTeamTicker && needsUpdate) {
                                console.log(`   🔄 Mise à jour team ticker existant: ${tickerSymbol} (isWatchlist: ${updated[tickerSymbol].isWatchlist} → ${shouldBeWatchlist})`);
                            }
                            
                            if (needsUpdate) {
                                updated[tickerSymbol] = {
                                    ...updated[tickerSymbol],
                                    isWatchlist: shouldBeWatchlist, // ✅ FORCER mise à jour depuis Supabase
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
                                migrationCount++;
                                
                                // Si c'est le profil actif, mettre à jour aussi le state local
                                if (tickerSymbol === activeIdRef.current) {
                                    setInfo(updated[tickerSymbol].info);
                                    setIsWatchlist(shouldBeWatchlist ?? false);
                                }
                            } else if (updated[tickerSymbol].isWatchlist !== shouldBeWatchlist) {
                                // ✅ Même si pas d'autres updates, forcer isWatchlist pour migration
                                updated[tickerSymbol] = {
                                    ...updated[tickerSymbol],
                                    isWatchlist: shouldBeWatchlist
                                };
                                migrationCount++;
                                
                                // Si c'est le profil actif, mettre à jour aussi le state local
                                if (tickerSymbol === activeIdRef.current) {
                                    setIsWatchlist(shouldBeWatchlist ?? false);
                                }
                            }
                            return;
                        }

                        // ✅ NOUVEAU : Créer un profil squelette IMMÉDIATEMENT pour affichage
                        // Même si le profil n'existe pas encore, on le crée avec les infos de base depuis Supabase
                        const isWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                        const isTeamTicker = supabaseTicker.source === 'team' || supabaseTicker.source === 'both';
                        
                        // ✅ CRITIQUE : Ne pas utiliser INITIAL_ASSUMPTIONS (valeurs à 0) pour les squelettes
                        // Créer un objet assumptions minimal avec seulement les champs requis, sans valeurs inventées
                        updated[tickerSymbol] = {
                            id: tickerSymbol,
                            lastModified: Date.now(),
                            data: [], // Données vides pour l'instant
                            assumptions: {
                                // ✅ Seulement les champs requis, pas de valeurs inventées (0)
                                currentPrice: 0, // Sera mis à jour lors du chargement FMP
                                currentDividend: 0,
                                baseYear: new Date().getFullYear(),
                                requiredReturn: 10.0, // Valeur par défaut raisonnable
                                // ✅ Tous les autres champs sont undefined (pas 0) pour éviter les valeurs inventées
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
                        
                        // ✅ DEBUG: Log pour les team tickers créés
                        if (isTeamTicker) {
                            console.log(`   ⭐ Création profil squelette team ticker: ${tickerSymbol} (source: ${supabaseTicker.source}, isWatchlist: ${isWatchlist})`);
                        }
                        
                        newTickersCount++;
                    });

                    // ✅ NOUVEAU : Sauvegarder dans cache avec timestamp (fire and forget)
                    saveToCache(updated).catch(e => console.warn('Failed to save to cache:', e));

                    if (newTickersCount > 0) {
                        console.log(`✅ ${newTickersCount} nouveaux profils squelettes créés depuis Supabase`);
                        console.log(`📊 Library après migration: ${Object.keys(updated).length} profils (dont ${Object.keys(updated).filter(k => k !== DEFAULT_PROFILE.id).length} réels)`);
                    } else {
                        console.log(`ℹ️ Aucun nouveau ticker - ${Object.keys(updated).length} profils déjà dans library`);
                    }

                    // ✅ DEBUG: Compter les profils avec isWatchlist=false après migration
                    const portfolioCount = Object.values(updated).filter((p: any) => p.isWatchlist === false).length;
                    const watchlistCount = Object.values(updated).filter((p: any) => p.isWatchlist === true).length;
                    const normalCount = Object.values(updated).filter((p: any) => p.isWatchlist === null || p.isWatchlist === undefined).length;
                    
                    // ✅ DEBUG: Identifier les team tickers manquants (après création profils squelettes)
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
                        console.log(`🔄 Migration: ${migrationCount} profil(s) mis à jour avec isWatchlist depuis Supabase`);
                    }
                    
                    if (teamTickersInSupabaseAfter.length !== teamTickersInLibraryAfter.length) {
                        console.warn(`⚠️ ${teamTickersInSupabaseAfter.length} team tickers dans Supabase, mais seulement ${teamTickersInLibraryAfter.length} avec ⭐ dans library`);
                        if (missingTeamTickersAfter.length > 0) {
                            console.warn(`   📋 ${missingTeamTickersAfter.length} team ticker(s) manquant(s) ou incorrect(s):`, missingTeamTickersAfter.map(t => `${t.ticker} (source: ${t.source})`).join(', '));
                        }
                    } else {
                        console.log(`✅ Tous les ${teamTickersInSupabaseAfter.length} team tickers ont ⭐ (isWatchlist=false)`);
                    }
                    
                    console.log(`📊 Après migration - Portefeuille (⭐): ${portfolioCount}, Watchlist (👁️): ${watchlistCount}, Normaux: ${normalCount}, Total: ${Object.keys(updated).length}`);
                    
                    // ✅ VÉRIFICATION: S'assurer que tous les team tickers ont isWatchlist=false
                    const teamTickersInSupabase = result.tickers.filter(t => {
                        const mapped = mapSourceToIsWatchlist(t.source);
                        return mapped === false; // Portefeuille
                    });
                    const teamTickersInLibrary = teamTickersInSupabase.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return updated[symbol] && updated[symbol].isWatchlist === false;
                    });
                    
                    // Séparer les tickers manquants (pas dans localStorage) des incorrects (isWatchlist !== false)
                    const missingTickers = teamTickersInSupabase.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return !updated[symbol];
                    });
                    const incorrectTickers = teamTickersInSupabase.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        return updated[symbol] && updated[symbol].isWatchlist !== false;
                    });
                    
                    if (teamTickersInSupabase.length !== teamTickersInLibrary.length) {
                        console.warn(`⚠️ ${teamTickersInSupabase.length - teamTickersInLibrary.length} team ticker(s) manquant(s) ou incorrect(s) sur ${teamTickersInSupabase.length} attendus:`);
                        if (missingTickers.length > 0) {
                            console.warn(`   📋 ${missingTickers.length} ticker(s) non chargé(s) depuis FMP:`, missingTickers.map(t => t.ticker).join(', '));
                        }
                        if (incorrectTickers.length > 0) {
                            console.warn(`   ❌ ${incorrectTickers.length} ticker(s) avec isWatchlist incorrect:`, incorrectTickers.map(t => t.ticker).join(', '));
                        }
                        console.log(`   ✅ ${teamTickersInLibrary.length} ticker(s) correctement configuré(s) dans localStorage`);
                    } else {
                        console.log(`✅ Tous les ${teamTickersInSupabase.length} team tickers ont isWatchlist=false`);
                    }

                    return updated;
                });

                // ✅ OPTIMISATION PERFORMANCE : Créer des profils "squelettes" immédiatement
                // pour affichage instantané, puis charger les données FMP en arrière-plan
                if (newTickers.length > 0) {
                    // Filtrer les fonds mutuels AVANT tout appel API
                    const validTickers = newTickers.filter(t => {
                        const symbol = t.ticker.toUpperCase();
                        if (isMutualFund(symbol, t.company_name)) {
                            console.warn(`⚠️ ${symbol}: Fonds mutuel détecté - profil NON créé (exclu automatiquement)`);
                            return false;
                        }
                        return true;
                    });

                    if (validTickers.length === 0) {
                        console.log('✅ Aucun ticker valide après filtrage des fonds mutuels');
                        setIsLoadingTickers(false); // ✅ Libérer le loading immédiatement
                        return;
                    }

                    // ✅ ÉTAPE 1 : Créer des profils "squelettes" immédiatement pour affichage instantané
                    const skeletonProfiles: Record<string, AnalysisProfile> = {};
                    validTickers.forEach(supabaseTicker => {
                        const symbol = supabaseTicker.ticker.toUpperCase();
                        const isWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                        
                        // ✅ CRITIQUE : Ne pas utiliser INITIAL_ASSUMPTIONS (valeurs à 0) pour les squelettes
                        skeletonProfiles[symbol] = {
                            id: symbol,
                            lastModified: Date.now(),
                            data: [], // Données vides pour l'instant
                            assumptions: {
                                // ✅ Seulement les champs requis, pas de valeurs inventées (0)
                                currentPrice: 0,
                                currentDividend: 0,
                                baseYear: new Date().getFullYear(),
                                requiredReturn: 10.0,
                                // ✅ Tous les autres champs sont undefined (pas 0) pour éviter les valeurs inventées
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

                    // Ajouter les profils squelettes immédiatement pour affichage
                    setLibrary(prev => {
                        const updated = { ...prev, ...skeletonProfiles };
                        console.log(`📊 ${Object.keys(skeletonProfiles).length} profils squelettes ajoutés à library (total: ${Object.keys(updated).length})`);
                        // ✅ NOUVEAU : Sauvegarder dans cache avec timestamp
                        saveToCache(updated).catch(e => console.warn('Failed to save to cache:', e));
                        return updated;
                    });

                    // ✅ Libérer le loading immédiatement pour afficher la liste
                    setIsLoadingTickers(false);
                    console.log(`✅ ${validTickers.length} profils squelettes créés - affichage immédiat`);


                    // ✅ ÉTAPE 2 : Charger les données depuis Supabase d'abord, puis FMP si nécessaire
                    // Utiliser requestIdleCallback pour ne pas bloquer l'UI
                    const loadFMPDataInBackground = async () => {
                        const batchSize = 50; // Plus grand batch car Supabase est rapide
                        const delayBetweenBatches = 200; // Délai réduit

                        for (let i = 0; i < validTickers.length; i += batchSize) {
                            const batch = validTickers.slice(i, i + batchSize);
                            
                            // Petit délai entre batches pour ne pas surcharger
                            if (i > 0) {
                                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                            }

                            // ✅ OPTIMISATION : Charger depuis Supabase en batch (beaucoup plus rapide)
                            const tickerSymbols = batch.map(t => t.ticker.toUpperCase());
                            const supabaseResults = await loadProfilesBatchFromSupabase(tickerSymbols);

                            // Traiter chaque résultat
                            await Promise.allSettled(

                                batch.map(async (supabaseTicker) => {
                                    if (!supabaseTicker.ticker) return; // ✅ Guard clause: Skip invalid tickers
                                    
                                    const symbol = supabaseTicker.ticker.toUpperCase();
                                    if (!symbol || symbol.trim() === '') return; // ✅ Double check
                                    
                                    const supabaseResult = supabaseResults[symbol];
                                    
                                    try {
                                        let result: any;
                                        
                                        // ✅ LOGIQUE SIMPLIFIÉE : Utiliser Supabase si disponible, sinon FMP
                                        if (supabaseResult && supabaseResult.source === 'supabase' && 
                                            supabaseResult.data && supabaseResult.data.length > 0) {
                                            // ✅ CAS 1 : Snapshot Supabase existe → Utiliser directement (PAS de FMP)
                                            result = supabaseResult;
                                            console.log(`✅ ${symbol}: Chargé depuis Supabase (snapshot existant)`);
                                        } else {
                                            // ✅ CAS 2 : Pas de snapshot → Charger depuis FMP (première fois)
                                            console.log(`⚠️ ${symbol}: Pas de snapshot Supabase → Chargement FMP`);
                                            const fmpResult = await fetchCompanyData(symbol);
                                            
                                            if (!fmpResult.data || fmpResult.data.length === 0) {
                                                console.error(`❌ ${symbol}: Aucune donnée FMP disponible`);
                                                return;
                                            }
                                            
                                            result = {
                                                data: fmpResult.data,
                                                info: fmpResult.info,
                                                currentPrice: fmpResult.currentPrice,
                                                source: 'fmp' as const
                                            };
                                            
                                            // ✅ IMPORTANT : Sauvegarder dans Supabase après chargement FMP
                                            try {
                                                const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                                                    fmpResult.data,
                                                    fmpResult.currentPrice,
                                                    INITIAL_ASSUMPTIONS
                                                );
                                                
                                                await saveSnapshot(
                                                    symbol,
                                                    fmpResult.data,
                                                    {
                                                        ...INITIAL_ASSUMPTIONS,
                                                        ...autoFilledAssumptions
                                                    },
                                                    {
                                                        symbol: symbol,
                                                        name: fmpResult.info.name || symbol,
                                                        ...fmpResult.info
                                                    } as CompanyInfo,
                                                    `Auto-sauvegarde après chargement initial - ${new Date().toLocaleString()}`,
                                                    true,  // is_current
                                                    true   // auto_fetched
                                                );
                                            } catch (saveError) {
                                                console.warn(`⚠️ ${symbol}: Erreur sauvegarde snapshot (non bloquant):`, saveError);
                                            }
                                        }
                                        
                                        // VALIDATION : Vérifier que les données sont valides
                                        if (!result.data || result.data.length === 0) {
                                            return;
                                        }
                                        
                                        if (!result.currentPrice || result.currentPrice <= 0) {
                                            return;
                                        }
                                        
                                        // Vérifier qu'on a au moins une année avec des données valides
                                        const hasValidData = result.data.some((d: any) => 
                                            d.earningsPerShare > 0 || d.cashFlowPerShare > 0 || d.bookValuePerShare > 0
                                        );
                                        
                                        if (!hasValidData) {
                                            return;
                                        }
                                    
                                    // ✅ TOUTES LES VALIDATIONS PASSÉES - Créer le profil avec les données
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
                                            INITIAL_ASSUMPTIONS
                                        ) as Assumptions;
                                    }
                                    
                                    // Détecter et exclure automatiquement les métriques avec prix cibles aberrants
                                    const outlierDetection = detectOutlierMetrics(result.data, baseAssumptions);
                                    
                                    if (outlierDetection.detectedOutliers.length > 0) {
                                        console.log(`⚠️ ${symbol}: Métriques aberrantes auto-exclues: ${outlierDetection.detectedOutliers.join(', ')}`);
                                    }
                                    
                                    // Appliquer les exclusions détectées
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
                                    
                                    // ✅ Mettre à jour le profil
                                    setLibrary(prev => {
                                        if (!prev[symbol]) return prev;
                                        const updated = {
                                            ...prev,
                                            [symbol]: {
                                                ...newProfile,
                                                _isSkeleton: false
                                            }
                                        };
                                        // ✅ NOUVEAU : Sauvegarder dans cache avec timestamp
                                        saveToCache(updated).catch(e => console.warn('Failed to save to cache:', e));
                                        return updated;
                                    });
                                    
                                    console.log(`✅ ${symbol}: Profil mis à jour depuis ${result.source === 'supabase' ? 'Supabase' : 'FMP'}`);
                                } catch (error) {
                                    console.error(`❌ ${symbol}: Erreur chargement données:`, error);
                                }
                            })
                        );
                        }
                    };

                    // Démarrer le chargement en arrière-plan (non-bloquant)
                    if (typeof requestIdleCallback !== 'undefined') {
                        requestIdleCallback(() => {
                            loadFMPDataInBackground();
                        }, { timeout: 2000 });
                    } else {
                        setTimeout(() => {
                            loadFMPDataInBackground();
                        }, 100);
                    }
                } else {
                    // Aucun nouveau ticker - libérer le loading
                    setIsLoadingTickers(false);
                }

            } catch (error: any) {
                console.error('❌ Erreur lors du chargement des tickers:', error);
                setTickersLoadError(error.message || 'Erreur inconnue');
                hasLoadedTickersRef.current = false; // Réessayer au prochain render
            } finally {
                setIsLoadingTickers(false);
            }
        };

        // ✅ Vérifier et mettre à jour le cache prix en parallèle (non-bloquant)
        refreshPriceCacheIfNeeded();
        
        // Charger les tickers
        loadTickersFromSupabase();

        // ✅ Synchronisation périodique avec Supabase (toutes les 2 minutes)
        // Pour s'assurer que tous les utilisateurs voient les mêmes tickers
        const syncIntervalId = setInterval(() => {
            if (!isLoadingTickers && hasLoadedTickersRef.current) {
                console.log('🔄 Synchronisation périodique avec Supabase pour cohérence multi-utilisateurs...');
                hasLoadedTickersRef.current = false;
                supabaseTickersCacheRef.current = null; // Invalider le cache
                loadTickersFromSupabase();
            }
        }, 120000); // 2 minutes

        // ✅ Mise à jour automatique du cache prix toutes les 5 minutes pendant la session
        const intervalId = setInterval(() => {
            refreshPriceCacheIfNeeded();
        }, 5 * 60 * 1000); // 5 minutes

        // Nettoyer l'interval quand le composant est démonté ou la page est fermée
        return () => {
            clearInterval(intervalId);
            clearInterval(syncIntervalId);
        };
    }, [isInitialized]); // Seulement après l'initialisation - pas de dépendance à library pour éviter la boucle

    // --- ACTIVE SESSION STATE ---
    const [data, setData] = useState<AnnualData[]>(INITIAL_DATA);
    const [assumptions, _setAssumptionsRaw] = useState<Assumptions>(INITIAL_ASSUMPTIONS);
    const [info, setInfo] = useState<CompanyInfo>(INITIAL_INFO);
    const [notes, setNotes] = useState<string>('');
    const [isWatchlist, setIsWatchlist] = useState<boolean>(false);

    // ✅ WRAPPER SIMPLE : Sanitis automatiquement toutes les mises à jour d'assumptions
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
                    requestIdleCallback(async () => {
                        try {
                            await storage.setItem(STORAGE_KEY, updated);
                        } catch (e) {
                            console.warn('Failed to save to Storage:', e);
                        }
                    }, { timeout: 1000 });
                } else {
                    // Fallback pour navigateurs sans requestIdleCallback
                    setTimeout(async () => {
                        try {
                            await storage.setItem(STORAGE_KEY, updated);
                        } catch (e) {
                            console.warn('Failed to save to Storage:', e);
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
            // Save current version if requested AND we have valid data
            if (saveCurrentVersion) {
                // Strict validation to prevent 400 errors from API
                const hasValidData = data && data.length > 0;
                const hasValidInfo = info && info.symbol && info.name;
                const hasValidAssumptions = assumptions && typeof assumptions === 'object';

                if (hasValidData && hasValidInfo && hasValidAssumptions) {
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
                        console.warn('Backup save warning:', saveResult.error);
                        // Non-blocking error
                    }
                } else {
                    console.log('⚠️ Skipping backup save: Incomplete data state', { hasValidData, hasValidInfo, hasValidAssumptions });
                }
            }

            // Fetch new data from API
            const result = await fetchCompanyData(activeId);

            // Keep existing history for Undo
            setPastData(prev => [...prev, data]);
            setFutureData([]);

            // ✅ CRITIQUE : Déclarer mergedData en dehors du if pour qu'il soit accessible partout
            let mergedData: AnnualData[] = data.length > 0 ? [...data] : [];

            // Update Data avec merge intelligent : préserver les données manuelles
            if (result.data.length > 0) {
                // Merge intelligent : préserver les données manuelles (comme dans handleBulkSyncAllTickers)
                const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                
                mergedData = data.map((existingRow) => {
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
                        ...(newRow as AnnualData),
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

            // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
            // ⚠️ IMPORTANT : On préserve les hypothèses existantes (orange) sauf currentPrice
            // ✅ CRITIQUE : Utiliser mergedData (défini ci-dessus) au lieu de data (ancienne valeur)
            // mergedData contient les données mergées avec préservation des données manuelles
            const mergedDataForCalc = mergedData.length > 0 ? mergedData : result.data;
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
            // ✅ CRITIQUE : Utiliser mergedData (défini ci-dessus) qui contient les données mergées
            const finalData = mergedData.length > 0 ? mergedData : result.data;
            
            // ✅ SIMPLIFIÉ : Plus besoin de sanitiser manuellement, setAssumptions le fait automatiquement !
            // Merger les assumptions (auto-filled prend priorité sur existantes)
            const finalAssumptions = {
                ...assumptions,
                ...autoFilledAssumptions // Les valeurs auto-remplies prennent priorité
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

            // ✅ SIMPLIFIÉ : setAssumptions sanitis automatiquement !
            setAssumptions(assumptionsWithOutlierExclusions);

            // Auto-save snapshot after successful sync
            // ✅ saveSnapshot sanitis aussi, donc double protection
            console.log('💾 Auto-saving snapshot after API sync...');
            await saveSnapshot(
                activeId,
                finalData,
                assumptionsWithOutlierExclusions, // setAssumptions a déjà sanitisé, saveSnapshot sanitisera aussi
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
                // Vérifier si c'est un fonds mutuel
                if (isMutualFund(activeId, result.info.name)) {
                    throw new Error(`${activeId} est un fonds mutuel et ne peut pas être analysé avec les ratios d'entreprise`);
                }
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
                    ...(newRow as AnnualData),
                    autoFetched: true
                };
            });

            // Ajouter les nouvelles années qui n'existent pas dans les données existantes
            result.data.forEach(newRow => {
                const exists = mergedData.some(row => row.year === newRow.year);
                if (!exists) {
                    mergedData.push({
                        ...(newRow as AnnualData),
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
            } as Assumptions;
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
            
            // ✅ VÉRIFICATION CRITIQUE : Si c'est un profil squelette ou si les données sont vides, charger depuis FMP
            const isSkeleton = (existingProfile as any)._isSkeleton === true;
            const hasNoData = !existingProfile.data || existingProfile.data.length === 0;
            const hasNoPrice = !existingProfile.assumptions?.currentPrice || existingProfile.assumptions.currentPrice === 0;
            
            if (isSkeleton || hasNoData || hasNoPrice) {
                console.log(`🔄 ${upperSymbol}: Profil squelette ou données vides détectées - Chargement FMP...`);
                // Ne pas return ici, continuer pour charger les données FMP
            } else {
                // ✅ Profil valide avec données - Charger normalement
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
                // Vérifier si c'est un fonds mutuel
                if (isMutualFund(upperSymbol, result.info.name)) {
                    throw new Error(`${upperSymbol} est un fonds mutuel et ne peut pas être analysé avec les ratios d'entreprise`);
                }
                throw new Error(`Aucune donnée financière valide pour ${upperSymbol}`);
            }

            // ✅ DÉTECTION : Profil existant (squelette ou vide) ou nouveau profil
            const existingProfile = library[upperSymbol];
            const isUpdatingSkeleton = existingProfile && ((existingProfile as any)._isSkeleton === true || !existingProfile.data || existingProfile.data.length === 0);
            const existingData = existingProfile?.data || [];

            // ✅ MERGE INTELLIGENT : Préserver les données manuelles (orange) comme dans performSync
            const newDataByYear = new Map(result.data.map(row => [row.year, row]));
            
            const mergedData = existingData.map((existingRow) => {
                const newRow = newDataByYear.get(existingRow.year);
                
                // Si pas de nouvelle donnée pour cette année, garder l'existant
                if (!newRow) {
                    return existingRow;
                }

                // ✅ CRITIQUE : Si la donnée existante est manuelle (autoFetched: false ou undefined), la garder
                if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                    return existingRow; // Préserver la donnée manuelle (orange)
                }

                // Sinon, utiliser la nouvelle donnée avec autoFetched: true
                return {
                    ...(newRow as AnnualData),
                    autoFetched: true
                };
            });

            // Ajouter les nouvelles années qui n'existent pas dans les données existantes
            result.data.forEach(newRow => {
                const exists = mergedData.some(row => row.year === newRow.year);
                if (!exists) {
                    mergedData.push({
                        ...(newRow as AnnualData),
                        autoFetched: true
                    });
                }
            });

            // Trier par année
            mergedData.sort((a, b) => a.year - b.year);

            // ✅ IMPORTANT : Utiliser les données mergées (avec préservation des données manuelles) pour le calcul
            // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
            // ⚠️ CRITIQUE : Préserver les hypothèses existantes (orange) sauf currentPrice
            // ✅ NOUVEAU : autoFillAssumptionsFromFMPData préserve maintenant automatiquement les valeurs existantes
            const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                mergedData, // ✅ Utiliser mergedData au lieu de result.data
                result.currentPrice,
                existingProfile?.assumptions || INITIAL_ASSUMPTIONS
            );

            // ✅ MERGE INTELLIGENT : Préserver les valeurs existantes (orange) AVANT d'appliquer les nouvelles
            // L'ordre est important : d'abord les nouvelles valeurs calculées, puis les valeurs existantes par-dessus
            // Cela garantit que les valeurs manuelles (orange) ne sont jamais écrasées
            const existingAssumptions = existingProfile?.assumptions || INITIAL_ASSUMPTIONS;
            const tempAssumptions = {
                ...autoFilledAssumptions, // Nouvelles valeurs calculées (qui préservent déjà les valeurs existantes)
                // ✅ PRÉSERVER explicitement les valeurs existantes pour être sûr (double protection)
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
                // Préserver aussi les ratios cibles si définis
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
                // Préserver les autres valeurs existantes
                requiredReturn: existingAssumptions.requiredReturn || autoFilledAssumptions.requiredReturn,
                dividendPayoutRatio: existingAssumptions.dividendPayoutRatio || autoFilledAssumptions.dividendPayoutRatio,
                excludeEPS: existingAssumptions.excludeEPS,
                excludeCF: existingAssumptions.excludeCF,
                excludeBV: existingAssumptions.excludeBV,
                excludeDIV: existingAssumptions.excludeDIV
            } as Assumptions;
            const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
            
            if (outlierDetection.detectedOutliers.length > 0) {
                console.log(`⚠️ ${upperSymbol}: Outliers détectés: ${outlierDetection.detectedOutliers.join(', ')}`);
            }

            // ✅ SANITISER les assumptions finales pour appliquer les guardrails
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
                data: mergedData, // ✅ Utiliser mergedData au lieu de result.data
                assumptions: finalAssumptions, // ✅ Utiliser finalAssumptions avec guardrails
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
            
            // ✅ RETIRER LE FLAG SQUELETTE si présent
            delete (updatedProfile as any)._isSkeleton;
            
            // Mettre à jour ou créer le profil
            setLibrary(prev => {
                const updated = {
                    ...prev,
                    [upperSymbol]: updatedProfile
                };
                
                // ✅ NOUVEAU : Sauvegarder dans cache avec timestamp (fire and forget)
                saveToCache(updated).catch(e => console.warn('Failed to save to cache:', e));
                
                return updated;
            });
            
            setActiveId(upperSymbol);
            setData(mergedData); // ✅ Utiliser mergedData pour préserver les données orange
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
                showNotification(`✅ ${upperSymbol} chargé avec succès (profil mis à jour)`, 'success');
                console.log(`✅ ${upperSymbol}: Profil squelette mis à jour avec données FMP valides`);
            } else {
                showNotification(`✅ ${upperSymbol} chargé avec succès`, 'success');
                console.log(`✅ ${upperSymbol}: Profil créé avec données FMP valides`);
            }
        } catch (e) {
            const error = e as Error;
            console.error(`❌ ${upperSymbol}: Erreur FMP - profil NON créé:`, error);
            showNotification(`❌ Impossible de charger ${upperSymbol}: ${error.message}`, 'error');
            // ⚠️ RIGUEUR 100% : Ne pas créer de profil si FMP échoue
        }
    };

    const handleDeleteTicker = async (id: string) => {
        // Delete from local storage and state
        const newLib = { ...library };
        delete newLib[id];
        setLibrary(newLib);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLib));

        // Update active ticker if needed
        if (activeId === id) {
            const remaining = Object.keys(newLib);
            if (remaining.length > 0) {
                // Sélectionner le premier ticker en ordre alphabétique
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
                console.log(`✅ ${id} supprimé de Supabase:`, result.removed_from);
                showNotification(`✅ ${id} supprimé définitivement`, 'success');
            } else {
                console.warn(`⚠️ ${id} non trouvé dans Supabase`, result);
            }
        } catch (error) {
            console.error(`❌ Erreur suppression Supabase pour ${id}:`, error);
            // Ne pas bloquer l'UI - la suppression locale a déjà été faite
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
    const [syncStats, setSyncStats] = useState({ successCount: 0, errorCount: 0 });
    
    // Sync Control Refs & State
    const abortSync = useRef(false);
    const isSyncPaused = useRef(false);
    const [syncPausedState, setSyncPausedState] = useState(false);

    const handleBulkSyncAllTickers = async () => {
        if (!confirm(`Synchroniser tous les ${Object.keys(library).length} tickers ?\n\nChaque version sera sauvegardée avant la synchronisation.\nLes données manuelles et hypothèses (orange) seront préservées.`)) {
            return;
        }

        setIsBulkSyncing(true);
        // Reset controls
        abortSync.current = false;
        isSyncPaused.current = false;
        setSyncPausedState(false);

        const allTickers = Object.keys(library);
        setBulkSyncProgress({ current: 0, total: allTickers.length });
        setSyncStats({ successCount: 0, errorCount: 0 });

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        
        // ✅ OPTIMISATION: Batch size pour FMP (5 tickers en parallèle)
        const FMP_BATCH_SIZE = 5;
        // ✅ OPTIMISATION: Délai réduit entre batches (500ms au lieu de 2000ms)
        const delayBetweenBatches = 500;
        // ✅ OPTIMISATION: Délai réduit entre tickers dans un batch (100ms)
        const delayBetweenTickersInBatch = 100;
        // ✅ TIMEOUT: Timeout pour chaque appel FMP (30 secondes)
        const FMP_TIMEOUT_MS = 30000;

        // ✅ FONCTION HELPER: fetchCompanyData avec timeout
        const fetchCompanyDataWithTimeout = async (tickerSymbol: string): Promise<any> => {
            return Promise.race([
                fetchCompanyData(tickerSymbol),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout après ${FMP_TIMEOUT_MS}ms`)), FMP_TIMEOUT_MS)
                )
            ]);
        };

        try {
            console.log(`🚀 Début synchronisation: ${allTickers.length} tickers en ${Math.ceil(allTickers.length / FMP_BATCH_SIZE)} batches`);
            
            // Traiter par batch pour optimiser les appels FMP
            for (let i = 0; i < allTickers.length; i += FMP_BATCH_SIZE) {
            // 0. Check for Pause or Abort
            if (abortSync.current) {
                console.log('🛑 Synchronisation arrêtée par l\'utilisateur.');
                break;
            }

            while (isSyncPaused.current) {
                if (abortSync.current) break;
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (abortSync.current) break;

            const batch = allTickers.slice(i, i + FMP_BATCH_SIZE);
            
            // ✅ OPTIMISATION: Récupérer les données FMP en batch
            const fmpResults = await Promise.allSettled(
                batch.map(async (tickerSymbol) => {
                    try {
                        const profile = library[tickerSymbol];
                        if (!profile) {
                            return { tickerSymbol, success: false, error: 'Profil non trouvé', result: null };
                        }

                        // 1. Sauvegarder un snapshot avant la sync
                        console.log(`💾 Sauvegarde snapshot pour ${tickerSymbol}...`);
                        await saveSnapshot(
                            tickerSymbol,
                            profile.data,
                            profile.assumptions,
                            profile.info,
                            `Avant synchronisation globale - ${new Date().toLocaleString()}`,
                            false, 
                            false 
                        );

                        // 2. Charger les nouvelles données FMP avec timeout
                        console.log(`🔄 Synchronisation ${tickerSymbol}...`);
                        const result = await fetchCompanyDataWithTimeout(tickerSymbol);
                        
                        return { tickerSymbol, success: true, result, profile };
                    } catch (error: any) {
                        return { 
                            tickerSymbol, 
                            success: false, 
                            error: error.message || 'Erreur inconnue', 
                            result: null,
                            profile: library[tickerSymbol] || null
                        };
                    }
                })
            );

            // Traiter les résultats du batch
            for (const fmpResult of fmpResults) {
                // ✅ Vérifier pause/arrêt avant chaque ticker
                if (abortSync.current) {
                    console.log('🛑 Synchronisation arrêtée par l\'utilisateur.');
                    break;
                }

                while (isSyncPaused.current) {
                    if (abortSync.current) break;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                if (abortSync.current) break;

                if (fmpResult.status === 'fulfilled') {
                    const { tickerSymbol, success, result, error, profile } = fmpResult.value;

                    if (!success || !result || !profile) {
                        errorCount++;
                        setSyncStats({ successCount, errorCount });
                        const errorMsg = `${tickerSymbol}: ${error || 'Erreur inconnue'}`;
                        errors.push(errorMsg);
                        console.error(`❌ Erreur sync ${tickerSymbol}:`, error);
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
                        continue;
                    }

                    try {
                        // 3. Merge intelligent
                        const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                        const mergedData = profile.data.map((existingRow) => {
                            const newRow = newDataByYear.get(existingRow.year);
                            if (!newRow) return existingRow;
                            if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                                return existingRow; 
                            }
                            return { ...(newRow as AnnualData), autoFetched: true };
                        });

                        result.data.forEach(newRow => {
                            const exists = mergedData.some(row => row.year === newRow.year);
                            if (!exists) {
                                mergedData.push({ ...(newRow as AnnualData), autoFetched: true });
                            }
                        });
                        mergedData.sort((a, b) => a.year - b.year);

                        // 4. Recalculer métriques
                        const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                            mergedData,
                            result.currentPrice,
                            profile.assumptions 
                        );

                        // 5. Detect Outliers
                        const tempAssumptions = { ...profile.assumptions, ...autoFilledAssumptions } as Assumptions;
                        const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
                        
                        if (outlierDetection.detectedOutliers.length > 0) {
                            console.log(`⚠️ ${tickerSymbol}: Outliers détectés: ${outlierDetection.detectedOutliers.join(', ')}`);
                        }

                        const finalAssumptions = {
                            ...tempAssumptions,
                            excludeEPS: outlierDetection.excludeEPS,
                            excludeCF: outlierDetection.excludeCF,
                            excludeBV: outlierDetection.excludeBV,
                            excludeDIV: outlierDetection.excludeDIV
                        };

                        // 6. Update Library
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
                            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) { console.warn(e); }
                            return updated;
                        });

                        // 7. Save Snapshot (en parallèle si possible)
                        await saveSnapshot(
                            tickerSymbol,
                            mergedData,
                            finalAssumptions,
                            { ...profile.info, ...result.info },
                            `Synchronisation globale - ${new Date().toLocaleString()}`,
                            true, 
                            true   
                        );

                        successCount++;
                        setSyncStats({ successCount, errorCount });
                        console.log(`✅ ${tickerSymbol} synchronisé avec succès`);
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));

                        // Délai minimal entre tickers dans le batch
                        await new Promise(resolve => setTimeout(resolve, delayBetweenTickersInBatch));
                    } catch (error: any) {
                        errorCount++;
                        setSyncStats({ successCount, errorCount });
                        const errorMsg = `${tickerSymbol}: ${error.message || 'Erreur inconnue'}`;
                        errors.push(errorMsg);
                        console.error(`❌ Erreur traitement ${tickerSymbol}:`, error);
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
                    }
                } else {
                    // Promise rejected
                    const tickerSymbol = batch[fmpResults.indexOf(fmpResult)] || 'UNKNOWN';
                    errorCount++;
                    setSyncStats({ successCount, errorCount });
                    const errorMsg = `${tickerSymbol}: ${fmpResult.reason?.message || 'Erreur inconnue'}`;
                    errors.push(errorMsg);
                    console.error(`❌ Erreur sync ${tickerSymbol}:`, fmpResult.reason);
                    setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
                }
            }

            // Délai entre batches (seulement si pas le dernier batch)
            if (i + FMP_BATCH_SIZE < allTickers.length && !abortSync.current) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
            }

            console.log(`✅ Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`);
        } catch (error: any) {
            // ✅ GESTION ERREUR GLOBALE: S'assurer que le sync se termine même en cas d'erreur fatale
            console.error('❌ Erreur fatale pendant la synchronisation:', error);
            errorCount++;
            errors.push(`Erreur fatale: ${error.message || 'Erreur inconnue'}`);
        } finally {
            // ✅ GARANTIE: Toujours réinitialiser l'état, même en cas d'erreur
            setIsBulkSyncing(false);
            setBulkSyncProgress({ current: 0, total: 0 });
            
            // Afficher le résultat
            const message = `Synchronisation terminée\n\n` +
                `Réussies: ${successCount}\n` +
                `Erreurs: ${errorCount}` +
                (errors.length > 0 ? `\n\nErreurs:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... et ${errors.length - 5} autres` : ''}` : '');
            
            if (!abortSync.current) {
                 showNotification(message, errorCount > 0 ? 'warning' : 'success');
            } else {
                 showNotification("Synchronisation arrêtée manuellement.", 'warning');
            }
            console.log(`✅ ${message}`);
        }
    };

    // Synchroniser uniquement une liste spécifique de tickers (ex: ceux avec N/A)
    const handleSyncSpecificTickers = async (tickersToSync: string[]) => {
        if (tickersToSync.length === 0) {
            showNotification('Aucun ticker à synchroniser', 'warning');
            return;
        }

        if (!confirm(`Synchroniser ${tickersToSync.length} ticker(s) avec N/A ?\n\nTickers: ${tickersToSync.slice(0, 10).join(', ')}${tickersToSync.length > 10 ? `\n... et ${tickersToSync.length - 10} autres` : ''}\n\nChaque version sera sauvegardée avant la synchronisation.\nLes données manuelles et hypothèses (orange) seront préservées.`)) {
            return;
        }

        setIsBulkSyncing(true);
        setBulkSyncProgress({ current: 0, total: tickersToSync.length });
        setSyncStats({ successCount: 0, errorCount: 0 });

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Traiter par batch pour éviter de surcharger
        const batchSize = 3;
        const delayBetweenBatches = 1000;
        // ✅ TIMEOUT: Timeout pour chaque appel FMP (30 secondes)
        const FMP_TIMEOUT_MS = 30000;

        // ✅ FONCTION HELPER: fetchCompanyData avec timeout
        const fetchCompanyDataWithTimeout = async (tickerSymbol: string): Promise<any> => {
            return Promise.race([
                fetchCompanyData(tickerSymbol),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout après ${FMP_TIMEOUT_MS}ms`)), FMP_TIMEOUT_MS)
                )
            ]);
        };

        try {
            console.log(`🚀 Début synchronisation spécifique: ${tickersToSync.length} tickers`);
            
            for (let i = 0; i < tickersToSync.length; i += batchSize) {
            const batch = tickersToSync.slice(i, i + batchSize);

            // Attendre entre les batches
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }

            // Traiter le batch en parallèle (même logique que handleBulkSyncAllTickers)
            await Promise.allSettled(
                batch.map(async (tickerSymbol) => {
                    try {
                        setBulkSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));

                        const profile = library[tickerSymbol];
                        if (!profile) {
                            console.warn(`⚠️ ${tickerSymbol}: Profil non trouvé`);
                            return;
                        }

                        // 1. Sauvegarder un snapshot avant la sync
                        console.log(`💾 Sauvegarde snapshot pour ${tickerSymbol}...`);
                        await saveSnapshot(
                            tickerSymbol,
                            profile.data,
                            profile.assumptions,
                            profile.info,
                            `Avant synchronisation (N/A) - ${new Date().toLocaleString()}`,
                            false,
                            false
                        );

                        // 2. Charger les nouvelles données FMP avec timeout
                        console.log(`🔄 Synchronisation ${tickerSymbol}...`);
                        const result = await fetchCompanyDataWithTimeout(tickerSymbol);

                        // 3. Merge intelligent : préserver les données manuelles
                        const newDataByYear = new Map(result.data.map(row => [row.year, row]));
                        
                        const mergedData = profile.data.map((existingRow) => {
                            const newRow = newDataByYear.get(existingRow.year);
                            if (!newRow) return existingRow;
                            if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
                                return existingRow;
                            }
                            return {
                                ...(newRow as AnnualData),
                                autoFetched: true
                            };
                        });

                        // Ajouter les nouvelles années
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

                        // 4. Recalculer les métriques
                        const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                            mergedData,
                            result.currentPrice,
                            profile.assumptions
                        );

                        // 5. Détecter les outliers
                        const tempAssumptions = {
                            ...profile.assumptions,
                            ...autoFilledAssumptions
                        } as Assumptions;
                        const outlierDetection = detectOutlierMetrics(mergedData, tempAssumptions);
                        
                        if (outlierDetection.detectedOutliers.length > 0) {
                            console.log(`⚠️ ${tickerSymbol}: Métriques avec prix cibles aberrants détectées: ${outlierDetection.detectedOutliers.join(', ')}`);
                        }

                        const finalAssumptions: Assumptions = {
                            ...tempAssumptions,
                            excludeEPS: outlierDetection.excludeEPS,
                            excludeCF: outlierDetection.excludeCF,
                            excludeBV: outlierDetection.excludeBV,
                            excludeDIV: outlierDetection.excludeDIV
                        } as Assumptions;

                        // 6. Mettre à jour le profil
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

                            try {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                            } catch (e) {
                                console.warn('Failed to save to LocalStorage:', e);
                            }

                            return updated;
                        });

                        // 7. Sauvegarder le snapshot après sync
                        await saveSnapshot(
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

                        successCount++;
                        setSyncStats({ successCount, errorCount });
                        console.log(`✅ ${tickerSymbol} synchronisé avec succès`);

                    } catch (error: any) {
                        errorCount++;
                        setSyncStats({ successCount, errorCount });
                        const errorMsg = `${tickerSymbol}: ${error.message || 'Erreur inconnue'}`;
                        errors.push(errorMsg);
                        console.error(`❌ Erreur sync ${tickerSymbol}:`, error);
                    }
                })
            );
            }

            console.log(`✅ Synchronisation spécifique terminée: ${successCount} succès, ${errorCount} erreurs`);
        } catch (error: any) {
            // ✅ GESTION ERREUR GLOBALE: S'assurer que le sync se termine même en cas d'erreur fatale
            console.error('❌ Erreur fatale pendant la synchronisation spécifique:', error);
            errorCount++;
            errors.push(`Erreur fatale: ${error.message || 'Erreur inconnue'}`);
        } finally {
            // ✅ GARANTIE: Toujours réinitialiser l'état, même en cas d'erreur
            setIsBulkSyncing(false);
            setBulkSyncProgress({ current: 0, total: 0 });

            // Afficher le résultat
            const message = `Synchronisation terminée\n\n` +
                `Réussies: ${successCount}\n` +
                `Erreurs: ${errorCount}` +
                (errors.length > 0 ? `\n\nErreurs:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... et ${errors.length - 5} autres` : ''}` : '');
            
            showNotification(message, errorCount > 0 ? 'warning' : 'success');
            console.log(`✅ ${message}`);
        }
    };

    /**
     * --- SYNC FROM SUPABASE HANDLER ---
     * 
     * Synchronise les tickers depuis Supabase vers l'application locale.
     * 
     * Processus :
     * 1. Charge tous les tickers actifs depuis Supabase (avec fallback sur plusieurs APIs)
     * 2. Filtre par capitalisation minimale (2B USD) pour éviter les small caps
     * 3. Exclut les fonds mutuels (isMutualFund check)
     * 4. Crée des profils "squelettes" pour affichage immédiat
     * 5. Charge les données FMP en arrière-plan par batch (5 tickers/batch)
     * 6. Collecte les erreurs par type et affiche un résumé groupé
     * 
     * Gestion des erreurs :
     * - Tickers introuvables dans FMP → Résumé groupé
     * - Capitalisation < 2B → Résumé groupé
     * - Données invalides → Résumé groupé
     * - Autres erreurs → Résumé groupé
     * 
     * @see loadAllTickersFromSupabase pour la stratégie de fallback API
     * @see mapSourceToIsWatchlist pour le mapping source → isWatchlist
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

            // ✅ MIGRATION : Créer un Map de source pour tous les tickers Supabase
            const sourceMap = new Map<string, 'team' | 'watchlist' | 'both' | 'manual'>();
            result.tickers.forEach(t => {
                sourceMap.set(t.ticker.toUpperCase(), t.source);
            });

            // Merge intelligent : ne pas écraser les profils existants
            setLibrary(prev => {
                const updated = { ...prev };
                let migrationCount = 0;

                // ✅ MIGRATION : Corriger TOUS les profils existants qui ne sont pas dans Supabase
                // Si un profil existe dans localStorage mais pas dans Supabase, le marquer comme 'manual' (null)
                Object.keys(updated).forEach(symbol => {
                    if (!sourceMap.has(symbol)) {
                        // Ticker existe localement mais pas dans Supabase → Normal (pas d'icône)
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
                        // ✅ MIGRATION FORCÉE : Toujours mettre à jour isWatchlist depuis Supabase
                        // Les profils existants peuvent avoir un ancien isWatchlist incorrect
                        const hasValueLineUpdates = supabaseTicker.security_rank || 
                                                   supabaseTicker.earnings_predictability || 
                                                   supabaseTicker.price_growth_persistence || 
                                                   supabaseTicker.price_stability;
                        
                        // ✅ MIGRATION FORCÉE : Toujours mettre à jour isWatchlist depuis Supabase
                        // Même si isWatchlist semble déjà correct, forcer la mise à jour pour garantir la cohérence
                        const needsValueLineUpdate = hasValueLineUpdates;
                        const needsIsWatchlistUpdate = updated[tickerSymbol].isWatchlist !== shouldBeWatchlist;
                        
                        // ✅ FORCER la mise à jour si isWatchlist est différent OU s'il y a des mises à jour ValueLine
                        if (needsIsWatchlistUpdate || needsValueLineUpdate) {
                            updated[tickerSymbol] = {
                                ...updated[tickerSymbol],
                                isWatchlist: shouldBeWatchlist, // ✅ FORCER mise à jour depuis Supabase
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
                            
                            if (needsIsWatchlistUpdate) {
                                migrationCount++;
                            }
                            updatedTickersCount++;
                            
                            // Si c'est le profil actif, mettre à jour aussi le state local
                            if (tickerSymbol === activeId) {
                                setInfo(updated[tickerSymbol].info);
                                setIsWatchlist(shouldBeWatchlist ?? false);
                            }
                        }
                        return;
                    }

                    // ⚠️ RIGUEUR 100% : Ne pas créer de profil placeholder ici
                    // Le profil sera créé uniquement si FMP réussit (voir code après)
                    // On marque juste le ticker comme "à charger"
                    newTickersCount++;
                });

                // ✅ NOUVEAU : Sauvegarder dans cache avec timestamp (fire and forget)
                saveToCache(updated).catch(e => console.warn('Failed to save to cache:', e));

                // ✅ DEBUG: Compter les profils avec isWatchlist=false après migration
                const portfolioCount = Object.values(updated).filter((p: any) => p.isWatchlist === false).length;
                const watchlistCount = Object.values(updated).filter((p: any) => p.isWatchlist === true).length;
                const normalCount = Object.values(updated).filter((p: any) => p.isWatchlist === null || p.isWatchlist === undefined).length;
                
                if (migrationCount > 0) {
                    console.log(`🔄 Migration: ${migrationCount} profil(s) mis à jour avec isWatchlist depuis Supabase`);
                }
                
                console.log(`📊 Après migration (handleSyncFromSupabase) - Portefeuille (⭐): ${portfolioCount}, Watchlist (👁️): ${watchlistCount}, Normaux: ${normalCount}, Total: ${Object.keys(updated).length}`);
                
                // ✅ VÉRIFICATION: S'assurer que tous les team tickers ont isWatchlist=false
                const teamTickersInSupabase = result.tickers.filter(t => {
                    const mapped = mapSourceToIsWatchlist(t.source);
                    return mapped === false; // Portefeuille
                });
                const teamTickersInLibrary = teamTickersInSupabase.filter(t => {
                    const symbol = t.ticker.toUpperCase();
                    return updated[symbol] && updated[symbol].isWatchlist === false;
                });
                
                // Séparer les tickers manquants (pas dans localStorage) des incorrects (isWatchlist !== false)
                const missingTickers = teamTickersInSupabase.filter(t => {
                    const symbol = t.ticker.toUpperCase();
                    return !updated[symbol];
                });
                const incorrectTickers = teamTickersInSupabase.filter(t => {
                    const symbol = t.ticker.toUpperCase();
                    return updated[symbol] && updated[symbol].isWatchlist !== false;
                });
                
                if (teamTickersInSupabase.length !== teamTickersInLibrary.length) {
                    console.warn(`⚠️ ${teamTickersInSupabase.length - teamTickersInLibrary.length} team ticker(s) manquant(s) ou incorrect(s) sur ${teamTickersInSupabase.length} attendus:`);
                    if (missingTickers.length > 0) {
                        console.warn(`   📋 ${missingTickers.length} ticker(s) non chargé(s) depuis FMP:`, missingTickers.map(t => t.ticker).join(', '));
                    }
                    if (incorrectTickers.length > 0) {
                        console.warn(`   ❌ ${incorrectTickers.length} ticker(s) avec isWatchlist incorrect:`, incorrectTickers.map(t => t.ticker).join(', '));
                    }
                    console.log(`   ✅ ${teamTickersInLibrary.length} ticker(s) correctement configuré(s) dans localStorage`);
                } else {
                    console.log(`✅ Tous les ${teamTickersInSupabase.length} team tickers ont isWatchlist=false`);
                }

                return updated;
            });

            // ✅ FONCTION UTILITAIRE: Parser marketCap depuis format string (ex: "2.5B", "500M") vers nombre
            const parseMarketCapToNumber = (marketCapStr: string | null | undefined): number => {
                if (!marketCapStr || marketCapStr === 'N/A' || marketCapStr === '0') return 0;
                
                // Si c'est déjà un nombre (string numérique)
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

            // ✅ FILTRE CAPITALISATION: Minimum 2 milliards USD
            const MIN_MARKET_CAP = 2000000000; // 2 milliards

            // Charger les données FMP pour les nouveaux tickers en arrière-plan
            // Exclure les fonds mutuels et les titres de moins de 2 milliards
            const newTickers = result.tickers.filter(t => {
                const symbol = t.ticker.toUpperCase();
                
                // Vérifier si fonds mutuel
                if (isMutualFund(symbol, t.company_name)) {
                    console.warn(`⚠️ ${symbol}: Fonds mutuel détecté - exclu de la synchronisation`);
                    return false;
                }

                // ✅ FILTRE CAPITALISATION: Vérifier market_cap depuis Supabase si disponible
                if (t.market_cap) {
                    const marketCapNum = typeof t.market_cap === 'number' 
                        ? t.market_cap 
                        : parseMarketCapToNumber(String(t.market_cap));
                    
                    if (marketCapNum > 0 && marketCapNum < MIN_MARKET_CAP) {
                        console.warn(`⚠️ ${symbol}: Capitalisation boursière trop faible (${t.market_cap} < 2B) - exclu de la synchronisation`);
                        return false;
                    }
                }

                // Si déjà dans library
                if (library[symbol]) {
                    const profile = library[symbol];
                    // Vérifier si les données sont valides (au moins une année avec EPS ou CF > 0)
                    const hasValidData = profile.data && profile.data.length > 0 && profile.data.some(d => 
                        d.earningsPerShare !== 0 || d.cashFlowPerShare !== 0
                    );
                    
                    if (hasValidData) {
                        return false; // Données valides, on passe
                    }
                    // On laisse passer pour re-fetch FMP (pas de log individuel pour réduire le bruit)
                }

                return true;
            });

            if (newTickers.length > 0) {
                const batchSize = 5;
                const delayBetweenBatches = 500;
                
                // ✅ Collecter les erreurs pour afficher un résumé à la fin
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
                                
                                // VALIDATION STRICTE : Vérifier que les données sont valides
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
                                
                                // ✅ FILTRE CAPITALISATION: Vérifier marketCap depuis FMP
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
                                
                                // ✅ TOUTES LES VALIDATIONS PASSÉES - Créer le profil avec les données réelles
                                const shouldBeWatchlist = mapSourceToIsWatchlist(supabaseTicker.source);
                                
                                // Auto-fill assumptions basées sur les données historiques FMP (fonction centralisée)
                                // ✅ autoFillAssumptionsFromFMPData sanitis déjà les valeurs, mais on double-vérifie
                                const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
                                    result.data,
                                    result.currentPrice,
                                    INITIAL_ASSUMPTIONS
                                );
                                
                                // ✅ SANITISER une deuxième fois pour être absolument sûr (les paramètres peuvent avoir changé)
                                const sanitizedAutoFilled = sanitizeAssumptionsSync(autoFilledAssumptions);
                                
                                // Détecter et exclure automatiquement les métriques avec prix cibles aberrants
                                const tempAssumptions = {
                                    ...INITIAL_ASSUMPTIONS,
                                    ...sanitizedAutoFilled
                                } as Assumptions;
                                const outlierDetection = detectOutlierMetrics(result.data, tempAssumptions);
                                
                                // Appliquer les exclusions détectées
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
                                    
                                    try {
                                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                                    } catch (e) {
                                        console.warn('Failed to save to LocalStorage:', e);
                                    }
                                    
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
                                // ⚠️ RIGUEUR 100% : Ne pas créer de profil si FMP échoue
                            }
                        })
                    );
                }
                
                // ✅ Afficher un résumé des erreurs au lieu de logger chaque erreur individuellement
                const totalErrors = errorSummary.notFound.length + errorSummary.noData.length + 
                    errorSummary.invalidPrice.length + errorSummary.invalidData.length + 
                    errorSummary.lowMarketCap.length + errorSummary.other.length;
                
                if (totalErrors > 0) {
                    console.group(`📊 Résumé synchronisation: ${successCount} succès, ${totalErrors} erreurs`);
                    if (errorSummary.notFound.length > 0) {
                        console.warn(`⚠️ ${errorSummary.notFound.length} ticker(s) introuvable(s) dans FMP: ${errorSummary.notFound.slice(0, 10).join(', ')}${errorSummary.notFound.length > 10 ? ` (+${errorSummary.notFound.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.lowMarketCap.length > 0) {
                        console.warn(`⚠️ ${errorSummary.lowMarketCap.length} ticker(s) avec capitalisation < 2B: ${errorSummary.lowMarketCap.slice(0, 10).join(', ')}${errorSummary.lowMarketCap.length > 10 ? ` (+${errorSummary.lowMarketCap.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.noData.length > 0) {
                        console.warn(`⚠️ ${errorSummary.noData.length} ticker(s) sans données: ${errorSummary.noData.slice(0, 10).join(', ')}${errorSummary.noData.length > 10 ? ` (+${errorSummary.noData.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.invalidData.length > 0) {
                        console.warn(`⚠️ ${errorSummary.invalidData.length} ticker(s) avec données invalides: ${errorSummary.invalidData.slice(0, 10).join(', ')}${errorSummary.invalidData.length > 10 ? ` (+${errorSummary.invalidData.length - 10} autres)` : ''}`);
                    }
                    if (errorSummary.other.length > 0) {
                        console.warn(`⚠️ ${errorSummary.other.length} autre(s) erreur(s): ${errorSummary.other.slice(0, 5).map(e => e.symbol).join(', ')}${errorSummary.other.length > 5 ? ` (+${errorSummary.other.length - 5} autres)` : ''}`);
                    }
                    console.groupEnd();
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

    const syncOverlay = isBulkSyncing ? (
        <div className="fixed bottom-4 right-4 bg-slate-800 p-4 rounded-lg shadow-xl border border-slate-700 z-[100] w-80 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                    <ArrowPathIcon className={`w-4 h-4 ${!syncPausedState ? 'animate-spin' : ''}`} />
                    Syncing... {bulkSyncProgress.current}/{bulkSyncProgress.total}
                </span>
                <span className="text-xs text-slate-400 font-mono">{Math.round((bulkSyncProgress.current / bulkSyncProgress.total) * 100)}%</span>
            </div>
            <ProgressBar 
                current={bulkSyncProgress.current} 
                total={bulkSyncProgress.total} 
            />
            
            <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                 <span>Success: <span className="text-green-400">{syncStats.successCount}</span></span>
                 <span>Errors: <span className="text-red-400">{syncStats.errorCount}</span></span>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => { 
                        isSyncPaused.current = !isSyncPaused.current; 
                        setSyncPausedState(isSyncPaused.current); 
                    }} 
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded transition-colors ${syncPausedState ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
                >
                    {syncPausedState ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                    <span>{syncPausedState ? "Resume" : "Pause"}</span>
                </button>
                <button 
                    onClick={() => abortSync.current = true} 
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                >
                    <StopIcon className="w-4 h-4" />
                    <span>Stop</span>
                </button>
            </div>
        </div>
    ) : null;

    if (!isInitialized) return <div className="flex items-center justify-center h-screen text-slate-500">Chargement...</div>;

    // Show landing page on first visit
    if (showLanding) {
        return <LandingPage onGetStarted={() => setShowLanding(false)} />;
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

    const profile = library[activeId] || DEFAULT_PROFILE; // Ensure profile is always available

    // Handler générique pour mettre à jour un profil complet (utilisé par KPIDashboard)
    const handleUpdateProfile = (id: string, updates: Partial<AnalysisProfile>) => {
        setLibrary(prev => {
            if (!prev[id]) return prev;
            
            const updatedProfile = { 
                ...prev[id], 
                ...updates,
                // Ne pas écraser lastModified si fourni dans updates, sinon update
                lastModified: updates.lastModified || Date.now()
            };
            
            const updatedLibrary = { 
                ...prev, 
                [id]: updatedProfile 
            };
            
            // Persister les changements
            // ✅ NOUVEAU : Sauvegarder dans cache avec timestamp
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    saveToCache(updatedLibrary).catch(e => console.warn('Failed to save to cache:', e));
                });
            } else {
                saveToCache(updatedLibrary).catch(e => console.warn('Failed to save to cache:', e));
            }
            
            return updatedLibrary;
        });
    };

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
                        profiles={Object.values(library).filter(p => p.id !== DEFAULT_PROFILE.id)}
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
                        onOpenAdmin={() => setShowAdmin(true)}
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
                                <h1 className="text-base sm:text-xl font-bold text-gray-700 truncate flex-1 sm:flex-none">Analyse Financière Pro</h1>
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
                                />

                        {/* CONDITIONAL RENDER: ANALYSIS VS INFO VS KPI */}
                        {currentView === 'info' ? (
                            <InfoTab />
                        ) : currentView === 'kpi' ? (
                            <ErrorBoundary>
                                <Suspense fallback={<LoadingFallback />}>
                                    <KPIDashboard
                                        profiles={Object.values(library)}
                                        currentId={activeId}
                                        onSelect={setActiveId}
                                        onBulkSync={handleBulkSyncAllTickers}
                                        onSyncNA={handleSyncSpecificTickers}
                                        isBulkSyncing={isBulkSyncing}
                                        onUpdateProfile={handleUpdateProfile}
                                        onOpenSettings={() => setIsSettingsOpen(true)}
                                    />
                                </Suspense>
                            </ErrorBoundary>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">

                                {/* LEFT COLUMN - MAIN DATA */}
                                <div className="lg:col-span-3 order-2 lg:order-1">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                            Données Historiques
                                            {historicalCAGR_EPS != null && isFinite(historicalCAGR_EPS) && historicalCAGR_EPS > 0 && (
                                                <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full" title="Taux de croissance annuel composé des EPS sur la période affichée">
                                                    CAGR EPS: {historicalCAGR_EPS.toFixed(1)}%
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-0.5 no-print">
                                            <button onClick={undo} disabled={pastData.length === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30" title="↶ Annuler la dernière modification\n\nAnnule la dernière modification effectuée sur les données historiques.\n\n📊 Fonctionnalités:\n• Permet de revenir en arrière sur les changements\n• Fonctionne avec toutes les modifications (EPS, CF, BV, Dividendes, Prix)\n• Historique illimité (tant que vous ne quittez pas la page)\n\n⌨️ Raccourci: Ctrl+Z (Cmd+Z sur Mac)" aria-label="Annuler la modification">
                                                <ArrowUturnLeftIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px bg-gray-200 my-1"></div>
                                            <button onClick={redo} disabled={futureData.length === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30" title="↷ Rétablir la modification annulée\n\nRétablit la dernière modification que vous avez annulée.\n\n📊 Fonctionnalités:\n• Permet de refaire une action annulée\n• Fonctionne avec toutes les modifications\n• Disponible uniquement si vous avez annulé une action\n\n⌨️ Raccourci: Ctrl+Shift+Z (Cmd+Shift+Z sur Mac)" aria-label="Rétablir la modification">
                                                <ArrowUturnRightIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px bg-gray-200 my-1"></div>
                                            <button onClick={handleResetData} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="🔄 Réinitialiser les données\n\nRéinitialise toutes les données historiques à leurs valeurs d'origine.\n\n⚠️ Attention:\n• Cette action est irréversible\n• Toutes vos modifications manuelles seront perdues\n• Les données seront restaurées depuis la dernière synchronisation FMP\n• Les hypothèses ne sont PAS affectées\n\n💡 Utilisation:\n• Utile si vous avez fait des erreurs de saisie\n• Permet de repartir de zéro avec les données FMP\n• Confirmation requise avant exécution" aria-label="Réinitialiser toutes les données">
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
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 border-b border-slate-600 pb-2">Résumé Exécutif</h2>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            L'analyse de {info.name} suggère une position <strong className="text-white uppercase">{recommendation}</strong> au prix actuel de {formatCurrency(assumptions.currentPrice)}.
                                        </p>
                                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                            Le titre se négocie à <strong className="text-white">{formatPercent(Math.abs(1 - (assumptions.currentPrice / targetPrice)) * 100)} {assumptions.currentPrice < targetPrice ? 'sous' : 'au-dessus de'}</strong> l'objectif de prix EPS de {formatCurrency(targetPrice)}.
                                        </p>

                                        {/* Note: Les métriques ValueLine sont affichées dans le Header (barre supérieure) et dans la section Configuration ci-dessous */}
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
                                                <label htmlFor="config-company-name" className="block text-xs text-gray-500 mb-1">Nom Société</label>
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
        </div>
    );
}