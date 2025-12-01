import React, { useState, useEffect } from 'react';
import { AvatarConfig, SessionLog, SectionConfig } from '../types';
import { Save, Server, User, Cpu, AlertTriangle, Brain, Sliders, Globe, Clock, Link, Check, Smartphone, Mail, Layers } from 'lucide-react';
import { HEYGEN_AVATAR_ID, GEMINI_VOICES, PROFESSION_PRESETS, MODEL_FLASH, MODEL_PRO, AVATAR_IMAGES } from '../constants';
import { IntegrationService } from '../services/integrationService';
import { ConfigService } from '../services/configService';

interface AdminPanelProps {
  config: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<AvatarConfig>(config);
  const [activeTab, setActiveTab] = useState<'persona' | 'brain' | 'sections' | 'history' | 'integration'>('persona');
  const [history, setHistory] = useState<SessionLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Section Config State
  const [selectedSection, setSelectedSection] = useState<string>('ceo');
  const [sectionConfig, setSectionConfig] = useState<SectionConfig | null>(null);

  const integrationService = new IntegrationService(config.integrationConfig);
  const configService = new ConfigService(config.integrationConfig);

  useEffect(() => {
    if (activeTab === 'history') {
        setLoadingHistory(true);
        integrationService.getHistory().then(data => {
            setHistory(data);
            setLoadingHistory(false);
        });
    }
  }, [activeTab]);

  useEffect(() => {
      // Load specific section config when tab or selection changes
      if (activeTab === 'sections') {
          const loaded = configService.getConfig(selectedSection);
          setSectionConfig(loaded);
      }
  }, [activeTab, selectedSection]);

  const handleSave = async () => {
    onSave(localConfig);
    
    // Save section config if modified
    if (sectionConfig) {
        await configService.saveConfig(sectionConfig);
    }
    
    onClose();
  };

  const loadPreset = (presetId: string) => {
    const preset = PROFESSION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setLocalConfig(prev => ({
        ...prev,
        systemInstruction: preset.systemPrompt,
        heygenAvatarId: preset.avatarId,
        geminiVoice: preset.voiceName
    }));
  };

  const getAvatarPreview = (id: string) => {
      switch(id) {
          case 'finance': return AVATAR_IMAGES.professional; 
          case 'economy': return AVATAR_IMAGES.professional; 
          case 'politics': return AVATAR_IMAGES.professional; 
          case 'researcher': return AVATAR_IMAGES.professional;
          default: return AVATAR_IMAGES.professional;
      }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
        activeTab === id 
          ? 'border-blue-500 text-blue-400 bg-slate-800/80' 
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <Server className="w-5 h-5 text-blue-500" />
              Console Administration
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Financial Grade • V2.2 Enterprise</p>
          </div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
               Annuler
             </button>
             <button 
               onClick={handleSave}
               className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 text-sm"
             >
               <Save className="w-4 h-4" /> Appliquer
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto bg-slate-900/50 custom-scrollbar">
          <TabButton id="persona" label="Persona Hub" icon={User} />
          <TabButton id="brain" label="Cerveau (LLM)" icon={Brain} />
          <TabButton id="sections" label="Configuration par Section" icon={Layers} />
          <TabButton id="history" label="Historique" icon={Clock} />
          <TabButton id="integration" label="Intégrations" icon={Link} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-900 custom-scrollbar">
          
          {/* SECTIONS CONFIGURATION (NEW) */}
          {activeTab === 'sections' && sectionConfig && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                      {['ceo', 'critic', 'finance', 'researcher', 'writer', 'tavus'].map(s => (
                          <button 
                            key={s}
                            onClick={() => setSelectedSection(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider border transition-all ${
                                selectedSection === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                              {s}
                          </button>
                      ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                          <h3 className="text-white font-bold flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-purple-400" /> Paramètres Section: {selectedSection.toUpperCase()}
                          </h3>
                          
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Nom Affiché</label>
                              <input 
                                  value={sectionConfig.name}
                                  onChange={e => setSectionConfig({...sectionConfig, name: e.target.value})}
                                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Avatar ID (HeyGen/Tavus)</label>
                              <input 
                                  value={sectionConfig.avatarId}
                                  onChange={e => setSectionConfig({...sectionConfig, avatarId: e.target.value})}
                                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-mono"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Voix (Gemini/Tavus)</label>
                              <select 
                                  value={sectionConfig.voiceName}
                                  onChange={e => setSectionConfig({...sectionConfig, voiceName: e.target.value})}
                                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                              >
                                  {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                  <option value="natural">Natural (Tavus)</option>
                              </select>
                          </div>
                          <div>
                             <label className="text-xs text-slate-400 block mb-1">Température ({sectionConfig.temperature})</label>
                             <input 
                                 type="range" min="0" max="2" step="0.1"
                                 value={sectionConfig.temperature}
                                 onChange={e => setSectionConfig({...sectionConfig, temperature: parseFloat(e.target.value)})}
                                 className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                             />
                          </div>
                      </div>

                      <div className="lg:col-span-2">
                          <label className="text-xs text-slate-400 block mb-2">System Prompt (Spécifique à cette section)</label>
                          <textarea 
                              value={sectionConfig.systemPrompt}
                              onChange={e => setSectionConfig({...sectionConfig, systemPrompt: e.target.value})}
                              className="w-full h-96 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-300 leading-relaxed custom-scrollbar focus:border-blue-500 outline-none"
                              spellCheck={false}
                          />
                      </div>
                  </div>
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30 text-xs text-blue-200 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Les modifications sauvegardées ici seront persistées dans la base de données Supabase (Table: section_configs).
                  </div>
              </div>
          )}

          {/* PERSONA HUB */}
          {activeTab === 'persona' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
                {PROFESSION_PRESETS.map(preset => (
                    <div 
                        key={preset.id} 
                        onClick={() => loadPreset(preset.id)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] group relative overflow-hidden flex flex-col ${
                            localConfig.geminiVoice === preset.voiceName 
                            ? "border-blue-500 bg-blue-900/10" 
                            : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                        }`}
                    >
                        {localConfig.geminiVoice === preset.voiceName && (
                            <div className="absolute top-0 right-0 p-2 bg-blue-600 rounded-bl-xl shadow-lg">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4 mb-4 text-center">
                            <div className="w-20 h-20 rounded-full border-2 border-slate-600 overflow-hidden shadow-lg group-hover:border-blue-400 transition-colors">
                                <img 
                                    src={getAvatarPreview(preset.id)} 
                                    alt={preset.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors text-lg leading-tight">{preset.name}</h3>
                                <p className="text-xs text-slate-400 mt-1">{preset.role}</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 mb-4 flex-1">
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {preset.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50 w-full">
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <User className="w-3 h-3" /> {preset.avatarId.split('-')[0]}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> {preset.voiceName}
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
              <div className="animate-in fade-in space-y-4">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-white">Historique des Sessions</h3>
                      {loadingHistory && <div className="text-xs text-blue-400 animate-pulse">Chargement...</div>}
                  </div>
                  
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700 overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/50 text-slate-400 font-medium uppercase text-xs">
                              <tr>
                                  <th className="px-6 py-3">Date</th>
                                  <th className="px-6 py-3">Durée</th>
                                  <th className="px-6 py-3">Résumé</th>
                                  <th className="px-6 py-3">Sentiment</th>
                                  <th className="px-6 py-3">Messages</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                              {history.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                          {new Date(log.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4">{log.duration}</td>
                                      <td className="px-6 py-4 max-w-xs truncate">{log.summary}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                              log.sentiment === 'Positive' ? 'bg-green-500/20 text-green-400' :
                                              log.sentiment === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                              'bg-slate-500/20 text-slate-400'
                                          }`}>
                                              {log.sentiment}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">{log.messageCount}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* INTEGRATION TAB */}
          {activeTab === 'integration' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                  <div className="space-y-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                          <Link className="w-4 h-4 text-green-500" /> Supabase (Database)
                      </h3>
                      <div className="space-y-3">
                          <input 
                              type="text" 
                              placeholder="Supabase URL"
                              value={localConfig.integrationConfig.supabaseUrl}
                              onChange={(e) => setLocalConfig({...localConfig, integrationConfig: {...localConfig.integrationConfig, supabaseUrl: e.target.value}})}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-green-500 outline-none"
                          />
                          <input 
                              type="password" 
                              placeholder="Supabase Anon Key"
                              value={localConfig.integrationConfig.supabaseKey}
                              onChange={(e) => setLocalConfig({...localConfig, integrationConfig: {...localConfig.integrationConfig, supabaseKey: e.target.value}})}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-green-500 outline-none"
                          />
                      </div>
                  </div>
              </div>
          )}

          {/* BRAIN TAB (Original) */}
          {activeTab === 'brain' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                   <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700">
                     <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Cpu className="w-4 h-4" /> Modèle & Créativité
                     </h3>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-medium text-slate-400 mb-2">Modèle Actif</label>
                           <select 
                             value={localConfig.llmModel}
                             onChange={(e) => setLocalConfig({...localConfig, llmModel: e.target.value})}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-white"
                           >
                             <option value={MODEL_FLASH}>Gemini 2.5 Flash</option>
                             <option value={MODEL_PRO}>Gemini 2.0 Pro</option>
                           </select>
                        </div>
                         <div>
                           <label className="block text-xs font-medium text-slate-400 mb-2">Voix Gemini</label>
                           <select 
                             value={localConfig.geminiVoice}
                             onChange={(e) => setLocalConfig({...localConfig, geminiVoice: e.target.value})}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-white"
                           >
                             {GEMINI_VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-slate-400 mb-2 flex justify-between">
                             <span>Température</span>
                             <span className="text-blue-400 font-mono">{localConfig.llmTemperature}</span>
                           </label>
                           <input 
                             type="range" min="0" max="2" step="0.1"
                             value={localConfig.llmTemperature}
                             onChange={(e) => setLocalConfig({...localConfig, llmTemperature: parseFloat(e.target.value)})}
                             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                           />
                        </div>
                     </div>
                   </div>
                </div>
                <div className="lg:col-span-2 bg-slate-800/40 p-5 rounded-xl border border-slate-700 flex flex-col h-full">
                   <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Brain className="w-4 h-4" /> System Instructions (Défaut)
                   </h3>
                   <textarea 
                     value={localConfig.systemInstruction}
                     onChange={(e) => setLocalConfig({...localConfig, systemInstruction: e.target.value})}
                     className="flex-1 w-full bg-slate-950/50 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-300 focus:border-blue-500 outline-none resize-none leading-relaxed"
                     spellCheck={false}
                   />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};