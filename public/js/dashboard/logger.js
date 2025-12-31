// Centralized Logger with configurable log levels
// Usage: Logger.info('message'), Logger.debug('message'), Logger.warn('message'), Logger.error('message')

(function() {
    if (window.__gobLoggerInitialized) {
        return;
    }
    window.__gobLoggerInitialized = true;

    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    };

    // Default to WARN in production, DEBUG in development
    const isProduction = window.location.hostname !== 'localhost' && 
                         !window.location.hostname.includes('127.0.0.1');
    
    let currentLevel = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

    // Check localStorage for override
    const storedLevel = localStorage.getItem('gobapps-log-level');
    if (storedLevel && LOG_LEVELS[storedLevel] !== undefined) {
        currentLevel = LOG_LEVELS[storedLevel];
    }

    const Logger = {
        setLevel: function(level) {
            if (LOG_LEVELS[level] !== undefined) {
                currentLevel = LOG_LEVELS[level];
                localStorage.setItem('gobapps-log-level', level);
                console.log(`[Logger] Level set to: ${level}`);
            }
        },

        getLevel: function() {
            return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLevel);
        },

        debug: function(...args) {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.log('[DEBUG]', ...args);
            }
        },

        info: function(...args) {
            if (currentLevel <= LOG_LEVELS.INFO) {
                console.log('[INFO]', ...args);
            }
        },

        warn: function(...args) {
            if (currentLevel <= LOG_LEVELS.WARN) {
                console.warn('[WARN]', ...args);
            }
        },

        error: function(...args) {
            if (currentLevel <= LOG_LEVELS.ERROR) {
                console.error('[ERROR]', ...args);
            }
        },

        // Group logging for related messages
        group: function(label) {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.group(label);
            }
        },

        groupEnd: function() {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.groupEnd();
            }
        },

        // Performance timing
        time: function(label) {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.time(label);
            }
        },

        timeEnd: function(label) {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.timeEnd(label);
            }
        },

        // Table for data structures
        table: function(data) {
            if (currentLevel <= LOG_LEVELS.DEBUG) {
                console.table(data);
            }
        }
    };

    // Expose globally
    window.Logger = Logger;
    window.LOG_LEVELS = LOG_LEVELS;

    // Log on init
    if (currentLevel <= LOG_LEVELS.INFO) {
        console.log('✅ Logger initialized. Level:', Logger.getLevel());
        console.log('💡 Change level: Logger.setLevel("DEBUG"|"INFO"|"WARN"|"ERROR"|"NONE")');
    }
})();
