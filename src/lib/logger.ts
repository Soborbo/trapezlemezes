/**
 * Logger Utility
 *
 * Provides conditional logging based on environment.
 * Debug logs are only shown in development mode.
 */

// Check if we're in development mode
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Debug log - only outputs in development mode
 */
export function debug(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}

/**
 * Info log - always outputs (for important operational info)
 */
export function info(...args: unknown[]): void {
  console.log(...args);
}

/**
 * Warning log - always outputs
 */
export function warn(...args: unknown[]): void {
  console.warn(...args);
}

/**
 * Error log - always outputs
 */
export function error(...args: unknown[]): void {
  console.error(...args);
}

/**
 * Logger object with all methods
 */
export const logger = {
  debug,
  info,
  warn,
  error,
};

export default logger;
