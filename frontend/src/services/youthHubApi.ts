// Youth Training Hub API Service
// Connects to the backend API for all Youth Hub functionality

const API_BASE_URL = import.meta.env.VITE_YOUTH_HUB_API_URL || 'http://localhost:3001/api';

// Helper to get auth token
const getAuthToken = () => {
  // First check if we have a Youth Hub specific token
  const youthToken = localStorage.getItem('youth_hub_token');
  if (youthToken) return youthToken;

  // Fall back to main app token if available
  const mainToken = localStorage.getItem('token');
  if (mainToken) return mainToken;

  return null;
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const youthHubApi = {
  // ========== AUTH ==========
  async register(data: { email: string; password: string; name: string; role: 'parent' | 'coach' }) {
    const result = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store the token
    if (result.token) {
      localStorage.setItem('youth_hub_token', result.token);
    }

    return result;
  },

  async login(email: string, password: string) {
    const result = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store the token
    if (result.token) {
      localStorage.setItem('youth_hub_token', result.token);
    }

    return result;
  },

  async logout() {
    await fetchWithAuth('/auth/logout', { method: 'POST' });
    localStorage.removeItem('youth_hub_token');
  },

  async getCurrentUser() {
    return fetchWithAuth('/auth/me');
  },

  // ========== YOUTH MANAGEMENT ==========
  async registerYouth(name: string) {
    const result = await fetchWithAuth('/youths/register', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return result.youth;
  },

  async getYouths() {
    const result = await fetchWithAuth('/youths');
    return result.youths || [];
  },

  async getYouth(code: string) {
    return fetchWithAuth(`/youths/${code}`);
  },

  async updateYouth(code: string, name: string) {
    const result = await fetchWithAuth(`/youths/${code}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return result.youth;
  },

  async deleteYouth(code: string) {
    return fetchWithAuth(`/youths/${code}`, {
      method: 'DELETE',
    });
  },

  async regenerateCode(code: string) {
    return fetchWithAuth(`/youths/${code}/regenerate-code`, {
      method: 'POST',
    });
  },

  // ========== TEAM MANAGEMENT ==========
  async createTeam(data: { name: string; sport: 'rugby' | 'soccer' | 'gaa'; level?: string }) {
    const result = await fetchWithAuth('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.team;
  },

  async getTeams() {
    const result = await fetchWithAuth('/teams');
    return result.teams || [];
  },

  async getTeam(teamId: string) {
    return fetchWithAuth(`/teams/${teamId}`);
  },

  async linkYouthToTeam(teamId: string, youthCode: string) {
    return fetchWithAuth(`/teams/${teamId}/link`, {
      method: 'POST',
      body: JSON.stringify({ youthCode }),
    });
  },

  async unlinkYouthFromTeam(teamId: string, youthCode: string) {
    return fetchWithAuth(`/teams/${teamId}/unlink/${youthCode}`, {
      method: 'DELETE',
    });
  },

  async updateTeam(teamId: string, data: { name?: string; level?: string }) {
    const result = await fetchWithAuth(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.team;
  },

  async deleteTeam(teamId: string) {
    return fetchWithAuth(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  },

  // ========== SESSION MANAGEMENT ==========
  async createSession(data: {
    teamId: string;
    trainingDate: string;
    templateName?: string;
    drills: Array<{
      drillId: string;
      name: string;
      duration: number;
      notes?: string;
    }>;
    attendees: string[]; // youth codes
    notes?: string;
  }) {
    const result = await fetchWithAuth('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.session;
  },

  async getTeamSessions(teamId: string) {
    const result = await fetchWithAuth(`/sessions/team/${teamId}`);
    return result.sessions || [];
  },

  async getSession(sessionId: string) {
    return fetchWithAuth(`/sessions/${sessionId}`);
  },

  async getRecentSessions(limit: number = 10) {
    const result = await fetchWithAuth(`/sessions/coach/recent?limit=${limit}`);
    return result.sessions || [];
  },

  async updateSession(sessionId: string, data: { trainingDate?: string; notes?: string }) {
    const result = await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.session;
  },

  async deleteSession(sessionId: string) {
    return fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // ========== PARENT ACTIVITIES ==========
  async logActivity(data: {
    youthCode: string;
    activity: string;
    trainingDate: string;
    duration: number;
  }) {
    const result = await fetchWithAuth('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.activity;
  },

  async getYouthActivities(youthCode: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const result = await fetchWithAuth(`/activities/youth/${youthCode}${queryString ? `?${queryString}` : ''}`);
    return result;
  },

  async getParentActivities(limit: number = 20) {
    const result = await fetchWithAuth(`/activities/parent?limit=${limit}`);
    return result.activities || [];
  },

  async getActivity(activityId: string) {
    return fetchWithAuth(`/activities/${activityId}`);
  },

  async updateActivity(activityId: string, data: {
    activity?: string;
    trainingDate?: string;
    duration?: number;
  }) {
    const result = await fetchWithAuth(`/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.activity;
  },

  async deleteActivity(activityId: string) {
    return fetchWithAuth(`/activities/${activityId}`, {
      method: 'DELETE',
    });
  },

  async getActivitySuggestions(youthCode: string) {
    const result = await fetchWithAuth(`/activities/suggestions/${youthCode}`);
    return result.suggestions || [];
  },

  // ========== TIMELINE ==========
  async getYouthTimeline(youthCode: string, weekStart?: string, weekEnd?: string) {
    const params = new URLSearchParams();
    if (weekStart) params.append('weekStart', weekStart);
    if (weekEnd) params.append('weekEnd', weekEnd);

    const queryString = params.toString();
    return fetchWithAuth(`/timeline/${youthCode}${queryString ? `?${queryString}` : ''}`);
  },

  async getYouthWeekTimeline(youthCode: string, weekOffset: number = 0) {
    return fetchWithAuth(`/timeline/${youthCode}/week?weekOffset=${weekOffset}`);
  },

  async getYouthStats(youthCode: string) {
    return fetchWithAuth(`/timeline/${youthCode}/stats`);
  },

  // ========== DRILL DATA ==========
  getDrillTemplates(sport: 'rugby' | 'soccer' | 'gaa') {
    // This would normally come from the backend, but for now we'll use local data
    // imported from the prototype
    return import(`../data/drills/${sport}.json`).then(module => module.default);
  },

  getSessionTemplates(sport: 'rugby' | 'soccer' | 'gaa') {
    // This would normally come from the backend, but for now we'll use local data
    return import(`../data/templates/${sport}.json`).then(module => module.default);
  },
};