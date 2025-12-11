/**
 * Frontend Logger Utility
 *
 * Security-conscious logging that only outputs debug logs in development.
 * Production builds will not include debug/info logs to prevent data exposure.
 *
 * Usage:
 * - logger.debug() - Development only (not in production)
 * - logger.info() - Development only (not in production)
 * - logger.warn() - Always logs (important warnings)
 * - logger.error() - Always logs (errors need investigation)
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Warning-level logging (always logs)
   * Use for non-critical issues that should be investigated
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Error-level logging (always logs)
   * Use for errors that need immediate attention
   */
  error: (...args: any[]) => {
    console.error(...args);
  }
};
