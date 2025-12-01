
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquareText, Cpu, Image as ImageIcon, Sliders } from 'lucide-react';
import { ChatMessage, TextModel, ContextItem } from '../types';
import { ChatInterface } from './ChatInterface';
import { ContextPanel } from './ContextPanel';
import { PersonaSelector } from './PersonaSelector';
import { TextChatService } from '../services/textChatService';
import { AVAILABLE_MODELS, MODEL_TEXT_DEFAULT, DEFAULT_SYSTEM_INSTRUCTION, PROFESSION_PRESETS, MODE_STARTER_PROMPTS } from '../constants';
import { clsx } from 'clsx';

interface TextChatModeProps {
  onBack: () => void;
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const TextChatMode: React.FC<TextChatModeProps> = ({ onBack, avatarImage, onOpenGallery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(MODEL_TEXT_DEFAULT);
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const [activePersonaId, setActivePersonaId] = useState('finance'); 
  const chatServiceRef = useRef<TextChatService | null>(null);

  useEffect(() => {
     const apiKey = process.env.API_KEY;
     if (apiKey) {
         chatServiceRef.current = new TextChatService(apiKey);
     }
  }, []);

  const handlePersonaSelect = (id: string) => {
      setActivePersonaId(id);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          text: `Changement de profil : ${PROFESSION_PRESETS.find(p => p.id === id)?.name}`,
          timestamp: new Date()
      }]);
  };

  const handleSend = async (text: string = inputText) => {
      if (!text.trim() || !chatServiceRef.current) return;
      
      setInputText('');
      setIsLoading(true);

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: text,
          timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      const currentPersona = PROFESSION_PRESETS.find(p => p.id === activePersonaId);
      const systemInstruction = currentPersona ? currentPersona.systemPrompt : DEFAULT_SYSTEM_INSTRUCTION;

      try {
          const { response, contextItems: newContext } = await chatServiceRef.current.sendMessage(
              text, 
              selectedModelId as TextModel, 
              systemInstruction
          );

          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              text: response,
              timestamp: new Date()
          }]);

          if (newContext.length > 0) {
              setContextItems(prev => [...newContext, ...prev]);
          }

      } catch (error) {
          console.error(error);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              text: "Erreur de communication avec le modèle.",
              timestamp: new Date()
          }]);
      } finally {
          setIsLoading(false);
      }
  };

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const activePersona = PROFESSION_PRESETS.find(p => p.id === activePersonaId) || PROFESSION_PRESETS[0];
  const starterPrompts = MODE_STARTER_PROMPTS['finance']; // Default

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <div className="w-full lg:w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900 relative z-50 flex flex-col gap-4 shadow-xl">
           <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                   <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                       <ArrowLeft className="w-5 h-5 text-slate-400" />
                   </button>
                   <div>
                       <h2 className="text-lg font-bold flex items-center gap-2">
                           <MessageSquareText className="w-5 h-5 text-blue-500" />
                           Chat Expert
                       </h2>
                       <p className="text-[10px] text-slate-500 uppercase">Mode Textuel</p>
                   </div>
               </div>
               
               <div className="flex items-center gap-2">
                   <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors" title="Paramètres">
                       <Sliders className="w-4 h-4 text-slate-400" />
                   </button>
                   {onOpenGallery && (
                       <button onClick={onOpenGallery} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                           <ImageIcon className="w-4 h-4 text-slate-400" />
                       </button>
                   )}
                   <div className="relative">
                       <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-colors">
                           <Cpu className="w-4 h-4 text-purple-400" />
                           <span className="text-xs font-bold text-slate-200">{currentModel.name}</span>
                       </button>
                       {showModelMenu && (
                           <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[60]">
                               {AVAILABLE_MODELS.filter(m => m.type === 'directional').map(model => (
                                   <button key={model.id} onClick={() => { setSelectedModelId(model.id); setShowModelMenu(false); }} className="w-full text-left p-3 hover:bg-slate-800 border-b border-slate-800/50 flex items-start gap-3">
                                       <div className={clsx("mt-1 w-3 h-3 rounded-full border", selectedModelId === model.id ? "bg-blue-500 border-blue-400" : "border-slate-600")}></div>
                                       <span className="text-sm font-bold text-slate-200">{model.name}</span>
                                   </button>
                               ))}
                           </div>
                       )}
                   </div>
               </div>
           </div>
           <div className="w-full pt-2 border-t border-slate-800/50">
               <PersonaSelector activeId={activePersonaId} onSelect={handlePersonaSelect} />
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col">
            <ChatInterface messages={messages} />
            {isLoading && <div className="absolute bottom-4 left-6 text-xs text-blue-400 animate-pulse bg-slate-900/80 px-3 py-1 rounded-full border border-blue-900/50">Analyse en cours...</div>}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
            {/* Starter Prompts */}
            <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                {starterPrompts?.map((prompt, i) => (
                    <button key={i} onClick={() => handleSend(prompt)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-700 transition-all">
                        {prompt}
                    </button>
                ))}
            </div>
            <div className="relative max-w-4xl mx-auto">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={`Posez votre question à ${activePersona.name}...`} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-4 focus:border-blue-500 outline-none text-sm shadow-lg" disabled={isLoading} />
                <button onClick={() => handleSend()} disabled={isLoading || !inputText.trim()} className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"><Send className="w-5 h-5" /></button>
            </div>
        </div>
      </div>
      <div className="w-1/2 hidden lg:block border-l border-slate-800/50 bg-slate-950/40">
          <ContextPanel personalityData={null} contextItems={contextItems} isLoading={isLoading} />
      </div>
    </div>
  );
};
