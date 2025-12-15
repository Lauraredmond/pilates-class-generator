import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  last_login?: string;
  // Profile fields
  age_range?: string;
  gender_identity?: string;
  country?: string;
  pilates_experience?: string;
  goals?: string[];
  // Admin flag (Session 10: Admin LLM Observability)
  is_admin?: boolean;
  // Legal acceptance timestamps (Session: Legal policy integration)
  accepted_safety_at?: string;
}

interface RegistrationData {
  email: string;
  password: string;
  fullName?: string;
  ageRange?: string;
  genderIdentity?: string;
  country?: string;
  pilatesExperience?: string;
  goals?: string[];
  accepted_privacy_at?: string;
  accepted_beta_terms_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  acceptSafety: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get stored tokens
  const getAccessToken = () => localStorage.getItem('access_token');
  const getRefreshToken = () => localStorage.getItem('refresh_token');

  // Set tokens
  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  };

  // Clear tokens
  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // Configure axios interceptors for auth
  useEffect(() => {
    // REQUEST INTERCEPTOR: Add access token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // RESPONSE INTERCEPTOR: Auto-refresh token on 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response, // Success - pass through
      async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 Unauthorized and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Mark as retried to avoid infinite loop

          logger.info('[Auth] Access token expired (401), attempting refresh...');

          try {
            // Attempt to refresh the token
            const refresh = getRefreshToken();
            if (!refresh) {
              logger.warn('[Auth] No refresh token available, logging out');
              clearTokens();
              setUser(null);
              return Promise.reject(error);
            }

            const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
              refresh_token: refresh
            });

            const { access_token, refresh_token } = response.data;
            setTokens(access_token, refresh_token);

            logger.info('[Auth] Token refreshed successfully, retrying original request');

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            // Retry the original request with new token
            return axios(originalRequest);
          } catch (refreshError) {
            // Token refresh failed - log out user
            logger.error('[Auth] Token refresh failed, logging out user', refreshError);
            clearTokens();
            setUser(null);

            // Show user-friendly error message
            return Promise.reject({
              ...error,
              message: 'Your session has expired. Please log in again.',
              userFriendly: true
            });
          }
        }

        // Not a 401 or already retried - pass through the error
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data);
      setLoading(false);
    } catch (error: any) {
      // If token is invalid, try to refresh
      if (error.response?.status === 401) {
        try {
          await refreshToken();
        } catch {
          // Refresh failed, clear auth (silently - this is expected behavior)
          clearTokens();
          setUser(null);
          setLoading(false);
        }
      } else {
        // Suppress errors during initial auth check (expected when not logged in)
        // Only log if it's a true server error (5xx)
        if (error.response?.status >= 500) {
          logger.error('Server error fetching user:', error);
        }
        setLoading(false);
      }
    }
  };

  // Check authentication on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);

      // Fetch user data
      await fetchCurrentUser();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  // Register
  const register = async (data: RegistrationData) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        age_range: data.ageRange,
        gender_identity: data.genderIdentity,
        country: data.country,
        pilates_experience: data.pilatesExperience,
        goals: data.goals || [],
        accepted_privacy_at: data.accepted_privacy_at,
        accepted_beta_terms_at: data.accepted_beta_terms_at
      });

      // Registration successful - user must now confirm email
      // No JWT tokens returned - email confirmation required before login
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call logout endpoint (for analytics)
      const token = getAccessToken();
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
    } catch (error) {
      logger.error('Logout API call failed:', error);
    } finally {
      // Always clear local state
      clearTokens();
      setUser(null);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      // Silently fail if no refresh token (expected when not logged in)
      clearTokens();
      setUser(null);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refresh_token: refresh
      });

      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);

      // Fetch user data with new token
      await fetchCurrentUser();
    } catch (error: any) {
      // Silently clear auth when refresh fails (expected when token expired)
      clearTokens();
      setUser(null);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/password-reset/request`, {
        email
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Password reset request failed');
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (token: string, newPassword: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/password-reset/confirm`, {
        token,
        new_password: newPassword
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Password reset failed');
    }
  };

  // Accept Health & Safety disclaimer
  const acceptSafety = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/accept-safety`);
      // Refresh user data to get updated accepted_safety_at timestamp
      await fetchCurrentUser();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to record safety acceptance');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    requestPasswordReset,
    confirmPasswordReset,
    acceptSafety
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export types for use in components
export type { RegistrationData };
