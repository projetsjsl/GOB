import React, { useState, useMemo } from 'react';
import { Command } from '../types';

interface CommandSuggestionsProps {
  onCommandSelect: (text: string) => void;
  disabled: boolean;
  commands: Command[];
}

const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ onCommandSelect, disabled, commands }) => {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredCommands = useMemo(() => {
    // If no search and not showing all, show first 6
    if (!search.trim() && !showAll) return commands.slice(0, 6);
    
    const query = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query) || 
      cmd.text.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    );
  }, [search, showAll, commands]);

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
         <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold ml-1">
          {search ? 'Resultats de recherche' : 'Commandes Disponibles'}
        </p>
      </div>
      
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm transition-all shadow-sm disabled:opacity-50"
          placeholder="Rechercher une commande (ex: Tesla, Analyse, Prix)..."
          value={search}
          onChange={(e) => {
              setSearch(e.target.value);
              if (!showAll && e.target.value) setShowAll(true);
          }}
          disabled={disabled}
        />
        {search && (
            <button 
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[240px] overflow-y-auto scrollbar-thin pr-1 content-start">
        {filteredCommands.length > 0 ? (
          filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                  onCommandSelect(cmd.text);
              }}
              disabled={disabled}
              className={`
                flex flex-col items-start justify-center px-4 py-3 rounded-xl border text-left transition-all duration-200 min-h-[70px]
                ${disabled 
                  ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-emerald-500/50 hover:text-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]'
                }
              `}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded
                ${cmd.category === 'Bourse' ? 'bg-blue-500/10 text-blue-400' :
                  cmd.category === 'Analyse' ? 'bg-purple-500/10 text-purple-400' :
                  cmd.category === 'Economie' ? 'bg-green-500/10 text-green-400' :
                  cmd.category === 'Politique' ? 'bg-red-500/10 text-red-400' :
                  cmd.category === 'Portefeuille' ? 'bg-yellow-500/10 text-yellow-400' :
                  cmd.category === 'Actu' ? 'bg-pink-500/10 text-pink-400' :
                  'bg-slate-500/10 text-slate-400'}
              `}>
                {cmd.category}
              </span>
              <span className="text-sm font-medium leading-tight">{cmd.label}</span>
            </button>
          ))
        ) : (
             <div className="col-span-full py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
                 Aucune commande trouvee.
             </div>
        )}
      </div>
      
      {!search && !showAll && commands.length > 6 && (
          <div className="text-center pt-1 border-t border-slate-800/50">
              <button 
                  onClick={() => setShowAll(true)}
                  className="text-xs text-slate-500 hover:text-emerald-400 transition-colors font-medium flex items-center justify-center gap-1 mx-auto"
                  disabled={disabled}
              >
                  Voir les {commands.length} commandes
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
              </button>
          </div>
      )}
      
      {showAll && !search && (
          <div className="text-center pt-1 border-t border-slate-800/50">
              <button 
                  onClick={() => setShowAll(false)}
                  className="text-xs text-slate-500 hover:text-emerald-400 transition-colors font-medium flex items-center justify-center gap-1 mx-auto"
                  disabled={disabled}
              >
                  Reduire la liste
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
              </button>
          </div>
      )}
    </div>
  );
};

export default CommandSuggestions;
