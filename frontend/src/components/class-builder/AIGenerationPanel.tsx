/**
 * AIGenerationPanel Component
 * Panel with AI-powered generation options
 * Includes comprehensive form and results display
 */

import { useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { useStore } from '../../store/useStore';
import { agentsApi } from '../../services/api';
import { GenerationForm, GenerationFormData } from './ai-generation/GenerationForm';
import { GeneratedResults, GeneratedClassResults } from './ai-generation/GeneratedResults';

export function AIGenerationPanel() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [results, setResults] = useState<GeneratedClassResults | null>(null);
  const [lastFormData, setLastFormData] = useState<GenerationFormData | null>(null);
  const setCurrentClass = useStore((state) => state.setCurrentClass);
  const showToast = useStore((state) => state.showToast);

  const handleGenerateCompleteClass = async (formData: GenerationFormData) => {
    setIsGenerating(true);
    setLastFormData(formData);

    try {
      // Generate all three components in parallel
      const [sequenceResponse, musicResponse, meditationResponse] = await Promise.all([
        // Generate sequence
        agentsApi.generateSequence({
          target_duration_minutes: formData.duration,
          difficulty_level: formData.difficulty,
          strictness_level: 'guided',
          include_mcp_research: formData.enableMcpResearch,
          focus_areas: formData.focusAreas,
        }),
        // Select music
        agentsApi.selectMusic({
          class_duration_minutes: formData.duration,
          target_bpm_range: [formData.musicBpmMin, formData.musicBpmMax],
          exclude_explicit: true,
          energy_level: formData.energyLevel,
        }),
        // Create meditation
        agentsApi.createMeditation({
          duration_minutes: 5,
          class_intensity: formData.energyLevel > 0.7 ? 'high' : formData.energyLevel > 0.4 ? 'moderate' : 'low',
          focus_theme: formData.meditationTheme.toLowerCase(),
          include_breathing: true,
        }),
      ]);

      // Validate responses
      if (!sequenceResponse.data.success) {
        throw new Error(sequenceResponse.data.error || 'Failed to generate sequence');
      }
      if (!musicResponse.data.success) {
        throw new Error(musicResponse.data.error || 'Failed to select music');
      }
      if (!meditationResponse.data.success) {
        throw new Error(meditationResponse.data.error || 'Failed to create meditation');
      }

      // Transform API responses to match our result types
      const completeResults: GeneratedClassResults = {
        sequence: {
          movements: sequenceResponse.data.data.sequence.map((m: any) => ({
            id: m.id,
            name: m.name,
            duration_seconds: m.duration_seconds || 60,
            primary_muscles: m.primary_muscles || [],
            difficulty_level: m.difficulty_level || 'Beginner',
            type: m.type || 'movement',
            from_position: m.from_position,
            to_position: m.to_position,
            narrative: m.narrative,
          })),
          movement_count: sequenceResponse.data.data.movement_count || 0,
          transition_count: sequenceResponse.data.data.transition_count || 0,
          total_duration: sequenceResponse.data.data.total_duration_minutes
            ? sequenceResponse.data.data.total_duration_minutes * 60
            : formData.duration * 60,
          muscle_balance: sequenceResponse.data.data.muscle_balance || {},
        },
        music: {
          playlist: musicResponse.data.data.playlist.map((track: any) => ({
            title: track.title || 'Unknown Track',
            artist: track.artist || 'Unknown Artist',
            bpm: track.bpm || 120,
            duration_seconds: track.duration_seconds || 180,
            url: track.url,
          })),
          total_duration: musicResponse.data.data.total_duration || formData.duration * 60,
          average_bpm: musicResponse.data.data.average_bpm || 120,
        },
        meditation: {
          script: meditationResponse.data.data.script || '',
          duration_minutes: meditationResponse.data.data.duration_minutes || 5,
          theme: meditationResponse.data.data.theme || formData.meditationTheme,
          breathing_pattern: meditationResponse.data.data.breathing_pattern,
        },
      };

      setResults(completeResults);
      showToast('Complete class generated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to generate complete class:', error);
      const errorMessage =
        error.response?.data?.detail || error.message || 'Failed to generate complete class';
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!lastFormData) return;

    setIsRegenerating(true);
    await handleGenerateCompleteClass(lastFormData);
    setIsRegenerating(false);
  };

  const handleAcceptResults = () => {
    if (!results || !lastFormData) return;

    // Add generated sequence to current class
    setCurrentClass({
      name: 'AI Generated Class',
      description: `${lastFormData.difficulty} level - ${lastFormData.duration} minutes`,
      target_duration_minutes: lastFormData.duration,
      difficulty_level: lastFormData.difficulty,
      movements: results.sequence.movements.map((movement, index) => ({
        ...movement,
        movement_number: index + 1,
        code: movement.id,
        category: 'AI Generated',
        sequenceIndex: index,
      })),
    });

    showToast('Class added successfully!', 'success');
    setResults(null);
    setLastFormData(null);
  };

  const handleCancel = () => {
    setResults(null);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>AI Class Generator</CardTitle>
        </CardHeader>
        <CardBody className="flex-1 overflow-y-auto">
          <GenerationForm onSubmit={handleGenerateCompleteClass} isLoading={isGenerating} />
        </CardBody>
      </Card>

      {/* Results Modal */}
      {results && (
        <GeneratedResults
          results={results}
          onAccept={handleAcceptResults}
          onRegenerate={handleRegenerate}
          onCancel={handleCancel}
          isRegenerating={isRegenerating}
        />
      )}
    </>
  );
}
