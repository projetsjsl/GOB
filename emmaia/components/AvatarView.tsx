import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ConnectionState, AvatarConfig } from '../types';
import { HeyGenService } from '../services/heygenService';
import { AkoolService } from '../services/akoolService';
import { RefreshCw, Play, Mic, ShieldCheck, Zap, MessageSquareText, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { AVATAR_IMAGES } from '../constants';

interface AvatarViewProps {
  state: ConnectionState;
  volume: number;
  config: AvatarConfig;
  lastMessage: string;
}

export const AvatarView: React.FC<AvatarViewProps> = ({ state, volume, config, lastMessage }) => {
  const isConnected = state === ConnectionState.CONNECTED;
  
  // Refs for video elements
  const heygenVideoRef = useRef<HTMLVideoElement>(null);
  const akoolVideoRef = useRef<HTMLVideoElement>(null);

  // Services
  const heygenRef = useRef<HeyGenService | null>(null);
  const akoolRef = useRef<AkoolService | null>(null);

  // Status & Errors
  const [heygenStatus, setHeygenStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [heygenError, setHeygenError] = useState<string | null>(null);

  const [akoolStatus, setAkoolStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [akoolError, setAkoolError] = useState<string | null>(null);

  // Speaking Logic
  const isSpeaking = volume > 10;

  // Trigger Speaking when new message arrives and status is active
  useEffect(() => {
    if (!lastMessage || !isConnected) return;
    
    // Send to HeyGen if active
    if (heygenStatus === 'active' && heygenRef.current) {
        heygenRef.current.speak(lastMessage).catch(e => console.error("HeyGen Speak Error:", e));
    }

    // Send to Akool if active
    if (akoolStatus === 'active' && akoolRef.current) {
        akoolRef.current.speak(lastMessage).catch(e => console.error("Akool Speak Error:", e));
    }
  }, [lastMessage, isConnected, heygenStatus, akoolStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      heygenRef.current?.close();
      akoolRef.current?.close();
    };
  }, []);

  // Initialize HeyGen with Configured Options
  const startHeyGen = async () => {
    if (!config.heygenToken) {
        setHeygenStatus('error');
        setHeygenError("Token HeyGen manquant dans la configuration.");
        return;
    }
    
    try {
      setHeygenStatus('loading');
      setHeygenError(null); // Clear previous errors
      
      heygenRef.current = new HeyGenService(
          config.heygenToken, 
          config.heygenAvatarId, 
          config.heygenQuality,
          config.heygenEmotion,
          config.heygenRemoveBackground
      );
      
      if (heygenVideoRef.current) {
        await heygenRef.current.startSession(heygenVideoRef.current);
        setHeygenStatus('active');
        heygenVideoRef.current.play().catch(e => {
            console.error("Video Play Error:", e);
            setHeygenStatus('error');
            setHeygenError("Lecture vidéo bloquée (Autoplay policy ?)");
        });
      }
    } catch (e: any) {
      console.error(e);
      setHeygenStatus('error');
      setHeygenError(e.message || "Erreur d'initialisation HeyGen");
    }
  };

  // Initialize Akool
  const startAkool = async () => {
    if (!config.akoolToken) {
        setAkoolStatus('error');
        setAkoolError("Token Akool manquant dans la configuration.");
        return;
    }

    try {
      setAkoolStatus('loading');
      setAkoolError(null);

      akoolRef.current = new AkoolService(config.akoolToken);
      if (akoolVideoRef.current) {
        await akoolRef.current.startSession(akoolVideoRef.current);
        setAkoolStatus('active');
      }
    } catch (e: any) {
      console.error(e);
      setAkoolStatus('error');
      setAkoolError(e.message || "Erreur d'initialisation Akool");
    }
  };

  // Handle Video Element Errors (Stream issues)
  const handleVideoError = (provider: 'HeyGen' | 'Akool') => {
      const msg = `Erreur de flux vidéo ${provider} (Codec/Réseau)`;
      console.error(msg);
      if (provider === 'HeyGen') {
          setHeygenStatus('error');
          setHeygenError(msg);
      } else {
          setAkoolStatus('error');
          setAkoolError(msg);
      }
  };

  const shouldShowHeyGen = config.activeProvider === 'both' || config.activeProvider === 'heygen';
  const shouldShowAkool = config.activeProvider === 'both' || config.activeProvider === 'akool';
  const isSplit = config.activeProvider === 'both';

  const AvatarPane = ({ 
    type, 
    videoRef, 
    status, 
    errorMsg,
    onStart, 
    hasToken, 
    avatarId,
    details,
    isActiveSpeaker
  }: { 
    type: 'HeyGen' | 'Akool', 
    videoRef: React.RefObject<HTMLVideoElement | null>, 
    status: string, 
    errorMsg: string | null,
    onStart: () => void, 
    hasToken: boolean,
    avatarId: string,
    details?: string,
    isActiveSpeaker: boolean
  }) => (
    <div className={clsx(
      "relative flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-all duration-500 shadow-2xl group",
      isSplit ? "w-full h-full" : "w-full max-w-3xl aspect-video",
      // Active Speaker Glow Effect
      isActiveSpeaker 
        ? "border-2 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50 scale-[1.01]" 
        : "border border-slate-700/50 opacity-90 scale-100"
    )}>
      
      {/* Video Layer */}
      <video 
        ref={videoRef} 
        className={clsx(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            status === 'active' ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        autoPlay 
        playsInline 
        onError={() => handleVideoError(type)}
      />

      {/* Status Overlay (Top Left) */}
      {status === 'active' && (
         <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <div className={clsx("px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm flex items-center gap-1 w-fit transition-all duration-300", 
                isActiveSpeaker ? "bg-green-600 scale-105" : (type === 'HeyGen' ? "bg-blue-600/80" : "bg-purple-600/80"))}>
                {isActiveSpeaker ? <Mic className="w-3 h-3 animate-pulse" /> : <Zap className="w-3 h-3 text-slate-300" />}
                {type} {isActiveSpeaker ? 'PARLE' : 'LIVE'}
            </div>
            {details && (
                <div className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 bg-black/50 backdrop-blur w-fit border border-white/10">
                    {details}
                </div>
            )}
         </div>
      )}

      {/* Placeholder / Controls Layer */}
      <div className={clsx(
          "relative z-10 flex flex-col items-center justify-center text-center p-6 transition-all duration-500",
          status === 'active' ? "opacity-0 hover:opacity-100 bg-black/60 w-full h-full backdrop-blur-sm" : "opacity-100"
      )}>
        
        {/* Avatar Circle Image (Only if not active) */}
        {status !== 'active' && (
            <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full mb-6 border-4 border-slate-700/50 shadow-2xl overflow-hidden relative"
                style={{ transform: `scale(${1 + (volume / 500)})` }}
            >
                <img 
                    src={AVATAR_IMAGES.professional}
                    alt={type}
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                />
            </div>
        )}

        <h3 className="text-2xl font-light text-slate-200 mb-1 tracking-tight">{type} AI Avatar</h3>
        <p className="text-xs text-slate-500 font-mono mb-6 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {avatarId}
        </p>
        
        <div className="space-y-4 max-w-md mx-auto">
            {status === 'loading' && (
            <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-xs text-blue-300 font-medium">Initialisation Secure Stream...</span>
            </div>
            )}
            
            {status === 'error' && (
                <div className="flex flex-col items-center bg-red-950/40 p-4 rounded-xl border border-red-500/30 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-bold">Échec de connexion</span>
                    </div>
                    <p className="text-xs text-red-300/80 mb-3 text-center leading-relaxed">
                        {errorMsg || "Une erreur inconnue est survenue lors de l'établissement du flux."}
                    </p>
                    <button 
                        onClick={onStart} 
                        className="px-4 py-1.5 bg-red-900/50 hover:bg-red-800/50 border border-red-700 text-red-200 text-xs rounded-lg transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                </div>
            )}

            {status === 'idle' && (
            hasToken ? (
                <button 
                onClick={onStart}
                className={clsx(
                    "flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl border border-white/10",
                    type === 'HeyGen' 
                        ? "bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500" 
                        : "bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500"
                )}
                >
                <Play className="w-4 h-4 fill-current" /> Activer Stream
                </button>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
                        <AlertCircle className="w-3 h-3 text-orange-400" /> Token Requis (Voir Admin)
                    </div>
                </div>
            )
            )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 relative">
      
      {/* Visual Explanation of Operation (Top Center) when in Split Mode */}
      {isSplit && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
             <Info className="w-4 h-4 text-blue-400" />
             <span className="text-xs text-slate-200 font-medium tracking-wide">
                 <span className="text-blue-400">MODE DUO ACTIF :</span> Les deux avatars analysent et répondent simultanément.
             </span>
          </div>
      )}

      <div className={clsx(
          "w-full max-w-7xl transition-all duration-500",
          isSplit 
             ? "grid grid-cols-1 md:grid-cols-2 gap-6 h-[75vh]" 
             : "flex justify-center h-auto"
      )}>
        
        {shouldShowHeyGen && (
            <AvatarPane 
                type="HeyGen" 
                videoRef={heygenVideoRef} 
                status={heygenStatus} 
                errorMsg={heygenError}
                onStart={startHeyGen}
                hasToken={!!config.heygenToken}
                avatarId={config.heygenAvatarId}
                details={`${config.heygenQuality.toUpperCase()} • ${config.heygenEmotion}`}
                isActiveSpeaker={isSpeaking && (heygenStatus === 'active')}
            />
        )}

        {shouldShowAkool && (
            <AvatarPane 
                type="Akool" 
                videoRef={akoolVideoRef} 
                status={akoolStatus} 
                errorMsg={akoolError}
                onStart={startAkool}
                hasToken={!!config.akoolToken}
                avatarId={config.akoolAvatarId}
                details={`REGION: ${config.akoolRegion.toUpperCase()}`}
                isActiveSpeaker={isSpeaking && (akoolStatus === 'active')}
            />
        )}
      </div>

       {/* Duo Mode Footer Explanation */}
       {isSplit && isConnected && (
           <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-mono animate-pulse">
               <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Assistant Principal (HeyGen)</span>
               <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Backup (Akool)</span>
           </div>
       )}
    </div>
  );
};