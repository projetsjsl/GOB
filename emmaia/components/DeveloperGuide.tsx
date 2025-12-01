import React, { useState } from 'react';
import { X, BookOpen, Code, Key, Layout, Layers, Box, AlertTriangle } from 'lucide-react';

interface DeveloperGuideProps {
  onClose: () => void;
}

export const DeveloperGuide: React.FC<DeveloperGuideProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const SectionBtn = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveSection(id)}
        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all ${
            activeSection === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
          <Icon className="w-4 h-4" /> {label}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-6xl h-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden ring-1 ring-white/10">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col">
              <div className="mb-6 px-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" /> Guide Dev
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Emma IA Enterprise v2.5</p>
              </div>
              <nav className="space-y-1 flex-1">
                  <SectionBtn id="overview" label="Vue d'ensemble" icon={Layers} />
                  <SectionBtn id="setup" label="Configuration & Clés" icon={Key} />
                  <SectionBtn id="integration" label="Intégration Web (iFrame)" icon={Layout} />
                  <SectionBtn id="structure" label="Architecture Code" icon={Code} />
                  <SectionBtn id="models" label="Modèles LLM 2025" icon={Box} />
              </nav>
              <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-600 px-2">
                  Documentation générée automatiquement.
              </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col relative bg-slate-900">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white z-10">
                  <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  
                  {activeSection === 'overview' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <h1 className="text-3xl font-bold text-white mb-2">Emma IA Enterprise Platform</h1>
                          <p className="text-lg text-slate-400 leading-relaxed">
                              Une suite d'assistants virtuels financiers de nouvelle génération utilisant les technologies multimodales de Google Gemini 2.5.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                  <h3 className="text-blue-400 font-bold mb-2">Cerveau Central</h3>
                                  <p className="text-sm text-slate-300">
                                      Propulsé par <strong>Gemini 2.5 Flash Live</strong> (Bidirectionnel) pour la voix et <strong>Gemini 2.0 Pro</strong> pour le raisonnement textuel complexe.
                                  </p>
                              </div>
                              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                  <h3 className="text-purple-400 font-bold mb-2">Moteurs d'Avatar</h3>
                                  <p className="text-sm text-slate-300">
                                      Support hybride pour <strong>HeyGen Streaming API v2</strong> (WebRTC Interactive) et <strong>Akool</strong>, ainsi qu'une intégration vidéo native via <strong>Tavus Phoenix</strong>.
                                  </p>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeSection === 'setup' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <h2 className="text-2xl font-bold text-white">Requis de Configuration</h2>
                          
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-green-400 overflow-x-auto">
                              # .env (à la racine) <br/><br/>
                              API_KEY=AIzaSy... (Google Gemini API Key)<br/>
                              <br/>
                              # Optionnels (Configurables aussi via UI Admin)<br/>
                              HEYGEN_API_TOKEN=...<br/>
                              AKOOL_API_TOKEN=...<br/>
                              TAVUS_API_KEY=...
                          </div>

                          <div className="space-y-4 text-sm text-slate-300">
                              <h3 className="text-white font-bold text-lg">Liste de contrôle de déploiement</h3>
                              <ul className="list-disc pl-5 space-y-2">
                                  <li>Vérifier que le domaine est autorisé dans la Google Cloud Console (CORS).</li>
                                  <li>Activer l'API <strong>Vertex AI</strong> ou <strong>Google AI Studio</strong>.</li>
                                  <li>Pour HeyGen: S'assurer d'avoir un plan "Enterprise" pour l'accès Streaming API.</li>
                                  <li>Pour Tavus: Vérifier la création d'un "Replica" valide via leur dashboard.</li>
                              </ul>
                          </div>
                      </div>
                  )}

                  {activeSection === 'integration' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <h2 className="text-2xl font-bold text-white">Guide d'Intégration Web</h2>
                          <p className="text-slate-400">
                              L'application est conçue pour être "Responsive-First" et fonctionne parfaitement dans un conteneur iFrame ou en tant que SPA autonome.
                          </p>

                          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/30">
                              <h3 className="text-white font-bold mb-4">Code d'intégration (iFrame)</h3>
                              <div className="bg-black p-4 rounded text-xs font-mono text-slate-300">
                                  &lt;iframe <br/>
                                  &nbsp;&nbsp;src="https://emma-ia-enterprise.vercel.app" <br/>
                                  &nbsp;&nbsp;width="100%" <br/>
                                  &nbsp;&nbsp;height="800px" <br/>
                                  &nbsp;&nbsp;allow="microphone; camera; autoplay; clipboard-write" <br/>
                                  &nbsp;&nbsp;style="border:none; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);"<br/>
                                  &gt;&lt;/iframe&gt;
                              </div>
                              <p className="mt-4 text-xs text-yellow-500 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Important: L'attribut <code>allow="microphone"</code> est critique pour le fonctionnement vocal.
                              </p>
                          </div>
                      </div>
                  )}

                  {activeSection === 'models' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <h2 className="text-2xl font-bold text-white">Matrice des Modèles (Standards 2025)</h2>
                          
                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm text-slate-400">
                                  <thead className="bg-slate-800 text-slate-200 uppercase text-xs font-bold">
                                      <tr>
                                          <th className="p-4">ID Modèle</th>
                                          <th className="p-4">Type</th>
                                          <th className="p-4">Latence</th>
                                          <th className="p-4">Cas d'usage</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800">
                                      <tr>
                                          <td className="p-4 font-mono text-blue-400">gemini-2.5-flash-native-audio...</td>
                                          <td className="p-4"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs uppercase">Bidirectionnel</span></td>
                                          <td className="p-4">~300ms</td>
                                          <td className="p-4">Avatars Vocaux, Interruption Temps Réel</td>
                                      </tr>
                                      <tr>
                                          <td className="p-4 font-mono text-purple-400">gemini-2.0-pro-exp-02-05</td>
                                          <td className="p-4"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs uppercase">Directionnel</span></td>
                                          <td className="p-4">~1.5s</td>
                                          <td className="p-4">Raisonnement complexe, Rédaction financière</td>
                                      </tr>
                                      <tr>
                                          <td className="p-4 font-mono text-yellow-400">gemini-2.5-flash-thinking</td>
                                          <td className="p-4"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs uppercase">Directionnel</span></td>
                                          <td className="p-4">~3s+</td>
                                          <td className="p-4">Analyse profonde, Chain of Thought (CoT)</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};