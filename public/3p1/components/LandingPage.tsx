import React from 'react';
import {
  ChartBarIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-2xl">
              <SparklesIcon className="w-8 h-8" />
              <span className="text-3xl font-bold">3P1</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Analyse Financière
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Propulsée par l'IA
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Prenez des décisions d'investissement éclairées avec notre plateforme professionnelle d'analyse de valorisation
          </p>

          {/* CTA Button */}
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <span>Commencer l'analyse</span>
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Social Proof */}
          <p className="mt-6 text-sm text-slate-400">
            ✓ Données en temps réel · ✓ Analyses professionnelles · ✓ Gratuit pour commencer
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <ChartBarIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analyse DCF</h3>
            <p className="text-slate-400">
              Valorisation par flux de trésorerie actualisés avec modèles personnalisables
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 hover:border-purple-500 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <CalculatorIcon className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Scénarios Multiples</h3>
            <p className="text-slate-400">
              Créez et comparez différents scénarios de valorisation (optimiste, pessimiste, base)
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 hover:border-green-500 transition-colors">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Données Temps Réel</h3>
            <p className="text-slate-400">
              Données financières actualisées depuis Financial Modeling Prep et Supabase
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 hover:border-yellow-500 transition-colors">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
              <ClockIcon className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Historique 20 Ans</h3>
            <p className="text-slate-400">
              Analysez les tendances historiques avec jusqu'à 20 ans de données financières
            </p>
          </div>
        </div>
      </div>

      {/* Key Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Pourquoi choisir 3P1?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Benefit 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BoltIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Rapide et Intuitif</h3>
            <p className="text-slate-400">
              Interface moderne et épurée pour une analyse efficace sans courbe d'apprentissage
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Fiable et Précis</h3>
            <p className="text-slate-400">
              Sources de données professionnelles avec validation automatique des métriques
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Personnalisable</h3>
            <p className="text-slate-400">
              Ajustez tous les paramètres pour créer vos propres modèles de valorisation
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Comment ça fonctionne
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3 mt-2">Recherchez un ticker</h3>
              <p className="text-slate-400">
                Entrez le symbole boursier de la compagnie que vous souhaitez analyser
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3 mt-2">Analysez les données</h3>
              <p className="text-slate-400">
                Explorez les métriques financières, ratios et tendances historiques
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3 mt-2">Prenez vos décisions</h3>
              <p className="text-slate-400">
                Utilisez les valorisations calculées pour guider vos investissements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à commencer votre analyse?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Accédez instantanément à notre plateforme d'analyse professionnelle
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center space-x-3 bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <span>Lancer l'application</span>
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800">
        <p className="text-center text-slate-500 text-sm">
          © 2025 3P1 - Plateforme d'analyse financière professionnelle
        </p>
      </div>
    </div>
  );
};
