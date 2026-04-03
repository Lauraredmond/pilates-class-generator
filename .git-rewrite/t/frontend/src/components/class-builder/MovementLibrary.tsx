/**
 * MovementLibrary Component
 * Displays searchable and filterable list of Pilates movements
 * Movements are draggable to add to sequence
 */

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { useStore } from '../../store/useStore';

interface MovementCardProps {
  movement: {
    id: string;
    name: string;
    difficulty_level: string;
    duration_seconds?: number;
    category?: string;
  };
}

function DraggableMovementCard({ movement }: MovementCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: movement.id,
    data: movement,
  });

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-600';
      case 'intermediate':
        return 'bg-yellow-600';
      case 'advanced':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-card-texture border border-cream/20 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-smooth hover:border-cream/40 hover:shadow-glow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-cream">{movement.name}</h4>
        <span
          className={`text-xs px-2 py-1 rounded-full text-white ${getDifficultyColor(
            movement.difficulty_level
          )}`}
        >
          {movement.difficulty_level}
        </span>
      </div>
      <div className="flex justify-between items-center text-xs text-cream/70">
        <span>{movement.category || 'N/A'}</span>
        <span>{movement.duration_seconds ? `${movement.duration_seconds}s` : 'N/A'}</span>
      </div>
    </div>
  );
}

export function MovementLibrary() {
  const movements = useStore((state) => state.movements);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesSearch = movement.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === 'all' ||
        movement.difficulty_level.toLowerCase() === difficultyFilter.toLowerCase();
      const matchesMuscle =
        muscleFilter === 'all' ||
        movement.category?.toLowerCase().includes(muscleFilter.toLowerCase()) ||
        movement.primary_muscles?.some((m) =>
          m.toLowerCase().includes(muscleFilter.toLowerCase())
        );

      return matchesSearch && matchesDifficulty && matchesMuscle;
    });
  }, [movements, searchTerm, difficultyFilter, muscleFilter]);

  const difficultyOptions = ['all', 'beginner', 'intermediate', 'advanced'];
  const muscleOptions = ['all', 'core', 'legs', 'arms', 'back', 'full body'];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Movement Library</CardTitle>
      </CardHeader>
      <CardBody className="flex-1 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search movements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-burgundy-dark border border-cream/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-cream/60 transition-smooth"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cream/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-3">
          <label className="text-xs text-cream/70 mb-1 block">Difficulty</label>
          <div className="flex gap-2 flex-wrap">
            {difficultyOptions.map((option) => (
              <button
                key={option}
                onClick={() => setDifficultyFilter(option)}
                className={`px-3 py-1 text-xs rounded-full transition-smooth ${
                  difficultyFilter === option
                    ? 'bg-burgundy text-cream font-semibold'
                    : 'bg-burgundy-dark text-cream/70 hover:text-cream'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Muscle Group Filter */}
        <div className="mb-4">
          <label className="text-xs text-cream/70 mb-1 block">Muscle Group</label>
          <div className="flex gap-2 flex-wrap">
            {muscleOptions.map((option) => (
              <button
                key={option}
                onClick={() => setMuscleFilter(option)}
                className={`px-3 py-1 text-xs rounded-full transition-smooth ${
                  muscleFilter === option
                    ? 'bg-burgundy text-cream font-semibold'
                    : 'bg-burgundy-dark text-cream/70 hover:text-cream'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Movement List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredMovements.length > 0 ? (
            filteredMovements.map((movement) => (
              <DraggableMovementCard key={movement.id} movement={movement} />
            ))
          ) : (
            <div className="text-center py-8 text-cream/40">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No movements found</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-cream/30 text-xs text-cream/70">
          Showing {filteredMovements.length} of {movements.length} movements
        </div>
      </CardBody>
    </Card>
  );
}
