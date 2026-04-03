/**
 * MovementDisplay Component
 * Teleprompter-style auto-scrolling narrative display
 */

import { useEffect, useRef } from 'react';
import { PlaybackItem } from './ClassPlayback';

interface MovementDisplayProps {
  item: PlaybackItem;
  isPaused?: boolean; // Pause narrative scroll when H&S modal is shown
}

export function MovementDisplay({ item, isPaused = false }: MovementDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // DEBUG: Check if video_url exists when rendering movements
  if (item.type === 'movement') {
    console.log('🎥 DEBUG: MovementDisplay received item:', item);
    console.log('🎥 DEBUG: MovementDisplay video_url:', (item as any).video_url);
  }

  /**
   * Auto-play video AFTER voiceover starts (iOS fix)
   *
   * IMPORTANT: Video must start AFTER voiceover to avoid stealing media session.
   * Wait 1.5 seconds to give voiceover time to claim the media session first.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPaused) return;

    // Wait for voiceover to start playing (1.5 seconds), then start video
    const timer = setTimeout(() => {
      console.log('🎥 DEBUG: Auto-playing video after voiceover start');
      video.play().catch(err => {
        console.error('🎥 DEBUG: Video autoplay failed:', err);
        // Silently fail - video will have controls for manual play
      });
    }, 1500); // 1.5 second delay - voiceover plays first

    return () => clearTimeout(timer);
  }, [item, isPaused]);

  // Auto-scroll effect - scrolls upward continuously like a real teleprompter
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Reset scroll to top when item changes
    container.scrollTop = 0;

    // Don't start scrolling if paused (e.g., H&S modal is shown)
    if (isPaused) return;

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

    const scroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

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
              controls
              muted
              loop
              playsInline
              className="w-full h-auto"
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
            controls
            muted
            loop
            playsInline
            className="w-full h-auto"
            onLoadStart={() => {
              console.log('🎥 DEBUG: Video onLoadStart - browser is attempting to load');
            }}
            onLoadedData={() => {
              console.log('🎥 DEBUG: Video onLoadedData - video loaded successfully!');
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
