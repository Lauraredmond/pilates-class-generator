/**
 * Class Assembly Service
 * Session 11: Assembles complete 6-section Pilates classes
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Section timing constants (in seconds)
export const SECTION_DURATIONS = {
  PREPARATION: 4 * 60,      // 4 minutes
  WARMUP: 3 * 60,           // 3 minutes
  COOLDOWN: 3 * 60,         // 3 minutes
  MEDITATION: 4 * 60,       // 4 minutes
  HOMECARE: 1 * 60,         // 1 minute
  TOTAL_OVERHEAD: 15 * 60   // Total: 15 minutes
};

// TypeScript interfaces
export interface PreparationScript {
  id: string;
  script_name: string;
  script_type: string;
  narrative: string;
  key_principles: string[];
  duration_seconds: number;
  breathing_pattern?: string;
  breathing_focus?: string;
  difficulty_level: string;
}

export interface WarmupRoutine {
  id: string;
  routine_name: string;
  focus_area: string;
  narrative: string;
  movements: any; // JSONB
  duration_seconds: number;
  contraindications: string[];
  modifications?: any;
  difficulty_level: string;
}

export interface CooldownSequence {
  id: string;
  sequence_name: string;
  intensity_level: string;
  narrative: string;
  stretches: any; // JSONB
  duration_seconds: number;
  target_muscles: string[];
  recovery_focus: string;
}

export interface ClosingMeditation {
  id: string;
  script_name: string;
  meditation_theme: string;
  script_text: string;
  breathing_guidance?: string;
  duration_seconds: number;
  post_intensity: string;
}

export interface HomeCareAdvice {
  id: string;
  advice_name: string;
  focus_area: string;
  advice_text: string;
  actionable_tips: string[];
  duration_seconds: number;
  related_to_class_focus: boolean;
}

export interface CompleteClass {
  // Section 1: Preparation
  preparation: PreparationScript;

  // Section 2: Warm-up
  warmup: WarmupRoutine;

  // Section 3: Main movements (existing)
  movements: any[];
  transitions: any[];

  // Section 4: Cool-down
  cooldown: CooldownSequence;

  // Section 5: Closing Meditation
  meditation: ClosingMeditation;

  // Section 6: HomeCare Advice
  homecare: HomeCareAdvice;

  // Class metadata
  difficulty: string;
  total_duration_minutes: number;
  music_playlist?: any;
}

/**
 * Calculate how many movements fit in a class given total duration
 * Formula: (total_minutes - section_overhead) / avg_movement_duration
 */
export function calculateMovementCount(totalMinutes: number, avgMovementMinutes: number = 3): number {
  const availableMinutes = totalMinutes - (SECTION_DURATIONS.TOTAL_OVERHEAD / 60);

  if (availableMinutes <= 0) {
    throw new Error(`Class duration too short. Minimum ${SECTION_DURATIONS.TOTAL_OVERHEAD / 60} minutes required for all sections.`);
  }

  return Math.floor(availableMinutes / avgMovementMinutes);
}

/**
 * Fetch all 6 sections for a complete Pilates class
 */
export async function assembleCompleteClass(
  difficulty: string,
  totalDurationMinutes: number,
  _userId: string // Prefixed with _ to indicate intentionally unused (for future use)
): Promise<CompleteClass> {
  try {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    // Calculate how many movements we need
    const movementCount = calculateMovementCount(totalDurationMinutes);

    // Fetch all sections in parallel
    const [
      preparationRes,
      warmupRes,
      movementsRes,
      cooldownRes,
      meditationRes,
      homecareRes
    ] = await Promise.all([
      // Section 1: Preparation
      axios.get(`${API_BASE_URL}/api/class-sections/preparation`, {
        headers,
        params: { difficulty, script_type: 'centering' }
      }),

      // Section 2: Warm-up
      axios.get(`${API_BASE_URL}/api/class-sections/warmup`, {
        headers,
        params: { difficulty, focus_area: 'full_body' }
      }),

      // Section 3: Main movements
      axios.get(`${API_BASE_URL}/api/movements`, {
        headers,
        params: { difficulty, limit: movementCount }
      }),

      // Section 4: Cool-down
      axios.get(`${API_BASE_URL}/api/class-sections/cooldown`, {
        headers,
        params: { intensity: 'moderate' }
      }),

      // Section 5: Closing Meditation
      axios.get(`${API_BASE_URL}/api/class-sections/closing-meditation`, {
        headers,
        params: { post_intensity: 'moderate', theme: 'body_scan' }
      }),

      // Section 6: HomeCare Advice
      axios.get(`${API_BASE_URL}/api/class-sections/closing-homecare`, {
        headers,
        params: { focus_area: 'spine_care' }
      })
    ]);

    // Assemble complete class
    const completeClass: CompleteClass = {
      preparation: preparationRes.data[0],
      warmup: warmupRes.data[0],
      movements: movementsRes.data,
      transitions: [], // TODO: Generate transitions in future
      cooldown: cooldownRes.data[0],
      meditation: meditationRes.data[0],
      homecare: homecareRes.data[0],
      difficulty,
      total_duration_minutes: totalDurationMinutes
    };

    return completeClass;

  } catch (error: any) {
    console.error('Failed to assemble complete class:', error);
    throw new Error(error.response?.data?.detail || 'Failed to assemble class');
  }
}

/**
 * Get a specific section by ID
 */
export const classSectionsApi = {
  getPreparation: (scriptId: string) =>
    axios.get(`${API_BASE_URL}/api/class-sections/preparation/${scriptId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }),

  getWarmup: (routineId: string) =>
    axios.get(`${API_BASE_URL}/api/class-sections/warmup/${routineId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }),

  getCooldown: (sequenceId: string) =>
    axios.get(`${API_BASE_URL}/api/class-sections/cooldown/${sequenceId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }),

  getMeditation: (scriptId: string) =>
    axios.get(`${API_BASE_URL}/api/class-sections/closing-meditation/${scriptId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }),

  getHomeCare: (adviceId: string) =>
    axios.get(`${API_BASE_URL}/api/class-sections/closing-homecare/${adviceId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    })
};
