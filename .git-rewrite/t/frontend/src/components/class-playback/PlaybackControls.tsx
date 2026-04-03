/**
 * PlaybackControls Component
 * Pause, Previous, Next controls for class playback
 */

interface PlaybackControlsProps {
  isPaused: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function PlaybackControls({
  isPaused,
  canGoPrevious,
  canGoNext,
  onPause,
  onPrevious,
  onNext,
}: PlaybackControlsProps) {
  return (
    <div className="bg-burgundy-dark border-t border-cream/20 px-6 py-4">
      <div className="flex items-center justify-center gap-6">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`p-3 rounded-full border transition-smooth ${
            canGoPrevious
              ? 'border-cream/40 text-cream hover:border-cream hover:bg-burgundy'
              : 'border-cream/20 text-cream/30 cursor-not-allowed'
          }`}
          aria-label="Previous"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Pause/Resume Button */}
        <button
          onClick={onPause}
          className="p-4 rounded-full bg-cream text-burgundy hover:bg-cream/90 transition-smooth"
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-3 rounded-full border transition-smooth ${
            canGoNext
              ? 'border-cream/40 text-cream hover:border-cream hover:bg-burgundy'
              : 'border-cream/20 text-cream/30 cursor-not-allowed'
          }`}
          aria-label="Next"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
