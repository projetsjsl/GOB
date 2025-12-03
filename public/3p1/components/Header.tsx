import React, { useState } from 'react';
import { CompanyInfo, Assumptions, Recommendation } from '../types';
import { ArrowTrendingUpIcon, BanknotesIcon, TagIcon, CalendarDaysIcon, PrinterIcon, CloudArrowDownIcon, EyeIcon, StarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatPercent } from '../utils/calculations';

interface HeaderProps {
  info: CompanyInfo;
  assumptions: Assumptions;
  availableYears: number[];
  recommendation: Recommendation;
  isWatchlist: boolean;
  onUpdateInfo: (key: keyof CompanyInfo, value: string) => void;
  onUpdateAssumption: (key: keyof Assumptions, value: number) => void;
  onFetchData?: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  info,
  assumptions,
  availableYears,
  recommendation,
  isWatchlist,
  onUpdateInfo,
  onUpdateAssumption,
  onFetchData
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Assumptions, min: number = -Infinity) => {
    const inputValue = e.target.value;

    // Allow clearing the input
    if (inputValue === '') {
      onUpdateAssumption(key, 0);
      return;
    }

    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= min) {
      onUpdateAssumption(key, value);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSyncClick = async () => {
    if (onFetchData) {
      setIsLoading(true);
      try {
        await onFetchData();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getRecColor = (rec: Recommendation) => {
    switch (rec) {
      case Recommendation.BUY: return 'bg-green-500';
      case Recommendation.SELL: return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-blue-600 print-full-width">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-2">
        <div className="flex items-center gap-3">
          {/* Logo */}
          {info.logo ? (
            <img 
              src={info.logo} 
              alt={info.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200"
              onError={(e) => {
                // Essayer plusieurs variantes de logo
                const symbolsToTry = [
                  info.logoSymbol, // Symbole optimisé pour logo depuis l'API
                  info.actualSymbol?.replace('.TO', '').replace('-', '.'), // Symbole réel utilisé
                  info.preferredSymbol, // Symbole original demandé
                  (info as any).symbol // Symbole alternatif
                ].filter(Boolean);
                
                let triedIndex = 0;
                const tryNextFallback = () => {
                  if (triedIndex < symbolsToTry.length) {
                    const fallbackUrl = `https://financialmodelingprep.com/image-stock/${symbolsToTry[triedIndex]}.png`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                      triedIndex++;
                    } else {
                      triedIndex++;
                      tryNextFallback();
                    }
                  } else {
                    // Si tous les fallbacks échouent, masquer l'image
                    e.currentTarget.style.display = 'none';
                  }
                };
                
                tryNextFallback();
              }}
            />
          ) : (
            // Fallback si pas de logo dans les données
            <img 
              src={`https://financialmodelingprep.com/image-stock/${info.preferredSymbol || info.symbol}.png`}
              alt={info.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          
          <div className="relative">
            <div className="bg-blue-100 p-2 rounded text-blue-700 font-bold text-xl min-w-[60px] text-center select-none">
              {info.preferredSymbol || info.symbol}
            </div>
            {/* Recommendation Status Dot */}
            <div
              className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white ${getRecColor(recommendation)} shadow-sm`}
              title={`Signal: ${recommendation}`}
            ></div>

            {/* Status Icon: Eye (Watchlist) or Star (Portfolio) */}
            <div
              className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-blue-100 z-10"
              title={isWatchlist ? "Liste de surveillance (Non détenu)" : "En Portefeuille"}
            >
              {isWatchlist ? (
                <EyeIcon className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <StarIcon className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" style={{ fill: '#eab308' }} />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 uppercase truncate max-w-[300px] md:max-w-[500px] flex items-center gap-2">
              {info.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">GROUPE OUELLET BOLDUC - GESTIONNAIRES DE PORTEFEUILLE</p>
              {info.exchange && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {info.exchange}
                </span>
              )}
              {info.currency && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {info.currency}
                </span>
              )}
              {info.country && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {info.country}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 md:mt-0 flex items-center gap-4 text-sm shrink-0">
          <div className="bg-gray-100 px-3 py-1 rounded">
            <span className="font-semibold text-gray-600 block text-xs">SECTEUR</span>
            {info.sector}
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded text-center">
            <span className="font-semibold text-gray-600 block text-xs">CÔTE SÉCURITÉ</span>
            <span className="font-bold text-green-600">{info.securityRank}</span>
            <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 déc 2025</span>
          </div>
          {info.beta !== undefined && info.beta !== null && (
            <div className="bg-gray-100 px-3 py-1 rounded text-center">
              <span className="font-semibold text-gray-600 block text-xs">BETA</span>
              <span className="font-bold text-blue-600">{info.beta.toFixed(2)}</span>
            </div>
          )}
          {/* Métriques ValueLine */}
          {info.earningsPredictability && (
            <div className="bg-gray-100 px-3 py-1 rounded text-center">
              <span className="font-semibold text-gray-600 block text-xs">EARNINGS PRED.</span>
              <span className="font-bold text-purple-600">{info.earningsPredictability}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 déc 2025</span>
            </div>
          )}
          {info.priceGrowthPersistence && (
            <div className="bg-gray-100 px-3 py-1 rounded text-center">
              <span className="font-semibold text-gray-600 block text-xs">PRICE GROWTH PERSISTENCE</span>
              <span className="font-bold text-pink-600">{info.priceGrowthPersistence}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 déc 2025</span>
            </div>
          )}
          {info.priceStability && (
            <div className="bg-gray-100 px-3 py-1 rounded text-center">
              <span className="font-semibold text-gray-600 block text-xs">PRICE STABILITY</span>
              <span className="font-bold text-teal-600">{info.priceStability}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 déc 2025</span>
            </div>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-save-dialog'))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-colors no-print bg-blue-600 text-white hover:bg-blue-700"
            title="Sauvegarder une version (Snapshot)"
          >
            <CloudArrowDownIcon className="w-4 h-4" />
            Sauvegarder
          </button>

          {onFetchData && (
            <button
              onClick={handleSyncClick}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-colors no-print ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              title="Récupérer les données via API (FMP & Finnhub)"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Sync...' : 'Sync. Données'}
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors no-print"
            title="Imprimer la fiche (PDF)"
          >
            <PrinterIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Stats Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-3 rounded-md border border-slate-200">
        <div className="flex flex-col group relative">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Prix du marché en temps réel">
            <TagIcon className="w-3 h-3" /> Prix Actuel
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={assumptions.currentPrice}
            onChange={(e) => handleNumericChange(e, 'currentPrice', 0.01)}
            className="border border-gray-300 rounded px-2 py-1 text-lg font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none invalid:border-red-500 invalid:text-red-600"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Dividende annuel versé par action">
            <BanknotesIcon className="w-3 h-3" /> Dividende (Act.)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={assumptions.currentDividend}
            onChange={(e) => handleNumericChange(e, 'currentDividend', 0)}
            className="border border-gray-300 rounded px-2 py-1 text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none invalid:border-red-500 invalid:text-red-600"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Rendement du dividende (Dividende / Prix)">
            <ArrowTrendingUpIcon className="w-3 h-3" /> Rendement (Yield)
          </label>
          <div className="px-2 py-1 text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent">
            {formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100)}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 cursor-help" title="Valeur totale de l'entreprise en bourse">Capitalisation</label>
          <div className="px-2 py-1 text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent">
            {info.marketCap}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Année de départ pour les projections à 5 ans">
            <CalendarDaysIcon className="w-3 h-3" /> Année de Base
          </label>
          <select
            value={assumptions.baseYear}
            onChange={(e) => onUpdateAssumption('baseYear', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1.5 text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[38px]"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};