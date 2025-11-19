/**
 * Temporary User ID utility
 * Generates and persists a consistent user ID until proper authentication is implemented
 *
 * ⚠️ STOPGAP MEASURE - TO BE REMOVED WHEN REAL AUTH IMPLEMENTED
 *
 * TODO: When implementing proper user authentication:
 * 1. Replace all calls to getTempUserId() with real authenticated user.id
 * 2. Migrate any data associated with temp user IDs to real user accounts
 * 3. Delete this file entirely
 * 4. Clear localStorage key 'bassline_temp_user_id' for all users
 *
 * This temporary system exists ONLY to enable movement tracking and analytics
 * before proper authentication is built. It should NOT interfere with real
 * user profiles when auth is implemented.
 */

const TEMP_USER_ID_KEY = 'bassline_temp_user_id';

/**
 * Get or create a temporary user ID
 * This ID persists across sessions until authentication is implemented
 */
export function getTempUserId(): string {
  // Check if we already have a temp user ID
  let userId = localStorage.getItem(TEMP_USER_ID_KEY);

  if (!userId) {
    // Generate a new temporary user ID
    userId = `temp-user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(TEMP_USER_ID_KEY, userId);
  }

  return userId;
}

/**
 * Clear temporary user ID (useful for testing)
 */
export function clearTempUserId(): void {
  localStorage.removeItem(TEMP_USER_ID_KEY);
}
