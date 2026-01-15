import React, { useState, useMemo } from 'react';
import { AnnualData, Assumptions, CompanyInfo } from '../types';
import { DataQualityReport } from './DataQualityReport';
import { SanitizationReport } from './SanitizationReport';
import { FullDataVisualization } from './FullDataVisualization';
import { sanitizeAssumptionsSync } from '../utils/validation';
import { DocumentChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ReportsPanelProps {
  data: AnnualData[];
  assumptions: Assumptions;
  info: CompanyInfo;
  isOpen: boolean;
  onClose: () => void;
}

type ReportTab = 'quality' | 'sanitization' | 'full' | 'overview';

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  data,
  assumptions,
  info,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  // Calculer les assumptions sanitisees pour comparaison
  const sanitizedAssumptions = useMemo(() => {
    return sanitizeAssumptionsSync(assumptions);
  }, [assumptions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DocumentChartBarIcon className="w-6 h-6" />
              Rapports Visuels et Analyse de Donnees
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              {info.symbol} - {info.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2"
            title="Fermer les rapports"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
             Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'quality'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
            Qualite des Donnees
          </button>
          <button
            onClick={() => setActiveTab('sanitization')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sanitization'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
            Sanitisation
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'full'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChartBarIcon className="w-4 h-4 inline mr-1" />
            Visualisation Complete
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">Donnees Historiques</h3>
                  <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                  <div className="text-sm text-blue-600">annees de donnees</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">Metriques Valides</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {[assumptions.excludeEPS, assumptions.excludeCF, assumptions.excludeBV, assumptions.excludeDIV]
                      .filter(excluded => !excluded).length} / 4
                  </div>
                  <div className="text-sm text-green-600">metriques incluses</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-2">Corrections</h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(assumptions).filter(key => {
                      const k = key as keyof Assumptions;
                      return typeof assumptions[k] === 'number' && 
                             assumptions[k] !== sanitizedAssumptions[k];
                    }).length}
                  </div>
                  <div className="text-sm text-purple-600">valeurs corrigees</div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Rapports Disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('quality')}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-left transition-colors"
                  >
                    <ExclamationTriangleIcon className="w-8 h-8 text-blue-600 mb-2" />
                    <h4 className="font-bold text-blue-800 mb-1">Qualite des Donnees</h4>
                    <p className="text-sm text-blue-600">
                      Visualise les donnees aberrantes, les exclusions et la qualite des donnees historiques
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('sanitization')}
                    className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-left transition-colors"
                  >
                    <CheckCircleIcon className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-bold text-green-800 mb-1">Rapport de Sanitisation</h4>
                    <p className="text-sm text-green-600">
                      Affiche toutes les corrections automatiques appliquees aux hypotheses
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('full')}
                    className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-left transition-colors"
                  >
                    <ChartBarIcon className="w-8 h-8 text-purple-600 mb-2" />
                    <h4 className="font-bold text-purple-800 mb-1">Visualisation Complete</h4>
                    <p className="text-sm text-purple-600">
                      Graphiques complets de toutes les donnees historiques, ratios et metriques
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <DataQualityReport
              data={data}
              assumptions={assumptions}
              ticker={info.symbol}
            />
          )}

          {activeTab === 'sanitization' && (
            <SanitizationReport
              originalAssumptions={assumptions}
              sanitizedAssumptions={sanitizedAssumptions}
              ticker={info.symbol}
            />
          )}

          {activeTab === 'full' && (
            <FullDataVisualization
              data={data}
              assumptions={assumptions}
              info={info}
            />
          )}
        </div>
      </div>
    </div>
  );
};

