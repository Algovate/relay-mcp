/**
 * Simple logging utility for Relay MCP Server
 * Logs to stderr to avoid interfering with MCP stdio protocol
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel) {
    this.level = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Format a log message with timestamp and level
   */
  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Log debug messages
   */
  debug(message: string, meta?: any) {
    if (this.shouldLog('debug')) {
      const formatted = this.format('DEBUG', message);
      if (meta !== undefined) {
        console.error(formatted, JSON.stringify(meta, null, 2));
      } else {
        console.error(formatted);
      }
    }
  }

  /**
   * Log info messages
   */
  info(message: string, meta?: any) {
    if (this.shouldLog('info')) {
      const formatted = this.format('INFO', message);
      if (meta !== undefined) {
        console.error(formatted, JSON.stringify(meta, null, 2));
      } else {
        console.error(formatted);
      }
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: any) {
    if (this.shouldLog('warn')) {
      const formatted = this.format('WARN', message);
      if (meta !== undefined) {
        console.error(formatted, JSON.stringify(meta, null, 2));
      } else {
        console.error(formatted);
      }
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any) {
    if (this.shouldLog('error')) {
      const formatted = this.format('ERROR', message);
      if (error) {
        if (error instanceof Error) {
          console.error(formatted);
          console.error(error.stack || error.message);
        } else {
          console.error(formatted, JSON.stringify(error, null, 2));
        }
      } else {
        console.error(formatted);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || 'info');
