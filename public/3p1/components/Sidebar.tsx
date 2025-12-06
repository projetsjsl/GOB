import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  StarIcon,
  ArrowPathIcon
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
}

export const Sidebar: React.FC<SidebarProps> = ({ profiles, currentId, onSelect, onAdd, onDelete, onDuplicate, onToggleWatchlist, onLoadVersion, onSyncFromSupabase, isLoadingTickers = false, onBulkSyncAll, isBulkSyncing = false, bulkSyncProgress }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = profiles
    .filter(p =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.info.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.lastModified - a.lastModified);

  const researchLinks = [
    { name: 'Yahoo Finance', url: (symbol: string) => `https://finance.yahoo.com/quote/${symbol}` },
    { name: 'Google Finance', url: (symbol: string) => `https://www.google.com/finance/quote/${symbol}` },
    { name: 'TradingView', url: (symbol: string) => `https://www.tradingview.com/chart/?symbol=${symbol}` },
    { name: 'Seeking Alpha', url: (symbol: string) => `https://seekingalpha.com/symbol/${symbol}` },
    { name: 'Morningstar', url: (symbol: string) => `https://www.morningstar.com/search?query=${symbol}` },
    { name: 'Finviz', url: (symbol: string) => `https://finviz.com/quote.ashx?t=${symbol}` },
  ];

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
        {onSyncFromSupabase && (
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
        {onBulkSyncAll && (
          <button
            onClick={onBulkSyncAll}
            disabled={isBulkSyncing || isLoadingTickers}
            className="w-full bg-green-700 hover:bg-green-600 disabled:bg-slate-800 disabled:opacity-50 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors"
            title="Synchroniser tous les tickers\n\nSynchronise TOUS les tickers de votre portefeuille avec l'API FMP.\n\n⚠️ IMPORTANT:\n• Crée automatiquement un snapshot de sauvegarde AVANT la sync\n• Met à jour uniquement les données auto-fetchées (autoFetched: true)\n• Préserve toutes vos modifications manuelles (autoFetched: false)\n• Ajoute les nouvelles années disponibles\n• Recalcule les hypothèses (préserve les exclusions)\n• Préserve les métriques ValueLine\n\nCette opération peut prendre plusieurs minutes selon le nombre de tickers."
          >
            <ArrowPathIcon className={`w-4 h-4 ${isBulkSyncing ? 'animate-spin' : ''}`} />
            <span className="flex-1 text-left">
              {isBulkSyncing && bulkSyncProgress
                ? `Sync ${bulkSyncProgress.current}/${bulkSyncProgress.total}`
                : 'Sync Tous les Tickers'}
            </span>
          </button>
        )}
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar pt-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2 tracking-wider flex justify-between items-center">
          <span className="cursor-help" title="Liste de vos tickers\n\nAffiche tous les tickers de votre portefeuille et watchlist.\n\nUtilisez la barre de recherche pour filtrer par symbole ou nom.">Portefeuille</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400 cursor-help" title={`Nombre de tickers dans votre portefeuille: ${filteredProfiles.length}\n\n${searchTerm ? `(Filtrés sur "${searchTerm}")` : ''}`}>{filteredProfiles.length}</span>
        </h3>
        {filteredProfiles.length === 0 ? (
          <div className="text-center text-slate-600 text-sm py-8 px-4">
            {searchTerm ? 'Aucun résultat' : 'Commencez par ajouter un ticker'}
          </div>
        ) : (
          filteredProfiles.map(profile => {
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
                    src={profile.info.logo || `https://financialmodelingprep.com/image-stock/${profile.info.logoSymbol || profile.info.actualSymbol?.replace('.TO', '').replace('-', '.') || profile.info.preferredSymbol || profile.id}.png`}
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
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Version History Section - Retiré, maintenant dans RightSidebar */}

      {/* Research Section */}
      <div className="p-2 sm:p-3 md:p-4 border-t border-slate-800 bg-slate-900">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 cursor-help" title="Recherche Rapide\n\nLiens vers des sites d'analyse financière externes.\n\nOuvre chaque site dans un nouvel onglet avec le ticker actuellement sélectionné.">
          <DocumentMagnifyingGlassIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Recherche Rapide</span>
        </h3>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {researchLinks.map(link => (
            <a
              key={link.name}
              href={link.url(currentId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 rounded text-[10px] sm:text-xs text-slate-300 transition-colors"
              title={`Ouvrir ${link.name} pour ${currentId}\n\nOuvre ${link.name} dans un nouvel onglet avec le ticker ${currentId}.\n\nUtile pour:\n• Recherche d'informations complémentaires\n• Analyse technique\n• Actualités et analyses\n• Comparaison avec d'autres sources`}
            >
              {link.name}
              <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-50" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};