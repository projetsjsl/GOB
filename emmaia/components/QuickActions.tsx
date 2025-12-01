
import React, { useState } from 'react';
import { Mail, ArrowLeft, TrendingUp, Newspaper, ShieldAlert, Settings, Plus, X, Trash2, Zap, Briefcase, Search, Smile, Check } from 'lucide-react';
import { QuickAction } from '../types';
import { ACTION_PRESETS } from '../constants';
import { clsx } from 'clsx';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (command: string) => void;
  onUpdateActions: (actions: QuickAction[]) => void;
}

const ICON_MAP: Record<string, any> = {
  TrendingUp, Newspaper, ShieldAlert, Mail, Zap, Briefcase, Search, Smile
};

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, onAction, onUpdateActions }) => {
  const [mode, setMode] = useState<'main' | 'email' | 'config'>('main');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // --- Configuration Logic ---
  const handleRemove = (id: string) => {
    onUpdateActions(actions.filter(a => a.id !== id));
  };

  const handleAddPreset = (preset: QuickAction) => {
    const newAction = { ...preset, id: Date.now().toString() };
    onUpdateActions([...actions, newAction]);
    setShowAddMenu(false);
  };

  const handleAddCustom = () => {
    const command = prompt("Entrez la commande à envoyer à l'IA :");
    if (!command) return;
    const label = prompt("Nom du bouton (Court) :") || "Custom";
    
    const newAction: QuickAction = {
      id: Date.now().toString(),
      label,
      command,
      icon: 'Zap'
    };
    onUpdateActions([...actions, newAction]);
    setShowAddMenu(false);
  };

  // --- Sub-Components ---
  
  if (mode === 'email') {
    return (
      <div className="flex gap-2 w-full max-w-2xl px-4 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
        <button
          onClick={() => setMode('main')}
          className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Retour"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => {
            onAction("OPEN_EMAIL_MODAL");
            setMode('main');
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 rounded-xl transition-all text-sm font-medium shadow-lg hover:shadow-blue-900/20"
        >
          <Mail className="w-4 h-4" /> Résumé de Courriel
        </button>
        
        <button
          onClick={() => {
            onAction("Je voudrais que tu m'aides à rédiger une réponse à un courriel professionnel. Pose-moi des questions sur le contexte et le destinataire.");
            setMode('main');
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded-xl transition-all text-sm font-medium shadow-lg hover:shadow-purple-900/20"
        >
          <Briefcase className="w-4 h-4" /> Rédiger Réponse
        </button>
      </div>
    );
  }

  if (mode === 'config') {
      return (
          <div className="w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-blue-400" /> Personnaliser les Actions
                      </h3>
                      <button onClick={() => setMode('main')} className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 hover:bg-slate-700">Terminer</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                      {actions.map(action => {
                          const Icon = ICON_MAP[action.icon] || Zap;
                          return (
                              <div key={action.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700 group">
                                  <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs text-slate-200">{action.label}</span>
                                  </div>
                                  <button onClick={() => handleRemove(action.id)} className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                          );
                      })}
                      {actions.length < 4 && (
                          <button 
                            onClick={() => setShowAddMenu(true)}
                            className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-600 rounded-lg text-xs text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors"
                          >
                              <Plus className="w-4 h-4" /> Ajouter
                          </button>
                      )}
                  </div>

                  {showAddMenu && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Choisir un Preset</div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                              {ACTION_PRESETS.map(preset => (
                                  <button key={preset.id} onClick={() => handleAddPreset(preset)} className="text-left text-xs p-2 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300">
                                      {preset.label}
                                  </button>
                              ))}
                          </div>
                          <button onClick={handleAddCustom} className="w-full py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded text-xs font-medium hover:bg-blue-600/30">
                              + Créer commande personnalisée
                          </button>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="flex gap-3 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="grid grid-cols-4 gap-3 flex-1">
        {actions.map((action) => {
            const Icon = ICON_MAP[action.icon] || Zap;
            return (
                <button
                    key={action.id}
                    onClick={() => {
                        if (action.command === 'OPEN_EMAIL_MODAL') {
                            setMode('email');
                        } else {
                            onAction(action.command);
                        }
                    }}
                    className={clsx(
                        "flex items-center justify-center gap-2 px-2 py-3 border rounded-xl transition-all text-xs font-medium backdrop-blur-sm shadow-sm hover:shadow-md",
                        action.isSystem 
                            ? "bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border-slate-600 text-white"
                            : "bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300"
                    )}
                >
                    <Icon className={clsx("w-3.5 h-3.5", 
                        action.label === 'Marchés' ? "text-green-400" :
                        action.label === 'Actualités' ? "text-blue-400" :
                        action.label === 'Risques' ? "text-orange-400" :
                        "text-slate-200"
                    )} /> 
                    <span className="truncate">{action.label}</span>
                </button>
            );
        })}
      </div>
      
      <button 
        onClick={() => setMode('config')}
        className="p-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-xl text-slate-500 hover:text-white transition-colors"
        title="Configurer les boutons"
      >
          <Settings className="w-4 h-4" />
      </button>
    </div>
  );
};
