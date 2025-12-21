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

const DURATION_OPTIONS = [
  { value: 12, label: '12 minutes - Quick movement practice' },
  { value: 30, label: '30 minutes - Full class' },
  { value: 45, label: '45 minutes - Full class' },
  { value: 60, label: '60 minutes - Full class' },
  { value: 75, label: '75 minutes - Full class' },
  { value: 90, label: '90 minutes - Full class' },
];
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

// All stylistic periods - Available for both movement and cool down music
const ALL_MUSIC_STYLES = [
  { value: 'BAROQUE', label: 'Baroque (Bach, Handel, Vivaldi)' },
  { value: 'CLASSICAL', label: 'Classical (Mozart, Haydn)' },
  { value: 'ROMANTIC', label: 'Romantic (Chopin, Beethoven, Brahms)' },
  { value: 'IMPRESSIONIST', label: 'Impressionist (Debussy, Ravel)' },
  { value: 'MODERN', label: 'Modern (Satie, Copland)' },
  { value: 'CONTEMPORARY', label: 'Contemporary (Ambient, Meditation)' },
  { value: 'JAZZ', label: 'Jazz (Relaxing Coffee Shop)' },
  { value: 'CELTIC_TRADITIONAL', label: 'Celtic Traditional (Irish Flute)' },
];

// Use same list for both movement and cool down (all periods suitable for Pilates)
const MOVEMENT_MUSIC_STYLES = ALL_MUSIC_STYLES;
const COOLDOWN_MUSIC_STYLES = ALL_MUSIC_STYLES;

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
    movementMusicStyle: 'IMPRESSIONIST',
    coolDownMusicStyle: 'BAROQUE',
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
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {formData.duration === 12 && (
          <p className="text-xs text-amber-400 mt-2 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>You should always warm up before and cool down after exercise, including this quick practise session, to avoid injury risk</span>
          </p>
        )}
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

      {/* MCP Research Toggle - HIDDEN (MCP not yet implemented) */}
      {/* Uncomment when MCP server is ready
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
      */}

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
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-cream/60 mt-1">
            Classical music from Internet Archive - public domain, no ads
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
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-cream/60 mt-1">
            Calming classical music for relaxation and stretching
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
