/**
 * GeneratedResults Component
 * Modal to display AI-generated class results with tabbed interface
 * Tabs: Sequence, Music, Meditation
 */

import { useState } from 'react';
import { Button } from '../../ui/Button';
import { SequenceResultsTab } from './SequenceResultsTab';
import { MusicResultsTab } from './MusicResultsTab';
import { MeditationResultsTab } from './MeditationResultsTab';
import { CompleteClass } from '../../../services/classAssembly';

export interface SequenceResult {
  movements: Array<{
    id?: string;
    name: string;
    duration_seconds: number;
    primary_muscles?: string[];
    difficulty_level?: string;
    type?: 'movement' | 'transition';
    from_position?: string;
    to_position?: string;
    narrative?: string;
  }>;
  movement_count: number;
  transition_count: number;
  total_duration: number;
  muscle_balance: Record<string, number>; // Dynamic muscle groups from database
}

export interface MusicResult {
  playlist: Array<{
    title: string;
    artist: string;
    bpm: number;
    duration_seconds: number;
    url?: string;
  }>;
  total_duration: number;
  average_bpm: number;
}

export interface MeditationResult {
  script: string;
  duration_minutes: number;
  theme: string;
  breathing_pattern?: string;
}

export interface GeneratedClassResults {
  sequence: SequenceResult;
  music: MusicResult;
  meditation: MeditationResult;
  // SESSION 11: Optional complete class with all 6 sections
  completeClass?: CompleteClass;
}

interface GeneratedResultsProps {
  results: GeneratedClassResults;
  onAccept: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isRegenerating?: boolean;
}

type TabType = 'sequence' | 'music' | 'meditation';

export function GeneratedResults({
  results,
  onAccept,
  onRegenerate,
  onCancel,
  isRegenerating = false,
}: GeneratedResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sequence');

  const tabs: Array<{ id: TabType; label: string; icon: JSX.Element }> = [
    {
      id: 'sequence',
      label: 'Sequence',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      id: 'music',
      label: 'Music',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
    },
    {
      id: 'meditation',
      label: 'Meditation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card-texture border border-cream/30 rounded-lg shadow-card w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Modal Header */}
        <div className="p-6 border-b border-cream/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cream mb-1">
                Your AI-Generated Class
              </h2>
              <p className="text-sm text-cream/60">
                Review the generated sequence, music, and meditation
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-cream/10 rounded-lg transition-smooth"
            >
              <svg
                className="w-6 h-6 text-cream"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cream/30 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-smooth ${
                activeTab === tab.id
                  ? 'border-cream text-cream'
                  : 'border-transparent text-cream/60 hover:text-cream'
              }`}
            >
              {tab.icon}
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'sequence' && <SequenceResultsTab data={results.sequence} />}
          {activeTab === 'music' && <MusicResultsTab data={results.music} />}
          {activeTab === 'meditation' && <MeditationResultsTab data={results.meditation} />}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-cream/30 bg-burgundy-dark">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onRegenerate}
              isLoading={isRegenerating}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Regenerate</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Accept & Add to Class</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
