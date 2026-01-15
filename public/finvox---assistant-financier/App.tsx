import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { useGeminiLive } from './hooks/useGeminiLive';
import { useCommands } from './hooks/useCommands';
import AudioVisualizer from './components/AudioVisualizer';
import ControlPanel from './components/ControlPanel';
import StockChart from './components/StockChart';
import AnalysisPanel from './components/AnalysisPanel';
import CommandSuggestions from './components/CommandSuggestions';
import AdminCommandPanel from './components/AdminCommandPanel';
import { ConnectionState } from './types';
import { decode, decodeAudioData } from './utils/audioUtils';

const VOICES = [
  { id: 'Aoede', label: 'Aoede', desc: 'Elegante (F)' },
  { id: 'Kore', label: 'Kore', desc: 'Calme (F)' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Profonde (H)' },
  { id: 'Charon', label: 'Charon', desc: 'Grave (H)' },
  { id: 'Puck', label: 'Puck', desc: 'Douce (H)' },
];

const App: React.FC = () => {
  const {
    connectionState,
    connect,
    disconnect,
    logs,
    volume,
    chartData,
    setChartData,
    voiceName,
    setVoiceName,
    sendTextMessage,
    analysisResult,
    setAnalysisResult,
    // Configuration
    language,
    setLanguage,
    useAccent,
    setUseAccent,
    isTtsEnabled,
    setIsTtsEnabled
  } = useGeminiLive();

  // Command Management Hook
  const { commands, addCommand, updateCommand, deleteCommand, resetCommands } = useCommands();
  const [showAdmin, setShowAdmin] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const playVoicePreview = async (voiceId: string) => {
    // If already playing this voice, do nothing (or could stop it, but let's keep it simple)
    if (playingVoice === voiceId) return;

    setPlayingVoice(voiceId);
    setVoiceName(voiceId);

    try {
      const apiKey = process.env.API_KEY || (window as any).ENV_CONFIG?.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{ text: "Bonjour, je suis votre assistante FinVox. Je suis prete a analyser les marches pour vous." }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceId }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          ctx,
          24000,
          1
        );
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        source.onended = () => setPlayingVoice(null);
        source.start();
      } else {
        setPlayingVoice(null);
      }
    } catch (e) {
      console.error("Voice preview failed", e);
      setPlayingVoice(null);
    }
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">

      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">FinVox</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Assistant de Portefeuille Intelligent</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAdmin(true)}
              className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </button>
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${connectionState === ConnectionState.CONNECTED ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider text-xs">
                {connectionState === ConnectionState.CONNECTED ? 'En Ligne' : 'Hors Ligne'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">

        {/* Visualizer Section */}
        <section className="bg-slate-900 rounded-2xl p-1">
          <AudioVisualizer volume={volume} isActive={connectionState === ConnectionState.CONNECTED} />
        </section>

        {/* Dynamic Content Area (Chart, Analysis, or Status) */}
        {analysisResult ? (
          <AnalysisPanel data={analysisResult} onClose={() => setAnalysisResult(null)} />
        ) : chartData ? (
          <StockChart data={chartData} onClose={() => setChartData(null)} />
        ) : (
          /* Status / Hero */
          <div className="text-center py-4 animate-in fade-in duration-300">
            {connectionState === ConnectionState.DISCONNECTED && (
              <p className="text-slate-400 text-lg">
                Configurez votre voix et appuyez sur le bouton pour demarrer.
              </p>
            )}
            {connectionState === ConnectionState.CONNECTING && (
              <p className="text-emerald-400 text-lg animate-pulse">
                Connexion securisee en cours...
              </p>
            )}
            {connectionState === ConnectionState.CONNECTED && (
              <p className="text-slate-300 text-lg">
                Je vous ecoute. Demandez une analyse ou le cours d'une action.
              </p>
            )}
            {connectionState === ConnectionState.ERROR && (
              <p className="text-red-400 text-lg">
                Une erreur est survenue. Veuillez verifier votre cle API ou reessayer.
              </p>
            )}
          </div>
        )}

        {/* Configuration & Voice Selection (Only visible when disconnected) */}
        {!isConnected && connectionState !== ConnectionState.CONNECTING && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 my-2">

            {/* Voice Selection */}
            <div className="flex flex-col items-center gap-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Choisir la voix de l'assistante</span>
              <div className="flex flex-wrap justify-center gap-3">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => playVoicePreview(v.id)}
                    className={`
                      group flex flex-col items-center justify-center w-24 h-20 rounded-xl border transition-all duration-200 relative overflow-hidden
                      ${voiceName === v.id
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                      }
                    `}
                  >
                    {playingVoice === v.id && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <div className="flex gap-1">
                          <span className="w-1 h-3 bg-emerald-400 animate-wave"></span>
                          <span className="w-1 h-3 bg-emerald-400 animate-wave [animation-delay:-0.1s]"></span>
                          <span className="w-1 h-3 bg-emerald-400 animate-wave [animation-delay:-0.2s]"></span>
                        </div>
                      </div>
                    )}
                    <span className={`text-sm font-bold mb-1 ${voiceName === v.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {v.label}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wide ${voiceName === v.id ? 'text-emerald-500/80' : 'text-slate-500'}`}>
                      {v.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Configuration */}
            <div className="flex flex-col items-center gap-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Configuration</span>
              <div className="flex flex-wrap justify-center gap-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">

                {/* Language Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">Langue</label>
                  <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button
                      onClick={() => setLanguage('fr-CA')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${language === 'fr-CA' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Francais (CA)
                    </button>
                    <button
                      onClick={() => setLanguage('en-CA')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${language === 'en-CA' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      English (CA)
                    </button>
                  </div>
                </div>

                {/* Accent Toggle (Only for French) */}
                {language === 'fr-CA' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-400 font-medium">Accent</label>
                    <button
                      onClick={() => setUseAccent(!useAccent)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${useAccent ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${useAccent ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                      Quebecois
                    </button>
                  </div>
                )}

                {/* TTS Toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">Synthese Vocale (TTS)</label>
                  <button
                    onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${isTtsEnabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isTtsEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                    {isTtsEnabled ? 'Activee' : 'Desactivee'}
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Controls */}
        <ControlPanel
          connectionState={connectionState}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        {/* Conversation Logs */}
        <section className="flex-1 min-h-[300px] flex flex-col bg-slate-850 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden mt-4">
          <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.57.414v4.11l4-4h2.86c2.236 0 4.43-.18 6.57-.524 1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Transcription & Recherche
            </h3>
            <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">Gemini 2.5 Flash Live</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <p className="text-sm">La conversation apparaitra ici...</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`
                                max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed
                                ${log.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : log.role === 'system'
                        ? 'bg-transparent text-slate-500 text-center w-full text-xs italic py-1 shadow-none'
                        : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
                    }
                             `}>
                    {log.role !== 'system' && (
                      <div className={`text-[10px] font-bold uppercase mb-1 opacity-70 ${log.role === 'user' ? 'text-blue-200' : 'text-emerald-400'}`}>
                        {log.role === 'user' ? 'Vous' : 'FinVox'}
                      </div>
                    )}
                    {log.text}
                  </div>
                  {log.citations && log.citations.length > 0 && (
                    <div className="mt-2 ml-2 flex flex-wrap gap-2 max-w-[80%]">
                      {log.citations.map((uri, i) => (
                        <a
                          key={i}
                          href={uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-md hover:bg-slate-700 hover:text-white transition-colors truncate max-w-full block"
                          style={{ maxWidth: '200px' }}
                        >
                          Source: {tryGetHostname(uri)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </section>

        {/* Command Suggestions (Only visible when connected) */}
        {isConnected && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-4">
            <CommandSuggestions
              onCommandSelect={sendTextMessage}
              disabled={connectionState !== ConnectionState.CONNECTED}
              commands={commands}
            />
          </div>
        )}

        {/* Admin Modal */}
        {showAdmin && (
          <AdminCommandPanel
            commands={commands}
            onAdd={addCommand}
            onUpdate={updateCommand}
            onDelete={deleteCommand}
            onReset={resetCommands}
            onClose={() => setShowAdmin(false)}
          />
        )}

      </main>

      <footer className="py-6 text-center text-slate-600 text-xs relative">
        <p>Propulse par Google Gemini 2.5 Flash Live API & Gemini 3 Pro</p>
        <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', fontSize: '10px', borderRadius: '4px', pointerEvents: 'none', opacity: 0.6 }}>
          FILE: public/finvox---assistant-financier/App.tsx
        </div>
      </footer>
    </div>
  );
};

function tryGetHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default App;