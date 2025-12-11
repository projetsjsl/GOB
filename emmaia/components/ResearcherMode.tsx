
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Globe, Image as ImageIcon, Sliders } from 'lucide-react';
import { ChatMessage, BriefingData } from '../types';
import { RESEARCHER_SYSTEM_INSTRUCTION, AVATAR_IMAGES, MODE_STARTER_PROMPTS } from '../constants';
import { BriefingView } from './BriefingView';
import { ModelSelector } from './ModelSelector';
import { useModeConfig } from '../hooks/useModeConfig';
import { generateContent } from '../services/aiService';

interface ResearcherModeProps {
  onBack: () => void;
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const ResearcherMode: React.FC<ResearcherModeProps> = ({ onBack, avatarImage, onOpenGallery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  const { config, setConfig, currentModel, availableModels } = useModeConfig('researcher');

  const handleSend = async (text: string = inputText) => {
      if (!text.trim() || isLoading) return;
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);

      try {
          const response = await generateContent({
              modelId: config.modelId,
              prompt: text,
              systemInstruction: RESEARCHER_SYSTEM_INSTRUCTION,
              googleSearch: config.googleSearch
          });
          
          const respText = response.text || "";
          const jsonMatch = respText.match(/###BRIEFING_UPDATE_START###([\s\S]*?)###BRIEFING_UPDATE_END###/);
          if (jsonMatch && jsonMatch[1]) { setBriefingData(JSON.parse(jsonMatch[1])); }
          const cleanText = respText.replace(/###BRIEFING_UPDATE_START###[\s\S]*?###BRIEFING_UPDATE_END###/g, '').trim();
          
          const assistantMsg: ChatMessage = { 
              id: Date.now().toString(), 
              role: 'assistant', 
              text: cleanText, 
              timestamp: new Date(),
              citations: response.citations
          };
          setMessages(prev => [...prev, assistantMsg]);
      } catch (e) { 
          console.error(e);
          setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              role: 'assistant', 
              text: `❌ Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`, 
              timestamp: new Date() 
          }]);
      } finally {
          setIsLoading(false);
      }
  };

  const starterPrompts = MODE_STARTER_PROMPTS['researcher'];

  return (
    <div className="flex h-screen text-white overflow-hidden glass-panel rounded-none">
       <div className="w-full lg:w-1/2 border-r border-orange-900/20 flex flex-col bg-slate-950/60 backdrop-blur-xl">
           <div className="p-6 border-b border-orange-900/20 flex items-center justify-between">
               <div className="flex items-center gap-4">
                   <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Retour au menu"><ArrowLeft className="w-5 h-5 text-orange-400" /></button>
                   <div className="w-12 h-12 rounded-full border-2 border-orange-500/50 overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                        <img src={avatarImage || AVATAR_IMAGES.professional} alt="Morgane - Recherchiste" className="w-full h-full object-cover" />
                   </div>
                   <div>
                       <h2 className="text-lg font-bold flex items-center gap-2 text-orange-500">Morgane</h2>
                       <p className="text-[10px] text-orange-300 uppercase tracking-widest font-mono">Recherchiste 24/7</p>
                   </div>
               </div>
               <div className="flex gap-2">
                   <ModelSelector
                       currentModelId={config.modelId}
                       availableModels={availableModels}
                       googleSearch={config.googleSearch}
                       onModelChange={(modelId) => setConfig({ modelId })}
                       onGoogleSearchChange={(googleSearch) => setConfig({ googleSearch })}
                       accentColor="orange"
                   />
                   {onOpenGallery && <button onClick={onOpenGallery} className="p-2 bg-orange-950/30 hover:bg-orange-900/50 rounded-lg border border-orange-900/30 transition-colors" title="Galerie d'images"><ImageIcon className="w-4 h-4 text-orange-400" /></button>}
               </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {messages.map(m => (
                   <div key={m.id} className={`p-3 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-slate-700 text-white self-end ml-auto max-w-[90%]' : 'bg-orange-950/40 text-orange-100 border border-orange-900/30'}`}>
                       {m.text}
                       {m.citations && m.citations.length > 0 && (
                           <div className="mt-2 pt-2 border-t border-orange-900/30">
                               <p className="text-[10px] text-orange-400 mb-1">📚 Sources:</p>
                               {m.citations.map((url, i) => (
                                   <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 hover:underline truncate">{url}</a>
                               ))}
                           </div>
                       )}
                   </div>
               ))}
               {isLoading && <div className="text-xs text-orange-500 animate-pulse px-4">Recherche en cours avec {currentModel.name}...</div>}
           </div>
           
           <div className="p-4 border-t border-orange-900/20 bg-slate-900/30">
               <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                   {starterPrompts?.map((prompt, i) => (
                       <button key={i} onClick={() => handleSend(prompt)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-orange-950/40 border border-orange-900/50 text-[10px] text-orange-200 hover:text-white hover:bg-orange-900/60 transition-all">{prompt}</button>
                   ))}
               </div>
               <div className="relative">
                   <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="w-full bg-slate-950 border border-orange-900/30 rounded-xl py-3 pl-4 pr-10 text-xs focus:border-orange-500 outline-none shadow-inner" placeholder="Commande de recherche..." disabled={isLoading} />
                   <button onClick={() => handleSend()} className="absolute right-2 top-2 p-1.5 bg-orange-600/20 text-orange-500 rounded-lg hover:bg-orange-600 hover:text-white transition-all" disabled={isLoading} title="Envoyer"><Send className="w-4 h-4" /></button>
               </div>
           </div>
       </div>
       <div className="hidden lg:block w-1/2 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
           <BriefingView data={briefingData} />
       </div>
    </div>
  );
};

