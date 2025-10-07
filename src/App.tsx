import React, { useState, useEffect } from 'react';
import { Plus, Edit3, X, Download, Upload, Settings, Palette, Check, Trash2, List } from 'lucide-react';

// Popular emojis for app icons
const popularEmojis = [
  '🌐', '📱', '💼', '📧', '📅', '📝', '💬', '🎵', '🎮', '📷',
  '🎨', '🎬', '📚', '🏠', '🚗', '✈️', '🍕', '☕', '🏋️', '💰',
  '💡', '🔧', '⚙️', '🔒', '🔑', '📊', '📈', '🎯', '🏆', '⭐',
  '❤️', '🔥', '✅', '🎉', '🚀', '👍', '📦', '🛒', '🏪', '🎓',
  '🔔', '📍', '🌟', '💻', '⌨️', '🖥️', '📞', '🎤', '🎧', '🎸'
];

// Types
interface App {
  id: string;
  name: string;
  url: string;
  logo: string;
  order: number;
}

interface Theme {
  id: string;
  name: string;
  sector: string;
  description: string;
  colors: {
    headerFrom: string;
    headerVia: string;
    headerTo: string;
    headerBorder: string;
    background: string;
    cardBg: string;
    cardHover: string;
    accent: string;
    accentHover: string;
    textPrimary: string;
    textSecondary: string;
  };
}

const themes: Theme[] = [
  {
    id: 'finance',
    name: 'Finance Pro',
    sector: '',
    description: '',
    colors: {
      headerFrom: 'from-slate-800',
      headerVia: 'via-slate-900',
      headerTo: 'to-blue-900',
      headerBorder: 'border-blue-600',
      background: 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200',
      cardBg: 'bg-white',
      cardHover: 'hover:bg-white/70',
      accent: 'bg-amber-600',
      accentHover: 'hover:bg-amber-700',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700'
    }
  },
  {
    id: 'tech',
    name: 'Tech Modern',
    sector: '',
    description: '',
    colors: {
      headerFrom: 'from-purple-800',
      headerVia: 'via-purple-900',
      headerTo: 'to-indigo-900',
      headerBorder: 'border-purple-500',
      background: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100',
      cardBg: 'bg-white',
      cardHover: 'hover:bg-purple-50',
      accent: 'bg-purple-600',
      accentHover: 'hover:bg-purple-700',
      textPrimary: 'text-purple-900',
      textSecondary: 'text-purple-700'
    }
  },
  {
    id: 'creative',
    name: 'Créatif',
    sector: '',
    description: '',
    colors: {
      headerFrom: 'from-pink-700',
      headerVia: 'via-rose-800',
      headerTo: 'to-orange-700',
      headerBorder: 'border-pink-500',
      background: 'bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50',
      cardBg: 'bg-white',
      cardHover: 'hover:bg-pink-50',
      accent: 'bg-rose-600',
      accentHover: 'hover:bg-rose-700',
      textPrimary: 'text-rose-900',
      textSecondary: 'text-rose-700'
    }
  },
  {
    id: 'health',
    name: 'Santé',
    sector: '',
    description: '',
    colors: {
      headerFrom: 'from-teal-700',
      headerVia: 'via-teal-800',
      headerTo: 'to-cyan-800',
      headerBorder: 'border-teal-500',
      background: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50',
      cardBg: 'bg-white',
      cardHover: 'hover:bg-teal-50',
      accent: 'bg-teal-600',
      accentHover: 'hover:bg-teal-700',
      textPrimary: 'text-teal-900',
      textSecondary: 'text-teal-700'
    }
  },
  {
    id: 'legal',
    name: 'Juridique',
    sector: '',
    description: '',
    colors: {
      headerFrom: 'from-gray-800',
      headerVia: 'via-gray-900',
      headerTo: 'to-slate-900',
      headerBorder: 'border-gray-600',
      background: 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200',
      cardBg: 'bg-white',
      cardHover: 'hover:bg-gray-50',
      accent: 'bg-gray-700',
      accentHover: 'hover:bg-gray-800',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-700'
    }
  },
  {
    id: 'eco',
    name: 'Écologie',
    sector: '',
    description: '',
    colors: {
      headerFrom: 'from-green-700',
      headerVia: 'via-green-800',
      headerTo: 'to-emerald-800',
      headerBorder: 'border-green-500',
      background: 'bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50',
      cardBg: 'bg-white',
      cardHover: 'hover:bg-green-50',
      accent: 'bg-green-600',
      accentHover: 'hover:bg-green-700',
      textPrimary: 'text-green-900',
      textSecondary: 'text-green-700'
    }
  }
];

const GOB = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showManageApps, setShowManageApps] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [useEmoji, setUseEmoji] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🌐');

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('fr-CA', {
        timeZone: 'America/Montreal',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Load apps from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gobapps');
    if (stored) {
      setApps(JSON.parse(stored));
    } else {
      const defaultApps: App[] = [
        { id: '1', name: 'Dashboard Financier', url: '/financial-dashboard.html', logo: '📊', order: 0 }
      ];
      setApps(defaultApps);
    }

    const storedTheme = localStorage.getItem('gobapps-theme');
    if (storedTheme) {
      const theme = themes.find(t => t.id === storedTheme);
      if (theme) setCurrentTheme(theme);
    }
  }, []);

  useEffect(() => {
    if (apps.length > 0) {
      localStorage.setItem('gobapps', JSON.stringify(apps));
    }
  }, [apps]);

  const handleAddNew = () => {
    setEditingApp(null);
    setFormName('');
    setFormUrl('');
    setFormLogo('');
    setUseEmoji(false);
    setSelectedEmoji('🌐');
    setShowModal(true);
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormUrl(app.url);
    
    if (app.logo && app.logo.length <= 4 && /\p{Emoji}/u.test(app.logo)) {
      setUseEmoji(true);
      setSelectedEmoji(app.logo);
      setFormLogo('');
    } else {
      setUseEmoji(false);
      setSelectedEmoji('🌐');
      setFormLogo(app.logo);
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName || !formUrl) return;

    let logo = '';
    
    if (useEmoji) {
      logo = selectedEmoji;
    } else if (formLogo) {
      logo = formLogo;
    } else {
      let domain = formUrl;
      try {
        const url = new URL(formUrl.startsWith('http') ? formUrl : `https://${formUrl}`);
        domain = url.hostname;
      } catch (e) {
        domain = formUrl.replace(/^https?:\/\//, '').split('/')[0];
      }
      logo = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    }

    if (editingApp) {
      setApps(apps.map(app => 
        app.id === editingApp.id 
          ? { ...app, name: formName, url: formUrl, logo }
          : app
      ));
    } else {
      const newApp: App = {
        id: Date.now().toString(),
        name: formName,
        url: formUrl,
        logo,
        order: apps.length
      };
      setApps([...apps, newApp]);
    }
    setShowModal(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(apps, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gob-export.json';
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setApps(imported);
      } catch (err) {
        alert('Erreur lors de l\'import du fichier');
      }
    };
    reader.readAsText(file);
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = apps.findIndex(app => app.id === draggedId);
    const targetIndex = apps.findIndex(app => app.id === targetId);

    const newApps = [...apps];
    const [removed] = newApps.splice(draggedIndex, 1);
    newApps.splice(targetIndex, 0, removed);

    setApps(newApps.map((app, idx) => ({ ...app, order: idx })));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleOpenApp = (url: string) => {
    if (!isEditing) {
      window.open(url, '_blank');
    }
  };

  const toggleAppSelection = (id: string) => {
    const newSelection = new Set(selectedApps);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedApps(newSelection);
    setShowDeleteConfirm(false);
  };

  const handleShowDeleteConfirm = () => {
    if (selectedApps.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setApps(apps.filter(app => !selectedApps.has(app.id)));
    setSelectedApps(new Set());
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const toggleSelectAll = () => {
    if (selectedApps.size === apps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(apps.map(app => app.id)));
    }
    setShowDeleteConfirm(false);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('gobapps-theme', theme.id);
    setShowThemeModal(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showAdminMenu && !target.closest('.admin-menu-container')) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAdminMenu]);

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} relative overflow-hidden`}>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 pointer-events-none"></div>
      
      <header className="relative z-10">
        <div className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-blue-900/95 backdrop-blur-xl text-white px-6 py-2 border-b border-white/10">
          <div className="flex items-center justify-center text-sm font-medium">
            <span>{currentTime || '00:00'}</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-blue-900/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-white/30">
                  <div className="text-3xl">🤖</div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight drop-shadow-lg">GOB</h1>
                  <p className="text-xs text-blue-100 font-medium">Propulsé par JSL AI</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all flex items-center justify-center border border-white/20 shadow-lg"
                  title="Changer le thème"
                >
                  <Palette size={18} />
                </button>
                
                <div className="relative admin-menu-container">
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className="w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all flex items-center justify-center border border-white/20 shadow-lg"
                    title="Administration"
                  >
                    <Settings size={18} />
                  </button>
                  
                  {showAdminMenu && (
                    <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-3 w-56 border border-white/50 z-50">
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setShowManageApps(true);
                            setShowAdminMenu(false);
                          }}
                          className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg shadow-purple-500/30 flex items-center space-x-2 text-sm font-semibold active:scale-95"
                        >
                          <List size={18} />
                          <span>Gérer les apps</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExport();
                            setShowAdminMenu(false);
                          }}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center space-x-2 text-sm font-semibold active:scale-95"
                        >
                          <Download size={18} />
                          <span>Exporter</span>
                        </button>
                        <label className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/30 flex items-center space-x-2 cursor-pointer text-sm font-semibold block active:scale-95">
                          <Upload size={18} />
                          <span>Importer</span>
                          <input 
                            type="file" 
                            accept=".json" 
                            onChange={(e) => {
                              handleImport(e);
                              setShowAdminMenu(false);
                            }} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 pb-32">
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {apps.sort((a, b) => a.order - b.order).map(app => (
            <div
              key={app.id}
              draggable={isEditing}
              onDragStart={() => handleDragStart(app.id)}
              onDragOver={(e) => handleDragOver(e, app.id)}
              onDragEnd={handleDragEnd}
              className={`relative group ${isEditing ? 'animate-wiggle' : ''}`}
            >
              <div
                onClick={() => isEditing ? handleEdit(app) : handleOpenApp(app.url)}
                className={`flex flex-col items-center space-y-2 p-3 rounded-3xl transition-all duration-300 ${
                  isEditing 
                    ? 'cursor-pointer bg-white/40 backdrop-blur-xl border border-white/40 shadow-xl' 
                    : 'cursor-pointer hover:bg-white/30 hover:backdrop-blur-xl hover:scale-105 active:scale-95'
                }`}
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-2xl shadow-2xl flex items-center justify-center border border-white/50 relative hexagon">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {app.logo && app.logo.length <= 4 && /\p{Emoji}/u.test(app.logo) ? (
                        <div className="text-3xl">{app.logo}</div>
                      ) : app.logo ? (
                        <img 
                          src={app.logo} 
                          alt={app.name} 
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.fallback-initial')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-initial w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-lg rounded';
                              fallback.textContent = app.name.charAt(0).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold text-lg rounded">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="neural-dot neural-dot-1"></div>
                    <div className="neural-dot neural-dot-2"></div>
                    <div className="neural-dot neural-dot-3"></div>
                    <div className="neural-dot neural-dot-4"></div>
                    <div className="neural-dot neural-dot-5"></div>
                    <div className="neural-dot neural-dot-6"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-900 line-clamp-1 drop-shadow-sm">{app.name}</p>
                </div>
              </div>
            </div>
          ))}

          {isEditing && (
            <div
              onClick={handleAddNew}
              className="flex flex-col items-center justify-center p-3 rounded-3xl cursor-pointer hover:bg-white/30 hover:backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-2xl shadow-2xl flex items-center justify-center border-2 border-dashed border-white/60 hover:border-blue-400/60 transition-all hexagon">
                <Plus size={28} className="text-slate-600" />
              </div>
              <p className="text-[10px] font-semibold text-slate-700 mt-2">Ajouter</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-28 right-6 z-40">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isEditing 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/50' 
              : 'bg-white/90 backdrop-blur-xl text-slate-700 border-2 border-white/50 shadow-xl'
          }`}
        >
          {isEditing ? <Check size={28} /> : <Edit3 size={24} />}
        </button>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 pointer-events-none z-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-3xl rounded-t-[2.5rem] shadow-2xl px-6 py-4 border-t border-white/50">
            <div className="flex justify-center">
              <div className="w-32 h-1.5 bg-slate-900/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-md w-full p-6 border border-white/50" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingApp ? 'Modifier l\'app' : 'Nouvelle app'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de l'application
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: GitHub, LinkedIn..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Icône
                </label>
                <div className="flex space-x-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUseEmoji(true)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      useEmoji 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    😀 Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseEmoji(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      !useEmoji 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    🔗 URL
                  </button>
                </div>

                {useEmoji ? (
                  <div>
                    <div className="flex items-center justify-center mb-3 p-4 bg-slate-50 rounded-xl">
                      <div className="text-6xl">{selectedEmoji}</div>
                    </div>
                    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                      {popularEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${
                            selectedEmoji === emoji 
                              ? 'bg-blue-200 ring-2 ring-blue-500' 
                              : 'hover:bg-slate-200'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formLogo}
                      onChange={(e) => setFormLogo(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Si vide, le favicon du site sera utilisé automatiquement
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 rounded-2xl font-semibold transition-all backdrop-blur-xl flex items-center justify-center active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageApps && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setShowManageApps(false);
            setSelectedApps(new Set());
            setShowDeleteConfirm(false);
          }
        }}>
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-white/50" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Gérer les applications</h2>
                <p className="text-sm text-slate-600 mt-1">Modifier ou supprimer vos applications</p>
              </div>
              <button
                onClick={() => {
                  setShowManageApps(false);
                  setSelectedApps(new Set());
                  setShowDeleteConfirm(false);
                }}
                className="w-10 h-10 bg-slate-100/80 hover:bg-slate-200/80 backdrop-blur-xl rounded-full flex items-center justify-center transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              {apps.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>Aucune application configurée</p>
                  <p className="text-sm mt-2">Cliquez sur le bouton en bas pour ajouter votre première app</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 p-3 bg-slate-100 rounded-lg">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedApps.size === apps.length && apps.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer"
                      />
                      <span className="font-medium text-slate-700">
                        {selectedApps.size > 0 ? `${selectedApps.size} sélectionnée${selectedApps.size > 1 ? 's' : ''}` : 'Tout sélectionner'}
                      </span>
                    </label>
                    {selectedApps.size > 0 && !showDeleteConfirm && (
                      <button
                        onClick={handleShowDeleteConfirm}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Supprimer ({selectedApps.size})</span>
                      </button>
                    )}
                  </div>

                  {showDeleteConfirm && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
                          <span className="text-lg font-bold">!</span>
                        </div>
                        <p className="font-bold text-red-900">
                          Confirmer la suppression ?
                        </p>
                      </div>
                      <p className="text-sm text-red-800 mb-4">
                        Vous allez supprimer {selectedApps.size} application{selectedApps.size > 1 ? 's' : ''}. Cette action est irréversible.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleConfirmDelete}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          <Trash2 size={18} />
                          <span>Oui, supprimer</span>
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {apps.sort((a, b) => a.order - b.order).map(app => (
                      <div key={app.id} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedApps.has(app.id) ? 'bg-blue-50 border-2 border-blue-300' : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                      }`}>
                        <div className="flex items-center space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedApps.has(app.id)}
                            onChange={() => toggleAppSelection(app.id)}
                            className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer"
                          />
                          <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center hexagon overflow-hidden">
                            {app.logo && app.logo.length <= 4 && /\p{Emoji}/u.test(app.logo) ? (
                              <div className="text-2xl">{app.logo}</div>
                            ) : app.logo ? (
                              <img src={app.logo} alt={app.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold rounded">
                                {app.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{app.name}</h3>
                            <p className="text-xs text-slate-500 truncate">{app.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleEdit(app);
                            setShowManageApps(false);
                            setSelectedApps(new Set());
                            setShowDeleteConfirm(false);
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200/50 bg-slate-50/50">
              <button
                onClick={() => {
                  handleAddNew();
                  setShowManageApps(false);
                  setSelectedApps(new Set());
                  setShowDeleteConfirm(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 active:scale-95"
              >
                <Plus size={20} />
                <span>Ajouter une application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showThemeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowThemeModal(false)}>
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-white/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Choisir un thème</h2>
                <p className="text-sm text-slate-600 mt-1">Sélectionnez une palette de couleurs</p>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-10 h-10 bg-slate-100/80 hover:bg-slate-200/80 backdrop-blur-xl rounded-full flex items-center justify-center transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => handleThemeChange(theme)}
                    className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                      currentTheme.id === theme.id 
                        ? 'border-blue-500 shadow-xl shadow-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`h-32 bg-gradient-to-r ${theme.colors.headerFrom} ${theme.colors.headerVia} ${theme.colors.headerTo} flex items-center justify-center relative`}>
                      <div className="text-white text-xl font-bold">{theme.name}</div>
                      {currentTheme.id === theme.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-white">
                      <div className="flex space-x-2">
                        <div className={`w-8 h-8 rounded ${theme.colors.accent}`}></div>
                        <div className={`w-8 h-8 rounded bg-gradient-to-r ${theme.colors.headerFrom} ${theme.colors.headerTo}`}></div>
                        <div className="w-8 h-8 rounded bg-slate-200"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        .hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .neural-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ea580c;
          border-radius: 50%;
          opacity: 0.6;
        }
        .neural-dot-1 { top: 0; left: 50%; transform: translateX(-50%); }
        .neural-dot-2 { top: 25%; right: 0; }
        .neural-dot-3 { bottom: 25%; right: 0; }
        .neural-dot-4 { bottom: 0; left: 50%; transform: translateX(-50%); }
        .neural-dot-5 { bottom: 25%; left: 0; }
        .neural-dot-6 { top: 25%; left: 0; }
      `}</style>
    </div>
  );
};

export default GOB;