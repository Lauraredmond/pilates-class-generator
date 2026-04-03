/**
 * MusicResultsTab Component
 * Displays generated music playlist with BPM and duration
 */

import { MusicResult } from './GeneratedResults';

interface MusicResultsTabProps {
  data: MusicResult;
}

export function MusicResultsTab({ data }: MusicResultsTabProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Total Tracks</p>
          <p className="text-2xl font-bold text-cream">{data.playlist.length}</p>
        </div>
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Total Duration</p>
          <p className="text-2xl font-bold text-cream">
            {Math.round(data.total_duration / 60)}m
          </p>
        </div>
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Average BPM</p>
          <p className="text-2xl font-bold text-cream">{data.average_bpm}</p>
        </div>
      </div>

      {/* Playlist */}
      <div>
        <h4 className="text-sm font-semibold text-cream mb-3">Playlist</h4>
        <div className="space-y-2">
          {data.playlist.map((track, index) => (
            <div
              key={index}
              className="bg-burgundy-dark border border-cream/30 rounded-lg p-4 hover:border-cream/40 transition-smooth"
            >
              <div className="flex items-center gap-4">
                {/* Track Number */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-burgundy border border-cream/30 flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-cream"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-cream truncate">{track.title}</h5>
                  <p className="text-sm text-cream/60 truncate">{track.artist}</p>
                </div>

                {/* BPM & Duration */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cream">{track.bpm} BPM</p>
                    <p className="text-xs text-cream/60">tempo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cream">
                      {formatDuration(track.duration_seconds)}
                    </p>
                    <p className="text-xs text-cream/60">duration</p>
                  </div>
                </div>

                {/* External Link */}
                {track.url && (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-cream/10 rounded-lg transition-smooth"
                  >
                    <svg
                      className="w-5 h-5 text-cream"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-burgundy-dark border border-cream/30 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-cream/70 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-cream mb-1">Playlist Notes</p>
            <p className="text-xs text-cream/70">
              This playlist is curated to match your class energy curve. BPM increases
              during active segments and decreases during cool-down.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
