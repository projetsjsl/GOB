import React from 'react';
import { AppMode } from '../types';
import { MessageSquareText, Video, Mic2, FileText, Globe, Building2, Scale, Activity, ArrowRight, BrainCircuit, BookOpen, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { EcosystemMap } from './EcosystemMap';
import { AVATAR_IMAGES } from '../constants';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
  onOpenDevGuide: () => void;
  onOpenGallery: () => void;
  customImages: Record<string, string>;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, onOpenDevGuide, onOpenGallery, customImages }) => {
  const [showMap, setShowMap] = React.useState(false);

  const ModeCard = ({ mode, title, desc, icon: Icon, image, delay, filterClass }: any) => (
    <button 
      onClick={() => onSelect(mode)}
      className={clsx(
        "group relative h-80 rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] shadow-2xl border border-white/10 hover:border-white/30",
        delay
      )}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
          <img 
            src={image} 
            alt={title} 
            className={clsx("w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", filterClass)} 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('emma-avatar-new.jpg')) {
                 target.src = AVATAR_IMAGES.natural; // Fallback to known working image
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
             <Icon className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-blue-200 transition-colors">{title}</h3>
          <p className="text-sm text-slate-300 line-clamp-2 opacity-80 group-hover:opacity-100 mb-4 font-light">
            {desc}
          </p>
          
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
             Commencer <ArrowRight className="w-3 h-3" />
          </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen relative flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar">
      {showMap && <EcosystemMap onClose={() => setShowMap(false)} />}
      
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-12 animate-in fade-in slide-in-from-top-10 duration-1000 mt-8 max-w-7xl mx-auto w-full">
        <div className="text-center md:text-left mb-6 md:mb-0">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-slate-400 mb-2 tracking-tighter">
            Emma IA
            </h1>
            <p className="text-lg text-blue-200/60 font-light max-w-xl">
            Plateforme d'Intelligence Financière Multimodale
            </p>
        </div>
        
        <div className="flex gap-4">
             <button 
                onClick={onOpenGallery}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-105 group"
             >
                 <ImageIcon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                 <span className="text-sm font-medium text-slate-200">Galerie</span>
             </button>

             <button 
                onClick={onOpenDevGuide}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-105 group"
             >
                 <BookOpen className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                 <span className="text-sm font-medium text-slate-200">Guide</span>
             </button>

             <button 
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all hover:scale-105 group"
             >
                 <BrainCircuit className="w-5 h-5 text-blue-400 group-hover:rotate-180 transition-transform duration-700" />
                 <span className="text-sm font-medium text-slate-200">Architecture</span>
             </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-7xl mx-auto pb-12">
        
        {/* 1. Chat Expert */}
        <ModeCard 
          mode="text-chat"
          title="Chat Expert"
          desc="Analyse textuelle profonde avec Gemini 2.0 Pro."
          icon={MessageSquareText}
          image={customImages['finance'] || AVATAR_IMAGES.chat}
          delay="animate-in fade-in slide-in-from-bottom-4 duration-700"
          filterClass="grayscale group-hover:grayscale-0"
        />

        {/* 2. Live Vocal */}
        <ModeCard 
          mode="avatar-hybrid"
          title="Live Vocal"
          desc="Communication vocale avec HeyGen & Akool."
          icon={Mic2}
          image={customImages['finance'] || AVATAR_IMAGES.vocal}
          delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
          filterClass="grayscale-0"
        />

        {/* Tavus */}
        <ModeCard 
          mode="tavus-video"
          title="Emma Naturelle"
          desc="Vidéo native bidirectionnelle. Empathie maximale."
          icon={Video}
          image={customImages['tavus'] || AVATAR_IMAGES.natural}
          delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
          filterClass="grayscale-0 contrast-110"
        />

        {/* 3. CEO Simulator */}
        <ModeCard 
            mode="ceo-mode"
            title="CEO Simulator"
            desc="Simulez une rencontre avec un dirigeant d'entreprise."
            icon={Building2}
            image={customImages['ceo'] || AVATAR_IMAGES.ceo}
            delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
            filterClass="grayscale group-hover:grayscale-0"
        />

        {/* 4. Recherchiste */}
        <ModeCard 
            mode="researcher"
            title="Recherchiste"
            desc="Veille stratégique 24/7 et alertes marchés."
            icon={Globe}
            image={customImages['researcher'] || AVATAR_IMAGES.researcher}
            delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400"
            filterClass="sepia-[.3] group-hover:sepia-0"
        />

        {/* Rédactrice */}
        <ModeCard 
            mode="letter-writer"
            title="Rédactrice"
            desc="Création collaborative de documents financiers."
            icon={FileText}
            image={customImages['writer'] || AVATAR_IMAGES.writer}
            delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500"
            filterClass="grayscale contrast-125"
        />

        {/* 5. L'Avocat du Diable */}
        <ModeCard 
            mode="critic-mode"
            title="L'Avocat du Diable"
            desc="Challengez vos idées avec une critique impitoyable."
            icon={Scale}
            image={customImages['critic'] || AVATAR_IMAGES.critic}
            delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600"
            filterClass="grayscale contrast-150 brightness-75"
        />

        {/* Emma Geek */}
        <ModeCard 
            mode="technical-analyst"
            title="Emma Geek"
            desc="Analyse technique pure. RSI, MACD, Patterns."
            icon={Activity}
            image={customImages['geek'] || AVATAR_IMAGES.geek}
            delay="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700"
            filterClass="grayscale-0"
        />

      </div>
      
      <div className="mt-auto text-center pb-6 opacity-40">
        <p className="text-[10px] uppercase tracking-widest font-mono">Propulsé par JSLAI partout</p>
      </div>
    </div>
  );
};