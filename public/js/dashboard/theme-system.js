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
            primary: '#00d4ff', // cyan brillant (data-focused, accents)
            secondary: '#0066cc', // blue profond (liens, actions secondaires)
            background: '#0a0e27', // dark navy blue (fond principal)
            surface: '#141b3d', // darker blue (cards, panels)
            surfaceLight: '#1e2749', // medium blue (hover states, active)
            text: '#e0e7ff', // light blue-white (texte principal)
            textSecondary: '#94a3b8', // slate-400 (texte secondaire)
            border: '#00d4ff40', // cyan avec transparence (bordures)
            accent: '#00d4ff', // cyan (highlights, focus)
            success: '#00ff88', // green-cyan brillant (gains)
            danger: '#ff3366', // pink-red (pertes)
            warning: '#ffaa00', // orange (alertes)
        },
        fonts: {
            primary: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
            secondary: 'Inter, system-ui, sans-serif',
            mono: '"Courier New", "Courier", monospace'
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
            primary: '#00d4ff', // cyan brillant (accents principaux)
            secondary: '#00a8cc', // cyan plus foncé (accents secondaires)
            background: '#000000', // noir pur (fond principal)
            surface: '#0a0a0a', // near black (cards, panels)
            surfaceLight: '#1a1a1a', // dark gray (hover states, active)
            text: '#ffffff', // white (texte principal)
            textSecondary: '#888888', // medium gray (texte secondaire)
            border: '#00d4ff30', // cyan très subtil (bordures)
            accent: '#00d4ff', // cyan (highlights, focus)
            success: '#00ff88', // green-cyan brillant (gains)
            danger: '#ff3366', // pink-red (pertes)
            warning: '#ffaa00', // orange (alertes)
        },
        fonts: {
            primary: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
            secondary: 'Inter, system-ui, sans-serif',
            mono: '"Courier New", "Courier", monospace'
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
            secondary: '#00ff00', // green brillant pour données positives/gains
            background: '#000000', // black pur (#000000)
            surface: '#0a0a0a', // near black (panels)
            surfaceLight: '#1a1a1a', // dark gray (hover states)
            text: '#ffcc00', // Bloomberg yellow (texte principal)
            textSecondary: '#888888', // gray (texte secondaire)
            textGreen: '#00ff00', // green brillant pour gains
            textRed: '#ff0000', // red brillant pour pertes
            textOrange: '#ff8800', // orange pour alertes
            border: '#333333', // dark gray (bordures)
            accent: '#ffcc00', // Bloomberg yellow
            success: '#00ff00', // green brillant
            danger: '#ff0000', // red brillant
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
            borderRadius: '0', // pas de border-radius (style terminal strict)
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
            primary: '#ffcc00', // Bloomberg yellow (accents, highlights)
            secondary: '#ffffff', // white (texte sur fond sombre)
            background: '#1a1a1a', // dark gray (fond principal)
            surface: '#2a2a2a', // medium gray (cards, panels)
            surfaceLight: '#3a3a3a', // lighter gray (hover, active)
            text: '#ffffff', // white (texte principal)
            textSecondary: '#b0b0b0', // light gray (texte secondaire)
            textGreen: '#4caf50', // Material green (gains)
            textRed: '#f44336', // Material red (pertes)
            border: '#444444', // gray (bordures)
            accent: '#ffcc00', // Bloomberg yellow (highlights, CTA)
            success: '#4caf50', // Material green
            danger: '#f44336', // Material red
            warning: '#ff9800', // Material orange
        },
        fonts: {
            primary: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: 'Inter, system-ui, sans-serif',
            mono: 'SF Mono, "Courier New", monospace'
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
            primary: '#8b5cf6', // purple/violet (accents principaux - style rétro)
            secondary: '#a78bfa', // lighter purple (accents secondaires)
            background: '#ffffff', // white (fond principal - style années 1990)
            surface: '#f8f9fa', // very light gray (cards, panels)
            surfaceLight: '#ffffff', // white (hover states)
            surfaceDark: '#e9ecef', // light gray (borders, separators)
            text: '#4c1d95', // deep purple (texte principal)
            textSecondary: '#6b7280', // medium gray (texte secondaire)
            textGreen: '#10b981', // emerald (gains - style moderne mais discret)
            textRed: '#ef4444', // red (pertes)
            border: '#d1d5db', // light gray (bordures)
            accent: '#8b5cf6', // purple (highlights, CTA)
            success: '#10b981', // emerald
            danger: '#ef4444', // red
            warning: '#f59e0b', // amber
        },
        fonts: {
            primary: 'Courier New, "Courier", monospace', // Style rétro terminal
            secondary: 'Georgia, "Times New Roman", serif', // Style classique
            mono: 'Courier New, "Courier", monospace'
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
        name: 'Desjardins',
        id: 'desjardins',
        colors: {
            primary: '#006747', // Vert Desjardins foncé (couleur principale)
            secondary: '#00a651', // Vert Desjardins plus clair (accents)
            background: '#ffffff', // Blanc (fond principal)
            surface: '#f5f5f5', // Gris très clair (cards, panels)
            surfaceLight: '#ffffff', // Blanc (hover states)
            surfaceDark: '#e8e8e8', // Gris clair (borders, separators)
            text: '#1a1a1a', // Noir/gris foncé (texte principal)
            textSecondary: '#666666', // Gris moyen (texte secondaire)
            textGreen: '#00a651', // Vert Desjardins (gains)
            textRed: '#d32f2f', // Rouge (pertes)
            border: '#d0d0d0', // Gris clair (bordures)
            accent: '#006747', // Vert Desjardins foncé (highlights, CTA)
            success: '#00a651', // Vert Desjardins (success)
            danger: '#d32f2f', // Rouge (danger)
            warning: '#ff9800', // Orange (alertes)
        },
        fonts: {
            primary: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            secondary: 'Inter, system-ui, sans-serif',
            mono: '"Courier New", "Courier", monospace'
        },
        styles: {
            headerBg: 'linear-gradient(135deg, #006747 0%, #00a651 100%)', // Dégradé vert Desjardins
            cardBg: '#ffffff',
            cardBorder: '1px solid #d0d0d0',
            borderRadius: '0.5rem', // Arrondi modéré
            shadow: '0 2px 8px rgba(0, 103, 71, 0.1)', // Ombre verte subtile
        }
    }
};

// Thèmes par défaut (Terminal, IA, DarkMode, Light) - DÉFINIS AVANT allThemes
const defaultThemes = {
    'terminal': {
        name: 'Terminal',
        id: 'terminal',
        isDefault: true,
        colors: {
            primary: '#ffcc00',
            secondary: '#00ff00',
            background: '#000000',
            surface: '#0a0a0a',
            surfaceLight: '#1a1a1a',
            text: '#ffcc00',
            textSecondary: '#888888',
            textGreen: '#00ff00',
            textRed: '#ff0000',
            border: '#333333',
            accent: '#ffcc00',
            success: '#00ff00',
            danger: '#ff0000',
            warning: '#ffcc00',
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
            borderRadius: '0',
            shadow: 'none',
        }
    },
    'ia': {
        name: 'IA',
        id: 'ia',
        isDefault: true,
        colors: {
            primary: '#8b5cf6',
            secondary: '#a78bfa',
            background: '#000000',
            surface: '#111827',
            surfaceLight: '#1f2937',
            text: '#ffffff',
            textSecondary: '#9ca3af',
            border: '#374151',
            accent: '#8b5cf6',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
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
            primary: '#10b981',
            secondary: '#3b82f6',
            background: '#000000',
            surface: '#111827',
            surfaceLight: '#1f2937',
            text: '#ffffff',
            textSecondary: '#9ca3af',
            border: '#374151',
            accent: '#8b5cf6',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
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
            primary: '#10b981',
            secondary: '#3b82f6',
            background: '#ffffff',
            surface: '#f5f5f5',
            surfaceLight: '#ffffff',
            text: '#1a1a1a',
            textSecondary: '#666666',
            border: '#d0d0d0',
            accent: '#8b5cf6',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
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

// Fusionner tous les thèmes
const allThemes = {
    ...defaultThemes,
    ...themes
};

// Fonction pour appliquer un thème
function applyTheme(themeId) {
    // Utiliser allThemes pour inclure les thèmes par défaut
    const theme = allThemes[themeId] || allThemes.darkmode || defaultThemes.darkmode;
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
    localStorage.setItem('gob-dashboard-theme', themeId);
    
    return theme;
}

// Thèmes par défaut (Terminal, IA, DarkMode, Light)
const defaultThemes = {
    'terminal': {
        name: 'Terminal',
        id: 'terminal',
        isDefault: true,
        colors: {
            primary: '#ffcc00',
            secondary: '#00ff00',
            background: '#000000',
            surface: '#0a0a0a',
            surfaceLight: '#1a1a1a',
            text: '#ffcc00',
            textSecondary: '#888888',
            textGreen: '#00ff00',
            textRed: '#ff0000',
            border: '#333333',
            accent: '#ffcc00',
            success: '#00ff00',
            danger: '#ff0000',
            warning: '#ffcc00',
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
            borderRadius: '0',
            shadow: 'none',
        }
    },
    'ia': {
        name: 'IA',
        id: 'ia',
        isDefault: true,
        colors: {
            primary: '#8b5cf6',
            secondary: '#a78bfa',
            background: '#000000',
            surface: '#111827',
            surfaceLight: '#1f2937',
            text: '#ffffff',
            textSecondary: '#9ca3af',
            border: '#374151',
            accent: '#8b5cf6',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
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
            primary: '#10b981',
            secondary: '#3b82f6',
            background: '#000000',
            surface: '#111827',
            surfaceLight: '#1f2937',
            text: '#ffffff',
            textSecondary: '#9ca3af',
            border: '#374151',
            accent: '#8b5cf6',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
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
            primary: '#10b981',
            secondary: '#3b82f6',
            background: '#ffffff',
            surface: '#f5f5f5',
            surfaceLight: '#ffffff',
            text: '#1a1a1a',
            textSecondary: '#666666',
            border: '#d0d0d0',
            accent: '#8b5cf6',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
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

// Fusionner tous les thèmes
const allThemes = {
    ...defaultThemes,
    ...themes
};

// Fonction pour obtenir le thème actuel
function getCurrentTheme() {
    const saved = localStorage.getItem('gob-dashboard-theme');
    // Vérifier dans tous les thèmes (par défaut + personnalisés)
    if (saved && allThemes[saved]) {
        return saved;
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
    customThemes: themes,
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

