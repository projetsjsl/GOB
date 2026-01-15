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
              Guide d'Utilisation & Methodologie
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Cette application est un outil d'aide a la decision pour l'investissement fondamental. 
              Elle permet de construire des scenarios de valorisation personnalises pour chaque societe, 
              en projetant les fondamentaux (Benefices, Cash Flow, Dividendes) sur un horizon de 5 ans.
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
            <strong> Guide Complet Disponible :</strong> Un guide detaille avec toutes les formules, 
            methodologies, sources de donnees et un exemple step-by-step complet (analyse d'Apple - AAPL) 
            est disponible. Cliquez sur le bouton ci-dessus pour l'ouvrir dans GitHub.
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Le guide inclut : Sources des donnees FMP et ValueLine, formules de calcul detaillees, 
            methodologie JPEGY et Ratio 3:1, guide step-by-step avec exemple AAPL, bonnes pratiques et FAQ.
          </p>
        </div>
      </div>

      {/* Section 1: Donnees Historiques */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TableCellsIcon className="w-6 h-6 text-blue-500" />
          1. Saisie des Donnees Historiques
        </h3>
        <div className="space-y-3 text-gray-600 text-sm">
          <p>
            L'analyse commence par la fiabilite des donnees. Le tableau historique est <strong>entierement editable</strong>.
            Il sert de base pour comprendre la tendance passee de l'entreprise.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Ajustement manuel :</strong> Vous pouvez corriger ou completer les donnees (Prix, EPS, Cash Flow...) si les donnees automatiques sont incompletes.</li>
            <li><strong>Coherence :</strong> Les ratios (P/E, Yield, P/BV) sont recalcules instantanement pour vous permettre de juger de leur coherence historique.</li>
            <li><strong>Annee de Base :</strong> Selectionnez l'annee de reference (souvent l'annee en cours ou l'estime N+1) dans l'en-tete pour ancrer vos projections.</li>
          </ul>
        </div>
      </div>

      {/* Section 2: Graphiques */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-indigo-500" />
          2. Interpretation Visuelle
        </h3>
        <div className="space-y-3 text-gray-600 text-sm">
          <p>
            <strong>Jauge de Valorisation :</strong> Elle situe le prix actuel par rapport a votre propre zone d'achat calculee.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La zone <span className="text-green-600 font-bold">ACHAT</span> est definie dynamiquement (par defaut sous le prix plancher + 40% de l'ecart vers la cible).</li>
            <li>La recommandation (Achat/Conserver/Vente) s'adapte automatiquement selon vos hypotheses de prix cible.</li>
          </ul>
          <p className="mt-2">
            <strong>Graphique des Ratios :</strong> Verifiez si vos multiples cibles (Target P/E, Target P/CF) sont realistes par rapport a l'histoire de l'action (moyenne des 5-10 dernieres annees).
          </p>
        </div>
      </div>

      {/* Section 3: Calculs & Projections */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CalculatorIcon className="w-6 h-6 text-blue-600" />
          3. Methodologie de Projection (Rendement Total)
        </h3>
        <div className="space-y-4 text-gray-600 text-sm">
          <p>
            Le cur de l'analyse reside dans la <strong>"Triangulation de la Valeur"</strong>. 
            Plutot que de se fier a un seul ratio, nous calculons une valeur cible moyenne basee sur 4 piliers fondamentaux.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">A. Vos Hypotheses (Inputs)</h4>
              <p className="text-xs mb-2 italic">Pour chaque metrique, definissez un taux de croissance annuel et un ratio de valorisation cible a 5 ans.</p>
              <ul className="space-y-2 text-xs">
                <li><strong>BPA (Earnings) :</strong> Croissance des profits & P/E attendu.</li>
                <li><strong>Cash Flow :</strong> Generation de cash & P/CF attendu.</li>
                <li><strong>Book Value :</strong> Actif net par action & P/BV attendu.</li>
                <li><strong>Dividende :</strong> Croissance du dividende & Rendement (Yield) attendu.</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">B. Resultat : Rendement Total</h4>
              <p className="mb-2 text-xs">
                Le pourcentage affiche en vert ("Rendement Total Potentiel") est specifique aux donnees de l'entreprise analysee.
              </p>
              <div className="bg-white p-2 rounded border border-gray-200 font-mono text-xs mb-2">
                Rendement = ((PrixCibleMoyen + DivCumules) - PrixActuel) / PrixActuel
              </div>
              <p className="text-xs">
                Ce chiffre combine l'appreciation potentielle du capital (gain en prix) ET le retour sur investissement via les dividendes percus sur la periode.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Raccourcis */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" />
          4. Fonctionnalites Pratiques
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
          <li><strong>Gestion Multi-Dossiers :</strong> Creez, dupliquez ou supprimez des fiches via le menu lateral pour comparer differents scenarios (ex: "AAPL Optimiste" vs "AAPL Pessimiste").</li>
          <li><strong>Sauvegarde :</strong> Vos analyses sont sauvegardees automatiquement dans votre navigateur.</li>
          <li><strong>Sync API :</strong> Utilisez le bouton de synchronisation pour recuperer les derniers etats financiers disponibles (necessite une cle API FMP/Finnhub optionnelle).</li>
        </ul>
      </div>

    </div>
  );
};