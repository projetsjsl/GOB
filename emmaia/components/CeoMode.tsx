
import React, { useState } from 'react';
import { ArrowLeft, Building2, Image as ImageIcon, Sliders } from 'lucide-react';
import { CompanyInfo, AvatarConfig } from '../types';
import { CEO_SYSTEM_INSTRUCTION_TEMPLATE, MODEL_FLASH, DEFAULT_INTEGRATION_CONFIG, AKOOL_AVATAR_ID, MODE_STARTER_PROMPTS } from '../constants';
import { AvatarView } from './AvatarView';
import { useGeminiLive } from '../services/geminiLive';
import { ControlBar } from './ControlBar';

interface CeoModeProps {
  onBack: () => void;
  onInjectPrompt: (prompt: string) => void;
  avatarImage?: string;
  onOpenGallery?: () => void;
}

export const CeoMode: React.FC<CeoModeProps> = ({ onBack, onInjectPrompt, avatarImage, onOpenGallery }) => {
  const [step, setStep] = useState<'config' | 'live'>('config');
  const [company, setCompany] = useState<CompanyInfo>({ name: '', ticker: '', industry: '' });
  const gemini = useGeminiLive();
  const logoUrl = company.name ? `https://logo.clearbit.com/${company.name.replace(/\s+/g, '').toLowerCase()}.com` : '';

  const startSession = () => {
      const prompt = CEO_SYSTEM_INSTRUCTION_TEMPLATE.replace('{{COMPANY_NAME}}', company.name).replace('{{TICKER}}', company.ticker);
      onInjectPrompt(prompt);
      const config: AvatarConfig = {
          systemInstruction: prompt,
          llmModel: MODEL_FLASH,
          llmTemperature: 0.7,
          geminiVoice: 'Charon',
          activeProvider: 'heygen',
          heygenAvatarId: 'Tyler-incasualsuit-20220721',
          akoolAvatarId: AKOOL_AVATAR_ID,
          heygenQuality: 'high',
          heygenEmotion: 'Serious',
          heygenRemoveBackground: false,
          heygenToken: '', akoolToken: '', akoolRegion: 'us-west', akoolFaceEnhance: true, muteGeminiAudio: false, integrationConfig: DEFAULT_INTEGRATION_CONFIG, chatMode: 'solo'
      };
      gemini.connect(config);
      setStep('live');
  };

  const handleDisconnect = () => { gemini.disconnect(); setStep('config'); };
  const starterPrompts = MODE_STARTER_PROMPTS['ceo-mode'];

  if (step === 'config') {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-950 to-blue-900/20 animate-gradient-x"></div>
              {/* Back button in upper left corner */}
              <button onClick={onBack} className="absolute top-6 left-6 bg-white/5 hover:bg-white/10 p-3 rounded-full text-white border border-white/10 backdrop-blur transition-all z-10" title="Retour au menu">
                  <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-full max-w-lg bg-slate-900/60 border border-white/10 rounded-3xl p-10 shadow-2xl relative backdrop-blur-xl">
                  <div className="text-center mb-10">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner overflow-hidden backdrop-blur-md">
                          {company.name ? <img src={logoUrl} className="w-full h-full object-contain p-3" onError={(e) => (e.currentTarget.src = '')} /> : <Building2 className="w-10 h-10 text-cyan-400 opacity-50" />}
                      </div>
                      <h1 className="text-3xl font-bold text-white tracking-tight">CEO Simulator</h1>
                      <p className="text-sm text-cyan-200/60 mt-2">Simulation de haute fidélité. Entrez les paramètres.</p>
                  </div>
                  <div className="space-y-6">
                      <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Entreprise</label><input type="text" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white mt-2 focus:border-cyan-500 outline-none transition-all focus:bg-black/60" placeholder="Ex: Tesla Inc." /></div>
                      <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ticker</label><input type="text" value={company.ticker} onChange={e => setCompany({...company, ticker: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white mt-2 focus:border-cyan-500 outline-none font-mono transition-all focus:bg-black/60" placeholder="Ex: TSLA" /></div>
                      <button onClick={startSession} disabled={!company.name || !company.ticker} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-[1.02] text-white rounded-xl font-bold transition-all disabled:opacity-50 mt-6 shadow-xl shadow-cyan-900/20">Entrer dans la Board Room</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
      <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center filter blur-sm scale-110 animate-pulse-slow"></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950"></div>
          <div className="relative z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-6">
                  <button onClick={handleDisconnect} className="bg-white/5 hover:bg-white/10 p-3 rounded-full text-white border border-white/10 backdrop-blur transition-all"><ArrowLeft className="w-5 h-5" /></button>
                  <div className="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                      <img src={logoUrl} className="w-8 h-8 rounded bg-white p-1 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <div><h1 className="text-xl font-bold text-white leading-none">{company.name}</h1><div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300 mt-1 uppercase tracking-widest"><span>{company.ticker}</span> • <span className="text-green-400 animate-pulse">LIVE CONNECTED</span></div></div>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors backdrop-blur-md"><Sliders className="w-5 h-5 text-white" /></button>
                  {onOpenGallery && <button onClick={onOpenGallery} className="p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors backdrop-blur-md"><ImageIcon className="w-5 h-5 text-white" /></button>}
              </div>
          </div>
          <div className="flex-1 relative z-10 flex items-center justify-center">
              <AvatarView state={gemini.connectionState} volume={gemini.assistantVolume} config={{systemInstruction: "", llmModel: MODEL_FLASH, llmTemperature: 0.7, geminiVoice: 'Charon', heygenAvatarId: 'Tyler-incasualsuit-20220721', heygenQuality: 'high', heygenEmotion: 'Serious', activeProvider: 'heygen', heygenRemoveBackground: false, heygenToken: '', akoolToken: '', akoolAvatarId: '', akoolRegion: 'us-west', akoolFaceEnhance: false, muteGeminiAudio: false, integrationConfig: DEFAULT_INTEGRATION_CONFIG, chatMode: 'solo'}} lastMessage={gemini.messages.slice().reverse().find(m => m.role === 'assistant')?.text || ""} />
          </div>
          <div className="relative z-20 pb-10 flex flex-col items-center">
              <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar mb-4">
                  {starterPrompts?.map((prompt, i) => (
                      <button key={i} onClick={() => gemini.sendText(prompt)} className="whitespace-nowrap px-4 py-2 rounded-full bg-black/40 border border-white/10 text-xs text-white hover:bg-white/10 transition-all backdrop-blur-md">{prompt}</button>
                  ))}
              </div>
              <ControlBar state={gemini.connectionState} onConnect={() => gemini.connect({systemInstruction: CEO_SYSTEM_INSTRUCTION_TEMPLATE.replace('{{COMPANY_NAME}}', company.name).replace('{{TICKER}}', company.ticker), llmModel: MODEL_FLASH, llmTemperature: 0.7, geminiVoice: 'Charon', activeProvider: 'heygen', heygenToken: '', heygenAvatarId: 'Tyler-incasualsuit-20220721', heygenQuality: 'high', heygenEmotion: 'Serious', heygenRemoveBackground: false, akoolToken: '', akoolAvatarId: '', akoolRegion: 'us-west', akoolFaceEnhance: false, muteGeminiAudio: false, integrationConfig: DEFAULT_INTEGRATION_CONFIG, chatMode: 'solo'})} onDisconnect={handleDisconnect} onEmail={() => {}} onOpenAdmin={() => {}} onToggleInsights={() => {}} showInsights={false} />
              <div className="mt-4 text-[10px] text-white/30 uppercase tracking-widest">Propulsé par JSLAI partout</div>
          </div>
      </div>
  );
};
