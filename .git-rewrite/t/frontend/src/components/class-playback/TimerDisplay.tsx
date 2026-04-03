/**
 * TimerDisplay Component
 * Shows countdown timer and progress information
 */

interface TimerDisplayProps {
  timeRemaining: number;
  totalDuration: number;
  currentIndex: number;
  totalItems: number;
}

export function TimerDisplay({
  timeRemaining,
  totalDuration,
  currentIndex,
  totalItems,
}: TimerDisplayProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((totalDuration - timeRemaining) / totalDuration) * 100;

  return (
    <div className="flex flex-col items-center px-6">
      {/* Progress indicator */}
      <div className="text-sm font-semibold text-cream/60 mb-2">
        {currentIndex + 1} of {totalItems}
      </div>

      {/* Timer */}
      <div className="text-6xl font-bold text-cream mb-4">
        {formatTime(timeRemaining)}
      </div>

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
