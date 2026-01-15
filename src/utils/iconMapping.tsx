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

// Mapping emoji -> icone Iconoir
const emojiToIcon: Record<string, string> = {
    '\u{1F4F6}': 'antenna-signal',  // 📶
    '\u2699': 'settings',           // ⚙
    '\u{1F4C5}': 'calendar',        // 📅
    '\u2600': 'sun-light',          // ☀
    '\u{1F31E}': 'sun-light',       // 🌞
    '\u{1F3E2}': 'building',        // 🏢
    '\u{1F4CA}': 'stat-up',         // 📊
    '\u{1F4C8}': 'trending-up',     // 📈
    '\u{1F4C9}': 'trending-down',   // 📉
    '\u{1F9E0}': 'brain',           // 🧠
    '\u{1F4AC}': 'chat-bubble',     // 💬
    '\u{1F50D}': 'search',          // 🔍
    '\u{1F4C4}': 'page',            // 📄
    '\u{1F3AF}': 'target',          // 🎯
    '\u{1F4BC}': 'briefcase',       // 💼
    '\u{1F310}': 'globe',           // 🌐
    '\u{1F4B5}': 'dollar',          // 💵
    '\u{1F3E6}': 'building',        // 🏦
    '\u{1F4E7}': 'mail',            // 📧
    '\u{1F514}': 'bell',            // 🔔
    '\u23F0': 'clock',              // ⏰
    '\u2705': 'check-circle',       // ✅
    '\u274C': 'xmark-circle',       // ❌
    '\u26A0': 'warning-triangle',   // ⚠
    '\u{1F680}': 'rocket',          // 🚀
    '\u2728': 'sparks',             // ✨
    '\u{1F4A1}': 'light-bulb',      // 💡
    '\u{1F4F0}': 'newspaper',       // 📰
    '\u{1F4B0}': 'dollar',          // 💰
    '\u{1F4F1}': 'smartphone-device', // 📱
    '\u{1F3A8}': 'palette',         // 🎨
    '\u{1F512}': 'lock',            // 🔒
    '\u{1F513}': 'lock-unlock',     // 🔓
    '\u{1F464}': 'user',            // 👤
    '\u{1F465}': 'group',           // 👥
    '\u2B50': 'star',               // ⭐
    '\u{1F3C6}': 'trophy',          // 🏆
    '\u{1F4CD}': 'pin',             // 📍
    '\u{1F517}': 'link',            // 🔗
    '\u{1F5BC}': 'media-image',     // 🖼
    '\u{1F4F7}': 'camera',          // 📷
    '\u{1F3AC}': 'movie',           // 🎬
    '\u{1F3B5}': 'music-note',      // 🎵
    '\u{1F4C1}': 'folder',          // 📁
    '\u{1F4DD}': 'page',            // 📝
    '\u{1F4BB}': 'laptop',          // 💻
    '\u2328': 'keyboard',           // ⌨
    '\u{1F5B1}': 'mouse-button-right', // 🖱
    '\u{1F5A5}': 'pc-monitor',      // 🖥
    '\u{1F50B}': 'battery-charging', // 🔋
    '\u{1F50C}': 'plug',            // 🔌
    '\u{1F6E0}': 'tools',           // 🛠
    '\u{1F393}': 'graduation-cap',  // 🎓
    '\u{1F4DA}': 'book-stack',      // 📚
    '\u{1F4D6}': 'book',            // 📖
    '\u270F': 'edit-pencil',        // ✏
    '\u{1F58A}': 'pen',             // 🖊
    '\u{1F4CE}': 'attachment',      // 📎
    '\u{1F4CC}': 'pin-alt',         // 📌
    '\u{1F9ED}': 'compass',         // 🧭
    '\u{1F5FA}': 'map',             // 🗺
    '\u{1F3E0}': 'home',            // 🏠
    '\u{1F6D2}': 'cart',            // 🛒 (shop + cart)
    '\u{1F3D9}': 'city',            // 🏙
    '\u{1F3ED}': 'industry',        // 🏭
    '\u26A1': 'flash',              // ⚡
    '\u{1F31F}': 'star-solid',      // 🌟
    '\u{1F48E}': 'gem-stone',       // 💎
    '\u{1F381}': 'gift',            // 🎁
    '\u{1F4B3}': 'credit-card',     // 💳
    '\u{1F389}': 'party',           // 🎉
    '\u{1F3AE}': 'gamepad',         // 🎮
    '\u{1F3B2}': 'dice'             // 🎲
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

    // Rendu conditionnel emoji ou icone
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

// Exposer globalement pour compatibilite avec code legacy
if (typeof window !== 'undefined') {
    (window as any).IconoirIcon = IconoirIcon;
    (window as any).LucideIcon = IconoirIcon; // Backward compatibility
    (window as any).ProfessionalModeSystem = ProfessionalModeSystem;
}

export default IconoirIcon;
