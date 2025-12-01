

import React from 'react';
import { FinancialDocument } from '../types';

interface DocumentPreviewProps {
  document: FinancialDocument | null;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 bg-white/5 border border-dashed border-slate-700 rounded-xl m-4">
        <p className="text-sm">Le document apparaîtra ici...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-white text-slate-900 shadow-2xl font-serif max-w-[210mm] mx-auto min-h-[297mm]">
       <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
           <div>
               <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
               <p className="text-sm text-slate-600 mt-1">{document.date}</p>
           </div>
           <div className="text-right">
               <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Emma IA Enterprise</div>
               <div className="text-[10px] text-slate-400">Financial Advisory</div>
           </div>
       </div>

       <div className="space-y-6">
           {document.sections.map((section, idx) => (
               <div key={idx}>
                   <h2 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">{section.heading}</h2>
                   <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap text-justify">
                       {section.content}
                   </div>
               </div>
           ))}
       </div>

       <div className="mt-12 pt-8 border-t border-slate-200 text-center">
           <p className="text-xs text-slate-400 italic">{document.footer}</p>
           <p className="text-[10px] text-slate-300 mt-1 uppercase">Propulsé par JSLAI</p>
       </div>
    </div>
  );
};