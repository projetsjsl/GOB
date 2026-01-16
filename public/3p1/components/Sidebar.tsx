import React, { useState, useMemo, useRef } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  StarIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  FunnelIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TableCellsIcon,
  CheckIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { AnalysisProfile, Recommendation } from '../types';
import { calculateRecommendation } from '../utils/calculations';
import { VersionHistory } from './VersionHistory';
import { createLogoLoadHandler } from '../utils/logoUtils';

interface SidebarProps {
  profiles: AnalysisProfile[];
  currentId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleWatchlist: (id: string) => void;
  onSetTickerType?: (id: string, type: 'portfolio' | 'watchlist' | 'normal') => void;
  onLoadVersion: (snapshotId: string) => void;
  onSyncFromSupabase?: () => void;
  isLoadingTickers?: boolean;
  onBulkSyncAll?: () => void;
  onSyncSelected?: (tickerIds: string[]) => void;
  isBulkSyncing?: boolean;
  bulkSyncProgress?: { current: number; total: number };
  onOpenAdmin?: () => void;
  onOpenDataExplorer?: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

type SortOption = 'alphabetical' | 'alphabetical-desc' | 'lastModified' | 'lastModified-desc' | 'recommendation' | 'sector';
type FilterOption = 'all' | 'portfolio' | 'watchlist';

export const Sidebar: React.FC<SidebarProps> = ({ profiles, currentId, onSelect, onAdd, onDelete, onDuplicate, onToggleWatchlist, onSetTickerType, onLoadVersion, onSyncFromSupabase, isLoadingTickers = false, onBulkSyncAll, onSyncSelected, isBulkSyncing = false, bulkSyncProgress, onOpenAdmin, onOpenDataExplorer, isAdmin = false, onToggleAdmin }) => {
  //  DEBUG: Log pour verifier que les profils sont bien recus
  React.useEffect(() => {
    console.log(` Sidebar: ${profiles.length} profil(s) recu(s)`, profiles.map(p => p.id).slice(0, 10));
  }, [profiles.length]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('lastModified');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  //  Nouveaux filtres
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterExchange, setFilterExchange] = useState<string>('all');
  const [filterMarketCap, setFilterMarketCap] = useState<string>('all');
  //  Etat pour collapse/expand des filtres
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  //  Etat pour la selection de tickers pour synchronisation
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  //  Etat pour l'autocompletion
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  //  Gestionnaire double-clic pour toggle admin (fonction cachee)
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup du timeout au demontage
  React.useEffect(() => {
    return () => {
      if (logoClickTimeoutRef.current) {
        clearTimeout(logoClickTimeoutRef.current);
      }
    };
  }, []);
  
  const handleLogoClick = () => {
    if (logoClickTimeoutRef.current) {
      clearTimeout(logoClickTimeoutRef.current);
    }
    
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount === 2) {
      // Double-clic detecte
      if (onToggleAdmin) {
        onToggleAdmin();
      }
      setLogoClickCount(0);
    } else {
      // Attendre 500ms pour voir si c'est un double-clic
      logoClickTimeoutRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 500);
    }
  };

  //  OPTIMISATION: Cache des recommandations pour eviter les recalculs couteux
  const recommendationCacheRef = useRef<Map<string, Recommendation>>(new Map());
  
  // Fonction helper pour obtenir la recommandation (avec cache)
  const getCachedRecommendation = (profile: AnalysisProfile): Recommendation => {
    const cacheKey = `${profile.id}-${profile.lastModified}`;
    if (recommendationCacheRef.current.has(cacheKey)) {
      return recommendationCacheRef.current.get(cacheKey)!;
    }
    const rec = calculateRecommendation(
      profile.data,
      profile.assumptions,
      profile.info.analysisData?.analystEstimates
    ).recommendation;
    recommendationCacheRef.current.set(cacheKey, rec);
    //  Limite du cache depuis Supabase (pas de hardcoding)
    (async () => {
      const { getConfigValue } = await import('../services/appConfigApi');
      const cacheMax = await getConfigValue('recommendation_cache_max');
      if (recommendationCacheRef.current.size > cacheMax) {
        const firstKey = recommendationCacheRef.current.keys().next().value;
        recommendationCacheRef.current.delete(firstKey);
      }
    })();
    return rec;
  };

  //  COMPTAGE: Calculer les stats pour affichage
  const tickerStats = useMemo(() => {
    const portfolio = profiles.filter(p => p.isWatchlist === false).length; // Seulement team tickers ()
    const watchlist = profiles.filter(p => p.isWatchlist === true).length; // Seulement watchlist ()
    const normal = profiles.filter(p => p.isWatchlist === null || p.isWatchlist === undefined).length; // Tickers normaux (pas d'icone)
    const total = profiles.length;
    return { portfolio, watchlist, normal, total };
  }, [profiles]);

  //  SUGGESTIONS: Calculer les suggestions basees sur searchTerm
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      return [];
    }
    
    const term = searchTerm.toLowerCase().trim();
    const matches = profiles
      .filter(p => {
        const symbolMatch = p.id.toLowerCase().includes(term);
        const nameMatch = p.info.name.toLowerCase().includes(term);
        return symbolMatch || nameMatch;
      })
      .slice(0, 8) // Limiter a 8 suggestions max
      .map(p => ({
        id: p.id,
        symbol: p.id,
        name: p.info.name || p.id,
        sector: p.info.sector || '',
        isWatchlist: p.isWatchlist
      }));
    
    return matches;
  }, [profiles, searchTerm]);

  //  Extraire les valeurs uniques pour les filtres
  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    profiles.forEach(p => {
      if (p.info.country && p.info.country.trim() !== '') {
        countries.add(p.info.country);
      }
    });
    return Array.from(countries).sort();
  }, [profiles]);

  const availableExchanges = useMemo(() => {
    const exchanges = new Set<string>();
    profiles.forEach(p => {
      if (p.info.exchange && p.info.exchange.trim() !== '') {
        exchanges.add(p.info.exchange);
      }
    });
    return Array.from(exchanges).sort();
  }, [profiles]);

  //  Fonction helper pour parser marketCap en nombre
  const parseMarketCapToNumber = (marketCapStr: string): number => {
    if (!marketCapStr || marketCapStr === 'N/A' || marketCapStr.trim() === '') return 0;
    const cleaned = marketCapStr.replace(/[^0-9.BMKmk]/g, '').toUpperCase();
    if (!cleaned) return 0;
    
    const num = parseFloat(cleaned.replace(/[BMKmk]/g, ''));
    if (isNaN(num)) return 0;
    
    if (cleaned.includes('B')) return num * 1000000000; // Billions
    if (cleaned.includes('M')) return num * 1000000; // Millions
    if (cleaned.includes('K')) return num * 1000; // Thousands
    return num;
  };

  /**
   * Filtrage et tri des profils pour affichage dans la sidebar.
   * 
   * Processus :
   * 1. Filtrage par recherche (symbole ou nom)
   * 2. Filtrage par source (portfolio/watchlist/all)
   * 3. Filtrage par pays (si defini)
   * 4. Filtrage par bourse (si defini)
   * 5. Filtrage par capitalisation (si defini)
   * 6. Tri selon sortBy (alphabetique, date, recommandation, secteur)
   * 
   * Notes importantes :
   * - filterBy='portfolio' -> isWatchlist === false (team tickers uniquement)
   * - filterBy='watchlist' -> isWatchlist === true (watchlist uniquement)
   * - filterBy='all' -> Tous (portfolio + watchlist + normal)
   * - Tri par recommandation utilise le cache pour performance
   * 
   * @see getCachedRecommendation pour l'optimisation du tri
   */
  const filteredAndSortedProfiles = useMemo(() => {
    // Filtrage par recherche
    let filtered = profiles.filter(p =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.info.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrage par source (portefeuille/watchlist/normal)
    if (filterBy === 'portfolio') {
      filtered = filtered.filter(p => p.isWatchlist === false); // Seulement team tickers ()
    } else if (filterBy === 'watchlist') {
      filtered = filtered.filter(p => p.isWatchlist === true); // Seulement watchlist ()
    } else if (filterBy === 'normal') {
      filtered = filtered.filter(p => p.isWatchlist === null || p.isWatchlist === undefined); // Seulement tickers normaux ()
    }
    // Si filterBy === 'all', on affiche tous (portfolio + watchlist + normal)

    //  Filtrage par Pays
    if (filterCountry !== 'all') {
      filtered = filtered.filter(p => p.info.country === filterCountry);
    }

    //  Filtrage par Bourse
    if (filterExchange !== 'all') {
      filtered = filtered.filter(p => p.info.exchange === filterExchange);
    }

    //  Filtrage par Capitalisation
    if (filterMarketCap !== 'all') {
      // Note: Config values loaded at component level for performance
      const MARKET_CAP_THRESHOLDS = {
        micro: { min: 0, max: 300000000 },           // < 300M
        small: { min: 300000000, max: 2000000000 },  // 300M - 2B
        mid: { min: 2000000000, max: 10000000000 },  // 2B - 10B
        large: { min: 10000000000, max: 200000000000 }, // 10B - 200B
        mega: { min: 200000000000, max: Infinity }   // > 200B
      };

      filtered = filtered.filter(p => {
        const marketCapNum = parseMarketCapToNumber(p.info.marketCap || '');
        switch (filterMarketCap) {
          case 'micro': return marketCapNum > 0 && marketCapNum < MARKET_CAP_THRESHOLDS.micro.max;
          case 'small': return marketCapNum >= MARKET_CAP_THRESHOLDS.small.min && marketCapNum < MARKET_CAP_THRESHOLDS.small.max;
          case 'mid': return marketCapNum >= MARKET_CAP_THRESHOLDS.mid.min && marketCapNum < MARKET_CAP_THRESHOLDS.mid.max;
          case 'large': return marketCapNum >= MARKET_CAP_THRESHOLDS.large.min && marketCapNum < MARKET_CAP_THRESHOLDS.large.max;
          case 'mega': return marketCapNum >= MARKET_CAP_THRESHOLDS.mega.min;
          default: return true;
        }
      });
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return (a.info.preferredSymbol || a.id).localeCompare(b.info.preferredSymbol || b.id);
        case 'alphabetical-desc':
          return (b.info.preferredSymbol || b.id).localeCompare(a.info.preferredSymbol || a.id);
        case 'lastModified':
          return b.lastModified - a.lastModified;
        case 'lastModified-desc':
          return a.lastModified - b.lastModified;
        case 'recommendation': {
          //  OPTIMISATION: Utiliser le cache au lieu de recalculer
          const recA = getCachedRecommendation(a);
          const recB = getCachedRecommendation(b);
          const order = { [Recommendation.BUY]: 0, [Recommendation.HOLD]: 1, [Recommendation.SELL]: 2 };
          return (order[recA] ?? 1) - (order[recB] ?? 1);
        }
        case 'sector':
          return (a.info.sector || '').localeCompare(b.info.sector || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [profiles, searchTerm, sortBy, filterBy, filterCountry, filterExchange, filterMarketCap]);

  const getRecommendationColor = (rec: Recommendation) => {
    switch (rec) {
      case Recommendation.BUY: return 'bg-green-500';
      case Recommendation.SELL: return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shadow-xl w-full" data-demo="sidebar">
      {/* App Title */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 cursor-help" title="Finance Pro 3p1\n\nApplication d'analyse fondamentale pour la gestion de portefeuille.\n\nFonctionnalites:\n- Analyse de valorisation sur 5 ans\n- Triangulation de la valeur (4 metriques)\n- KPI Dashboard multi-tickers\n- Snapshots et historique\n- Synchronisation avec FMP API">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-base sm:text-lg">
          <ChartBarIcon 
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isAdmin ? 'text-yellow-400' : ''} ${onToggleAdmin ? 'cursor-pointer hover:scale-110' : ''}`}
            onClick={onToggleAdmin ? handleLogoClick : undefined}
            title={onToggleAdmin ? (isAdmin ? " Mode admin actif\n\nDouble-cliquez pour desactiver" : "Double-cliquez pour activer le mode admin") : undefined}
          />
          <span>FinancePro</span>
          {isAdmin && (
            <ShieldCheckIcon className="w-4 h-4 text-yellow-400" title="Mode admin actif" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">Gestion de Portefeuille</p>
      </div>

      {/* Search & Add */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-slate-800/50">
        <div className="flex gap-1.5 sm:gap-2 mb-2">
          <div className="relative flex-1 min-w-0">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 sm:left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-slate-500 flex-shrink-0 z-10" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Filtrer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delai pour permettre le clic sur une suggestion
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                  e.preventDefault();
                  const suggestion = suggestions[selectedSuggestionIndex];
                  if (suggestion) {
                    onSelect(suggestion.id);
                    setSearchTerm('');
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded pl-7 sm:pl-8 md:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-500 transition-all focus:border-blue-500"
              title="Rechercher un ticker\n\nTapez le symbole ou le nom de l'entreprise pour filtrer la liste.\nLa recherche est insensible a la casse et cherche dans:\n- Le symbole du ticker\n- Le nom de l'entreprise\n\n Utilisez les fleches ^v pour naviguer dans les suggestions et Entree pour selectionner."
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => {
                      onSelect(suggestion.id);
                      setSearchTerm('');
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors flex items-center gap-2 ${
                      index === selectedSuggestionIndex
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400">{suggestion.symbol}</span>
                        {suggestion.isWatchlist === false && (
                          <StarIcon className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {suggestion.isWatchlist === true && (
                          <EyeIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-slate-400 truncate mt-0.5">{suggestion.name}</div>
                      {suggestion.sector && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{suggestion.sector}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold transition-colors shadow-lg hover:shadow-blue-500/20 whitespace-nowrap flex-shrink-0"
            title="Ajouter un nouveau ticker\n\nOuvre une boite de recherche pour ajouter une nouvelle entreprise a analyser.\n\nLe systeme va:\n1. Rechercher le ticker via l'API FMP\n2. Charger les donnees historiques (10 dernieres annees)\n3. Auto-remplir les hypotheses (CAGR, ratios moyens)\n4. Charger les metriques ValueLine si disponibles\n\nLe nouveau ticker sera ajoute a votre portefeuille."
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
        {isAdmin && onSyncFromSupabase && (
          <button
            onClick={onSyncFromSupabase}
            disabled={isLoadingTickers || isBulkSyncing}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors mb-2"
            title="Synchroniser depuis Supabase\n\nCharge les tickers depuis la base de donnees Supabase.\n\nAjoute les nouveaux tickers presents dans Supabase mais absents de votre LocalStorage.\n\n Ne modifie pas les tickers existants, seulement ajoute les nouveaux."
          >
            <ServerIcon className={`w-4 h-4 ${isLoadingTickers ? 'animate-pulse' : ''}`} />
            <span style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal' }}>{isLoadingTickers ? 'Synchronisation...' : 'Synchroniser Supabase'}</span>
          </button>
        )}
        {isAdmin && onBulkSyncAll && (
          <div className="flex flex-col gap-1">
            {/* Mode selection pour synchronisation selective */}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) {
                    setSelectedTickers(new Set()); // Reinitialiser la selection
                  }
                }}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  isSelectionMode 
                    ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
                title={isSelectionMode 
                  ? "Desactiver le mode selection\n\nCliquez pour quitter le mode selection et revenir au mode normal."
                  : "Activer le mode selection\n\nPermet de selectionner des tickers specifiques pour synchronisation.\n\nApres activation:\n- Des checkboxes apparaitront a cote de chaque ticker\n- Selectionnez les tickers a synchroniser\n- Cliquez sur 'Sync Selection' pour synchroniser uniquement ceux selectionnes"}
              >
                {isSelectionMode ? ' Selection' : ' Selectionner'}
              </button>
              {isSelectionMode && selectedTickers.size > 0 && onSyncSelected && (
                <button
                  onClick={() => {
                    onSyncSelected(Array.from(selectedTickers));
                    setIsSelectionMode(false);
                    setSelectedTickers(new Set());
                  }}
                  disabled={isBulkSyncing || isLoadingTickers}
                  className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-slate-800 disabled:opacity-50 text-white px-2 py-1.5 rounded text-xs font-medium transition-colors"
                  title={`Synchroniser ${selectedTickers.size} ticker(s) selectionne(s)\n\nSynchronise uniquement les tickers que vous avez selectionnes avec les options de synchronisation avancees.`}
                >
                  <CloudArrowUpIcon className={`w-3 h-3 inline mr-1 ${isBulkSyncing ? 'animate-pulse' : ''}`} />
                  Sync ({selectedTickers.size})
                </button>
              )}
            </div>
            {!isSelectionMode && (
              <button
                onClick={onBulkSyncAll}
                disabled={isBulkSyncing || isLoadingTickers}
                className="w-full bg-green-700 hover:bg-green-600 disabled:bg-slate-800 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors"
                title=" Options de Synchronisation Avancees\n\nCliquez pour ouvrir le tableau de bord de synchronisation avec toutes les options:\n\n Options principales:\n- Sauvegarder avant sync\n- Remplacer donnees oranges\n- Forcer remplacement\n\n Options detaillees:\n- Synchroniser donnees historiques\n- Synchroniser uniquement nouvelles annees\n- Synchroniser uniquement metriques manquantes\n- Synchroniser assumptions\n- Preserver exclusions\n- Recalculer outliers\n- Mettre a jour prix actuel\n- Synchroniser metriques ValueLine\n\n Chaque option inclut des explications detaillees, exemples concrets et informations sur les outils utilises."
              >
                <CloudArrowUpIcon className={`w-4 h-4 ${isBulkSyncing ? 'animate-pulse' : ''}`} />
                <span className="flex-1 text-left" style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal' }}>
                  {isBulkSyncing && bulkSyncProgress
                    ? `Sync ${bulkSyncProgress.current}/${bulkSyncProgress.total}`
                    : ' Options Sync Avancees'}
                </span>
              </button>
            )}
            
            <div className="flex gap-1">
                 <button
                    onClick={() => {
                        if(confirm("Forcer le rafraichissement complet ? Cela effacera le cache local.")) {
                             window.location.reload();
                        }
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
                    title="Forcer le rechargement de l'application"
                >
                    FORCE RELOAD
                </button>
            </div>
          </div>
        )}
        {isAdmin && onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors mt-2 border border-slate-700"
            title="Ouvrir le tableau de bord d'administration (Ctrl+Shift+A)\n\n- Etat de la synchronisation\n- Inspecteur de donnees brutes\n- Reparation et diagnostic"
          >
            <ShieldCheckIcon className="w-4 h-4" />
            <span style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal' }}>Admin Warehouse</span>
          </button>
        )}
        {isAdmin && onOpenDataExplorer && (
          <button
            onClick={onOpenDataExplorer}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-emerald-200 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors mt-2 border border-emerald-700"
            title="Data Explorer - Supabase Tables\n\n- Visualiser toutes les tables 3P1\n- Voir les dernieres mises a jour\n- Exporter en Excel/CSV\n- Synchronisation selective"
          >
            <TableCellsIcon className="w-4 h-4" />
            <span style={{ wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal' }}>Data Explorer</span>
          </button>
        )}
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar pt-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2 tracking-wider flex justify-between items-center">
          <span className="cursor-help" title={`Liste de vos tickers\n\n Statistiques:\n-  Portefeuille (team tickers): ${tickerStats.portfolio} tickers\n-  Watchlist (surveilles): ${tickerStats.watchlist} tickers\n-  Normaux (hors team/watchlist): ${tickerStats.normal} tickers\n- Total: ${tickerStats.total} tickers\n\n IMPORTANT:\n-  Etoile = Portefeuille (team tickers DETENUS)\n-  il = Watchlist (titres SURVEILLES)\n-  = Tickers normaux (hors team/watchlist)\n- Point colore = Recommandation (ACHAT/CONSERVER/VENTE)\n\nUtilisez les filtres ci-dessous pour filtrer par type.`}>
            {filterBy === 'all' ? 'Tous les tickers' : filterBy === 'portfolio' ? ' Portefeuille' : filterBy === 'watchlist' ? ' Watchlist' : ' Normaux'}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Toujours afficher les stats, meme quand filtre */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
              filterBy === 'portfolio' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-yellow-900/50 text-yellow-400'
            }`} title={`Portefeuille (team tickers): ${tickerStats.portfolio} tickers`}> {tickerStats.portfolio}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
              filterBy === 'watchlist' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-900/50 text-blue-400'
            }`} title={`Watchlist: ${tickerStats.watchlist} tickers`}> {tickerStats.watchlist}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
              filterBy === 'normal' 
                ? 'bg-slate-600 text-white' 
                : 'bg-slate-700/50 text-slate-400'
            }`} title={`Tickers normaux: ${tickerStats.normal} tickers`}> {tickerStats.normal}</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400 cursor-help" title={`Nombre de tickers affiches: ${filteredAndSortedProfiles.length} / ${profiles.length}\n\n${searchTerm ? `(Filtres sur "${searchTerm}")` : ''}\n${filterBy !== 'all' ? `(Filtre actif: ${filterBy === 'portfolio' ? 'Portefeuille' : filterBy === 'watchlist' ? 'Watchlist' : 'Normaux'})` : ''}`}>{filteredAndSortedProfiles.length}</span>
          </div>
        </h3>
        {filteredAndSortedProfiles.length === 0 ? (
          <div className="text-center text-slate-600 text-sm py-8 px-4">
            {searchTerm ? 'Aucun resultat' : 'Commencez par ajouter un ticker'}
          </div>
        ) : (
          filteredAndSortedProfiles.map(profile => {
            // Calculate status on the fly (with analyst consensus when available)
            const { recommendation } = calculateRecommendation(
              profile.data,
              profile.assumptions,
              profile.info.analysisData?.analystEstimates
            );

            const isSelected = selectedTickers.has(profile.id);
            
            return (
              <div
                key={profile.id}
                onClick={(e) => {
                  // Si mode selection, toggle la selection au lieu de selectionner le ticker
                  if (isSelectionMode) {
                    e.stopPropagation();
                    const newSelected = new Set(selectedTickers);
                    if (isSelected) {
                      newSelected.delete(profile.id);
                    } else {
                      newSelected.add(profile.id);
                    }
                    setSelectedTickers(newSelected);
                  } else {
                    onSelect(profile.id);
                  }
                }}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all ${currentId === profile.id && !isSelectionMode
                  ? 'bg-blue-900/30 border border-blue-800 text-blue-100'
                  : isSelected
                  ? 'bg-green-900/20 border border-green-700 text-green-200'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
              >
                {/* Checkbox pour mode selection */}
                {isSelectionMode && (
                  <div 
                    className="flex items-center justify-center w-5 h-5 mr-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div 
                      className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-green-600 border-green-500' 
                          : 'border-slate-500 hover:border-slate-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelected = new Set(selectedTickers);
                        if (isSelected) {
                          newSelected.delete(profile.id);
                        } else {
                          newSelected.add(profile.id);
                        }
                        setSelectedTickers(newSelected);
                      }}
                    >
                      {isSelected && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 min-w-0">
                  {/* Recommendation Dot (PAS une etoile - c'est la recommandation) */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getRecommendationColor(recommendation)} cursor-help`} title={` Recommandation: ${recommendation}\n\nBase sur:\n- Prix actuel vs Limite d'achat/vente\n- Calcule automatiquement selon vos hypotheses\n\n Vert = ACHAT\n Jaune = CONSERVER\n Rouge = VENTE\n\n Note: Ce point colore = Recommandation\n L'etoile jaune = Portefeuille (titres detenus)`}></div>

                  {/* Logo - Masque immediatement si erreur pour eviter 404 */}
                  <img
                    src={profile.info.logo || ((profile.info.logoSymbol || profile.info.actualSymbol?.replace('.TO', '').replace('-', '.') || profile.info.preferredSymbol || profile.id) ? `https://financialmodelingprep.com/image-stock/${profile.info.logoSymbol || profile.info.actualSymbol?.replace('.TO', '').replace('-', '.') || profile.info.preferredSymbol || profile.id}.png` : '')}
                    alt={`Logo ${profile.info.name || profile.id}`}
                    className="w-8 h-8 rounded object-cover flex-shrink-0 cursor-help"
                    title={`Logo de ${profile.info.name}\n\nSource: FMP API (image-stock)`}
                    onError={(e) => {
                      // Masquer immediatement pour eviter les erreurs 404 repetees
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }}
                    onLoad={createLogoLoadHandler()}
                    loading="lazy"
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate cursor-help" title={`Symbole: ${profile.info.preferredSymbol || profile.id}\n\nCliquez pour selectionner ce ticker et voir son analyse complete.`}>{profile.info.preferredSymbol || profile.id}</span>
                      {profile.info.exchange && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded cursor-help" title={`Bourse: ${profile.info.exchange}\n\nBourse ou l'action est cotee.`}>
                          {profile.info.exchange}
                        </span>
                      )}
                      {profile.info.currency && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded cursor-help" title={`Devise: ${profile.info.currency}\n\nDevise dans laquelle l'action est cotee.`}>
                          {profile.info.currency}
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate opacity-70 cursor-help" title={`${profile.info.name}\n\nNom complet de l'entreprise.\n\nCliquez sur la ligne pour voir l'analyse complete.`}>{profile.info.name}</span>
                    {profile.info.country && (
                      <span className="text-[10px] text-slate-500 truncate cursor-help" title={`Pays: ${profile.info.country}\n\nPays d'origine de l'entreprise.`}>
                        {profile.info.country}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Menu de changement de type de ticker - Ameliore */}
                  <div className="relative group/type">
                    {/* Bouton principal avec icone selon le type */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Si onSetTickerType existe, on ouvre un menu, sinon on toggle
                        if (onSetTickerType) {
                          // Creer un menu contextuel simple
                          const menu = document.createElement('div');
                          menu.className = 'absolute right-0 bottom-full mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[140px]';
                          menu.innerHTML = `
                            <div class="py-1">
                              <button class="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2 ${profile.isWatchlist === false ? 'bg-yellow-900/30 text-yellow-400' : 'text-slate-300'}" data-type="portfolio">
                                <span></span> Portefeuille
                              </button>
                              <button class="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2 ${profile.isWatchlist === true ? 'bg-blue-900/30 text-blue-400' : 'text-slate-300'}" data-type="watchlist">
                                <span></span> Watchlist
                              </button>
                              <button class="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center gap-2 ${(profile.isWatchlist === null || profile.isWatchlist === undefined) ? 'bg-slate-700 text-slate-300' : 'text-slate-300'}" data-type="normal">
                                <span></span> Normal
                              </button>
                            </div>
                          `;
                          
                          const handleMenuClick = (e: MouseEvent) => {
                            const target = e.target as HTMLElement;
                            const button = target.closest('button[data-type]');
                            if (button) {
                              const type = button.getAttribute('data-type') as 'portfolio' | 'watchlist' | 'normal';
                              onSetTickerType(profile.id, type);
                              document.body.removeChild(menu);
                              document.removeEventListener('click', handleOutsideClick);
                            }
                          };
                          
                          const handleOutsideClick = (e: MouseEvent) => {
                            if (!menu.contains(e.target as Node)) {
                              document.body.removeChild(menu);
                              document.removeEventListener('click', handleOutsideClick);
                            }
                          };
                          
                          menu.addEventListener('click', handleMenuClick);
                          document.addEventListener('click', handleOutsideClick);
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          menu.style.position = 'fixed';
                          menu.style.right = `${window.innerWidth - rect.right}px`;
                          menu.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                          
                          document.body.appendChild(menu);
                        } else {
                          // Fallback vers toggle si onSetTickerType n'existe pas
                          onToggleWatchlist(profile.id);
                        }
                      }}
                      title={profile.isWatchlist === false 
                        ? " Portefeuille (Detenu)\n\nCliquez pour changer le type:\n-  Portefeuille (actuel)\n-  Watchlist\n-  Normal"
                        : profile.isWatchlist === true
                        ? " Watchlist (Surveille)\n\nCliquez pour changer le type:\n-  Portefeuille\n-  Watchlist (actuel)\n-  Normal"
                        : " Normal\n\nCliquez pour changer le type:\n-  Portefeuille\n-  Watchlist\n-  Normal (actuel)"}
                      className={`p-1.5 rounded transition-colors ${
                        profile.isWatchlist === false 
                          ? 'text-yellow-500 hover:text-yellow-400 hover:bg-slate-700' 
                          : profile.isWatchlist === true
                          ? 'text-blue-400 hover:bg-slate-700'
                          : 'text-slate-500 hover:text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {profile.isWatchlist === false ? (
                        <StarIcon className="w-4 h-4 fill-current" style={{ fill: '#eab308' }} />
                      ) : profile.isWatchlist === true ? (
                        <EyeIcon className="w-4 h-4" />
                      ) : (
                        <span className="text-xs"></span>
                      )}
                    </button>
                  </div>

                  {/* Other Actions (Hidden unless hovered) */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(profile.id);
                      }}
                      title="Dupliquer ce ticker\n\nCree une copie complete de l'analyse actuelle.\n\nUtile pour:\n- Comparer differents scenarios (optimiste/pessimiste)\n- Tester differentes hypotheses\n- Creer des variantes d'analyse\n\nLe ticker duplique aura le meme nom avec un suffixe."
                      className="p-1.5 hover:bg-slate-700 hover:text-white rounded"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Supprimer ${profile.id} ?`)) onDelete(profile.id);
                        }}
                        title="Supprimer ce ticker\n\n ATTENTION: Cette action est irreversible!\n\nSupprime definitivement:\n- Toutes les donnees historiques\n- Toutes les hypotheses\n- Tous les snapshots associes\n\nUne confirmation sera demandee avant suppression."
                        className="p-1.5 hover:bg-red-900/50 hover:text-red-400 rounded"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Version History Section - Retire, maintenant dans RightSidebar */}

      {/* Filters & Sort Section */}
      <div className="border-t border-slate-800 bg-slate-900">
        {/* Header avec bouton collapse/expand */}
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full p-2 sm:p-3 md:p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
          title={isFiltersExpanded ? "Reduire les filtres pour voir plus de titres" : "Developper les filtres"}
        >
          <h3 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 sm:gap-2 cursor-help" title="Filtres et Tri\n\nFiltrez et triez votre portefeuille selon differents criteres.\n\nFiltres:\n- Tous: Affiche tous les tickers\n- Portefeuille: Uniquement les titres detenus\n- Watchlist: Uniquement les titres surveilles\n\nTri:\n- Alphabetique: A-Z ou Z-A\n- Date de modification: Plus recent ou plus ancien\n- Recommandation: Achat, Conserver, Vente\n- Secteur: Par secteur d'activite">
            <FunnelIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Filtres et Tri</span>
          </h3>
          {isFiltersExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </button>
        
        {/* Contenu des filtres (collapsible) */}
        {isFiltersExpanded && (
          <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
            {/* Filter Buttons - Ameliore avec 4 options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2">
          <button
            onClick={() => setFilterBy('all')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors ${
              filterBy === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={`Afficher tous les tickers\n\n Statistiques:\n-  Portefeuille: ${tickerStats.portfolio}\n-  Watchlist: ${tickerStats.watchlist}\n-  Normaux: ${tickerStats.normal}\n- Total: ${tickerStats.total}`}
          >
            Tous ({tickerStats.total})
          </button>
          <button
            onClick={() => setFilterBy('portfolio')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              filterBy === 'portfolio'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={`Afficher uniquement les tickers du portefeuille (titres detenus)\n\n ${tickerStats.portfolio} ticker(s) dans le portefeuille`}
          >
            <StarIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Portefeuille</span>
            <span className="sm:hidden">Port.</span>
            <span className="text-[9px]">({tickerStats.portfolio})</span>
          </button>
          <button
            onClick={() => setFilterBy('watchlist')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              filterBy === 'watchlist'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={`Afficher uniquement les tickers de la watchlist (titres surveilles)\n\n ${tickerStats.watchlist} ticker(s) dans la watchlist`}
          >
            <EyeIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Watchlist</span>
            <span className="sm:hidden">Watch</span>
            <span className="text-[9px]">({tickerStats.watchlist})</span>
          </button>
          <button
            onClick={() => setFilterBy('normal')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              filterBy === 'normal'
                ? 'bg-slate-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={`Afficher uniquement les tickers normaux (hors portefeuille/watchlist)\n\n ${tickerStats.normal} ticker(s) normaux`}
          >
            <span className="text-xs"></span>
            <span className="hidden sm:inline">Normaux</span>
            <span className="sm:hidden">Norm.</span>
            <span className="text-[9px]">({tickerStats.normal})</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] sm:text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer mb-2"
          title="Trier les tickers\n\nOptions de tri:\n- Alphabetique (A-Z): Par symbole croissant\n- Alphabetique (Z-A): Par symbole decroissant\n- Date modif. (Recent): Plus recemment modifies en premier\n- Date modif. (Ancien): Plus anciennement modifies en premier\n- Recommandation: Achat -> Conserver -> Vente\n- Secteur: Par secteur d'activite"
        >
          <option value="lastModified"> Date modif. (Recent)</option>
          <option value="lastModified-desc"> Date modif. (Ancien)</option>
          <option value="alphabetical"> Alphabetique (A-Z)</option>
          <option value="alphabetical-desc"> Alphabetique (Z-A)</option>
          <option value="recommendation"> Recommandation</option>
          <option value="sector"> Secteur</option>
        </select>

        {/*  Filtres Avances */}
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Filtres Avances</span>
            {(filterCountry !== 'all' || filterExchange !== 'all' || filterMarketCap !== 'all') && (
              <button
                onClick={() => {
                  setFilterCountry('all');
                  setFilterExchange('all');
                  setFilterMarketCap('all');
                }}
                className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                title="Reinitialiser tous les filtres avances"
              >
                <XMarkIcon className="w-3 h-3" />
                Reinitialiser
              </button>
            )}
          </div>

          {/* Filtre Pays */}
          {availableCountries.length > 0 && (
            <div>
              <label className="block text-[9px] text-slate-400 mb-1"> Pays</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] sm:text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                title="Filtrer par pays d'origine de l'entreprise"
              >
                <option value="all">Tous les pays ({availableCountries.length})</option>
                {availableCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtre Bourse */}
          {availableExchanges.length > 0 && (
            <div>
              <label className="block text-[9px] text-slate-400 mb-1"> Bourse</label>
              <select
                value={filterExchange}
                onChange={(e) => setFilterExchange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] sm:text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                title="Filtrer par bourse ou l'action est cotee"
              >
                <option value="all">Toutes les bourses ({availableExchanges.length})</option>
                {availableExchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtre Capitalisation */}
          <div>
            <label className="block text-[9px] text-slate-400 mb-1"> Capitalisation</label>
            <select
              value={filterMarketCap}
              onChange={(e) => setFilterMarketCap(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] sm:text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
              title="Filtrer par capitalisation boursiere\n\n- Micro: < 300M USD\n- Small: 300M - 2B USD\n- Mid: 2B - 10B USD\n- Large: 10B - 200B USD\n- Mega: > 200B USD"
            >
              <option value="all">Toutes les capitalisations</option>
              <option value="micro">Micro Cap (&lt; 300M)</option>
              <option value="small">Small Cap (300M - 2B)</option>
              <option value="mid">Mid Cap (2B - 10B)</option>
              <option value="large">Large Cap (10B - 200B)</option>
              <option value="mega">Mega Cap (&gt; 200B)</option>
            </select>
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
};