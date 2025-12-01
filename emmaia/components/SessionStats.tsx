import React, { useEffect, useState } from 'react';
import { Clock, Mic, Users } from 'lucide-react';
import { SpeakerStats } from '../types';

interface SessionStatsProps {
  startTime: Date | null;
  stats: SpeakerStats;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ startTime, stats }) => {
  const [elapsed, setElapsed] = useState<string>("00:00");

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  return (
    <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-4 py-1.5 shadow-lg">
      <div className="flex items-center gap-2 border-r border-slate-700/50 pr-4">
         <Clock className="w-3 h-3 text-slate-400" />
         <span className="text-xs font-mono text-slate-200">{elapsed}</span>
      </div>
      
      <div className="flex items-center gap-3 text-[10px] font-mono">
         <div className="flex items-center gap-1 text-blue-300">
            <Users className="w-3 h-3" />
            <span>MOI: {stats.userTime}s</span>
         </div>
         <div className="flex items-center gap-1 text-purple-300">
            <Mic className="w-3 h-3" />
            <span>IA: {Object.values(stats.aiTime).reduce((a: number, b: number) => a + b, 0)}s</span>
         </div>
      </div>
    </div>
  );
};