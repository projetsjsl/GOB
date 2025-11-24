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
  StarIcon
} from '@heroicons/react/24/outline';
import { AnalysisProfile, Recommendation } from '../types';
import { calculateRecommendation } from '../utils/calculations';
import { VersionHistory } from './VersionHistory';

interface SidebarProps {
  profiles: AnalysisProfile[];
  currentId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleWatchlist: (id: string) => void;
  onLoadVersion: (snapshotId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ profiles, currentId, onSelect, onAdd, onDelete, onDuplicate, onToggleWatchlist, onLoadVersion }) => {
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
      <div className="p-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
          <ChartBarIcon className="w-6 h-6" />
          <span>FinancePro</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Gestion de Portefeuille</p>
      </div>

      {/* Search & Add */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-500 transition-all focus:border-blue-500"
            />
          </div>
          <button
            onClick={onAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-lg hover:shadow-blue-500/20 whitespace-nowrap"
            title="Ajouter un Ticker"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden xl:inline">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar pt-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2 tracking-wider flex justify-between items-center">
          <span>Portefeuille</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400">{filteredProfiles.length}</span>
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
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getRecommendationColor(recommendation)}`} title={`Signal: ${recommendation}`}></div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm truncate flex items-center gap-2">
                      {profile.id}
                    </span>
                    <span className="text-xs truncate opacity-70">{profile.info.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Watchlist/Portfolio Toggle Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(profile.id);
                    }}
                    title={profile.isWatchlist ? "Dans la Watchlist (Non détenu)" : "Dans le Portefeuille"}
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
                      title="Dupliquer"
                      className="p-1.5 hover:bg-slate-700 hover:text-white rounded"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer ${profile.id} ?`)) onDelete(profile.id);
                      }}
                      title="Supprimer"
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

      {/* Version History Section */}
      <div className="border-t border-slate-800" style={{ height: '300px' }}>
        <VersionHistory
          ticker={currentId}
          onLoadVersion={onLoadVersion}
        />
      </div>

      {/* Research Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
          <DocumentMagnifyingGlassIcon className="w-3 h-3" />
          Recherche Rapide
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {researchLinks.map(link => (
            <a
              key={link.name}
              href={link.url(currentId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
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