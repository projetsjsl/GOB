
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Activity, Zap, Image as ImageIcon, Sliders } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, TechnicalAnalysisData } from '../types';
import { MODEL_TEXT_DEFAULT, TECHNICAL_SYSTEM_INSTRUCTION, AVATAR_IMAGES, MODE_STARTER_PROMPTS } from '../constants';
import { clsx } from 'clsx';

interface TechnicalModeProps {
  onBack: () => void;
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const TechnicalMode: React.FC<TechnicalModeProps> = ({ onBack, avatarImage, onOpenGallery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [techData, setTechData] = useState<TechnicalAnalysisData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const historyContext = messages.map(m => `${m.role === 'user' ? 'User' : 'Analyste'}: ${m.text}`).join('\n');
      const prompt = `${TECHNICAL_SYSTEM_INSTRUCTION}\n\nHistorique:\n${historyContext}\n\nUser: ${userMsg.text}`;
      const response = await ai.models.generateContent({ model: MODEL_TEXT_DEFAULT, contents: prompt });
      const responseText = response.text || "Erreur d'analyse.";
      const jsonMatch = responseText.match(/###TECHNICAL_UPDATE_START###([\s\S]*?)###TECHNICAL_UPDATE_END###/);
      let cleanText = responseText.replace(/###TECHNICAL_UPDATE_START###[\s\S]*?###TECHNICAL_UPDATE_END###/g, '').trim();
      if (jsonMatch && jsonMatch[1]) { try { setTechData(JSON.parse(jsonMatch[1])); } catch (e) { console.error(e); } }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: cleanText, timestamp: new Date() }]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const getSignalColor = (signal?: string) => {
      switch(signal) {
          case 'STRONG_BUY': return 'text-green-400 border-green-500 bg-green-500/20';
          case 'BUY': return 'text-green-300 border-green-500/50 bg-green-500/10';
          case 'SELL': return 'text-red-300 border-red-500/50 bg-red-500/10';
          case 'STRONG_SELL': return 'text-red-400 border-red-500 bg-red-500/20';
          default: return 'text-slate-300 border-slate-500 bg-slate-500/10';
      }
  };

  const starterPrompts = MODE_STARTER_PROMPTS['technical-analyst'];

  return (
    <div className="flex h-screen bg-slate-950 text-white font-mono overflow-hidden glass-panel rounded-none">
      <div className="w-full lg:w-1/2 flex flex-col border-r border-emerald-900/30 bg-slate-950/60 backdrop-blur-xl">
        <div className="p-6 border-b border-emerald-900/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-emerald-400" /></button>
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                 <img src={avatarImage || AVATAR_IMAGES.geek} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 tracking-tight">Emma • GEEK</h2>
                <p className="text-[10px] text-emerald-600 uppercase tracking-widest">Analyste Technique</p>
              </div>
          </div>
          <div className="flex gap-2">
              <button className="p-2 bg-emerald-950/30 hover:bg-emerald-900/50 rounded-lg border border-emerald-900/30 transition-colors"><Sliders className="w-4 h-4 text-emerald-400" /></button>
              {onOpenGallery && <button onClick={onOpenGallery} className="p-2 bg-emerald-950/30 hover:bg-emerald-900/50 rounded-lg border border-emerald-900/30 transition-colors"><ImageIcon className="w-4 h-4 text-emerald-400" /></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={clsx("flex flex-col max-w-[90%]", msg.role === 'user' ? "self-end items-end" : "self-start items-start")}>
               <div className={clsx("px-4 py-3 rounded-xl text-xs leading-relaxed border", msg.role === 'user' ? "bg-emerald-900/20 border-emerald-800 text-emerald-100" : "bg-slate-800 border-slate-700 text-slate-300")}>{msg.text}</div>
            </div>
          ))}
          {isLoading && <div className="text-xs text-emerald-500 animate-pulse flex items-center gap-2 px-4"><Activity className="w-3 h-3" /> Calcul...</div>}
        </div>

        <div className="p-6 border-t border-emerald-900/30 bg-slate-900/30">
            <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                {starterPrompts?.map((prompt, i) => (
                    <button key={i} onClick={() => handleSend(prompt)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-900/50 text-[10px] text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-all">{prompt}</button>
                ))}
            </div>
            <div className="relative">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ex: Analyse TSLA RSI..." className="w-full bg-slate-950 border border-emerald-900/40 rounded-xl py-3 pl-4 pr-12 text-xs focus:border-emerald-500 outline-none font-mono" />
                <button onClick={() => handleSend()} className="absolute right-2 top-2 p-1.5 bg-emerald-600/20 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Send className="w-4 h-4" /></button>
            </div>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-black/80 p-8 flex-col overflow-y-auto custom-scrollbar relative">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
         {!techData ? <div className="flex flex-col items-center justify-center h-full text-slate-700"><Zap className="w-20 h-20 mb-6 opacity-20 animate-pulse" /><h3 className="text-xl font-bold uppercase tracking-widest text-slate-600">Terminal Chartiste</h3></div> : 
             <div className="z-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="flex items-center justify-between border-b border-white/10 pb-6"><div><h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">{techData.ticker}<span className={clsx("text-sm px-3 py-1 rounded border tracking-widest", getSignalColor(techData.signal))}>{techData.signal}</span></h1></div><div className="text-right"><div className="text-4xl font-bold text-emerald-400 font-mono">${techData.price}</div><div className="text-xl font-mono flex items-center justify-end gap-1 text-green-500">{techData.change}</div></div></div>
                 <div className="grid grid-cols-2 gap-6"><div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl backdrop-blur-md"><h4 className="text-xs text-slate-400 uppercase font-bold mb-4">RSI Momentum</h4><div className="text-3xl font-mono text-white">{techData.rsi}</div></div><div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl backdrop-blur-md"><h4 className="text-xs text-slate-400 uppercase font-bold mb-4">MACD Signal</h4><div className="text-3xl font-mono text-white">{techData.macd.value}</div></div></div>
             </div>
         }
      </div>
    </div>
  );
};
