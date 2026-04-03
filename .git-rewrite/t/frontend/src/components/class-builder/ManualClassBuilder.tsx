/**
 * ManualClassBuilder - Manual drag-and-drop class creation
 * Layout: Movement Library (left) | Class Sequence (center) | Muscle Balance (right/bottom)
 */

import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { MovementLibrary } from './MovementLibrary';
import { SequenceCanvas } from './SequenceCanvas';
import { MuscleBalanceTracker } from './MuscleBalanceTracker';
import { useStore } from '../../store/useStore';
import { useState } from 'react';

export function ManualClassBuilder() {
  const addMovementToSequence = useStore((state) => state.addMovementToSequence);
  const reorderSequence = useStore((state) => state.reorderSequence);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const movements = useStore((state) => state.movements);

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (!over) return;

    // Dragging from library to sequence
    if (over.id === 'sequence-canvas' && !active.id.toString().startsWith('sequence-')) {
      const movement = active.data.current as any;
      if (movement) {
        addMovementToSequence(movement);
      }
    }

    // Reordering within sequence
    if (
      active.id.toString().startsWith('sequence-') &&
      over.id.toString().startsWith('sequence-')
    ) {
      const currentClass = useStore.getState().currentClass;
      if (!currentClass) return;

      const oldIndex = currentClass.movements.findIndex(
        (m) => `sequence-${m.sequenceIndex}` === active.id
      );
      const newIndex = currentClass.movements.findIndex(
        (m) => `sequence-${m.sequenceIndex}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderSequence(oldIndex, newIndex);
      }
    }
  };

  const activeDraggedMovement = movements.find((m) => m.id === activeDragId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Desktop: 3-column grid, Mobile: stacked */}
      <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Movement Library - Left (Desktop) / Top (Mobile) */}
        <div className="lg:col-span-3 h-[400px] lg:h-full">
          <MovementLibrary />
        </div>

        {/* Class Sequence - Center */}
        <div className="lg:col-span-5 h-[500px] lg:h-full">
          <SequenceCanvas />
        </div>

        {/* Muscle Balance - Right (Desktop) / Bottom (Mobile) */}
        <div className="lg:col-span-4 h-[350px] lg:h-full">
          <MuscleBalanceTracker />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDraggedMovement ? (
          <div className="bg-burgundy border-2 border-cream/60 rounded-lg p-3 shadow-glow opacity-90">
            <h4 className="text-sm font-semibold text-cream">
              {activeDraggedMovement.name}
            </h4>
            <p className="text-xs text-cream/70 mt-1">
              {activeDraggedMovement.difficulty_level}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
