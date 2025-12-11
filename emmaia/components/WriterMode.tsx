
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Send, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, FinancialDocument } from '../types';
import { WRITER_SYSTEM_INSTRUCTION, AVATAR_IMAGES, MODE_STARTER_PROMPTS } from '../constants';
import { DocumentPreview } from './DocumentPreview';
import { ModelSelector } from './ModelSelector';
import { useModeConfig } from '../hooks/useModeConfig';
import { generateContent } from '../services/aiService';
import { clsx } from 'clsx';

interface WriterModeProps {
  onBack: () => void;
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const WriterMode: React.FC<WriterModeProps> = ({ onBack, avatarImage, onOpenGallery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState<FinancialDocument | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { config, setConfig, currentModel, availableModels } = useModeConfig('writer');
  
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyContext = messages.map(m => `${m.role === 'user' ? 'User' : 'Editor'}: ${m.text}`).join('\n');
      const fullPrompt = `Historique:\n${historyContext}\n\nUser: ${userMsg.text}`;
      
      const response = await generateContent({
          modelId: config.modelId,
          prompt: fullPrompt,
          systemInstruction: WRITER_SYSTEM_INSTRUCTION,
          googleSearch: config.googleSearch
      });
      
      const responseText = response.text || "";
      const jsonMatch = responseText.match(/###DOC_UPDATE_START###([\s\S]*?)###DOC_UPDATE_END###/);
      let cleanText = responseText.replace(/###DOC_UPDATE_START###[\s\S]*?###DOC_UPDATE_END###/g, '').trim();
      if (jsonMatch && jsonMatch[1]) { try { setDocument(JSON.parse(jsonMatch[1])); } catch (e) { console.error(e); } }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: cleanText, timestamp: new Date(), citations: response.citations }]);
    } catch (error) { 
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const starterPrompts = MODE_STARTER_PROMPTS['writer'];

  return (
    <div className="flex h-screen text-white overflow-hidden glass-panel rounded-none">
        <div className="w-full lg:w-1/2 flex flex-col border-r border-emerald-900/30 bg-slate-950/60 backdrop-blur-xl">
             <div className="p-6 border-b border-emerald-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Retour au menu"><ArrowLeft className="w-5 h-5 text-emerald-400" /></button>
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                         <img src={avatarImage || AVATAR_IMAGES.professional} alt="Emma - Rédactrice" className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h2 className="font-bold flex items-center gap-2 text-emerald-500">Emma • RÉDACTION</h2>
                        <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-mono">Secrétaire Financière</p>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <ModelSelector
                         currentModelId={config.modelId}
                         availableModels={availableModels}
                         googleSearch={config.googleSearch}
                         onModelChange={(modelId) => setConfig({ modelId })}
                         onGoogleSearchChange={(googleSearch) => setConfig({ googleSearch })}
                         accentColor="emerald"
                     />
                     {onOpenGallery && <button onClick={onOpenGallery} className="p-2 bg-emerald-950/30 hover:bg-emerald-900/50 rounded-lg border border-emerald-900/30 transition-colors" title="Galerie d'images"><ImageIcon className="w-4 h-4 text-emerald-400" /></button>}
                 </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                 {messages.map(m => (
                     <div key={m.id} className={clsx("p-3 rounded-xl text-sm max-w-[90%]", m.role === 'user' ? "bg-slate-700 text-white self-end ml-auto" : "bg-emerald-950/30 text-emerald-100 border border-emerald-900/30")}>
                         {m.text}
                         {m.citations && m.citations.length > 0 && (
                             <div className="mt-2 pt-2 border-t border-emerald-900/30 text-[10px] text-emerald-400">
                                 📚 Sources: {m.citations.length} référence(s)
                             </div>
                         )}
                     </div>
                 ))}
                 {isLoading && <div className="text-xs text-emerald-500 animate-pulse px-4">Rédaction en cours avec {currentModel.name}...</div>}
             </div>
             <div className="p-6 border-t border-emerald-900/30 bg-slate-900/30">
                 <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                     {starterPrompts?.map((prompt, i) => (
                         <button key={i} onClick={() => handleSend(prompt)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-900/50 text-[10px] text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-all">{prompt}</button>
                     ))}
                 </div>
                 <div className="relative">
                    <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="w-full bg-slate-950 border border-emerald-900/30 rounded-xl py-3 pl-4 pr-10 text-sm focus:border-emerald-500 outline-none shadow-inner" placeholder="Instructions..." disabled={isLoading} />
                    <button onClick={() => handleSend()} className="absolute right-2 top-2 p-1.5 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors" disabled={isLoading} title="Envoyer"><Send className="w-4 h-4" /></button>
                 </div>
             </div>
        </div>
        <div className="hidden lg:flex w-1/2 bg-slate-900/90 overflow-y-auto p-12 justify-center backdrop-blur-sm">
            <DocumentPreview document={document} />
        </div>
    </div>
  );
};
