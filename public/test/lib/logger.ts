/**
 * Structured logging system pour CurveWatch
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: Record<string, any>
  duration?: number
}

class Logger {
  private logs: LogEntry[] = []
  private maxEntries = 200
  private isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development"

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>, duration?: number) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...(data && { data }),
      ...(duration && { duration }),
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxEntries) {
      this.logs = this.logs.slice(-this.maxEntries)
    }

    // Log to console in development
    if (this.isDevelopment) {
      const emoji = {
        debug: "🔍",
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
      }
      const prefix = `[${emoji[level]}] [CurveWatch]`
      console.log(`${prefix} ${message}`, data || "")
    }
  }

  debug(message: string, data?: Record<string, any>) {
    this.log("debug", message, data)
  }

  info(message: string, data?: Record<string, any>) {
    this.log("info", message, data)
  }

  warn(message: string, data?: Record<string, any>) {
    this.log("warn", message, data)
  }

  error(message: string, data?: Record<string, any>, duration?: number) {
    this.log("error", message, data, duration)
  }

  getLogs(filter?: LogLevel): LogEntry[] {
    return filter ? this.logs.filter((log) => log.level === filter) : [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()
