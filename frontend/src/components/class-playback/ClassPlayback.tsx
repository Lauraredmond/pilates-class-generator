/**
 * ClassPlayback Component
 * Full-screen timer-based class playback with auto-advance
 * Integrated with music database (Internet Archive streaming)
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MovementDisplay } from './MovementDisplay';
import { PlaybackControls } from './PlaybackControls';
import { TimerDisplay } from './TimerDisplay';
import { useAudioDucking } from '../../hooks/useAudioDucking';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pilates-class-generator-api3.onrender.com';

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
}

export interface PlaybackWarmup {
  type: 'warmup';
  routine_name: string;
  narrative: string;
  movements: any; // JSONB - simple movements like neck rolls
  duration_seconds: number;
  focus_area: string;
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
}

export interface PlaybackCooldown {
  type: 'cooldown';
  sequence_name: string;
  narrative: string;
  stretches: any; // JSONB - stretch descriptions
  duration_seconds: number;
  target_muscles: string[];
  recovery_focus: string;
}

export interface PlaybackMeditation {
  type: 'meditation';
  script_name: string;
  script_text: string;
  duration_seconds: number;
  breathing_guidance?: string;
  meditation_theme: string;
}

export interface PlaybackHomeCare {
  type: 'homecare';
  advice_name: string;
  advice_text: string;
  actionable_tips: string[];
  duration_seconds: number;
  focus_area: string;
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
  className?: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export function ClassPlayback({
  items,
  movementMusicStyle,
  className = '',
  onComplete,
  onExit,
}: ClassPlaybackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(items[0]?.duration_seconds || 0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<MusicPlaylist | null>(null);
  const [currentTrackIndex] = useState(0); // TODO: Add track advancement when useAudioDucking supports onMusicEnded callback
  const [musicError, setMusicError] = useState<string | null>(null);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  // Get current movement's voiceover URL (if it's a movement with voiceover enabled)
  const currentMovementVoiceover =
    currentItem?.type === 'movement' && currentItem.voiceover_enabled
      ? currentItem.voiceover_url
      : undefined;

  // Get current track URL from playlist
  const currentMusicUrl = currentPlaylist?.tracks?.[currentTrackIndex]?.audio_url || '';

  // Use dual audio hook for music + voiceover with automatic ducking
  const audioState = useAudioDucking({
    musicUrl: currentMusicUrl,
    voiceoverUrl: currentMovementVoiceover,
    isPaused: isPaused,
    musicVolume: 1.0,      // 100% when no voiceover
    duckedVolume: 0.35,    // 35% during voiceover
    fadeTime: 0.5          // 0.5s smooth fade
  });

  // Fetch music playlist from database
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setMusicError(null);

        // Map movement music style to stylistic period
        // movementMusicStyle could be: "Baroque", "Classical", "Romantic", "Impressionist", etc.
        const stylisticPeriod = movementMusicStyle.toUpperCase().replace(/\s+/g, '_');

        // Get playlists for this stylistic period
        const response = await axios.get(`${API_BASE_URL}/api/music/playlists`, {
          params: {
            stylistic_period: stylisticPeriod,
            is_featured: true
          }
        });

        if (response.data && response.data.length > 0) {
          // Get the first featured playlist
          const playlistSummary = response.data[0];

          // Fetch full playlist with tracks
          const fullPlaylistResponse = await axios.get(
            `${API_BASE_URL}/api/music/playlists/${playlistSummary.id}`
          );

          const playlist = fullPlaylistResponse.data;
          setCurrentPlaylist(playlist);
        } else {
          // Fallback: get any featured playlist
          const fallbackResponse = await axios.get(`${API_BASE_URL}/api/music/playlists`, {
            params: { is_featured: true, limit: 1 }
          });

          if (fallbackResponse.data && fallbackResponse.data.length > 0) {
            const playlistSummary = fallbackResponse.data[0];
            const fullPlaylistResponse = await axios.get(
              `${API_BASE_URL}/api/music/playlists/${playlistSummary.id}`
            );
            const playlist = fullPlaylistResponse.data;
            setCurrentPlaylist(playlist);
          } else {
            setMusicError('No music playlists available.');
          }
        }
      } catch (error: any) {
        console.error('Error fetching music playlist:', error);
        setMusicError('Failed to load music. Class will continue without audio.');
      }
    };

    fetchPlaylist();
  }, [movementMusicStyle]);

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
    setIsPaused((prev) => !prev);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTimeRemaining(items[currentIndex - 1]?.duration_seconds || 0);
    }
  }, [currentIndex, items]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(items[currentIndex + 1]?.duration_seconds || 0);
    } else {
      handleComplete();
    }
  }, [currentIndex, totalItems, items]);

  const handleComplete = useCallback(() => {
    setIsPaused(true);
    onComplete?.();
  }, [onComplete]);

  const handleExitRequest = useCallback(() => {
    if (!isPaused && currentIndex > 0) {
      setShowExitConfirm(true);
    } else {
      onExit?.();
    }
  }, [isPaused, currentIndex, onExit]);

  const handleExitConfirm = useCallback(() => {
    setShowExitConfirm(false);
    onExit?.();
  }, [onExit]);

  const handleExitCancel = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  if (!currentItem) {
    return null;
  }

  // Calculate progress percentage
  const progressPercentage = ((totalItems - currentIndex - 1 + (1 - timeRemaining / currentItem.duration_seconds)) / totalItems) * 100;

  return (
    <div className={`fixed inset-0 z-50 bg-burgundy ${className}`}>
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
          />
        </div>

        {/* Movement Display */}
        <div className="flex-1 overflow-y-auto">
          <MovementDisplay item={currentItem} />
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

            {/* Audio status indicator */}
            <div className="text-xs text-cream/40 space-y-1">
              <p className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${audioState.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                {audioState.isPlaying ? 'Audio Playing' : audioState.isReady ? 'Audio Ready' : 'Audio Loading...'}
              </p>

              {/* Show current volume during ducking */}
              <p className="flex items-center gap-2">
                Music: {Math.round(audioState.currentVolume * 100)}%
                {audioState.currentVolume < 1.0 && ' (ducked for voiceover)'}
              </p>

              {/* Show if voiceover is active for this movement */}
              {currentMovementVoiceover && (
                <p className="text-green-400">
                  🎙️ Voiceover enabled for this movement
                </p>
              )}

              {currentPlaylist && (
                <>
                  <p>Playlist: {currentPlaylist.name}</p>
                  <p>Track {currentTrackIndex + 1} of {currentPlaylist.tracks?.length || 0}</p>
                  {currentPlaylist.tracks && currentPlaylist.tracks[currentTrackIndex] && (
                    <p className="truncate max-w-xs">
                      {currentPlaylist.tracks[currentTrackIndex].composer} - {currentPlaylist.tracks[currentTrackIndex].title}
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
