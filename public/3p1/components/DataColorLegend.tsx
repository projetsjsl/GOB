import React, { useState } from 'react';
import { InformationCircleIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
            Legende des couleurs des donnees
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
            {/* Donnees FMP Verifiees - VERT */}
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-8 h-8 bg-green-100 border-2 border-green-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-green-700 font-bold text-xs"></span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 text-sm mb-1">Fond VERT</h4>
                <p className="text-xs text-green-700">
                  <strong>Donnees FMP verifiees</strong><br />
                  Donnees recuperees directement depuis l'API FMP, non modifiees. Ces donnees sont considerees comme "officielles" et verifiees.
                </p>
              </div>
            </div>

            {/* Donnees FMP Ajustees - BLEU */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 border-2 border-blue-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-blue-700 font-bold text-xs">~</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 text-sm mb-1">Fond BLEU</h4>
                <p className="text-xs text-blue-700">
                  <strong>Donnees FMP ajustees</strong><br />
                  Donnees provenant de FMP mais mergees avec des valeurs existantes (Supabase ou manuelles). Apparait quand FMP retourne des valeurs a 0 ou quand des donnees existantes sont preservees. <strong>Pour avoir uniquement du VERT, synchronisez depuis FMP sans donnees existantes a preserver.</strong>
                </p>
              </div>
            </div>

            {/* Donnees Manuelles - ORANGE */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 border-2 border-orange-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-orange-700 font-bold text-xs"></span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-800 text-sm mb-1">Fond ORANGE</h4>
                <p className="text-xs text-orange-700">
                  <strong>Donnees manuelles</strong><br />
                  Valeur modifiee manuellement par l'utilisateur. Les modifications manuelles sont preservees lors de la synchronisation.
                </p>
              </div>
            </div>

            {/* Donnees Calculees - GRIS */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-400 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-gray-700 font-bold text-xs">=</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Fond GRIS</h4>
                <p className="text-xs text-gray-700">
                  <strong>Donnees calculees</strong><br />
                  Valeur calculee automatiquement (ratios P/E, P/CF, P/BV, rendements, etc.). Ces donnees ne proviennent pas directement de FMP.
                </p>
              </div>
            </div>

            {/* Valeurs Aberrantes - ROUGE */}
            <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-400 border-dashed rounded-lg">
              <div className="w-8 h-8 bg-red-100 border-2 border-red-500 rounded flex-shrink-0 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 text-sm mb-1">Fond ROUGE (Bordure pointillee)</h4>
                <p className="text-xs text-red-700">
                  <strong>Valeurs aberrantes detectees</strong><br />
                  Valeur significativement differente de la moyenne historique (&gt; 2 ecarts-types). Peut indiquer une erreur de donnees, un evenement exceptionnel, ou des donnees incompletes. Verifiez et corrigez si necessaire.
                </p>
              </div>
            </div>
          </div>

          {/* Note additionnelle */}
          <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-xs text-blue-800">
              <strong> Note:</strong> Cliquez sur une cellule avec fond vert ou bleu pour la modifier. La modification marquera automatiquement la valeur comme manuelle (fond orange).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
