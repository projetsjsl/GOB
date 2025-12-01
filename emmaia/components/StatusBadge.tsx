
import React from 'react';
import { ConnectionState } from '../types';
import { clsx } from 'clsx';
import { Wifi, Activity, Thermometer } from 'lucide-react';

interface StatusBadgeProps {
  state: ConnectionState;
  temperature: number;
  latencyMs: number;
  isSpeaking: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ state, temperature, latencyMs, isSpeaking }) => {
  const isConnected = state === ConnectionState.CONNECTED;

  return (
    <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-4 py-1.5 shadow-lg">
       
       {/* Status Indicator */}
       <div className="flex items-center gap-2 pr-3 border-r border-slate-700/50">
          <div className={clsx(
              "w-2 h-2 rounded-full",
              !isConnected ? "bg-slate-500" :
              isSpeaking ? "bg-green-500 animate-pulse" : "bg-blue-500"
          )}></div>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
             {!isConnected ? "OFFLINE" : isSpeaking ? "SPEAKING" : "LISTENING"}
          </span>
       </div>

       {/* Latency */}
       <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <Wifi className="w-3 h-3" />
          {isConnected ? `${latencyMs}ms` : '--'}
       </div>

        {/* Temperature */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono pl-2">
          <Thermometer className="w-3 h-3 text-orange-400" />
          {temperature.toFixed(1)}
       </div>

    </div>
  );
};
