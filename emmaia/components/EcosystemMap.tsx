import React from 'react';
import { ECOSYSTEM_NODES } from '../constants';
import { EcosystemNode } from '../types';
import { ArrowRight, Info, BrainCircuit } from 'lucide-react';

export const EcosystemMap: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const coreNode = ECOSYSTEM_NODES.find(n => n.type === 'core');
  const avatars = ECOSYSTEM_NODES.filter(n => n.type === 'avatar');
  const tools = ECOSYSTEM_NODES.filter(n => n.type === 'tool');

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
            Fermer
        </button>
        
        <div className="w-full max-w-7xl h-full flex flex-col items-center justify-center relative">
            <h2 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase flex items-center gap-3">
                <BrainCircuit className="w-8 h-8 text-blue-500" /> Architecture Neurale Chloé.AI
            </h2>

            <div className="relative w-full h-[600px] flex items-center justify-center">
                
                {/* Core Brain */}
                <div className="absolute z-20 w-48 h-48 bg-blue-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.4)] animate-pulse-slow border-4 border-blue-400/30">
                    <span className="text-4xl mb-2">🧠</span>
                    <span className="font-bold text-white text-lg">GEMINI 2.5</span>
                    <span className="text-xs text-blue-200 uppercase tracking-widest mt-1">Cerveau Central</span>
                </div>

                {/* Orbiting Avatars */}
                {avatars.map((node, i) => {
                    const angle = (i / avatars.length) * Math.PI * 2; // Full circle distribution
                    const radius = 280;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <div key={node.id} className="absolute flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform duration-300 z-10"
                             style={{ transform: `translate(${x}px, ${y}px)` }}>
                            <div className={`w-20 h-20 rounded-2xl ${node.color} flex items-center justify-center shadow-lg mb-2 text-2xl`}>
                                👤
                            </div>
                            <div className="bg-slate-900/80 px-3 py-1 rounded text-xs font-bold text-white border border-slate-700 whitespace-nowrap">
                                {node.label}
                            </div>
                            {/* Connector Line (Visual Hack using CSS rotation would be complex, simplified here) */}
                            <div className="absolute w-1 h-[200px] bg-gradient-to-t from-transparent to-blue-500/20 -z-10 bottom-10 origin-bottom" 
                                 style={{ transform: `rotate(${angle + Math.PI/2}rad)` }}></div>
                        </div>
                    );
                })}

                {/* Tools (Outer Ring or Bottom) */}
                <div className="absolute bottom-0 flex gap-6">
                    {tools.map(tool => (
                        <div key={tool.id} className="flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
                            <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-2 shadow-md`}>
                                🛠
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">{tool.label}</span>
                        </div>
                    ))}
                </div>

            </div>

            <div className="absolute bottom-10 flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4" />
                <span>Tous les modules sont connectés au Core via l'API Live bidirectionnelle.</span>
            </div>
        </div>
    </div>
  );
};