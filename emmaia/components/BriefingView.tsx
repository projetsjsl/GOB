
import React from 'react';
import { BriefingData } from '../types';
import { TrendingUp, TrendingDown, Minus, Zap, Globe } from 'lucide-react';
import { clsx } from 'clsx';

interface BriefingViewProps {
  data: BriefingData | null;
}

export const BriefingView: React.FC<BriefingViewProps> = ({ data }) => {
  if (!data) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600">
          <Globe className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-xl font-bold uppercase tracking-widest">Global Briefing</h3>
          <p className="text-sm mt-2">En attente des données de marché...</p>
      </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Daily Briefing</h1>
                <p className="text-slate-500 font-mono text-xs mt-1">{new Date().toLocaleDateString()} • LIVE UPDATE</p>
            </div>
            <div className={clsx("px-4 py-2 rounded-lg border flex items-center gap-2", 
                data.marketSentiment === 'Bullish' ? "bg-green-900/20 border-green-500/50 text-green-400" :
                data.marketSentiment === 'Bearish' ? "bg-red-900/20 border-red-500/50 text-red-400" :
                "bg-slate-800 border-slate-700 text-slate-400"
            )}>
                {data.marketSentiment === 'Bullish' ? <TrendingUp className="w-5 h-5" /> : 
                 data.marketSentiment === 'Bearish' ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                <span className="font-bold uppercase tracking-wider">{data.marketSentiment}</span>
            </div>
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.topMovers.map((m, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col">
                    <span className="text-xs text-slate-500 font-bold">{m.ticker}</span>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-lg font-mono text-white">{m.price}</span>
                        <span className={clsx("text-sm font-bold", m.change.startsWith('+') ? "text-green-400" : "text-red-400")}>
                            {m.change}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        {/* Breaking News */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Breaking News
            </h3>
            <div className="grid grid-cols-1 gap-3">
                {data.breakingNews.map((news, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex gap-4 items-start hover:bg-slate-800 transition-colors">
                        <span className="text-xs font-mono text-slate-500 pt-1">{news.time}</span>
                        <div>
                            <p className="text-sm text-slate-200 font-medium leading-relaxed">{news.headline}</p>
                            <span className={clsx("text-[10px] uppercase font-bold mt-1 inline-block", 
                                news.impact === 'High' ? "text-red-400" : "text-slate-500"
                            )}>{news.impact} Impact</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Portfolio Alerts */}
        {data.portfolioAlerts.length > 0 && (
            <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl">
                 <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">Portfolio Alerts</h3>
                 <ul className="space-y-2">
                     {data.portfolioAlerts.map((alert, i) => (
                         <li key={i} className="text-sm text-blue-200 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {alert}
                         </li>
                     ))}
                 </ul>
            </div>
        )}
    </div>
  );
};
