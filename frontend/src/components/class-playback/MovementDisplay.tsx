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

  // Auto-scroll effect - scrolls upward continuously like a real teleprompter
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Reset scroll to top when item changes
    container.scrollTop = 0;

    // Don't start scrolling if paused (e.g., H&S modal is shown)
    if (isPaused) return;

    // Use voiceover duration if available (syncs scroll with voiceover audio)
    // Otherwise use section duration
    const baseDuration = ('voiceover_duration' in item && item.voiceover_duration)
      ? item.voiceover_duration
      : item.duration_seconds;

    // Calculate scroll speed based on duration (19% slower for readability - user fine-tuned)
    const duration = baseDuration * 1000 * 1.190; // Convert to ms, 19% slower (1.190x duration)
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollSpeed = scrollHeight / duration; // pixels per ms

    let startTime: number;
    let animationFrame: number;
    let isPausedForMarker = false;
    let pauseStartTime: number | null = null;
    let pauseDuration = 0;
    let totalPausedTime = 0;

    // Parse narrative for pause markers like "[Pause: 20s]"
    const getNarrative = (): string => {
      if ('narrative' in item && item.narrative) return item.narrative;
      if ('script_text' in item && item.script_text) return item.script_text;
      if ('advice_text' in item && item.advice_text) return item.advice_text;
      return '';
    };

    const narrative = getNarrative();
    const pauseMarkers: { position: number; duration: number }[] = [];

    if (narrative) {
      const lines = narrative.split('\n');
      let currentPixelPosition = 0;
      const lineHeight = 80; // Approximate line height in pixels

      lines.forEach((line) => {
        // Match pause markers like [Pause: 20s] or [Pause: 15s]
        const pauseMatch = line.match(/\[Pause:\s*(\d+)s\]/i);
        if (pauseMatch) {
          const pauseSeconds = parseInt(pauseMatch[1], 10);
          pauseMarkers.push({
            position: currentPixelPosition,
            duration: pauseSeconds * 1000, // Convert to ms
          });
        }
        currentPixelPosition += lineHeight;
      });
    }

    const scroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime - totalPausedTime;

      // Check if we should pause at a marker
      const currentScrollPos = scrollSpeed * elapsed;
      const activePause = pauseMarkers.find(
        marker => currentScrollPos >= marker.position && currentScrollPos < marker.position + 50
      );

      if (activePause && !isPausedForMarker) {
        // Start pause
        isPausedForMarker = true;
        pauseStartTime = timestamp;
        pauseDuration = activePause.duration;
      }

      if (isPausedForMarker && pauseStartTime) {
        const pauseElapsed = timestamp - pauseStartTime;
        if (pauseElapsed < pauseDuration) {
          // Still paused - don't advance scroll
          container.scrollTop = currentScrollPos;
          animationFrame = requestAnimationFrame(scroll);
          return;
        } else {
          // Pause complete - resume scrolling
          isPausedForMarker = false;
          totalPausedTime += pauseDuration;
          pauseStartTime = null;
        }
      }

      // Calculate new scroll position
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
    return (
      <div className="h-full flex items-center justify-center px-8">
        <div className="max-w-4xl w-full text-center">
          <p className="text-3xl text-cream/90 leading-relaxed font-light italic">
            {item.narrative || `Moving from ${item.from_position} to ${item.to_position}`}
          </p>
        </div>
      </div>
    );
  }

  if (item.type === 'preparation') {
    const buildPreparationNarrative = () => {
      const parts: string[] = [];
      parts.push(`PREPARATION: ${item.script_name?.toUpperCase() || 'PREPARATION SCRIPT'}\n\n`);
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      if (item.breathing_focus) parts.push(`Breathing Focus: ${item.breathing_focus}\n\n`);
      if (item.breathing_pattern) parts.push(`Pattern: ${item.breathing_pattern}\n\n`);
      if (item.key_principles && item.key_principles.length > 0) {
        parts.push(`Key Principles:\n`);
        item.key_principles.forEach(principle => {
          parts.push(`• ${principle}\n`);
        });
      }
      return parts.join('');
    };
    return renderTeleprompter(buildPreparationNarrative());
  }

  if (item.type === 'warmup') {
    const buildWarmupNarrative = () => {
      const parts: string[] = [];
      parts.push(`WARM-UP: ${item.routine_name?.toUpperCase() || 'WARM-UP ROUTINE'}\n\n`);
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      parts.push(`Focus Area: ${item.focus_area}\n\n`);
      if (item.movements && Array.isArray(item.movements)) {
        parts.push(`Movements:\n`);
        item.movements.forEach((movement: any) => {
          parts.push(`• ${movement.name || movement}\n`);
        });
      }
      return parts.join('');
    };
    return renderTeleprompter(buildWarmupNarrative());
  }

  if (item.type === 'cooldown') {
    const buildCooldownNarrative = () => {
      const parts: string[] = [];
      parts.push(`COOL-DOWN: ${item.sequence_name?.toUpperCase() || 'COOL-DOWN SEQUENCE'}\n\n`);
      if (item.narrative) parts.push(`${item.narrative}\n\n`);
      parts.push(`Recovery Focus: ${item.recovery_focus}\n\n`);
      if (item.target_muscles && item.target_muscles.length > 0) {
        parts.push(`Target Muscles: ${item.target_muscles.join(', ')}\n\n`);
      }
      if (item.stretches && Array.isArray(item.stretches)) {
        parts.push(`Stretches:\n`);
        item.stretches.forEach((stretch: any) => {
          parts.push(`• ${stretch.name || stretch}\n`);
        });
      }
      return parts.join('');
    };
    return renderTeleprompter(buildCooldownNarrative());
  }

  if (item.type === 'meditation') {
    const buildMeditationNarrative = () => {
      const parts: string[] = [];
      parts.push(`CLOSING MEDITATION: ${item.script_name?.toUpperCase() || 'MEDITATION SCRIPT'}\n\n`);
      parts.push(`Theme: ${item.meditation_theme}\n\n`);
      if (item.breathing_guidance) parts.push(`${item.breathing_guidance}\n\n`);
      if (item.script_text) parts.push(`${item.script_text}\n\n`);
      return parts.join('');
    };
    return renderTeleprompter(buildMeditationNarrative());
  }

  if (item.type === 'homecare') {
    const buildHomecareNarrative = () => {
      const parts: string[] = [];
      parts.push(`HOME CARE ADVICE: ${item.advice_name?.toUpperCase() || 'HOME CARE ADVICE'}\n\n`);
      parts.push(`Focus: ${item.focus_area}\n\n`);
      if (item.advice_text) parts.push(`${item.advice_text}\n\n`);
      if (item.actionable_tips && item.actionable_tips.length > 0) {
        parts.push(`Actionable Tips:\n`);
        item.actionable_tips.forEach(tip => {
          parts.push(`• ${tip}\n`);
        });
      }
      return parts.join('');
    };
    return renderTeleprompter(buildHomecareNarrative());
  }

  // Helper function to render teleprompter-style content
  function renderTeleprompter(narrative: string) {
    return (
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
    );
  }

  // LLM-style variation helpers - varies phrasing but keeps meaning
  const varySetupPhrase = (position: string): string => {
    const variations = [
      `Begin in ${position} position.`,
      `Start by lying ${position.toLowerCase()}.`,
      `Position yourself ${position.toLowerCase()}.`,
      `Find your ${position.toLowerCase()} starting position.`,
      `Settle into ${position.toLowerCase()} position.`,
    ];
    // Use movement name hash to get consistent but varied phrasing
    const index = item.name.length % variations.length;
    return variations[index];
  };

  const buildMuscleNarrative = (): string => {
    if (!item.muscle_groups || item.muscle_groups.length === 0) {
      return '';
    }

    // Separate primary and secondary muscles
    const primary = item.muscle_groups
      .filter(m => m.is_primary)
      .map(m => m.name.toLowerCase());
    const secondary = item.muscle_groups
      .filter(m => !m.is_primary)
      .map(m => m.name.toLowerCase());

    let narrative = '';

    // Build primary muscle narrative
    if (primary.length > 0) {
      const variations = [
        `This movement primarily targets your ${primary.join(', ')}.`,
        `You'll be working your ${primary.join(' and ')}.`,
        `Focus on engaging your ${primary.join(', ')}.`,
        `Feel this deeply in your ${primary.join(' and ')}.`,
        `Activate and strengthen your ${primary.join(', ')}.`,
      ];
      const index = primary.join('').length % variations.length;
      narrative += variations[index];
    }

    // Add secondary muscles if present
    if (secondary.length > 0) {
      narrative += ` You'll also engage your ${secondary.join(', ')} as supporting muscles.`;
    }

    return narrative;
  };

  const varyCueIntro = (index: number): string => {
    const intros = [
      '',
      'Remember, ',
      'Keep in mind, ',
      'Focus on ',
      'Notice ',
      'Pay attention to ',
    ];
    return intros[index % intros.length];
  };

  // Build continuous narrative from all fields
  const buildNarrative = () => {
    const parts: string[] = [];

    // Title
    parts.push(`${item.name.toUpperCase()}\n\n`);

    // Narrative intro
    if (item.narrative) {
      parts.push(`${item.narrative}\n\n`);
    }

    // Setup instructions with variation
    if (item.setup_position) {
      parts.push(`${varySetupPhrase(item.setup_position)}\n\n`);
    }

    // Muscle groups narrative - descriptive and based on database
    const muscleNarrative = buildMuscleNarrative();
    if (muscleNarrative) {
      parts.push(`${muscleNarrative}\n\n`);
    }

    // Teaching cues as flowing narrative with varied intros
    if (item.teaching_cues && item.teaching_cues.length > 0) {
      item.teaching_cues.forEach((cue, index) => {
        const intro = varyCueIntro(index);
        parts.push(`${intro}${cue.cue_text.toLowerCase()}\n\n`);
      });
    }

    // Watch out points (safety warnings) - keep exact wording
    if (item.watch_out_points) {
      parts.push(`IMPORTANT: ${item.watch_out_points}\n\n`);
    }

    return parts.join('');
  };

  const narrative = buildNarrative();

  // Movement display - True teleprompter with auto-scrolling narrative
  return (
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

            // Safety warnings in yellow
            if (line.startsWith('IMPORTANT:')) {
              return (
                // Mobile: leading-snug px-2 (tighter, wider), Desktop: leading-loose px-8
                <p key={index} className="text-3xl text-yellow-400 leading-snug md:leading-loose font-light px-2 md:px-8">
                  {line}
                </p>
              );
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
  );
}
