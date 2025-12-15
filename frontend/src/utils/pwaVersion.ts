/**
 * PWA Version Management
 *
 * Handles version checking and cache busting for iOS PWA (Add to Home Screen).
 *
 * **Problem:** When users "Add to Home Screen" on iOS, the JavaScript bundle
 * gets aggressively cached. Over time, this causes:
 * - Stale code (missing new features like modals)
 * - Corrupted localStorage (expired JWT tokens)
 * - Silent failures (API calls fail but no error shown)
 *
 * **Solution:** Version-based cache busting:
 * 1. Check app version on startup
 * 2. If version changed → clear localStorage (force fresh login)
 * 3. Force page reload to get latest JavaScript bundle
 *
 * **User Impact:** After app update, users will need to log in again (acceptable UX).
 */

import { logger } from './logger';

// **IMPORTANT:** Increment this version number with EVERY deployment
// Format: YYYY.MM.DD.BUILD (e.g., 2025.12.15.1 for first build on Dec 15, 2025)
const APP_VERSION = '2025.12.15.1';

const VERSION_KEY = 'app_version';

/**
 * Check if app version has changed since last launch
 * If changed: clear localStorage and force reload
 *
 * **Call this in App.tsx useEffect on mount**
 */
export function checkAppVersion(): boolean {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    // First launch or version changed
    if (storedVersion !== APP_VERSION) {
      logger.info(`[PWA Version Check] Version changed: ${storedVersion} → ${APP_VERSION}`);

      // Clear all localStorage EXCEPT version (to avoid infinite loop)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== VERSION_KEY) {
          keysToRemove.push(key);
        }
      }

      // Remove all keys except version
      keysToRemove.forEach(key => {
        logger.debug(`[PWA Version Check] Clearing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });

      // Store new version
      localStorage.setItem(VERSION_KEY, APP_VERSION);

      // Force reload to bust JavaScript cache
      // (Only if not first launch - avoid reload loop)
      if (storedVersion !== null) {
        logger.info('[PWA Version Check] Forcing reload to bust cache...');
        window.location.reload();
        return false; // Version changed, reloading
      }

      return true; // First launch, no reload needed
    }

    // Same version, no action needed
    logger.debug(`[PWA Version Check] Version unchanged: ${APP_VERSION}`);
    return true;
  } catch (error) {
    logger.error('[PWA Version Check] Failed to check version:', error);
    // Don't block app if version check fails
    return true;
  }
}

/**
 * Get current app version (for display in Settings or footer)
 */
export function getAppVersion(): string {
  return APP_VERSION;
}

/**
 * Check if running as PWA (Add to Home Screen)
 *
 * Returns true if:
 * - Standalone mode (iOS PWA)
 * - window.matchMedia('(display-mode: standalone)').matches
 */
export function isPWA(): boolean {
  // iOS standalone mode
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;

  // Android/Desktop standalone mode
  const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;

  return (isIOS && isStandalone) || isStandaloneDisplay;
}

/**
 * Log PWA status for debugging
 */
export function logPWAStatus(): void {
  const pwa = isPWA();
  const version = getAppVersion();
  const userAgent = navigator.userAgent;

  logger.info('[PWA Status]', {
    isPWA: pwa,
    version,
    userAgent: userAgent.substring(0, 100), // Truncate for readability
    platform: navigator.platform,
    standalone: 'standalone' in window.navigator ? (window.navigator as any).standalone : 'N/A',
  });
}
