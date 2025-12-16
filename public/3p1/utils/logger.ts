/**
 * Structured Logger Utility for 3p1 Finance Pro
 * Provides grouped, collapsible console output for better debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix: string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#6b7280',
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444'
};

class Logger {
  private config: LoggerConfig = {
    enabled: process.env.NODE_ENV !== 'production',
    minLevel: 'debug',
    prefix: '3p1'
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Start a collapsible group for related logs
   */
  group(label: string, collapsed = true): void {
    if (!this.config.enabled) return;
    const method = collapsed ? 'groupCollapsed' : 'group';
    console[method](`%c[${this.config.prefix}] ${label}`, 'font-weight: bold; color: #8b5cf6');
  }

  /**
   * End the current group
   */
  groupEnd(): void {
    if (!this.config.enabled) return;
    console.groupEnd();
  }

  /**
   * Log with automatic grouping
   */
  withGroup<T>(label: string, fn: () => T): T {
    this.group(label);
    try {
      return fn();
    } finally {
      this.groupEnd();
    }
  }

  /**
   * Async version of withGroup
   */
  async withGroupAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.group(label);
    try {
      return await fn();
    } finally {
      this.groupEnd();
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    console.log(
      `%c[${this.config.prefix}] %c${message}`,
      `color: ${LEVEL_COLORS.debug}`,
      'color: inherit',
      ...args
    );
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    console.log(
      `%c[${this.config.prefix}] %c${message}`,
      `color: ${LEVEL_COLORS.info}; font-weight: bold`,
      'color: inherit',
      ...args
    );
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    console.warn(
      `%c[${this.config.prefix}] %c${message}`,
      `color: ${LEVEL_COLORS.warn}; font-weight: bold`,
      'color: inherit',
      ...args
    );
  }

  error(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;
    console.error(
      `%c[${this.config.prefix}] %c${message}`,
      `color: ${LEVEL_COLORS.error}; font-weight: bold`,
      'color: inherit',
      ...args
    );
  }

  /**
   * Log a success message with checkmark
   */
  success(message: string, ...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.log(
      `%c[${this.config.prefix}] ✅ %c${message}`,
      'color: #22c55e; font-weight: bold',
      'color: inherit',
      ...args
    );
  }

  /**
   * Log a table for structured data
   */
  table(data: unknown[], columns?: string[]): void {
    if (!this.config.enabled) return;
    if (columns) {
      console.table(data, columns);
    } else {
      console.table(data);
    }
  }

  /**
   * Time an operation
   */
  time(label: string): void {
    if (!this.config.enabled) return;
    console.time(`[${this.config.prefix}] ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.config.enabled) return;
    console.timeEnd(`[${this.config.prefix}] ${label}`);
  }

  /**
   * Configure the logger
   */
  configure(options: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...options };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
