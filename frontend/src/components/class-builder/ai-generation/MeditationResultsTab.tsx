/**
 * MeditationResultsTab Component
 * Displays generated meditation script with theme and breathing pattern
 */

import { MeditationResult } from './GeneratedResults';

interface MeditationResultsTabProps {
  data: MeditationResult;
}

export function MeditationResultsTab({ data }: MeditationResultsTabProps) {
  // Split script into paragraphs for better readability
  const paragraphs = data.script.split('\n\n').filter((p) => p.trim());

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Duration</p>
          <p className="text-2xl font-bold text-cream">{data.duration_minutes} min</p>
        </div>
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Theme</p>
          <p className="text-lg font-bold text-cream">{data.theme}</p>
        </div>
      </div>

      {/* Breathing Pattern */}
      {data.breathing_pattern && (
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-cream flex-shrink-0 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-cream mb-1">
                Breathing Pattern
              </p>
              <p className="text-sm text-cream/70">{data.breathing_pattern}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meditation Script */}
      <div>
        <h4 className="text-sm font-semibold text-cream mb-3">Meditation Script</h4>
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-6">
          <div className="prose prose-invert prose-sm max-w-none space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-cream/80 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Tips */}
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-cream mb-1">Usage Tips</p>
            <ul className="text-xs text-cream/70 space-y-1 list-disc list-inside">
              <li>Read slowly and calmly, allowing pauses between sentences</li>
              <li>Adjust your tone to match the peaceful energy of the meditation</li>
              <li>Encourage students to close their eyes and relax fully</li>
              <li>Allow silence at the end before gently bringing them back</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
