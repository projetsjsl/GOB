
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Scale, Send, ShieldAlert, AlertTriangle, XCircle, Search, Image as ImageIcon, Sliders } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, RiskReport } from '../types';
import { MODEL_TEXT_DEFAULT, CRITIC_SYSTEM_INSTRUCTION, AVATAR_IMAGES, MODE_STARTER_PROMPTS } from '../constants';
import { clsx } from 'clsx';

interface CriticModeProps {
  onBack: () => void;
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const CriticMode: React.FC<CriticModeProps> = ({ onBack, avatarImage, onOpenGallery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;
    setInputText('');
    setIsLoading(true);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key Missing");
        const ai = new GoogleGenAI({ apiKey });
        const historyContext = messages.map(m => `${m.role === 'user' ? 'User' : 'Avocat'}: ${m.text}`).join('\n');
        const prompt = `${CRITIC_SYSTEM_INSTRUCTION}\n\nHISTORIQUE:\n${historyContext}\n\nUSER ARGUMENT: ${text}`;
        const response = await ai.models.generateContent({ model: MODEL_TEXT_DEFAULT, contents: prompt });
        const respText = response.text || "";
        const jsonMatch = respText.match(/###RISK_REPORT_START###([\s\S]*?)###RISK_REPORT_END###/);
        const cleanText = respText.replace(/###RISK_REPORT_START###[\s\S]*?###RISK_REPORT_END###/g, '').trim();
        if (jsonMatch && jsonMatch[1]) { try { setRiskReport(JSON.parse(jsonMatch[1])); } catch (e) { console.error(e); } }
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: cleanText, timestamp: new Date() }]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const starterPrompts = MODE_STARTER_PROMPTS['critic-mode'];

  return (
      <div className="flex h-screen text-white overflow-hidden glass-panel rounded-none">
          <div className="w-full lg:w-1/2 flex flex-col border-r border-red-900/30 bg-slate-950/50 backdrop-blur-xl relative">
              <div className="p-6 border-b border-red-900/30 flex items-center justify-between bg-gradient-to-r from-red-950/40 to-transparent">
                  <div className="flex items-center gap-4">
                      <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-red-400" /></button>
                      <div className="w-12 h-12 rounded-full border-2 border-red-500/50 overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                          <img src={avatarImage || AVATAR_IMAGES.professional} className="w-full h-full object-cover grayscale contrast-125" />
                      </div>
                      <div>
                          <h2 className="text-lg font-bold flex items-center gap-2 text-red-500 tracking-tight">Emma • CRITIQUE</h2>
                          <p className="text-[10px] text-red-300 uppercase font-mono tracking-widest">Avocat du Diable</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button className="p-2 bg-red-950/30 hover:bg-red-900/50 rounded-lg border border-red-900/30 transition-colors"><Sliders className="w-4 h-4 text-red-400" /></button>
                      {onOpenGallery && <button onClick={onOpenGallery} className="p-2 bg-red-950/30 hover:bg-red-900/50 rounded-lg border border-red-900/30 transition-colors"><ImageIcon className="w-4 h-4 text-red-400" /></button>}
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                   {messages.map(m => (
                       <div key={m.id} className={clsx("p-4 rounded-2xl text-sm leading-relaxed shadow-lg max-w-[90%]", m.role === 'user' ? "bg-slate-700 text-white self-end ml-auto" : "bg-red-950/60 border border-red-900/40 text-red-50")}>{m.text}</div>
                   ))}
                   {isLoading && <div className="text-xs text-red-500 animate-pulse flex items-center gap-2 ml-4"><Search className="w-3 h-3"/> Analyse des risques...</div>}
              </div>

              <div className="p-6 border-t border-red-900/30 bg-slate-900/40 backdrop-blur-md">
                  <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                      {starterPrompts?.map((prompt, i) => (
                          <button key={i} onClick={() => handleSend(prompt)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-red-950/40 border border-red-900/50 text-[10px] text-red-200 hover:text-white hover:bg-red-900/60 transition-all">{prompt}</button>
                      ))}
                  </div>
                  <div className="relative">
                      <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="w-full bg-slate-950/80 border border-red-900/30 rounded-xl py-4 pl-6 pr-12 text-sm focus:border-red-500 outline-none shadow-inner" placeholder="Défiez-moi avec une action..." />
                      <button onClick={() => handleSend()} className="absolute right-3 top-3 p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"><Send className="w-4 h-4" /></button>
                  </div>
              </div>
          </div>
          <div className="hidden lg:flex w-1/2 bg-slate-950/80 p-10 flex-col relative overflow-hidden backdrop-blur-sm">
               {!riskReport ? <div className="flex flex-col items-center justify-center h-full text-slate-700 z-10"><Scale className="w-32 h-32 mb-8 opacity-10" /><h3 className="text-3xl font-black uppercase">Matrice de Menaces</h3></div> : 
               <div className="z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto w-full">
                   <div className="bg-red-950/30 border border-red-500/30 p-8 rounded-3xl flex justify-between items-start backdrop-blur-md shadow-2xl relative overflow-hidden">
                       <div className="relative z-10"><h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">{riskReport.targetEntity}</h2><div className="text-red-400 font-bold text-xl flex items-center gap-2 bg-red-950/50 px-4 py-2 rounded-lg w-fit border border-red-900/50"><AlertTriangle className="w-6 h-6" /> {riskReport.verdict}</div></div>
                       <div className="text-right relative z-10"><div className="text-xs text-red-400 font-mono uppercase tracking-widest mb-1">Risk Score</div><div className="text-7xl font-black text-white tracking-tighter">{riskReport.overallRiskScore}<span className="text-3xl text-red-500/50">/100</span></div></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {riskReport.risks.map((risk, i) => (
                           <div key={i} className={clsx("p-6 rounded-2xl border flex flex-col gap-3 transition-all hover:scale-[1.02] shadow-lg backdrop-blur-sm", risk.severity === 'Extrême' ? "bg-red-950/40 border-red-500/60" : risk.severity === 'Élevé' ? "bg-orange-950/30 border-orange-500/40" : "bg-slate-800/40 border-slate-700")}>
                               <div className="flex justify-between items-center"><span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase border">{risk.category}</span>{risk.redFlag && <XCircle className="w-5 h-5 text-red-500" />}</div>
                               <p className="text-sm text-slate-200 leading-relaxed font-light">{risk.description}</p>
                           </div>
                       ))}
                   </div>
               </div>}
          </div>
      </div>
  );
};
