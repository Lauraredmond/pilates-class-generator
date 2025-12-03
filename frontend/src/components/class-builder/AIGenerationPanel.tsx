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
import { assembleCompleteClass } from '../../services/classAssembly';
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

      // SESSION 11.5: Use StandardAgent orchestration for sequence + music + meditation
      // Parallel execution: StandardAgent workflow + framing sections
      const [completeClassResponse, framingSections] = await Promise.all([
        // JENTIC STANDARDAGENT: Single orchestrated call for sequence + music + meditation
        // This uses BasslinePilatesCoachAgent (extends StandardAgent) to coordinate all tools
        agentsApi.generateCompleteClass({
          class_plan: {
            target_duration_minutes: formData.duration,
            difficulty_level: formData.difficulty,
            strictness_level: 'guided',
            include_mcp_research: formData.enableMcpResearch,
            focus_areas: formData.focusAreas,
          },
          include_music: true,
          include_meditation: true,
          include_research: formData.enableMcpResearch,
        }),
        // SESSION 11: Fetch framing sections (preparation, warmup, cooldown, homecare)
        assembleCompleteClass(formData.difficulty, formData.duration, user.id),
      ]);

      // Validate StandardAgent response
      if (!completeClassResponse.data.success) {
        throw new Error(completeClassResponse.data.error || 'Failed to generate complete class');
      }

      // Extract individual results from StandardAgent orchestration
      const sequenceResponse = completeClassResponse.data.data.sequence;
      const musicResponse = completeClassResponse.data.data.music_recommendation;
      const meditationResponse = completeClassResponse.data.data.meditation_script;

      console.log('[AIGenerationPanel] StandardAgent orchestration complete:', {
        movementCount: sequenceResponse.data.movement_count,
        transitionCount: sequenceResponse.data.transition_count,
        totalItems: sequenceResponse.data.sequence.length,
        orchestrationTimeMs: completeClassResponse.data.data.total_processing_time_ms,
      });

      console.log('[AIGenerationPanel] Framing sections fetched:', {
        hasPreparation: !!framingSections.preparation,
        hasWarmup: !!framingSections.warmup,
        hasCooldown: !!framingSections.cooldown,
        hasHomecare: !!framingSections.homecare,
      });

      // COMBINED RESULTS: AI sequence for modal, 6-section structure for playback
      const completeResults: GeneratedClassResults = {
        sequence: {
          // Use AI-generated movements + transitions for modal display
          movements: sequenceResponse.data.sequence.map((m: any) => ({
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
          movement_count: sequenceResponse.data.movement_count || 0,
          transition_count: sequenceResponse.data.transition_count || 0,
          total_duration: sequenceResponse.data.total_duration_minutes
            ? sequenceResponse.data.total_duration_minutes * 60
            : formData.duration * 60,
          muscle_balance: sequenceResponse.data.muscle_balance || {},
        },
        music: {
          playlist: musicResponse.data.playlist.map((track: any) => ({
            title: track.title || 'Unknown Track',
            artist: track.artist || 'Unknown Artist',
            bpm: track.bpm || 120,
            duration_seconds: track.duration_seconds || 180,
            url: track.url,
          })),
          total_duration: musicResponse.data.total_duration || formData.duration * 60,
          average_bpm: musicResponse.data.average_bpm || 120,
        },
        meditation: {
          script: meditationResponse.data.script || '',
          duration_minutes: meditationResponse.data.duration_minutes || 5,
          theme: meditationResponse.data.theme || formData.meditationTheme,
          breathing_pattern: meditationResponse.data.breathing_pattern,
        },
        // SESSION 11: Store complete 6-section class for playback
        completeClass: {
          preparation: framingSections.preparation,
          warmup: framingSections.warmup,
          movements: sequenceResponse.data.sequence.filter((item: any) => item.type === 'movement'),
          transitions: sequenceResponse.data.sequence.filter((item: any) => item.type === 'transition'),
          cooldown: framingSections.cooldown,
          meditation: framingSections.meditation,
          homecare: framingSections.homecare,
          difficulty: formData.difficulty,
          total_duration_minutes: formData.duration,
          music_playlist: musicResponse.data,
        },
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
  // Uses AI-generated movements (9 movements + 8 transitions) with framing sections
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
        },
        // Section 2: Warm-up
        {
          type: 'warmup' as const,
          routine_name: (results as any).completeClass.warmup.routine_name,
          narrative: (results as any).completeClass.warmup.narrative,
          movements: (results as any).completeClass.warmup.movements || [],
          duration_seconds: (results as any).completeClass.warmup.duration_seconds,
          focus_area: (results as any).completeClass.warmup.focus_area,
        },
        // Section 3: Main movements (AI-generated, includes movements + transitions)
        // Use results.sequence.movements which contains BOTH movements and transitions from AI
        ...results.sequence.movements.map((m) => {
          if (m.type === 'transition') {
            return {
              type: 'transition' as const,
              from_position: (m as any).from_position || 'Unknown',
              to_position: (m as any).to_position || 'Unknown',
              narrative: (m as any).narrative || '',
              duration_seconds: m.duration_seconds || 60,
              name: m.name || 'Transition',
            };
          }
          return {
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
          };
        }),
        // Section 4: Cool-down
        {
          type: 'cooldown' as const,
          sequence_name: (results as any).completeClass.cooldown.sequence_name,
          narrative: (results as any).completeClass.cooldown.narrative,
          stretches: (results as any).completeClass.cooldown.stretches || [],
          duration_seconds: (results as any).completeClass.cooldown.duration_seconds,
          target_muscles: (results as any).completeClass.cooldown.target_muscles || [],
          recovery_focus: (results as any).completeClass.cooldown.recovery_focus,
        },
        // Section 5: Closing Meditation
        {
          type: 'meditation' as const,
          script_name: (results as any).completeClass.meditation.script_name,
          script_text: (results as any).completeClass.meditation.script_text,
          duration_seconds: (results as any).completeClass.meditation.duration_seconds,
          breathing_guidance: (results as any).completeClass.meditation.breathing_guidance,
          meditation_theme: (results as any).completeClass.meditation.meditation_theme,
        },
        // Section 6: HomeCare Advice
        {
          type: 'homecare' as const,
          advice_name: (results as any).completeClass.homecare.advice_name,
          advice_text: (results as any).completeClass.homecare.advice_text,
          actionable_tips: (results as any).completeClass.homecare.actionable_tips || [],
          duration_seconds: (results as any).completeClass.homecare.duration_seconds,
          focus_area: (results as any).completeClass.homecare.focus_area,
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
