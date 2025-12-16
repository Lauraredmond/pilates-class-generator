/**
 * Class Assembly Service
 * Session 11: Assembles complete 6-section Pilates classes
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
 * Fetch sample sections to calculate actual overhead duration
 * Reads duration_seconds from Supabase instead of using hardcoded constants
 */
async function getSectionOverheadDurations(
  token: string,
  includeMeditation: boolean
): Promise<number> {
  try {
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch one sample of each section type to get actual durations
    const [prepRes, warmupRes, cooldownRes, homecareRes, meditationRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/class-sections/preparation`, {
        headers,
        params: { script_type: 'centering', limit: 1 }
      }),
      axios.get(`${API_BASE_URL}/api/class-sections/warmup`, {
        headers,
        params: { focus_area: 'full_body', limit: 1 }
      }),
      axios.get(`${API_BASE_URL}/api/class-sections/cooldown`, {
        headers,
        params: { intensity: 'moderate', limit: 1 }
      }),
      axios.get(`${API_BASE_URL}/api/class-sections/closing-homecare`, {
        headers,
        params: { focus_area: 'spine_care', limit: 1 }
      }),
      // Only fetch meditation if including it
      includeMeditation
        ? axios.get(`${API_BASE_URL}/api/class-sections/closing-meditation`, {
            headers,
            params: { post_intensity: 'moderate', theme: 'body_scan', limit: 1 }
          })
        : Promise.resolve({ data: [] })
    ]);

    // Sum up actual durations from database
    let totalOverhead = 0;

    if (prepRes.data?.[0]?.duration_seconds) {
      totalOverhead += prepRes.data[0].duration_seconds;
    }
    if (warmupRes.data?.[0]?.duration_seconds) {
      totalOverhead += warmupRes.data[0].duration_seconds;
    }
    if (cooldownRes.data?.[0]?.duration_seconds) {
      totalOverhead += cooldownRes.data[0].duration_seconds;
    }
    if (homecareRes.data?.[0]?.duration_seconds) {
      totalOverhead += homecareRes.data[0].duration_seconds;
    }
    if (includeMeditation && meditationRes.data?.[0]?.duration_seconds) {
      totalOverhead += meditationRes.data[0].duration_seconds;
    }

    logger.info(`[ClassAssembly] Calculated overhead from database: ${totalOverhead}s (${Math.round(totalOverhead / 60)} min) - meditation ${includeMeditation ? 'included' : 'excluded'}`);

    return totalOverhead;
  } catch (error) {
    logger.error('[ClassAssembly] Failed to fetch section durations, using fallback estimates', error);
    // Fallback to reasonable estimates if database fetch fails
    // prep (4min) + warmup (3min) + cooldown (3min) + homecare (1min) = 11min
    // + meditation (4min) = 15min total
    return includeMeditation ? 15 * 60 : 11 * 60;
  }
}

/**
 * Calculate how many movements fit in a class given total duration
 * Formula: (total_minutes - section_overhead) / avg_movement_duration
 *
 * For 30-min classes: excludes meditation to allow more movements
 * For longer classes: includes meditation
 *
 * CRITICAL: Movements are 5 minutes (300 seconds) each in Recording Mode
 */
export function calculateMovementCount(
  totalMinutes: number,
  overheadSeconds: number,
  avgMovementMinutes: number = 5
): number {
  const overheadMinutes = overheadSeconds / 60;
  const availableMinutes = totalMinutes - overheadMinutes;

  if (availableMinutes <= 0) {
    throw new Error(`Class duration too short. Minimum ${Math.ceil(overheadMinutes)} minutes required for all sections.`);
  }

  return Math.floor(availableMinutes / avgMovementMinutes);
}

/**
 * Fetch all 6 sections for a complete Pilates class
 * For 30-min classes: skips meditation to allow more movements
 */
export async function assembleCompleteClass(
  difficulty: string,
  totalDurationMinutes: number,
  _userId: string // Prefixed with _ to indicate intentionally unused (for future use)
): Promise<CompleteClass> {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }
    const headers = { Authorization: `Bearer ${token}` };

    // Determine if we should include meditation (only for classes > 30 min)
    const includeMeditation = totalDurationMinutes > 30;

    // STEP 1: Fetch section durations from database
    const overheadSeconds = await getSectionOverheadDurations(token, includeMeditation);

    // STEP 2: Calculate how many movements we need based on actual section durations
    const movementCount = calculateMovementCount(totalDurationMinutes, overheadSeconds);

    // Fetch sections conditionally
    const sectionsToFetch = [
      // Section 1: Preparation (no difficulty filter - works for all levels)
      axios.get(`${API_BASE_URL}/api/class-sections/preparation`, {
        headers,
        params: { script_type: 'centering' }
      }),

      // Section 2: Warm-up (no difficulty filter - works for all levels)
      axios.get(`${API_BASE_URL}/api/class-sections/warmup`, {
        headers,
        params: { focus_area: 'full_body' }
      }),

      // Section 3: Main movements (filter by difficulty)
      axios.get(`${API_BASE_URL}/api/movements`, {
        headers,
        params: { difficulty, limit: movementCount }
      }),

      // Section 4: Cool-down (no filters - generic stretch sequence)
      axios.get(`${API_BASE_URL}/api/class-sections/cooldown`, {
        headers,
        params: { intensity: 'moderate' }
      }),

      // Section 5: Closing Meditation (only for classes > 30 min)
      includeMeditation
        ? axios.get(`${API_BASE_URL}/api/class-sections/closing-meditation`, {
            headers,
            params: { post_intensity: 'moderate', theme: 'body_scan' }
          })
        : Promise.resolve({ data: [] }), // Empty response for 30-min classes

      // Section 6: HomeCare Advice (no filters - generic advice)
      axios.get(`${API_BASE_URL}/api/class-sections/closing-homecare`, {
        headers,
        params: { focus_area: 'spine_care' }
      })
    ];

    const [
      preparationRes,
      warmupRes,
      movementsRes,
      cooldownRes,
      meditationRes,
      homecareRes
    ] = await Promise.all(sectionsToFetch);

    // Validate that we got data for all sections
    const missingDataErrors: string[] = [];

    if (!preparationRes.data || preparationRes.data.length === 0) {
      missingDataErrors.push('Preparation scripts table is empty');
    }
    if (!warmupRes.data || warmupRes.data.length === 0) {
      missingDataErrors.push('Warmup routines table is empty');
    }
    if (!movementsRes.data || movementsRes.data.length === 0) {
      missingDataErrors.push('Movements table is empty');
    }
    if (!cooldownRes.data || cooldownRes.data.length === 0) {
      missingDataErrors.push('Cooldown sequences table is empty');
    }
    // Only validate meditation if class is > 30 min
    if (includeMeditation && (!meditationRes.data || meditationRes.data.length === 0)) {
      missingDataErrors.push('Closing meditation scripts table is empty');
    }
    if (!homecareRes.data || homecareRes.data.length === 0) {
      missingDataErrors.push('HomeCare advice table is empty');
    }

    if (missingDataErrors.length > 0) {
      const errorMessage = `Cannot assemble complete class - database tables need seed data:\n\n${missingDataErrors.join('\n')}\n\nPlease populate the database with sample data for all 6 class sections.`;
      logger.error('[ClassAssembly]', errorMessage);
      throw new Error(errorMessage);
    }

    // Assemble complete class (conditionally include meditation for classes > 30 min)
    const completeClass: CompleteClass = {
      preparation: preparationRes.data[0],
      warmup: warmupRes.data[0],
      movements: movementsRes.data,
      transitions: [], // TODO: Generate transitions in future
      cooldown: cooldownRes.data[0],
      meditation: includeMeditation ? meditationRes.data[0] : null as any, // Null for 30-min classes
      homecare: homecareRes.data[0],
      difficulty,
      total_duration_minutes: totalDurationMinutes
    };

    logger.info(`[ClassAssembly] Assembled ${totalDurationMinutes}-min class with ${movementCount} movements (meditation ${includeMeditation ? 'included' : 'excluded'})`);

    return completeClass;

  } catch (error: any) {
    logger.error('Failed to assemble complete class:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Failed to assemble class');
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
