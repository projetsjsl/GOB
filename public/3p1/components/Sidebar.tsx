import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  StarIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  FunnelIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon
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
  onLoadVersion: (snapshotId: string) => void;
  onSyncFromSupabase?: () => void;
  isLoadingTickers?: boolean;
  onBulkSyncAll?: () => void;
  isBulkSyncing?: boolean;
  bulkSyncProgress?: { current: number; total: number };
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

type SortOption = 'alphabetical' | 'alphabetical-desc' | 'lastModified' | 'lastModified-desc' | 'recommendation' | 'sector';
type FilterOption = 'all' | 'portfolio' | 'watchlist';

export const Sidebar: React.FC<SidebarProps> = ({ profiles, currentId, onSelect, onAdd, onDelete, onDuplicate, onToggleWatchlist, onLoadVersion, onSyncFromSupabase, isLoadingTickers = false, onBulkSyncAll, isBulkSyncing = false, bulkSyncProgress, onOpenAdmin, isAdmin = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('lastModified');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredAndSortedProfiles = useMemo(() => {
    // Filtrage par recherche
    let filtered = profiles.filter(p =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.info.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrage par source (portefeuille/watchlist)
    if (filterBy === 'portfolio') {
      filtered = filtered.filter(p => !p.isWatchlist);
    } else if (filterBy === 'watchlist') {
      filtered = filtered.filter(p => p.isWatchlist);
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
          const recA = calculateRecommendation(a.data, a.assumptions).recommendation;
          const recB = calculateRecommendation(b.data, b.assumptions).recommendation;
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
  }, [profiles, searchTerm, sortBy, filterBy]);

  const getRecommendationColor = (rec: Recommendation) => {
    switch (rec) {
      case Recommendation.BUY: return 'bg-green-500';
      case Recommendation.SELL: return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shadow-xl w-full">
      {/* App Title */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 cursor-help" title="Finance Pro 3p1\n\nApplication d'analyse fondamentale pour la gestion de portefeuille.\n\nFonctionnalités:\n• Analyse de valorisation sur 5 ans\n• Triangulation de la valeur (4 métriques)\n• KPI Dashboard multi-tickers\n• Snapshots et historique\n• Synchronisation avec FMP API">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-base sm:text-lg">
          <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>FinancePro</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Gestion de Portefeuille</p>
      </div>

      {/* Search & Add */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-slate-800/50">
        <div className="flex gap-1.5 sm:gap-2 mb-2">
          <div className="relative flex-1 min-w-0">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 sm:left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded pl-7 sm:pl-8 md:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-500 transition-all focus:border-blue-500"
              title="Rechercher un ticker\n\nTapez le symbole ou le nom de l'entreprise pour filtrer la liste.\nLa recherche est insensible à la casse et cherche dans:\n• Le symbole du ticker\n• Le nom de l'entreprise"
            />
          </div>
          <button
            onClick={onAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold transition-colors shadow-lg hover:shadow-blue-500/20 whitespace-nowrap flex-shrink-0"
            title="Ajouter un nouveau ticker\n\nOuvre une boîte de recherche pour ajouter une nouvelle entreprise à analyser.\n\nLe système va:\n1. Rechercher le ticker via l'API FMP\n2. Charger les données historiques (10 dernières années)\n3. Auto-remplir les hypothèses (CAGR, ratios moyens)\n4. Charger les métriques ValueLine si disponibles\n\nLe nouveau ticker sera ajouté à votre portefeuille."
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
            title="Synchroniser depuis Supabase\n\nCharge les tickers depuis la base de données Supabase.\n\nAjoute les nouveaux tickers présents dans Supabase mais absents de votre LocalStorage.\n\n⚠️ Ne modifie pas les tickers existants, seulement ajoute les nouveaux."
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoadingTickers ? 'animate-spin' : ''}`} />
            <span>{isLoadingTickers ? 'Synchronisation...' : 'Synchroniser Supabase'}</span>
          </button>
        )}
        {isAdmin && onBulkSyncAll && (
          <div className="flex flex-col gap-1">
             <button
              onClick={onBulkSyncAll}
              disabled={isBulkSyncing || isLoadingTickers}
              className="w-full bg-green-700 hover:bg-green-600 disabled:bg-slate-800 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors"
              title="Strategic Warehouse Sync (Deep Data)\n\nSynchronise TOUS les tickers avec historique COMPLET (30 ans).\n\nInclus maintenant:\n• États Financiers Complets (Bilan, Compte de résultat, Flux de trésorerie)\n• Historique Prix 20 ans\n• Métriques 30 ans\n\nC'est l'option recommandée pour construire votre base de données."
            >
              <ArrowPathIcon className={`w-4 h-4 ${isBulkSyncing ? 'animate-spin' : ''}`} />
              <span className="flex-1 text-left">
                {isBulkSyncing && bulkSyncProgress
                  ? `Sync ${bulkSyncProgress.current}/${bulkSyncProgress.total}`
                  : 'Sync Warehouse (Deep)'}
              </span>
            </button>
            
            <div className="flex gap-1">
                 <button
                    onClick={() => {
                        if(confirm("Forcer le rafraîchissement complet ? Cela effacera le cache local.")) {
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
            title="Ouvrir le tableau de bord d'administration (Ctrl+Shift+A)\n\n• État de la synchronisation\n• Inspecteur de données brutes\n• Réparation et diagnostic"
          >
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Admin Warehouse</span>
          </button>
        )}
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar pt-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2 tracking-wider flex justify-between items-center">
          <span className="cursor-help" title="Liste de vos tickers\n\nAffiche tous les tickers de votre portefeuille et watchlist.\n\nUtilisez la barre de recherche pour filtrer par symbole ou nom.">Portefeuille</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400 cursor-help" title={`Nombre de tickers affichés: ${filteredAndSortedProfiles.length} / ${profiles.length}\n\n${searchTerm ? `(Filtrés sur "${searchTerm}")` : ''}\n${filterBy !== 'all' ? `(Filtre: ${filterBy === 'portfolio' ? 'Portefeuille' : 'Watchlist'})` : ''}`}>{filteredAndSortedProfiles.length}</span>
        </h3>
        {filteredAndSortedProfiles.length === 0 ? (
          <div className="text-center text-slate-600 text-sm py-8 px-4">
            {searchTerm ? 'Aucun résultat' : 'Commencez par ajouter un ticker'}
          </div>
        ) : (
          filteredAndSortedProfiles.map(profile => {
            // Calculate status on the fly
            const { recommendation } = calculateRecommendation(profile.data, profile.assumptions);

            return (
              <div
                key={profile.id}
                onClick={() => onSelect(profile.id)}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all ${currentId === profile.id
                  ? 'bg-blue-900/30 border border-blue-800 text-blue-100'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Recommendation Dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getRecommendationColor(recommendation)} cursor-help`} title={`Signal: ${recommendation}\n\nBasé sur:\n• Prix actuel vs Limite d'achat/vente\n• Calculé automatiquement selon vos hypothèses\n\nVert = ACHAT\nJaune = CONSERVER\nRouge = VENTE`}></div>

                  {/* Logo - Masqué immédiatement si erreur pour éviter 404 */}
                  <img 
                    src={profile.info.logo || ((profile.info.logoSymbol || profile.info.actualSymbol?.replace('.TO', '').replace('-', '.') || profile.info.preferredSymbol || profile.id) ? `https://financialmodelingprep.com/image-stock/${profile.info.logoSymbol || profile.info.actualSymbol?.replace('.TO', '').replace('-', '.') || profile.info.preferredSymbol || profile.id}.png` : '')}
                    alt={profile.info.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0 cursor-help"
                    title={`Logo de ${profile.info.name}\n\nSource: FMP API (image-stock)`}
                    onError={(e) => {
                      // Masquer immédiatement pour éviter les erreurs 404 répétées
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }}
                    onLoad={createLogoLoadHandler()}
                    loading="lazy"
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate cursor-help" title={`Symbole: ${profile.info.preferredSymbol || profile.id}\n\nCliquez pour sélectionner ce ticker et voir son analyse complète.`}>{profile.info.preferredSymbol || profile.id}</span>
                      {profile.info.exchange && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded cursor-help" title={`Bourse: ${profile.info.exchange}\n\nBourse où l'action est cotée.`}>
                          {profile.info.exchange}
                        </span>
                      )}
                      {profile.info.currency && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded cursor-help" title={`Devise: ${profile.info.currency}\n\nDevise dans laquelle l'action est cotée.`}>
                          {profile.info.currency}
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate opacity-70 cursor-help" title={`${profile.info.name}\n\nNom complet de l'entreprise.\n\nCliquez sur la ligne pour voir l'analyse complète.`}>{profile.info.name}</span>
                    {profile.info.country && (
                      <span className="text-[10px] text-slate-500 truncate cursor-help" title={`Pays: ${profile.info.country}\n\nPays d'origine de l'entreprise.`}>
                        {profile.info.country}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Watchlist/Portfolio Toggle Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(profile.id);
                    }}
                    title={profile.isWatchlist 
                      ? "Dans la Watchlist (Non détenu)\n\n👁️ Cliquez pour déplacer vers le Portefeuille\n\nLa watchlist contient les titres que vous surveillez mais ne détenez pas encore."
                      : "Dans le Portefeuille\n\n⭐ Cliquez pour déplacer vers la Watchlist\n\nLe portefeuille contient les titres que vous détenez actuellement."}
                    className={`p-1.5 rounded transition-colors ${profile.isWatchlist ? 'text-blue-400 hover:bg-slate-700' : 'text-yellow-500 hover:text-yellow-400 hover:bg-slate-700'}`}
                  >
                    {profile.isWatchlist ? (
                      <EyeIcon className="w-4 h-4" />
                    ) : (
                      <StarIcon className="w-4 h-4 fill-current" style={{ fill: '#eab308' }} />
                    )}
                  </button>

                  {/* Other Actions (Hidden unless hovered) */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(profile.id);
                      }}
                      title="Dupliquer ce ticker\n\nCrée une copie complète de l'analyse actuelle.\n\nUtile pour:\n• Comparer différents scénarios (optimiste/pessimiste)\n• Tester différentes hypothèses\n• Créer des variantes d'analyse\n\nLe ticker dupliqué aura le même nom avec un suffixe."
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
                        title="Supprimer ce ticker\n\n⚠️ ATTENTION: Cette action est irréversible!\n\nSupprime définitivement:\n• Toutes les données historiques\n• Toutes les hypothèses\n• Tous les snapshots associés\n\nUne confirmation sera demandée avant suppression."
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

      {/* Version History Section - Retiré, maintenant dans RightSidebar */}

      {/* Filters & Sort Section */}
      <div className="p-2 sm:p-3 md:p-4 border-t border-slate-800 bg-slate-900">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 cursor-help" title="Filtres et Tri\n\nFiltrez et triez votre portefeuille selon différents critères.\n\nFiltres:\n• Tous: Affiche tous les tickers\n• Portefeuille: Uniquement les titres détenus\n• Watchlist: Uniquement les titres surveillés\n\nTri:\n• Alphabétique: A-Z ou Z-A\n• Date de modification: Plus récent ou plus ancien\n• Recommandation: Achat, Conserver, Vente\n• Secteur: Par secteur d'activité">
          <FunnelIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Filtres et Tri</span>
        </h3>
        
        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2">
          <button
            onClick={() => setFilterBy('all')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors ${
              filterBy === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Afficher tous les tickers (Portefeuille + Watchlist)"
          >
            Tous
          </button>
          <button
            onClick={() => setFilterBy('portfolio')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              filterBy === 'portfolio'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Afficher uniquement les tickers du portefeuille (titres détenus)"
          >
            <StarIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Portefeuille</span>
            <span className="sm:hidden">Port.</span>
          </button>
          <button
            onClick={() => setFilterBy('watchlist')}
            className={`px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              filterBy === 'watchlist'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Afficher uniquement les tickers de la watchlist (titres surveillés)"
          >
            <EyeIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Watchlist</span>
            <span className="sm:hidden">Watch</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] sm:text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
          title="Trier les tickers\n\nOptions de tri:\n• Alphabétique (A-Z): Par symbole croissant\n• Alphabétique (Z-A): Par symbole décroissant\n• Date modif. (Récent): Plus récemment modifiés en premier\n• Date modif. (Ancien): Plus anciennement modifiés en premier\n• Recommandation: Achat → Conserver → Vente\n• Secteur: Par secteur d'activité"
        >
          <option value="lastModified">📅 Date modif. (Récent)</option>
          <option value="lastModified-desc">📅 Date modif. (Ancien)</option>
          <option value="alphabetical">🔤 Alphabétique (A-Z)</option>
          <option value="alphabetical-desc">🔤 Alphabétique (Z-A)</option>
          <option value="recommendation">⭐ Recommandation</option>
          <option value="sector">🏢 Secteur</option>
        </select>
      </div>
    </div>
  );
};