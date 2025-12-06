import React from 'react';
import { 
  CalculatorIcon, 
  ChartBarIcon, 
  TableCellsIcon, 
  ArrowTrendingUpIcon,
  LightBulbIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

export const InfoTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Intro */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <LightBulbIcon className="w-6 h-6 text-yellow-500" />
              Guide d'Utilisation & Méthodologie
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Cette application est un outil d'aide à la décision pour l'investissement fondamental. 
              Elle permet de construire des scénarios de valorisation personnalisés pour chaque société, 
              en projetant les fondamentaux (Bénéfices, Cash Flow, Dividendes) sur un horizon de 5 ans.
            </p>
          </div>
          <a
            href="https://github.com/projetsjsl/GOB/blob/main/docs/3P1_GUIDE_UTILISATION_METHODOLOGIE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap"
            title="Ouvrir le guide complet dans GitHub"
          >
            <BookOpenIcon className="w-5 h-5" />
            Guide Complet
          </a>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>📘 Guide Complet Disponible :</strong> Un guide détaillé avec toutes les formules, 
            méthodologies, sources de données et un exemple step-by-step complet (analyse d'Apple - AAPL) 
            est disponible. Cliquez sur le bouton ci-dessus pour l'ouvrir dans GitHub.
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Le guide inclut : Sources des données FMP et ValueLine, formules de calcul détaillées, 
            méthodologie JPEGY et Ratio 3:1, guide step-by-step avec exemple AAPL, bonnes pratiques et FAQ.
          </p>
        </div>
      </div>

      {/* Section 1: Données Historiques */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TableCellsIcon className="w-6 h-6 text-blue-500" />
          1. Saisie des Données Historiques
        </h3>
        <div className="space-y-3 text-gray-600 text-sm">
          <p>
            L'analyse commence par la fiabilité des données. Le tableau historique est <strong>entièrement éditable</strong>.
            Il sert de base pour comprendre la tendance passée de l'entreprise.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Ajustement manuel :</strong> Vous pouvez corriger ou compléter les données (Prix, EPS, Cash Flow...) si les données automatiques sont incomplètes.</li>
            <li><strong>Cohérence :</strong> Les ratios (P/E, Yield, P/BV) sont recalculés instantanément pour vous permettre de juger de leur cohérence historique.</li>
            <li><strong>Année de Base :</strong> Sélectionnez l'année de référence (souvent l'année en cours ou l'estimé N+1) dans l'en-tête pour ancrer vos projections.</li>
          </ul>
        </div>
      </div>

      {/* Section 2: Graphiques */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-indigo-500" />
          2. Interprétation Visuelle
        </h3>
        <div className="space-y-3 text-gray-600 text-sm">
          <p>
            <strong>Jauge de Valorisation :</strong> Elle situe le prix actuel par rapport à votre propre zone d'achat calculée.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La zone <span className="text-green-600 font-bold">ACHAT</span> est définie dynamiquement (par défaut sous le prix plancher + 40% de l'écart vers la cible).</li>
            <li>La recommandation (Achat/Conserver/Vente) s'adapte automatiquement selon vos hypothèses de prix cible.</li>
          </ul>
          <p className="mt-2">
            <strong>Graphique des Ratios :</strong> Vérifiez si vos multiples cibles (Target P/E, Target P/CF) sont réalistes par rapport à l'histoire de l'action (moyenne des 5-10 dernières années).
          </p>
        </div>
      </div>

      {/* Section 3: Calculs & Projections */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CalculatorIcon className="w-6 h-6 text-blue-600" />
          3. Méthodologie de Projection (Rendement Total)
        </h3>
        <div className="space-y-4 text-gray-600 text-sm">
          <p>
            Le cœur de l'analyse réside dans la <strong>"Triangulation de la Valeur"</strong>. 
            Plutôt que de se fier à un seul ratio, nous calculons une valeur cible moyenne basée sur 4 piliers fondamentaux.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">A. Vos Hypothèses (Inputs)</h4>
              <p className="text-xs mb-2 italic">Pour chaque métrique, définissez un taux de croissance annuel et un ratio de valorisation cible à 5 ans.</p>
              <ul className="space-y-2 text-xs">
                <li><strong>BPA (Earnings) :</strong> Croissance des profits & P/E attendu.</li>
                <li><strong>Cash Flow :</strong> Génération de cash & P/CF attendu.</li>
                <li><strong>Book Value :</strong> Actif net par action & P/BV attendu.</li>
                <li><strong>Dividende :</strong> Croissance du dividende & Rendement (Yield) attendu.</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">B. Résultat : Rendement Total</h4>
              <p className="mb-2 text-xs">
                Le pourcentage affiché en vert ("Rendement Total Potentiel") est spécifique aux données de l'entreprise analysée.
              </p>
              <div className="bg-white p-2 rounded border border-gray-200 font-mono text-xs mb-2">
                Rendement = ((PrixCibleMoyen + DivCumulés) - PrixActuel) / PrixActuel
              </div>
              <p className="text-xs">
                Ce chiffre combine l'appréciation potentielle du capital (gain en prix) ET le retour sur investissement via les dividendes perçus sur la période.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Raccourcis */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" />
          4. Fonctionnalités Pratiques
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
          <li><strong>Gestion Multi-Dossiers :</strong> Créez, dupliquez ou supprimez des fiches via le menu latéral pour comparer différents scénarios (ex: "AAPL Optimiste" vs "AAPL Pessimiste").</li>
          <li><strong>Sauvegarde :</strong> Vos analyses sont sauvegardées automatiquement dans votre navigateur.</li>
          <li><strong>Sync API :</strong> Utilisez le bouton de synchronisation pour récupérer les derniers états financiers disponibles (nécessite une clé API FMP/Finnhub optionnelle).</li>
        </ul>
      </div>

    </div>
  );
};