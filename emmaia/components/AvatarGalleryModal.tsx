import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Image as ImageIcon, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { AVATAR_GALLERY } from '../constants';
import { clsx } from 'clsx';
import { GalleryService } from '../services/galleryService';

interface AvatarGalleryModalProps {
  onClose: () => void;
  onSelect: (sectionId: string, url: string) => void;
}

export const AvatarGalleryModal: React.FC<AvatarGalleryModalProps> = ({ onClose, onSelect }) => {
  const [selectedSection, setSelectedSection] = useState<string>('finance');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryService = new GalleryService();

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

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    try {
        const localImages = await galleryService.listImages();
        // Combine with default gallery but filter out duplicates
        const combined = Array.from(new Set([...localImages, ...AVATAR_GALLERY]));
        setImages(combined);
    } catch (e) {
        setImages(AVATAR_GALLERY);
        setError("Impossible de charger les images du serveur.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
        const url = await galleryService.uploadImage(file);
        if (url) {
            setImages(prev => [url, ...prev]);
            setSelectedImage(url);
        } else {
            setError("Échec de l'upload.");
        }
    } catch (e) {
        setError("Erreur lors de l'upload.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url.startsWith('/images/')) {
        setError("Impossible de supprimer une image externe.");
        return;
    }

    if (!confirm("Voulez-vous vraiment supprimer cette image ?")) return;

    try {
        const success = await galleryService.deleteImage(url);
        if (success) {
            setImages(prev => prev.filter(img => img !== url));
            if (selectedImage === url) setSelectedImage(null);
        } else {
            setError("Échec de la suppression.");
        }
    } catch (e) {
        setError("Erreur lors de la suppression.");
    }
  };

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
               <p className="text-xs text-slate-500 mt-1">Personnalisez l'apparence de chaque section ({images.length} options).</p>
           </div>
           
           <div className="flex items-center gap-4">
               {error && (
                   <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-3 py-1.5 rounded-full border border-red-400/20">
                       <AlertCircle className="w-3.5 h-3.5" /> {error}
                   </div>
               )}
               
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpload} 
                  className="hidden" 
                  accept="image/*" 
                  title="Choisir une image à uploader"
                  aria-label="Choisir une image à uploader"
               />
               
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  aria-label="Ajouter une photo"
                  title="Ajouter une photo"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50"
               >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Chargement...' : 'Ajouter une photo'}
               </button>

               <button 
                  onClick={onClose} 
                  aria-label="Fermer la galerie"
                  title="Fermer la galerie"
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
               >
                   <X className="w-6 h-6" />
               </button>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Sections */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 overflow-y-auto hidden md:block">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sections Target</h3>
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
                        id="section-selector-mobile"
                        value={selectedSection} 
                        onChange={(e) => setSelectedSection(e.target.value)}
                        aria-label="Choisir la section à modifier"
                        title="Section à modifier"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                    >
                        {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>

                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                        <p className="animate-pulse">Chargement de la bibliothèque...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {images.map((url, idx) => (
                            <button
                                key={url + idx}
                                onClick={() => setSelectedImage(url)}
                                className={clsx(
                                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group shrink-0",
                                    selectedImage === url ? "border-blue-500 ring-4 ring-blue-500/20 scale-95" : "border-slate-800 hover:border-slate-600 hover:scale-105"
                                )}
                            >
                                <img src={url} className="w-full h-full object-cover" loading="lazy" alt={`Avatar ${idx}`} />
                                
                                {/* Image Info Overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[10px] text-white truncate">{url.split('/').pop()}</p>
                                </div>

                                {/* Controls */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {url.startsWith('/images/') && (
                                        <button 
                                            onClick={(e) => handleDelete(url, e)}
                                            className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-md backdrop-blur-sm transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {selectedImage === url && (
                                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                        <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center px-8">
            <div className="text-sm text-slate-500">
                {selectedImage ? (
                    <span className="flex items-center gap-2">
                         Image sélectionnée: <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-400">{selectedImage.split('/').pop()}</code>
                    </span>
                ) : "Veuillez choisir une image"}
            </div>
            
            <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium">
                    Annuler
                </button>
                <button 
                    onClick={handleApply}
                    disabled={!selectedImage}
                    className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm active:scale-95"
                >
                    Appliquer à {sections.find(s => s.id === selectedSection)?.label}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
