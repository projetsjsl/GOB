/**
 * Composant ThemeSelector - Sélecteur de thème professionnel avec aperçus visuels
 */

const { useState, useEffect, useRef } = React;

const ThemeSelector = ({ isDarkMode = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const modalRef = useRef(null);

    // Charger le thème au montage et écouter les changements
    useEffect(() => {
        const loadTheme = () => {
            if (window.GOBThemes && window.GOBThemes.getCurrentTheme) {
                const themeId = window.GOBThemes.getCurrentTheme();
                setCurrentTheme(themeId);
            } else {
                // Attendre que GOBThemes soit disponible
                setTimeout(loadTheme, 100);
            }
        };
        
        loadTheme();
        
        // Écouter les changements de thème
        const handleThemeChange = (event) => {
            if (event.detail && event.detail.themeId) {
                setCurrentTheme(event.detail.themeId);
            }
        };
        
        window.addEventListener('themeChanged', handleThemeChange);
        return () => window.removeEventListener('themeChanged', handleThemeChange);
    }, []);

    // Fermer la modal si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Empêcher le scroll du body quand la modal est ouverte
            document.body.style.overflow = 'hidden';
            // Notifier que le modal est ouvert
            window.dispatchEvent(new CustomEvent('themeSelectorOpen'));
        } else {
            document.body.style.overflow = '';
            // Notifier que le modal est fermé
            window.dispatchEvent(new CustomEvent('themeSelectorClose'));
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
            window.dispatchEvent(new CustomEvent('themeSelectorClose'));
        };
    }, [isOpen]);

    // Fermer avec Escape
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Obtenir les thèmes depuis le système global
    const getThemes = () => {
        if (!window.GOBThemes || !window.GOBThemes.themes) {
            // Fallback si GOBThemes n'est pas encore chargé
            return [
                { id: 'darkmode', name: 'Dark Mode', isDefault: true },
                { id: 'light', name: 'Light', isDefault: true },
                { id: 'terminal', name: 'Terminal', isDefault: true },
                { id: 'ia', name: 'IA', isDefault: true }
            ];
        }
        return Object.values(window.GOBThemes.themes);
    };

    const themes = getThemes();
    const defaultThemesList = themes.filter(t => t && t.isDefault === true);
    const customThemesList = themes.filter(t => t && t.isDefault !== true);

    const handleThemeChange = (themeId) => {
        if (!themeId || typeof themeId !== 'string') {
            console.warn('Theme ID invalide:', themeId);
            return;
        }
        
        if (window.GOBThemes && window.GOBThemes.applyTheme) {
            try {
                window.GOBThemes.applyTheme(themeId);
                setCurrentTheme(themeId);
                setIsOpen(false);
                
                // Déclencher un événement personnalisé pour notifier les autres composants
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId } }));
            } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
            }
        } else {
            console.warn('GOBThemes n\'est pas disponible');
        }
    };

    const getThemeIcon = (themeId) => {
        const icons = {
            'terminal': '💻',
            'ia': '🤖',
            'darkmode': '🌙',
            'light': '☀️',
            'default': '🎨',
            'marketq': '📊',
            'marketq-dark': '⚫',
            'bloomberg-terminal': '💻',
            'seeking-alpha': '📈',
            'bloomberg-mobile': '📱',
            'bloomberg-nostalgie': '🕰️',
            'desjardins': '🏦'
        };
        return icons[themeId] || '✨';
    };
    
    // Toggle pour DarkMode/Light
    const handleToggleDarkLight = () => {
        const currentId = currentTheme;
        if (currentId === 'darkmode') {
            handleThemeChange('light');
        } else if (currentId === 'light') {
            handleThemeChange('darkmode');
        } else {
            // Si autre thème, basculer vers darkmode
            handleThemeChange('darkmode');
        }
    };
    
    const isDarkLightTheme = currentTheme === 'darkmode' || currentTheme === 'light';

    const currentThemeData = themes.find(t => t && t.id === currentTheme) || themes[0] || null;

    // Fonction pour générer un aperçu de couleurs du thème
    const renderThemePreview = (theme) => {
        const colors = theme.colors || {};
        const isSelected = currentTheme === theme.id;
        // Détecter les thèmes light
        const isLightTheme = ['seeking-alpha', 'bloomberg-nostalgie', 'light'].includes(theme.id) || 
                            (colors.background && colors.background.toLowerCase() === '#ffffff');
        const previewBg = colors.background || (isLightTheme ? '#ffffff' : '#000000');
        const previewText = colors.text || (isLightTheme ? '#202124' : '#ffffff');

        return (
            <div
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform hover:scale-[1.04] hover:-translate-y-2 group overflow-hidden ${
                    isSelected ? 'ring-2 ring-offset-4' : ''
                }`}
                style={{
                    backgroundColor: previewBg,
                    color: previewText,
                    border: `2px solid ${isSelected ? colors.primary || colors.accent || '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    boxShadow: isSelected 
                        ? `
                            0 20px 60px ${colors.primary || colors.accent || '#3b82f6'}40,
                            0 0 0 4px ${colors.primary || colors.accent || '#3b82f6'}25,
                            inset 0 2px 4px rgba(255,255,255,0.15),
                            inset 0 -2px 4px rgba(0,0,0,0.1),
                            0 0 80px ${colors.primary || colors.accent || '#3b82f6'}20
                        `
                        : `
                            0 8px 32px rgba(0, 0, 0, 0.12),
                            0 2px 8px rgba(0, 0, 0, 0.08),
                            inset 0 1px 0 rgba(255,255,255,0.1),
                            inset 0 -1px 0 rgba(0,0,0,0.05)
                        `,
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                }}
            >
                {/* Premium texture overlay */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                    backgroundImage: `
                        repeating-linear-gradient(45deg, transparent, transparent 2px, ${previewText} 2px, ${previewText} 4px),
                        repeating-linear-gradient(-45deg, transparent, transparent 2px, ${previewText} 2px, ${previewText} 4px)
                    `,
                    backgroundSize: '8px 8px'
                }}></div>
                
                {/* Premium inner glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" style={{
                    background: `radial-gradient(circle at 50% 0%, ${colors.primary || 'rgba(255,255,255,0.1)'} 0%, transparent 50%)`
                }}></div>
                {/* CEO Premium: Shine effect ultra-sophisticated */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, transparent 20%, ${colors.primary || 'rgba(255,255,255,0.12)'} 50%, transparent 80%)`,
                    }}
                >
                    {/* Primary shine */}
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(135deg, transparent 0%, ${colors.primary || 'rgba(255,255,255,0.2)'} 50%, transparent 100%)`,
                            transform: 'translateX(-100%) translateY(-100%)',
                            animation: 'shimmer 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            filter: 'blur(1px)'
                        }}
                    ></div>
                    {/* Secondary shine */}
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(45deg, transparent 0%, ${colors.accent || colors.primary || 'rgba(255,255,255,0.08)'} 50%, transparent 100%)`,
                            transform: 'translateX(100%) translateY(100%)',
                            animation: 'shimmer 4s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.7s',
                            filter: 'blur(2px)'
                        }}
                    ></div>
                    {/* Tertiary shine */}
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${colors.primary || 'rgba(255,255,255,0.06)'} 50%, transparent 100%)`,
                            transform: 'translateY(-100%)',
                            animation: 'shimmer 5s cubic-bezier(0.4, 0, 0.6, 1) infinite 1.4s',
                            filter: 'blur(3px)'
                        }}
                    ></div>
                </div>
                
                {/* CEO Premium: Multi-layer glow effect */}
                <div 
                    className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none blur-3xl"
                    style={{
                        background: `radial-gradient(ellipse at 25% 25%, ${colors.primary || colors.accent || '#3b82f6'}60 0%, transparent 65%)`,
                    }}
                ></div>
                <div 
                    className="absolute -inset-2 opacity-0 group-hover:opacity-70 transition-opacity duration-800 pointer-events-none blur-2xl"
                    style={{
                        background: `radial-gradient(ellipse at 75% 75%, ${colors.accent || colors.primary || '#8b5cf6'}50 0%, transparent 55%)`,
                    }}
                ></div>
                <div 
                    className="absolute -inset-1 opacity-0 group-hover:opacity-50 transition-opacity duration-600 pointer-events-none blur-xl"
                    style={{
                        background: `radial-gradient(circle at 50% 50%, ${colors.success || colors.primary || '#10b981'}30 0%, transparent 40%)`,
                    }}
                ></div>
                
                {/* CEO Premium: Particle constellation effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1200 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${colors.primary || colors.accent || '#3b82f6'} 0%, transparent 70%)`,
                                left: `${15 + i * 20}%`,
                                top: `${25 + i * 15}%`,
                                animation: `sparkle ${3 + i * 0.4}s ease-in-out infinite ${i * 0.4}s`,
                                boxShadow: `0 0 12px ${colors.primary || colors.accent || '#3b82f6'}, 0 0 24px ${colors.primary || colors.accent || '#3b82f6'}40`
                            }}
                        ></div>
                    ))}
                </div>
                
                {/* CEO Premium: Edge lighting */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-800 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-px" style={{
                        background: `linear-gradient(90deg, transparent 0%, ${colors.primary || colors.accent || '#3b82f6'}50 50%, transparent 100%)`,
                        boxShadow: `0 0 8px ${colors.primary || colors.accent || '#3b82f6'}`
                    }}></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px" style={{
                        background: `linear-gradient(90deg, transparent 0%, ${colors.accent || colors.primary || '#8b5cf6'}50 50%, transparent 100%)`,
                        boxShadow: `0 0 8px ${colors.accent || colors.primary || '#8b5cf6'}`
                    }}></div>
                </div>
                {/* CEO Premium: Badge "Sélectionné" ultra-sophisticated */}
                {isSelected && (
                    <>
                        {/* Multiple rings avec propagation avancée */}
                        {[0, 1, 2, 3].map((ring) => (
                            <div 
                                key={ring}
                                className="absolute top-3 right-3 z-0 rounded-full"
                                style={{ 
                                    width: `${32 + ring * 10}px`,
                                    height: `${32 + ring * 10}px`,
                                    marginTop: `${-ring * 5}px`,
                                    marginRight: `${-ring * 5}px`,
                                    border: `${2 + ring}px solid ${colors.primary || colors.accent || '#3b82f6'}`,
                                    animation: `pulse-ring ${2.5 + ring * 0.3}s cubic-bezier(0.4, 0, 0.6, 1) infinite ${ring * 0.25}s`,
                                    opacity: 0.7 - (ring * 0.15),
                                    filter: `blur(${ring * 0.5}px)`
                                }}
                            ></div>
                        ))}
                        
                        {/* CEO Premium: Badge principal avec effets ultra-sophistiqués */}
                        <div 
                            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                            style={{ 
                                background: `linear-gradient(135deg, ${colors.primary || colors.accent || '#3b82f6'} 0%, ${colors.accent || colors.primary || '#8b5cf6'} 50%, ${colors.primary || colors.accent || '#3b82f6'} 100%)`,
                                backgroundSize: '200% 200%',
                                boxShadow: `
                                    0 0 32px ${colors.primary || colors.accent || '#3b82f6'}90,
                                    0 8px 24px rgba(0,0,0,0.5),
                                    inset 0 2px 4px rgba(255,255,255,0.3),
                                    inset 0 -2px 4px rgba(0,0,0,0.2),
                                    0 0 60px ${colors.primary || colors.accent || '#3b82f6'}40
                                `,
                                animation: 'glow-pulse 2.5s ease-in-out infinite, gradient-shift 4s ease infinite'
                            }}
                        >
                            {/* Multi-layer shine */}
                            <div className="absolute inset-0 opacity-60" style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)'
                            }}></div>
                            <div className="absolute inset-0 opacity-40" style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 70%)'
                            }}></div>
                            
                            {/* Inner glow */}
                            <div className="absolute inset-1 rounded-xl opacity-50" style={{
                                background: `radial-gradient(circle, ${colors.primary || colors.accent || '#3b82f6'} 0%, transparent 70%)`,
                                filter: 'blur(4px)'
                            }}></div>
                            
                            <svg className="w-6 h-6 text-white drop-shadow-2xl relative z-10 filter brightness-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                            </svg>
                            
                            {/* Sparkle effect */}
                            <div className="absolute inset-0 opacity-0 animate-sparkle">
                                <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-white" style={{
                                    animation: 'sparkle 2s ease-in-out infinite'
                                }}></div>
                                <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-white" style={{
                                    animation: 'sparkle 2s ease-in-out infinite 0.5s'
                                }}></div>
                            </div>
                        </div>
                    </>
                )}

                {/* CEO Premium: Header ultra-sophisticated */}
                <div
                    className="p-7 relative overflow-hidden group/header"
                    style={{
                        background: colors.styles?.headerBg || `linear-gradient(135deg, ${colors.surface || colors.background} 0%, ${colors.surfaceLight || colors.surface || colors.background} 50%, ${colors.surface || colors.background} 100%)`,
                        backgroundSize: '200% 200%',
                        borderBottom: `1px solid ${colors.border || 'rgba(255,255,255,0.12)'}`,
                        animation: 'gradient-shift 8s ease infinite'
                    }}
                >
                    {/* CEO Premium: Multi-layer pattern */}
                    <div className="absolute inset-0 opacity-[0.05] group-hover/header:opacity-[0.08] transition-opacity duration-700" style={{
                        backgroundImage: `
                            radial-gradient(circle at 3px 3px, ${colors.text || previewText} 1px, transparent 0),
                            radial-gradient(circle at 15px 15px, ${colors.primary || colors.accent || '#3b82f6'} 0.5px, transparent 0)
                        `,
                        backgroundSize: '28px 28px, 32px 32px',
                        animation: 'float 25s ease-in-out infinite'
                    }}></div>
                    
                    {/* CEO Premium: Gradient overlay ultra-sophisticated */}
                    <div className="absolute inset-0 opacity-80 group-hover/header:opacity-100 transition-opacity duration-700" style={{
                        background: `
                            linear-gradient(135deg, ${colors.primary || 'transparent'}25 0%, transparent 35%, ${colors.accent || 'transparent'}20 45%, transparent 55%, ${colors.primary || 'transparent'}15 65%, transparent 100%),
                            radial-gradient(ellipse at 20% 40%, ${colors.primary || 'transparent'}20 0%, transparent 45%),
                            radial-gradient(ellipse at 80% 60%, ${colors.accent || 'transparent'}15 0%, transparent 40%)
                        `
                    }}></div>
                    
                    {/* CEO Premium: Animated gradient line avec glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60" style={{
                        background: `linear-gradient(90deg, transparent 0%, ${colors.primary || colors.accent || '#3b82f6'}40 25%, ${colors.primary || colors.accent || '#3b82f6'}80 50%, ${colors.primary || colors.accent || '#3b82f6'}40 75%, transparent 100%)`,
                        boxShadow: `0 0 12px ${colors.primary || colors.accent || '#3b82f6'}60`,
                        animation: 'glow-pulse 4s ease-in-out infinite'
                    }}></div>
                    
                    {/* CEO Premium: Corner highlights */}
                    <div className="absolute top-0 left-0 w-20 h-20 opacity-20" style={{
                        background: `radial-gradient(circle, ${colors.primary || colors.accent || '#3b82f6'} 0%, transparent 70%)`,
                        filter: 'blur(15px)'
                    }}></div>
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-20" style={{
                        background: `radial-gradient(circle, ${colors.accent || colors.primary || '#8b5cf6'} 0%, transparent 70%)`,
                        filter: 'blur(15px)'
                    }}></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden group/icon transition-all duration-700 group-hover:scale-110 group-hover:rotate-6"
                                style={{ 
                                    background: `linear-gradient(135deg, ${colors.primary || colors.accent || '#3b82f6'} 0%, ${colors.accent || colors.primary || '#8b5cf6'} 30%, ${colors.primary || colors.accent || '#3b82f6'} 60%, ${colors.accent || colors.primary || '#8b5cf6'} 100%)`,
                                    backgroundSize: '300% 300%',
                                    color: '#ffffff',
                                    boxShadow: `
                                        0 10px 40px ${colors.primary || colors.accent || '#3b82f6'}60,
                                        inset 0 2px 6px rgba(255,255,255,0.3),
                                        inset 0 -2px 6px rgba(0,0,0,0.2),
                                        0 0 60px ${colors.primary || colors.accent || '#3b82f6'}40
                                    `,
                                    animation: 'glow-pulse 3.5s ease-in-out infinite, gradient-shift 5s ease infinite'
                                }}
                            >
                                {/* CEO Premium: Multi-layer shine */}
                                <div className="absolute inset-0 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-700" style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.2) 60%, transparent 100%)`,
                                    animation: 'shimmer 2.5s ease-in-out infinite'
                                }}></div>
                                <div className="absolute inset-0 opacity-50" style={{
                                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)'
                                }}></div>
                                
                                {/* CEO Premium: Multi-layer glow */}
                                <div className="absolute -inset-3 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-700 blur-2xl" style={{
                                    background: `radial-gradient(ellipse, ${colors.primary || colors.accent || '#3b82f6'}70 0%, transparent 70%)`
                                }}></div>
                                <div className="absolute -inset-2 opacity-0 group-hover/icon:opacity-60 transition-opacity duration-500 blur-xl" style={{
                                    background: `radial-gradient(circle, ${colors.accent || colors.primary || '#8b5cf6'}50 0%, transparent 60%)`
                                }}></div>
                                
                                {/* Inner highlight ring */}
                                <div className="absolute inset-1 rounded-2xl opacity-30" style={{
                                    border: `1px solid rgba(255,255,255,0.2)`,
                                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
                                }}></div>
                                
                                <span className="relative z-10 drop-shadow-2xl filter brightness-125 saturate-110">{getThemeIcon(theme.id)}</span>
                                
                                {/* Sparkle particles */}
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1 h-1 rounded-full bg-white opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500"
                                        style={{
                                            left: `${25 + i * 15}%`,
                                            top: `${20 + i * 20}%`,
                                            animation: `sparkle ${2 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`,
                                            boxShadow: `0 0 8px rgba(255,255,255,0.8)`
                                        }}
                                    ></div>
                                ))}
                            </div>
                            <div>
                                <div className="font-bold text-lg tracking-tight" style={{ color: colors.text || previewText }}>
                                    {theme.name}
                                </div>
                                {theme.isDefault && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary || colors.accent || '#3b82f6' }}></div>
                                        <div className="text-xs font-medium opacity-70" style={{ color: colors.textSecondary || colors.text }}>
                                            Thème par défaut
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aperçu des couleurs */}
                <div className="p-5 space-y-4">
                    {/* Palette de couleurs principales avec labels premium */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="text-xs font-bold uppercase tracking-wider opacity-80" style={{ color: colors.textSecondary || colors.text }}>
                                Palette
                            </div>
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${colors.border || 'rgba(255,255,255,0.1)'} 0%, transparent 100%)` }}></div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { color: colors.primary || '#3b82f6', label: 'Primary', name: 'primary' },
                                { color: colors.accent || colors.primary || '#8b5cf6', label: 'Accent', name: 'accent' },
                                { color: colors.success || '#10b981', label: 'Success', name: 'success' },
                                { color: colors.danger || '#ef4444', label: 'Danger', name: 'danger' }
                            ].map((item, idx) => (
                                <div key={idx} className="group/color">
                                    <div
                                        className="h-14 rounded-2xl shadow-xl transition-all duration-500 group-hover/color:scale-110 group-hover/color:shadow-2xl relative overflow-hidden"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                                            boxShadow: `0 6px 20px ${item.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                                        }}
                                        title={item.label}
                                    >
                                        {/* Shine effect */}
                                        <div className="absolute inset-0 opacity-0 group-hover/color:opacity-100 transition-opacity duration-500" style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                                            animation: 'shimmer 2s ease-in-out infinite'
                                        }}></div>
                                        
                                        {/* Glow on hover */}
                                        <div className="absolute -inset-1 opacity-0 group-hover/color:opacity-100 transition-opacity duration-500 blur-lg" style={{
                                            background: `radial-gradient(circle, ${item.color}60 0%, transparent 70%)`
                                        }}></div>
                                        
                                        {/* Inner highlight */}
                                        <div className="absolute top-0 left-0 right-0 h-1/2 opacity-30" style={{
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)'
                                        }}></div>
                                    </div>
                                    <div className="text-[10px] font-bold text-center mt-2.5 opacity-80 tracking-wider uppercase" style={{ color: colors.textSecondary || colors.text }}>
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exemple de card avec plus de détails premium */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="text-xs font-bold uppercase tracking-wider opacity-80" style={{ color: colors.textSecondary || colors.text }}>
                                Aperçu
                            </div>
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${colors.border || 'rgba(255,255,255,0.1)'} 0%, transparent 100%)` }}></div>
                        </div>
                        <div
                            className="p-5 rounded-2xl border backdrop-blur-sm transition-all duration-500 group-hover:shadow-2xl relative overflow-hidden group/card"
                            style={{
                                background: `linear-gradient(135deg, ${colors.surface || colors.background} 0%, ${colors.surfaceLight || colors.surface || colors.background} 50%, ${colors.surface || colors.background} 100%)`,
                                backgroundSize: '200% 200%',
                                borderColor: colors.border || 'rgba(255,255,255,0.1)',
                                color: colors.text || previewText,
                                boxShadow: `0 6px 24px ${colors.primary || 'rgba(0,0,0,0.1)'}30, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.05)`
                            }}
                        >
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" style={{
                                background: `linear-gradient(135deg, ${colors.primary || 'transparent'}08 0%, transparent 50%, ${colors.accent || 'transparent'}05 100%)`,
                                animation: 'glow-pulse 4s ease-in-out infinite'
                            }}></div>
                            
                            {/* Subtle pattern animé */}
                            <div className="absolute inset-0 opacity-[0.03] group-hover/card:opacity-[0.05] transition-opacity duration-500" style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, ${colors.text || previewText} 1px, transparent 0)`,
                                backgroundSize: '16px 16px',
                                animation: 'float 15s ease-in-out infinite'
                            }}></div>
                            
                            {/* Top highlight */}
                            <div className="absolute top-0 left-0 right-0 h-1/3 opacity-20" style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                            }}></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary || colors.accent || '#3b82f6' }}></div>
                                        <div className="text-sm font-bold tracking-tight" style={{ color: colors.text || previewText }}>
                                            AAPL
                                        </div>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg font-bold text-xs" style={{ 
                                        backgroundColor: `${colors.success || '#10b981'}20`,
                                        color: colors.success || '#10b981',
                                        border: `1px solid ${colors.success || '#10b981'}40`
                                    }}>
                                        +2.5%
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold opacity-80" style={{ color: colors.textSecondary || colors.text }}>
                                        $150.25
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs opacity-50" style={{ color: colors.textSecondary || colors.text }}>•</div>
                                        <div className="text-xs font-semibold" style={{ color: colors.danger || '#ef4444' }}>
                                            -1.2%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badge de type avec icône premium */}
                    <div className="flex items-center justify-between pt-5 mt-5 border-t relative" style={{ borderColor: colors.border || 'rgba(255,255,255,0.1)' }}>
                        {/* Gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-px opacity-50" style={{
                            background: `linear-gradient(90deg, transparent 0%, ${colors.primary || colors.accent || '#3b82f6'}50 50%, transparent 100%)`
                        }}></div>
                        
                        <span
                            className="text-xs px-4 py-2.5 rounded-full font-bold flex items-center gap-2.5 transition-all duration-300 hover:scale-110 relative overflow-hidden group/badge"
                            style={{
                                background: isLightTheme 
                                    ? `linear-gradient(135deg, ${colors.primary || '#3b82f6'}25 0%, ${colors.accent || colors.primary || '#8b5cf6'}20 100%)` 
                                    : `linear-gradient(135deg, ${colors.primary || '#3b82f6'}35 0%, ${colors.accent || colors.primary || '#8b5cf6'}30 100%)`,
                                color: colors.primary || colors.accent || previewText,
                                border: `1.5px solid ${colors.primary || colors.accent || '#3b82f6'}60`,
                                boxShadow: `0 3px 12px ${colors.primary || colors.accent || '#3b82f6'}30`
                            }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300" style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%)'
                            }}></div>
                            <span className="relative z-10 text-sm transition-transform duration-300 group-hover/badge:rotate-12">
                                {isLightTheme ? '☀️' : '🌙'}
                            </span>
                            <span className="relative z-10 tracking-wider uppercase text-[10px]">{isLightTheme ? 'Light' : 'Dark'}</span>
                        </span>
                        {!theme.isDefault && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                                backgroundColor: `${colors.primary || colors.accent || '#3b82f6'}15`,
                                border: `1px solid ${colors.primary || colors.accent || '#3b82f6'}30`
                            }}>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.primary || colors.accent || '#3b82f6' }}></div>
                                <span className="text-xs font-bold opacity-70 tracking-wider uppercase" style={{ color: colors.primary || colors.accent || colors.text }}>
                                    Custom
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay au hover */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary || 'transparent'}08 0%, transparent 100%)`
                    }}
                ></div>
            </div>
        );
    };

    return (
        <>
            {/* Toggle DarkMode/Light si thème par défaut */}
            {isDarkLightTheme && (
                <button
                    onClick={handleToggleDarkLight}
                    className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden group/toggle ${
                        isDarkMode
                            ? 'bg-gradient-to-r from-gray-800 via-gray-750 to-gray-700 hover:from-gray-700 hover:via-gray-650 hover:to-gray-600 text-white border border-gray-600/40'
                            : 'bg-gradient-to-r from-gray-100 via-white to-gray-50 hover:from-gray-200 hover:via-gray-100 hover:to-gray-50 text-gray-900 border border-gray-300/40'
                    }`}
                    title={currentTheme === 'darkmode' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-500" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                    }}></div>
                    <span className="relative z-10 text-xl transition-all duration-300 group-hover/toggle:rotate-12 group-hover/toggle:scale-110">
                        {currentTheme === 'darkmode' ? '🌙' : '☀️'}
                    </span>
                    <span className="relative z-10 hidden sm:inline font-bold tracking-tight">{currentTheme === 'darkmode' ? 'Dark' : 'Light'}</span>
                </button>
            )}
            
            {/* Bouton pour ouvrir la modal */}
            <button
                onClick={() => setIsOpen(true)}
                className={`relative flex items-center gap-3 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden group/theme ${
                    isDarkMode
                        ? 'bg-gradient-to-r from-gray-800 via-gray-750 to-gray-700 hover:from-gray-700 hover:via-gray-650 hover:to-gray-600 text-white border border-gray-600/40'
                        : 'bg-gradient-to-r from-gray-100 via-white to-gray-50 hover:from-gray-200 hover:via-gray-100 hover:to-gray-50 text-gray-900 border border-gray-300/40'
                }`}
                title="Changer le thème"
            >
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover/theme:opacity-100 transition-opacity duration-500" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                }}></div>
                
                {/* Glow effect */}
                <div className="absolute -inset-1 opacity-0 group-hover/theme:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" style={{
                    background: `radial-gradient(circle, ${isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)'} 0%, transparent 70%)`
                }}></div>
                
                <span className="relative z-10 text-xl transition-all duration-300 group-hover/theme:rotate-12 group-hover/theme:scale-110">
                    {currentThemeData ? getThemeIcon(currentThemeData.id) : '🎨'}
                </span>
                <span className="relative z-10 hidden sm:inline font-bold tracking-tight">{currentThemeData?.name || 'Thème'}</span>
                <svg className="relative z-10 w-4 h-4 transition-all duration-300 group-hover/theme:translate-y-1 group-hover/theme:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* CEO Premium: Modal ultra-sophisticated */}
            {isOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-xl animate-fadeIn theme-selector-modal"
                    style={{ 
                        zIndex: 10000,
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `
                            radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
                            rgba(0, 0, 0, 0.88)
                        `,
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                    }}
                    onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                >
                    {/* CEO Premium: Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                    background: `radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animation: `float ${10 + Math.random() * 10}s ease-in-out infinite ${Math.random() * 2}s`,
                                    boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`
                                }}
                            ></div>
                        ))}
                    </div>
                    <div
                        ref={modalRef}
                        className={`relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-700 group/modal ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/20' 
                                : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200/20'
                        }`}
                        style={{
                            zIndex: 10001,
                            position: 'relative',
                            boxShadow: `
                                0 30px 100px rgba(0, 0, 0, 0.7),
                                0 0 0 1px rgba(255, 255, 255, 0.08),
                                inset 0 2px 4px rgba(255, 255, 255, 0.1),
                                inset 0 -2px 4px rgba(0, 0, 0, 0.1)
                            `,
                            backdropFilter: 'blur(24px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(180%)'
                        }}
                    >
                        {/* Animated border glow multi-layer */}
                        <div 
                            className="absolute -inset-1 rounded-3xl opacity-0 group-hover/modal:opacity-100 transition-opacity duration-700 pointer-events-none blur-2xl"
                            style={{
                                background: `radial-gradient(circle at 30% 30%, ${isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)'} 0%, transparent 60%)`,
                                zIndex: -1,
                                animation: 'glow-pulse 3s ease-in-out infinite'
                            }}
                        ></div>
                        <div 
                            className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover/modal:opacity-60 transition-opacity duration-500 pointer-events-none blur-lg"
                            style={{
                                background: `radial-gradient(circle at 70% 70%, ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'} 0%, transparent 50%)`,
                                zIndex: -1
                            }}
                        ></div>
                        
                        {/* Corner accents avec animation */}
                        <div className="absolute top-0 left-0 w-40 h-40 opacity-0 group-hover/modal:opacity-20 transition-opacity duration-1000 pointer-events-none" style={{
                            background: `radial-gradient(circle, ${isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.4)'} 0%, transparent 70%)`,
                            filter: 'blur(30px)',
                            animation: 'glow-pulse 4s ease-in-out infinite'
                        }}></div>
                        <div className="absolute bottom-0 right-0 w-40 h-40 opacity-0 group-hover/modal:opacity-20 transition-opacity duration-1000 pointer-events-none" style={{
                            background: `radial-gradient(circle, ${isDarkMode ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.4)'} 0%, transparent 70%)`,
                            filter: 'blur(30px)',
                            animation: 'glow-pulse 4s ease-in-out infinite 1s'
                        }}></div>
                        {/* CEO Premium: Header modal ultra-sophisticated */}
                        <div className={`sticky top-0 z-20 p-8 border-b backdrop-blur-2xl relative overflow-hidden ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-gray-900/99 via-gray-800/97 to-gray-900/99 border-gray-700/20' 
                                : 'bg-gradient-to-br from-white/99 via-gray-50/97 to-white/99 border-gray-200/20'
                        }`}
                        style={{
                            boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)'
                        }}
                        >
                            {/* CEO Premium: Multi-layer pattern */}
                            <div className={`absolute inset-0 opacity-[0.03] ${
                                isDarkMode ? 'bg-white' : 'bg-black'
                            }`} style={{
                                backgroundImage: `
                                    radial-gradient(circle at 3px 3px, currentColor 1px, transparent 0),
                                    radial-gradient(circle at 18px 18px, currentColor 0.5px, transparent 0)
                                `,
                                backgroundSize: '36px 36px, 40px 40px',
                                animation: 'float 30s ease-in-out infinite'
                            }}></div>
                            
                            {/* CEO Premium: Gradient mesh */}
                            <div className="absolute inset-0 opacity-30" style={{
                                background: `
                                    radial-gradient(ellipse at 0% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                                    radial-gradient(ellipse at 100% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
                                `
                            }}></div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden group/header-icon transition-all duration-500 hover:scale-110 hover:rotate-6 ${
                                        isDarkMode 
                                            ? 'bg-gradient-to-br from-gray-800 via-gray-750 to-gray-700 border border-gray-700/40' 
                                            : 'bg-gradient-to-br from-gray-100 via-white to-gray-50 border border-gray-200/40'
                                    }`}
                                    style={{
                                        boxShadow: `
                                            0 8px 32px rgba(0,0,0,0.3),
                                            inset 0 2px 4px rgba(255,255,255,0.1),
                                            inset 0 -2px 4px rgba(0,0,0,0.1)
                                        `
                                    }}
                                    >
                                        {/* CEO Premium: Multi-layer shine */}
                                        <div className="absolute inset-0 opacity-0 group-hover/header-icon:opacity-100 transition-opacity duration-500" style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                                            animation: 'luxury-shimmer 3s ease-in-out infinite'
                                        }}></div>
                                        <div className="absolute inset-0 opacity-30" style={{
                                            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)'
                                        }}></div>
                                        
                                        {/* Inner glow */}
                                        <div className="absolute inset-2 rounded-2xl opacity-20" style={{
                                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                                            filter: 'blur(8px)'
                                        }}></div>
                                        
                                        <span className="relative z-10 drop-shadow-2xl filter brightness-110">🎨</span>
                                    </div>
                                    <div>
                                        <h2 className={`text-4xl font-black tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                        style={{
                                            textShadow: isDarkMode 
                                                ? '0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(59, 130, 246, 0.2)'
                                                : '0 1px 4px rgba(0,0,0,0.1)'
                                        }}
                                        >
                                            Sélectionner un thème
                                        </h2>
                                        <p className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Personnalisez l'apparence de votre dashboard avec style
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={`p-3.5 rounded-2xl transition-all duration-500 hover:scale-110 hover:rotate-90 relative group/close ${
                                        isDarkMode
                                            ? 'hover:bg-gray-800/90 text-gray-400 hover:text-white border border-gray-700/30'
                                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200/30'
                                    }`}
                                    style={{
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                                    }}
                                    title="Fermer (Esc)"
                                >
                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/close:opacity-100 transition-opacity duration-500" style={{
                                        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                                    }}></div>
                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/close:opacity-50 transition-opacity duration-300" style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                                    }}></div>
                                    <svg className="w-6 h-6 relative z-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Grille des thèmes avec scroll personnalisé */}
                        <div className="p-8 overflow-y-auto max-h-[calc(92vh-180px)] custom-scrollbar relative">
                            {/* Gradient fade en haut et bas pour indiquer le scroll */}
                            <div className={`sticky top-0 left-0 right-0 h-8 pointer-events-none z-10 ${
                                isDarkMode 
                                    ? 'bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent' 
                                    : 'bg-gradient-to-b from-white via-white/80 to-transparent'
                            }`}></div>
                            <div className={`sticky bottom-0 left-0 right-0 h-8 pointer-events-none z-10 ${
                                isDarkMode 
                                    ? 'bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent' 
                                    : 'bg-gradient-to-t from-white via-white/80 to-transparent'
                            }`}></div>
                            {/* Thèmes par défaut */}
                            {defaultThemesList.length > 0 && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-4 mb-7 relative">
                                        <div className={`w-2 h-10 rounded-full shadow-xl relative overflow-hidden ${
                                            isDarkMode ? 'bg-gradient-to-b from-blue-500 via-blue-500 to-blue-600' : 'bg-gradient-to-b from-blue-600 via-blue-600 to-blue-700'
                                        }`}>
                                            <div className="absolute inset-0 opacity-50" style={{
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)'
                                            }}></div>
                                        </div>
                                        <h3 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Thèmes par défaut
                                        </h3>
                                        <div className={`flex-1 h-px relative ${
                                            isDarkMode 
                                                ? 'bg-gradient-to-r from-gray-700 via-gray-600/50 to-transparent' 
                                                : 'bg-gradient-to-r from-gray-200 via-gray-300/50 to-transparent'
                                        }`}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse"></div>
                                        </div>
                                        <span className={`text-xs px-4 py-2 rounded-full font-extrabold shadow-lg relative overflow-hidden ${
                                            isDarkMode 
                                                ? 'bg-gradient-to-br from-gray-800 via-gray-750 to-gray-700 text-gray-200 border border-gray-700/50' 
                                                : 'bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-700 border border-gray-200/50'
                                        }`}>
                                            <div className="absolute inset-0 opacity-20" style={{
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                                            }}></div>
                                            <span className="relative z-10">{defaultThemesList.length}</span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {defaultThemesList.map((theme, idx) => (
                                            <div key={theme.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-fadeIn">
                                                {renderThemePreview(theme)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Thèmes personnalisés */}
                            {customThemesList.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-4 mb-7 relative">
                                        <div className={`w-2 h-10 rounded-full shadow-xl relative overflow-hidden ${
                                            isDarkMode ? 'bg-gradient-to-b from-purple-500 via-purple-500 to-purple-600' : 'bg-gradient-to-b from-purple-600 via-purple-600 to-purple-700'
                                        }`}>
                                            <div className="absolute inset-0 opacity-50" style={{
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)'
                                            }}></div>
                                        </div>
                                        <h3 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Thèmes personnalisés
                                        </h3>
                                        <div className={`flex-1 h-px relative ${
                                            isDarkMode 
                                                ? 'bg-gradient-to-r from-gray-700 via-gray-600/50 to-transparent' 
                                                : 'bg-gradient-to-r from-gray-200 via-gray-300/50 to-transparent'
                                        }`}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse"></div>
                                        </div>
                                        <span className={`text-xs px-4 py-2 rounded-full font-extrabold shadow-lg relative overflow-hidden ${
                                            isDarkMode 
                                                ? 'bg-gradient-to-br from-gray-800 via-gray-750 to-gray-700 text-gray-200 border border-gray-700/50' 
                                                : 'bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-700 border border-gray-200/50'
                                        }`}>
                                            <div className="absolute inset-0 opacity-20" style={{
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                                            }}></div>
                                            <span className="relative z-10">{customThemesList.length}</span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {customThemesList.map((theme, idx) => (
                                            <div key={theme.id} style={{ animationDelay: `${(defaultThemesList.length + idx) * 50}ms` }} className="animate-fadeIn">
                                                {renderThemePreview(theme)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Message si aucun thème */}
                            {themes.length === 0 && (
                                <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <div className="text-4xl mb-4">🎨</div>
                                    <p className="text-lg font-medium">Aucun thème disponible</p>
                                </div>
                            )}
                        </div>

                        {/* Footer avec info et gradient premium */}
                        <div className={`p-6 border-t backdrop-blur-xl relative overflow-hidden ${
                            isDarkMode 
                                ? 'bg-gradient-to-r from-gray-900/98 via-gray-800/95 to-gray-900/98 border-gray-700/30' 
                                : 'bg-gradient-to-r from-white/98 via-gray-50/95 to-white/98 border-gray-200/30'
                        }`}>
                            {/* Pattern subtil */}
                            <div className={`absolute inset-0 opacity-[0.015] ${
                                isDarkMode ? 'bg-white' : 'bg-black'
                            }`} style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                                backgroundSize: '20px 20px'
                            }}></div>
                            
                            <div className="flex items-center justify-center gap-3 relative z-10">
                                <div className={`p-2 rounded-lg ${
                                    isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
                                }`}>
                                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className={`text-sm font-semibold tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Le thème sélectionné est sauvegardé automatiquement
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Exposer globalement
window.ThemeSelector = ThemeSelector;
