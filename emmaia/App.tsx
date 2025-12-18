import React, { useState, useEffect, useRef } from 'react';
import { useGeminiLive } from './services/geminiLive';
import { analyzePersonality } from './services/analysisService';
import { IntegrationService } from './services/integrationService';
import { ConfigService } from './services/configService';
import { AvatarView } from './components/AvatarView';
import { ControlBar } from './components/ControlBar';
import { ChatInterface } from './components/ChatInterface';
import { AdminPanel } from './components/AdminPanel';
import { ContextPanel } from './components/ContextPanel';
import { StatusBadge } from './components/StatusBadge';
import { QuickActions } from './components/QuickActions';
import { EmailInputModal } from './components/EmailInputModal';
import { SessionStats } from './components/SessionStats';
import { SmartSuggestions } from './components/SmartSuggestions';
import { ModeSelector } from './components/ModeSelector';
import { TextChatMode } from './components/TextChatMode';
import { TavusService } from './services/tavusService';
import { TavusMode } from './components/TavusMode';
import { WriterMode } from './components/WriterMode';
import { ResearcherMode } from './components/ResearcherMode';
import { NotificationCenter } from './components/NotificationCenter';
import { CeoMode } from './components/CeoMode';
import { CriticMode } from './components/CriticMode';
import { TechnicalMode } from './components/TechnicalMode';
import { DeveloperGuide } from './components/DeveloperGuide';
import { EcosystemMap } from './components/EcosystemMap';
// FIX: Using relative import instead of alias to prevent module resolution errors
import { AvatarGalleryModal } from './components/AvatarGalleryModal';
import { PersonaSelector } from './components/PersonaSelector';

import { AlertCircle, Play, X, Video } from 'lucide-react';
import { AvatarConfig, PersonalityAnalysis, ConnectionState, ContextItem, SpeakerStats, QuickAction, AppMode, SmartSuggestion, ModeConfigMap } from './types';
import { HEYGEN_AVATAR_ID, AKOOL_AVATAR_ID, DEFAULT_SYSTEM_INSTRUCTION, MODEL_FLASH, VOICE_NAME, DEFAULT_INTEGRATION_CONFIG, PANEL_SYSTEM_INSTRUCTION, DEFAULT_QUICK_ACTIONS, DEFAULT_TAVUS_REPLICA_ID, DEFAULT_TAVUS_PERSONA_NAME, DEFAULT_TAVUS_CONTEXT, CEO_SYSTEM_INSTRUCTION_TEMPLATE, PROFESSION_PRESETS } from './constants';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode | null>(null);

  // Gemini Hook
  const gemini = useGeminiLive();
  
  // Configuration & State
  const [showAdmin, setShowAdmin] = useState(false);
  const [showDevGuide, setShowDevGuide] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  
  // Config Service
  const [configs, setConfigs] = useState<ModeConfigMap | null>(null);

  // Default to the first preset for the vocal mode if not set
  const [activePresetId, setActivePresetId] = useState('finance');

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
    systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
    llmModel: MODEL_FLASH,
    llmTemperature: 0.6,
    geminiVoice: VOICE_NAME,
    chatMode: 'solo',
    heygenToken: process.env.HEYGEN_API_KEY || (window as any).ENV_CONFIG?.HEYGEN_API_KEY || '',
    heygenAvatarId: HEYGEN_AVATAR_ID,
    heygenQuality: 'medium',
    heygenEmotion: 'Friendly',
    heygenRemoveBackground: false,
    akoolToken: '',
    akoolAvatarId: AKOOL_AVATAR_ID,
    akoolRegion: 'us-west',
    akoolFaceEnhance: true,
    activeProvider: 'both',
    muteGeminiAudio: false,
    integrationConfig: DEFAULT_INTEGRATION_CONFIG
  });

  const [quickActions, setQuickActions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS);
  const tavusServiceRef = useRef<TavusService | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  const [showContext, setShowContext] = useState(false);
  const [personalityData, setPersonalityData] = useState<PersonalityAnalysis | null>(null);
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [speakerStats, setSpeakerStats] = useState<SpeakerStats>({ userTime: 0, aiTime: {}, lastActive: null });
  const statsIntervalRef = useRef<number | null>(null);

  const [ceoPrompt, setCeoPrompt] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  // Load configs on mount
  useEffect(() => {
     const svc = new ConfigService(DEFAULT_INTEGRATION_CONFIG);
     svc.loadAllConfigs().then(loaded => setConfigs(loaded));
  }, []);

  const handleModeSelect = (mode: AppMode) => {
      setAppMode(mode);
  };

  const handleBackToMenu = () => {
      if (gemini.connectionState === ConnectionState.CONNECTED) gemini.disconnect();
      if (tavusServiceRef.current) tavusServiceRef.current.endConversation();
      setAppMode(null);
  };

  const handleConnect = () => {
    // Tavus Logic moved to TavusMode component mostly, but if we need to trigger it from here:
    if (appMode === 'tavus-video') return; 

    let finalConfig = { ...avatarConfig };
    
    // Apply granular configs if available
    if (configs) {
        if (appMode === 'ceo-mode' && configs['ceo']) {
             finalConfig.systemInstruction = configs['ceo'].systemPrompt;
             finalConfig.geminiVoice = configs['ceo'].voiceName;
        } else if (appMode === 'critic-mode' && configs['critic']) {
             finalConfig.systemInstruction = configs['critic'].systemPrompt;
             finalConfig.geminiVoice = configs['critic'].voiceName;
        } else if (appMode === 'technical-analyst' && configs['geek']) {
             finalConfig.systemInstruction = configs['geek'].systemPrompt;
        }
    }

    // Apply Active Preset for Vocal Mode if generic
    if (appMode === 'avatar-hybrid') {
        const preset = PROFESSION_PRESETS.find(p => p.id === activePresetId);
        if (preset) {
            finalConfig.systemInstruction = preset.systemPrompt;
            finalConfig.geminiVoice = preset.voiceName;
            finalConfig.heygenAvatarId = preset.avatarId;
        }
    }

    if (avatarConfig.chatMode === 'panel') finalConfig.systemInstruction = PANEL_SYSTEM_INSTRUCTION;
    if (appMode === 'ceo-mode' && ceoPrompt) finalConfig.systemInstruction = ceoPrompt; // Override with user input if present

    gemini.connect(finalConfig);
    setPersonalityData(null);
    setContextItems([]);
    setSuggestions([]);
    setSpeakerStats({ userTime: 0, aiTime: {}, lastActive: null });
  };

  const handleDisconnect = () => {
      gemini.disconnect();
  };

  const handleLivePersonaChange = (id: string) => {
      setActivePresetId(id);
      // If connected, we must reconnect to change the voice/system prompt in Gemini Live
      if (gemini.connectionState === ConnectionState.CONNECTED) {
          gemini.disconnect();
          // Small timeout to allow disconnect to process
          setTimeout(() => {
              // Re-trigger connect will pick up the new activePresetId
              const connectBtn = document.getElementById('connect-btn-trigger');
              if (connectBtn) connectBtn.click(); // Hacky but effective for self-triggering logic without duping code
              // Ideally, call handleConnect() but need to ensure state is clean
          }, 500);
      }
  };

  // Re-trigger effect for manual persona switch if disconnected
  useEffect(() => {
      if (gemini.connectionState === ConnectionState.DISCONNECTED && appMode === 'avatar-hybrid') {
          // Ready to connect with new persona
      }
  }, [activePresetId]);

  useEffect(() => {
    if (gemini.connectionState === ConnectionState.CONNECTED) {
        sessionStartTimeRef.current = new Date();
        statsIntervalRef.current = window.setInterval(() => {
            const isUserSpeaking = gemini.userVolume > 10;
            const isAiSpeaking = gemini.assistantVolume > 10;
            setSpeakerStats(prev => {
                const newStats = { ...prev };
                if (isUserSpeaking) { newStats.userTime += 1; newStats.lastActive = 'User'; }
                if (isAiSpeaking) {
                    const lastMsg = gemini.messages.slice().reverse().find(m => m.role === 'assistant')?.text || '';
                    let speaker = 'Emma IA'; 
                    if (lastMsg.includes('[Marc]:')) speaker = 'Marc';
                    if (lastMsg.includes('[Sarah]:')) speaker = 'Sarah';
                    newStats.aiTime[speaker] = (newStats.aiTime[speaker] || 0) + 1;
                    newStats.lastActive = speaker;
                }
                return newStats;
            });
        }, 1000);
    } else {
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    }
    return () => { if (statsIntervalRef.current) clearInterval(statsIntervalRef.current); };
  }, [gemini.connectionState, gemini.userVolume, gemini.assistantVolume]);

  useEffect(() => {
    if (gemini.connectionState !== ConnectionState.CONNECTED) return;
    const lastMsg = gemini.messages[gemini.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
        const jsonMatch = lastMsg.text.match(/###VISUAL_JSON_START###([\s\S]*?)###VISUAL_JSON_END###/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                if (data.title) {
                    const newItem: ContextItem = {
                        id: Date.now().toString(),
                        type: data.type,
                        title: data.title,
                        topic: data.topic || "Général",
                        content: data.data?.summary || data.content || JSON.stringify(data.data),
                        url: data.url,
                        timestamp: new Date(),
                        metadata: { ...data, verificationStatus: data.verificationStatus }
                    };
                    setContextItems(prev => [newItem, ...prev]);
                    setShowContext(true);
                }
                if (data.suggestions && Array.isArray(data.suggestions)) {
                    setSuggestions(data.suggestions.map((s: any, i: number) => ({
                        id: Date.now() + i + '_sugg',
                        type: s.category === 'News' ? 'news' : 'question',
                        text: s.text,
                        category: s.category || 'Général'
                    })).slice(0, 3));
                }
            } catch (e) { console.error(e); }
        }
    }
  }, [gemini.messages, gemini.connectionState]);

  // Theme Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'THEME_CHANGE' && event.data.theme) {
        const theme = event.data.theme;
        const root = document.documentElement;
        
        // Helper to apply colors
        const applyColor = (key: string, value: string) => {
            if (value) root.style.setProperty(key, value);
        };

        if (theme.colors) {
            applyColor('--theme-primary', theme.colors.primary);
            applyColor('--theme-secondary', theme.colors.secondary);
            applyColor('--theme-surface', theme.colors.surface);
            applyColor('--theme-surface-light', theme.colors.surfaceLight);
            applyColor('--theme-text', theme.colors.text);
            applyColor('--theme-accent', theme.colors.accent);
        }
        
        if (theme.styles) {
            applyColor('--theme-backdrop-filter', theme.styles.backdropFilter || 'none');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Global Animated Background with Theme Variables
  const Background = () => (
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 animated-bg opacity-40"></div>
          {/* Dynamic Theme Gradients */}
          <div className="absolute top-0 left-0 w-full h-full emma-bg-gradient-top"></div>
          <div className="absolute bottom-0 right-0 w-full h-full emma-bg-gradient-bottom"></div>
      </div>
  );

  // Mode Rendering Logic
  const renderMode = () => {
    if (!appMode) return <ModeSelector onSelect={handleModeSelect} onOpenDevGuide={() => setShowDevGuide(true)} onOpenGallery={() => setShowGallery(true)} customImages={customImages} />;
    
    const openGallery = () => setShowGallery(true);

    if (appMode === 'text-chat') return <TextChatMode onBack={handleBackToMenu} avatarImage={customImages['finance']} onOpenGallery={openGallery} />;
    if (appMode === 'letter-writer') return <WriterMode onBack={handleBackToMenu} avatarImage={customImages['writer']} onOpenGallery={openGallery} />;
    if (appMode === 'researcher') return <><NotificationCenter /><ResearcherMode onBack={handleBackToMenu} avatarImage={customImages['researcher']} onOpenGallery={openGallery} /></>;
    if (appMode === 'ceo-mode') return <CeoMode onBack={handleBackToMenu} onInjectPrompt={setCeoPrompt} avatarImage={customImages['ceo']} onOpenGallery={openGallery} />;
    if (appMode === 'critic-mode') return <CriticMode onBack={handleBackToMenu} avatarImage={customImages['critic']} onOpenGallery={openGallery} />;
    if (appMode === 'technical-analyst') return <TechnicalMode onBack={handleBackToMenu} avatarImage={customImages['geek']} onOpenGallery={openGallery} />;
    if (appMode === 'tavus-video') return <TavusMode onBack={handleBackToMenu} config={configs ? configs['tavus'] : undefined} avatarImage={customImages['tavus']} onOpenGallery={openGallery} />;

    // Avatar/Hybrid Mode
    return (
        <div className="min-h-screen flex flex-col md:flex-row relative">
            <main className="flex-1 flex flex-col relative h-[60vh] md:h-screen transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4">
                        <button onClick={handleBackToMenu} className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-white/10 backdrop-blur transition-colors">← Menu</button>
                        <button 
                            onClick={() => setShowIntroVideo(true)} 
                            className="group flex items-center gap-2 text-xs bg-blue-600/80 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg border border-white/20 backdrop-blur transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                            title="Voir la vidéo de présentation Emma IA"
                        >
                            <Video className="w-3.5 h-3.5" /> 
                            <span>Présentation</span>
                        </button>
                    </div>
                    <div className="flex flex-col items-end gap-2 pointer-events-auto">
                        <StatusBadge state={gemini.connectionState} temperature={avatarConfig.llmTemperature} latencyMs={24} isSpeaking={gemini.volume > 10} />
                        {gemini.connectionState === ConnectionState.CONNECTED && <SessionStats startTime={sessionStartTimeRef.current} stats={speakerStats} />}
                    </div>
                </div>

                {gemini.error && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 border border-red-400 text-white px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur-md shadow-xl animate-bounce">
                        <AlertCircle className="w-5 h-5" /> <span className="text-sm font-medium">{gemini.error}</span>
                    </div>
                )}

                <div className="flex-1 flex items-center justify-center pt-20 md:pt-0">
                    <AvatarView state={gemini.connectionState} volume={gemini.assistantVolume} config={avatarConfig} lastMessage={gemini.messages.slice().reverse().find(m => m.role === 'assistant')?.text || ""} />
                </div>

                <div className="relative z-30 pb-4 md:pb-8 flex flex-col items-center gap-4">
                    {/* Persona Selector Overlay for Live Mode */}
                    {gemini.connectionState !== ConnectionState.CONNECTED && (
                         <div className="mb-2 animate-in slide-in-from-bottom-4 fade-in">
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-2">Choisir l'Expert Vocal</div>
                             <PersonaSelector activeId={activePresetId} onSelect={setActivePresetId} className="bg-slate-900/60 p-2 rounded-2xl backdrop-blur-md border border-white/10" />
                         </div>
                    )}
                    
                    {gemini.connectionState === ConnectionState.CONNECTED && suggestions.length > 0 && (
                        <SmartSuggestions suggestions={suggestions} onSelect={(s) => { gemini.sendText(s.text); setSuggestions(prev => prev.filter(p => p.id !== s.id)); }} />
                    )}
                    <QuickActions actions={quickActions} onAction={(cmd) => cmd === 'OPEN_EMAIL_MODAL' ? setShowEmailModal(true) : gemini.sendText(`[ACTION]: ${cmd}`)} onUpdateActions={setQuickActions} />
                    <ControlBar state={gemini.connectionState} onConnect={handleConnect} onDisconnect={handleDisconnect} onEmail={() => setShowEmailModal(true)} onOpenAdmin={() => setShowAdmin(true)} onToggleInsights={() => setShowContext(!showContext)} showInsights={showContext} />
                    
                    {/* Hidden trigger for reconnection logic */}
                    <button id="connect-btn-trigger" className="hidden" onClick={handleConnect} aria-label="Connect" title="Connect"></button>
                </div>
            </main>

            <aside className="hidden md:flex flex-row h-screen z-20">
                <div className="w-80 border-l border-white/5 bg-slate-950/80 backdrop-blur-xl flex flex-col h-full shadow-2xl">
                    <div className="flex-1 overflow-hidden p-4"><ChatInterface messages={gemini.messages} /></div>
                </div>
                {showContext && <ContextPanel personalityData={personalityData} contextItems={contextItems} isLoading={isAnalyzing} />}
            </aside>
        </div>
    );
  };

  return (
    <>
      <Background />
      {showAdmin && <AdminPanel config={avatarConfig} onSave={setAvatarConfig} onClose={() => setShowAdmin(false)} />}
      {showDevGuide && <DeveloperGuide onClose={() => setShowDevGuide(false)} />}
      {showMap && <EcosystemMap onClose={() => setShowMap(false)} />}
      {showGallery && <AvatarGalleryModal onClose={() => setShowGallery(false)} onSelect={(section, url) => setCustomImages({...customImages, [section]: url})} />}
      {showEmailModal && <EmailInputModal onClose={() => setShowEmailModal(false)} onProcess={(text) => { setShowEmailModal(false); gemini.sendText(`[ANALYSE CE COURRIEL]: ${text}`); }} />}

      {showIntroVideo && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] border border-white/10 animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
                      <div className="bg-black/40 backdrop-blur px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                          <Video className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-white tracking-widest uppercase">Emma IA Presentation</span>
                      </div>
                      <button 
                          onClick={() => setShowIntroVideo(false)}
                          className="pointer-events-auto p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-all border border-white/10 group active:scale-90"
                          title="Fermer la vidéo"
                          aria-label="Fermer"
                      >
                          <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                      </button>
                  </div>
                  <iframe 
                      width="100%" 
                      height="100%" 
                      src="https://app.heygen.com/embedded-player/5738e23b0cd747b7b934ca31546b9e41" 
                      title="HeyGen video player" 
                      frameBorder="0" 
                      allow="encrypted-media; fullscreen;" 
                      allowFullScreen
                      className="w-full h-full"
                  ></iframe>
              </div>
          </div>
      )}

      {renderMode()}
      
      {/* Debug / Context Indicator */}
      <div style={{ position: 'fixed', bottom: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', fontSize: '10px', borderRadius: '4px', zIndex: 9999, pointerEvents: 'none', opacity: 0.6 }}>
        FILE: emmaia/App.tsx
      </div>
    </>
  );
};

export default App;