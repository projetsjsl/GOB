
import React from 'react';
import { Mic, PhoneOff, Settings, Mail, ScanFace } from 'lucide-react';
import { ConnectionState } from '../types';

interface ControlBarProps {
  state: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  onEmail: () => void;
  onOpenAdmin: () => void;
  onToggleInsights: () => void;
  showInsights: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
    state, 
    onConnect, 
    onDisconnect, 
    onEmail, 
    onOpenAdmin, 
    onToggleInsights, 
    showInsights 
}) => {
  const isConnected = state === ConnectionState.CONNECTED;
  const isConnecting = state === ConnectionState.CONNECTING;

  return (
    <div className="flex items-center justify-center gap-6 p-6 bg-slate-900/50 backdrop-blur-md border-t border-slate-800/50 w-full max-w-3xl mx-auto rounded-full mb-8 shadow-2xl relative z-40">
      
      {!isConnected && !isConnecting && (
        <button
          onClick={onConnect}
          className="group flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95"
          aria-label="Start Conversation"
        >
          <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {isConnecting && (
         <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
         </div>
      )}

      {isConnected && (
        <>
          {/* Insights Button */}
           <button 
            onClick={onToggleInsights}
            className={`p-4 rounded-full border transition-all active:scale-95 group relative ${
                showInsights 
                ? "bg-purple-600/20 text-purple-400 border-purple-500/50" 
                : "bg-slate-800/50 text-slate-300 hover:text-white border-slate-700 hover:border-purple-500/50"
            }`}
            title="Activer la perception IA"
          >
            <ScanFace className="w-6 h-6" />
          </button>

          {/* Email Transcript Button */}
          <button 
            onClick={onEmail}
            className="p-4 rounded-full bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-all active:scale-95 group relative"
            title="Envoyer le résumé par courriel"
          >
            <Mail className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Disconnect Button (Center) */}
          <button
            onClick={onDisconnect}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            aria-label="End Conversation"
          >
            <PhoneOff className="w-8 h-8 text-red-400" />
          </button>
          
          {/* Settings Button */}
          <button 
            onClick={onOpenAdmin}
            className="p-4 rounded-full bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-all active:scale-95"
          >
            <Settings className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};
