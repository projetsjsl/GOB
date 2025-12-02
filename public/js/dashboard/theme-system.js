/**
 * Système de thèmes pour le Dashboard GOB
 * 5 thèmes disponibles: default, marketq, bloomberg-terminal, seeking-alpha, bloomberg-mobile
 */

// Définition des thèmes
export const themes = {
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
            primary: '#00d4ff', // cyan brillant (data-focused)
            secondary: '#0066cc', // blue profond
            background: '#0a0e27', // dark navy blue
            surface: '#141b3d', // darker blue (cards)
            surfaceLight: '#1e2749', // medium blue (hover states)
            text: '#e0e7ff', // light blue-white (texte principal)
            textSecondary: '#94a3b8', // slate-400 (texte secondaire)
            border: '#00d4ff40', // cyan avec transparence
            accent: '#00d4ff', // cyan (highlights)
            success: '#00ff88', // green-cyan (gains)
            danger: '#ff3366', // pink-red (pertes)
            warning: '#ffaa00', // orange (alertes)
        },
        fonts: {
            primary: 'Roboto, -apple-system, sans-serif',
            secondary: 'Inter, sans-serif',
            mono: '"Courier New", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #141b3d 0%, #1e2749 100%)',
            cardBg: '#141b3d',
            cardBorder: '1px solid rgba(0, 212, 255, 0.2)', // cyan avec transparence
            borderRadius: '0.5rem',
            shadow: '0 4px 12px rgba(0, 212, 255, 0.15)', // glow cyan
        }
    },
    'bloomberg-terminal': {
        name: 'Bloomberg Terminal',
        id: 'bloomberg-terminal',
        colors: {
            primary: '#ffcc00', // Bloomberg yellow (#FFCC00 exact)
            secondary: '#00ff00', // green pour données positives
            background: '#000000', // black pur
            surface: '#0a0a0a', // near black
            surfaceLight: '#1a1a1a', // dark gray
            text: '#ffcc00', // Bloomberg yellow (texte principal)
            textSecondary: '#888888', // gray
            textGreen: '#00ff00', // green pour gains
            textRed: '#ff0000', // red pour pertes
            border: '#333333', // dark gray
            accent: '#ffcc00', // Bloomberg yellow
            success: '#00ff00', // green (bright green)
            danger: '#ff0000', // red (bright red)
            warning: '#ffcc00', // yellow
        },
        fonts: {
            primary: 'Courier New, "Courier", monospace',
            secondary: 'Courier New, "Courier", monospace',
            mono: 'Courier New, "Courier", monospace'
        },
        styles: {
            headerBg: '#000000',
            cardBg: '#0a0a0a',
            cardBorder: '1px solid #333333',
            borderRadius: '0', // pas de border-radius (style terminal)
            shadow: 'none', // pas d'ombre (style terminal)
        }
    },
    'seeking-alpha': {
        name: 'Seeking Alpha',
        id: 'seeking-alpha',
        colors: {
            primary: '#ff6b35', // Seeking Alpha orange (boutons CTA)
            secondary: '#1a73e8', // blue pour liens
            background: '#ffffff', // white (contenu principal)
            surface: '#f5f5f5', // light gray (header)
            surfaceLight: '#ffffff', // white
            surfaceDark: '#2d2d2d', // dark gray (sidebar gauche)
            text: '#202124', // dark gray (texte principal)
            textSecondary: '#5f6368', // medium gray
            border: '#dadce0', // light gray
            accent: '#ff6b35', // orange (navigation sélectionnée)
            success: '#34a853', // green
            danger: '#ea4335', // red
            warning: '#fbbc04', // yellow
        },
        fonts: {
            primary: 'Roboto, sans-serif',
            secondary: 'Inter, sans-serif',
            mono: 'monospace'
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
            primary: '#ffcc00', // Bloomberg yellow
            secondary: '#ffffff', // white
            background: '#1a1a1a', // dark gray (fond principal)
            surface: '#2a2a2a', // medium gray (cards)
            surfaceLight: '#3a3a3a', // lighter gray (hover)
            text: '#ffffff', // white (texte principal)
            textSecondary: '#b0b0b0', // light gray (texte secondaire)
            border: '#444444', // gray (bordures)
            accent: '#ffcc00', // Bloomberg yellow (highlights)
            success: '#4caf50', // Material green
            danger: '#f44336', // Material red
            warning: '#ff9800', // Material orange
        },
        fonts: {
            primary: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
            secondary: 'Inter, sans-serif',
            mono: 'monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
            cardBg: '#2a2a2a',
            cardBorder: '1px solid #444444',
            borderRadius: '1rem', // arrondi pour mobile
            shadow: '0 2px 8px rgba(0, 0, 0, 0.4)', // ombre plus prononcée
        }
    }
};

// Fonction pour appliquer un thème
export function applyTheme(themeId) {
    const theme = themes[themeId] || themes.default;
    const root = document.documentElement;
    
    // Appliquer les variables CSS
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-bg', theme.colors.background);
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
    
    // Variables spécifiques pour certains thèmes
    if (theme.colors.textGreen) {
        root.style.setProperty('--theme-text-green', theme.colors.textGreen);
    }
    if (theme.colors.textRed) {
        root.style.setProperty('--theme-text-red', theme.colors.textRed);
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
    localStorage.setItem('gob-dashboard-theme', themeId);
    
    return theme;
}

// Fonction pour obtenir le thème actuel
export function getCurrentTheme() {
    const saved = localStorage.getItem('gob-dashboard-theme');
    return saved && themes[saved] ? saved : 'default';
}

// Fonction pour initialiser le thème au chargement
export function initTheme() {
    const themeId = getCurrentTheme();
    return applyTheme(themeId);
}

// Exposer globalement
window.GOBThemes = {
    themes,
    applyTheme,
    getCurrentTheme,
    initTheme
};

