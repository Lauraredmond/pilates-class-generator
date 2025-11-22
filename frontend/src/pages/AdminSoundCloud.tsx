import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ConnectionStatus {
  connected: boolean;
  expired?: boolean;
  message?: string;
  expires_at?: string;
}

export function AdminSoundCloud() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/soundcloud/status`);
      setStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = `${API_BASE_URL}/auth/soundcloud/connect`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/auth/soundcloud/refresh`);
      await checkConnectionStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4"></div>
          <p className="text-charcoal">Checking SoundCloud connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-burgundy mb-2">SoundCloud Admin</h1>
          <p className="text-charcoal">
            Manage SoundCloud OAuth connection for music integration
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-burgundy mb-4">Connection Status</h2>

          {status?.connected ? (
            <div className="space-y-4">
              {/* Connected State */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-700">SoundCloud Connected</p>
                  <p className="text-sm text-gray-600">Your SoundCloud account is connected and ready to use</p>
                </div>
              </div>

              {/* Token Status */}
              {status.expired && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Access token expired. Click "Refresh Token" to renew.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiration Date */}
              {status.expires_at && !status.expired && (
                <div className="text-sm text-gray-600">
                  <strong>Token expires:</strong>{' '}
                  {new Date(status.expires_at).toLocaleString()}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-burgundy text-cream px-6 py-2 rounded hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Token'}
                </button>
                <button
                  onClick={checkConnectionStatus}
                  className="bg-gray-200 text-charcoal px-6 py-2 rounded hover:bg-gray-300"
                >
                  Check Status
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Not Connected State */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">SoundCloud Not Connected</p>
                  <p className="text-sm text-gray-600">Connect your SoundCloud account to enable music playback</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Setup Instructions:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li>Ensure SoundCloud app is registered in Developer Dashboard</li>
                  <li>Verify SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET in backend .env</li>
                  <li>Confirm redirect URI matches: {window.location.origin}/auth/soundcloud/callback</li>
                  <li>Click "Connect SoundCloud" to authorize</li>
                </ol>
              </div>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                className="bg-burgundy text-cream px-8 py-3 rounded-lg hover:bg-burgundy/90 font-semibold text-lg w-full mt-6"
              >
                Connect My SoundCloud Account
              </button>
            </div>
          )}
        </div>

        {/* Documentation Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-burgundy mb-4">Documentation</h2>
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-charcoal">How It Works</h3>
            <p className="text-gray-700 mb-4">
              This admin panel allows you to connect your SoundCloud account to the Pilates Class Planner.
              Once connected, all users will be able to play music from your SoundCloud playlists during classes.
            </p>

            <h3 className="text-lg font-semibold text-charcoal">Architecture</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>One-time OAuth:</strong> You authenticate once, tokens stored on backend</li>
              <li><strong>Shared Access:</strong> All users play music from your account (like Peloton)</li>
              <li><strong>CDN Streaming:</strong> SoundCloud serves audio, no backend performance impact</li>
              <li><strong>Auto-Refresh:</strong> Tokens automatically refresh when expired</li>
            </ul>

            <h3 className="text-lg font-semibold text-charcoal">Rate Limits</h3>
            <p className="text-gray-700">
              SoundCloud provides 15,000 API requests/day (we use ~10). Audio streams are unlimited and served
              via CDN, so the app scales to unlimited users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
