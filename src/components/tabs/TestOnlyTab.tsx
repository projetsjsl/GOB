import React from 'react';
import type { TabProps } from '../../types';

const SectionCard: React.FC<{ title: string; points: string[]; tone?: 'green' | 'blue' | 'purple' | 'orange'; isDark: boolean }> = ({
  title,
  points,
  tone = 'blue',
  isDark
}) => {
  const toneClasses: Record<string, string> = {
    green: isDark ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-200',
    blue: isDark ? 'bg-blue-900/40 border-blue-700' : 'bg-blue-50 border-blue-200',
    purple: isDark ? 'bg-purple-900/40 border-purple-700' : 'bg-purple-50 border-purple-200',
    orange: isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'
  };

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${toneClasses[tone]}`}>
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <ul className="space-y-1 text-sm">
        {points.map((p, idx) => (
          <li key={idx} className={isDark ? 'text-gray-200' : 'text-gray-800'}>
            - {p}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TestOnlyTab: React.FC<TabProps> = ({ isDarkMode = true }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Test Only</p>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Plan fonctionnel inspire des sites finance</h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Maquette de fonctionnalites a valider avant integration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Fiche titre (type Yahoo Finance)"
          tone="blue"
          isDark={isDarkMode}
          points={[
            'Resume compact: prix, % jour, 52w range, volume, sector/industry, market cap, dividend.',
            'Sous-vues: Vue valeur (ratios FCF yield, EV/EBIT, ROE/ROIC, marges), Graphique interactif (TradingView), News ciblees ticker.',
            'Bloc "these en 30s" + bull/bear case structure.'
          ]}
        />
        <SectionCard
          title="Screener valeur modernise"
          tone="green"
          isDark={isDarkMode}
          points={[
            'Filtres pre-emballes par style: valeur, dividende, qualite, croissance, momentum.',
            'Colonnes cles: P/E fwd, EV/EBIT, FCF yield, CROIC, marges, score qualite, decote estimee.',
            'Heatmap sectorielle simple (couleur = perf, saturation = decote).'
          ]}
        />
        <SectionCard
          title="Dashboard portefeuille (Passiv/Empower)"
          tone="purple"
          isDark={isDarkMode}
          points={[
            'Top: perf (YTD/1Y/since inception) + risque simple (vol, max drawdown).',
            'Milieu: allocations par classe, secteur, pays; comparaison cible vs reel, bouton "diagnostic value".',
            'Bas: liste titres avec contribution perf/risque, alertes sur concentration et "value traps".'
          ]}
        />
        <SectionCard
          title="UX & pedagogie"
          tone="orange"
          isDark={isDarkMode}
          points={[
            "Theme sombre clair, sections verticales avec ancres; peu d'onglets.",
            'Micro-copy "?" pour ratios (FCF yield, EV/EBIT, ROE/ROIC) orientee investisseur valeur.',
            'Aucune pub/sponsor melange aux donnees; hierarchie forte (these puis details).'
          ]}
        />
      </div>

      <SectionCard
        title="Architecture de donnees (a connecter)"
        tone="blue"
        isDark={isDarkMode}
        points={[
          'Sources: Supabase (scrapes Seeking Alpha), APIs marche (quote/fundamentals/news), cache Supabase daily.',
          'Pipelines: Scraping (Admin JSLai) -> Supabase raw -> Analyse batch (Perplexity) -> seeking_alpha_analysis.',
          'Surface: Fiche titre et Screener consomment les analyses stockees; Portfolio agrege comptes + diagnostics.'
        ]}
      />
    </div>
  );
};

export default TestOnlyTab;
