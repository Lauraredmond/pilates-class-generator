/**
 * Debug Panel Component
 * Shows auth token status and helpful debugging info
 * Only visible to admins or in development mode
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';
import { getAppVersion, isPWA } from '../utils/pwaVersion';

interface TokenInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  accessTokenExpiry?: string;
  accessTokenExp?: number;
  timeUntilExpiry?: string;
  isExpired: boolean;
}

export function DebugPanel() {
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Only show to admins
  if (!user?.is_admin) {
    return null;
  }

  useEffect(() => {
    const updateTokenInfo = () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken) {
        setTokenInfo({
          hasAccessToken: false,
          hasRefreshToken: !!refreshToken,
          isExpired: true
        });
        return;
      }

      // Decode JWT to get expiry (JWT format: header.payload.signature)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = payload.exp; // Unix timestamp in seconds
        const now = Math.floor(Date.now() / 1000);
        const secondsUntilExpiry = exp - now;
        const minutesUntilExpiry = Math.floor(secondsUntilExpiry / 60);

        setTokenInfo({
          hasAccessToken: true,
          hasRefreshToken: !!refreshToken,
          accessTokenExpiry: new Date(exp * 1000).toLocaleString(),
          accessTokenExp: exp,
          timeUntilExpiry: secondsUntilExpiry > 0
            ? `${minutesUntilExpiry} minutes`
            : 'EXPIRED',
          isExpired: secondsUntilExpiry <= 0
        });
      } catch (error) {
        logger.error('[DebugPanel] Failed to decode JWT:', error);
        setTokenInfo({
          hasAccessToken: true,
          hasRefreshToken: !!refreshToken,
          isExpired: false
        });
      }
    };

    // Update immediately
    updateTokenInfo();

    // Update every 10 seconds
    const interval = setInterval(updateTokenInfo, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-burgundy-dark border border-cream/20 rounded-lg p-4">
      {/* Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-between text-cream hover:text-cream/80 transition-smooth"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <span className="font-medium">Debug Panel (Admin Only)</span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${showPanel ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel Content */}
      {showPanel && (
        <div className="mt-4 space-y-3 text-sm">
          {/* App Version */}
          <div className="flex justify-between items-center py-2 border-b border-cream/10">
            <span className="text-cream/60">App Version:</span>
            <span className="text-cream font-mono">{getAppVersion()}</span>
          </div>

          {/* PWA Mode */}
          <div className="flex justify-between items-center py-2 border-b border-cream/10">
            <span className="text-cream/60">Running as PWA:</span>
            <span className={`font-medium ${isPWA() ? 'text-green-400' : 'text-yellow-400'}`}>
              {isPWA() ? 'Yes (Home Screen)' : 'No (Browser)'}
            </span>
          </div>

          {/* Token Status */}
          {tokenInfo && (
            <>
              <div className="flex justify-between items-center py-2 border-b border-cream/10">
                <span className="text-cream/60">Access Token:</span>
                <span className={`font-medium ${tokenInfo.hasAccessToken ? 'text-green-400' : 'text-red-400'}`}>
                  {tokenInfo.hasAccessToken ? '✓ Present' : '✗ Missing'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-cream/10">
                <span className="text-cream/60">Refresh Token:</span>
                <span className={`font-medium ${tokenInfo.hasRefreshToken ? 'text-green-400' : 'text-red-400'}`}>
                  {tokenInfo.hasRefreshToken ? '✓ Present' : '✗ Missing'}
                </span>
              </div>

              {tokenInfo.accessTokenExpiry && (
                <div className="flex justify-between items-center py-2 border-b border-cream/10">
                  <span className="text-cream/60">Token Expires:</span>
                  <span className="text-cream font-mono text-xs">{tokenInfo.accessTokenExpiry}</span>
                </div>
              )}

              {tokenInfo.timeUntilExpiry && (
                <div className="flex justify-between items-center py-2 border-b border-cream/10">
                  <span className="text-cream/60">Time Until Expiry:</span>
                  <span className={`font-medium ${tokenInfo.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                    {tokenInfo.timeUntilExpiry}
                  </span>
                </div>
              )}

              {tokenInfo.isExpired && (
                <div className="bg-red-900/30 border border-red-500/50 rounded p-3 mt-2">
                  <p className="text-red-300 text-xs">
                    ⚠️ Access token has expired! Next API call will automatically refresh it.
                  </p>
                </div>
              )}
            </>
          )}

          {/* User Info */}
          <div className="flex justify-between items-center py-2 border-b border-cream/10">
            <span className="text-cream/60">User ID:</span>
            <span className="text-cream font-mono text-xs">{user?.id.substring(0, 8)}...</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-cream/10">
            <span className="text-cream/60">Admin:</span>
            <span className="text-green-400 font-medium">✓ Yes</span>
          </div>

          {/* Console Logs Info */}
          <div className="bg-burgundy/50 rounded p-3 mt-4">
            <p className="text-cream/70 text-xs mb-2">
              💡 <strong>Tip:</strong> Open browser console to see detailed auth logs:
            </p>
            <ul className="text-cream/60 text-xs space-y-1 ml-4">
              <li>• [Auth] Access token expired (401), attempting refresh...</li>
              <li>• [Auth] Token refreshed successfully</li>
              <li>• [Auth] Token refresh failed, logging out user</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
