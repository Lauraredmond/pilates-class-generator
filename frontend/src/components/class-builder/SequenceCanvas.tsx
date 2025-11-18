/**
 * SequenceCanvas Component
 * Drop zone for building class sequence with drag-and-drop
 * Displays timeline view of movements
 */

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { useStore } from '../../store/useStore';

interface SequenceItemProps {
  movement: {
    id: string;
    name: string;
    duration_seconds?: number;
    difficulty_level: string;
    sequenceIndex: number;
  };
  index: number;
  onRemove: (index: number) => void;
}

function SortableSequenceItem({ movement, index, onRemove }: SequenceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sequence-${movement.sequenceIndex}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-burgundy-dark border border-cream/30 rounded-lg p-3 transition-smooth hover:border-cream/50 ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-cream/40 hover:text-cream transition-smooth"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>

        {/* Sequence Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-burgundy flex items-center justify-center text-cream text-sm font-semibold">
          {index + 1}
        </div>

        {/* Movement Info */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-cream">{movement.name}</h4>
          <div className="flex gap-3 text-xs text-cream/60 mt-1">
            <span>{movement.difficulty_level}</span>
            {movement.duration_seconds && <span>{movement.duration_seconds}s</span>}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onRemove(index)}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-smooth flex items-center justify-center"
          title="Remove movement"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}

export function SequenceCanvas() {
  const currentClass = useStore((state) => state.currentClass);
  const removeMovementFromSequence = useStore((state) => state.removeMovementFromSequence);

  const { setNodeRef } = useDroppable({
    id: 'sequence-canvas',
  });

  const totalDuration = useMemo(() => {
    if (!currentClass) return 0;
    return currentClass.movements.reduce((sum, m) => sum + (m.duration_seconds || 0), 0);
  }, [currentClass]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const movements = currentClass?.movements || [];
  const maxDuration = 60 * 60; // 60 minutes in seconds
  const isOverLimit = totalDuration > maxDuration;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Class Sequence</CardTitle>
          <div
            className={`text-sm font-semibold ${
              isOverLimit ? 'text-red-400' : 'text-cream/80'
            }`}
          >
            {formatDuration(totalDuration)} / {formatDuration(maxDuration)}
          </div>
        </div>
      </CardHeader>
      <CardBody className="flex-1 overflow-hidden flex flex-col">
        <div ref={setNodeRef} className="flex-1 overflow-y-auto">
          {movements.length > 0 ? (
            <SortableContext
              items={movements.map((m) => `sequence-${m.sequenceIndex}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {movements.map((movement, index) => (
                  <SortableSequenceItem
                    key={`sequence-${movement.sequenceIndex}`}
                    movement={movement}
                    index={index}
                    onRemove={removeMovementFromSequence}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-cream/40">
              <div>
                <svg
                  className="w-16 h-16 mx-auto mb-3 opacity-40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <p className="text-sm">Drag movements here to build your class</p>
                <p className="text-xs mt-2 text-cream/30">
                  Start by selecting movements from the library
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Warning if over limit */}
        {isOverLimit && (
          <div className="mt-4 p-3 bg-red-600/20 border border-red-600/40 rounded-lg text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Class exceeds 60-minute maximum</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {movements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-cream/30 text-xs text-cream/70">
            {movements.length} movement{movements.length !== 1 ? 's' : ''} in sequence
          </div>
        )}
      </CardBody>
    </Card>
  );
}
