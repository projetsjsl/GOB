
import React, { useState } from 'react';
import { X, Send, FileText } from 'lucide-react';

interface EmailInputModalProps {
  onClose: () => void;
  onProcess: (text: string) => void;
}

export const EmailInputModal: React.FC<EmailInputModalProps> = ({ onClose, onProcess }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onProcess(text);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-800 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Analyse de Courriel / Document
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Collez le contenu du courriel ou du document ci-dessous. Chloé l'analysera, en fera un résumé et proposera des actions.
          </p>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez le texte ici..."
            className="w-full h-64 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono leading-relaxed custom-scrollbar"
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
            >
              <Send className="w-4 h-4" /> Analyser
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
