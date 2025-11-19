/**
 * API Service - Axios client configured for backend communication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for adding auth tokens later)
api.interceptors.request.use(
  (config) => {
    // TODO: Add JWT token when auth is implemented
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
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
};

export const analyticsApi = {
  getSummary: (userId: string) => api.get(`/api/analytics/summary/${userId}`),
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
};

export default api;
