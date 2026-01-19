/**
 * MovementDisplay Component
 * Teleprompter-style auto-scrolling narrative display
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { PlaybackItem } from './ClassPlayback';

interface MovementDisplayProps {
  item: PlaybackItem;
  isPaused?: boolean; // Pause narrative scroll when H&S modal is shown
}

// FIX: Custom comparison function for React.memo
// Compare item.id instead of object reference to prevent infinite re-render loop
// Parent creates new item objects every render, so shallow comparison fails
function arePropsEqual(prevProps: MovementDisplayProps, nextProps: MovementDisplayProps): boolean {
  // Compare item ID instead of object reference
  const prevId = 'id' in prevProps.item ? prevProps.item.id : null;
  const nextId = 'id' in nextProps.item ? nextProps.item.id : null;

  // If IDs match and isPaused hasn't changed, props are equal
  const idsEqual = prevId === nextId;
  const pausedEqual = prevProps.isPaused === nextProps.isPaused;

  // Removed verbose diagnostic logging - fix verified working

  return idsEqual && pausedEqual;
}

// FIX: Use React.memo with custom comparison to prevent re-renders when item ID hasn't changed
// This stops the infinite re-render loop caused by parent creating new item objects
export const MovementDisplay = memo(function MovementDisplay({ item, isPaused = false }: MovementDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoEnded, setVideoEnded] = useState(false); // Track when video finishes
  const [videoLoading, setVideoLoading] = useState(false); // Track 6-second loading delay
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen state

  // Persist scroll state across pause/resume cycles
  const pausedElapsedTimeRef = useRef<number>(0); // Time already scrolled before pause
  const pauseTimestampRef = useRef<number>(0); // When the pause happened

  // FIX: Mobile Safari autoplay unlock state
  // Store ref to know if we've successfully unlocked video playback via user gesture
  const videoUnlockedRef = useRef<boolean>(false);

  // Track previous video URL to detect changes
  const previousVideoUrlRef = useRef<string | undefined>();

  // FIX: Track fade-out timeout to cancel it when section changes (race condition fix)
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // FIX: Detect if we're on mobile Safari (iOS)
  const isMobileSafari = useCallback(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isWebkit = /WebKit/.test(ua);
    return isIOS && isWebkit;
  }, []);

  // FIX: Stable callback ref to prevent infinite re-render loop
  const videoRefCallback = useCallback((videoEl: HTMLVideoElement | null) => {
    videoRef.current = videoEl;
  }, []);

  /**
   * Handle video end with fullscreen exit support
   *
   * FIX: On mobile, when video ends in fullscreen mode, exit fullscreen FIRST
   * then apply fade-out. CSS opacity doesn't work on fullscreen elements.
   */
  const handleVideoEnded = useCallback(async () => {
    console.log('🎥 DEBUG: Video ended - checking fullscreen state');

    // If in fullscreen, exit it first (async operation)
    if (isFullscreen) {
      console.log('🎥 DEBUG: Video ended in fullscreen - exiting fullscreen first');
      try {
        // Exit fullscreen (with browser compatibility)
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        console.log('🎥 DEBUG: Exited fullscreen successfully');

        // Wait 500ms for fullscreen exit animation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('🎥 DEBUG: Failed to exit fullscreen:', err);
        // Continue with fade-out anyway
      }
    }

    // Now apply fade-out (whether we exited fullscreen or not)
    console.log('🎥 DEBUG: Pausing 3s before fade-out');

    // FIX: Store timeout ID so we can cancel it if section changes before it fires
    fadeOutTimeoutRef.current = setTimeout(() => {
      console.log('🎥 DEBUG: Starting fade-out after 3s pause');
      setVideoEnded(true);
      fadeOutTimeoutRef.current = null;
    }, 3000);
  }, [isFullscreen]);


  /**
   * Track fullscreen state for video fade-out handling
   *
   * FIX: When video ends in fullscreen mode on mobile, we need to exit fullscreen
   * BEFORE applying opacity fade-out (CSS doesn't apply to fullscreen elements)
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      // Check if ANY element is in fullscreen (browser compatibility)
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);
      console.log('🎥 DEBUG: Fullscreen state changed:', isCurrentlyFullscreen);
    };

    // Listen for fullscreen changes (all browser prefixes)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  /**
   * UNIFIED: Load video URL + Sync playback with class pause state
   *
   * FIX: Race condition - Load video URL FIRST, then handle playback
   * This prevents trying to play the wrong video when transitioning between sections
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // STEP 1: Extract current video URL based on item type
    let currentVideoUrl: string | undefined;

    if (item.type === 'movement' && 'video_url' in item) {
      currentVideoUrl = item.video_url;
    } else if ((item.type === 'preparation' ||
                item.type === 'warmup' ||
                item.type === 'cooldown' ||
                item.type === 'meditation' ||
                item.type === 'homecare') &&
               'video_url' in item) {
      currentVideoUrl = item.video_url;
    }

    // STEP 2: If URL changed, load the new video FIRST (before playback logic)
    if (previousVideoUrlRef.current !== currentVideoUrl) {
      console.log('🎥 DEBUG: Video URL changed!', {
        from: previousVideoUrlRef.current,
        to: currentVideoUrl
      });

      if (currentVideoUrl) {
        // ALWAYS set src when URL changes (don't compare - can have trailing slashes, protocols, etc.)
        video.src = currentVideoUrl;
        console.log('🎥 DEBUG: Set video.src to:', currentVideoUrl);

        // Call load() to make browser fetch the new video
        video.load();
        console.log('🎥 DEBUG: Called video.load() to fetch new video');

        // Reset states for new video (clears fade-out from previous section)
        setVideoEnded(false);
        setVideoLoading(false);
      }

      // Update the ref for next comparison
      previousVideoUrlRef.current = currentVideoUrl;
    }

    // STEP 3: Now handle playback logic (pause/play)
    // Determine delay based on section type
    const isMovement = item.type === 'movement';
    const videoStartDelay = (isMovement && !isMobileSafari()) ? 4000 : 0;

    const handleCanPlay = () => {
      if (!isPaused) {
        // Reset to 0:00 before playing
        video.currentTime = 0;
        console.log('🎥 DEBUG: Reset video to 0:00 before playing');

        if (videoStartDelay > 0) {
          console.log(`🎥 DEBUG: Video ready - delaying start by ${videoStartDelay/1000}s (movement sync)`);
          if (!videoLoading) {
            setVideoLoading(true);
          }

          const playWithDelay = async () => {
            await new Promise(resolve => setTimeout(resolve, videoStartDelay));
            console.log('🎥 DEBUG: Starting video after delay');
            setVideoLoading(false);

            try {
              await video.play();
              console.log('🎥 DEBUG: Video autoplay SUCCESS');
              videoUnlockedRef.current = true;
            } catch (err: any) {
              console.error('🎥 DIAGNOSTIC: Video autoplay failed!', err);
              setVideoLoading(false);
              if (err.name === 'NotAllowedError') {
                console.log('🎥 FIX: Mobile autoplay blocked - user must click play button');
              }
            }
          };

          playWithDelay();
        } else {
          console.log('🎥 DEBUG: Video ready to play - starting immediately');
          video.play().catch(err => {
            console.error('🎥 DEBUG: Video autoplay failed:', err);
          });
        }
      }
    };

    if (isPaused) {
      // Pause video when class is paused
      video.pause();
      console.log('🎥 DEBUG: Video paused (class paused)');
    } else {
      // Play video after delay (if applicable)
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA or better
        video.currentTime = 0;
        console.log('🎥 DEBUG: Reset video to 0:00 before playing (already buffered)');

        if (videoStartDelay > 0) {
          console.log(`🎥 DEBUG: Video already buffered - delaying start by ${videoStartDelay/1000}s (movement sync)`);
          if (!videoLoading) {
            setVideoLoading(true);
          }
          setTimeout(() => {
            console.log('🎥 DEBUG: Starting video after delay');
            setVideoLoading(false);
            video.play().catch(err => {
              console.error('🎥 DEBUG: Video autoplay failed:', err);
              setVideoLoading(false);
            });
          }, videoStartDelay);
        } else {
          console.log('🎥 DEBUG: Video already buffered - playing immediately');
          video.play().catch(err => {
            console.error('🎥 DEBUG: Video autoplay failed:', err);
          });
        }
      } else {
        // Wait for canplay event
        console.log('🎥 DEBUG: Waiting for video to buffer...');
        video.addEventListener('canplay', handleCanPlay, { once: true });
      }
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [item, isPaused]); // Depend on both item and isPaused

  // Reset scroll to top ONLY when section changes (not on pause/resume)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = 0;

    // Reset pause state refs when new section starts
    pausedElapsedTimeRef.current = 0;
    pauseTimestampRef.current = 0;

    // FIX: Cancel any pending fade-out from previous section (race condition fix)
    if (fadeOutTimeoutRef.current) {
      console.log('🎥 DEBUG: Cancelling pending fade-out from previous section');
      clearTimeout(fadeOutTimeoutRef.current);
      fadeOutTimeoutRef.current = null;
    }

    // Reset video ended state when section changes
    setVideoEnded(false);

    // Reset video loading state when section changes (fixes auto-play on new movements)
    setVideoLoading(false);

    // NOTE: Video reset handled in playback useEffect below (lines 48, 78)
    // Don't call video.load() here - causes infinite loop!
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
      <div className="flex flex-col lg:relative h-full">
        {/* Picture-in-picture video (AWS CloudFront) - for all sections with video_url */}
        {/* Mobile portrait + landscape: flex item (stacks vertically) */}
        {/* Desktop (lg): absolute positioned (picture-in-picture) */}
        {/* FIX: Use lg: breakpoint (1024px) instead of md: (768px) to avoid landscape mobile issues */}
        {video_url && (
          <div className="flex-shrink-0 lg:absolute lg:top-4 lg:right-4 lg:z-50 w-full lg:w-[375px] mb-4 lg:mb-0 rounded-lg overflow-hidden shadow-2xl border-2 border-cream/30">
            <video
              ref={videoRefCallback}
              src={video_url}
              preload="auto"
              controls
              muted
              playsInline
              webkit-playsinline="true"
              className="w-full h-auto"
              style={{
                opacity: videoEnded ? 0 : 1,
                transition: 'opacity 1s ease-out'
              }}
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error('🎥 DEBUG: Video onError - failed to load:', video_url, e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          // Mobile: flex-1 (takes remaining space), Desktop (lg): h-full (absolute sibling to video)
          className="flex-1 lg:h-full overflow-y-auto px-4 lg:px-8 py-8 lg:py-16 flex items-start justify-center"
          style={{ scrollBehavior: 'auto' }}
        >
          <div className="max-w-4xl w-full">
            {/* Mobile: space-y-2 (very tight), Desktop (lg): space-y-8 */}
            <div className="text-center space-y-2 lg:space-y-8">
              {narrative.split('\n').map((line, index) => {
                // Skip pause marker lines (don't display them)
                if (line.match(/\[Pause:\s*\d+s\]/i)) {
                  return null;
                }

                if (index === 0 || line.includes(':')) {
                  return (
                    // Mobile: mb-2, Desktop (lg): mb-8
                    <h1 key={index} className="text-5xl font-bold text-cream mb-2 lg:mb-8 tracking-wide">
                      {line}
                    </h1>
                  );
                }
                if (line.trim() === '') {
                  // Mobile: h-2, Desktop (lg): h-8
                  return <div key={index} className="h-2 lg:h-8" />;
                }
                if (line.startsWith('•')) {
                  return (
                    // Mobile: leading-snug px-2 (tighter, wider), Desktop (lg): leading-loose px-8
                    <p key={index} className="text-3xl text-cream/90 leading-snug lg:leading-loose font-light px-2 lg:px-8 text-left">
                      {line}
                    </p>
                  );
                }
                return (
                  // Mobile: leading-snug px-2 (tighter, wider), Desktop (lg): leading-loose px-8
                  <p key={index} className="text-4xl text-cream/90 leading-snug lg:leading-loose font-light px-2 lg:px-8">
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
    if ('name' in item && item.name) {
      parts.push(`${item.name.toUpperCase()}\n\n`);
    }

    // Narrative only
    if ('narrative' in item && item.narrative) {
      parts.push(`${item.narrative}\n\n`);
    }

    return parts.join('');
  };

  const narrative = buildNarrative();

  // Movement display - True teleprompter with auto-scrolling narrative

  // DEBUG: Check conditional rendering
  console.log('🎥 DEBUG: About to check if video_url exists...');
  console.log('🎥 DEBUG: item.video_url value:', ('video_url' in item ? item.video_url : 'N/A'));
  console.log('🎥 DEBUG: item.video_url type:', ('video_url' in item ? typeof item.video_url : 'N/A'));
  console.log('🎥 DEBUG: Is video_url truthy?:', ('video_url' in item && !!item.video_url));

  return (
    <div className="flex flex-col lg:relative h-full">
      {/* Picture-in-picture video (AWS CloudFront) - only for movements with video_url */}
      {/* Mobile portrait + landscape: flex item (stacks vertically) */}
      {/* Desktop (lg): absolute positioned (picture-in-picture) */}
      {/* FIX: Use lg: breakpoint (1024px) instead of md: (768px) to avoid landscape mobile issues */}
      {'video_url' in item && item.video_url && (
        <div className="flex-shrink-0 lg:absolute lg:top-4 lg:right-4 lg:z-50 w-full lg:w-[375px] mb-4 lg:mb-0 rounded-lg overflow-hidden shadow-2xl border-2 border-cream/30 relative">
          {/* Loading overlay during 4-second sync delay */}
          {videoLoading && (
            <div className="absolute inset-0 bg-burgundy flex items-center justify-center z-10">
              <div className="text-center px-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-cream/30 border-t-cream mx-auto mb-2"></div>
                <p className="text-cream text-base font-light italic tracking-wide">Video loading...</p>
              </div>
            </div>
          )}
          <video
            ref={videoRefCallback}
            src={item.video_url}
            preload="auto"
            controls
            muted
            playsInline
            webkit-playsinline="true"
            className="w-full h-auto"
            style={{
              opacity: videoEnded ? 0 : 1,
              transition: 'opacity 1s ease-out'
            }}
            onEnded={handleVideoEnded}
            onError={(e) => {
              console.error('🎥 DEBUG: Video onError - failed to load:', ('video_url' in item ? item.video_url : 'N/A'), e);
              console.error('🎥 DEBUG: Error target:', e.currentTarget);
              console.error('🎥 DEBUG: Error details:', e.nativeEvent);
              // Hide video element on error
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Video coming soon badge - visible on all devices, non-obstructive */}
      {!('video_url' in item && item.video_url) && item.type === 'movement' && (
        <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-50 bg-burgundy/80 text-cream px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium shadow-lg backdrop-blur-sm">
          🎥 Video coming soon
        </div>
      )}

      <div
        ref={scrollContainerRef}
        // Mobile: flex-1 (takes remaining space), Desktop (lg): h-full (absolute sibling to video)
        className="flex-1 lg:h-full overflow-y-auto px-4 lg:px-8 py-8 lg:py-16 flex items-start justify-center"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="max-w-4xl w-full">
          {/* Mobile: space-y-2 (very tight), Desktop (lg): space-y-8 */}
          <div className="text-center space-y-2 lg:space-y-8">
          {narrative.split('\n').map((line, index) => {
            // Skip pause marker lines (don't display them)
            if (line.match(/\[Pause:\s*\d+s\]/i)) {
              return null;
            }

            // Title styling
            if (index === 0) {
              return (
                // Mobile: mb-3, Desktop (lg): mb-12
                <h1 key={index} className="text-6xl font-bold text-cream mb-3 lg:mb-12 tracking-wide">
                  {line}
                </h1>
              );
            }

            // Empty lines create spacing
            if (line.trim() === '') {
              // Mobile: h-2, Desktop (lg): h-8
              return <div key={index} className="h-2 lg:h-8" />;
            }

            // Regular narrative text
            return (
              // Mobile: leading-snug px-2 (tighter, wider), Desktop (lg): leading-loose px-8
              <p key={index} className="text-4xl text-cream/90 leading-snug lg:leading-loose font-light px-2 lg:px-8">
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
}, arePropsEqual); // Use custom comparison function
