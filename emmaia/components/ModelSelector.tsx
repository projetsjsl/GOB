// ModelSelector - dropdown component for selecting AI model in Emma modes
import React, { useState } from 'react';
import { ChevronDown, Globe, Cpu, Zap, Search } from 'lucide-react';

interface Model {
    id: string;
    name: string;
    provider: string;
    capabilities: string[];
    description: string;
    cost?: 'free' | 'low' | 'medium' | 'high';
    isDefault?: boolean;
}

interface ModelSelectorProps {
    currentModelId: string;
    availableModels: Model[];
    googleSearch: boolean;
    onModelChange: (modelId: string) => void;
    onGoogleSearchChange: (enabled: boolean) => void;
    accentColor?: string; // e.g., 'orange', 'emerald', 'red', 'cyan'
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    currentModelId,
    availableModels,
    googleSearch,
    onModelChange,
    onGoogleSearchChange,
    accentColor = 'cyan'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentModel = availableModels.find(m => m.id === currentModelId) || availableModels[0];
    
    const colorClasses = {
        orange: { bg: 'bg-orange-950/50', border: 'border-orange-900/50', text: 'text-orange-400', hover: 'hover:bg-orange-900/50' },
        emerald: { bg: 'bg-emerald-950/50', border: 'border-emerald-900/50', text: 'text-emerald-400', hover: 'hover:bg-emerald-900/50' },
        red: { bg: 'bg-red-950/50', border: 'border-red-900/50', text: 'text-red-400', hover: 'hover:bg-red-900/50' },
        cyan: { bg: 'bg-cyan-950/50', border: 'border-cyan-900/50', text: 'text-cyan-400', hover: 'hover:bg-cyan-900/50' }
    };
    
    const colors = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.cyan;
    
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'gemini': return <Cpu className="w-3 h-3" />;
            case 'perplexity': return <Search className="w-3 h-3" />;
            default: return <Zap className="w-3 h-3" />;
        }
    };

    const getCostBadge = (cost?: string, isDefault?: boolean) => {
        if (isDefault) {
            return <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">⭐ Défaut</span>;
        }
        switch (cost) {
            case 'free':
                return <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Gratuit</span>;
            case 'low':
                return <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">$</span>;
            case 'medium':
                return <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">$$</span>;
            case 'high':
                return <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">$$$</span>;
            default:
                return null;
        }
    };

    return (
        <div className="relative">
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} border ${colors.border} ${colors.hover} transition-all text-xs`}
                title="Changer de modèle IA"
            >
                {getProviderIcon(currentModel.provider)}
                <span className={`font-medium ${colors.text}`}>{currentModel.name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`absolute top-full right-0 mt-2 w-72 ${colors.bg} backdrop-blur-xl border ${colors.border} rounded-xl shadow-2xl z-50 overflow-hidden`}>
                        {/* Models List */}
                        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                            {availableModels.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        model.id === currentModelId
                                            ? `${colors.bg} border ${colors.border}`
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {getProviderIcon(model.provider)}
                                        <span className={`font-medium text-sm ${model.id === currentModelId ? colors.text : 'text-white'}`}>
                                            {model.name}
                                        </span>
                                        <div className="ml-auto flex items-center gap-1">
                                            {getCostBadge(model.cost, model.isDefault)}
                                            {model.id === currentModelId && (
                                                <span className={`text-[10px] ${colors.text} bg-white/10 px-1.5 py-0.5 rounded`}>Actif</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 line-clamp-2">{model.description}</p>
                                    <div className="flex gap-1 mt-1.5">
                                        {model.capabilities.slice(0, 3).map(cap => (
                                            <span key={cap} className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        {/* Google Search Toggle (only for Gemini models) */}
                        {currentModel.provider === 'gemini' && (
                            <div className={`p-3 border-t ${colors.border}`}>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Globe className={`w-4 h-4 ${googleSearch ? colors.text : 'text-gray-500'}`} />
                                        <span className="text-xs text-gray-300">Google Search (Grounding)</span>
                                    </div>
                                    <div 
                                        className={`w-10 h-5 rounded-full transition-colors relative ${googleSearch ? 'bg-emerald-600' : 'bg-gray-700'}`}
                                        onClick={() => onGoogleSearchChange(!googleSearch)}
                                    >
                                        <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${googleSearch ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Enrichit les réponses avec des données web en temps réel
                                </p>
                            </div>
                        )}
                        
                        {/* Perplexity info */}
                        {currentModel.provider === 'perplexity' && (
                            <div className={`p-3 border-t ${colors.border}`}>
                                <div className="flex items-center gap-2 text-xs text-blue-400">
                                    <Search className="w-4 h-4" />
                                    <span>Recherche web intégrée + Citations</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ModelSelector;
