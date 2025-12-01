import React from 'react';
import { PROFESSION_PRESETS } from '../constants';
import { User } from 'lucide-react';
import { clsx } from 'clsx';

interface PersonaSelectorProps {
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ activeId, onSelect, className }) => {
  return (
    <div className={clsx("flex gap-4 overflow-x-auto pb-2 custom-scrollbar", className)}>
      {PROFESSION_PRESETS.map((preset) => {
        const isActive = activeId === preset.id;
        
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={clsx(
              "group flex flex-col items-center gap-2 min-w-[80px] transition-all",
              isActive ? "scale-105 opacity-100" : "opacity-60 hover:opacity-90 hover:scale-105"
            )}
          >
            <div className={clsx(
              "w-12 h-12 rounded-full p-0.5 transition-all shadow-lg overflow-hidden relative",
              isActive ? "bg-gradient-to-tr from-blue-500 to-purple-500 ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900" : "bg-slate-700 border border-slate-600"
            )}>
              <img 
                src={preset.image} 
                alt={preset.name}
                className={clsx("w-full h-full object-cover rounded-full", !isActive && "grayscale")}
              />
              {isActive && (
                <div className="absolute inset-0 bg-blue-500/10 animate-pulse rounded-full"></div>
              )}
            </div>
            
            <div className="flex flex-col items-center">
                <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider text-center leading-tight max-w-[90px]",
                    isActive ? "text-blue-300" : "text-slate-500 group-hover:text-slate-300"
                )}>
                    {preset.name.replace('Emma IA • ', '')}
                </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};