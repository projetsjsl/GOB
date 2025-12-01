import React, { useState } from 'react';
import { ArrowLeft, Video, Mic, HeartHandshake, Image as ImageIcon } from 'lucide-react';
import { TavusService } from '../services/tavusService';
import { DEFAULT_TAVUS_REPLICA_ID, DEFAULT_TAVUS_PERSONA_NAME, DEFAULT_TAVUS_CONTEXT, AVATAR_IMAGES } from '../constants';

interface TavusModeProps {
  onBack: () => void;
  config?: any; // Config loaded from ConfigService
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const TavusMode: React.FC<TavusModeProps> = ({ onBack, config, avatarImage, onOpenGallery }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use config from Supabase or Fallback
  const replicaId = config?.avatarId || DEFAULT_TAVUS_REPLICA_ID;
  const personaName = config?.name || DEFAULT_TAVUS_PERSONA_NAME;
  const context = config?.systemPrompt || DEFAULT_TAVUS_CONTEXT;

  const service = new TavusService(replicaId, personaName, context);

  const handleStart = async () => {
      setIsPlaying(true);
      await service.startConversation();
  };

  const handleEnd = () => {
      service.endConversation();
      setIsPlaying(false);
      onBack();
  };

  return (
    <div className="h-screen w-full relative bg-[#F5F5F0] overflow-hidden flex flex-col items-center justify-center">
        
        {/* Background Atmosphere - Warm/Home */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1598520106830-8c45c2035460?q=80&w=2000&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-20 filter blur-sm scale-105"
                alt="Cozy Room" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F0] via-transparent to-[#F5F5F0] opacity-80"></div>
        </div>

        {/* Minimal Header */}
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
             <div className="flex gap-4">
                 <button 
                    onClick={handleEnd}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-600 rounded-full shadow-sm backdrop-blur transition-all hover:scale-105"
                 >
                     <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Retour</span>
                 </button>
             </div>
             
             <div className="flex items-center gap-4">
                 {onOpenGallery && (
                    <button 
                        onClick={onOpenGallery}
                        className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors shadow-sm"
                        title="Changer Avatar"
                    >
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                    </button>
                 )}
                 <div className="flex flex-col items-end">
                     <h2 className="text-xl font-serif text-slate-800 tracking-tight flex items-center gap-2">
                         <HeartHandshake className="w-5 h-5 text-rose-400" />
                         {personaName}
                     </h2>
                     <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Vidéo Native • Haute Empathie</p>
                 </div>
             </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full max-w-5xl aspect-video bg-white rounded-3xl shadow-2xl overflow-hidden ring-8 ring-white/50">
            {/* The Container where Tavus Daily.co iframe will inject */}
            <div id="tavus-container" className="w-full h-full bg-slate-100 flex items-center justify-center relative">
                
                {!isPlaying ? (
                    <div className="text-center p-10 animate-in fade-in zoom-in duration-700">
                        <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 shadow-xl border-4 border-white">
                            <img src={avatarImage || AVATAR_IMAGES.natural} className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-4xl font-serif text-slate-800 mb-4">Bonjour.</h1>
                        <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg font-light leading-relaxed">
                            Je suis Emma. Je suis ici pour discuter avec vous, comprendre vos besoins et réfléchir ensemble, en toute simplicité.
                        </p>
                        <button 
                            onClick={handleStart}
                            className="px-8 py-4 bg-rose-500 hover:bg-rose-400 text-white rounded-full font-bold shadow-lg shadow-rose-200 transition-all hover:scale-105 flex items-center gap-3 mx-auto"
                        >
                            <Video className="w-5 h-5" /> Démarrer la conversation
                        </button>
                    </div>
                ) : (
                    // In a real integration, the Daily.co iframe covers this. 
                    // This is a placeholder for the loading state before iframe loads.
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
                        <div className="w-16 h-16 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium animate-pulse">Connexion à Phoenix Engine...</p>
                    </div>
                )}

            </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center z-10 opacity-40">
            <p className="text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <Mic className="w-3 h-3" /> Propulsé par JSLAI partout
            </p>
        </div>
    </div>
  );
};