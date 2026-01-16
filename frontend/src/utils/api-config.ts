/**
 * API Configuration
 * Dynamically determines the correct backend URL based on the current environment
 *
 * ISSUE FIXED: Music and videos failing in dev environment due to wrong backend URL
 */

// Check if we're running on the dev site
const isDev = window.location.hostname === 'bassline-dev.netlify.app' ||
              window.location.hostname.includes('deploy-preview') ||
              import.meta.env.DEV; // Also true when running locally

// Determine the correct backend URL
export const API_BASE_URL = (() => {
  // First check if explicitly set via environment variable
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:8000') {
    return import.meta.env.VITE_API_URL;
  }

  // Use dev backend for dev environments
  if (isDev) {
    return 'https://pilates-dev-i0jb.onrender.com';
  }

  // Use production backend for production
  return 'https://pilates-class-generator-api3.onrender.com';
})();

// Log which backend we're using (helpful for debugging)
console.log(`[API Config] Using backend: ${API_BASE_URL} (isDev: ${isDev})`);

export default API_BASE_URL;