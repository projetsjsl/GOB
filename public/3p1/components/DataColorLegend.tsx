import React, { useState } from 'react';
import { InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export const DataColorLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-3 sm:mb-4 p-3 sm:p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-700">
            Légende des couleurs des données
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Données FMP Vérifiées - VERT */}
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-8 h-8 bg-green-100 border-2 border-green-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-green-700 font-bold text-xs">✓</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 text-sm mb-1">Fond VERT</h4>
                <p className="text-xs text-green-700">
                  <strong>Données FMP vérifiées</strong><br />
                  Données récupérées directement depuis l'API FMP, non modifiées. Ces données sont considérées comme "officielles" et vérifiées.
                </p>
              </div>
            </div>

            {/* Données FMP Ajustées - BLEU */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 border-2 border-blue-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-blue-700 font-bold text-xs">~</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 text-sm mb-1">Fond BLEU</h4>
                <p className="text-xs text-blue-700">
                  <strong>Données FMP ajustées</strong><br />
                  Données provenant de FMP mais ajustées/mergées avec des valeurs existantes. Ces données ne sont pas 100% vérifiées car elles ont été modifiées lors du merge.
                </p>
              </div>
            </div>

            {/* Données Manuelles - ORANGE */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 border-2 border-orange-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-orange-700 font-bold text-xs">✎</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-800 text-sm mb-1">Fond ORANGE</h4>
                <p className="text-xs text-orange-700">
                  <strong>Données manuelles</strong><br />
                  Valeur modifiée manuellement par l'utilisateur. Les modifications manuelles sont préservées lors de la synchronisation.
                </p>
              </div>
            </div>

            {/* Données Calculées - GRIS */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-gray-700 font-bold text-xs">=</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Fond GRIS</h4>
                <p className="text-xs text-gray-700">
                  <strong>Données calculées</strong><br />
                  Valeur calculée automatiquement (ratios P/E, P/CF, P/BV, rendements, etc.). Ces données ne proviennent pas directement de FMP.
                </p>
              </div>
            </div>
          </div>

          {/* Note additionnelle */}
          <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-xs text-blue-800">
              <strong>💡 Note:</strong> Cliquez sur une cellule avec fond vert ou bleu pour la modifier. La modification marquera automatiquement la valeur comme manuelle (fond orange).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
