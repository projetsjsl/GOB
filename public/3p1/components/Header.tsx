import React, { useState } from 'react';
import { CompanyInfo, Assumptions, Recommendation } from '../types';
import { ArrowTrendingUpIcon, BanknotesIcon, TagIcon, CalendarDaysIcon, PrinterIcon, CloudArrowDownIcon, EyeIcon, StarIcon, ArrowPathIcon, ArrowDownTrayIcon, Cog6ToothIcon, ShieldCheckIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
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
  onOpenReports?: () => void;
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
  onOpenSettings,
  onOpenReports
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
          {/* Logo - Utilise l'URL fournie par le backend (info.logo) qui gère la logique FMP */}
          <img 
            src={info.logo || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={info.name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200 cursor-help"
            title={`Logo de ${info.name}\n\nSource: FMP API\n\nChargé via: ${info.logo || 'Non disponible'}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
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

            {/* Status Icon: Eye (Watchlist) or Star (Portfolio) - Affiché seulement si team ou watchlist */}
            {isWatchlist !== null && isWatchlist !== undefined && (
              <div
                className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-blue-100 z-10"
                title={isWatchlist 
                  ? "👁️ Watchlist (Non détenu)\n\nCe titre est dans votre watchlist (surveillé mais non détenu).\n\n⚠️ L'étoile ⭐ = Portefeuille (détenu), PAS une recommandation."
                  : "⭐ Portefeuille (Détenu)\n\nCe titre est dans votre portefeuille (team ticker, vous le détenez actuellement).\n\n⚠️ L'étoile ⭐ = Portefeuille (détenu), PAS une recommandation.\n• Point coloré = Recommandation (ACHAT/CONSERVER/VENTE)"}
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
            {/* BUG #3P1-4 FIX: Afficher message d'erreur si toujours en chargement */}
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 uppercase truncate flex items-center gap-2 cursor-help" title={`${info.name}\n\nNom complet de l'entreprise.\n\nSource: FMP API (company-profile)\n\nSymbole: ${info.preferredSymbol || info.symbol}\nSecteur: ${info.sector || 'N/A'}\nPays: ${info.country || 'N/A'}\nBourse: ${info.exchange || 'N/A'}`}>
              {info.name === 'Chargement...' ? (
                <span className="text-orange-600 normal-case">Données non disponibles - Veuillez sélectionner un ticker</span>
              ) : (
                info.name
              )}
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
          {info.beta !== undefined && info.beta !== null && isFinite(info.beta) && (
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
              title="💾 Sauvegarder une version (Snapshot)\n\nCrée un snapshot complet de l'analyse actuelle incluant:\n\n📊 Données:\n• Toutes les données historiques (EPS, CF, BV, Dividendes)\n• Prix historiques (High/Low par année)\n• Données manuelles et auto-fetchées\n\n⚙️ Hypothèses:\n• Tous les taux de croissance (EPS, CF, BV, DIV)\n• Tous les ratios cibles (P/E, P/CF, P/BV, Yield)\n• Prix actuel et dividende actuel\n• Taux de rendement requis\n• Exclusions de métriques (EPS, CF, BV, DIV)\n\n📈 Métriques:\n• Toutes les métriques calculées\n• Date et heure de sauvegarde\n• Version du snapshot\n\n💡 Utilisation:\n• Les snapshots sont accessibles dans la sidebar droite (icône horloge)\n• Permet de comparer différentes versions de l'analyse\n• Utile pour suivre l'évolution de vos hypothèses dans le temps"
            >
              <CloudArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>

            {onFetchData && showSyncButton && (
              <button
                onClick={handleSyncClick}
                disabled={isLoading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase transition-colors no-print ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                title="🔄 Options de Synchronisation Avancées\n\nCliquez pour ouvrir le tableau de bord de synchronisation avec toutes les options configurables.\n\n📊 Le dialogue vous permet de:\n• Choisir quelles données synchroniser (historiques, assumptions, infos)\n• Décider si vous voulez remplacer les données oranges\n• Configurer des options avancées (nouvelles années uniquement, métriques manquantes, etc.)\n• Voir des explications détaillées avec exemples concrets pour chaque option\n\n💡 Chaque option inclut une section d'aide avec:\n• Comportement attendu\n• Exemples concrets\n• Outils et APIs utilisés\n• Formules et algorithmes\n• Recommandations d'utilisation"
              >
                <ArrowPathIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">{isLoading ? 'Sync...' : '⚙️ Options Sync'}</span>
              </button>
            )}

            {onRestoreData && (
              <button
                onClick={onRestoreData}
                disabled={isLoading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase transition-colors no-print ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                title="📥 Restaurer les données\n\nOuvre un dialogue de restauration avec 2 options principales:\n\n1️⃣ Charger le dernier snapshot:\n   • Restaure la dernière sauvegarde complète\n   • Inclut toutes les données historiques\n   • Inclut toutes les hypothèses\n   • Mode lecture seule (sécurisé)\n   • Permet de comparer avec la version actuelle\n\n2️⃣ Recalculer depuis FMP:\n   • Recharge les données FMP Premium (30 ans)\n   • Réapplique automatiquement les hypothèses auto-fill\n   • Préserve vos exclusions de métriques\n   • Préserve les métriques ValueLine\n   • Met à jour uniquement les données auto-fetchées\n\n💡 Utilisation:\n• Utilisez 'Charger snapshot' pour revenir à une version précédente\n• Utilisez 'Recalculer FMP' pour actualiser avec les dernières données\n• Les modifications manuelles sont toujours préservées"
              >
                <ArrowDownTrayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Restaurer</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors no-print"
              title="🖨️ Imprimer la fiche d'analyse\n\nGénère une version imprimable de l'analyse complète incluant:\n\n📊 Contenu imprimé:\n• En-tête avec informations de l'entreprise\n• Tableau des données historiques\n• Graphiques de valorisation\n• Matrices de sensibilité (P/E et P/CF)\n• Évaluation détaillée (4 métriques)\n• Notes de l'analyste\n• Résumé exécutif\n\n💡 Conseils:\n• Utilisez Ctrl+P (Cmd+P sur Mac) pour ouvrir le dialogue d'impression\n• Les éléments avec la classe 'no-print' sont automatiquement masqués\n• Optimisé pour impression en format A4\n• Les couleurs sont préservées pour une meilleure lisibilité"
            >
              <PrinterIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>

            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors no-print"
                title="📊 Rapports Visuels et Analyse de Données\n\nOuvre le panneau de rapports visuels complets incluant:\n\n📈 Qualité des Données:\n• Visualisation des données aberrantes détectées\n• Métriques exclues et raisons d'exclusion\n• Analyse des outliers dans les données historiques\n• Graphiques des prix cibles par métrique\n• Statistiques détaillées (médiane, écart-type)\n\n✅ Rapport de Sanitisation:\n• Comparaison avant/après sanitisation\n• Détails de toutes les corrections appliquées\n• Raisons des corrections par paramètre\n• Statistiques par catégorie (croissance, ratios, prix)\n\n📊 Visualisation Complète:\n• Graphiques de toutes les données historiques\n• Évolution des prix (High/Low/Avg)\n• Ratios de valorisation (P/E, P/CF, P/BV)\n• Taux de croissance annuel\n• Corrélations et statistiques"
              >
                <DocumentChartBarIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors no-print"
                title="⚙️ Configuration Complète : Guardrails, Validation, Ajustements\n\nOuvre le panneau de configuration unifié pour gérer tous les paramètres de l'application.\n\n🛡️ Guardrails (Limites d'affichage):\n• Limites de croissance (min/max)\n• Limites de ratios (P/E, P/CF, P/BV)\n• Multiplicateur maximum raisonnable\n• Contrôlent l'affichage des graphiques et tableaux\n• Stockés dans localStorage (navigateur)\n\n✅ Validation (Paramètres de sanitisation):\n• Limites de croissance par métrique\n• Limites de ratios cibles\n• Précision des calculs\n• Automatisation de la sanitisation\n• Cohérence des données\n• Stockés dans Supabase (partagés)\n\n📊 Ajustements:\n• Paramètres généraux de l'application\n• Comportement par défaut\n• Options d'affichage\n\n💡 Impact:\n• Les Guardrails affectent l'affichage uniquement\n• La Validation affecte les calculs et la sauvegarde\n• Les changements sont appliqués immédiatement"
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
            className={`border rounded px-2 py-1 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none ${
              assumptions.currentPrice === 0 || assumptions.currentPrice === null || assumptions.currentPrice === undefined
                ? 'border-red-300 text-red-600 focus:ring-red-500'
                : 'border-gray-300 text-blue-700 invalid:border-red-500 invalid:text-red-600'
            }`}
            placeholder={assumptions.currentPrice === 0 ? "Prix requis" : ""}
            title="Prix Actuel\n\nPrix du marché en temps réel de l'action.\nSource: FMP API (quote)\n\nVous pouvez modifier manuellement si nécessaire.\nUtilisé pour:\n• Calcul du rendement total\n• Calcul du JPEGY\n• Calcul du Ratio 3:1\n• Zones de prix recommandées\n\n⚠️ Le prix doit être > 0 pour les calculs"
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
          <div className="px-2 py-1 text-base sm:text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent cursor-help" title={`Rendement du dividende: ${assumptions.currentPrice > 0 ? formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100) : 'N/A'}\n\nFormule: (Dividende / Prix Actuel) × 100\n\nCalculé automatiquement à partir du dividende et du prix actuel.`}>
            {/* BUG #3P1-2 FIX: Validation pour éviter NaN quand currentPrice = 0 */}
            {assumptions.currentPrice > 0 ? formatPercent((assumptions.currentDividend / assumptions.currentPrice) * 100) : 'N/A'}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 cursor-help" title="Capitalisation boursière (Market Cap)\n\nValeur totale de l'entreprise en bourse.\nFormule: Prix Actuel × Nombre d'actions en circulation\n\nSource: FMP API">Capitalisation</label>
          {/* BUG #3P1-5 FIX: Afficher N/A si données manquantes */}
          <div className="px-2 py-1 text-sm sm:text-base md:text-lg font-medium text-gray-700 bg-gray-100 rounded border border-transparent cursor-help truncate" title={`Capitalisation: ${info.marketCap || 'Non disponible'}\n\nValeur totale de l'entreprise calculée par:\nPrix Actuel × Nombre d'actions en circulation`}>
            {info.marketCap && info.marketCap.trim() !== '' ? info.marketCap : 'N/A'}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1 cursor-help" title="Année de départ pour les projections à 5 ans">
            <CalendarDaysIcon className="w-3 h-3" /> Année de Base
          </label>
          {/* BUG #3P1-5 FIX: Gérer le cas où availableYears est vide */}
          <select
            value={assumptions.baseYear || ''}
            onChange={(e) => onUpdateAssumption('baseYear', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm sm:text-base md:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[38px]"
            title="Année de Base\n\nAnnée de référence pour toutes les projections à 5 ans.\n\nSélectionnez l'année qui servira de point de départ:\n• Généralement la dernière année complète\n• Ou l'année estimée N+1 si disponible\n\nToutes les valeurs projetées (EPS, CF, BV, DIV) partiront de cette année.\n\nModifier l'année de base recalcule automatiquement toutes les projections."
          >
            {availableYears.length > 0 ? (
              availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            ) : (
              <option value="">Sélectionner une année</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};