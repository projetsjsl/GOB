import React, { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface HelpTooltipProps {
    title: string;
    children: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                type="button"
            >
                <InformationCircleIcon className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Tooltip */}
                    <div className="absolute z-50 w-96 p-4 bg-white rounded-lg shadow-2xl border-2 border-blue-500 top-0 left-8">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{title}</h4>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                            {children}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

interface CalculationExplanationProps {
    metric: 'CAGR' | 'PE' | 'PCF' | 'YIELD' | 'TARGET_PRICE';
    values?: {
        start?: number;
        end?: number;
        years?: number;
        ratio?: number;
        projected?: number;
    };
}

export const CalculationExplanation: React.FC<CalculationExplanationProps> = ({ metric, values }) => {
    const explanations = {
        CAGR: {
            title: 'Taux de Croissance Annuel Compose (CAGR)',
            content: (
                <>
                    <p className="mb-2">Le CAGR represente le taux de croissance annuel moyen sur une periode donnee.</p>
                    <div className="bg-gray-100 p-3 rounded mb-2 font-mono text-xs">
                        CAGR = ((Valeur Finale / Valeur Initiale)^(1/Annees)) - 1
                    </div>
                    {values && (
                        <div className="bg-blue-50 p-3 rounded text-xs">
                            <p><strong>Calcul :</strong></p>
                            <p>= (({values.end?.toFixed(2)} / {values.start?.toFixed(2)})^(1/{values.years})) - 1</p>
                            <p>= {((Math.pow((values.end || 0) / (values.start || 1), 1 / (values.years || 1)) - 1) * 100).toFixed(2)}%</p>
                        </div>
                    )}
                    <p className="mt-2 text-xs text-gray-600">
                        <strong>Note :</strong> Le CAGR est plafonne entre 0% et 20% pour eviter les projections irrealistes.
                    </p>
                </>
            )
        },
        PE: {
            title: 'Ratio P/E Cible',
            content: (
                <>
                    <p className="mb-2">Le ratio P/E (Price-to-Earnings) cible est la moyenne historique des ratios P/E.</p>
                    <div className="bg-gray-100 p-3 rounded mb-2 font-mono text-xs">
                        P/E = Prix / Benefice par Action (BPA)
                    </div>
                    <p className="mb-2">Le P/E cible est calcule en faisant la moyenne des ratios P/E historiques (haut et bas) de toutes les annees disponibles.</p>
                    <p className="text-xs text-gray-600">
                        <strong>Filtrage :</strong> Les valeurs infinies ou negatives sont exclues du calcul.
                    </p>
                </>
            )
        },
        PCF: {
            title: 'Ratio P/CF Cible',
            content: (
                <>
                    <p className="mb-2">Le ratio P/CF (Price-to-Cash Flow) cible est la moyenne historique des ratios P/CF.</p>
                    <div className="bg-gray-100 p-3 rounded mb-2 font-mono text-xs">
                        P/CF = Prix / Cash Flow par Action
                    </div>
                    <p className="mb-2">Le P/CF cible est calcule en faisant la moyenne des ratios P/CF historiques de toutes les annees disponibles.</p>
                    <p className="text-xs text-gray-600">
                        <strong>Avantage :</strong> Le cash flow est plus difficile a manipuler que le benefice net.
                    </p>
                </>
            )
        },
        YIELD: {
            title: 'Rendement en Dividendes Cible',
            content: (
                <>
                    <p className="mb-2">Le rendement cible est la moyenne historique du rendement en dividendes.</p>
                    <div className="bg-gray-100 p-3 rounded mb-2 font-mono text-xs">
                        Rendement = (Dividende / Prix) x 100
                    </div>
                    <p className="mb-2">Utilise pour calculer le prix cible base sur les dividendes projetes.</p>
                    <div className="bg-blue-50 p-3 rounded text-xs">
                        <p><strong>Prix Cible (DIV) :</strong></p>
                        <p>= Dividende Projete / (Rendement Cible / 100)</p>
                    </div>
                </>
            )
        },
        TARGET_PRICE: {
            title: 'Prix Cible - Methodologie',
            content: (
                <>
                    <p className="mb-2">Le prix cible est calcule selon 3 methodes differentes :</p>

                    <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded">
                            <p className="font-semibold text-green-800 mb-1">1. Methode P/E</p>
                            <div className="font-mono text-xs">
                                Prix = BPA Projete (An 5) x P/E Cible
                            </div>
                            {values && (
                                <p className="text-xs mt-1">
                                    = {values.projected?.toFixed(2)} x {values.ratio?.toFixed(1)} = ${((values.projected || 0) * (values.ratio || 0)).toFixed(2)}
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                            <p className="font-semibold text-blue-800 mb-1">2. Methode P/CF</p>
                            <div className="font-mono text-xs">
                                Prix = CF Projete (An 5) x P/CF Cible
                            </div>
                        </div>

                        <div className="bg-purple-50 p-3 rounded">
                            <p className="font-semibold text-purple-800 mb-1">3. Methode Dividende</p>
                            <div className="font-mono text-xs">
                                Prix = DIV Projete (An 5) / (Rendement % / 100)
                            </div>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-600">
                        <strong>Prix Cible Final :</strong> Moyenne des 3 methodes (ou mediane pour plus de robustesse).
                    </p>
                </>
            )
        }
    };

    const { title, content } = explanations[metric];

    return (
        <HelpTooltip title={title}>
            {content}
        </HelpTooltip>
    );
};
