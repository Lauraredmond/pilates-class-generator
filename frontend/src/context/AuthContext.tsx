import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

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

  // Configure axios interceptor for auth
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
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
        // Only log unexpected errors
        console.error('Failed to fetch user:', error);
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
        goals: data.goals || []
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
      console.error('Logout API call failed:', error);
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
      throw new Error('No refresh token available');
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
      clearTokens();
      setUser(null);
      throw new Error(error.response?.data?.detail || 'Token refresh failed');
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

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    requestPasswordReset,
    confirmPasswordReset
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
