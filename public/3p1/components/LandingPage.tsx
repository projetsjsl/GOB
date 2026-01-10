import React from 'react';
import {
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
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
          {/* BUG #3P1-1 FIX: Ajout de whitespace-nowrap pour éviter la troncature avec espaces */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
            Analyse Financière
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
              Propulsée par l'IA
            </span>
          </h1>

          {/* Subheadline */}
          {/* BUG #3P1-1 FIX: Ajout de wordBreak normal pour éviter la troncature */}
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
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
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* BUG #3P1-1 FIX: Ajout de wordBreak normal */}
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
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
          {/* BUG #3P1-1 FIX: Ajout de wordBreak normal */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
            Prêt à commencer votre analyse?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
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
