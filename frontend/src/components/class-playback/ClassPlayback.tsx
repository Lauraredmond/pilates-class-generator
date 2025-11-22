/**
 * ClassPlayback Component
 * Full-screen timer-based class playback with auto-advance
 * Integrated with SoundCloud OAuth music playback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { MovementDisplay } from './MovementDisplay';
import { PlaybackControls } from './PlaybackControls';
import { TimerDisplay } from './TimerDisplay';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// SoundCloud API type definitions
interface SoundCloudTrack {
  id: number;
  title: string;
  duration: number;
  stream_url: string;
  artwork_url?: string;
}

interface SoundCloudPlaylist {
  id: number;
  title: string;
  tracks: SoundCloudTrack[];
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

export type PlaybackItem = PlaybackMovement | PlaybackTransition;

interface ClassPlaybackProps {
  items: PlaybackItem[];
  movementMusicStyle: string;
  coolDownMusicStyle: string;
  className?: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export function ClassPlayback({
  items,
  movementMusicStyle,
  coolDownMusicStyle,
  className = '',
  onComplete,
  onExit,
}: ClassPlaybackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(items[0]?.duration_seconds || 0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMusicReady, setIsMusicReady] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<SoundCloudPlaylist | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicError, setMusicError] = useState<string | null>(null);

  const currentItem = items[currentIndex];
  const totalItems = items.length;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch SoundCloud playlist via OAuth API
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setMusicError(null);

        // Search for playlist by name (using movement music style)
        const response = await axios.get(`${API_BASE_URL}/api/soundcloud/search/playlists`, {
          params: { query: movementMusicStyle }
        });

        if (response.data && response.data.length > 0) {
          const playlist = response.data[0];
          setCurrentPlaylist(playlist);

          // If tracks available, load first track
          if (playlist.tracks && playlist.tracks.length > 0) {
            await loadTrack(playlist.tracks[0].id);
          }
        } else {
          // Fallback: get any available playlist
          const allPlaylists = await axios.get(`${API_BASE_URL}/api/soundcloud/playlists?limit=1`);
          if (allPlaylists.data && allPlaylists.data.length > 0) {
            const playlist = allPlaylists.data[0];
            setCurrentPlaylist(playlist);
            if (playlist.tracks && playlist.tracks.length > 0) {
              await loadTrack(playlist.tracks[0].id);
            }
          } else {
            setMusicError('No playlists available. Please connect SoundCloud in admin panel.');
          }
        }
      } catch (error: any) {
        console.error('Error fetching SoundCloud playlist:', error);
        if (error.response?.status === 401) {
          setMusicError('SoundCloud not connected. Admin must authorize via /admin/soundcloud');
        } else {
          setMusicError('Failed to load music. Class will continue without audio.');
        }
      }
    };

    fetchPlaylist();
  }, [movementMusicStyle]);

  // Load a specific track's stream URL
  const loadTrack = async (trackId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/soundcloud/tracks/${trackId}/stream`);

      if (audioRef.current && response.data.stream_url) {
        audioRef.current.src = response.data.stream_url;
        audioRef.current.volume = 0.5; // 50% volume
        setIsMusicReady(true);
        console.log('Music track loaded:', response.data.title);
      }
    } catch (error) {
      console.error('Error loading track stream:', error);
      setMusicError('Failed to load music track. Continuing without audio.');
    }
  };

  // Initialize HTML5 audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Handle track ending - load next track
    audio.addEventListener('ended', () => {
      if (currentPlaylist && currentPlaylist.tracks) {
        const nextIndex = (currentTrackIndex + 1) % currentPlaylist.tracks.length;
        setCurrentTrackIndex(nextIndex);
        loadTrack(currentPlaylist.tracks[nextIndex].id);
      }
    });

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentPlaylist, currentTrackIndex]);

  // Sync music pause/resume with class timer
  useEffect(() => {
    if (!audioRef.current || !isMusicReady) return;

    try {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        // Trigger play - happens after user clicked "Play Class"
        audioRef.current.play().catch(error => {
          console.error('Audio play failed:', error);
          // Browser may block autoplay - user needs to interact first
        });
        console.log('Music play triggered');
      }
    } catch (error) {
      console.error('Error controlling music playback:', error);
    }
  }, [isPaused, isMusicReady]);

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

      {/* Music info */}
      <div className="absolute bottom-20 left-4 text-xs text-cream/40 space-y-1">
        {musicError ? (
          <p className="flex items-center gap-2 text-yellow-400">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
            {musicError}
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isMusicReady ? 'bg-green-500' : 'bg-gray-500'}`} />
              {isMusicReady ? 'Music Playing' : 'Music Loading...'}
            </p>
            {currentPlaylist && (
              <>
                <p>Playlist: {currentPlaylist.title}</p>
                <p>Track {currentTrackIndex + 1} of {currentPlaylist.tracks?.length || 0}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
