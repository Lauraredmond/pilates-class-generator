/**
 * MovementDisplay Component
 * Teleprompter-style auto-scrolling narrative display
 */

import { useEffect, useRef, useState } from 'react';
import { PlaybackItem } from './ClassPlayback';

interface MovementDisplayProps {
  item: PlaybackItem;
  isPaused?: boolean; // Pause narrative scroll when H&S modal is shown
}

export function MovementDisplay({ item, isPaused = false }: MovementDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoEnded, setVideoEnded] = useState(false); // Track when video finishes

  // Persist scroll state across pause/resume cycles
  const pausedElapsedTimeRef = useRef<number>(0); // Time already scrolled before pause
  const pauseTimestampRef = useRef<number>(0); // When the pause happened

  // DEBUG: Check if video_url exists when rendering movements
  if (item.type === 'movement') {
    console.log('🎥 DEBUG: MovementDisplay received item:', item);
    console.log('🎥 DEBUG: MovementDisplay video_url:', (item as any).video_url);
  }

  /**
   * Sync video playback with class pause state
   *
   * FIX: Start video as soon as it's ready (canplay event) instead of arbitrary delay
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      if (!isPaused) {
        console.log('🎥 DEBUG: Video ready to play - starting immediately');
        video.play().catch(err => {
          console.error('🎥 DEBUG: Video autoplay failed:', err);
          // Silently fail - video will have controls for manual play
        });
      }
    };

    if (isPaused) {
      // Pause video when class is paused
      video.pause();
      console.log('🎥 DEBUG: Video paused (class paused)');
    } else {
      // Play video as soon as it's buffered enough
      // Check if already ready
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA or better
        console.log('🎥 DEBUG: Video already buffered - playing immediately');
        video.play().catch(err => {
          console.error('🎥 DEBUG: Video autoplay failed:', err);
        });
      } else {
        // Wait for canplay event (fires when video is ready)
        console.log('🎥 DEBUG: Waiting for video to buffer...');
        video.addEventListener('canplay', handleCanPlay, { once: true });
      }
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [item, isPaused]);

  // Reset scroll to top ONLY when section changes (not on pause/resume)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = 0;

    // Reset pause state refs when new section starts
    pausedElapsedTimeRef.current = 0;
    pauseTimestampRef.current = 0;

    // Reset video ended state when section changes
    setVideoEnded(false);
  }, [item]);

  // Auto-scroll effect - scrolls upward continuously like a real teleprompter
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // If paused, save current elapsed time and exit
    if (isPaused) {
      // Store when the pause happened so we can calculate elapsed time later
      pauseTimestampRef.current = performance.now();
      return;
    }

    // Use voiceover duration if available (syncs scroll with voiceover audio)
    // Check both property names: voiceover_duration_seconds (movements) and voiceover_duration (other sections)
    // Otherwise use section duration
    const baseDuration = ('voiceover_duration_seconds' in item && item.voiceover_duration_seconds)
      ? item.voiceover_duration_seconds
      : ('voiceover_duration' in item && item.voiceover_duration)
      ? item.voiceover_duration
      : item.duration_seconds;

    // Calculate scroll speed based on duration
    // If voiceover exists, use exact sync (1.0x). Otherwise, 19% slower for readability.
    const hasVoiceover = ('voiceover_duration_seconds' in item && item.voiceover_duration_seconds) ||
                         ('voiceover_duration' in item && item.voiceover_duration);
    const slowdownMultiplier = hasVoiceover ? 1.0 : 1.190;
    const duration = baseDuration * 1000 * slowdownMultiplier;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollSpeed = scrollHeight / duration; // pixels per ms

    let startTime: number;
    let animationFrame: number;
    let lastElapsed: number = 0; // Track last elapsed time for saving on pause

    const scroll = (timestamp: number) => {
      if (!startTime) {
        // First frame: adjust startTime to account for any previously scrolled time
        // If resuming from pause, we need startTime to be in the past
        startTime = timestamp - pausedElapsedTimeRef.current;
      }

      const elapsed = timestamp - startTime;
      lastElapsed = elapsed;

      // Simple continuous scroll - pauses are created by blank lines in the narrative
      const newScrollTop = Math.min(scrollSpeed * elapsed, scrollHeight);
      container.scrollTop = newScrollTop;

      // Continue scrolling if not at bottom
      if (newScrollTop < scrollHeight) {
        animationFrame = requestAnimationFrame(scroll);
      }
    };

    // Start scrolling after 2 second delay
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(scroll);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        // Save the elapsed time when cancelling (happens on pause)
        pausedElapsedTimeRef.current = lastElapsed;
      }
    };
  }, [item, isPaused]);

  // Handle different section types
  if (item.type === 'transition') {
    const buildTransitionNarrative = () => {
      const parts: string[] = [];
      // Title: Transition from X to Y
      parts.push(`TRANSITION: ${item.from_position?.toUpperCase() || 'POSITION'} TO ${item.to_position?.toUpperCase() || 'POSITION'}\n\n`);
      // Narrative
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildTransitionNarrative());
  }

  if (item.type === 'preparation') {
    const buildPreparationNarrative = () => {
      const parts: string[] = [];
      parts.push(`PREPARATION: ${item.script_name?.toUpperCase() || 'PREPARATION SCRIPT'}\n\n`);
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildPreparationNarrative(), item.video_url);
  }

  if (item.type === 'warmup') {
    const buildWarmupNarrative = () => {
      const parts: string[] = [];
      parts.push(`WARM-UP: ${item.routine_name?.toUpperCase() || 'WARM-UP ROUTINE'}\n\n`);
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildWarmupNarrative(), item.video_url);
  }

  if (item.type === 'cooldown') {
    const buildCooldownNarrative = () => {
      const parts: string[] = [];
      parts.push(`COOL-DOWN: ${item.sequence_name?.toUpperCase() || 'COOL-DOWN SEQUENCE'}\n\n`);
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildCooldownNarrative(), item.video_url);
  }

  if (item.type === 'meditation') {
    const buildMeditationNarrative = () => {
      const parts: string[] = [];
      parts.push(`CLOSING MEDITATION: ${item.script_name?.toUpperCase() || 'MEDITATION SCRIPT'}\n\n`);
      if (item.script_text) parts.push(`${item.script_text}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildMeditationNarrative(), item.video_url);
  }

  if (item.type === 'homecare') {
    const buildHomecareNarrative = () => {
      const parts: string[] = [];
      parts.push(`HOME CARE ADVICE: ${item.advice_name?.toUpperCase() || 'HOME CARE ADVICE'}\n\n`);
      if (item.advice_text) parts.push(`${item.advice_text}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildHomecareNarrative(), item.video_url);
  }

  // Helper function to render teleprompter-style content
  function renderTeleprompter(narrative: string, video_url?: string) {
    return (
      <div className="relative h-full">
        {/* Picture-in-picture video (AWS CloudFront) - for all sections with video_url */}
        {video_url && (
          <div className="absolute top-4 right-4 z-50 w-[375px] rounded-lg overflow-hidden shadow-2xl border-2 border-cream/30">
            <video
              ref={videoRef}
              src={video_url}
              preload="auto"
              controls
              muted
              playsInline
              className="w-full h-auto"
              style={{
                opacity: videoEnded ? 0 : 1,
                transition: 'opacity 1s ease-out'
              }}
              onEnded={() => {
                console.log('🎥 DEBUG: Video ended - fading out');
                setVideoEnded(true);
              }}
              onError={(e) => {
                console.error('🎥 DEBUG: Video onError - failed to load:', video_url, e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          // Mobile: px-4 py-8 (wider, less vertical padding), Desktop: px-8 py-16 (unchanged)
          className="h-full overflow-y-auto px-4 md:px-8 py-8 md:py-16 flex items-start justify-center"
          style={{ scrollBehavior: 'auto' }}
        >
          <div className="max-w-4xl w-full">
            {/* Mobile: space-y-2 (very tight), Desktop: space-y-8 */}
            <div className="text-center space-y-2 md:space-y-8">
              {narrative.split('\n').map((line, index) => {
                // Skip pause marker lines (don't display them)
                if (line.match(/\[Pause:\s*\d+s\]/i)) {
                  return null;
                }

                if (index === 0 || line.includes(':')) {
                  return (
                    // Mobile: mb-2, Desktop: mb-8
                    <h1 key={index} className="text-5xl font-bold text-cream mb-2 md:mb-8 tracking-wide">
                      {line}
                    </h1>
                  );
                }
                if (line.trim() === '') {
                  // Mobile: h-2, Desktop: h-8
                  return <div key={index} className="h-2 md:h-8" />;
                }
                if (line.startsWith('•')) {
                  return (
                    // Mobile: leading-snug px-2 (tighter, wider), Desktop: leading-loose px-8
                    <p key={index} className="text-3xl text-cream/90 leading-snug md:leading-loose font-light px-2 md:px-8 text-left">
                      {line}
                    </p>
                  );
                }
                return (
                  // Mobile: leading-snug px-2 (tighter, wider), Desktop: leading-loose px-8
                  <p key={index} className="text-4xl text-cream/90 leading-snug md:leading-loose font-light px-2 md:px-8">
                    {line}
                  </p>
                );
              })}
              <div className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build continuous narrative from all fields - SIMPLIFIED to title + narrative only
  const buildNarrative = () => {
    const parts: string[] = [];

    // Title
    parts.push(`${item.name.toUpperCase()}\n\n`);

    // Narrative only
    if (item.narrative) {
      parts.push(`${item.narrative}\n\n`);
    }

    return parts.join('');
  };

  const narrative = buildNarrative();

  // Movement display - True teleprompter with auto-scrolling narrative

  // DEBUG: Check conditional rendering
  console.log('🎥 DEBUG: About to check if video_url exists...');
  console.log('🎥 DEBUG: item.video_url value:', item.video_url);
  console.log('🎥 DEBUG: item.video_url type:', typeof item.video_url);
  console.log('🎥 DEBUG: Is video_url truthy?:', !!item.video_url);

  return (
    <div className="relative h-full">
      {/* Picture-in-picture video (AWS CloudFront) - only for movements with video_url */}
      {item.video_url && (
        <div className="absolute top-4 right-4 z-50 w-[375px] rounded-lg overflow-hidden shadow-2xl border-2 border-cream/30">
          <video
            ref={(videoEl) => {
              videoRef.current = videoEl;
              if (videoEl) {
                console.log('🎥 DEBUG: Video element created!');
                console.log('🎥 DEBUG: Video src attribute:', videoEl.src);
                console.log('🎥 DEBUG: Video currentSrc:', videoEl.currentSrc);
              }
            }}
            src={item.video_url}
            preload="auto"
            controls
            muted
            playsInline
            className="w-full h-auto"
            style={{
              opacity: videoEnded ? 0 : 1,
              transition: 'opacity 1s ease-out'
            }}
            onLoadStart={() => {
              console.log('🎥 DEBUG: Video onLoadStart - browser is attempting to load');
            }}
            onLoadedMetadata={(e) => {
              // WORKAROUND: AWS CloudFront movement videos have 7-second problematic intro
              // Skip ahead to 7 seconds to compensate for video file issue
              // This is ONLY for movements - prep/warmup videos don't have this issue
              console.log('🎥 DEBUG: Video onLoadedMetadata - skipping first 7 seconds (AWS CloudFront workaround)');
              e.currentTarget.currentTime = 7;
            }}
            onLoadedData={() => {
              console.log('🎥 DEBUG: Video onLoadedData - video loaded successfully!');
            }}
            onEnded={() => {
              console.log('🎥 DEBUG: Video ended - fading out');
              setVideoEnded(true);
            }}
            onError={(e) => {
              console.error('🎥 DEBUG: Video onError - failed to load:', item.video_url, e);
              console.error('🎥 DEBUG: Error target:', e.currentTarget);
              console.error('🎥 DEBUG: Error details:', e.nativeEvent);
              // Hide video element on error
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Video coming soon badge - visible on all devices, non-obstructive */}
      {!item.video_url && item.type === 'movement' && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50 bg-burgundy/80 text-cream px-3 py-1.5 rounded-full text-xs md:text-sm font-medium shadow-lg backdrop-blur-sm">
          🎥 Video coming soon
        </div>
      )}

      <div
        ref={scrollContainerRef}
        // Mobile: px-4 py-8 (wider, less vertical padding), Desktop: px-8 py-16 (unchanged)
        className="h-full overflow-y-auto px-4 md:px-8 py-8 md:py-16 flex items-start justify-center"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="max-w-4xl w-full">
          {/* Mobile: space-y-2 (very tight), Desktop: space-y-8 */}
          <div className="text-center space-y-2 md:space-y-8">
          {narrative.split('\n').map((line, index) => {
            // Skip pause marker lines (don't display them)
            if (line.match(/\[Pause:\s*\d+s\]/i)) {
              return null;
            }

            // Title styling
            if (index === 0) {
              return (
                // Mobile: mb-3, Desktop: mb-12
                <h1 key={index} className="text-6xl font-bold text-cream mb-3 md:mb-12 tracking-wide">
                  {line}
                </h1>
              );
            }

            // Empty lines create spacing
            if (line.trim() === '') {
              // Mobile: h-2, Desktop: h-8
              return <div key={index} className="h-2 md:h-8" />;
            }

            // Regular narrative text
            return (
              // Mobile: leading-snug px-2 (tighter, wider), Desktop: leading-loose px-8
              <p key={index} className="text-4xl text-cream/90 leading-snug md:leading-loose font-light px-2 md:px-8">
                {line}
              </p>
            );
          })}

          {/* Extra space at bottom for scrolling */}
          <div className="h-96" />
        </div>
      </div>
    </div>
    </div>
  );
}
