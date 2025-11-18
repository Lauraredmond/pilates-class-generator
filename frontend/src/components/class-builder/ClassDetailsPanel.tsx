/**
 * ClassDetailsPanel Component
 * Form for editing class metadata (name, notes, etc.)
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';

export function ClassDetailsPanel() {
  const currentClass = useStore((state) => state.currentClass);
  const updateClassDetails = useStore((state) => state.updateClassDetails);
  const clearSequence = useStore((state) => state.clearSequence);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentClass) {
      setName(currentClass.name);
      setNotes(currentClass.description || '');
    } else {
      setName('');
      setNotes('');
    }
  }, [currentClass]);

  const handleNameChange = (value: string) => {
    setName(value);
    updateClassDetails({ name: value });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    updateClassDetails({ description: value });
  };

  const totalDuration = currentClass?.movements.reduce(
    (sum, m) => sum + (m.duration_seconds || 0),
    0
  ) || 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const detectDifficulty = () => {
    if (!currentClass || currentClass.movements.length === 0) return 'Beginner';

    const difficultyScores: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const avgScore =
      currentClass.movements.reduce(
        (sum, m) => sum + (difficultyScores[m.difficulty_level.toLowerCase()] || 1),
        0
      ) / currentClass.movements.length;

    if (avgScore < 1.5) return 'Beginner';
    if (avgScore < 2.5) return 'Intermediate';
    return 'Advanced';
  };

  const handleSave = () => {
    // This will be connected to API later
    console.log('Saving class:', currentClass);
    useStore.getState().showToast('Class saved successfully!', 'success');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear this class?')) {
      clearSequence();
      setName('');
      setNotes('');
      useStore.getState().showToast('Class cleared', 'info');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Class Details</CardTitle>
      </CardHeader>
      <CardBody className="flex-1 flex flex-col">
        {/* Class Name */}
        <div className="mb-4">
          <label htmlFor="class-name" className="block text-sm font-semibold text-cream mb-2">
            Class Name
          </label>
          <input
            id="class-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Morning Flow, Core Focus..."
            className="w-full px-4 py-2 bg-burgundy-dark border border-cream/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-cream/60 transition-smooth"
          />
        </div>

        {/* Duration Display */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-cream mb-2">Duration</label>
          <div className="px-4 py-2 bg-burgundy-dark border border-cream/30 rounded-lg text-cream">
            {formatDuration(totalDuration)}
          </div>
        </div>

        {/* Difficulty Level */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-cream mb-2">Difficulty Level</label>
          <div className="px-4 py-2 bg-burgundy-dark border border-cream/30 rounded-lg text-cream">
            {detectDifficulty()}
          </div>
          <p className="text-xs text-cream/60 mt-1">Auto-detected from movements</p>
        </div>

        {/* Notes */}
        <div className="mb-4 flex-1 flex flex-col">
          <label htmlFor="class-notes" className="block text-sm font-semibold text-cream mb-2">
            Notes
          </label>
          <textarea
            id="class-notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes, focus areas, or special instructions..."
            rows={4}
            className="flex-1 px-4 py-2 bg-burgundy-dark border border-cream/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-cream/60 transition-smooth resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSave}
            disabled={!currentClass || currentClass.movements.length === 0}
          >
            Save Class
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleClear}
            disabled={!currentClass}
          >
            Clear All
          </Button>
        </div>

        {/* Quick Stats */}
        {currentClass && currentClass.movements.length > 0 && (
          <div className="mt-4 p-3 bg-burgundy-dark border border-cream/30 rounded-lg">
            <div className="text-xs text-cream/70 space-y-1">
              <div className="flex justify-between">
                <span>Movements:</span>
                <span className="text-cream">{currentClass.movements.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-cream">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="text-cream">{detectDifficulty()}</span>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
