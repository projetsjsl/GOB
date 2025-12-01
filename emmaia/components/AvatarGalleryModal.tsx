
import React, { useState } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { AVATAR_GALLERY } from '../constants';
import { clsx } from 'clsx';

interface AvatarGalleryModalProps {
  onClose: () => void;
  onSelect: (sectionId: string, url: string) => void;
}

export const AvatarGalleryModal: React.FC<AvatarGalleryModalProps> = ({ onClose, onSelect }) => {
  const [selectedSection, setSelectedSection] = useState<string>('finance');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const sections = [
      { id: 'finance', label: 'Finance (Chat/Vocal)' },
      { id: 'economy', label: 'Macro' },
      { id: 'politics', label: 'Politique' },
      { id: 'researcher', label: 'Recherchiste' },
      { id: 'ceo', label: 'CEO Simulator' },
      { id: 'critic', label: 'Avocat du Diable' },
      { id: 'writer', label: 'Rédactrice' },
      { id: 'geek', label: 'Geek Technique' },
      { id: 'tavus', label: 'Emma Naturelle' },
  ];

  const handleApply = () => {
      if (selectedImage) {
          onSelect(selectedSection, selectedImage);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
           <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <ImageIcon className="w-5 h-5 text-blue-500" /> Galerie d'Avatars
               </h2>
               <p className="text-xs text-slate-500 mt-1">Personnalisez l'apparence de chaque section ({AVATAR_GALLERY.length} options).</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
               <X className="w-6 h-6" />
           </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Sections */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 overflow-y-auto hidden md:block">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sections</h3>
                <div className="space-y-1">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSection(s.id)}
                            className={clsx(
                                "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                selectedSection === s.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-900 custom-scrollbar">
                {/* Mobile Section Selector */}
                <div className="md:hidden mb-4">
                    <label className="text-xs text-slate-400 block mb-2">Section à modifier</label>
                    <select 
                        value={selectedSection} 
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                    >
                        {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {AVATAR_GALLERY.map((url, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(url)}
                            className={clsx(
                                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                                selectedImage === url ? "border-blue-500 ring-4 ring-blue-500/20 scale-95" : "border-slate-800 hover:border-slate-600 hover:scale-105"
                            )}
                        >
                            <img src={url} className="w-full h-full object-cover" loading="lazy" alt={`Avatar ${idx}`} />
                            {selectedImage === url && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                    <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm">
                Annuler
            </button>
            <button 
                onClick={handleApply}
                disabled={!selectedImage}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
                Appliquer à {sections.find(s => s.id === selectedSection)?.label}
            </button>
        </div>

      </div>
    </div>
  );
};
