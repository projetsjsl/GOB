import React, { useMemo } from 'react';
import { Assumptions } from '../types';
import { sanitizeAssumptionsSync } from '../utils/validation';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatPercent, formatCurrency } from '../utils/calculations';

interface SanitizationReportProps {
  originalAssumptions: Assumptions;
  sanitizedAssumptions: Assumptions;
  ticker: string;
}

interface SanitizationChange {
  field: string;
  label: string;
  original: number;
  sanitized: number;
  change: number;
  changePercent: number;
  reason: string;
  category: 'growth' | 'ratio' | 'price' | 'other';
}

export const SanitizationReport: React.FC<SanitizationReportProps> = ({ 
  originalAssumptions, 
  sanitizedAssumptions, 
  ticker 
}) => {
  // Analyser les changements
  const changes = useMemo(() => {
    const changesList: SanitizationChange[] = [];

    const compareField = (
      field: keyof Assumptions,
      label: string,
      category: 'growth' | 'ratio' | 'price' | 'other',
      original: number,
      sanitized: number
    ) => {
      if (original !== sanitized) {
        const change = sanitized - original;
        const changePercent = original !== 0 ? (change / original) * 100 : 0;
        
        let reason = '';
        if (category === 'growth') {
          if (original < -20) reason = 'Croissance negative trop extreme (< -20%)';
          else if (original > 20) reason = 'Croissance trop elevee (> 20%)';
          else reason = 'Valeur hors limites de validation';
        } else if (category === 'ratio') {
          if (original < 0) reason = 'Ratio negatif invalide';
          else if (original > 100) reason = 'Ratio trop eleve (> 100x)';
          else reason = 'Valeur hors limites de validation';
        } else if (category === 'price') {
          if (original <= 0) reason = 'Prix invalide (<= 0)';
          else reason = 'Valeur corrigee par validation';
        } else {
          reason = 'Valeur sanitisee selon les parametres de validation';
        }

        changesList.push({
          field,
          label,
          original,
          sanitized,
          change,
          changePercent,
          reason,
          category
        });
      }
    };

    // Comparer tous les champs numeriques
    compareField('growthRateEPS', 'Croissance EPS', 'growth', originalAssumptions.growthRateEPS || 0, sanitizedAssumptions.growthRateEPS || 0);
    compareField('growthRateSales', 'Croissance Ventes', 'growth', originalAssumptions.growthRateSales || 0, sanitizedAssumptions.growthRateSales || 0);
    compareField('growthRateCF', 'Croissance CF', 'growth', originalAssumptions.growthRateCF || 0, sanitizedAssumptions.growthRateCF || 0);
    compareField('growthRateBV', 'Croissance BV', 'growth', originalAssumptions.growthRateBV || 0, sanitizedAssumptions.growthRateBV || 0);
    compareField('growthRateDiv', 'Croissance DIV', 'growth', originalAssumptions.growthRateDiv || 0, sanitizedAssumptions.growthRateDiv || 0);
    
    compareField('targetPE', 'P/E Cible', 'ratio', originalAssumptions.targetPE || 0, sanitizedAssumptions.targetPE || 0);
    compareField('targetPCF', 'P/CF Cible', 'ratio', originalAssumptions.targetPCF || 0, sanitizedAssumptions.targetPCF || 0);
    compareField('targetPBV', 'P/BV Cible', 'ratio', originalAssumptions.targetPBV || 0, sanitizedAssumptions.targetPBV || 0);
    compareField('targetYield', 'Yield Cible', 'ratio', originalAssumptions.targetYield || 0, sanitizedAssumptions.targetYield || 0);
    compareField('requiredReturn', 'Rendement Requis', 'ratio', originalAssumptions.requiredReturn || 0, sanitizedAssumptions.requiredReturn || 0);
    compareField('dividendPayoutRatio', 'Payout Ratio', 'ratio', originalAssumptions.dividendPayoutRatio || 0, sanitizedAssumptions.dividendPayoutRatio || 0);
    
    compareField('currentPrice', 'Prix Actuel', 'price', originalAssumptions.currentPrice || 0, sanitizedAssumptions.currentPrice || 0);
    compareField('currentDividend', 'Dividende Actuel', 'price', originalAssumptions.currentDividend || 0, sanitizedAssumptions.currentDividend || 0);

    return changesList;
  }, [originalAssumptions, sanitizedAssumptions]);

  // Preparer les donnees pour le graphique
  const chartData = useMemo(() => {
    return changes.map(change => ({
      field: change.label,
      original: change.original,
      sanitized: change.sanitized,
      change: Math.abs(change.change),
      category: change.category
    }));
  }, [changes]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'growth': return '#3b82f6';
      case 'ratio': return '#10b981';
      case 'price': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckCircleIcon className="w-6 h-6" />
          Rapport de Sanitisation - {ticker}
        </h2>
        <p className="text-purple-100 text-sm mt-1">
          Visualisation des corrections automatiques appliquees aux hypotheses
        </p>
      </div>

      {/* Resume */}
      {changes.length === 0 ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-green-800 mb-2">Aucune correction necessaire</h3>
          <p className="text-green-600">Toutes les hypotheses sont dans les limites de validation acceptables.</p>
        </div>
      ) : (
        <>
          {/* Graphique de comparaison */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-purple-600" />
              Comparaison Avant/Apres Sanitisation
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="field" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="original" fill="#ef4444" name="Valeur Originale" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sanitized" fill="#10b981" name="Valeur Sanitisee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau detaille des changements */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Details des Corrections ({changes.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Parametre</th>
                    <th className="p-3 text-right">Valeur Originale</th>
                    <th className="p-3 text-center">-></th>
                    <th className="p-3 text-right">Valeur Sanitisee</th>
                    <th className="p-3 text-right">Changement</th>
                    <th className="p-3 text-right">Changement %</th>
                    <th className="p-3 text-left">Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {changes.map((change, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(change.category) }}
                          ></div>
                          {change.label}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-red-600 font-bold">
                          {change.category === 'growth' || change.category === 'ratio' 
                            ? formatPercent(change.original)
                            : formatCurrency(change.original)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <ArrowRightIcon className="w-5 h-5 text-gray-400 mx-auto" />
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-green-600 font-bold">
                          {change.category === 'growth' || change.category === 'ratio'
                            ? formatPercent(change.sanitized)
                            : formatCurrency(change.sanitized)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={change.change > 0 ? 'text-green-600' : 'text-red-600'}>
                          {change.change > 0 ? '+' : ''}
                          {change.category === 'growth' || change.category === 'ratio'
                            ? formatPercent(change.change)
                            : formatCurrency(change.change)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={change.changePercent > 0 ? 'text-green-600' : 'text-red-600'}>
                          {change.changePercent > 0 ? '+' : ''}
                          {formatPercent(change.changePercent)}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{change.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistiques par categorie */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-semibold mb-1">Croissance</div>
              <div className="text-2xl font-bold text-blue-800">
                {changes.filter(c => c.category === 'growth').length}
              </div>
              <div className="text-xs text-blue-600 mt-1">corrections</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-semibold mb-1">Ratios</div>
              <div className="text-2xl font-bold text-green-800">
                {changes.filter(c => c.category === 'ratio').length}
              </div>
              <div className="text-xs text-green-600 mt-1">corrections</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-semibold mb-1">Prix</div>
              <div className="text-2xl font-bold text-yellow-800">
                {changes.filter(c => c.category === 'price').length}
              </div>
              <div className="text-xs text-yellow-600 mt-1">corrections</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-semibold mb-1">Total</div>
              <div className="text-2xl font-bold text-purple-800">{changes.length}</div>
              <div className="text-xs text-purple-600 mt-1">corrections</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

