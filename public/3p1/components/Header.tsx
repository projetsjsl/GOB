import React, { useState } from 'react';
import { CompanyInfo, Assumptions, Recommendation } from '../types';
import { ArrowTrendingUpIcon, BanknotesIcon, TagIcon, CalendarDaysIcon, PrinterIcon, CloudArrowDownIcon, EyeIcon, StarIcon, ArrowPathIcon, ArrowDownTrayIcon, Cog6ToothIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { formatPercent } from '../utils/calculations';
import { createLogoErrorHandler, createLogoLoadHandler } from '../utils/logoUtils';

interface HeaderProps {
  info: CompanyInfo;
  assumptions: Assumptions;
  availableYears: number[];
  recommendation: Recommendation;
  isWatchlist: boolean;
  onUpdateInfo: (key: keyof CompanyInfo, value: string) => void;
  onUpdateAssumption: (key: keyof Assumptions, value: number) => void;
  onFetchData?: () => Promise<void>;
  onRestoreData?: () => void;
  showSyncButton?: boolean; // Nouveau prop pour contrôler la visibilité du bouton
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  info,
  assumptions,
  availableYears,
  recommendation,
  isWatchlist,
  onUpdateInfo,
  onUpdateAssumption,
  onFetchData,
  onRestoreData,

  showSyncButton = true, // Par défaut, afficher le bouton
  onOpenSettings
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
    <div className="bg-white p-2 sm:p-4 rounded-lg shadow mb-4 border-l-4 border-blue-600 print-full-width">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 sm:mb-4 border-b pb-2">
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          {/* Logo - Masqué par défaut si pas de logo, affiché seulement si chargé avec succès */}
          <img 
            src={info.logo || ((info.preferredSymbol || info.symbol) ? `https://financialmodelingprep.com/image-stock/${info.preferredSymbol || info.symbol}.png` : '')}
            alt={info.name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200 cursor-help"
            title={`Logo de ${info.name}\n\nSource: FMP API (image-stock)\n\nLe logo est chargé automatiquement depuis l'API Financial Modeling Prep.`}
            onError={(e) => {
              // Masquer immédiatement pour éviter les erreurs 404 répétées
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }}
            onLoad={createLogoLoadHandler()}
            loading="lazy"
          />
          
          <div className="relative">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded text-blue-700 font-bold text-base sm:text-xl min-w-[50px] sm:min-w-[60px] text-center select-none cursor-help" title={`Symbole: ${info.preferredSymbol || info.symbol}\n\nSymbole boursier utilisé pour identifier l'entreprise.\n\nSymbole préféré: ${info.preferredSymbol || 'N/A'}\nSymbole réel: ${info.actualSymbol || info.symbol}\nSymbole original: ${info.symbol}`}>
              {info.preferredSymbol || info.symbol}
            </div>
            {/* Recommendation Status Dot */}
            <div
              className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white ${getRecColor(recommendation)} shadow-sm cursor-help`}
              title={`Signal: ${recommendation}\n\nACHAT: Prix actuel ≤ Limite d'achat\nCONSERVER: Entre limite d'achat et vente\nVENTE: Prix actuel ≥ Limite de vente`}
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
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 uppercase truncate flex items-center gap-2 cursor-help" title={`${info.name}\n\nNom complet de l'entreprise.\n\nSource: FMP API (company-profile)\n\nSymbole: ${info.preferredSymbol || info.symbol}\nSecteur: ${info.sector || 'N/A'}\nPays: ${info.country || 'N/A'}\nBourse: ${info.exchange || 'N/A'}`}>
              {info.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <p className="text-xs text-gray-500 sm:hidden">GOB</p>
              {info.exchange && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-help" title={`Bourse: ${info.exchange}\n\nBourse où l'action est cotée.\n\nSource: FMP API (company-profile)`}>
                  {info.exchange}
                </span>
              )}
              {info.currency && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-help" title={`Devise: ${info.currency}\n\nDevise dans laquelle l'action est cotée.\n\nSource: FMP API (company-profile)`}>
                  {info.currency}
                </span>
              )}
              {info.country && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-help" title={`Pays: ${info.country}\n\nPays d'origine de l'entreprise.\n\nSource: FMP API (company-profile)`}>
                  {info.country}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 text-xs sm:text-sm shrink-0 w-full md:w-auto">
          <div className="bg-gray-100 px-2 sm:px-2.5 md:px-3 py-1 rounded cursor-help min-w-0 flex-shrink">
            <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">SECTEUR</span>
            <span className="text-xs sm:text-sm truncate block" title={info.sector}>{info.sector}</span>
          </div>
          <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center cursor-help" title="Cote de sécurité ValueLine (1-5)\n1 = Très sûr\n5 = Risqué\nSource: ValueLine (3 déc 2025)\n⚠️ Lecture seule - Modifiable via Supabase uniquement">
            <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">CÔTE SÉCURITÉ</span>
            <span className="font-bold text-green-600 text-sm sm:text-base">{info.securityRank}</span>
            <span className="text-[8px] sm:text-[9px] text-gray-500 hidden sm:block mt-0.5">ValueLine 3 déc 2025</span>
          </div>
          {info.beta !== undefined && info.beta !== null && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center cursor-help" title={`Beta: ${info.beta.toFixed(2)}\n\nMesure la volatilité relative au marché:\n• Beta < 1: Moins volatile que le marché\n• Beta = 1: Volatilité égale au marché\n• Beta > 1: Plus volatile que le marché\n\nSource: FMP key-metrics`}>
              <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">BETA</span>
              <span className="font-bold text-blue-600 text-sm sm:text-base">{info.beta.toFixed(2)}</span>
            </div>
          )}
          {/* Métriques ValueLine - Masquées sur très petit écran */}
          {info.earningsPredictability && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center hidden sm:block cursor-help" title="Earnings Predictability (ValueLine)\n\nMesure la prédictibilité des bénéfices de l'entreprise.\nSource: ValueLine (3 déc 2025)\n⚠️ Lecture seule - Modifiable via Supabase uniquement">
              <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">EARNINGS PRED.</span>
              <span className="font-bold text-purple-600 text-sm sm:text-base">{info.earningsPredictability}</span>
              <span className="text-[8px] sm:text-[9px] text-gray-500 hidden md:block mt-0.5">ValueLine 3 déc 2025</span>
            </div>
          )}
          {info.priceGrowthPersistence && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center hidden md:block cursor-help" title="Price Growth Persistence (ValueLine)\n\nMesure la persistance de la croissance du prix de l'action.\nSource: ValueLine (3 déc 2025)\n⚠️ Lecture seule - Modifiable via Supabase uniquement">
              <span className="font-semibold text-gray-600 block text-xs">PRICE GROWTH PERSISTENCE</span>
              <span className="font-bold text-pink-600">{info.priceGrowthPersistence}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 déc 2025</span>
            </div>
          )}
          {info.priceStability && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center hidden md:block cursor-help" title="Price Stability (ValueLine)\n\nMesure la stabilité du prix de l'action.\nSource: ValueLine (3 déc 2025)\n⚠️ Lecture seule - Modifiable via Supabase uniquement">
              <span className="font-semibold text-gray-600 block text-xs">PRICE STABILITY</span>
              <span className="font-bold text-teal-600">{info.priceStability}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 déc 2025</span>
            </div>
          )}
          <div className="flex gap-1 sm:gap-2 ml-auto md:ml-0">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-save-dialog'))}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase transition-colors no-print bg-blue-600 text-white hover:bg-blue-700"
              title="Sauvegarder une version (Snapshot)\n\nCrée un snapshot de l'analyse actuelle incluant:\n• Toutes les données historiques\n• Toutes les hypothèses\n• Les métriques calculées\n• Date et heure de sauvegarde\n\nLes snapshots sont accessibles dans la sidebar droite."
            >
              <CloudArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>

            {onFetchData && showSyncButton && (
              <button
                onClick={handleSyncClick}
                disabled={isLoading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase transition-colors no-print ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                title="Synchroniser les données (Sync. Données)\n\nRécupère les dernières données depuis l'API FMP:\n• Met à jour les données auto-fetchées (autoFetched: true)\n• Préserve les modifications manuelles (autoFetched: false)\n• Ajoute les nouvelles années disponibles\n• Recalcule les hypothèses (préserve les exclusions)\n• Préserve les métriques ValueLine\n\n⚠️ Ne synchronise que le ticker actuellement sélectionné."
              >
                <ArrowPathIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">{isLoading ? 'Sync...' : 'Sync. Données'}</span>
              </button>
            )}

            {onRestoreData && (
              <button
                onClick={onRestoreData}
                disabled={isLoading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase transition-colors no-print ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                title="Restaurer les données\n\nOuvre un dialogue avec 2 options:\n\n1. Charger le dernier snapshot:\n   • Restaure la dernière sauvegarde\n   • Mode lecture seule\n\n2. Recalculer depuis FMP:\n   • Recharge les données FMP\n   • Réapplique les hypothèses auto-fill\n   • Préserve les exclusions et métriques ValueLine"
              >
                <ArrowDownTrayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Restaurer</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors no-print"
              title="Imprimer la fiche"
            >
              <PrinterIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors no-print"
                title="Configuration Complète : Guardrails, Validation, Ajustements"
              >
                <Cog6ToothIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 bg-slate-50 p-2 sm:p-3 rounded-md border border-slate-200">
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
            className="border border-gray-300 rounded px-2 py-1 text-base sm:text-lg font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none invalid:border-red-500 invalid:text-red-600"
            title="Prix Actuel\n\nPrix du marché en temps réel de l'action.\nSource: FMP API (quote)\n\nVous pouvez modifier manuellement si nécessaire.\nUtilisé pour:\n• Calcul du rendement total\n• Calcul du JPEGY\n• Calcul du Ratio 3:1\n• Zones de prix recommandées"
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
            className="border border-gray-300 rounded px-2 py-1 text-base sm:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none invalid:border-red-500 invalid:text-red-600"
            title="Dividende Actuel\n\nDividende annuel versé par action.\nSource: FMP API (key-metrics)\n\nUtilisé pour:\n• Calcul du Yield actuel\n• Projection des dividendes sur 5 ans\n• Calcul du rendement total (incluant dividendes)\n• Calcul du JPEGY"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Rendement du dividende (Dividende / Prix)">
            <ArrowTrendingUpIcon className="w-3 h-3" /> Rendement (Yield)
          </label>
          <div className="px-2 py-1 text-base sm:text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent cursor-help" title={`Rendement du dividende: ${formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100)}\n\nFormule: (Dividende / Prix Actuel) × 100\n\nCalculé automatiquement à partir du dividende et du prix actuel.`}>
            {formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100)}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 cursor-help" title="Capitalisation boursière (Market Cap)\n\nValeur totale de l'entreprise en bourse.\nFormule: Prix Actuel × Nombre d'actions en circulation\n\nSource: FMP API">Capitalisation</label>
          <div className="px-2 py-1 text-sm sm:text-base md:text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent cursor-help truncate" title={`Capitalisation: ${info.marketCap}\n\nValeur totale de l'entreprise calculée par:\nPrix Actuel × Nombre d'actions en circulation`}>
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
            className="border border-gray-300 rounded px-2 py-1.5 text-sm sm:text-base md:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[38px]"
            title="Année de Base\n\nAnnée de référence pour toutes les projections à 5 ans.\n\nSélectionnez l'année qui servira de point de départ:\n• Généralement la dernière année complète\n• Ou l'année estimée N+1 si disponible\n\nToutes les valeurs projetées (EPS, CF, BV, DIV) partiront de cette année.\n\nModifier l'année de base recalcule automatiquement toutes les projections."
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