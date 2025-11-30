
import React from 'react';
import { AnalysisResult } from '../types';

interface AnalysisPanelProps {
  data: AnalysisResult;
  onClose: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, onClose }) => {
  return (
    <div className="w-full bg-slate-850 rounded-2xl border border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${data.isLoading ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${data.isLoading ? 'text-indigo-400 animate-pulse' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Analyse Stratégique
              {data.isLoading && <span className="text-xs font-normal text-indigo-400 animate-pulse">(Gemini 3 Pro Réfléchit...)</span>}
            </h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{data.symbol ? `Sujet : ${data.symbol}` : 'Analyse en cours'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-slate-850">
        {data.isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <div className="whitespace-pre-wrap leading-relaxed font-light">
                {data.content}
            </div>
          </div>
        )}
      </div>
      
      {!data.isLoading && (
        <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700/50 text-[10px] text-slate-500 flex justify-between">
            <span>Généré par Gemini 3 Pro Preview (Thinking Mode)</span>
            <span>{data.timestamp.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
