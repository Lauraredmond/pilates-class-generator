/**
 * Temporary User ID utility
 * Generates and persists a consistent user ID until proper authentication is implemented
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
