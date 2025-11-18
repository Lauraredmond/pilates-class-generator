/**
 * MovementDisplay Component
 * Displays current movement or transition with all details
 */

import { PlaybackItem } from './ClassPlayback';

interface MovementDisplayProps {
  item: PlaybackItem;
}

export function MovementDisplay({ item }: MovementDisplayProps) {
  if (item.type === 'transition') {
    return (
      <div className="flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full bg-burgundy-dark border border-cream/30 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-cream/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <h2 className="text-2xl font-bold text-cream">Transition</h2>
          </div>

          <p className="text-lg italic text-cream/80 leading-relaxed">
            {item.narrative || `Moving from ${item.from_position} to ${item.to_position}`}
          </p>

          {item.from_position && item.to_position && (
            <div className="mt-6 flex items-center gap-4 text-sm text-cream/60">
              <span className="px-3 py-1 bg-burgundy rounded-full">{item.from_position}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="px-3 py-1 bg-burgundy rounded-full">{item.to_position}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Movement display
  return (
    <div className="px-6 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Movement header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cream mb-3">{item.name}</h1>

          {/* Metadata badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {item.difficulty_level && (
              <span className="px-3 py-1 bg-burgundy-dark border border-cream/30 rounded-full text-sm text-cream">
                {item.difficulty_level}
              </span>
            )}
            {item.primary_muscles && item.primary_muscles.length > 0 && (
              <>
                {item.primary_muscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="px-3 py-1 bg-burgundy-dark border border-cream/30 rounded-full text-sm text-cream/80"
                  >
                    {muscle}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        {item.setup_instructions && (
          <div className="mb-6 bg-burgundy-dark border border-cream/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Setup
            </h3>
            <p className="text-cream/80 leading-relaxed">{item.setup_instructions}</p>
          </div>
        )}

        {/* Teaching Cues */}
        {item.teaching_cues && item.teaching_cues.length > 0 && (
          <div className="mb-6 bg-burgundy-dark border border-cream/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Teaching Cues
            </h3>
            <ul className="space-y-2">
              {item.teaching_cues.map((cue, index) => (
                <li key={index} className="flex items-start gap-2 text-cream/80">
                  <span className="text-cream/40 mt-1">•</span>
                  <span className="leading-relaxed">{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Breathing Pattern */}
        {item.breathing_pattern && (
          <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              Breathing
            </h3>
            <p className="text-cream/80 leading-relaxed">{item.breathing_pattern}</p>
          </div>
        )}
      </div>
    </div>
  );
}
