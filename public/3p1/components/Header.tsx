import React, { useState } from 'react';
import { CompanyInfo, Assumptions, Recommendation } from '../types';
import { ArrowTrendingUpIcon, BanknotesIcon, TagIcon, CalendarDaysIcon, PrinterIcon, ServerIcon, EyeIcon, StarIcon, ArrowPathIcon, ArrowUturnLeftIcon, Cog6ToothIcon, ShieldCheckIcon, DocumentChartBarIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
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
  showSyncButton?: boolean; // Nouveau prop pour controler la visibilite du bouton
  onOpenSettings?: () => void;
  onOpenReports?: () => void;
  activeSymbol?: string; // Symbole du ticker actuellement selectionne
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
  showSyncButton = true, // Par defaut, afficher le bouton
  onOpenSettings,
  onOpenReports,
  activeSymbol
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
          {/* Logo - Masque par defaut si pas de logo, affiche seulement si charge avec succes */}
          {/* Logo - Utilise l'URL fournie par le backend (info.logo) qui gere la logique FMP */}
          <img
            src={info.logo || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={`Logo de ${info.name || activeId}`}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200 cursor-help"
            title={`Logo de ${info.name}\n\nSource: FMP API\n\nCharge via: ${info.logo || 'Non disponible'}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
            onLoad={createLogoLoadHandler()}
            loading="lazy"
          />
          
          <div className="relative">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded text-blue-700 font-bold text-base sm:text-xl min-w-[50px] sm:min-w-[60px] text-center select-none cursor-help" title={`Symbole: ${info.preferredSymbol || info.symbol}\n\nSymbole boursier utilise pour identifier l'entreprise.\n\nSymbole prefere: ${info.preferredSymbol || 'N/A'}\nSymbole reel: ${info.actualSymbol || info.symbol}\nSymbole original: ${info.symbol}`}>
              {info.preferredSymbol || info.symbol}
            </div>
            {/* Recommendation Status Dot */}
            <div
              className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white ${getRecColor(recommendation)} shadow-sm cursor-help`}
              title={`Signal: ${recommendation}\n\nACHAT: Prix actuel <= Limite d'achat\nCONSERVER: Entre limite d'achat et vente\nVENTE: Prix actuel >= Limite de vente`}
            ></div>

            {/* Status Icon: Eye (Watchlist) or Star (Portfolio) - Affiche seulement si team ou watchlist */}
            {isWatchlist !== null && isWatchlist !== undefined && (
              <div
                className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-blue-100 z-10"
                title={isWatchlist 
                  ? " Watchlist (Non detenu)\n\nCe titre est dans votre watchlist (surveille mais non detenu).\n\n L'etoile  = Portefeuille (detenu), PAS une recommandation."
                  : " Portefeuille (Detenu)\n\nCe titre est dans votre portefeuille (team ticker, vous le detenez actuellement).\n\n L'etoile  = Portefeuille (detenu), PAS une recommandation.\n- Point colore = Recommandation (ACHAT/CONSERVER/VENTE)"}
              >
                {isWatchlist ? (
                  <EyeIcon className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <StarIcon className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" style={{ fill: '#eab308' }} />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {/* Affichage conditionnel: "Donnees non disponibles" seulement si aucun ticker n'est selectionne */}
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 uppercase truncate flex items-center gap-2 cursor-help" title={`${info.name}\n\nNom complet de l'entreprise.\n\nSource: FMP API (company-profile)\n\nSymbole: ${info.preferredSymbol || info.symbol}\nSecteur: ${info.sector || 'N/A'}\nPays: ${info.country || 'N/A'}\nBourse: ${info.exchange || 'N/A'}`}>
              {info.name === 'Chargement...' && !activeSymbol ? (
                <span className="text-orange-600 normal-case">Donnees non disponibles - Veuillez selectionner un ticker</span>
              ) : info.name === 'Chargement...' && activeSymbol ? (
                <span className="text-blue-600 normal-case">Chargement des donnees pour {activeSymbol}...</span>
              ) : (
                info.name
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <p className="text-xs text-gray-500 sm:hidden">GOB</p>
              {info.exchange && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-help" title={`Bourse: ${info.exchange}\n\nBourse ou l'action est cotee.\n\nSource: FMP API (company-profile)`}>
                  {info.exchange}
                </span>
              )}
              {info.currency && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-help" title={`Devise: ${info.currency}\n\nDevise dans laquelle l'action est cotee.\n\nSource: FMP API (company-profile)`}>
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
          <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center cursor-help" title="Cote de securite ValueLine (1-5)\n1 = Tres sur\n5 = Risque\nSource: ValueLine (3 dec 2025)\n Lecture seule - Modifiable via Supabase uniquement">
            <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">COTE SECURITE</span>
            <span className="font-bold text-green-600 text-sm sm:text-base">{info.securityRank}</span>
            <span className="text-[8px] sm:text-[9px] text-gray-500 hidden sm:block mt-0.5">ValueLine 3 dec 2025</span>
          </div>
          {info.beta !== undefined && info.beta !== null && isFinite(info.beta) && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center cursor-help" title={`Beta: ${info.beta.toFixed(2)}\n\nMesure la volatilite relative au marche:\n- Beta < 1: Moins volatile que le marche\n- Beta = 1: Volatilite egale au marche\n- Beta > 1: Plus volatile que le marche\n\nSource: FMP key-metrics`}>
              <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">BETA</span>
              <span className="font-bold text-blue-600 text-sm sm:text-base">{info.beta.toFixed(2)}</span>
            </div>
          )}
          {/* Metriques ValueLine - Masquees sur tres petit ecran */}
          {info.earningsPredictability && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center hidden sm:block cursor-help" title="Earnings Predictability (ValueLine)\n\nMesure la predictibilite des benefices de l'entreprise.\nSource: ValueLine (3 dec 2025)\n Lecture seule - Modifiable via Supabase uniquement">
              <span className="font-semibold text-gray-600 block text-[10px] sm:text-xs">EARNINGS PRED.</span>
              <span className="font-bold text-purple-600 text-sm sm:text-base">{info.earningsPredictability}</span>
              <span className="text-[8px] sm:text-[9px] text-gray-500 hidden md:block mt-0.5">ValueLine 3 dec 2025</span>
            </div>
          )}
          {info.priceGrowthPersistence && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center hidden md:block cursor-help" title="Price Growth Persistence (ValueLine)\n\nMesure la persistance de la croissance du prix de l'action.\nSource: ValueLine (3 dec 2025)\n Lecture seule - Modifiable via Supabase uniquement">
              <span className="font-semibold text-gray-600 block text-xs">PRICE GROWTH PERSISTENCE</span>
              <span className="font-bold text-pink-600">{info.priceGrowthPersistence}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 dec 2025</span>
            </div>
          )}
          {info.priceStability && (
            <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded text-center hidden md:block cursor-help" title="Price Stability (ValueLine)\n\nMesure la stabilite du prix de l'action.\nSource: ValueLine (3 dec 2025)\n Lecture seule - Modifiable via Supabase uniquement">
              <span className="font-semibold text-gray-600 block text-xs">PRICE STABILITY</span>
              <span className="font-bold text-teal-600">{info.priceStability}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">ValueLine 3 dec 2025</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-auto md:ml-0">
            {/* Bouton Sauvegarder */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-save-dialog'))}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all no-print bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95"
              title=" Sauvegarder une version (Snapshot)\n\nCree un snapshot complet de l'analyse actuelle incluant toutes les donnees historiques, hypotheses et metriques calculees.\n\nLes snapshots sont accessibles dans la sidebar droite (icone horloge)."
            >
              <ServerIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Sauvegarder</span>
            </button>

            {/* Bouton Synchroniser */}
            {onFetchData && showSyncButton && (
              <button
                onClick={handleSyncClick}
                disabled={isLoading}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all no-print ${
                  isLoading 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md active:scale-95 border border-emerald-200'
                }`}
                title=" Options de Synchronisation Avancees\n\nOuvre le tableau de bord de synchronisation avec toutes les options configurables pour charger/mettre a jour les donnees depuis FMP."
              >
                <CloudArrowUpIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isLoading ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline whitespace-nowrap">{isLoading ? 'Synchronisation...' : 'Synchroniser'}</span>
              </button>
            )}

            {/* Bouton Restaurer */}
            {onRestoreData && (
              <button
                onClick={onRestoreData}
                disabled={isLoading}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all no-print ${
                  isLoading 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:shadow-md active:scale-95 border border-purple-200'
                }`}
                title=" Restaurer les donnees\n\nOuvre un dialogue pour charger un snapshot precedent ou recalculer depuis FMP."
                aria-label="Restaurer les donnees"
              >
                <ArrowUturnLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Restaurer</span>
              </button>
            )}

            {/* Bouton Imprimer */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all no-print bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md active:scale-95 border border-gray-200"
              title=" Imprimer la fiche d'analyse\n\nGenere une version imprimable de l'analyse complete (donnees, graphiques, matrices, notes)."
              aria-label="Imprimer la fiche d'analyse"
            >
              <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Imprimer</span>
            </button>

            {/* Bouton Rapports */}
            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all no-print bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-md active:scale-95 border border-indigo-200"
                title=" Rapports Visuels et Analyse de Donnees\n\nOuvre le panneau de rapports visuels complets avec visualisation des donnees, qualite des donnees et statistiques detaillees."
              >
                <DocumentChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Rapports</span>
              </button>
            )}

            {/* Bouton Parametres */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all no-print bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md active:scale-95 border border-slate-200"
                title=" Configuration Complete\n\nOuvre le panneau de configuration pour gerer les Guardrails (affichage), Validation (sanitisation) et Ajustements."
              >
                <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Parametres</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 bg-slate-50 p-2 sm:p-3 rounded-md border border-slate-200">
        <div className="flex flex-col group relative">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Prix du marche en temps reel">
            <TagIcon className="w-3 h-3" /> Prix Actuel
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={assumptions.currentPrice}
            onChange={(e) => handleNumericChange(e, 'currentPrice', 0.01)}
            className={`border rounded px-2 py-1 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none ${
              assumptions.currentPrice === 0 || assumptions.currentPrice === null || assumptions.currentPrice === undefined
                ? 'border-red-300 text-red-600 focus:ring-red-500'
                : 'border-gray-300 text-blue-700 invalid:border-red-500 invalid:text-red-600'
            }`}
            placeholder={assumptions.currentPrice === 0 ? "Prix requis" : ""}
            title="Prix Actuel\n\nPrix du marche en temps reel de l'action.\nSource: FMP API (quote)\n\nVous pouvez modifier manuellement si necessaire.\nUtilise pour:\n- Calcul du rendement total\n- Calcul du JPEGY\n- Calcul du Ratio 3:1\n- Zones de prix recommandees\n\n Le prix doit etre > 0 pour les calculs"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Dividende annuel verse par action">
            <BanknotesIcon className="w-3 h-3" /> Dividende (Act.)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={assumptions.currentDividend}
            onChange={(e) => handleNumericChange(e, 'currentDividend', 0)}
            className="border border-gray-300 rounded px-2 py-1 text-base sm:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none invalid:border-red-500 invalid:text-red-600"
            title="Dividende Actuel\n\nDividende annuel verse par action.\nSource: FMP API (key-metrics)\n\nUtilise pour:\n- Calcul du Yield actuel\n- Projection des dividendes sur 5 ans\n- Calcul du rendement total (incluant dividendes)\n- Calcul du JPEGY"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Rendement du dividende (Dividende / Prix)">
            <ArrowTrendingUpIcon className="w-3 h-3" /> Rendement (Yield)
          </label>
          <div className="px-2 py-1 text-base sm:text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent cursor-help" title={`Rendement du dividende: ${assumptions.currentPrice > 0 ? formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100) : 'N/A'}\n\nFormule: (Dividende / Prix Actuel) x 100\n\nCalcule automatiquement a partir du dividende et du prix actuel.`}>
            {/* BUG #3P1-2 FIX: Validation pour eviter NaN quand currentPrice = 0 */}
            {assumptions.currentPrice > 0 ? formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100) : 'N/A'}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 cursor-help" title="Capitalisation boursiere (Market Cap)\n\nValeur totale de l'entreprise en bourse.\nFormule: Prix Actuel x Nombre d'actions en circulation\n\nSource: FMP API">Capitalisation</label>
          {/* BUG #3P1-5 FIX: Afficher N/A si donnees manquantes */}
          <div className="px-2 py-1 text-sm sm:text-base md:text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent cursor-help truncate" title={`Capitalisation: ${typeof info.marketCap === 'string' ? info.marketCap : (info.marketCap || 'Non disponible')}\n\nValeur totale de l'entreprise calculee par:\nPrix Actuel x Nombre d'actions en circulation`}>
            {info.marketCap && typeof info.marketCap === 'string' && info.marketCap.trim() !== '' ? info.marketCap : (typeof info.marketCap === 'number' ? info.marketCap.toLocaleString() : 'N/A')}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Annee de depart pour les projections a 5 ans">
            <CalendarDaysIcon className="w-3 h-3" /> Annee de Base
          </label>
          {/* BUG #3P1-5 FIX: Gerer le cas ou availableYears est vide */}
          <select
            value={assumptions.baseYear || ''}
            onChange={(e) => onUpdateAssumption('baseYear', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm sm:text-base md:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[38px]"
            title="Annee de Base\n\nAnnee de reference pour toutes les projections a 5 ans.\n\nSelectionnez l'annee qui servira de point de depart:\n- Generalement la derniere annee complete\n- Ou l'annee estimee N+1 si disponible\n\nToutes les valeurs projetees (EPS, CF, BV, DIV) partiront de cette annee.\n\nModifier l'annee de base recalcule automatiquement toutes les projections."
          >
            {availableYears.length > 0 ? (
              availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            ) : (
              <option value="">Selectionner une annee</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};