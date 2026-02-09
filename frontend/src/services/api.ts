/**
 * API Service - Axios client configured for backend communication
 *
 * JENTIC INTEGRATION (Session 11.5):
 * - Direct backend API (this file)
 * - Orchestrator service (orchestrator.ts) - uses StandardAgent + Arazzo
 *
 * See orchestrator.ts for Jentic integration details.
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds - First AI request with cache MISS can take 60-70s (Phase 1 optimization)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (stored by AuthContext during login)
    const token = localStorage.getItem('access_token'); // FIXED: Match AuthContext key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      logger.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      logger.error('Network Error:', error.message);
    } else {
      logger.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const movementsApi = {
  getAll: () => api.get('/api/movements'),
  getById: (id: string) => api.get(`/api/movements/${id}`),
  getByDifficulty: (level: string) => api.get(`/api/movements/difficulty/${level}`),
  getStats: () => api.get('/api/movements/stats/summary'),
};

export const agentsApi = {
  generateSequence: (data: any) => api.post('/api/agents/generate-sequence', data),
  selectMusic: (data: any) => api.post('/api/agents/select-music', data),
  createMeditation: (data: any) => api.post('/api/agents/create-meditation', data),
  researchCues: (data: any) => api.post('/api/agents/research-cues', data),
  generateCompleteClass: (data: any) => api.post('/api/agents/generate-complete-class', data),
  getAgentInfo: () => api.get('/api/agents/agent-info'),
};

export const classPlansApi = {
  getAll: () => api.get('/api/classes'),
  getById: (id: string) => api.get(`/api/classes/${id}`),
  create: (data: any) => api.post('/api/classes', data),
  update: (id: string, data: any) => api.put(`/api/classes/${id}`, data),
  delete: (id: string) => api.delete(`/api/classes/${id}`),
  // Session 10: Jentic Integration - AI Agent Toggle
  generate: (data: {
    user_id: string;
    duration_minutes: number;
    difficulty: string;
    use_agent?: boolean;  // Optional - if not provided, uses user preference from database
  }) => api.post('/api/classes/generate', data),
  // Session 13: Movement Variety - Save completed class for analytics
  saveCompleted: (data: {
    user_id: string;
    difficulty: string;
    duration_minutes: number;
    movements_snapshot: any[];
    muscle_balance: any;
    class_name?: string;
  }) => api.post('/api/classes/save-completed', data),
};

export const analyticsApi = {
  getSummary: (userId: string, period?: string) =>
    api.get(`/api/analytics/summary/${userId}`, { params: { period } }),
  getMovementHistory: (userId: string, period?: string) =>
    api.get(`/api/analytics/movement-history/${userId}`, { params: { period } }),
  getMuscleGroupHistory: (userId: string, period?: string) =>
    api.get(`/api/analytics/muscle-group-history/${userId}`, { params: { period } }),
  getPracticeFrequency: (userId: string, period?: string) =>
    api.get(`/api/analytics/practice-frequency/${userId}`, { params: { period } }),
  getDifficultyProgression: (userId: string, period?: string) =>
    api.get(`/api/analytics/difficulty-progression/${userId}`, { params: { period } }),
  getMuscleDistribution: (userId: string, period?: string) =>
    api.get(`/api/analytics/muscle-distribution/${userId}`, { params: { period } }),
  // SESSION: Movement Families - December 2025
  getMovementFamilyDistribution: (userId: string, period?: string) =>
    api.get(`/api/analytics/movement-family-distribution/${userId}`, { params: { period } }),
  // Music Genre & Class Duration Distribution - Stacked Bar Charts
  getMusicGenreDistribution: (userId: string, period?: string) =>
    api.get(`/api/analytics/music-genre-distribution/${userId}`, { params: { period } }),
  getClassDurationDistribution: (userId: string, period?: string) =>
    api.get(`/api/analytics/class-duration-distribution/${userId}`, { params: { period } }),
  // Session 10: Admin LLM Observability
  getLLMLogs: (params: {
    admin_user_id: string;
    page?: number;
    page_size?: number;
    method_filter?: 'ai_agent' | 'direct_api';
    user_id_filter?: string;
    days_back?: number;
  }) => api.get('/api/analytics/llm-logs', { params }),
  getLLMUsageStats: (adminUserId: string, daysBack?: number) =>
    api.get('/api/analytics/llm-usage-stats', {
      params: { admin_user_id: adminUserId, days_back: daysBack },
    }),
  getSingleLLMLog: (logId: string, adminUserId: string) =>
    api.get(`/api/analytics/llm-logs/${logId}`, {
      params: { admin_user_id: adminUserId },
    }),
  // Early Skip Analytics - Admin Only (December 29, 2025)
  getEarlySkipAnalytics: (params: {
    admin_user_id: string;
    from_date?: string;  // YYYY-MM-DD format
    to_date?: string;    // YYYY-MM-DD format
    class_id?: string;   // Filter by specific class plan ID
  }) => api.get('/api/analytics/early-skips', { params }),
};

export default api;
