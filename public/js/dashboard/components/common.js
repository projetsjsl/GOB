/**
 * Common Components for Dashboard
 * Contains shared UI components used across the dashboard
 */


// Note: IconoirIcon and ProfessionalModeSystem are defined globally in the HTML file
// and attached to window object. They should remain there for now due to dependencies.

/**
 * Icon Component - Wrapper for Iconoir icons
 * This is a placeholder - the actual implementation is in window.IconoirIcon
 * @param {string} name - Icon name
 * @param {string} className - CSS classes
 * @param {number} size - Icon size
 * @param {string} emoji - Emoji fallback
 */
const Icon = ({ name, className = "w-4 h-4", size, emoji }) => {
    if (window.IconoirIcon) {
        return window.IconoirIcon({ name, className });
    }

    // Fallback to emoji if Icon system not available
    if (emoji) {
        return <span className="inline-block">{emoji}</span>;
    }

    return <i className={`iconoir-${name} ${className}`}></i>;
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ size = "medium", className = "" }) => {
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8",
        large: "w-12 h-12"
    };

    return (
        <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
            <Icon name="RefreshCw" />
        </div>
    );
};

/**
 * Error Message Component
 */
const ErrorMessage = ({ message, onDismiss, isDarkMode = true }) => {
    return (
        <div className={`p-4 rounded-lg border ${
            isDarkMode
                ? 'bg-red-900/20 border-red-700 text-red-200'
                : 'bg-red-50 border-red-200 text-red-800'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                    <Icon name="AlertTriangle" className="w-5 h-5 mt-0.5" />
                    <p className="text-sm">{message}</p>
                </div>
                {onDismiss && (
                    <button title="Action"
                        onClick={onDismiss}
                        className="ml-4 text-current opacity-70 hover:opacity-100"
                    >
                        <Icon name="X" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Success Message Component
 */
const SuccessMessage = ({ message, onDismiss, isDarkMode = true }) => {
    return (
        <div className={`p-4 rounded-lg border ${
            isDarkMode
                ? 'bg-green-900/20 border-green-700 text-green-200'
                : 'bg-green-50 border-green-200 text-green-800'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                    <Icon name="CheckCircle" className="w-5 h-5 mt-0.5" />
                    <p className="text-sm">{message}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="ml-4 text-current opacity-70 hover:opacity-100"
                    >
                        <Icon name="X" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Card Component
 */
const Card = ({ children, className = "", isDarkMode = true }) => {
    return (
        <div className={`rounded-lg border p-4 ${
            isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
        } ${className}`}>
            {children}
        </div>
    );
};

/**
 * Button Component
 */
const Button = ({
    children,
    onClick,
    variant = "primary",
    size = "medium",
    disabled = false,
    className = "",
    isDarkMode = true
}) => {
    const baseClasses = "font-semibold rounded-lg transition-all duration-300";

    const sizeClasses = {
        small: "px-3 py-1.5 text-sm",
        medium: "px-4 py-2",
        large: "px-6 py-3 text-lg"
    };

    const variantClasses = {
        primary: isDarkMode
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white",
        secondary: isDarkMode
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-900",
        danger: isDarkMode
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-red-500 hover:bg-red-600 text-white",
        success: isDarkMode
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-green-500 hover:bg-green-600 text-white",
        ghost: isDarkMode
            ? "bg-transparent hover:bg-gray-800 text-gray-300"
            : "bg-transparent hover:bg-gray-100 text-gray-700"
    };

    const disabledClasses = "opacity-50 cursor-not-allowed";

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${baseClasses}
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${disabled ? disabledClasses : ''}
                ${className}
            `}
        >
            {children}
        </button>
    );
};

/**
 * Badge Component
 */
const Badge = ({
    children,
    variant = "default",
    className = "",
    isDarkMode = true
}) => {
    const variantClasses = {
        default: isDarkMode
            ? "bg-gray-700 text-gray-200"
            : "bg-gray-200 text-gray-800",
        success: isDarkMode
            ? "bg-green-900/50 text-green-200"
            : "bg-green-100 text-green-800",
        warning: isDarkMode
            ? "bg-yellow-900/50 text-yellow-200"
            : "bg-yellow-100 text-yellow-800",
        danger: isDarkMode
            ? "bg-red-900/50 text-red-200"
            : "bg-red-100 text-red-800",
        info: isDarkMode
            ? "bg-blue-900/50 text-blue-200"
            : "bg-blue-100 text-blue-800"
    };

    return (
        <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${variantClasses[variant]}
            ${className}
        `}>
            {children}
        </span>
    );
};

/**
 * Modal Component
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "medium",
    isDarkMode = true
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        small: "max-w-md",
        medium: "max-w-2xl",
        large: "max-w-4xl",
        xl: "max-w-6xl"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className={`
                w-full ${sizeClasses[size]} rounded-lg shadow-xl
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            `}>
                {/* Header */}
                <div className={`
                    flex items-center justify-between p-4 border-b
                    ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                `}>
                    <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded hover:bg-opacity-10 ${
                            isDarkMode ? 'hover:bg-white' : 'hover:bg-black'
                        }`}
                    >
                        <Icon name="X" className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={`
                        flex items-center justify-end gap-2 p-4 border-t
                        ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                    `}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Tabs Component
 */
const Tabs = ({ tabs, activeTab, onTabChange, isDarkMode = true }) => {
    return (
        <div className="flex gap-2 border-b overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        px-4 py-2 font-medium whitespace-nowrap transition-colors
                        ${activeTab === tab.id
                            ? isDarkMode
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'border-b-2 border-blue-600 text-blue-600'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                        }
                    `}
                >
                    {tab.icon && <Icon name={tab.icon} className="w-4 h-4 inline mr-2" />}
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

/**
 * Section wrapper (simple card)
 */
const SectionCard = ({ title, children, isDarkMode = true, className = '' }) => {
    const cls = `rounded-xl border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} ${className}`;
    const header = title
        ? React.createElement(
            'div',
            { className: `px-4 py-3 border-b ${isDarkMode ? 'border-gray-800 text-white' : 'border-gray-200 text-gray-900'}` },
            React.createElement('h3', { className: 'text-lg font-semibold' }, title)
        )
        : null;
    return React.createElement(
        'div',
        { className: cls },
        header,
        React.createElement('div', { className: 'p-4' }, children)
    );
};

/**
 * Metric tile (value + label + optional delta)
 */
const MetricTile = ({ label, value, delta, isDarkMode = true }) => {
    const cls = `p-4 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`;
    const deltaNode = delta !== undefined
        ? React.createElement(
            'div',
            { className: `text-sm font-semibold ${delta >= 0 ? 'text-green-500' : 'text-red-500'}` },
            `${delta >= 0 ? '+' : ''}${delta}`
        )
        : null;
    return React.createElement(
        'div',
        { className: cls },
        React.createElement('div', { className: 'text-sm opacity-70 mb-1' }, label),
        React.createElement('div', { className: 'text-2xl font-bold' }, value),
        deltaNode
    );
};

/**
 * News row (title + source + time)
 */
const NewsRow = ({ title, source, timeAgo, isDarkMode = true }) => {
    const cls = `flex flex-col gap-1 py-2 border-b last:border-b-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`;
    const meta = React.createElement(
        'div',
        { className: 'text-xs opacity-70 flex gap-2' },
        source ? React.createElement('span', null, source) : null,
        timeAgo ? React.createElement('span', null, ` ${timeAgo}`) : null
    );
    return React.createElement(
        'div',
        { className: cls },
        React.createElement('div', { className: `text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}` }, title),
        meta
    );
};

// Exposer Icon et composants globaux
window.Icon = Icon;
window.Card = Card;
window.Tabs = Tabs;
window.SectionCard = SectionCard;
window.MetricTile = MetricTile;
window.NewsRow = NewsRow;
