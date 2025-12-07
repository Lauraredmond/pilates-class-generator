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

interface AudioDuckingConfig {
  musicUrl: string;
  voiceoverUrl?: string;
  isPaused: boolean;
  musicVolume?: number;      // 0.0 to 1.0 (default: 1.0)
  duckedVolume?: number;     // 0.0 to 1.0 (default: 0.35)
  fadeTime?: number;         // Fade duration in seconds (default: 0.5)
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
  fadeTime = 0.5
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

      console.log('🎛️ Web Audio API initialized');
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
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
   * Load and connect music audio
   */
  useEffect(() => {
    if (!musicUrl || !audioContextRef.current || !musicGainRef.current) return;

    try {
      // Create audio element
      const audio = new Audio(musicUrl);
      audio.crossOrigin = 'anonymous'; // Required for CORS
      audio.loop = false; // Music plays once per class
      musicElementRef.current = audio;

      // Create source node and connect to gain
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(musicGainRef.current);
      musicSourceRef.current = source;

      // Mark music as ready when loaded
      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 Music ready:', musicUrl);
        setState(prev => ({ ...prev, musicReady: true }));
      });

      audio.addEventListener('error', (e) => {
        console.error('Music load error:', e);
        setState(prev => ({
          ...prev,
          error: 'Failed to load background music'
        }));
      });

      // Preload audio
      audio.load();
    } catch (error) {
      console.error('Failed to setup music audio:', error);
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
  }, [musicUrl]);

  /**
   * Load and connect voiceover audio (if provided)
   */
  useEffect(() => {
    if (!voiceoverUrl || !audioContextRef.current || !voiceoverGainRef.current) {
      setState(prev => ({ ...prev, voiceoverReady: true })); // No voiceover = ready
      return;
    }

    try {
      // Create audio element
      const audio = new Audio(voiceoverUrl);
      audio.crossOrigin = 'anonymous'; // Required for CORS
      audio.loop = false;
      voiceoverElementRef.current = audio;

      // Create source node and connect to gain
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(voiceoverGainRef.current);
      voiceoverSourceRef.current = source;

      // Mark voiceover as ready when loaded
      audio.addEventListener('canplaythrough', () => {
        console.log('🎙️ Voiceover ready:', voiceoverUrl);
        setState(prev => ({ ...prev, voiceoverReady: true }));
      });

      audio.addEventListener('error', (e) => {
        console.error('Voiceover load error:', e);
        setState(prev => ({
          ...prev,
          error: 'Failed to load voiceover audio'
        }));
      });

      // Duck music when voiceover starts
      audio.addEventListener('play', () => {
        console.log('🎙️ Voiceover started - ducking music to', duckedVolume);
        duckMusic(duckedVolume);
      });

      // Restore music volume when voiceover ends
      audio.addEventListener('ended', () => {
        console.log('🎙️ Voiceover ended - restoring music to', musicVolume);
        duckMusic(musicVolume);
      });

      // Preload audio
      audio.load();
    } catch (error) {
      console.error('Failed to setup voiceover audio:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to setup voiceover audio'
      }));
    }

    // Cleanup
    return () => {
      if (voiceoverElementRef.current) {
        voiceoverElementRef.current.pause();
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
          console.log('🎛️ AudioContext resumed');
        });
      }

      // Play both audio streams (voiceover will auto-duck music)
      musicAudio.play().catch(err => {
        console.error('Music play error:', err);
        setState(prev => ({
          ...prev,
          error: 'Failed to play background music. Click to enable audio.'
        }));
      });

      if (voiceoverAudio) {
        voiceoverAudio.play().catch(err => {
          console.error('Voiceover play error:', err);
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
   * Manual play trigger (for user gesture to bypass autoplay blocking)
   */
  const manualPlay = () => {
    const musicAudio = musicElementRef.current;
    const voiceoverAudio = voiceoverElementRef.current;

    if (!musicAudio) {
      console.error('No music audio element available');
      return;
    }

    console.log('🎵 Manual play triggered by user gesture');

    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('🎛️ AudioContext resumed from user gesture');
      });
    }

    // Play music (user gesture bypasses autoplay blocking)
    const playPromise = musicAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Music started playing from user gesture');
          setState(prev => ({ ...prev, isPlaying: true, error: null }));
        })
        .catch(err => {
          console.error('❌ Failed to play music:', err);
          setState(prev => ({
            ...prev,
            error: `Failed to play music: ${err.message}`
          }));
        });
    }

    // Play voiceover if available
    if (voiceoverAudio) {
      voiceoverAudio.play().catch(err => {
        console.error('Voiceover play error from user gesture:', err);
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
