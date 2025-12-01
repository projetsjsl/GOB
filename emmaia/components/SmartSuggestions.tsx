
import React from 'react';
import { SmartSuggestion } from '../types';
import { Lightbulb, Newspaper, ArrowRight } from 'lucide-react';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  onSelect: (suggestion: SmartSuggestion) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="w-full max-w-2xl px-4 flex gap-3 overflow-x-auto pb-2 animate-in slide-in-from-bottom-4 fade-in duration-700 custom-scrollbar">
       {suggestions.map((s) => (
         <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="flex-shrink-0 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 hover:border-blue-500/50 rounded-xl p-3 flex flex-col gap-2 w-64 text-left transition-all group backdrop-blur-sm shadow-lg"
         >
            <div className="flex items-center justify-between w-full">
               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                   s.type === 'news' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
               }`}>
                   {s.category}
               </span>
               <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 -translate-x-2 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100" />
            </div>
            <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-2">
               {s.text}
            </p>
         </button>
       ))}
    </div>
  );
};
