// DevTimer - Configurable Loading/Sprint Overlay
// Configuration is stored in localStorage and can be managed from AdminJSLai

const DEV_TIMER_CONFIG_KEY = 'gob-dev-timer-config';

// Default configuration
const DEFAULT_CONFIG = {
    enabled: true,
    durationMinutes: 20,
    title: 'Sprint IA en cours',
    emoji: '',
    showTimer: true,
    gradient: 'from-purple-600 to-blue-600',
    position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    size: 'normal', // small, normal, large
    animate: true,
    customLogo: null, // URL to custom logo image
    textColor: 'white',
    showCloseButton: true
};

// Get configuration from localStorage
const getConfig = () => {
    try {
        const stored = localStorage.getItem(DEV_TIMER_CONFIG_KEY);
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('DevTimer: Error reading config', e);
    }
    return DEFAULT_CONFIG;
};

// Save configuration to localStorage
const saveConfig = (config) => {
    try {
        localStorage.setItem(DEV_TIMER_CONFIG_KEY, JSON.stringify(config));
        // Dispatch event so all instances update
        window.dispatchEvent(new CustomEvent('dev-timer-config-changed', { detail: config }));
    } catch (e) {
        console.warn('DevTimer: Error saving config', e);
    }
};

// Position classes mapping
const POSITION_CLASSES = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'top-center': 'top-4 left-1/2 -translate-x-1/2'
};

// Size classes
const SIZE_CLASSES = {
    small: 'px-4 py-2 text-sm',
    normal: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
};

// Gradient presets
const GRADIENT_PRESETS = {
    purple_blue: 'from-purple-600 to-blue-600',
    green_teal: 'from-green-500 to-teal-500',
    red_orange: 'from-red-500 to-orange-500',
    pink_purple: 'from-pink-500 to-purple-600',
    blue_indigo: 'from-blue-500 to-indigo-600',
    yellow_orange: 'from-yellow-400 to-orange-500',
    gray_slate: 'from-gray-600 to-slate-700',
    emerald_cyan: 'from-emerald-500 to-cyan-500'
};

window.DevTimer = function() {
    const [config, setConfig] = React.useState(getConfig);
    const [timeLeft, setTimeLeft] = React.useState(config.durationMinutes * 60);
    const [isVisible, setIsVisible] = React.useState(config.enabled);
    const [isPaused, setIsPaused] = React.useState(false);

    // Listen for config changes
    React.useEffect(() => {
        const handleConfigChange = (e) => {
            const newConfig = e.detail;
            setConfig(newConfig);
            if (newConfig.enabled && !isVisible) {
                setIsVisible(true);
                setTimeLeft(newConfig.durationMinutes * 60);
            }
        };
        window.addEventListener('dev-timer-config-changed', handleConfigChange);
        return () => window.removeEventListener('dev-timer-config-changed', handleConfigChange);
    }, [isVisible]);

    // Timer countdown
    React.useEffect(() => {
        if (!config.showTimer || isPaused) return;
        
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [config.showTimer, isPaused]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isVisible || !config.enabled) return null;

    const positionClass = POSITION_CLASSES[config.position] || POSITION_CLASSES['bottom-right'];
    const sizeClass = SIZE_CLASSES[config.size] || SIZE_CLASSES.normal;

    return React.createElement(
        'div',
        {
            className: `fixed ${positionClass} bg-gradient-to-r ${config.gradient} text-${config.textColor} ${sizeClass} rounded-full shadow-2xl z-50 flex items-center gap-4 border-2 border-white/20 ${config.animate ? 'animate-pulse' : ''}`,
            style: { fontFamily: 'monospace' },
            onClick: () => setIsPaused(!isPaused)
        },
        // Logo/Emoji
        config.customLogo 
            ? React.createElement('img', { 
                src: config.customLogo, 
                alt: 'logo', 
                className: 'w-8 h-8 rounded-full object-cover' 
              })
            : React.createElement('span', { className: 'text-2xl' }, config.emoji),
        // Content
        React.createElement(
            'div',
            { className: 'flex flex-col' },
            React.createElement('span', { 
                className: 'text-xs uppercase opacity-75 font-bold tracking-wider' 
            }, config.title),
            config.showTimer && React.createElement('span', { 
                className: 'font-bold text-xl',
                title: isPaused ? 'Click to resume' : 'Click to pause'
            }, isPaused ? ' ' + formatTime(timeLeft) : formatTime(timeLeft))
        ),
        // Close button
        config.showCloseButton && React.createElement(
            'button',
            {
                onClick: (e) => { e.stopPropagation(); setIsVisible(false); },
                className: 'ml-2 text-white/50 hover:text-white transition-colors'
            },
            ''
        )
    );
};

// Configuration Panel Component for AdminJSLai
window.DevTimerConfigPanel = function({ isDarkMode = false }) {
    const [config, setConfig] = React.useState(getConfig);
    const [saved, setSaved] = React.useState(false);

    const handleChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
    };

    const handleSave = () => {
        saveConfig(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        saveConfig(DEFAULT_CONFIG);
    };

    const handlePreview = () => {
        saveConfig({ ...config, enabled: true });
    };

    const inputClass = `w-full px-3 py-2 rounded-lg border transition-colors ${
        isDarkMode 
            ? 'bg-neutral-800 border-neutral-600 text-white' 
            : 'bg-white border-gray-300 text-gray-900'
    }`;

    const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

    return React.createElement('div', { className: 'space-y-4' },
        // Header
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('h3', { 
                className: `text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}` 
            }, ' Configuration Overlay "IA en cours"'),
            React.createElement('div', { className: 'flex gap-2' },
                React.createElement('button', {
                    onClick: handlePreview,
                    className: 'px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600'
                }, ' Previsualiser'),
                React.createElement('button', {
                    onClick: handleReset,
                    className: 'px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600'
                }, ' Reinitialiser')
            )
        ),

        // Grid of settings
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
            // Enable/Disable
            React.createElement('div', { className: 'col-span-2' },
                React.createElement('label', { className: 'flex items-center gap-3 cursor-pointer' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: config.enabled,
                        onChange: (e) => handleChange('enabled', e.target.checked),
                        className: 'w-5 h-5 rounded'
                    }),
                    React.createElement('span', { className: labelClass }, 'Activer l\'overlay')
                )
            ),

            // Title
            React.createElement('div', null,
                React.createElement('label', { className: labelClass }, 'Titre'),
                React.createElement('input', {
                    type: 'text',
                    value: config.title,
                    onChange: (e) => handleChange('title', e.target.value),
                    className: inputClass,
                    placeholder: 'Sprint IA en cours'
                })
            ),

            // Emoji
            React.createElement('div', null,
                React.createElement('label', { className: labelClass }, 'Emoji'),
                React.createElement('input', {
                    type: 'text',
                    value: config.emoji,
                    onChange: (e) => handleChange('emoji', e.target.value),
                    className: inputClass,
                    placeholder: ''
                })
            ),

            // Duration
            React.createElement('div', null,
                React.createElement('label', { className: labelClass }, 'Duree (minutes)'),
                React.createElement('input', {
                    type: 'number',
                    value: config.durationMinutes,
                    onChange: (e) => handleChange('durationMinutes', parseInt(e.target.value) || 20),
                    className: inputClass,
                    min: 1,
                    max: 120
                })
            ),

            // Position
            React.createElement('div', null,
                React.createElement('label', { className: labelClass }, 'Position'),
                React.createElement('select', {
                    value: config.position,
                    onChange: (e) => handleChange('position', e.target.value),
                    className: inputClass
                },
                    React.createElement('option', { value: 'bottom-right' }, 'Bas droite'),
                    React.createElement('option', { value: 'bottom-left' }, 'Bas gauche'),
                    React.createElement('option', { value: 'bottom-center' }, 'Bas centre'),
                    React.createElement('option', { value: 'top-right' }, 'Haut droite'),
                    React.createElement('option', { value: 'top-left' }, 'Haut gauche'),
                    React.createElement('option', { value: 'top-center' }, 'Haut centre')
                )
            ),

            // Size
            React.createElement('div', null,
                React.createElement('label', { className: labelClass }, 'Taille'),
                React.createElement('select', {
                    value: config.size,
                    onChange: (e) => handleChange('size', e.target.value),
                    className: inputClass
                },
                    React.createElement('option', { value: 'small' }, 'Petite'),
                    React.createElement('option', { value: 'normal' }, 'Normale'),
                    React.createElement('option', { value: 'large' }, 'Grande')
                )
            ),

            // Gradient
            React.createElement('div', null,
                React.createElement('label', { className: labelClass }, 'Couleurs'),
                React.createElement('select', {
                    value: config.gradient,
                    onChange: (e) => handleChange('gradient', e.target.value),
                    className: inputClass
                },
                    Object.entries(GRADIENT_PRESETS).map(([key, value]) =>
                        React.createElement('option', { key, value }, 
                            key.replace('_', ' -> ').replace(/^\w/, c => c.toUpperCase())
                        )
                    )
                )
            ),

            // Custom Logo URL
            React.createElement('div', { className: 'col-span-2' },
                React.createElement('label', { className: labelClass }, 'URL Logo personnalise (optionnel)'),
                React.createElement('input', {
                    type: 'text',
                    value: config.customLogo || '',
                    onChange: (e) => handleChange('customLogo', e.target.value || null),
                    className: inputClass,
                    placeholder: 'https://example.com/logo.png'
                })
            ),

            // Checkboxes row
            React.createElement('div', { className: 'col-span-2 flex gap-6' },
                React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: config.showTimer,
                        onChange: (e) => handleChange('showTimer', e.target.checked),
                        className: 'w-4 h-4 rounded'
                    }),
                    React.createElement('span', { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}` }, 'Afficher minuterie')
                ),
                React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: config.animate,
                        onChange: (e) => handleChange('animate', e.target.checked),
                        className: 'w-4 h-4 rounded'
                    }),
                    React.createElement('span', { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}` }, 'Animation pulse')
                ),
                React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: config.showCloseButton,
                        onChange: (e) => handleChange('showCloseButton', e.target.checked),
                        className: 'w-4 h-4 rounded'
                    }),
                    React.createElement('span', { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}` }, 'Bouton fermer')
                )
            )
        ),

        // Save button
        React.createElement('div', { className: 'flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700' },
            React.createElement('button', {
                onClick: handleSave,
                className: `px-6 py-2 rounded-lg font-medium transition-all ${
                    saved 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`
            }, saved ? ' Sauvegarde!' : ' Sauvegarder')
        )
    );
};

// Expose config functions globally for external use
window.DevTimerConfig = {
    get: getConfig,
    save: saveConfig,
    defaults: DEFAULT_CONFIG,
    gradients: GRADIENT_PRESETS
};

// Auto-mount timer (only if enabled)
if (!document.getElementById('dev-timer-root')) {
    const timerContainer = document.createElement('div');
    timerContainer.id = 'dev-timer-root';
    document.body.appendChild(timerContainer);
    const root = window.ReactDOM.createRoot(timerContainer);
    root.render(React.createElement(window.DevTimer));
}
