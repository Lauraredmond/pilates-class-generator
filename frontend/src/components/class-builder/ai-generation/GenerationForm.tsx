/**
 * GenerationForm Component
 * Comprehensive input form for AI class generation
 * Includes duration, difficulty, focus areas, music, and meditation preferences
 */

import { useState } from 'react';
import { Button } from '../../ui/Button';

export interface GenerationFormData {
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  focusAreas: string[];
  musicBpmMin: number;
  musicBpmMax: number;
  energyLevel: number;
  meditationTheme: string;
  enableMcpResearch: boolean;
}

interface GenerationFormProps {
  onSubmit: (data: GenerationFormData) => void;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [30, 45, 60, 75, 90];
const DIFFICULTY_OPTIONS: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed'> = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Mixed',
];
const FOCUS_AREAS = ['Core', 'Legs', 'Arms', 'Back', 'Flexibility', 'Balance'];
const MEDITATION_THEMES = [
  'Mindfulness',
  'Body Scan',
  'Breath Focus',
  'Gratitude',
  'Relaxation',
  'Visualization',
];

export function GenerationForm({ onSubmit, isLoading = false }: GenerationFormProps) {
  const [formData, setFormData] = useState<GenerationFormData>({
    duration: 60,
    difficulty: 'Intermediate',
    focusAreas: [],
    musicBpmMin: 80,
    musicBpmMax: 120,
    energyLevel: 0.5,
    meditationTheme: 'Mindfulness',
    enableMcpResearch: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleFocusArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Duration Selector */}
      <div>
        <label className="block text-sm font-semibold text-cream mb-3">
          Class Duration
        </label>
        <select
          value={formData.duration}
          onChange={(e) =>
            setFormData({ ...formData, duration: parseInt(e.target.value) })
          }
          className="w-full h-12 px-4 bg-burgundy-dark border border-cream/30 rounded-lg text-cream focus:border-cream/60 focus:outline-none transition-smooth"
        >
          {DURATION_OPTIONS.map((duration) => (
            <option key={duration} value={duration}>
              {duration} minutes
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Radio Buttons */}
      <div>
        <label className="block text-sm font-semibold text-cream mb-3">
          Difficulty Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setFormData({ ...formData, difficulty })}
              className={`p-3 rounded-lg border transition-smooth ${
                formData.difficulty === difficulty
                  ? 'bg-burgundy border-cream/40 shadow-glow'
                  : 'bg-burgundy-dark border-cream/30 hover:border-cream/40'
              }`}
            >
              <span className="text-sm font-semibold text-cream">{difficulty}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MCP Research Toggle */}
      <div>
        <button
          type="button"
          onClick={() =>
            setFormData({ ...formData, enableMcpResearch: !formData.enableMcpResearch })
          }
          className="w-full p-4 rounded-lg border transition-smooth flex items-center justify-between bg-burgundy-dark border-cream/30 hover:border-cream/40"
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                formData.enableMcpResearch
                  ? 'bg-cream border-cream'
                  : 'border-cream/40'
              }`}
            >
              {formData.enableMcpResearch && (
                <svg
                  className="w-4 h-4 text-burgundy"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-cream">
                Enable MCP Research
              </p>
              <p className="text-xs text-cream/60 mt-1">
                Search trusted sources for enhanced movement cues and variations
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full flex items-center justify-center gap-3"
          isLoading={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <span>Generate Complete Class</span>
        </Button>
      </div>
    </form>
  );
}
