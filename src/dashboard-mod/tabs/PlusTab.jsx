import React from 'react';

// Modular PlusTab: uses global Icon if available
const IconComponent = (typeof window !== 'undefined' && window.Icon) ? window.Icon : () => null;

export const PlusTab = ({ isDarkMode = true, isProfessionalMode = false }) => {
    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login.html';
    };

    return (
        <div className="space-y-6">
            <div
                className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
            >
                <h2
                    className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                    <IconComponent emoji="⚙️" name="Settings" size={24} className="mr-2 inline-block" />
                    Paramètres
                </h2>

                <div className="space-y-4">
                    <div
                        className={`p-4 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <h3
                            className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                            Compte
                        </h3>
                        <p
                            className={`text-sm mb-4 transition-colors durée-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                        >
                            Gérez votre compte et vos préférences
                        </p>
                        <button
                            onClick={handleLogout}
                            className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                isDarkMode
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            } shadow-lg hover:shadow-xl transform hover:scale-105`}
                        >
                            <IconComponent emoji="🚪" name="LogOut" size={20} className="mr-2 inline-block" />
                            Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

