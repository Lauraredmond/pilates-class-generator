/**
 * AIGenerationPanel Component
 * Panel with AI-powered generation options
 * Includes comprehensive form and results display
 */

import { useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';
import { agentsApi } from '../../services/api';
import { assembleCompleteClass, CompleteClass } from '../../services/classAssembly';
import { GenerationForm, GenerationFormData } from './ai-generation/GenerationForm';
import { GeneratedResults, GeneratedClassResults } from './ai-generation/GeneratedResults';
import { ClassPlayback, PlaybackItem } from '../class-playback/ClassPlayback';

export function AIGenerationPanel() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [results, setResults] = useState<GeneratedClassResults | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastFormData, setLastFormData] = useState<GenerationFormData | null>(null);
  const [isPlayingClass, setIsPlayingClass] = useState(false);
  const setCurrentClass = useStore((state) => state.setCurrentClass);
  const showToast = useStore((state) => state.showToast);

  const handleGenerateCompleteClass = async (formData: GenerationFormData) => {
    setIsGenerating(true);
    setResults(null); // Clear previous results when starting new generation
    setLastFormData(formData);

    try {
      // Use authenticated user ID
      if (!user) {
        throw new Error('You must be logged in to generate a class');
      }
      console.log('[AIGenerationPanel] Using authenticated user ID:', user.id);

      // SESSION 11: Assemble complete 6-section class using new assembly service
      const completeClass: CompleteClass = await assembleCompleteClass(
        formData.difficulty,
        formData.duration,
        user.id
      );

      console.log('[AIGenerationPanel] Complete class assembled:', {
        hasPreparation: !!completeClass.preparation,
        hasWarmup: !!completeClass.warmup,
        movementCount: completeClass.movements.length,
        hasCooldown: !!completeClass.cooldown,
        hasMeditation: !!completeClass.meditation,
        hasHomecare: !!completeClass.homecare,
      });

      // Transform to existing GeneratedClassResults format for backward compatibility
      const completeResults: GeneratedClassResults = {
        sequence: {
          movements: completeClass.movements.map((m: any) => ({
            id: m.id,
            name: m.name,
            duration_seconds: m.duration_seconds || 60,
            primary_muscles: m.primary_muscles || [],
            difficulty_level: m.difficulty_level || 'Beginner',
            type: 'movement',
            narrative: m.narrative,
            setup_position: m.setup_position,
            watch_out_points: m.watch_out_points,
            teaching_cues: m.teaching_cues || [],
            muscle_groups: m.muscle_groups || [],
          })),
          movement_count: completeClass.movements.length,
          transition_count: completeClass.transitions?.length || 0,
          total_duration: formData.duration * 60,
          muscle_balance: {},
        },
        music: completeClass.music_playlist
          ? {
              playlist: completeClass.music_playlist.tracks?.map((track: any) => ({
                title: track.title || 'Unknown Track',
                artist: track.artist || 'Unknown Artist',
                bpm: track.bpm || 120,
                duration_seconds: track.duration_seconds || 180,
                url: track.url,
              })) || [],
              total_duration: formData.duration * 60,
              average_bpm: 120,
            }
          : {
              playlist: [],
              total_duration: formData.duration * 60,
              average_bpm: 120,
            },
        meditation: {
          script: completeClass.meditation?.script_text || '',
          duration_minutes: (completeClass.meditation?.duration_seconds || 240) / 60,
          theme: completeClass.meditation?.meditation_theme || formData.meditationTheme,
          breathing_pattern: completeClass.meditation?.breathing_guidance,
        },
        // SESSION 11: Store complete class for playback
        completeClass,
      };

      setResults(completeResults);
      setShowResultsModal(true); // Show the modal
      showToast('Complete 6-section class generated successfully!', 'success');
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
        id: movement.id || `movement-${index}`,
        movement_number: index + 1,
        code: movement.id || `code-${index}`,
        category: 'AI Generated',
        sequenceIndex: index,
        difficulty_level: movement.difficulty_level || 'Intermediate',
      })),
    });

    showToast('Class added successfully!', 'success');
    setShowResultsModal(false); // Close the modal but keep results for Play Class button
  };

  const handleCancel = () => {
    setResults(null);
    setShowResultsModal(false);
  };

  const handlePlayClass = () => {
    if (!results) return;
    setIsPlayingClass(true);
  };

  const handleExitPlayback = () => {
    setIsPlayingClass(false);
  };

  const handleCompletePlayback = () => {
    setIsPlayingClass(false);
    showToast('Class completed! Great work!', 'success');
  };

  // SESSION 11: Transform complete class to playback format with all 6 sections
  const playbackItems: PlaybackItem[] = results && (results as any).completeClass
    ? [
        // Section 1: Preparation
        {
          type: 'preparation' as const,
          script_name: (results as any).completeClass.preparation.script_name,
          narrative: (results as any).completeClass.preparation.narrative,
          key_principles: (results as any).completeClass.preparation.key_principles || [],
          duration_seconds: (results as any).completeClass.preparation.duration_seconds,
          breathing_pattern: (results as any).completeClass.preparation.breathing_pattern,
          breathing_focus: (results as any).completeClass.preparation.breathing_focus,
          script_type: (results as any).completeClass.preparation.script_type,
          difficulty_level: (results as any).completeClass.preparation.difficulty_level,
        },
        // Section 2: Warm-up
        {
          type: 'warmup' as const,
          routine_name: (results as any).completeClass.warmup.routine_name,
          narrative: (results as any).completeClass.warmup.narrative,
          movements: (results as any).completeClass.warmup.movements || [],
          duration_seconds: (results as any).completeClass.warmup.duration_seconds,
          focus_area: (results as any).completeClass.warmup.focus_area,
          contraindications: (results as any).completeClass.warmup.contraindications || [],
          modifications: (results as any).completeClass.warmup.modifications,
          difficulty_level: (results as any).completeClass.warmup.difficulty_level,
        },
        // Section 3: Main movements
        ...results.sequence.movements.map((m) => ({
          type: 'movement' as const,
          id: m.id || 'unknown',
          name: m.name,
          duration_seconds: m.duration_seconds,
          narrative: (m as any).narrative,
          setup_position: (m as any).setup_position,
          watch_out_points: (m as any).watch_out_points,
          teaching_cues: (m as any).teaching_cues || [],
          muscle_groups: (m as any).muscle_groups || [],
          difficulty_level: m.difficulty_level,
          primary_muscles: m.primary_muscles,
        })),
        // Section 4: Cool-down
        {
          type: 'cooldown' as const,
          sequence_name: (results as any).completeClass.cooldown.sequence_name,
          narrative: (results as any).completeClass.cooldown.narrative,
          stretches: (results as any).completeClass.cooldown.stretches || [],
          duration_seconds: (results as any).completeClass.cooldown.duration_seconds,
          target_muscles: (results as any).completeClass.cooldown.target_muscles || [],
          recovery_focus: (results as any).completeClass.cooldown.recovery_focus,
          intensity_level: (results as any).completeClass.cooldown.intensity_level,
        },
        // Section 5: Closing Meditation
        {
          type: 'meditation' as const,
          script_name: (results as any).completeClass.meditation.script_name,
          script_text: (results as any).completeClass.meditation.script_text,
          duration_seconds: (results as any).completeClass.meditation.duration_seconds,
          breathing_guidance: (results as any).completeClass.meditation.breathing_guidance,
          meditation_theme: (results as any).completeClass.meditation.meditation_theme,
          post_intensity: (results as any).completeClass.meditation.post_intensity,
        },
        // Section 6: HomeCare Advice
        {
          type: 'homecare' as const,
          advice_name: (results as any).completeClass.homecare.advice_name,
          advice_text: (results as any).completeClass.homecare.advice_text,
          actionable_tips: (results as any).completeClass.homecare.actionable_tips || [],
          duration_seconds: (results as any).completeClass.homecare.duration_seconds,
          focus_area: (results as any).completeClass.homecare.focus_area,
          related_to_class_focus: (results as any).completeClass.homecare.related_to_class_focus,
        },
      ]
    : [];

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Class Generator</CardTitle>
        </CardHeader>
        <CardBody className="flex-1 overflow-y-auto">
          <GenerationForm
            onSubmit={handleGenerateCompleteClass}
            isLoading={isGenerating}
            onPlayClass={handlePlayClass}
            hasGeneratedClass={results !== null}
          />
        </CardBody>
      </Card>

      {/* Results Modal */}
      {showResultsModal && results && !isPlayingClass && (
        <GeneratedResults
          results={results}
          onAccept={handleAcceptResults}
          onRegenerate={handleRegenerate}
          onCancel={handleCancel}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Playback Mode */}
      {isPlayingClass && results && lastFormData && (
        <ClassPlayback
          items={playbackItems}
          movementMusicStyle={lastFormData.movementMusicStyle}
          onComplete={handleCompletePlayback}
          onExit={handleExitPlayback}
        />
      )}
    </>
  );
}
