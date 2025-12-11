/**
 * Système de thèmes pour le Dashboard GOB
 * Thèmes par défaut: Terminal, IA, DarkMode, Light
 * Thèmes personnalisés: MarketQ, Bloomberg Terminal, Seeking Alpha, etc.
 */

// Thèmes par défaut (Terminal, IA, DarkMode, Light) - DÉFINIS EN PREMIER
const defaultThemes = {
    'terminal': {
        name: 'Terminal',
        id: 'terminal',
        isDefault: true,
        colors: {
            primary: '#ffcc00', // yellow (#FFCC00) - couleur principale terminal
            secondary: '#00ff00', // green (#00FF00) - accents secondaires
            background: '#000000', // black (#000000) - fond principal
            surface: '#0a0a0a', // near black (#0A0A0A) - cards, panels
            surfaceLight: '#1a1a1a', // dark gray (#1A1A1A) - hover states
            text: '#ffcc00', // yellow (#FFCC00) - texte principal
            textSecondary: '#888888', // medium gray (#888888) - texte secondaire
            textGreen: '#00ff00', // green (#00FF00) - gains
            textRed: '#ff0000', // red (#FF0000) - pertes
            border: '#333333', // dark gray (#333333) - bordures
            accent: '#ffcc00', // yellow (highlights, focus)
            success: '#00ff00', // green (#00FF00)
            danger: '#ff0000', // red (#FF0000)
            warning: '#ffcc00', // yellow (alerts)
        },
        fonts: {
            primary: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace',
            secondary: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace',
            mono: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace'
        },
        styles: {
            headerBg: '#000000',
            cardBg: '#0a0a0a',
            cardBorder: '1px solid #333333',
            borderRadius: '0',
            shadow: 'none',
        }
    },
    'ia': {
        name: 'IA',
        id: 'ia',
        isDefault: true,
        colors: {
            primary: '#8b5cf6', // purple (#8B5CF6) - couleur principale IA
            secondary: '#a78bfa', // lighter purple (#A78BFA) - accents secondaires
            background: '#000000', // black (#000000) - fond principal
            surface: '#111827', // gray-900 (#111827) - cards, panels
            surfaceLight: '#1f2937', // gray-800 (#1F2937) - hover states
            text: '#ffffff', // white (#FFFFFF) - texte principal
            textSecondary: '#9ca3af', // gray-400 (#9CA3AF) - texte secondaire
            border: '#374151', // gray-700 (#374151) - bordures
            accent: '#8b5cf6', // purple (highlights, focus)
            success: '#10b981', // emerald-500 (#10B981)
            danger: '#ef4444', // red-500 (#EF4444)
            warning: '#f59e0b', // amber-500 (#F59E0B)
        },
        fonts: {
            primary: 'Inter, sans-serif',
            secondary: 'Roboto, sans-serif',
            mono: 'monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            cardBg: '#111827',
            cardBorder: '1px solid #374151',
            borderRadius: '0.75rem',
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }
    },
    'darkmode': {
        name: 'Dark Mode',
        id: 'darkmode',
        isDefault: true,
        colors: {
            primary: '#10b981', // emerald-500 (#10B981) - couleur principale
            secondary: '#3b82f6', // blue-500 (#3B82F6) - accents secondaires
            background: '#000000', // black (#000000) - fond principal
            surface: '#111827', // gray-900 (#111827) - cards, panels
            surfaceLight: '#1f2937', // gray-800 (#1F2937) - hover states
            text: '#ffffff', // white (#FFFFFF) - texte principal
            textSecondary: '#9ca3af', // gray-400 (#9CA3AF) - texte secondaire
            border: '#374151', // gray-700 (#374151) - bordures
            accent: '#8b5cf6', // purple-500 (#8B5CF6) - highlights
            success: '#10b981', // emerald-500 (#10B981)
            danger: '#ef4444', // red-500 (#EF4444)
            warning: '#f59e0b', // amber-500 (#F59E0B)
        },
        fonts: {
            primary: 'Inter, sans-serif',
            secondary: 'Roboto, sans-serif',
            mono: 'monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            cardBg: '#111827',
            cardBorder: '1px solid #374151',
            borderRadius: '0.75rem',
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }
    },
    'light': {
        name: 'Light',
        id: 'light',
        isDefault: true,
        colors: {
            primary: '#10b981', // emerald-500 (#10B981) - couleur principale
            secondary: '#3b82f6', // blue-500 (#3B82F6) - accents secondaires
            background: '#ffffff', // white (#FFFFFF) - fond principal
            surface: '#f5f5f5', // gray-100 (#F5F5F5) - cards, panels
            surfaceLight: '#ffffff', // white (#FFFFFF) - hover states
            text: '#1a1a1a', // near black (#1A1A1A) - texte principal
            textSecondary: '#666666', // gray-600 (#666666) - texte secondaire
            border: '#d0d0d0', // gray-300 (#D0D0D0) - bordures
            accent: '#8b5cf6', // purple-500 (#8B5CF6) - highlights
            success: '#10b981', // emerald-500 (#10B981)
            danger: '#ef4444', // red-500 (#EF4444)
            warning: '#f59e0b', // amber-500 (#F59E0B)
        },
        fonts: {
            primary: 'Inter, sans-serif',
            secondary: 'Roboto, sans-serif',
            mono: 'monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
            cardBg: '#ffffff',
            cardBorder: '1px solid #d0d0d0',
            borderRadius: '0.75rem',
            shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }
    }
};

// Thèmes personnalisés
const customThemes = {
    default: {
        name: 'Par défaut',
        id: 'default',
        colors: {
            primary: '#10b981', // emerald-500
            secondary: '#3b82f6', // blue-500
            background: '#000000', // black
            surface: '#111827', // gray-900
            surfaceLight: '#1f2937', // gray-800
            text: '#ffffff',
            textSecondary: '#9ca3af', // gray-400
            border: '#374151', // gray-700
            accent: '#8b5cf6', // purple-500
            success: '#10b981', // emerald-500
            danger: '#ef4444', // red-500
            warning: '#f59e0b', // amber-500
        },
        fonts: {
            primary: 'Inter, sans-serif',
            secondary: 'Roboto, sans-serif',
            mono: 'monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            cardBg: '#111827',
            cardBorder: '1px solid #374151',
            borderRadius: '0.75rem',
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }
    },
    marketq: {
        name: 'MarketQ',
        id: 'marketq',
        colors: {
            primary: '#00d4ff', // cyan brillant (#00D4FF) - data-focused, accents principaux
            secondary: '#0066cc', // blue profond (#0066CC) - liens, actions secondaires
            background: '#0a0e27', // dark navy blue (#0A0E27) - fond principal
            surface: '#141b3d', // darker blue (#141B3D) - cards, panels
            surfaceLight: '#1e2749', // medium blue (#1E2749) - hover states, active
            text: '#e0e7ff', // light blue-white (#E0E7FF) - texte principal
            textSecondary: '#94a3b8', // slate-400 (#94A3B8) - texte secondaire
            textGreen: '#00ff88', // green-cyan brillant (#00FF88) - gains
            textRed: '#ff3366', // pink-red (#FF3366) - pertes
            border: 'rgba(0, 212, 255, 0.25)', // cyan avec transparence (bordures)
            accent: '#00d4ff', // cyan (highlights, focus, CTA)
            success: '#00ff88', // green-cyan brillant (#00FF88) - gains
            danger: '#ff3366', // pink-red (#FF3366) - pertes
            warning: '#ffaa00', // orange (#FFAA00) - alertes
        },
        fonts: {
            primary: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: '"Inter", "Roboto", "Helvetica Neue", "Helvetica", system-ui, sans-serif',
            mono: '"SF Mono", "Consolas", "Monaco", "Menlo", "Courier New", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #141b3d 0%, #1e2749 100%)',
            cardBg: '#141b3d',
            cardBorder: '1px solid rgba(0, 212, 255, 0.25)', // cyan avec transparence légèrement plus visible
            borderRadius: '0.5rem',
            shadow: '0 4px 16px rgba(0, 212, 255, 0.2)', // glow cyan plus prononcé
        }
    },
    'marketq-dark': {
        name: 'MarketQ Noir',
        id: 'marketq-dark',
        colors: {
            primary: '#00d4ff', // cyan brillant (#00D4FF) - accents principaux
            secondary: '#00a8cc', // cyan plus foncé (#00A8CC) - accents secondaires
            background: '#000000', // noir pur (#000000) - fond principal
            surface: '#0a0a0a', // near black (#0A0A0A) - cards, panels
            surfaceLight: '#1a1a1a', // dark gray (#1A1A1A) - hover states, active
            text: '#ffffff', // white (#FFFFFF) - texte principal
            textSecondary: '#888888', // medium gray (#888888) - texte secondaire
            textGreen: '#00ff88', // green-cyan brillant (#00FF88) - gains
            textRed: '#ff3366', // pink-red (#FF3366) - pertes
            border: 'rgba(0, 212, 255, 0.15)', // cyan très subtil (bordures)
            accent: '#00d4ff', // cyan (highlights, focus, CTA)
            success: '#00ff88', // green-cyan brillant (#00FF88) - gains
            danger: '#ff3366', // pink-red (#FF3366) - pertes
            warning: '#ffaa00', // orange (#FFAA00) - alertes
        },
        fonts: {
            primary: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: '"Inter", "Roboto", "Helvetica Neue", "Helvetica", system-ui, sans-serif',
            mono: '"SF Mono", "Consolas", "Monaco", "Menlo", "Courier New", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            cardBg: '#0a0a0a',
            cardBorder: '1px solid rgba(0, 212, 255, 0.15)', // cyan très subtil
            borderRadius: '0.5rem',
            shadow: '0 4px 20px rgba(0, 212, 255, 0.15)', // glow cyan subtil sur noir
        }
    },
    'bloomberg-terminal': {
        name: 'Bloomberg Terminal',
        id: 'bloomberg-terminal',
        colors: {
            primary: '#ffcc00', // Bloomberg yellow (#FFCC00 exact) - utilisé pour texte principal
            secondary: '#00ff00', // green brillant (#00FF00) pour données positives/gains
            background: '#000000', // black pur (#000000)
            surface: '#0a0a0a', // near black (panels, cards)
            surfaceLight: '#1a1a1a', // dark gray (hover states, active)
            text: '#ffcc00', // Bloomberg yellow (texte principal)
            textSecondary: '#888888', // medium gray (texte secondaire)
            textGreen: '#00ff00', // green brillant (#00FF00) pour gains
            textRed: '#ff0000', // red brillant (#FF0000) pour pertes
            textOrange: '#ff8800', // orange (#FF8800) pour alertes/warnings
            border: '#333333', // dark gray (bordures)
            accent: '#ffcc00', // Bloomberg yellow (highlights, focus)
            success: '#00ff00', // green brillant (#00FF00)
            danger: '#ff0000', // red brillant (#FF0000)
            warning: '#ffcc00', // yellow (alerts)
        },
        fonts: {
            primary: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace',
            secondary: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace',
            mono: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace'
        },
        styles: {
            headerBg: '#000000',
            cardBg: '#0a0a0a',
            cardBorder: '1px solid #333333',
            borderRadius: '0', // pas de border-radius (style terminal strict)
            shadow: 'none', // pas d'ombre (style terminal)
        }
    },
    'seeking-alpha': {
        name: 'Seeking Alpha',
        id: 'seeking-alpha',
        colors: {
            primary: '#ff6b35', // Seeking Alpha orange (#FF6B35 exact) - boutons CTA
            secondary: '#1a73e8', // Google blue pour liens
            background: '#ffffff', // white (contenu principal)
            surface: '#f8f9fa', // very light gray (header, cards)
            surfaceLight: '#ffffff', // white (hover states)
            surfaceDark: '#2d2d2d', // dark gray (sidebar gauche)
            text: '#202124', // Google dark gray (texte principal)
            textSecondary: '#5f6368', // Google medium gray
            textGreen: '#34a853', // Google green (gains)
            textRed: '#ea4335', // Google red (pertes)
            border: '#dadce0', // Google light gray (bordures)
            accent: '#ff6b35', // orange (navigation sélectionnée, highlights)
            success: '#34a853', // Google green
            danger: '#ea4335', // Google red
            warning: '#fbbc04', // Google yellow
        },
        fonts: {
            primary: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
            mono: '"SF Mono", "Consolas", "Monaco", "Menlo", "Courier New", monospace'
        },
        styles: {
            headerBg: '#f5f5f5', // gris clair pour header
            cardBg: '#ffffff',
            cardBorder: '1px solid #dadce0',
            borderRadius: '0.5rem',
            shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }
    },
    'bloomberg-mobile': {
        name: 'Bloomberg Mobile',
        id: 'bloomberg-mobile',
        colors: {
            primary: '#ffcc00', // Bloomberg yellow (#FFCC00) - accents, highlights
            secondary: '#ffffff', // white (#FFFFFF) - texte sur fond sombre
            background: '#1a1a1a', // dark gray (#1A1A1A) - fond principal
            surface: '#2a2a2a', // medium gray (#2A2A2A) - cards, panels
            surfaceLight: '#3a3a3a', // lighter gray (#3A3A3A) - hover, active
            text: '#ffffff', // white (#FFFFFF) - texte principal
            textSecondary: '#b0b0b0', // light gray (#B0B0B0) - texte secondaire
            textGreen: '#4caf50', // Material green (#4CAF50) - gains
            textRed: '#f44336', // Material red (#F44336) - pertes
            border: '#444444', // gray (#444444) - bordures
            accent: '#ffcc00', // Bloomberg yellow (highlights, CTA)
            success: '#4caf50', // Material green (#4CAF50)
            danger: '#f44336', // Material red (#F44336)
            warning: '#ff9800', // Material orange (#FF9800)
        },
        fonts: {
            primary: '"Roboto", "Helvetica Neue", "Helvetica", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: '"Inter", "Roboto", system-ui, sans-serif',
            mono: '"SF Mono", "Consolas", "Monaco", "Menlo", "Courier New", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
            cardBg: '#2a2a2a',
            cardBorder: '1px solid #444444',
            borderRadius: '1rem', // arrondi généreux pour mobile (touch-friendly)
            shadow: '0 4px 12px rgba(0, 0, 0, 0.5)', // ombre plus prononcée pour profondeur
        }
    },
    'bloomberg-nostalgie': {
        name: 'Bloomberg Nostalgie',
        id: 'bloomberg-nostalgie',
        colors: {
            primary: '#8b5cf6', // purple/violet (#8B5CF6) - accents principaux (style rétro)
            secondary: '#a78bfa', // lighter purple (#A78BFA) - accents secondaires
            background: '#ffffff', // white (#FFFFFF) - fond principal (style années 1990)
            surface: '#f8f9fa', // very light gray (#F8F9FA) - cards, panels
            surfaceLight: '#ffffff', // white (#FFFFFF) - hover states
            surfaceDark: '#e9ecef', // light gray (#E9ECEF) - borders, separators
            text: '#4c1d95', // deep purple (#4C1D95) - texte principal
            textSecondary: '#6b7280', // medium gray (#6B7280) - texte secondaire
            textGreen: '#10b981', // emerald (#10B981) - gains (style moderne mais discret)
            textRed: '#ef4444', // red (#EF4444) - pertes
            border: '#d1d5db', // light gray (#D1D5DB) - bordures
            accent: '#8b5cf6', // purple (highlights, CTA)
            success: '#10b981', // emerald (#10B981)
            danger: '#ef4444', // red (#EF4444)
            warning: '#f59e0b', // amber (#F59E0B)
        },
        fonts: {
            primary: '"Georgia", "Times New Roman", "Palatino", "Times", serif', // Style rétro années 1990
            secondary: '"Courier New", "Courier", "Consolas", "Monaco", monospace', // Style terminal rétro
            mono: '"Courier New", "Courier", "Consolas", "Monaco", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            cardBg: '#ffffff',
            cardBorder: '2px solid #8b5cf6', // Bordure violette style rétro
            borderRadius: '0.25rem', // Légèrement arrondi (style années 1990)
            shadow: '0 2px 8px rgba(139, 92, 246, 0.15)', // Ombre violette subtile
        }
    },
    desjardins: {
        name: 'Vert Professionnel',
        id: 'desjardins',
        colors: {
            primary: '#006747', // Vert foncé (#006747) - couleur principale
            secondary: '#00a651', // Vert plus clair (#00A651) - accents
            background: '#ffffff', // Blanc (#FFFFFF) - fond principal
            surface: '#f5f5f5', // Gris très clair (#F5F5F5) - cards, panels
            surfaceLight: '#ffffff', // Blanc (#FFFFFF) - hover states
            surfaceDark: '#e8e8e8', // Gris clair (#E8E8E8) - borders, separators
            text: '#1a1a1a', // Noir/gris foncé (#1A1A1A) - texte principal
            textSecondary: '#666666', // Gris moyen (#666666) - texte secondaire
            textGreen: '#00a651', // Vert (#00A651) - gains
            textRed: '#d32f2f', // Rouge (#D32F2F) - pertes
            border: '#d0d0d0', // Gris clair (#D0D0D0) - bordures
            accent: '#006747', // Vert foncé (highlights, CTA)
            success: '#00a651', // Vert (#00A651) - success
            danger: '#d32f2f', // Rouge (#D32F2F) - danger
            warning: '#ff9800', // Orange (#FF9800) - alertes
        },
        fonts: {
            primary: '"Arial", "Helvetica Neue", "Helvetica", "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: '"Inter", "Arial", "Helvetica Neue", "Helvetica", system-ui, sans-serif',
            mono: '"SF Mono", "Consolas", "Monaco", "Menlo", "Courier New", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #006747 0%, #00a651 100%)', // Dégradé vert
            cardBg: '#ffffff',
            cardBorder: '1px solid #d0d0d0',
            borderRadius: '0.5rem', // Arrondi modéré
            shadow: '0 2px 8px rgba(0, 103, 71, 0.1)', // Ombre verte subtile
        }
    },
    'lightglass': {
        name: 'LightGlass Effect',
        id: 'lightglass',
        colors: {
            primary: '#0ea5e9', // Sky Blue
            secondary: '#6366f1', // Indigo
            background: 'fixed', // Special keyword for mesh
            surface: 'rgba(255, 255, 255, 0.45)', // More transparent for better glass effect
            surfaceLight: 'rgba(255, 255, 255, 0.65)',
            surfaceDark: 'rgba(255, 255, 255, 0.3)',
            text: '#0f172a', // Slate 900
            textSecondary: '#475569', // Slate 600
            textGreen: '#059669', // Emerald 600
            textRed: '#dc2626', // Red 600
            border: 'rgba(255, 255, 255, 0.5)',
            accent: '#0ea5e9',
            success: '#059669',
            danger: '#dc2626',
            warning: '#d97706',
        },
        fonts: {
            primary: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            secondary: '"Inter", sans-serif',
            mono: '"JetBrains Mono", "Fira Code", monospace'
        },
        styles: {
            headerBg: 'rgba(255, 255, 255, 0.5)',
            cardBg: 'rgba(255, 255, 255, 0.45)',
            cardBorder: '1px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '1.25rem',
            shadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            backdropFilter: 'blur(20px) saturate(180%)' // Premium Glass effect
        }
    }
};

// Fusionner tous les thèmes (défaut + personnalisés)
const allThemes = {
    ...defaultThemes,
    ...customThemes
};

// Fonction pour appliquer un thème
function applyTheme(themeId) {
    // Validation du themeId
    if (!themeId || typeof themeId !== 'string') {
        console.warn('Theme ID invalide, utilisation du thème par défaut');
        themeId = 'darkmode';
    }
    
    // Utiliser allThemes pour inclure les thèmes par défaut
    const theme = allThemes[themeId] || allThemes.darkmode || defaultThemes.darkmode;
    
    // Validation du thème
    if (!theme || !theme.colors || !theme.styles || !theme.fonts) {
        console.error('Thème invalide:', themeId, 'Utilisation du thème par défaut');
        return applyTheme('darkmode');
    }
    
    const root = document.documentElement;
    
    // Fonction helper pour convertir hex en RGB
    const hexToRgb = (hex) => {
        if (!hex || hex === 'fixed') return { r: 14, g: 165, b: 233 }; // Default fallback
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 16, g: 185, b: 129 }; // Default emerald
    };
    
    // Gestion du Background Spécial (Mesh Gradient pour effet verre)
    if (theme.id === 'lightglass') {
        document.body.style.background = `
            radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)
        `;
        // Override avec le Light Mesh Gradient spécifique
        document.body.style.backgroundImage = `
            radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(240,100%,70%,1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%),
            radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)
        `;
        document.body.style.backgroundColor = '#e0f2fe';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        // Reset background
        document.body.style.background = '';
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '';
        root.style.setProperty('--theme-bg', theme.colors.background);
    }

    // Appliquer les variables CSS de base
    if (theme.colors.background !== 'fixed') {
         root.style.setProperty('--theme-bg', theme.colors.background);
    }
    
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-surface-light', theme.colors.surfaceLight);
    root.style.setProperty('--theme-surface-dark', theme.colors.surfaceDark || theme.colors.surface);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-danger', theme.colors.danger);
    root.style.setProperty('--theme-warning', theme.colors.warning);
    
    // Backdrop Filter Support
    if (theme.styles.backdropFilter) {
        root.style.setProperty('--theme-backdrop-filter', theme.styles.backdropFilter);
        // Injecter style global pour forcer le blur sur les éléments clés si nécessaire
        // Note: Idéalement, les composants devraient utiliser var(--theme-backdrop-filter)
        // On l'ajoute dynamiquement au root pour être sûr
        const backdropStyle = document.getElementById('theme-backdrop-style');
        if (!backdropStyle) {
            const style = document.createElement('style');
            style.id = 'theme-backdrop-style';
            style.innerHTML = `
                .glass-panel, .card, .dashboard-card, header, .nav-bar {
                    backdrop-filter: var(--theme-backdrop-filter, none);
                    -webkit-backdrop-filter: var(--theme-backdrop-filter, none);
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        root.style.setProperty('--theme-backdrop-filter', 'none');
    }
    
    // Ajouter les valeurs RGB pour les rgba() dans les styles inline
    const primaryRgb = hexToRgb(theme.colors.primary);
    const successRgb = hexToRgb(theme.colors.success);
    const dangerRgb = hexToRgb(theme.colors.danger);
    const accentRgb = hexToRgb(theme.colors.accent || theme.colors.primary);
    root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    root.style.setProperty('--theme-success-rgb', `${successRgb.r}, ${successRgb.g}, ${successRgb.b}`);
    root.style.setProperty('--theme-danger-rgb', `${dangerRgb.r}, ${dangerRgb.g}, ${dangerRgb.b}`);
    root.style.setProperty('--theme-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
    
    // Variables spécifiques pour certains thèmes
    if (theme.colors.textGreen) {
        root.style.setProperty('--theme-text-green', theme.colors.textGreen);
    }
    if (theme.colors.textRed) {
        root.style.setProperty('--theme-text-red', theme.colors.textRed);
    }
    if (theme.colors.textOrange) {
        root.style.setProperty('--theme-text-orange', theme.colors.textOrange);
    }
    if (theme.colors.surfaceDark) {
        root.style.setProperty('--theme-surface-dark', theme.colors.surfaceDark);
    }
    
    // Appliquer les styles
    root.style.setProperty('--theme-header-bg', theme.styles.headerBg);
    root.style.setProperty('--theme-card-bg', theme.styles.cardBg);
    root.style.setProperty('--theme-card-border', theme.styles.cardBorder);
    root.style.setProperty('--theme-border-radius', theme.styles.borderRadius);
    root.style.setProperty('--theme-shadow', theme.styles.shadow);
    
    // Appliquer les polices
    root.style.setProperty('--theme-font-primary', theme.fonts.primary);
    root.style.setProperty('--theme-font-secondary', theme.fonts.secondary);
    root.style.setProperty('--theme-font-mono', theme.fonts.mono);
    
    // Ajouter une classe au body pour le thème
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);
    
    // Sauvegarder dans localStorage
    try {
        localStorage.setItem('gob-dashboard-theme', themeId);
    } catch (error) {
        console.warn('Impossible de sauvegarder le thème dans localStorage:', error);
    }
    
    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId } }));
    
    return theme;
}

// Fonction pour obtenir le thème actuel
function getCurrentTheme() {
    try {
        const saved = localStorage.getItem('gob-dashboard-theme');
        // Vérifier dans tous les thèmes (par défaut + personnalisés)
        if (saved && typeof saved === 'string' && allThemes[saved]) {
            return saved;
        }
    } catch (error) {
        console.warn('Erreur lors de la lecture du localStorage:', error);
    }
    // Par défaut: darkmode
    return 'darkmode';
}

// Fonction pour initialiser le thème au chargement
function initTheme() {
    const themeId = getCurrentTheme();
    return applyTheme(themeId);
}

// Exposer globalement AVANT l'initialisation
window.GOBThemes = {
    themes: allThemes,
    defaultThemes,
    customThemes,
    applyTheme,
    getCurrentTheme,
    initTheme
};

// Initialiser le thème au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
