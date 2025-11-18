/**
 * MovementDisplay Component
 * Teleprompter-style auto-scrolling narrative display
 */

import { useEffect, useRef } from 'react';
import { PlaybackItem } from './ClassPlayback';

interface MovementDisplayProps {
  item: PlaybackItem;
}

export function MovementDisplay({ item }: MovementDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect - scrolls upward continuously like a real teleprompter
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Reset scroll to top when item changes
    container.scrollTop = 0;

    // Calculate scroll speed based on duration
    const duration = item.duration_seconds * 1000; // Convert to ms
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollSpeed = scrollHeight / duration; // pixels per ms

    let startTime: number;
    let animationFrame: number;

    const scroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

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
  }, [item.duration_seconds]);

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
      className="h-full overflow-y-auto px-8 py-16 flex items-start justify-center"
      style={{ scrollBehavior: 'auto' }}
    >
      <div className="max-w-4xl w-full">
        <div className="text-center space-y-8">
          {narrative.split('\n').map((line, index) => {
            // Title styling
            if (index === 0) {
              return (
                <h1 key={index} className="text-6xl font-bold text-cream mb-12 tracking-wide">
                  {line}
                </h1>
              );
            }

            // Empty lines create spacing
            if (line.trim() === '') {
              return <div key={index} className="h-8" />;
            }

            // Safety warnings in yellow
            if (line.startsWith('IMPORTANT:')) {
              return (
                <p key={index} className="text-3xl text-yellow-400 leading-loose font-light px-8">
                  {line}
                </p>
              );
            }

            // Regular narrative text
            return (
              <p key={index} className="text-4xl text-cream/90 leading-loose font-light px-8">
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
