
import React, { useState, useEffect, useRef } from 'react';
import { PersonalityAnalysis, ContextItem } from '../types';
import { Activity, BrainCircuit, TrendingUp, UserCheck, Zap, Newspaper, BarChart2, Quote, Layout, ShieldCheck, AlertTriangle, CheckCircle, Tag, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface ContextPanelProps {
  personalityData: PersonalityAnalysis | null;
  contextItems: ContextItem[];
  isLoading: boolean;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ personalityData, contextItems, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'context' | 'psych'>('context');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (activeTab === 'context' && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [contextItems, activeTab]);

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score < 60) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score < 80) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getTopicColor = (topic?: string) => {
      if (!topic) return 'bg-slate-700 text-slate-300';
      const t = topic.toLowerCase();
      if (t.includes('tech') || t.includes('ai')) return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      if (t.includes('éner') || t.includes('oil')) return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
      if (t.includes('bourse') || t.includes('fi')) return 'bg-green-600/20 text-green-300 border-green-500/30';
      if (t.includes('pol') || t.includes('géo')) return 'bg-red-600/20 text-red-300 border-red-500/30';
      if (t.includes('cryp')) return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      return 'bg-slate-700 text-slate-300';
  };

  const VerificationBadge = ({ status }: { status?: string }) => {
      if (!status) return null;
      const isVerified = status.toLowerCase().includes('vérifié') || status.toLowerCase().includes('interne');
      return (
          <div className={clsx(
              "flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
              isVerified 
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
          )}>
              {isVerified ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {status}
          </div>
      );
  };

  return (
    <div className="w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500 z-40 bg-transparent">
      
      {/* Header Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/80">
         <button 
           onClick={() => setActiveTab('context')}
           className={clsx("flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all", 
             activeTab === 'context' ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/10" : "text-slate-500 hover:text-slate-300")}
         >
            <Layout className="w-4 h-4" /> Flux Live
         </button>
         <button 
           onClick={() => setActiveTab('psych')}
           className={clsx("flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all", 
             activeTab === 'psych' ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/10" : "text-slate-500 hover:text-slate-300")}
         >
            <BrainCircuit className="w-4 h-4" /> Perception
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
        
        {/* --- CONTEXT TAB --- */}
        {activeTab === 'context' && (
            <div className="space-y-4">
               {contextItems.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-64 text-slate-600 opacity-60">
                       <Activity className="w-12 h-12 mb-3 animate-pulse" />
                       <p className="text-xs font-mono uppercase">En attente de données...</p>
                       <p className="text-[10px] mt-1">L'IA scanne le contexte en temps réel</p>
                   </div>
               )}

               {contextItems.map((item, index) => {
                   let verification = item.metadata?.verificationStatus || "Estimation";

                   return (
                   <div key={item.id} className={clsx(
                       "bg-slate-800/40 rounded-xl border overflow-hidden animate-in fade-in slide-in-from-right duration-500 transition-all hover:border-slate-500/50 group",
                       index === 0 ? "border-blue-500/50 shadow-lg shadow-blue-900/10 ring-1 ring-blue-500/20" : "border-slate-700/50 opacity-80"
                   )}>
                       
                       <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-700/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <span className={clsx("w-1.5 h-1.5 rounded-full", index === 0 ? "bg-blue-400 animate-pulse" : "bg-slate-600")} />
                              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase", 
                                 item.type === 'news' ? "text-red-300" :
                                 item.type === 'chart' ? "text-green-300" :
                                 "text-blue-300"
                              )}>
                                 {item.type}
                              </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">
                             {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                          </span>
                       </div>

                       <div className="p-3">
                           <h4 className="text-sm font-medium text-slate-100 mb-2 leading-tight">{item.title}</h4>
                           
                           <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {item.topic && (
                                    <div className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1", getTopicColor(item.topic))}>
                                        <Tag className="w-2.5 h-2.5" /> {item.topic}
                                    </div>
                                )}
                                <VerificationBadge status={index === 0 && !verification ? "Vérification..." : verification} />
                           </div>

                           {item.type === 'chart' && (
                               <div className="relative">
                                    <div className="h-24 w-full flex items-end justify-between gap-1 px-1 border-b border-l border-slate-700/50">
                                        {[35, 50, 45, 70, 60, 85, 80, 95].map((h, i) => (
                                            <div key={i} className="flex-1 bg-green-500/20 group-hover:bg-green-500/40 transition-all rounded-t-sm relative group/bar">
                                                <div className="absolute bottom-0 w-full bg-green-500/50 h-0 transition-all duration-1000 group-hover/bar:h-full" style={{height: `${h}%`}}></div>
                                                <div className="w-full h-full bg-green-500/20" style={{height: `${h}%`}}></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
                                        <span>OPEN</span>
                                        <span>CLOSE</span>
                                    </div>
                               </div>
                           )}

                           {item.type === 'news' && (
                               <div className="flex flex-col gap-2">
                                   <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                                       {item.content}
                                   </p>
                                   {item.url && (
                                       <a 
                                         href={item.url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/50 text-blue-400 hover:text-blue-300 transition-all group/link bg-slate-800/30 hover:bg-slate-800/60 p-2 rounded-lg"
                                       >
                                           <div className="bg-blue-500/10 p-1.5 rounded-md group-hover/link:bg-blue-500/20 transition-colors">
                                             <ExternalLink className="w-3.5 h-3.5" />
                                           </div>
                                           <div className="flex flex-col overflow-hidden">
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 group-hover/link:text-blue-400 transition-colors">Source Externe</span>
                                              <span className="text-[10px] truncate w-full opacity-70 group-hover/link:opacity-100 font-mono">{item.url}</span>
                                           </div>
                                       </a>
                                   )}
                               </div>
                           )}

                            {item.type === 'citation' && (
                               <div className="flex gap-3 bg-slate-900/30 p-2 rounded border border-slate-700/30">
                                   <Quote className="w-4 h-4 text-slate-600 shrink-0" />
                                   <p className="text-xs text-slate-300 italic font-serif">"{item.content}"</p>
                               </div>
                           )}
                       </div>
                   </div>
                   );
               })}
            </div>
        )}

        {/* --- PSYCH TAB --- */}
        {activeTab === 'psych' && personalityData && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                 <div className="text-[10px] text-slate-500 uppercase mb-2 font-bold tracking-wider">Analyse Psychométrique</div>
                 <p className="text-sm text-slate-300 italic">"{personalityData.summary}"</p>
             </div>
             
             <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Aversion au risque</span>
                    <span className={getRiskColor(personalityData.riskScore).split(' ')[0]}>{personalityData.riskScore}/100</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-red-500" style={{width: `${personalityData.riskScore}%`}}></div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-2">
                 {personalityData.keyTraits.map(trait => (
                     <div key={trait} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/30 px-3 py-2 rounded border border-slate-700/30">
                         <UserCheck className="w-3 h-3 text-purple-400" /> {trait}
                     </div>
                 ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
