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

  // Track onMusicEnded callback in ref (avoid stale closure in event listener)
  const onMusicEndedRef = useRef(onMusicEnded);
  onMusicEndedRef.current = onMusicEnded;

  /**
   * Initialize Web Audio API context and gain nodes
   *
   * FIX (Jan 2026): iOS PWA AudioContext initialization failure
   * - iOS PWA has stricter sandbox restrictions than browser
   * - AudioContext can fail on app launch (before user gesture)
   * - This breaks ALL audio (music + voiceover) until app removed/re-added
   * - Fix: Detect failure and provide retry mechanism
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

      logger.debug('Web Audio API initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Web Audio API:', error);

      // PWA-specific error message (more helpful than generic message)
      const isPWA = 'standalone' in window.navigator && (window.navigator as any).standalone;
      const errorMessage = isPWA
        ? 'Audio initialization failed. Please close and reopen the app to fix audio.'
        : 'Your browser does not support advanced audio features. Voiceover may not work correctly.';

      setState(prev => ({
        ...prev,
        error: errorMessage
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
   * Create music audio element ONCE on mount (same pattern as voiceover)
   *
   * IMPORTANT: Reuse same element for all tracks in playlist.
   * Creating new audio element + source node for each track breaks Web Audio API connection.
   */
  useEffect(() => {
    if (!audioContextRef.current || !musicGainRef.current) return;

    logger.debug('[useAudioDucking] Creating SINGLE music audio element (will reuse for all tracks)');

    try {
      // Create ONE music element that we'll reuse for entire playlist
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.loop = false;
      audio.preload = 'auto';
      musicElementRef.current = audio;

      // Create source node ONCE and connect to gain
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(musicGainRef.current);
      musicSourceRef.current = source;

      // Event listeners (attached once, work for all tracks)
      audio.addEventListener('canplaythrough', () => {
        logger.debug('Music track ready (canplaythrough)');
        setState(prev => ({ ...prev, musicReady: true }));
      });

      audio.addEventListener('error', (e) => {
        logger.error('Music load error:', e, audio.error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load background music'
        }));
      });

      // Call onMusicEnded callback when track finishes (for playlist advancement)
      audio.addEventListener('ended', () => {
        logger.debug('Music track ended - calling onMusicEnded callback');
        if (onMusicEndedRef.current) {
          onMusicEndedRef.current();
        }
      });

      logger.debug('Music element created successfully (reusable)');
    } catch (error) {
      logger.error('Failed to setup music audio element:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to setup background music'
      }));
    }

    // Cleanup only on component unmount
    return () => {
      if (musicElementRef.current) {
        logger.debug('Unmounting: cleaning up music element');
        musicElementRef.current.pause();
        musicElementRef.current.src = '';
        musicElementRef.current = null;
      }
    };
  }, []); // Run ONCE on mount

  /**
   * Update music src when URL changes (reuse same element)
   *
   * When track advances in playlist, just change src - don't recreate element.
   * This prevents breaking the Web Audio API connection.
   */
  useEffect(() => {
    logger.debug(`[useAudioDucking] Music URL changed: ${musicUrl || 'none'}`);

    const audio = musicElementRef.current;
    if (!audio) {
      logger.debug('No music element yet (still initializing)');
      return;
    }

    if (!musicUrl) {
      logger.debug('No music URL provided');
      return;
    }

    // Stop current track and load new one
    logger.debug(`[useAudioDucking] Switching music track to: ${musicUrl}`);
    audio.pause();
    audio.currentTime = 0;

    // REUSE same element, just change src (prevents Web Audio API disconnect)
    audio.src = musicUrl;
    audio.load(); // Start downloading immediately

    logger.debug('Music src updated, downloading...');

    // Auto-play if player is not paused (resume playback after track change)
    if (!isPausedRef.current) {
      logger.debug('Player not paused - auto-playing new music track');
      audio.play().catch(err => {
        logger.error('Failed to auto-play music after src change:', err);
        setState(prev => ({
          ...prev,
          error: 'Failed to play background music. Click to enable audio.'
        }));
      });
    }
  }, [musicUrl]);

  /**
   * Create voiceover audio element ONCE on mount (YouTube/Spotify pattern)
   *
   * MOBILE iOS FIX: Reusing the same audio element for all voiceovers
   * prevents iOS from treating each new section as requiring a new user gesture.
   * This is how YouTube, Spotify, and other successful web apps handle it.
   */
  useEffect(() => {
    if (!audioContextRef.current || !voiceoverGainRef.current) return;

    logger.debug('[useAudioDucking] Creating SINGLE voiceover audio element (will reuse for all sections)');

    try {
      // Create ONE audio element that we'll reuse for the entire session
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.loop = false;
      audio.preload = 'auto';
      voiceoverElementRef.current = audio;

      // Create source node ONCE and connect to gain
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(voiceoverGainRef.current);
      voiceoverSourceRef.current = source;

      // Event listeners (attached once, work for all voiceovers)
      audio.addEventListener('canplaythrough', () => {
        logger.debug('Voiceover ready (canplaythrough)');
        setState(prev => ({ ...prev, voiceoverReady: true, error: null }));
      });

      audio.addEventListener('error', (e) => {
        logger.error('Voiceover load error:', e, audio.error);
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

      logger.debug('Voiceover element created successfully (reusable)');
    } catch (error) {
      logger.error('Failed to setup voiceover audio element:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to setup voiceover audio'
      }));
    }

    // Cleanup only on component unmount
    return () => {
      if (voiceoverElementRef.current) {
        logger.debug('Unmounting: cleaning up voiceover element');
        voiceoverElementRef.current.pause();
        voiceoverElementRef.current.src = '';
        voiceoverElementRef.current = null;
      }
    };
  }, []); // Run ONCE on mount

  /**
   * Update voiceover src when URL changes (reuse same element)
   *
   * MOBILE iOS FIX: Just change the src, don't recreate the element.
   * iOS allows continued playback on the same element after initial user gesture.
   */
  useEffect(() => {
    logger.debug(`[useAudioDucking] Voiceover URL changed: ${voiceoverUrl || 'none'}`);

    const audio = voiceoverElementRef.current;
    if (!audio) {
      logger.debug('No voiceover element yet (still initializing)');
      return;
    }

    // Clear error state
    setState(prev => ({ ...prev, error: null }));

    // If no voiceover for this section, pause and clear src
    if (!voiceoverUrl) {
      logger.debug('No voiceover for this section - pausing and clearing src');
      audio.pause();
      audio.currentTime = 0;
      audio.src = ''; // Clear src but keep element alive
      setState(prev => ({ ...prev, voiceoverReady: true }));
      duckMusic(musicVolume); // Restore music volume
      return;
    }

    // Stop current voiceover and load new one
    logger.debug(`[useAudioDucking] Switching voiceover to: ${voiceoverUrl}`);
    audio.pause();
    audio.currentTime = 0;

    // REUSE same element, just change src (YouTube/Spotify pattern)
    audio.src = voiceoverUrl;
    audio.load(); // Start downloading immediately

    logger.debug('Voiceover src updated, downloading...');
  }, [voiceoverUrl, musicVolume]);

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

      // Play music ONLY if src has been set (prevents race condition)
      if (musicAudio.src) {
        musicAudio.play().catch(err => {
          logger.error('Music play error:', err);
          setState(prev => ({
            ...prev,
            error: 'Failed to play background music. Click to enable audio.'
          }));
        });
      } else {
        logger.debug('Music element has no src yet - skipping play (src will be set shortly)');
      }

      // Play voiceover ONLY if src has been set (prevents race condition)
      if (voiceoverAudio && voiceoverAudio.src) {
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
    // FIX: Reset played tracking when voiceover URL changes to a NEW URL
    // This was causing "hit and miss" behavior on mobile - when transitioning
    // from prep → warmup → movement, the ref would hold the previous URL and
    // incorrectly block playback of the new section's voiceover.
    if (voiceoverUrl && playedVoiceoverRef.current && playedVoiceoverRef.current !== voiceoverUrl) {
      logger.debug(`New voiceover URL detected (${voiceoverUrl}), resetting played tracking (was: ${playedVoiceoverRef.current})`);
      playedVoiceoverRef.current = undefined;
    }

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

    // FIX: Mobile autoplay policy (NotAllowedError)
    // Call play() IMMEDIATELY to capture user gesture context,
    // even if audio isn't ready yet. Browser will start playing when ready.
    logger.debug('Calling play() immediately to capture user gesture context');

    const playPromise = voiceoverAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Mark this voiceover as played to prevent replays within same section
          playedVoiceoverRef.current = voiceoverUrl;
          logger.debug(`Voiceover started playing successfully: ${voiceoverUrl}`);
        })
        .catch(err => {
          logger.error('Failed to play voiceover:', err);

          // If play() failed, try resuming AudioContext first
          if (audioContextRef.current?.state === 'suspended') {
            logger.debug('AudioContext suspended, attempting resume...');
            audioContextRef.current.resume().then(() => {
              logger.debug('AudioContext resumed, retrying play...');
              if (!isCancelled) {
                voiceoverAudio.play()
                  .then(() => {
                    playedVoiceoverRef.current = voiceoverUrl;
                    logger.debug(`Voiceover started after AudioContext resume: ${voiceoverUrl}`);
                  })
                  .catch(retryErr => {
                    logger.error('Failed to play voiceover after resume:', retryErr);
                  });
              }
            });
          }
        });
    }

    // Cleanup: Cancel any pending operations
    return () => {
      isCancelled = true;
    };
  }, [voiceoverUrl, isPaused]);

  /**
   * Manual play trigger (for user gesture to bypass autoplay blocking)
   *
   * FIX (Jan 2026): iOS PWA AudioContext retry
   * - If AudioContext failed on app launch, retry here with user gesture
   * - User gesture provides required permissions for iOS sandbox
   */
  const manualPlay = () => {
    logger.debug('Manual play triggered by user gesture');

    // RETRY: If AudioContext failed to initialize, try again with user gesture
    if (!audioContextRef.current) {
      logger.warn('AudioContext not initialized - retrying with user gesture (PWA fix)');

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        audioContextRef.current = context;

        // Create gain nodes
        const musicGain = context.createGain();
        const voiceoverGain = context.createGain();
        musicGain.gain.value = musicVolume;
        voiceoverGain.gain.value = 1.0;

        musicGain.connect(context.destination);
        voiceoverGain.connect(context.destination);

        musicGainRef.current = musicGain;
        voiceoverGainRef.current = voiceoverGain;

        logger.debug('AudioContext initialized successfully on retry (PWA fix worked!)');
        setState(prev => ({ ...prev, error: null }));

        // Continue with playback below (don't return early)
      } catch (error) {
        logger.error('AudioContext retry failed:', error);
        setState(prev => ({
          ...prev,
          error: 'Audio still unavailable. Please restart the app.'
        }));
        return; // Can't proceed without AudioContext
      }
    }

    const musicAudio = musicElementRef.current;
    const voiceoverAudio = voiceoverElementRef.current;

    if (!musicAudio) {
      logger.error('No music audio element available');
      return;
    }

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
