/**
 * Music Player Component
 * Session 9: Music Integration
 *
 * HTML5 audio player that syncs with Pilates class playback.
 * Features:
 * - Automatic track progression
 * - Volume control
 * - Play/pause sync with class
 * - Graceful failure handling (class continues without music if track fails)
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Track {
  id: string;
  title: string;
  composer: string | null;
  artist_performer: string | null;
  duration_seconds: number;
  audio_url: string;
  bpm: number | null;
}

interface MusicPlayerProps {
  playlistId?: string;
  isPlaying: boolean;  // Controlled by class playback state
  volume?: number;      // 0-100
  onTrackChange?: (track: Track | null) => void;
  onPlaybackError?: (error: string) => void;
  className?: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  playlistId,
  isPlaying,
  volume = 50,
  onTrackChange,
  onPlaybackError,
  className = ''
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch playlist tracks when playlistId changes
  useEffect(() => {
    if (playlistId) {
      fetchPlaylistTracks();
    } else {
      setTracks([]);
      setCurrentTrackIndex(0);
    }
  }, [playlistId]);

  // Sync play/pause state with class playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('Audio playback failed:', err);
          handlePlaybackError('Unable to play audio. Class will continue without music.');
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Notify parent when track changes
  useEffect(() => {
    if (tracks.length > 0 && onTrackChange) {
      const currentTrack = tracks[currentTrackIndex] || null;
      onTrackChange(currentTrack);
    }
  }, [currentTrackIndex, tracks, onTrackChange]);

  const fetchPlaylistTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/music/playlists/${playlistId}`);

      if (response.data && response.data.tracks) {
        setTracks(response.data.tracks);
        setCurrentTrackIndex(0);
      } else {
        throw new Error('Invalid playlist data');
      }
    } catch (err) {
      console.error('Failed to fetch playlist tracks:', err);
      const errorMsg = 'Unable to load music. Your class will continue without background music.';
      setError(errorMsg);
      handlePlaybackError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackError = (errorMsg: string) => {
    if (onPlaybackError) {
      onPlaybackError(errorMsg);
    }
  };

  const handleTrackEnded = () => {
    // Move to next track
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      // Loop back to first track or stop
      setCurrentTrackIndex(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('Audio error:', e);

    // Try to skip to next track
    if (currentTrackIndex < tracks.length - 1) {
      console.log('Skipping to next track due to error');
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      handlePlaybackError('Music track failed to load. Class continues without music.');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTrack = tracks[currentTrackIndex];

  // If no playlist, don't render anything
  if (!playlistId) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className={`music-player bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading music...</span>
        </div>
      </div>
    );
  }

  // Error state - show minimal UI
  if (error) {
    return (
      <div className={`music-player bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="ml-2 text-sm text-yellow-800">{error}</p>
        </div>
      </div>
    );
  }

  // No tracks available
  if (tracks.length === 0) {
    return (
      <div className={`music-player bg-gray-50 rounded-lg p-4 ${className}`}>
        <p className="text-center text-gray-600">No music tracks available for this playlist.</p>
      </div>
    );
  }

  return (
    <div className={`music-player bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audio_url}
        onEnded={handleTrackEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
        preload="auto"
      />

      {/* Player UI */}
      <div className="p-4">
        {/* Now Playing */}
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <span>Now Playing: Track {currentTrackIndex + 1} of {tracks.length}</span>
          </div>

          <h4 className="font-semibold text-gray-900 truncate">{currentTrack?.title}</h4>

          {currentTrack?.composer && (
            <p className="text-sm text-gray-600 truncate">{currentTrack.composer}</p>
          )}

          {currentTrack?.artist_performer && (
            <p className="text-xs text-gray-500 truncate">{currentTrack.artist_performer}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Playback Status */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            {isPlaying ? (
              <>
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Playing</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Paused</span>
              </>
            )}
          </div>

          {currentTrack?.bpm && (
            <span className="text-gray-500">
              {currentTrack.bpm} BPM
            </span>
          )}
        </div>
      </div>

      {/* Attribution Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          Music from <strong>Musopen</strong> & <strong>FreePD</strong> - Public Domain Classical Music
        </p>
      </div>
    </div>
  );
};

export default MusicPlayer;
