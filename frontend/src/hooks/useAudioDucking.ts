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
import { logMediaEvent } from '../utils/debug';

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

      // Expose AudioContext globally for debug panel
      (window as any).__AUDIO_CONTEXT__ = context;

      logger.debug('Web Audio API initialized successfully');
      logMediaEvent('music', 'AudioContext initialized', {
        state: context.state,
        sampleRate: context.sampleRate,
        baseLatency: context.baseLatency
      });
    } catch (error) {
      logger.error('Failed to initialize Web Audio API:', error);

      // PWA-specific error message (more helpful than generic message)
      const isPWA = 'standalone' in window.navigator && (window.navigator as any).standalone;
      const errorMessage = isPWA
        ? 'Audio initialization failed. Please close and reopen the app to fix audio.'
        : 'Your browser does not support advanced audio features. Voiceover may not work correctly.';

      logMediaEvent('music', 'AudioContext initialization FAILED', {
        error: error instanceof Error ? error.message : String(error),
        isPWA,
        userAgent: navigator.userAgent
      });

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
   *
   * iOS PWA FIX (Phase 3): Added aggressive AudioContext recovery
   * - iOS may suspend AudioContext even when visibility doesn't change
   * - iOS may require multiple resume attempts
   * - iOS may need audio elements to be re-played after suspend
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden (phone locked or tab switched)
        logger.debug('Page hidden - AudioContext may suspend');
        logMediaEvent('music', 'Page hidden', {
          contextState: audioContextRef.current?.state,
          isPaused: isPausedRef.current
        });
      } else {
        // Page visible again (phone unlocked or tab focused)
        logger.debug('Page visible - checking AudioContext state');
        logMediaEvent('music', 'Page visible', {
          contextState: audioContextRef.current?.state,
          isPaused: isPausedRef.current,
          musicPaused: musicElementRef.current?.paused,
          voiceoverPaused: voiceoverElementRef.current?.paused
        });

        // iOS PWA FIX: Aggressive AudioContext resume strategy
        const attemptResume = async () => {
          if (!audioContextRef.current) return;

          // Check if suspended
          if (audioContextRef.current.state === 'suspended') {
            logger.debug('AudioContext suspended, resuming...');
            logMediaEvent('music', 'AudioContext resume attempt', {
              state: audioContextRef.current.state,
              isPaused: isPausedRef.current
            });

            try {
              await audioContextRef.current.resume();
              logger.debug('AudioContext resumed after visibility change');
              logMediaEvent('music', 'AudioContext resumed SUCCESS', {
                newState: audioContextRef.current.state
              });

              // iOS PWA FIX: Wait for AudioContext to fully activate
              // iOS sometimes reports 'running' but isn't ready yet
              await new Promise(resolve => setTimeout(resolve, 100));

              // Only resume playback if not manually paused
              if (!isPausedRef.current) {
                // Resume music if it was playing
                if (musicElementRef.current && musicElementRef.current.paused && musicElementRef.current.src) {
                  logger.debug('Resuming music after visibility change');
                  logMediaEvent('music', 'Resume music after wake', {
                    src: musicElementRef.current.src,
                    currentTime: musicElementRef.current.currentTime
                  });

                  try {
                    await musicElementRef.current.play();
                    logMediaEvent('music', 'Music resumed SUCCESS', {});
                  } catch (err: any) {
                    logger.error('Failed to resume music:', err);
                    logMediaEvent('music', 'Music resume FAILED', {
                      error: err.message,
                      errorName: err.name
                    });
                  }
                }

                // Resume voiceover if it was playing
                if (voiceoverElementRef.current && voiceoverElementRef.current.paused && voiceoverElementRef.current.src) {
                  logger.debug('Resuming voiceover after visibility change');
                  logMediaEvent('voiceover', 'Resume voiceover after wake', {
                    src: voiceoverElementRef.current.src,
                    currentTime: voiceoverElementRef.current.currentTime
                  });

                  try {
                    await voiceoverElementRef.current.play();
                    logMediaEvent('voiceover', 'Voiceover resumed SUCCESS', {});
                  } catch (err: any) {
                    logger.error('Failed to resume voiceover:', err);
                    logMediaEvent('voiceover', 'Voiceover resume FAILED', {
                      error: err.message,
                      errorName: err.name
                    });
                  }
                }
              }
            } catch (err: any) {
              logger.error('Failed to resume AudioContext:', err);
              logMediaEvent('music', 'AudioContext resume FAILED', {
                error: err.message,
                errorName: err.name,
                state: audioContextRef.current.state
              });
            }
          }
        };

        attemptResume();
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // iOS PWA FIX: Also listen for focus event (iOS may not fire visibilitychange reliably)
    const handleFocus = () => {
      if (audioContextRef.current?.state === 'suspended') {
        logger.debug('Window focused with suspended AudioContext - attempting resume');
        logMediaEvent('music', 'Focus event - AudioContext suspended', {
          state: audioContextRef.current.state
        });
        handleVisibilityChange(); // Reuse visibility change logic
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  /**
   * iOS PWA FIX (Phase 3): Periodic AudioContext health check
   *
   * iOS may suspend AudioContext even without visibility changes.
   * This effect periodically checks AudioContext state and attempts recovery.
   * Only runs when playback is active (not paused).
   */
  useEffect(() => {
    if (isPaused) return; // Don't check when paused

    const healthCheckInterval = setInterval(() => {
      if (!audioContextRef.current) return;

      // Check if AudioContext is unexpectedly suspended
      if (audioContextRef.current.state === 'suspended') {
        logger.warn('AudioContext unexpectedly suspended - attempting recovery');
        logMediaEvent('music', 'AudioContext health check FAILED - suspended', {
          isPaused,
          musicPaused: musicElementRef.current?.paused,
          voiceoverPaused: voiceoverElementRef.current?.paused,
          documentHidden: document.hidden
        });

        // Attempt resume
        audioContextRef.current.resume()
          .then(() => {
            logger.debug('AudioContext recovered via health check');
            logMediaEvent('music', 'AudioContext health check RECOVERED', {
              newState: audioContextRef.current!.state
            });
          })
          .catch((err: any) => {
            logger.error('AudioContext health check recovery failed:', err);
            logMediaEvent('music', 'AudioContext health check RECOVERY FAILED', {
              error: err.message
            });
          });
      } else {
        // Log healthy state occasionally
        logMediaEvent('music', 'AudioContext health check OK', {
          state: audioContextRef.current.state,
          baseLatency: audioContextRef.current.baseLatency
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isPaused]);

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
      audio.addEventListener('loadstart', () => {
        logMediaEvent('music', 'loadstart', { src: audio.src });
      });

      audio.addEventListener('loadedmetadata', () => {
        logMediaEvent('music', 'loadedmetadata', {
          duration: audio.duration,
          networkState: audio.networkState
        });
      });

      audio.addEventListener('loadeddata', () => {
        logMediaEvent('music', 'loadeddata', { currentTime: audio.currentTime });
      });

      audio.addEventListener('canplay', () => {
        logMediaEvent('music', 'canplay', { buffered: audio.buffered.length > 0 ? audio.buffered.end(0) : 0 });
      });

      audio.addEventListener('canplaythrough', () => {
        logger.debug('Music track ready (canplaythrough)');
        logMediaEvent('music', 'canplaythrough', {
          src: audio.src,
          readyState: audio.readyState
        });
        setState(prev => ({ ...prev, musicReady: true }));
      });

      audio.addEventListener('playing', () => {
        logMediaEvent('music', 'playing', {
          currentTime: audio.currentTime,
          volume: audio.volume
        });
      });

      audio.addEventListener('pause', () => {
        logMediaEvent('music', 'pause', { currentTime: audio.currentTime });
      });

      audio.addEventListener('waiting', () => {
        logMediaEvent('music', 'waiting (buffering)', { currentTime: audio.currentTime });
      });

      audio.addEventListener('stalled', () => {
        logMediaEvent('music', 'stalled (network issue)', {
          currentTime: audio.currentTime,
          networkState: audio.networkState
        });
      });

      audio.addEventListener('error', (e) => {
        logger.error('Music load error:', e, audio.error);
        const errorDetails = audio.error ? {
          code: audio.error.code,
          message: audio.error.message,
          MEDIA_ERR_ABORTED: audio.error.code === 1,
          MEDIA_ERR_NETWORK: audio.error.code === 2,
          MEDIA_ERR_DECODE: audio.error.code === 3,
          MEDIA_ERR_SRC_NOT_SUPPORTED: audio.error.code === 4
        } : { message: 'Unknown error' };

        logMediaEvent('music', 'ERROR', {
          ...errorDetails,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState
        });

        setState(prev => ({
          ...prev,
          error: 'Failed to load background music'
        }));
      });

      // Call onMusicEnded callback when track finishes (for playlist advancement)
      audio.addEventListener('ended', () => {
        logger.debug('Music track ended - calling onMusicEnded callback');
        logMediaEvent('music', 'ended', {
          src: audio.src,
          duration: audio.duration
        });
        if (onMusicEndedRef.current) {
          onMusicEndedRef.current();
        }
      });

      logger.debug('Music element created successfully (reusable)');
      logMediaEvent('music', 'element created (reusable)', {
        crossOrigin: audio.crossOrigin,
        preload: audio.preload
      });
    } catch (error) {
      logger.error('Failed to setup music audio element:', error);
      logMediaEvent('music', 'element creation FAILED', {
        error: error instanceof Error ? error.message : String(error)
      });
      setState(prev => ({
        ...prev,
        error: 'Failed to setup background music'
      }));
    }

    // Cleanup only on component unmount
    return () => {
      if (musicElementRef.current) {
        logger.debug('Unmounting: cleaning up music element');

        // Pause playback
        musicElementRef.current.pause();

        // Don't set src = '' as that triggers MediaError code 4
        // Don't manually remove event listeners - they'll be garbage collected with the element
        // Just pause and nullify ref - browser handles cleanup

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
    logMediaEvent('music', 'URL changed', { newUrl: musicUrl || 'none' });

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
    logMediaEvent('music', 'switching track', {
      oldSrc: audio.src,
      newSrc: musicUrl,
      wasPlaying: !audio.paused
    });

    audio.pause();
    audio.currentTime = 0;

    // REUSE same element, just change src (prevents Web Audio API disconnect)
    audio.src = musicUrl;
    audio.load(); // Start downloading immediately

    logger.debug('Music src updated, downloading...');
    logMediaEvent('music', 'src updated - loading', { src: musicUrl });

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
      audio.addEventListener('loadstart', () => {
        logMediaEvent('voiceover', 'loadstart', { src: audio.src });
      });

      audio.addEventListener('loadedmetadata', () => {
        logMediaEvent('voiceover', 'loadedmetadata', {
          duration: audio.duration,
          networkState: audio.networkState
        });
      });

      audio.addEventListener('loadeddata', () => {
        logMediaEvent('voiceover', 'loadeddata', { currentTime: audio.currentTime });
      });

      audio.addEventListener('canplay', () => {
        logMediaEvent('voiceover', 'canplay', {
          buffered: audio.buffered.length > 0 ? audio.buffered.end(0) : 0
        });
      });

      audio.addEventListener('canplaythrough', () => {
        logger.debug('Voiceover ready (canplaythrough)');
        logMediaEvent('voiceover', 'canplaythrough', {
          src: audio.src,
          readyState: audio.readyState
        });
        setState(prev => ({ ...prev, voiceoverReady: true, error: null }));
      });

      audio.addEventListener('playing', () => {
        logMediaEvent('voiceover', 'playing', {
          currentTime: audio.currentTime,
          volume: audio.volume
        });
      });

      audio.addEventListener('pause', () => {
        logMediaEvent('voiceover', 'pause', { currentTime: audio.currentTime });
      });

      audio.addEventListener('waiting', () => {
        logMediaEvent('voiceover', 'waiting (buffering)', {
          currentTime: audio.currentTime
        });
      });

      audio.addEventListener('stalled', () => {
        logMediaEvent('voiceover', 'stalled (network issue)', {
          currentTime: audio.currentTime,
          networkState: audio.networkState
        });
      });

      audio.addEventListener('error', (e) => {
        logger.error('Voiceover load error:', e, audio.error);
        const errorDetails = audio.error ? {
          code: audio.error.code,
          message: audio.error.message,
          MEDIA_ERR_ABORTED: audio.error.code === 1,
          MEDIA_ERR_NETWORK: audio.error.code === 2,
          MEDIA_ERR_DECODE: audio.error.code === 3,
          MEDIA_ERR_SRC_NOT_SUPPORTED: audio.error.code === 4
        } : { message: 'Unknown error' };

        logMediaEvent('voiceover', 'ERROR', {
          ...errorDetails,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState
        });

        setState(prev => ({
          ...prev,
          error: 'Failed to load voiceover audio'
        }));
      });

      // Duck music when voiceover starts
      audio.addEventListener('play', () => {
        logger.debug('Voiceover started - ducking music');
        logMediaEvent('voiceover', 'play (ducking music)', {
          targetVolume: duckedVolume
        });
        duckMusic(duckedVolume);
      });

      // Restore music volume when voiceover ends
      audio.addEventListener('ended', () => {
        logger.debug('Voiceover ended - restoring music');
        logMediaEvent('voiceover', 'ended (restoring music)', {
          targetVolume: musicVolume,
          duration: audio.duration
        });
        duckMusic(musicVolume);
      });

      logger.debug('Voiceover element created successfully (reusable)');
      logMediaEvent('voiceover', 'element created (reusable)', {
        crossOrigin: audio.crossOrigin,
        preload: audio.preload
      });
    } catch (error) {
      logger.error('Failed to setup voiceover audio element:', error);
      logMediaEvent('voiceover', 'element creation FAILED', {
        error: error instanceof Error ? error.message : String(error)
      });
      setState(prev => ({
        ...prev,
        error: 'Failed to setup voiceover audio'
      }));
    }

    // Cleanup only on component unmount
    return () => {
      if (voiceoverElementRef.current) {
        logger.debug('Unmounting: cleaning up voiceover element');

        // Pause playback
        voiceoverElementRef.current.pause();

        // Don't set src = '' as that triggers MediaError code 4
        // Don't manually remove event listeners - they'll be garbage collected with the element
        // Just pause and nullify ref - browser handles cleanup

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
    logMediaEvent('voiceover', 'URL changed', { newUrl: voiceoverUrl || 'none' });

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
      logMediaEvent('voiceover', 'no voiceover for section - clearing', {
        restoringMusicVolume: musicVolume
      });
      audio.pause();
      audio.currentTime = 0;
      audio.src = ''; // Clear src but keep element alive
      setState(prev => ({ ...prev, voiceoverReady: true }));
      duckMusic(musicVolume); // Restore music volume
      return;
    }

    // Stop current voiceover and load new one
    logger.debug(`[useAudioDucking] Switching voiceover to: ${voiceoverUrl}`);
    logMediaEvent('voiceover', 'switching voiceover', {
      oldSrc: audio.src,
      newSrc: voiceoverUrl,
      wasPlaying: !audio.paused
    });

    audio.pause();
    audio.currentTime = 0;

    // REUSE same element, just change src (YouTube/Spotify pattern)
    audio.src = voiceoverUrl;
    audio.load(); // Start downloading immediately

    logger.debug('Voiceover src updated, downloading...');
    logMediaEvent('voiceover', 'src updated - loading', { src: voiceoverUrl });
  }, [voiceoverUrl, musicVolume]);

  /**
   * Duck music volume with smooth fade
   */
  const duckMusic = (targetVolume: number) => {
    if (!musicGainRef.current || !audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    const gain = musicGainRef.current.gain;

    logMediaEvent('music', 'volume change (ducking)', {
      from: gain.value,
      to: targetVolume,
      fadeTime,
      reason: targetVolume < 1.0 ? 'voiceover playing' : 'voiceover ended'
    });

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
      logMediaEvent('music', 'PAUSE requested', {
        musicPaused: musicAudio.paused,
        voiceoverPaused: voiceoverAudio?.paused ?? true
      });
      musicAudio.pause();
      if (voiceoverAudio) voiceoverAudio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      logMediaEvent('music', 'PLAY requested', {
        contextState: audioContextRef.current?.state,
        musicHasSrc: !!musicAudio.src,
        voiceoverHasSrc: !!voiceoverAudio?.src
      });

      // Resume AudioContext if suspended (browser autoplay policy)
      if (audioContextRef.current?.state === 'suspended') {
        logMediaEvent('music', 'AudioContext suspended - resuming', {
          state: audioContextRef.current.state
        });
        audioContextRef.current.resume().then(() => {
          logger.debug('AudioContext resumed');
          logMediaEvent('music', 'AudioContext resumed successfully', {
            newState: audioContextRef.current!.state
          });
        });
      }

      // Play music ONLY if src has been set (prevents race condition)
      if (musicAudio.src) {
        musicAudio.play().catch(err => {
          logger.error('Music play error:', err);
          logMediaEvent('music', 'PLAY ERROR', {
            error: err.message,
            errorName: err.name,
            src: musicAudio.src,
            readyState: musicAudio.readyState
          });
          setState(prev => ({
            ...prev,
            error: 'Failed to play background music. Click to enable audio.'
          }));
        });
      } else {
        logger.debug('Music element has no src yet - skipping play (src will be set shortly)');
        logMediaEvent('music', 'PLAY skipped (no src yet)', {});
      }

      // Play voiceover ONLY if src has been set (prevents race condition)
      if (voiceoverAudio && voiceoverAudio.src) {
        voiceoverAudio.play().catch(err => {
          logger.error('Voiceover play error:', err);
          logMediaEvent('voiceover', 'PLAY ERROR', {
            error: err.message,
            errorName: err.name,
            src: voiceoverAudio.src,
            readyState: voiceoverAudio.readyState
          });
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
