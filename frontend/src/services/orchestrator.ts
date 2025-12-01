/**
 * Orchestrator Service - Jentic StandardAgent + Arazzo Integration
 *
 * This service routes class generation through the orchestrator service
 * which uses:
 * - StandardAgent (Plan→Execute→Reflect reasoning)
 * - Arazzo workflows (declarative API orchestration)
 *
 * JENTIC PATTERN:
 * Frontend → Orchestrator → Arazzo Workflow → Backend APIs
 *
 * SCALABILITY BENEFIT:
 * - High-level reasoning at orchestrator layer
 * - Declarative workflows (easy to modify)
 * - Backend APIs remain simple services
 */

import axios from 'axios';

// Orchestrator service URL (separate from backend API)
const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8001';

// Enable/disable orchestrator (for gradual rollout)
const USE_ORCHESTRATOR = import.meta.env.VITE_USE_ORCHESTRATOR === 'true';

/**
 * Create axios instance for orchestrator
 */
export const orchestratorClient = axios.create({
  baseURL: ORCHESTRATOR_URL,
  timeout: 60000, // Longer timeout (workflow executes multiple API calls)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add JWT token
 */
orchestratorClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Error handling
 */
orchestratorClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Orchestrator Error:', error.response.data);
    } else if (error.request) {
      console.error('Orchestrator Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// ORCHESTRATOR API
// =============================================================================

/**
 * Generate complete Pilates class using Jentic orchestration
 *
 * WHAT THIS DOES:
 * 1. Calls orchestrator service
 * 2. Orchestrator uses StandardAgent to reason about the request
 * 3. StandardAgent executes Arazzo workflow (8 steps)
 * 4. Workflow calls backend APIs to assemble complete class
 * 5. Returns complete 6-section class
 *
 * JENTIC WORKFLOW EXECUTED:
 * - Step 1: Get user profile
 * - Step 2: Select preparation script (Section 1)
 * - Step 3: Select warmup routine (Section 2)
 * - Step 4: Generate AI sequence (Section 3)
 * - Step 5: Select music playlist
 * - Step 6: Select cooldown sequence (Section 4)
 * - Step 7: Select closing meditation (Section 5)
 * - Step 8: Select homecare advice (Section 6)
 *
 * @param params - Class generation parameters
 * @returns Complete 6-section class
 */
export interface ClassGenerationParams {
  user_id: string;
  target_duration_minutes: number;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  focus_areas?: string[];
  include_mcp_research?: boolean;
  strictness_level?: 'strict' | 'guided' | 'autonomous';
}

export interface CompleteClass {
  userId: string;
  generatedAt: string;
  targetDuration: number;
  actualDuration: number;
  difficulty: string;

  // Section 1: Preparation
  preparation: {
    section: number;
    name: string;
    duration_minutes: number;
    script: any;
  };

  // Section 2: Warmup
  warmup: {
    section: number;
    name: string;
    duration_minutes: number;
    routine: any;
  };

  // Section 3: Main Sequence (AI-generated)
  mainSequence: {
    section: number;
    name: string;
    duration_minutes: number;
    movements: any[];
    movement_count: number;
    transition_count: number;
    muscle_balance: Record<string, number>;
    safety_score: number;
  };

  // Section 4: Cooldown
  cooldown: {
    section: number;
    name: string;
    duration_minutes: number;
    sequence: any;
  };

  // Section 5: Closing Meditation
  closingMeditation: {
    section: number;
    name: string;
    duration_minutes: number;
    script: any;
  };

  // Section 6: Homecare Advice
  closingHomecare: {
    section: number;
    name: string;
    duration_minutes: number;
    advice: any;
  };

  // Background Music
  music: {
    playlist: any;
  };

  // Quality Metrics
  metrics: {
    total_sections: number;
    total_steps_executed: number;
    workflow_execution_time_ms: number;
  };
}

export const orchestratorApi = {
  /**
   * Generate complete class using Jentic orchestration
   */
  generateCompleteClass: async (params: ClassGenerationParams): Promise<CompleteClass> => {
    const response = await orchestratorClient.post('/generate-class', params);
    return response.data.data.completeClass;
  },

  /**
   * Health check - verify orchestrator is running
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await orchestratorClient.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  },

  /**
   * Get orchestrator service information
   */
  getServiceInfo: async () => {
    const response = await orchestratorClient.get('/');
    return response.data;
  },
};

// =============================================================================
// HYBRID API (ORCHESTRATOR + FALLBACK)
// =============================================================================

/**
 * Intelligent class generation that tries orchestrator first, falls back to backend
 *
 * STRATEGY:
 * 1. If orchestrator enabled and healthy → use Jentic orchestration
 * 2. If orchestrator unavailable → fallback to direct backend API
 * 3. Log which method was used for monitoring
 *
 * BENEFIT:
 * - Gradual rollout (can disable orchestrator if issues)
 * - Graceful degradation (app works even if orchestrator down)
 * - A/B testing (compare orchestrator vs direct backend)
 */
export const hybridClassGeneration = async (
  params: ClassGenerationParams,
  directBackendFallback: (params: any) => Promise<any>
): Promise<{ method: 'orchestrator' | 'direct'; data: any }> => {
  // Check if orchestrator is enabled
  if (!USE_ORCHESTRATOR) {
    console.log('📊 Using direct backend (orchestrator disabled)');
    const data = await directBackendFallback(params);
    return { method: 'direct', data };
  }

  // Try orchestrator first
  try {
    console.log('🤖 Attempting Jentic orchestration...');
    const isHealthy = await orchestratorApi.healthCheck();

    if (!isHealthy) {
      console.warn('⚠️ Orchestrator unhealthy, falling back to direct backend');
      const data = await directBackendFallback(params);
      return { method: 'direct', data };
    }

    // Use orchestrator (Jentic StandardAgent + Arazzo)
    const data = await orchestratorApi.generateCompleteClass(params);
    console.log('✅ Jentic orchestration successful');
    return { method: 'orchestrator', data };

  } catch (error) {
    console.error('❌ Orchestrator failed, falling back to direct backend:', error);
    const data = await directBackendFallback(params);
    return { method: 'direct', data };
  }
};

// =============================================================================
// CONFIGURATION HELPER
// =============================================================================

/**
 * Get current orchestration configuration
 */
export const getOrchestrationConfig = () => {
  return {
    orchestratorUrl: ORCHESTRATOR_URL,
    useOrchestrator: USE_ORCHESTRATOR,
    isConfigured: !!import.meta.env.VITE_ORCHESTRATOR_URL,
  };
};

/**
 * Check if orchestrator is available
 */
export const checkOrchestratorAvailability = async (): Promise<{
  available: boolean;
  url: string;
  serviceInfo?: any;
}> => {
  try {
    const isHealthy = await orchestratorApi.healthCheck();
    if (isHealthy) {
      const serviceInfo = await orchestratorApi.getServiceInfo();
      return {
        available: true,
        url: ORCHESTRATOR_URL,
        serviceInfo,
      };
    }
    return { available: false, url: ORCHESTRATOR_URL };
  } catch (error) {
    return { available: false, url: ORCHESTRATOR_URL };
  }
};

export default orchestratorApi;
