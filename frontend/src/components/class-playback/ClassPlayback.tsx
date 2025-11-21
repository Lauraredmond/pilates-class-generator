/**
 * ClassPlayback Component
 * Full-screen timer-based class playback with auto-advance
 * Integrated with SoundCloud music playback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MovementDisplay } from './MovementDisplay';
import { PlaybackControls } from './PlaybackControls';
import { TimerDisplay } from './TimerDisplay';
import { getPlaylistByName, DEFAULT_MOVEMENT_PLAYLIST, DEFAULT_COOLDOWN_PLAYLIST } from '../../utils/musicPlaylists';

// SoundCloud Widget API type definitions
declare global {
  interface Window {
    SC: {
      Widget: {
        new (iframeId: string): SoundCloudWidget;
        Events: {
          READY: 'ready';
          PLAY: 'play';
          PAUSE: 'pause';
          FINISH: 'finish';
          ERROR: 'error';
        };
      };
    };
  }
}

interface SoundCloudWidget {
  load(url: string, options?: { auto_play?: boolean }): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(milliseconds: number): void;
  setVolume(volume: number): void;
  bind(eventName: string, listener: () => void): void;
  unbind(eventName: string): void;
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

  const currentItem = items[currentIndex];
  const totalItems = items.length;
  const widgetRef = useRef<SoundCloudWidget | null>(null);

  // Get appropriate playlist URLs
  const movementPlaylist = getPlaylistByName(movementMusicStyle) || DEFAULT_MOVEMENT_PLAYLIST;
  const cooldownPlaylist = getPlaylistByName(coolDownMusicStyle) || DEFAULT_COOLDOWN_PLAYLIST;

  // Initialize SoundCloud Widget
  useEffect(() => {
    // Wait for SoundCloud Widget API to load
    const initWidget = () => {
      if (typeof window.SC === 'undefined') {
        // Retry after a short delay
        setTimeout(initWidget, 100);
        return;
      }

      try {
        const widget = new window.SC.Widget('sc-widget');
        widgetRef.current = widget;

        // Wait for widget to be ready
        widget.bind(window.SC.Widget.Events.READY, () => {
          console.log('SoundCloud widget ready');
          setIsMusicReady(true);
          widget.setVolume(50); // Set to 50% volume
          // Note: Don't auto-play here - let the pause/resume effect handle it
          // This avoids browser autoplay blocking issues
        });

        widget.bind(window.SC.Widget.Events.ERROR, () => {
          console.error('SoundCloud widget error - check playlist URL');
        });
      } catch (error) {
        console.error('Error initializing SoundCloud widget:', error);
      }
    };

    initWidget();

    // Cleanup
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.pause();
        } catch (e) {
          // Widget may already be destroyed
        }
      }
    };
  }, []);

  // Sync music pause/resume with class timer
  useEffect(() => {
    if (!widgetRef.current || !isMusicReady) return;

    try {
      if (isPaused) {
        widgetRef.current.pause();
      } else {
        // Trigger play - happens after user clicked "Play Class"
        widgetRef.current.play();
        console.log('Music play triggered');
      }
    } catch (error) {
      console.error('Error controlling SoundCloud playback:', error);
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

      {/* SoundCloud Widget (hidden iframe) */}
      <iframe
        id="sc-widget"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(movementPlaylist.url)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
        width="0"
        height="0"
        style={{ display: 'none' }}
        allow="autoplay"
        title="SoundCloud Music Player"
      />

      {/* Music info */}
      <div className="absolute bottom-20 left-4 text-xs text-cream/40 space-y-1">
        <p className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isMusicReady ? 'bg-green-500' : 'bg-gray-500'}`} />
          {isMusicReady ? 'Music Playing' : 'Music Loading...'}
        </p>
        <p>Movement: {movementPlaylist.name}</p>
        <p>Cool Down: {cooldownPlaylist.name}</p>
      </div>
    </div>
  );
}
