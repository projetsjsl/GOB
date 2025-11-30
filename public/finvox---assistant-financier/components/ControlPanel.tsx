import React from 'react';
import { ConnectionState } from '../types';

interface ControlPanelProps {
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ connectionState, onConnect, onDisconnect }) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="flex justify-center items-center gap-6 mt-8">
      {!isConnected && (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className={`
            group relative flex items-center justify-center w-20 h-20 rounded-full 
            transition-all duration-300 ease-out shadow-lg
            ${isConnecting 
              ? 'bg-slate-700 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-emerald-500/30'
            }
          `}
        >
            {isConnecting ? (
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
            )}
            
            {!isConnecting && (
              <span className="absolute -bottom-8 text-sm font-medium text-slate-400 group-hover:text-emerald-400 transition-colors">
                  Démarrer
              </span>
            )}
        </button>
      )}

      {isConnected && (
        <button
          onClick={onDisconnect}
          className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-red-500/30"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m7.5 0v3.75m-7.5-3v3.75m0 0v3.75m0 0h7.5m-7.5 0a9 9 0 00-9-9H3m18 0a9 9 0 01-9 9m9-9h-1.5" />
            </svg>
            <span className="absolute -bottom-8 text-sm font-medium text-slate-400 group-hover:text-red-400 transition-colors">
                Arrêter
            </span>
        </button>
      )}
    </div>
  );
};

export default ControlPanel;