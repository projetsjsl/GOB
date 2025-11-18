import React from 'react';

// ====================================================================
// ICON MAPPING SYSTEM
// ====================================================================
// IconoirIcon component + ProfessionalModeSystem
// Compatible avec le code legacy qui utilise window.IconoirIcon

export interface IconProps {
    name: string;
    className?: string;
}

// Mapping des noms Lucide vers classes Iconoir
const iconMap: Record<string, string> = {
    // Actions & UI
    'Activity': 'activity',
    'Wifi': 'wifi',
    'WifiOff': 'wifi-off',
    'RefreshCw': 'refresh-double',
    'Refresh': 'refresh',
    'ChevronDown': 'nav-arrow-down',
    'Bell': 'bell',
    'Search': 'search',
    'Settings': 'settings',
    'AlertTriangle': 'warning-triangle',
    'AlertCircle': 'info-circle',
    'HelpCircle': 'help-circle',
    'LifeBuoy': 'lifebelt',
    'X': 'xmark',
    'Close': 'xmark',
    'Plus': 'plus',
    'Minus': 'minus',

    // Graphiques & Finance
    'BarChart3': 'stat-up',
    'Brain': 'brain',
    'TrendingUp': 'trending-up',
    'TrendingDown': 'trending-down',
    'GraphUp': 'graph-up',
    'ChartLine': 'chart-line',
    'DollarSign': 'dollar',

    // Documents & Communication
    'Newspaper': 'newspaper',
    'Page': 'page',
    'FileText': 'page',
    'Briefcase': 'briefcase',

    // Navigation & Arrows
    'ArrowUpRight': 'arrow-tr',
    'ArrowDownRight': 'arrow-br',
    'ArrowUp': 'arrow-up',
    'ArrowDown': 'arrow-down',

    // Special
    'Fire': 'sparks',
    'Target': 'target',
    'Shield': 'shield',
    'Sparkles': 'sparks',
    'ExternalLink': 'open-new-window',
    'Users': 'group',
    'User': 'user',

    // Calendar & Time
    'Calendar': 'calendar',
    'Clock': 'clock',

    // Media
    'Image': 'media-image',
    'Video': 'media-video',

    // Others
    'Star': 'star',
    'StarFilled': 'star-solid',
    'Rocket': 'rocket',
    'Database': 'database',
    'Code': 'code',
    'Mail': 'mail',
    'Phone': 'phone',
    'Globe': 'globe',
    'Building': 'building',
    'ChatBubble': 'chat-bubble'
};

// Mapping emoji → icône Iconoir
const emojiToIcon: Record<string, string> = {
    '📡': 'antenna-signal',
    '⚙️': 'settings',
    '📅': 'calendar',
    '🌅': 'sun-light',
    '☀️': 'sun-light',
    '🌆': 'building',
    '📊': 'stat-up',
    '📈': 'trending-up',
    '📉': 'trending-down',
    '🤖': 'brain',
    '💬': 'chat-bubble',
    '🔍': 'search',
    '📝': 'page',
    '🎯': 'target',
    '💼': 'briefcase',
    '🌐': 'globe',
    '💰': 'dollar',
    '🏢': 'building',
    '📧': 'mail',
    '🔔': 'bell',
    '⏰': 'clock',
    '✅': 'check-circle',
    '❌': 'xmark-circle',
    '⚠️': 'warning-triangle',
    '🚀': 'rocket',
    '🔥': 'sparks',
    '💡': 'light-bulb',
    '🧠': 'brain',
    '📰': 'newspaper',
    '💵': 'dollar',
    '📲': 'smartphone-device',
    '🎨': 'palette',
    '🔒': 'lock',
    '🔓': 'lock-unlock',
    '👤': 'user',
    '👥': 'group',
    '⭐': 'star',
    '🏆': 'trophy',
    '📌': 'pin',
    '🔗': 'link',
    '🖼️': 'media-image',
    '📸': 'camera',
    '🎬': 'movie',
    '🎵': 'music-note',
    '📁': 'folder',
    '📄': 'page',
    '💻': 'laptop',
    '⌨️': 'keyboard',
    '🖱️': 'mouse-button-right',
    '🖥️': 'pc-monitor',
    '📱': 'smartphone-device',
    '🔋': 'battery-charging',
    '🔌': 'plug',
    '🛠️': 'tools',
    '🎓': 'graduation-cap',
    '📚': 'book-stack',
    '📖': 'book',
    '✏️': 'edit-pencil',
    '🖊️': 'pen',
    '📎': 'attachment',
    '📍': 'pin-alt',
    '🧭': 'compass',
    '🗺️': 'map',
    '🏠': 'home',
    '🏪': 'shop',
    '🏬': 'city',
    '🏭': 'industry',
    '⚡': 'flash',
    '🌟': 'star-solid',
    '💎': 'gem-stone',
    '🎁': 'gift',
    '🛒': 'cart',
    '💳': 'credit-card',
    '🎉': 'party',
    '🎊': 'gift',
    '🔐': 'lock',
    '🎮': 'gamepad',
    '🎲': 'dice'
};

// IconoirIcon Component
export const IconoirIcon: React.FC<IconProps> = ({ name, className = 'w-4 h-4' }) => {
    const iconClass = iconMap[name] || iconMap['Activity'];
    return <i className={`iconoir-${iconClass} ${className}`} style={{ fontSize: 'inherit' }}></i>;
};

// Professional Mode System
export const ProfessionalModeSystem = {
    isEnabled: function (): boolean {
        const stored = localStorage.getItem('gobapps-professional-mode');
        return stored === 'true' || stored === null; // Default: Professional Mode ON
    },

    toggle: function (): boolean {
        const newMode = !this.isEnabled();
        localStorage.setItem('gobapps-professional-mode', newMode.toString());
        window.dispatchEvent(new CustomEvent('professional-mode-changed', {
            detail: { enabled: newMode }
        }));
        return newMode;
    },

    emojiToIcon,

    // Rendu conditionnel emoji ou icône
    renderIcon: function (emoji: string, size = 24, className = ''): string {
        if (!this.isEnabled()) {
            return `<span class="inline-block">${emoji}</span>`;
        }

        const iconClass = this.emojiToIcon[emoji];
        if (iconClass) {
            return `<i class="iconoir-${iconClass} ${className}" style="font-size: ${size}px;"></i>`;
        }

        return `<span class="inline-block">${emoji}</span>`;
    }
};

// Exposer globalement pour compatibilité avec code legacy
if (typeof window !== 'undefined') {
    (window as any).IconoirIcon = IconoirIcon;
    (window as any).LucideIcon = IconoirIcon; // Backward compatibility
    (window as any).ProfessionalModeSystem = ProfessionalModeSystem;
}

export default IconoirIcon;
