import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export const DataSourcesInfo: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm border border-blue-200 mt-8">
            <div className="flex items-start gap-3 mb-4">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <h3 className="text-lg font-bold text-gray-800">
                    📊 Sources des Données et Méthodologie de Calcul
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Données Historiques */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Données Officielles (Vert)
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1.5">
                        <li><strong>Source :</strong> Financial Modeling Prep (FMP) API</li>
                        <li><strong>BPA (EPS) :</strong> Bénéfice net par action (données annuelles auditées)</li>
                        <li><strong>CFA (Cash Flow) :</strong> Flux de trésorerie opérationnel par action</li>
                        <li><strong>BV (Book Value) :</strong> Valeur comptable par action</li>
                        <li><strong>DIV (Dividende) :</strong> Somme des dividendes versés par année fiscale</li>
                        <li><strong>Prix Haut/Bas :</strong> Prix maximum et minimum observés durant l'année</li>
                    </ul>
                </div>

                {/* Projections et Hypothèses */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        Projections Basées sur Hypothèses (Orange)
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1.5">
                        <li><strong>Taux de Croissance :</strong> CAGR calculé sur l'historique disponible (plafonné à 0-20%)</li>
                        <li><strong>Ratios Cibles :</strong> Moyenne historique des ratios P/E, P/CF, P/BV (filtrage des valeurs aberrantes)</li>
                        <li><strong>Rendement Cible :</strong> Moyenne historique du rendement en dividendes</li>
                        <li><strong>Valeurs Projetées (5 ans) :</strong> Calculées avec la formule : <code className="bg-gray-100 px-1 rounded">Valeur × (1 + Taux)^5</code></li>
                        <li><strong>Prix Cible :</strong> Valeur projetée × Ratio cible (ex: EPS projeté × P/E cible)</li>
                    </ul>
                </div>
            </div>

            {/* Formules Clés */}
            <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
                <h4 className="font-bold text-indigo-700 mb-2">🧮 Formules de Calcul</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                        <strong>CAGR (Taux de Croissance Annuel Composé) :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            ((Valeur Finale / Valeur Initiale)^(1/Années)) - 1
                        </code>
                    </div>
                    <div>
                        <strong>Prix Cible (Méthode P/E) :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            BPA Projeté (An 5) × P/E Cible
                        </code>
                    </div>
                    <div>
                        <strong>Prix Cible (Méthode Dividende) :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            Dividende Projeté (An 5) / (Rendement Cible / 100)
                        </code>
                    </div>
                    <div>
                        <strong>Rendement Potentiel Total :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            ((Prix Cible Moyen / Prix Actuel) - 1) × 100
                        </code>
                    </div>
                </div>
            </div>

            {/* Avertissement */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
                <p className="text-xs text-yellow-800">
                    <strong>⚠️ Avertissement :</strong> Les projections sont basées sur des hypothèses et l'historique.
                    Elles ne constituent pas une garantie de performance future. Les données en <span className="text-orange-600 font-semibold">orange</span> sont
                    des estimations calculées automatiquement et doivent être ajustées selon votre analyse personnelle.
                </p>
            </div>
        </div>
    );
};
