/**
 * ClassPlayback Component
 * Full-screen timer-based class playback with auto-advance
 * Integrated with music database (Internet Archive streaming)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { MovementDisplay } from './MovementDisplay';
import { PlaybackControls } from './PlaybackControls';
import { TimerDisplay } from './TimerDisplay';
import { HealthSafetyModal } from '../modals/HealthSafetyModal';
import { useAudioDucking } from '../../hooks/useAudioDucking';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pilates-class-generator-api3.onrender.com';

// Music API type definitions
interface MusicTrack {
  id: string;
  title: string;
  composer: string;
  artist_performer: string;
  duration_seconds: number;
  bpm: number;
  audio_url: string;
  stylistic_period: string;
  mood_tags: string[];
}

interface MusicPlaylist {
  id: string;
  name: string;
  description: string;
  stylistic_period: string;
  intended_intensity: string;
  intended_use: string;
  duration_minutes_target: number;
  tracks: MusicTrack[];
}

// Session 11: Extended playback types for all 6 class sections

export interface PlaybackPreparation {
  type: 'preparation';
  script_name: string;
  narrative: string;
  key_principles: string[];
  duration_seconds: number;
  breathing_pattern?: string;
  breathing_focus?: string;
  // Voiceover audio
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
  // Video demonstration (AWS Phase 1 - December 2025)
  video_url?: string; // CloudFront CDN URL for preparation demonstration video (picture-in-picture, 375px wide)
}

export interface PlaybackWarmup {
  type: 'warmup';
  routine_name: string;
  narrative: string;
  movements: any; // JSONB - simple movements like neck rolls
  duration_seconds: number;
  focus_area: string;
  // Voiceover audio
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
  // Video demonstration (AWS Phase 1 - December 2025)
  video_url?: string; // CloudFront CDN URL for warmup demonstration video (picture-in-picture, 375px wide)
}

export interface PlaybackMovement {
  type: 'movement';
  id?: string;
  name: string;
  duration_seconds: number;
  // New fields from Supabase
  narrative?: string; // Teaching story/approach
  setup_position?: string; // Supine, Prone, Kneeling, Seated, Side-lying
  watch_out_points?: string; // Safety warnings
  visual_cues?: string; // Visual imagery for cueing
  teaching_cues?: Array<{
    cue_type: string;
    cue_text: string;
    cue_order?: number;
    is_primary?: boolean;
  }>;
  muscle_groups?: Array<{
    name: string;
    category?: string;
    is_primary?: boolean;
  }>;
  // Level flags (Y/N indicating which levels exist)
  level_1_description?: string; // 'Y' or 'N'
  level_2_description?: string; // 'Y' or 'N'
  level_3_description?: string; // 'Y' or 'N'
  full_version_description?: string; // 'Y' or 'N'
  // Voiceover audio (Session 13.5+)
  voiceover_url?: string; // Supabase Storage URL for pre-recorded voiceover
  voiceover_duration_seconds?: number; // Duration in seconds (for music ducking timing)
  voiceover_enabled?: boolean; // Whether to play voiceover during this movement
  // Video demonstration (AWS Phase 1 - December 2025)
  video_url?: string; // CloudFront CDN URL for movement demonstration video (picture-in-picture, 375px wide)
  // Legacy fields (for backwards compatibility)
  setup_instructions?: string;
  breathing_pattern?: string;
  difficulty_level?: string;
  primary_muscles?: string[];
}

export interface PlaybackTransition {
  type: 'transition';
  narrative: string;
  duration_seconds: number;
  from_position?: string;
  to_position?: string;
  // Voiceover audio
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
}

export interface PlaybackCooldown {
  type: 'cooldown';
  sequence_name: string;
  narrative: string;
  stretches: any; // JSONB - stretch descriptions
  duration_seconds: number;
  target_muscles: string[];
  recovery_focus: string;
  // Voiceover audio
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
  // Video demonstration (AWS Phase 1 - December 2025)
  video_url?: string; // CloudFront CDN URL for cooldown demonstration video (picture-in-picture, 375px wide)
}

export interface PlaybackMeditation {
  type: 'meditation';
  script_name: string;
  script_text: string;
  duration_seconds: number;
  breathing_guidance?: string;
  meditation_theme: string;
  // Voiceover audio
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
  // Video demonstration (AWS Phase 1 - December 2025)
  video_url?: string; // CloudFront CDN URL for meditation demonstration video (picture-in-picture, 375px wide)
}

export interface PlaybackHomeCare {
  type: 'homecare';
  advice_name: string;
  advice_text: string;
  actionable_tips: string[];
  duration_seconds: number;
  focus_area: string;
  // Voiceover audio
  voiceover_url?: string;
  voiceover_duration?: number;
  voiceover_enabled?: boolean;
  // Video demonstration (AWS Phase 1 - December 2025)
  video_url?: string; // CloudFront CDN URL for homecare demonstration video (picture-in-picture, 375px wide)
}

export type PlaybackItem =
  | PlaybackPreparation
  | PlaybackWarmup
  | PlaybackMovement
  | PlaybackTransition
  | PlaybackCooldown
  | PlaybackMeditation
  | PlaybackHomeCare;

interface ClassPlaybackProps {
  items: PlaybackItem[];
  movementMusicStyle: string;
  coolDownMusicStyle: string;
  className?: string;
  classId?: string;  // Optional: class plan ID for analytics tracking
  onComplete?: () => void;
  onExit?: () => void;
}

export function ClassPlayback({
  items,
  movementMusicStyle,
  coolDownMusicStyle,
  className = '',
  classId,
  onComplete,
  onExit,
}: ClassPlaybackProps) {
  const { user, acceptSafety } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start paused if safety modal needs to be shown
  const [timeRemaining, setTimeRemaining] = useState(items[0]?.duration_seconds || 0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [movementPlaylist, setMovementPlaylist] = useState<MusicPlaylist | null>(null);
  const [cooldownPlaylist, setCooldownPlaylist] = useState<MusicPlaylist | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0); // Track index in playlist
  const [musicError, setMusicError] = useState<string | null>(null);

  // Play session tracking state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playDuration, setPlayDuration] = useState(0); // Total cumulative playtime in seconds
  const [pauseCount, setPauseCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [rewindCount, setRewindCount] = useState(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Early skip analytics tracking state (December 29, 2025)
  const [currentSectionEventId, setCurrentSectionEventId] = useState<string | null>(null);

  // Wake Lock to prevent screen from turning off during class
  const wakeLockRef = useRef<any>(null);

  // Check if user needs to accept Health & Safety disclaimer
  useEffect(() => {
    if (user && !user.accepted_safety_at) {
      setShowSafetyModal(true);
      setIsPaused(true); // Pause playback until accepted
    } else {
      setIsPaused(false); // Start playback if already accepted
    }
  }, [user]);

  // ============================================================================
  // PLAY SESSION TRACKING - December 24, 2025
  // ============================================================================

  // Start play session when component mounts (after safety acceptance)
  useEffect(() => {
    const startSession = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.post(`${API_BASE_URL}/api/analytics/play-session/start`, {
          user_id: user.id,
          class_plan_id: null, // TODO: Add class_plan_id if available from props
          playback_source: 'library', // or 'generated', 'shared', 'preview'
          device_info: {
            browser: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            is_mobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
          },
        });

        if (response.data?.session_id) {
          setSessionId(response.data.session_id);
          logger.debug('Play session started:', response.data.session_id);
        }
      } catch (error) {
        logger.error('Failed to start play session:', error);
        // Continue playback even if session tracking fails (graceful degradation)
      }
    };

    startSession();
  }, [user]);

  // Track cumulative play duration (only when not paused)
  useEffect(() => {
    if (isPaused || !sessionId) return;

    const durationTracker = setInterval(() => {
      setPlayDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(durationTracker);
  }, [isPaused, sessionId]);

  // Send heartbeat every 30 seconds with current duration
  useEffect(() => {
    if (!sessionId || isPaused) {
      // Clear heartbeat interval when paused
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Send immediate heartbeat when resuming
    const sendHeartbeat = async () => {
      try {
        await axios.put(`${API_BASE_URL}/api/analytics/play-session/${sessionId}/heartbeat`, {
          duration_seconds: playDuration,
          current_section_index: currentIndex,
          pause_count: pauseCount,
          skip_count: skipCount,
          rewind_count: rewindCount,
        });
        logger.debug('Heartbeat sent:', playDuration, 'seconds');
      } catch (error) {
        logger.error('Failed to send heartbeat:', error);
        // Continue playback even if heartbeat fails
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [sessionId, isPaused, playDuration, currentIndex, pauseCount, skipCount, rewindCount]);

  // End session when component unmounts
  useEffect(() => {
    return () => {
      const endSession = async () => {
        // End current section if in progress (early skip analytics)
        const item = items[currentIndex];
        if (currentSectionEventId && item?.type !== 'transition') {
          try {
            await axios.put(`${API_BASE_URL}/api/playback/section-end`, {
              section_event_id: currentSectionEventId,
              ended_reason: 'exited'
            });
            logger.debug('[EarlySkip] Section ended on unmount (exited)');
          } catch (error) {
            logger.error('[EarlySkip] Failed to end section on unmount:', error);
          }
        }

        // End play session
        if (!sessionId) return;

        try {
          await axios.put(`${API_BASE_URL}/api/analytics/play-session/${sessionId}/end`, {
            duration_seconds: playDuration,
            was_completed: false, // Unmount without completion
            max_section_reached: currentIndex,
          });
          logger.debug('Play session ended (unmount)');
        } catch (error) {
          logger.error('Failed to end play session:', error);
        }
      };

      endSession();
    };
  }, [sessionId, playDuration, currentIndex, currentSectionEventId, items]);

  /**
   * Wake Lock API - Keep screen on during class playback
   *
   * When class is playing (not paused), acquire a screen wake lock to prevent
   * the phone screen from turning off. When paused or component unmounts,
   * release the wake lock to save battery.
   *
   * Supported on most modern mobile browsers (iOS Safari 16.4+, Chrome/Edge Android)
   */
  useEffect(() => {
    const requestWakeLock = async () => {
      // Check if Wake Lock API is supported
      if (!('wakeLock' in navigator)) {
        logger.debug('Wake Lock API not supported on this device');
        return;
      }

      try {
        if (!isPaused && !wakeLockRef.current) {
          // Acquire wake lock when playback starts
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          logger.debug('Screen wake lock acquired - screen will stay on during class');

          // Listen for wake lock release (can happen if user switches tabs)
          wakeLockRef.current.addEventListener('release', () => {
            logger.debug('Screen wake lock released');
            wakeLockRef.current = null;
          });
        } else if (isPaused && wakeLockRef.current) {
          // Release wake lock when playback pauses
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          logger.debug('Screen wake lock released - screen can now sleep');
        }
      } catch (err: any) {
        logger.error(`Failed to acquire wake lock: ${err.message}`);
        // Don't show error to user - this is a nice-to-have feature
      }
    };

    requestWakeLock();

    // Cleanup: Release wake lock when component unmounts
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch((err: any) => {
          logger.error('Failed to release wake lock on cleanup:', err);
        });
        wakeLockRef.current = null;
      }
    };
  }, [isPaused]);

  // ============================================================================
  // EARLY SKIP ANALYTICS - Section Event Tracking (December 29, 2025)
  // ============================================================================

  /**
   * Start section tracking when currentIndex changes
   *
   * Excludes transitions per requirements (they're only 20s and auto-advance)
   * Graceful degradation: failures don't interrupt playback
   */
  useEffect(() => {
    const startSectionTracking = async () => {
      if (!sessionId || !user?.id) return;

      const currentItem = items[currentIndex];
      if (!currentItem) return;

      // Skip transitions (no tracking per requirements)
      if (currentItem.type === 'transition') {
        logger.debug('[EarlySkip] Skipping transition section (no tracking)');
        return;
      }

      try {
        // End previous section first (if exists)
        if (currentSectionEventId) {
          await axios.put(
            `${API_BASE_URL}/api/playback/section-end`,
            {
              section_event_id: currentSectionEventId,
              ended_reason: 'completed'  // Natural advance (timer ran out)
            }
          );
          logger.debug(`[EarlySkip] Previous section ended: ${currentSectionEventId}`);
        }

        // Start new section
        const response = await axios.post(
          `${API_BASE_URL}/api/playback/section-start`,
          {
            play_session_id: sessionId,
            section_type: currentItem.type,
            section_index: currentIndex,
            movement_id: currentItem.type === 'movement' ? (currentItem as PlaybackMovement).id : null,
            movement_name:
              currentItem.type === 'movement' ? (currentItem as PlaybackMovement).name :
              (currentItem as any).script_name ||
              (currentItem as any).routine_name ||
              (currentItem as any).sequence_name ||
              (currentItem as any).advice_name ||
              null,
            planned_duration_seconds: currentItem.duration_seconds,
            class_plan_id: classId || null
          }
        );

        setCurrentSectionEventId(response.data.section_event_id);
        logger.debug(`[EarlySkip] Section started: ${currentItem.type} (event_id: ${response.data.section_event_id})`);
      } catch (error) {
        logger.error('[EarlySkip] Failed to start section tracking (graceful degradation):', error);
        // Continue playback even if tracking fails
      }
    };

    startSectionTracking();
  }, [currentIndex, sessionId, user?.id, classId, items]);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  // Get current item's voiceover URL (works for all section types with voiceover_enabled)
  const currentVoiceover =
    currentItem && 'voiceover_enabled' in currentItem && currentItem.voiceover_enabled
      ? currentItem.voiceover_url
      : undefined;

  // DEBUG: Log voiceover detection
  useEffect(() => {
    if (currentItem) {
      logger.debug('[ClassPlayback] Current section:', {
        type: currentItem.type,
        name: (currentItem as any).name || (currentItem as any).script_name || (currentItem as any).routine_name,
        hasVoiceoverEnabled: 'voiceover_enabled' in currentItem,
        voiceover_enabled: (currentItem as any).voiceover_enabled,
        voiceover_url: (currentItem as any).voiceover_url,
        currentVoiceover,
      });
    }
  }, [currentIndex, currentItem]);

  // Determine which playlist to use based on section type
  // Sections 1-3 (preparation, warmup, movements/transitions) → Movement music
  // Sections 4-6 (cooldown, meditation, homecare) → Cooldown music
  const currentPlaylist =
    currentItem?.type === 'cooldown' ||
    currentItem?.type === 'meditation' ||
    currentItem?.type === 'homecare'
      ? cooldownPlaylist
      : movementPlaylist;

  // Get current track URL from appropriate playlist
  const currentMusicUrl = currentPlaylist?.tracks?.[currentTrackIndex]?.audio_url || '';

  // Handle music track advancement when current track ends
  const handleMusicEnded = useCallback(() => {
    if (!currentPlaylist || !currentPlaylist.tracks) return;

    // Advance to next track in playlist (loop back to start if at end)
    setCurrentTrackIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= currentPlaylist.tracks.length) {
        logger.debug('Reached end of playlist, looping back to first track');
        return 0; // Loop back to first track
      } else {
        logger.debug(`Advancing to track ${nextIndex + 1} of ${currentPlaylist.tracks.length}`);
        return nextIndex;
      }
    });
  }, [currentPlaylist]);

  // DEBUG: Log voiceover URL before passing to audio hook
  useEffect(() => {
    logger.debug('[ClassPlayback] Passing to useAudioDucking:', {
      currentVoiceover,
      musicUrl: currentMusicUrl,
      isPaused,
    });
  }, [currentVoiceover, currentMusicUrl, isPaused]);

  // Use dual audio hook for music + voiceover with automatic ducking
  const audioState = useAudioDucking({
    musicUrl: currentMusicUrl,
    voiceoverUrl: currentVoiceover,
    isPaused: isPaused,
    musicVolume: 1.0,      // 100% when no voiceover
    duckedVolume: 0.10,    // 10% during voiceover (90% reduction - user feedback: music was drowning out voice)
    fadeTime: 0.5,         // 0.5s smooth fade
    onMusicEnded: handleMusicEnded  // Advance to next track when current ends
  });

  // Reset track index when switching between playlists (movement → cooldown or vice versa)
  useEffect(() => {
    // Reset to track 0 when playlist changes (e.g., moving from movements to cooldown)
    setCurrentTrackIndex(0);
    logger.debug(`Playlist switched to ${currentItem?.type === 'cooldown' || currentItem?.type === 'meditation' || currentItem?.type === 'homecare' ? 'cooldown' : 'movement'} music - resetting to track 1`);
  }, [currentPlaylist]);

  // Fetch BOTH music playlists from database (movement + cooldown)
  useEffect(() => {
    const fetchPlaylistByStyle = async (musicStyle: string): Promise<MusicPlaylist | null> => {
      try {
        // Map music style to stylistic period
        // musicStyle could be: "Baroque", "Classical", "Romantic", "Impressionist", etc.
        const stylisticPeriod = musicStyle.toUpperCase().replace(/\s+/g, '_');

        // SIMPLIFIED: Query tracks directly from music_tracks table (no playlists)
        const response = await axios.get(`${API_BASE_URL}/api/music/tracks`, {
          params: {
            stylistic_period: stylisticPeriod,
            limit: 100  // Get all tracks for this period
          }
        });

        if (response.data && response.data.length > 0) {
          // Format as a simple playlist object
          const tracks = response.data;
          const totalDuration = tracks.reduce((sum: number, t: MusicTrack) => sum + t.duration_seconds, 0);

          return {
            id: `${stylisticPeriod}_AUTO`, // Auto-generated ID
            name: `${musicStyle} Music`,
            description: `All ${musicStyle} tracks`,
            stylistic_period: stylisticPeriod,
            intended_intensity: 'MEDIUM',
            intended_use: 'PILATES',
            duration_minutes_target: Math.round(totalDuration / 60),
            tracks: tracks,
          };
        }

        return null;
      } catch (error: any) {
        logger.error(`Error fetching music tracks for ${musicStyle}:`, error);
        return null;
      }
    };

    const fetchBothPlaylists = async () => {
      try {
        setMusicError(null);

        // Fetch both playlists in parallel
        const [movementPl, cooldownPl] = await Promise.all([
          fetchPlaylistByStyle(movementMusicStyle),
          fetchPlaylistByStyle(coolDownMusicStyle),
        ]);

        if (movementPl) {
          setMovementPlaylist(movementPl);
          logger.debug(`Movement playlist loaded: ${movementPl.name} (${movementPl.tracks?.length || 0} tracks)`);
        } else {
          logger.warn('No movement music playlist available');
        }

        if (cooldownPl) {
          setCooldownPlaylist(cooldownPl);
          logger.debug(`Cooldown playlist loaded: ${cooldownPl.name} (${cooldownPl.tracks?.length || 0} tracks)`);
        } else {
          logger.warn('No cooldown music playlist available');
        }

        if (!movementPl && !cooldownPl) {
          setMusicError('No music playlists available.');
        }

        setCurrentTrackIndex(0); // Reset to first track when playlists load
      } catch (error: any) {
        logger.error('Error fetching music playlists:', error);
        setMusicError('Failed to load music. Class will continue without audio.');
      }
    };

    fetchBothPlaylists();
  }, [movementMusicStyle, coolDownMusicStyle]);

  // Timer countdown logic
  useEffect(() => {
    if (isPaused || !currentItem) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-advance to next item
          if (currentIndex >= totalItems - 1) {
            clearInterval(interval);
            setTimeout(() => onComplete?.(), 100);
            return 0;
          } else {
            setTimeout(() => {
              setCurrentIndex((idx) => idx + 1);
            }, 100);
            return items[currentIndex + 1]?.duration_seconds || 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, currentIndex, currentItem, totalItems, items, onComplete]);

  // Initialize time remaining when item changes
  useEffect(() => {
    setTimeRemaining(currentItem?.duration_seconds || 0);
  }, [currentIndex]);

  const handlePause = useCallback(() => {
    setIsPaused((prev) => {
      if (!prev) {
        // About to pause
        setPauseCount((c) => c + 1);
      }
      return !prev;
    });
  }, []);

  const handlePrevious = useCallback(async () => {
    // End current section with rewind reason (early skip analytics)
    const item = items[currentIndex];
    if (currentSectionEventId && item?.type !== 'transition') {
      try {
        await axios.put(`${API_BASE_URL}/api/playback/section-end`, {
          section_event_id: currentSectionEventId,
          ended_reason: 'skipped_previous'
        });
        logger.debug('[EarlySkip] Section ended (skipped_previous)');
      } catch (error) {
        logger.error('[EarlySkip] Failed to end section on rewind:', error);
        // Continue with rewind even if tracking fails
      }
    }

    // Existing rewind logic
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTimeRemaining(items[currentIndex - 1]?.duration_seconds || 0);
      setRewindCount((c) => c + 1); // Track rewind
    }
  }, [currentIndex, items, currentSectionEventId]);

  const handleNext = useCallback(async () => {
    // End current section with skip reason (early skip analytics)
    const item = items[currentIndex];
    if (currentSectionEventId && item?.type !== 'transition') {
      try {
        await axios.put(`${API_BASE_URL}/api/playback/section-end`, {
          section_event_id: currentSectionEventId,
          ended_reason: 'skipped_next'
        });
        logger.debug('[EarlySkip] Section ended (skipped_next)');
      } catch (error) {
        logger.error('[EarlySkip] Failed to end section on skip:', error);
        // Continue with skip even if tracking fails
      }
    }

    // Existing skip logic
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(items[currentIndex + 1]?.duration_seconds || 0);
      setSkipCount((c) => c + 1); // Track skip
    } else {
      handleComplete();
    }
  }, [currentIndex, totalItems, items, currentSectionEventId]);

  const handleComplete = useCallback(async () => {
    setIsPaused(true);

    // End session with completion=true
    if (sessionId) {
      try {
        await axios.put(`${API_BASE_URL}/api/analytics/play-session/${sessionId}/end`, {
          duration_seconds: playDuration,
          was_completed: true, // User completed the entire class
          max_section_reached: totalItems - 1, // Reached the last section
        });
        logger.debug('Play session ended (completed)');
      } catch (error) {
        logger.error('Failed to end play session on complete:', error);
      }
    }

    onComplete?.();
  }, [onComplete, sessionId, playDuration, totalItems]);

  const handleExitRequest = useCallback(() => {
    if (!isPaused && currentIndex > 0) {
      setShowExitConfirm(true);
    } else {
      onExit?.();
    }
  }, [isPaused, currentIndex, onExit]);

  const handleExitConfirm = useCallback(async () => {
    setShowExitConfirm(false);

    // End current section with exit reason (early skip analytics)
    const item = items[currentIndex];
    if (currentSectionEventId && item?.type !== 'transition') {
      try {
        await axios.put(`${API_BASE_URL}/api/playback/section-end`, {
          section_event_id: currentSectionEventId,
          ended_reason: 'exited'
        });
        logger.debug('[EarlySkip] Section ended (exited)');
      } catch (error) {
        logger.error('[EarlySkip] Failed to end section on exit:', error);
        // Continue with exit even if tracking fails
      }
    }

    // End session when user exits mid-class
    if (sessionId) {
      try {
        await axios.put(`${API_BASE_URL}/api/analytics/play-session/${sessionId}/end`, {
          duration_seconds: playDuration,
          was_completed: false, // User exited before completing
          max_section_reached: currentIndex,
        });
        logger.debug('Play session ended (user exit)');
      } catch (error) {
        logger.error('Failed to end play session on exit:', error);
      }
    }

    onExit?.();
  }, [onExit, sessionId, playDuration, currentIndex, currentSectionEventId, items]);

  const handleExitCancel = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  const handleSafetyAccept = useCallback(async () => {
    try {
      await acceptSafety();
      setShowSafetyModal(false);
      setIsPaused(false); // Resume playback after acceptance
    } catch (error) {
      logger.error('Failed to record safety acceptance:', error);
      // Still close modal and allow playback (graceful degradation)
      setShowSafetyModal(false);
      setIsPaused(false);
    }
  }, [acceptSafety]);

  const handleSafetyDecline = useCallback(() => {
    // User declined safety disclaimer - exit playback
    setShowSafetyModal(false);
    onExit?.();
  }, [onExit]);

  if (!currentItem) {
    return null;
  }

  // Calculate progress percentage
  const progressPercentage = ((totalItems - currentIndex - 1 + (1 - timeRemaining / currentItem.duration_seconds)) / totalItems) * 100;

  return (
    <div className={`fixed inset-0 z-[100] bg-burgundy ${className}`}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-burgundy-dark">
        <div
          className="h-full bg-cream transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={handleExitRequest}
        className="absolute top-4 right-4 p-2 text-cream/60 hover:text-cream transition-smooth z-10"
        aria-label="Exit playback"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main content area */}
      <div className="h-full flex flex-col">
        {/* Timer Display */}
        <div className="flex-shrink-0 pt-16">
          <TimerDisplay
            timeRemaining={timeRemaining}
            totalDuration={currentItem.duration_seconds}
            currentIndex={currentIndex}
            totalItems={totalItems}
            playlistName={currentPlaylist?.name}
            trackIndex={currentTrackIndex}
            totalTracks={currentPlaylist?.tracks?.length}
            currentTrack={
              currentPlaylist?.tracks?.[currentTrackIndex]
                ? {
                    composer: currentPlaylist.tracks[currentTrackIndex].composer,
                    title: currentPlaylist.tracks[currentTrackIndex].title,
                  }
                : undefined
            }
          />
        </div>

        {/* Movement Display */}
        <div className="flex-1 overflow-y-auto">
          <MovementDisplay item={currentItem} isPaused={isPaused} />
        </div>

        {/* Playback Controls */}
        <div className="flex-shrink-0">
          <PlaybackControls
            isPaused={isPaused}
            canGoPrevious={currentIndex > 0}
            canGoNext={currentIndex < totalItems - 1}
            onPause={handlePause}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Health & Safety Modal - Shown before first class */}
      {showSafetyModal && (
        <HealthSafetyModal
          onAccept={handleSafetyAccept}
          onDecline={handleSafetyDecline}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-cream mb-2">Exit Class?</h3>
            <p className="text-sm text-cream/70 mb-6">
              Your progress will not be saved. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExitCancel}
                className="flex-1 px-4 py-2 bg-burgundy border border-cream/30 rounded-lg text-cream hover:border-cream/60 transition-smooth"
              >
                Continue Class
              </button>
              <button
                onClick={handleExitConfirm}
                className="flex-1 px-4 py-2 bg-cream text-burgundy rounded-lg hover:bg-cream/90 transition-smooth"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Music control - Always visible */}
      <div className="absolute bottom-20 left-4 space-y-2">
        {musicError || audioState.error ? (
          <p className="flex items-center gap-2 text-yellow-400 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
            {musicError || audioState.error}
          </p>
        ) : (
          <>
            {/* Prominent Enable Music Button - Always show when not playing */}
            {audioState.isReady && !audioState.isPlaying && (
              <button
                onClick={() => audioState.play()}
                className="px-4 py-2 bg-cream text-burgundy rounded-lg hover:bg-cream/90 transition-smooth flex items-center gap-2 shadow-lg font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H9a2 2 0 002-2V7a2 2 0 00-2-2H5.586l-3.293 3.293a1 1 0 000 1.414L5.586 15z" />
                </svg>
                Click to Enable Audio
              </button>
            )}

            {/*
              AUDIO DEBUG INFO - Conditionally shown based on environment

              To enable full debugging in production (if audio issues occur):
              1. Change isDev to: const isDev = true;
              2. This will show all audio state details for troubleshooting
              3. Remember to revert after debugging

              NOTE: Music playlist info now displayed inline with countdown timer (TimerDisplay component)
            */}
            {(() => {
              const isDev = import.meta.env.DEV; // true in dev, false in production

              return isDev ? (
                <div className="text-xs text-cream/40 space-y-1">
                  {/* DEBUG INFO - Only shown in dev */}
                  <p className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${audioState.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    {audioState.isPlaying ? 'Audio Playing' : audioState.isReady ? 'Audio Ready' : 'Audio Loading...'}
                  </p>

                  {/* Show current volume during ducking */}
                  <p className="flex items-center gap-2">
                    Music: {Math.round(audioState.currentVolume * 100)}%
                    {audioState.currentVolume < 1.0 && ' (ducked for voiceover)'}
                  </p>

                  {/* Show if voiceover is active for this section */}
                  {currentVoiceover && (
                    <p className="text-green-400">
                      🎙️ Voiceover enabled for this section
                    </p>
                  )}
                </div>
              ) : null;
            })()}
          </>
        )}
      </div>
    </div>
  );
}
