/**
 * SequenceResultsTab Component
 * Displays generated movement sequence with duration and muscles
 */

import { SequenceResult } from './GeneratedResults';

interface SequenceResultsTabProps {
  data: SequenceResult;
}

export function SequenceResultsTab({ data }: SequenceResultsTabProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-red-400';
      default:
        return 'text-cream/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Movements</p>
          <p className="text-2xl font-bold text-cream">{data.movement_count}</p>
          <p className="text-xs text-cream/40 mt-1">{data.transition_count} transitions</p>
        </div>
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
          <p className="text-xs text-cream/60 mb-1">Duration</p>
          <p className="text-2xl font-bold text-cream">
            {Math.round(data.total_duration / 60)}m
          </p>
        </div>
      </div>

      {/* Movement List */}
      <div>
        <h4 className="text-sm font-semibold text-cream mb-3">Movement Sequence</h4>
        <div className="space-y-2">
          {data.movements.map((item, index) => {
            const isTransition = item.type === 'transition';

            if (isTransition) {
              // Render transition
              return (
                <div
                  key={`transition-${index}`}
                  className="bg-burgundy/50 border border-cream/20 rounded-lg p-3 border-l-4 border-l-cream/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-cream/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <p className="text-sm italic text-cream/70">{item.narrative || `Transition: ${item.from_position} → ${item.to_position}`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cream/60">
                        {formatDuration(item.duration_seconds)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Render movement
            return (
              <div
                key={item.id || `movement-${index}`}
                className="bg-burgundy-dark border border-cream/30 rounded-lg p-4 hover:border-cream/40 transition-smooth"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-burgundy border border-cream/30 text-sm font-semibold text-cream">
                        {data.movements.filter((m, i) => i <= index && m.type !== 'transition').length}
                      </span>
                      <div>
                        <h5 className="font-semibold text-cream">{item.name}</h5>
                        {item.difficulty_level && (
                          <p className={`text-xs font-semibold ${getDifficultyColor(item.difficulty_level)}`}>
                            {item.difficulty_level}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.primary_muscles && item.primary_muscles.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-11">
                        {item.primary_muscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="px-2 py-1 bg-burgundy border border-cream/30 rounded text-xs text-cream/70"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cream">
                      {formatDuration(item.duration_seconds)}
                    </p>
                    <p className="text-xs text-cream/60">duration</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Muscle Balance Chart */}
      <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-cream mb-3">Muscle Group Balance</h4>
        <div className="space-y-2">
          {Object.entries(data.muscle_balance).map(([muscle, percentage]) => (
            <div key={muscle}>
              <div className="flex justify-between text-xs text-cream/60 mb-1">
                <span className="capitalize">{muscle}</span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-burgundy rounded-full h-2">
                <div
                  className="bg-energy-gradient h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
