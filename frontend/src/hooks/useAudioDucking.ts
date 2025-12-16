/**
 * useAudioDucking Hook
 *
 * Manages dual audio playback with music ducking:
 * - Background music plays continuously
 * - Voiceover audio ducks music volume to 35% when playing
 * - Music returns to 100% volume after voiceover completes
 *
 * Uses Web Audio API for precise volume control and seamless mixing.
 */

import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

interface AudioDuckingConfig {
  musicUrl: string;
  voiceoverUrl?: string;
  isPaused: boolean;
  musicVolume?: number;      // 0.0 to 1.0 (default: 1.0)
  duckedVolume?: number;     // 0.0 to 1.0 (default: 0.35)
  fadeTime?: number;         // Fade duration in seconds (default: 0.5)
  onMusicEnded?: () => void; // Callback when music track finishes
}

interface AudioDuckingState {
  musicReady: boolean;
  voiceoverReady: boolean;
  isPlaying: boolean;
  currentVolume: number;
  error: string | null;
}

export function useAudioDucking({
  musicUrl,
  voiceoverUrl,
  isPaused,
  musicVolume = 1.0,
  duckedVolume = 0.35,
  fadeTime = 0.5,
  onMusicEnded
}: AudioDuckingConfig) {
  // Audio state
  const [state, setState] = useState<AudioDuckingState>({
    musicReady: false,
    voiceoverReady: false,
    isPlaying: false,
    currentVolume: musicVolume,
    error: null
  });

  // Web Audio API references
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const voiceoverSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const voiceoverGainRef = useRef<GainNode | null>(null);

  // HTML Audio elements
  const musicElementRef = useRef<HTMLAudioElement | null>(null);
  const voiceoverElementRef = useRef<HTMLAudioElement | null>(null);

  // Track pause state in ref for event listeners (avoid stale closure)
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Track which voiceover has been played (prevent replaying same voiceover in same section)
  const playedVoiceoverRef = useRef<string | undefined>(undefined);

  /**
   * Initialize Web Audio API context and gain nodes
   */
  useEffect(() => {
    try {
      // Create AudioContext (use webkit prefix for Safari)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      audioContextRef.current = context;

      // Create gain nodes for volume control
      const musicGain = context.createGain();
      const voiceoverGain = context.createGain();

      musicGain.gain.value = musicVolume;
      voiceoverGain.gain.value = 1.0; // Voiceover always at full volume

      // Connect gain nodes to output
      musicGain.connect(context.destination);
      voiceoverGain.connect(context.destination);

      musicGainRef.current = musicGain;
      voiceoverGainRef.current = voiceoverGain;

      logger.debug('Web Audio API initialized');
    } catch (error) {
      logger.error('Failed to initialize Web Audio API:', error);
      setState(prev => ({
        ...prev,
        error: 'Your browser does not support advanced audio features. Voiceover may not work correctly.'
      }));
    }

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [musicVolume]);

  /**
   * Handle page visibility changes (FIX: Phone sleep/wake bug)
   *
   * When the phone screen locks, the AudioContext becomes suspended.
   * When the user unlocks the phone and returns to the app, we need to:
   * 1. Resume the AudioContext
   * 2. Resume playing music and voiceover
   *
   * This fixes two bugs:
   * - Music stops when phone screen locks
   * - Voiceover doesn't play on natural section transitions after phone wake
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden (phone locked or tab switched)
        logger.debug('Page hidden - AudioContext may suspend');
      } else {
        // Page visible again (phone unlocked or tab focused)
        logger.debug('Page visible - checking AudioContext state');

        // Resume AudioContext if suspended
        if (audioContextRef.current?.state === 'suspended') {
          logger.debug('AudioContext suspended, resuming...');
          audioContextRef.current.resume().then(() => {
            logger.debug('AudioContext resumed after visibility change');

            // Only resume playback if not manually paused
            if (!isPausedRef.current) {
              // Resume music if it was playing
              if (musicElementRef.current && musicElementRef.current.paused) {
                logger.debug('Resuming music after visibility change');
                musicElementRef.current.play().catch(err => {
                  logger.error('Failed to resume music:', err);
                });
              }

              // Resume voiceover if it was playing
              if (voiceoverElementRef.current && voiceoverElementRef.current.paused) {
                logger.debug('Resuming voiceover after visibility change');
                voiceoverElementRef.current.play().catch(err => {
                  logger.error('Failed to resume voiceover:', err);
                });
              }
            }
          }).catch(err => {
            logger.error('Failed to resume AudioContext:', err);
          });
        }
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Load and connect music audio
   */
  useEffect(() => {
    if (!musicUrl || !audioContextRef.current || !musicGainRef.current) return;

    try {
      // Create audio element
      const audio = new Audio(musicUrl);
      audio.crossOrigin = 'anonymous'; // Required for CORS
      audio.loop = false; // Music plays once per track (then advances to next)
      musicElementRef.current = audio;

      // Create source node and connect to gain
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(musicGainRef.current);
      musicSourceRef.current = source;

      // Mark music as ready when loaded
      audio.addEventListener('canplaythrough', () => {
        logger.debug('Music ready');
        setState(prev => ({ ...prev, musicReady: true }));
      });

      audio.addEventListener('error', (e) => {
        logger.error('Music load error:', e);
        setState(prev => ({
          ...prev,
          error: 'Failed to load background music'
        }));
      });

      // Call onMusicEnded callback when track finishes (for playlist advancement)
      audio.addEventListener('ended', () => {
        logger.debug('Music track ended - calling onMusicEnded callback');
        if (onMusicEnded) {
          onMusicEnded();
        }
      });

      // Preload audio
      audio.load();
    } catch (error) {
      logger.error('Failed to setup music audio:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to setup background music'
      }));
    }

    // Cleanup
    return () => {
      if (musicElementRef.current) {
        musicElementRef.current.pause();
        musicElementRef.current = null;
      }
    };
  }, [musicUrl, onMusicEnded]);

  /**
   * Load and connect voiceover audio (if provided)
   */
  useEffect(() => {
    // Clear any previous error state when loading new voiceover
    setState(prev => ({ ...prev, error: null }));

    // AGGRESSIVE CLEANUP: Stop any existing voiceover immediately
    // This prevents overlapping voiceovers when rapidly skipping sections
    if (voiceoverElementRef.current) {
      const oldAudio = voiceoverElementRef.current;
      logger.debug('Cleaning up old voiceover before loading new one');

      // Stop playback immediately
      oldAudio.pause();
      oldAudio.currentTime = 0;

      // Remove src to free resources (may trigger error event, but we cleared error state above)
      oldAudio.src = '';
      oldAudio.load(); // Force unload

      // Clear ref
      voiceoverElementRef.current = null;
    }

    // If no voiceover for this section, mark as ready and exit
    if (!voiceoverUrl || !audioContextRef.current || !voiceoverGainRef.current) {
      setState(prev => ({ ...prev, voiceoverReady: true })); // No voiceover = ready

      // Restore music volume when no voiceover
      if (voiceoverUrl === undefined) {
        duckMusic(musicVolume);
      }

      return;
    }

    try {
      // Create audio element
      const audio = new Audio(voiceoverUrl);
      audio.crossOrigin = 'anonymous'; // Required for CORS
      audio.loop = false;
      voiceoverElementRef.current = audio;

      // Create source node and connect to gain
      // NOTE: Can only create source once per element (Web Audio API limitation)
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(voiceoverGainRef.current);
      voiceoverSourceRef.current = source;

      // Mark voiceover as ready when loaded
      audio.addEventListener('canplaythrough', () => {
        logger.debug('Voiceover ready');
        // Clear error state now that voiceover loaded successfully
        setState(prev => ({ ...prev, voiceoverReady: true, error: null }));

        // NOTE: Removed auto-play from canplaythrough event
        // Voiceover playback is now handled exclusively by:
        // 1. Manual play/pause control (isPaused useEffect)
        // 2. Natural section transitions (voiceoverUrl change useEffect)
        // This prevents race conditions where voiceover plays twice or gets marked as "already played"
      });

      audio.addEventListener('error', (e) => {
        logger.error('Voiceover load error:', e);
        setState(prev => ({
          ...prev,
          error: 'Failed to load voiceover audio'
        }));
      });

      // Duck music when voiceover starts
      audio.addEventListener('play', () => {
        logger.debug('Voiceover started - ducking music');
        duckMusic(duckedVolume);
      });

      // Restore music volume when voiceover ends
      audio.addEventListener('ended', () => {
        logger.debug('Voiceover ended - restoring music');
        duckMusic(musicVolume);
      });

      // Preload audio
      audio.load();
    } catch (error) {
      logger.error('Failed to setup voiceover audio:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to setup voiceover audio'
      }));
    }

    // Cleanup when component unmounts or voiceover changes
    return () => {
      if (voiceoverElementRef.current) {
        const audio = voiceoverElementRef.current;

        // Stop playback
        audio.pause();
        audio.currentTime = 0;

        // Remove src to free resources
        audio.src = '';
        audio.load();

        // Clear ref
        voiceoverElementRef.current = null;
      }
    };
  }, [voiceoverUrl, duckedVolume, musicVolume]);

  /**
   * Duck music volume with smooth fade
   */
  const duckMusic = (targetVolume: number) => {
    if (!musicGainRef.current || !audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    const gain = musicGainRef.current.gain;

    // Cancel any scheduled changes
    gain.cancelScheduledValues(currentTime);

    // Smooth exponential fade
    gain.setValueAtTime(gain.value, currentTime);
    gain.exponentialRampToValueAtTime(
      Math.max(targetVolume, 0.01), // Avoid 0 (causes errors)
      currentTime + fadeTime
    );

    setState(prev => ({ ...prev, currentVolume: targetVolume }));
  };

  /**
   * Play/pause control
   */
  useEffect(() => {
    const musicAudio = musicElementRef.current;
    const voiceoverAudio = voiceoverElementRef.current;

    if (!musicAudio) return;

    if (isPaused) {
      // Pause both audio streams
      musicAudio.pause();
      if (voiceoverAudio) voiceoverAudio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Resume AudioContext if suspended (browser autoplay policy)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          logger.debug('AudioContext resumed');
        });
      }

      // Play both audio streams (voiceover will auto-duck music)
      musicAudio.play().catch(err => {
        logger.error('Music play error:', err);
        setState(prev => ({
          ...prev,
          error: 'Failed to play background music. Click to enable audio.'
        }));
      });

      if (voiceoverAudio) {
        voiceoverAudio.play().catch(err => {
          logger.error('Voiceover play error:', err);
          setState(prev => ({
            ...prev,
            error: 'Failed to play voiceover. Click to enable audio.'
          }));
        });
      }

      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [isPaused]);

  /**
   * Voiceover playback on section change (FIX: Natural transitions)
   *
   * When sections change naturally (timer countdown), the voiceover URL changes
   * but the play/pause useEffect doesn't run (isPaused hasn't changed).
   * This effect ensures voiceover plays on both manual skips AND natural transitions.
   */
  useEffect(() => {
    // Reset played tracking when no voiceover (allows next section to play)
    if (!voiceoverUrl) {
      if (playedVoiceoverRef.current !== undefined) {
        logger.debug('No voiceover for this section, resetting tracking');
        playedVoiceoverRef.current = undefined;
      }
      return;
    }

    // Only play if:
    // 1. Player is not paused (active playback)
    // 2. Voiceover element has been created
    if (isPaused || !voiceoverElementRef.current) {
      return;
    }

    // IMPORTANT: Check if we've already played this voiceover
    // Prevents replaying within same section (e.g., 30s voiceover in 4min section)
    if (playedVoiceoverRef.current === voiceoverUrl) {
      logger.debug('Voiceover already played for this section, skipping replay');
      return;
    }

    const voiceoverAudio = voiceoverElementRef.current;

    // Track cleanup state to prevent playing stale audio
    let isCancelled = false;
    let readyHandler: (() => void) | null = null;

    // Wait for voiceover to be ready before playing
    // (handles race condition where section changes before 'canplaythrough' fires)
    const playWhenReady = () => {
      // Verify element still exists and matches current voiceover URL
      if (isCancelled || voiceoverElementRef.current !== voiceoverAudio) {
        logger.debug('Voiceover playback cancelled (section changed)');
        return;
      }

      if (voiceoverAudio.readyState >= 3) {
        // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
        logger.debug('Playing voiceover on section change (natural transition fix)');
        voiceoverAudio.play()
          .then(() => {
            // Mark this voiceover as played to prevent replays within same section
            playedVoiceoverRef.current = voiceoverUrl;
            logger.debug(`Voiceover marked as played: ${voiceoverUrl}`);
          })
          .catch(err => {
            logger.error('Failed to play voiceover on section change:', err);
          });
      } else {
        // Not ready yet, wait for canplaythrough
        logger.debug('Voiceover not ready yet, waiting for canplaythrough event');
        readyHandler = () => {
          if (isCancelled || voiceoverElementRef.current !== voiceoverAudio) {
            logger.debug('Voiceover playback cancelled after ready (section changed)');
            return;
          }
          logger.debug('Voiceover ready, playing now');
          voiceoverAudio.play()
            .then(() => {
              // Mark this voiceover as played to prevent replays within same section
              playedVoiceoverRef.current = voiceoverUrl;
              logger.debug(`Voiceover marked as played: ${voiceoverUrl}`);
            })
            .catch(err => {
              logger.error('Failed to play voiceover after ready:', err);
            });
        };
        voiceoverAudio.addEventListener('canplaythrough', readyHandler);
      }
    };

    // Small delay to ensure AudioContext is resumed and element is initialized
    const timeoutId = setTimeout(() => {
      if (isCancelled) {
        logger.debug('Voiceover playback cancelled before timeout (rapid skip)');
        return;
      }

      // Resume AudioContext if needed (browser autoplay policy)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          logger.debug('AudioContext resumed for voiceover');
          if (!isCancelled) {
            playWhenReady();
          }
        });
      } else {
        playWhenReady();
      }
    }, 50); // 50ms delay to avoid race conditions

    // Cleanup: Cancel any pending operations
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (readyHandler) {
        voiceoverAudio.removeEventListener('canplaythrough', readyHandler);
      }
    };
  }, [voiceoverUrl, isPaused]);

  /**
   * Manual play trigger (for user gesture to bypass autoplay blocking)
   */
  const manualPlay = () => {
    const musicAudio = musicElementRef.current;
    const voiceoverAudio = voiceoverElementRef.current;

    if (!musicAudio) {
      logger.error('No music audio element available');
      return;
    }

    logger.debug('Manual play triggered by user gesture');

    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        logger.debug('AudioContext resumed from user gesture');
      });
    }

    // Play music (user gesture bypasses autoplay blocking)
    const playPromise = musicAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          logger.debug('Music started playing from user gesture');
          setState(prev => ({ ...prev, isPlaying: true, error: null }));
        })
        .catch(err => {
          logger.error('Failed to play music:', err);
          setState(prev => ({
            ...prev,
            error: `Failed to play music: ${err.message}`
          }));
        });
    }

    // Play voiceover if available
    if (voiceoverAudio) {
      voiceoverAudio.play().catch(err => {
        logger.error('Voiceover play error from user gesture:', err);
      });
    }
  };

  /**
   * Public API
   */
  return {
    ...state,
    // Manual play trigger for user gesture (bypasses autoplay blocking)
    play: manualPlay,
    // Allow manual volume control
    setMusicVolume: (volume: number) => duckMusic(volume),
    // Check if both audio streams are ready
    isReady: state.musicReady && state.voiceoverReady,
    // Error recovery
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}
