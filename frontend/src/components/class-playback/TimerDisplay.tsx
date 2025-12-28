/**
 * TimerDisplay Component
 * Shows countdown timer and progress information with music info
 */

interface TimerDisplayProps {
  timeRemaining: number;
  totalDuration: number;
  currentIndex: number;
  totalItems: number;
  playlistName?: string;
  trackIndex?: number;
  totalTracks?: number;
  currentTrack?: {
    composer: string;
    title: string;
  };
}

export function TimerDisplay({
  timeRemaining,
  totalDuration,
  currentIndex,
  totalItems,
  playlistName,
  trackIndex,
  totalTracks,
  currentTrack,
}: TimerDisplayProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((totalDuration - timeRemaining) / totalDuration) * 100;

  return (
    <div className="flex flex-col items-center px-6">
      {/* Progress indicator and Music Info on same line */}
      <div className="flex items-center justify-between w-full max-w-md mb-2">
        {/* Progress indicator */}
        <div className="text-sm font-semibold text-cream/60">
          {currentIndex + 1} of {totalItems}
        </div>

        {/* Music Info - compact, inline */}
        {playlistName && (
          <div className="text-xs text-cream/50 text-right">
            <div className="font-medium">{playlistName}</div>
            {trackIndex !== undefined && totalTracks && (
              <div className="text-cream/40">
                Track {trackIndex + 1}/{totalTracks}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="text-6xl font-bold text-cream mb-2">
        {formatTime(timeRemaining)}
      </div>

      {/* Current track - below timer */}
      {currentTrack && (
        <div className="text-xs text-cream/50 mb-4 max-w-md truncate text-center">
          {currentTrack.composer} - {currentTrack.title}
        </div>
      )}

      {/* Linear progress bar */}
      <div className="w-full max-w-md h-2 bg-burgundy-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-cream transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
