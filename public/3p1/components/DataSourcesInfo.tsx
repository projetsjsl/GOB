import React from 'react';
import { InformationCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export const DataSourcesInfo: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm border border-blue-200 mt-8">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <h3 className="text-lg font-bold text-gray-800">
                         Sources des Donnees et Methodologie de Calcul
                    </h3>
                </div>
                <a
                    href="https://github.com/projetsjsl/GOB/blob/main/docs/3P1_GUIDE_UTILISATION_METHODOLOGIE.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    title="Ouvrir le guide complet dans GitHub"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Guide Complet
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Donnees Historiques */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Donnees Officielles (Vert)
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1.5">
                        <li><strong>Source :</strong> Financial Modeling Prep (FMP) API</li>
                        <li><strong>BPA (EPS) :</strong> Benefice net par action (donnees annuelles auditees)</li>
                        <li><strong>CFA (Cash Flow) :</strong> Flux de tresorerie operationnel par action</li>
                        <li><strong>BV (Book Value) :</strong> Valeur comptable par action</li>
                        <li><strong>DIV (Dividende) :</strong> Somme des dividendes verses par annee fiscale</li>
                        <li><strong>Prix Haut/Bas :</strong> Prix maximum et minimum observes durant l'annee</li>
                    </ul>
                </div>

                {/* Projections et Hypotheses */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        Projections Basees sur Hypotheses (Orange)
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1.5">
                        <li><strong>Taux de Croissance :</strong> CAGR calcule sur l'historique disponible (plafonne a 0-20%)</li>
                        <li><strong>Ratios Cibles :</strong> Moyenne historique des ratios P/E, P/CF, P/BV (filtrage des valeurs aberrantes)</li>
                        <li><strong>Rendement Cible :</strong> Moyenne historique du rendement en dividendes</li>
                        <li><strong>Valeurs Projetees (5 ans) :</strong> Calculees avec la formule : <code className="bg-gray-100 px-1 rounded">Valeur x (1 + Taux)^5</code></li>
                        <li><strong>Prix Cible :</strong> Valeur projetee x Ratio cible (ex: EPS projete x P/E cible)</li>
                    </ul>
                </div>
            </div>

            {/* Formules Cles */}
            <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
                <h4 className="font-bold text-indigo-700 mb-2"> Formules de Calcul</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                        <strong>CAGR (Taux de Croissance Annuel Compose) :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            ((Valeur Finale / Valeur Initiale)^(1/Annees)) - 1
                        </code>
                    </div>
                    <div>
                        <strong>Prix Cible (Methode P/E) :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            BPA Projete (An 5) x P/E Cible
                        </code>
                    </div>
                    <div>
                        <strong>Prix Cible (Methode Dividende) :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            Dividende Projete (An 5) / (Rendement Cible / 100)
                        </code>
                    </div>
                    <div>
                        <strong>Rendement Potentiel Total :</strong>
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                            ((Prix Cible Moyen / Prix Actuel) - 1) x 100
                        </code>
                    </div>
                </div>
            </div>

            {/* Avertissement */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
                <p className="text-xs text-yellow-800">
                    <strong> Avertissement :</strong> Les projections sont basees sur des hypotheses et l'historique.
                    Elles ne constituent pas une garantie de performance future. Les donnees en <span className="text-orange-600 font-semibold">orange</span> sont
                    des estimations calculees automatiquement et doivent etre ajustees selon votre analyse personnelle.
                </p>
            </div>
        </div>
    );
};
