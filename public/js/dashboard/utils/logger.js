/**
 * Logger utility for GOB Dashboard
 *
 * Usage:
 *   import { logger } from './utils/logger.js';
 *   logger.debug('Debug info');  // Only in development
 *   logger.info('Info message');  // Always shown
 *   logger.warn('Warning');       // Always shown
 *   logger.error('Error');        // Always shown
 */

const isDevelopment = () => {
    // Check if running in development
    return (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5173' ||  // Vite dev server
        window.location.search.includes('debug=true')
    );
};

const formatMessage = (level, ...args) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${level}]`;
    return [prefix, ...args];
};

export const logger = {
    /**
     * Debug logs - Only in development
     */
    debug: (...args) => {
        if (isDevelopment()) {
            console.log(...formatMessage('DEBUG', ...args));
        }
    },

    /**
     * Info logs - Always shown
     */
    info: (...args) => {
        console.info(...formatMessage('INFO', ...args));
    },

    /**
     * Warning logs - Always shown
     */
    warn: (...args) => {
        console.warn(...formatMessage('WARN', ...args));
    },

    /**
     * Error logs - Always shown
     */
    error: (...args) => {
        console.error(...formatMessage('ERROR', ...args));
    },

    /**
     * Success logs - Green colored, development only
     */
    success: (...args) => {
        if (isDevelopment()) {
            console.log(
                '%c SUCCESS',
                'color: #10b981; font-weight: bold',
                ...args
            );
        }
    },

    /**
     * Performance logs - Development only
     */
    perf: (label, fn) => {
        if (isDevelopment()) {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            console.log(
                `%c PERF: ${label}`,
                'color: #f59e0b; font-weight: bold',
                `${(end - start).toFixed(2)}ms`
            );
            return result;
        }
        return fn();
    },

    /**
     * Group logs - Development only
     */
    group: (label, fn) => {
        if (isDevelopment()) {
            console.group(label);
            fn();
            console.groupEnd();
        } else {
            fn();
        }
    }
};

// Global logger for non-module scripts
if (typeof window !== 'undefined') {
    window.logger = logger;
}

// Void function for removing logs (replaces void(...))
window.void = () => {}; // No-op function
