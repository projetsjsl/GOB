
import React from 'react';
import { PersonalityAnalysis } from '../types';
import { Activity, BrainCircuit, TrendingUp, UserCheck, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface PersonalityPanelProps {
  data: PersonalityAnalysis | null;
  isLoading: boolean;
}

export const PersonalityPanel: React.FC<PersonalityPanelProps> = ({ data, isLoading }) => {
  if (!data) return null;

  // Determine colors based on risk
  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score < 60) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score < 80) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const riskStyle = getRiskColor(data.riskScore);

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border-l border-slate-700 w-80 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <BrainCircuit className="w-4 h-4 text-purple-500" />
          Perception IA
        </h3>
        <p className="text-[10px] text-slate-500 font-mono mt-1">
          ANALYSE PSYCHOLOGIQUE TEMPS RÉEL
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Summary Card */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <UserCheck className="w-12 h-12" />
            </div>
            <div className="text-xs text-slate-400 mb-2 font-medium uppercase">Observation Globale</div>
            <p className="text-sm text-slate-200 italic leading-relaxed">
               "{data.summary}"
            </p>
            {isLoading && (
               <div className="absolute bottom-1 right-2">
                 <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                 </span>
               </div>
            )}
        </div>

        {/* Risk Profile */}
        <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-medium text-slate-400">Profil de Risque</label>
                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded border", riskStyle)}>
                    {data.riskProfile.toUpperCase()}
                </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000 ease-out"
                    style={{ width: `${data.riskScore}%` }}
                />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-mono">
                <span>CONSERVATEUR</span>
                <span>AUDACIEUX</span>
            </div>
        </div>

        {/* Emotional State */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                 <div className="text-[10px] text-slate-500 uppercase mb-1">État Émotionnel</div>
                 <div className="text-sm font-semibold text-white flex items-center gap-2">
                     <Activity className="w-3 h-3 text-pink-500" />
                     {data.emotionalState}
                 </div>
             </div>
             <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                 <div className="text-[10px] text-slate-500 uppercase mb-1">Confiance</div>
                 <div className="text-sm font-semibold text-white flex items-center gap-2">
                     <TrendingUp className="w-3 h-3 text-blue-500" />
                     Detectée
                 </div>
             </div>
        </div>

        {/* Traits & Needs */}
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Traits Marquants</label>
                <div className="flex flex-wrap gap-2">
                    {data.keyTraits.map((trait, i) => (
                        <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded-md border border-slate-600/50">
                            #{trait}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Besoins Identifiés</label>
                <ul className="space-y-2">
                    {data.perceivedNeeds.map((need, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-800/20 p-2 rounded">
                            <Zap className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />
                            {need}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
            <p className="text-[9px] text-slate-600 text-center">
                Dernière mise à jour: {data.lastUpdated.toLocaleTimeString()}
            </p>
        </div>

      </div>
    </div>
  );
};
