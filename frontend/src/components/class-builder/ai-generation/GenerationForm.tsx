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
  movementMusicStyle: string;
  coolDownMusicStyle: string;
}

interface GenerationFormProps {
  onSubmit: (data: GenerationFormData) => void;
  isLoading?: boolean;
  onPlayClass?: () => void;
  hasGeneratedClass?: boolean;
}

const DURATION_OPTIONS = [30, 45, 60, 75, 90];
const DIFFICULTY_OPTIONS: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed'> = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Mixed',
];
// const _FOCUS_AREAS = ['Core', 'Legs', 'Arms', 'Back', 'Flexibility', 'Balance'];
// const _MEDITATION_THEMES = [
//   'Mindfulness',
//   'Body Scan',
//   'Breath Focus',
//   'Gratitude',
//   'Relaxation',
//   'Visualization',
// ];

// Movement music styles - low tempo, meditative, background
const MOVEMENT_MUSIC_STYLES = [
  'Ambient',
  'Meditation',
  'Chillout',
  'Downtempo',
  'Lofi Instrumental',
  'Acoustic Instrumental',
  'Piano Ambient',
  'Nature Sounds',
  'Ethereal Soundscapes',
];

// Cool down music styles - classical periods + relaxing genres
const COOLDOWN_MUSIC_STYLES = [
  'Baroque',
  'Classical',
  'Romantic',
  'Contemporary Classical',
  'Ambient Classical',
  'New Age',
  'Spa & Wellness',
  'Guided Meditation',
  'Binaural Beats',
];

export function GenerationForm({ onSubmit, isLoading = false, onPlayClass, hasGeneratedClass = false }: GenerationFormProps) {
  const [formData, setFormData] = useState<GenerationFormData>({
    duration: 60,
    difficulty: 'Intermediate',
    focusAreas: [],
    musicBpmMin: 80,
    musicBpmMax: 120,
    energyLevel: 0.5,
    meditationTheme: 'Mindfulness',
    enableMcpResearch: false,
    movementMusicStyle: 'Ambient',
    coolDownMusicStyle: 'Classical',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // const _toggleFocusArea = (area: string) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     focusAreas: prev.focusAreas.includes(area)
  //       ? prev.focusAreas.filter((a) => a !== area)
  //       : [...prev.focusAreas, area],
  //   }));
  // };

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

      {/* Difficulty Level Dropdown */}
      <div>
        <label className="block text-sm font-semibold text-cream mb-3">
          Difficulty Level
        </label>
        <select
          value={formData.difficulty}
          onChange={(e) =>
            setFormData({ ...formData, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed' })
          }
          className="w-full h-12 px-4 bg-burgundy-dark border border-cream/30 rounded-lg text-cream focus:border-cream/60 focus:outline-none transition-smooth"
        >
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
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

      {/* Music Selection */}
      <div className="border-t border-cream/20 pt-6">
        <h3 className="text-sm font-semibold text-cream mb-4">Select Music</h3>

        {/* Movement Music */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-cream mb-2">
            Movement Music
          </label>
          <select
            value={formData.movementMusicStyle}
            onChange={(e) =>
              setFormData({ ...formData, movementMusicStyle: e.target.value })
            }
            className="w-full h-12 px-4 bg-burgundy-dark border border-cream/30 rounded-lg text-cream focus:border-cream/60 focus:outline-none transition-smooth"
          >
            {MOVEMENT_MUSIC_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
          <p className="text-xs text-cream/60 mt-1">
            Low tempo, meditative background music for movement practice
          </p>
        </div>

        {/* Cool Down Music */}
        <div>
          <label className="block text-sm font-semibold text-cream mb-2">
            Cool Down Music
          </label>
          <select
            value={formData.coolDownMusicStyle}
            onChange={(e) =>
              setFormData({ ...formData, coolDownMusicStyle: e.target.value })
            }
            className="w-full h-12 px-4 bg-burgundy-dark border border-cream/30 rounded-lg text-cream focus:border-cream/60 focus:outline-none transition-smooth"
          >
            {COOLDOWN_MUSIC_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
          <p className="text-xs text-cream/60 mt-1">
            Calming music to support relaxation during cool down
          </p>
        </div>
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Generate Complete Class</span>
        </Button>
      </div>

      {/* Start Class Section */}
      <div className="border-t border-cream/20 pt-6">
        <div className="bg-burgundy-dark border border-cream/30 rounded-lg p-6 text-center">
          <h3 className="text-sm font-semibold text-cream mb-2">Start Class</h3>
          <p className="text-xs text-cream/60 mb-4">
            Begin your timed, narrated class with music
          </p>
          <button
            type="button"
            onClick={onPlayClass}
            disabled={!hasGeneratedClass}
            className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 mx-auto transition-smooth ${
              hasGeneratedClass
                ? 'bg-cream text-burgundy hover:bg-cream/90'
                : 'bg-burgundy border border-cream/40 text-cream/40 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play Class</span>
          </button>
          {!hasGeneratedClass && (
            <p className="text-xs text-cream/40 mt-2">
              Available after generating a class
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
