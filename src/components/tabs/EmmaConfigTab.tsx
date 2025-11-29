import React from 'react';
import type { TabProps } from '../../types';

const EmmaConfigTab: React.FC<TabProps> = ({ isDarkMode = true }) => {
  const links = [
    { href: '/emma-config.html', label: 'Configurer Emma (classique)' }
  ];

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">🛠️ Emma Config</h2>
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Prompts & paramètres d'Emma IA
        </span>
      </div>

      <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Ouvrez la page de configuration pour gérer les prompts, paramètres et sauvegardes d'Emma.
        Les pages s'ouvrent dans un nouvel onglet.
      </p>

      <div className="flex flex-wrap gap-3">
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Astuce : gardez cet onglet ouvert pendant que vous ajustez vos prompts dans la page config pour tester en direct.
      </div>
    </div>
  );
};

export default EmmaConfigTab;
