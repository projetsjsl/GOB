

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { clsx } from 'clsx';
import { MessageSquare, TrendingUp, TrendingDown, Minus, User } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
}

// Utilitaires d'analyse de sentiment simple pour le français/finance
const detectSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const lowerText = text.toLowerCase();
  
  const positiveKeywords = [
    'hausse', 'gain', 'profit', 'positif', 'excellent', 'croissance', 
    'opportunité', 'rentable', 'super', 'bon', 'stable', 'prometteur', 
    'génial', 'parfait', 'd\'accord', 'succès', 'performant'
  ];
  
  const negativeKeywords = [
    'baisse', 'perte', 'chute', 'négatif', 'risque', 'crise', 
    'attention', 'mauvais', 'incertain', 'erreur', 'problème', 
    'difficile', 'complexe', 'dangereux', 'effondrement'
  ];

  let score = 0;
  positiveKeywords.forEach(word => { if (lowerText.includes(word)) score++; });
  negativeKeywords.forEach(word => { if (lowerText.includes(word)) score--; });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
        <MessageSquare className="w-12 h-12 mb-2" />
        <p>L'historique apparaîtra ici...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-medium text-slate-200">Transcription</h3>
        <span className="text-[10px] text-slate-500 font-mono uppercase">Live Feed</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => {
          // Detect split speakers for Panel Mode based on [Emma IA • EXPERTISE]: format
          // Regex captures: [Emma IA • BOURSE]: or similar
          const isMultiSpeaker = msg.role === 'assistant' && msg.text.match(/\[Emma IA • (?:BOURSE|MACRO|POLITIQUE|RECHERCHE)\]:/);
          
          if (isMultiSpeaker) {
             // Split logical parts if multiple speakers in one block
             const parts = msg.text.split(/(\[Emma IA • (?:BOURSE|MACRO|POLITIQUE|RECHERCHE)\]:)/g).filter(Boolean);
             let currentSpeaker = 'Emma IA'; // Default
             
             return (
               <div key={msg.id} className="flex flex-col gap-3 items-start max-w-[95%]">
                 {parts.map((part, idx) => {
                    if (part.match(/^\[.*\]:$/)) {
                        currentSpeaker = part.replace(/[\[\]:]/g, '');
                        return null;
                    }
                    if (!part.trim()) return null;

                    // Determine style based on speaker
                    let speakerColor = 'text-blue-300 border-blue-500/30 bg-blue-900/20'; // Default / BOURSE
                    let badgeColor = 'bg-blue-600 text-white';
                    
                    if (currentSpeaker.includes('MACRO')) {
                        speakerColor = 'text-green-300 border-green-500/30 bg-green-900/20';
                        badgeColor = 'bg-green-600 text-white';
                    }
                    if (currentSpeaker.includes('POLITIQUE')) {
                        speakerColor = 'text-orange-300 border-orange-500/30 bg-orange-900/20';
                        badgeColor = 'bg-orange-600 text-white';
                    }
                    if (currentSpeaker.includes('RECHERCHE')) {
                        speakerColor = 'text-purple-300 border-purple-500/30 bg-purple-900/20';
                        badgeColor = 'bg-purple-600 text-white';
                    }

                    return (
                        <div key={idx} className={`flex flex-col rounded-xl border ${speakerColor} w-full shadow-md`}>
                             <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeColor} rounded-t-xl w-full flex items-center gap-2`}>
                                <User className="w-3 h-3" />
                                {currentSpeaker}
                             </div>
                             <div className="px-4 py-3 text-sm text-slate-200 leading-relaxed">
                                {part.trim()}
                             </div>
                        </div>
                    );
                 })}
               </div>
             );
          }

          // Standard Single Speaker Logic
          const sentiment = msg.role === 'assistant' ? detectSentiment(msg.text) : undefined;

          return (
            <div 
              key={msg.id} 
              className={clsx(
                "flex flex-col max-w-[85%]",
                msg.role === 'user' ? "self-end items-end" : "self-start items-start"
              )}
            >
              <div className={clsx(
                "px-4 py-2 rounded-2xl text-sm leading-relaxed relative group transition-all duration-300",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20" 
                  : msg.role === 'assistant' 
                    ? "bg-slate-700 text-slate-100 rounded-bl-none shadow-md" 
                    : "bg-transparent text-slate-500 italic w-full text-center text-xs"
              )}>
                {msg.text}
                
                {/* Sentiment Indicator for Assistant */}
                {msg.role === 'assistant' && sentiment && (
                   <div className={clsx(
                       "absolute -right-2 -top-2 p-1 rounded-full border shadow-sm scale-0 group-hover:scale-100 transition-transform duration-200",
                       sentiment === 'positive' ? "bg-green-500/20 border-green-500/50 text-green-400" :
                       sentiment === 'negative' ? "bg-red-500/20 border-red-500/50 text-red-400" :
                       "bg-slate-500/20 border-slate-500/50 text-slate-400"
                   )}>
                       {sentiment === 'positive' && <TrendingUp className="w-3 h-3" />}
                       {sentiment === 'negative' && <TrendingDown className="w-3 h-3" />}
                       {sentiment === 'neutral' && <Minus className="w-3 h-3" />}
                   </div>
                )}

              </div>
              {msg.role !== 'system' && (
                <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-slate-500">
                        {msg.role === 'user' ? 'Vous' : 'Emma IA'}
                    </span>
                    {msg.role === 'assistant' && (
                        <span className={clsx(
                            "text-[9px] font-medium opacity-60",
                            sentiment === 'positive' ? "text-green-400" : 
                            sentiment === 'negative' ? "text-red-400" : "text-slate-500"
                        )}>
                            {sentiment === 'positive' ? 'Positif' : sentiment === 'negative' ? 'Négatif' : ''}
                        </span>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
