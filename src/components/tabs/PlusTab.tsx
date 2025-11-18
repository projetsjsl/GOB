import React from 'react';
import type { TabProps } from '../../types';

export const PlusTab: React.FC<TabProps> = (props) => {
    const { isDarkMode = true } = props;

    const handleLogout = () => {
        // Nettoyer toutes les données de session
        sessionStorage.clear();
        localStorage.clear();

        // Rediriger vers la page de login
        window.location.href = '/login.html';
    };

    return (
        <div className="space-y-6">
            <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                isDarkMode
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
            }`}>
                <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    ⚙️ Paramètres & Actions
                </h2>

                <div className="space-y-4">
                    {/* Bouton Déconnexion */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800 border-gray-600'
                            : 'bg-white border-gray-300'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Gestion de Session
                        </h3>
                        <p className={`text-sm mb-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            Déconnectez-vous pour revenir à la page de connexion
                        </p>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                        >
                            <span>🚪</span>
                            <span>Déconnexion</span>
                        </button>
                    </div>

                    {/* Section Fonctionnalités à venir */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800 border-gray-600'
                            : 'bg-white border-gray-300'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Fonctionnalités à venir
                        </h3>
                        <ul className={`list-disc list-inside space-y-1 text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <li>Gestion des préférences utilisateur</li>
                            <li>Configuration des notifications</li>
                            <li>Thème personnalisé</li>
                            <li>Export/Import de configuration</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlusTab;
