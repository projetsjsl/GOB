import React, { useState } from 'react';
import { Command } from '../types';

interface AdminCommandPanelProps {
  commands: Command[];
  onAdd: (cmd: Omit<Command, 'id'>) => void;
  onUpdate: (id: string, cmd: Partial<Command>) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}

const AdminCommandPanel: React.FC<AdminCommandPanelProps> = ({ 
  commands, onAdd, onUpdate, onDelete, onReset, onClose 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ category: '', label: '', text: '' });
  const [isAdding, setIsAdding] = useState(false);

  const startEdit = (cmd: Command) => {
    setEditingId(cmd.id);
    setFormData({ category: cmd.category, label: cmd.label, text: cmd.text });
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormData({ category: 'Bourse', label: '', text: '' });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.label || !formData.text) return; // Simple validation

    if (isAdding) {
      onAdd(formData);
      setIsAdding(false);
    } else if (editingId) {
      onUpdate(editingId, formData);
      setEditingId(null);
    }
    setFormData({ category: '', label: '', text: '' });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin : Commandes Financières
            </h2>
            <p className="text-sm text-slate-400">Personnalisez les invites pour l'assistant FinVox</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-slate-700 space-y-3 scrollbar-thin">
            <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{commands.length} Commandes actives</span>
               <button onClick={onReset} className="text-xs text-red-400 hover:text-red-300 underline">Réinitialiser par défaut</button>
            </div>
            
            {commands.map(cmd => (
              <div 
                key={cmd.id} 
                className={`p-3 rounded-xl border transition-all cursor-pointer ${editingId === cmd.id ? 'bg-slate-800 border-purple-500' : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'}`}
                onClick={() => startEdit(cmd)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    cmd.category === 'Bourse' ? 'bg-blue-900/50 text-blue-300' : 
                    cmd.category === 'Économie' ? 'bg-green-900/50 text-green-300' :
                    cmd.category === 'Politique' ? 'bg-red-900/50 text-red-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>{cmd.category}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(cmd.id); }}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <h4 className="font-bold text-slate-200 text-sm mb-1">{cmd.label}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{cmd.text}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="w-full md:w-1/3 bg-slate-850 p-6 flex flex-col gap-4">
             <h3 className="text-lg font-bold text-white mb-2">
                {isAdding ? 'Ajouter une commande' : editingId ? 'Modifier la commande' : 'Éditeur'}
             </h3>
             
             {!isAdding && !editingId ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                 <p className="mb-4">Sélectionnez une commande pour la modifier ou créez-en une nouvelle.</p>
                 <button 
                    onClick={startAdd}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-900/20"
                 >
                    + Nouvelle Commande
                 </button>
               </div>
             ) : (
               <>
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</label>
                   <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                   >
                     <option value="Bourse">Bourse</option>
                     <option value="Économie">Économie</option>
                     <option value="Politique">Politique</option>
                     <option value="Portefeuille">Portefeuille</option>
                     <option value="Actu">Actu</option>
                     <option value="Général">Général</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Label (Bouton)</label>
                   <input 
                      type="text" 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                      placeholder="Ex: 🧠 Analyse Tesla"
                      value={formData.label}
                      onChange={e => setFormData({...formData, label: e.target.value})}
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Prompt (Envoyé à l'IA)</label>
                   <textarea 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none h-32 resize-none"
                      placeholder="Ex: Fais une analyse approfondie de..."
                      value={formData.text}
                      onChange={e => setFormData({...formData, text: e.target.value})}
                   />
                 </div>

                 <div className="mt-auto flex gap-2">
                   <button 
                      onClick={() => { setIsAdding(false); setEditingId(null); }}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                   >
                      Annuler
                   </button>
                   <button 
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-900/20"
                   >
                      {isAdding ? 'Créer' : 'Sauvegarder'}
                   </button>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPanel;
