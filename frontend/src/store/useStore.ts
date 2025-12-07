/**
 * Global State Management using Zustand
 * Manages app-wide state including auth, movements, and UI state
 */

import { create } from 'zustand';

interface Movement {
  id: string;
  movement_number: number;
  code: string;
  name: string;
  category: string;
  difficulty_level: string;
  narrative?: string;
  visual_cues?: string;
  watch_out_points?: string;
  setup_position?: string;
  duration_seconds?: number;
  primary_muscles?: string[];

  // Level flags (Y/N indicating which levels exist for this movement)
  level_1_description?: string; // 'Y' or 'N'
  level_2_description?: string; // 'Y' or 'N'
  level_3_description?: string; // 'Y' or 'N'
  full_version_description?: string; // 'Y' or 'N'

  // Voiceover audio (Session 13.5+)
  voiceover_url?: string; // Supabase Storage URL for pre-recorded voiceover
  voiceover_duration_seconds?: number; // Duration in seconds (for music ducking timing)
  voiceover_enabled?: boolean; // Whether to play voiceover during this movement
}

interface SequenceMovement extends Movement {
  sequenceIndex: number;
}

interface ClassPlan {
  id?: string;
  name: string;
  description?: string;
  target_duration_minutes: number;
  difficulty_level: string;
  movements: SequenceMovement[];
}

interface MuscleBalance {
  core: number;
  legs: number;
  arms: number;
  back: number;
  fullBody: number;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AppState {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Movements
  movements: Movement[];
  setMovements: (movements: Movement[]) => void;

  // Current Class Being Edited
  currentClass: ClassPlan | null;
  setCurrentClass: (classplan: ClassPlan | null) => void;

  // Class Builder Actions
  addMovementToSequence: (movement: Movement) => void;
  removeMovementFromSequence: (index: number) => void;
  reorderSequence: (fromIndex: number, toIndex: number) => void;
  updateClassDetails: (details: Partial<ClassPlan>) => void;
  calculateMuscleBalance: () => MuscleBalance;
  clearSequence: () => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // User & Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Movements
  movements: [],
  setMovements: (movements) => set({ movements }),

  // Current Class
  currentClass: null,
  setCurrentClass: (currentClass) => set({ currentClass }),

  // Class Builder Actions
  addMovementToSequence: (movement) => {
    const { currentClass } = get();
    if (!currentClass) {
      set({
        currentClass: {
          name: 'Untitled Class',
          target_duration_minutes: 60,
          difficulty_level: 'Beginner',
          movements: [{ ...movement, sequenceIndex: 0 }],
        },
      });
    } else {
      const newMovements = [
        ...currentClass.movements,
        { ...movement, sequenceIndex: currentClass.movements.length },
      ];
      set({
        currentClass: {
          ...currentClass,
          movements: newMovements,
        },
      });
    }
  },

  removeMovementFromSequence: (index) => {
    const { currentClass } = get();
    if (!currentClass) return;

    const newMovements = currentClass.movements
      .filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, sequenceIndex: i }));

    set({
      currentClass: {
        ...currentClass,
        movements: newMovements,
      },
    });
  },

  reorderSequence: (fromIndex, toIndex) => {
    const { currentClass } = get();
    if (!currentClass) return;

    const newMovements = [...currentClass.movements];
    const [movedItem] = newMovements.splice(fromIndex, 1);
    newMovements.splice(toIndex, 0, movedItem);

    const reindexedMovements = newMovements.map((m, i) => ({
      ...m,
      sequenceIndex: i,
    }));

    set({
      currentClass: {
        ...currentClass,
        movements: reindexedMovements,
      },
    });
  },

  updateClassDetails: (details) => {
    const { currentClass } = get();
    if (!currentClass) {
      set({
        currentClass: {
          name: details.name || 'Untitled Class',
          target_duration_minutes: details.target_duration_minutes || 60,
          difficulty_level: details.difficulty_level || 'Beginner',
          movements: [],
          ...details,
        },
      });
    } else {
      set({
        currentClass: {
          ...currentClass,
          ...details,
        },
      });
    }
  },

  calculateMuscleBalance: () => {
    const { currentClass } = get();
    if (!currentClass || currentClass.movements.length === 0) {
      return { core: 0, legs: 0, arms: 0, back: 0, fullBody: 0 };
    }

    const balance = { core: 0, legs: 0, arms: 0, back: 0, fullBody: 0 };
    const total = currentClass.movements.length;

    currentClass.movements.forEach((movement) => {
      const muscles = movement.primary_muscles || [];
      muscles.forEach((muscle) => {
        const muscleLower = muscle.toLowerCase();
        if (muscleLower.includes('core') || muscleLower.includes('abdom')) {
          balance.core++;
        } else if (muscleLower.includes('leg') || muscleLower.includes('glute') || muscleLower.includes('hip')) {
          balance.legs++;
        } else if (muscleLower.includes('arm') || muscleLower.includes('shoulder')) {
          balance.arms++;
        } else if (muscleLower.includes('back') || muscleLower.includes('spine')) {
          balance.back++;
        } else {
          balance.fullBody++;
        }
      });
    });

    // Convert to percentages
    return {
      core: Math.round((balance.core / total) * 100),
      legs: Math.round((balance.legs / total) * 100),
      arms: Math.round((balance.arms / total) * 100),
      back: Math.round((balance.back / total) * 100),
      fullBody: Math.round((balance.fullBody / total) * 100),
    };
  },

  clearSequence: () => {
    set({ currentClass: null });
  },

  // UI State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),

  // Toast
  toast: null,
  showToast: (message, type) => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));
