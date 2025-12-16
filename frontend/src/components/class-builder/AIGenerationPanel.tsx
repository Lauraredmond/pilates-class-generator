/**
 * AIGenerationPanel Component
 * Panel with AI-powered generation options
 * Includes comprehensive form and results display
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';
import { agentsApi, classPlansApi } from '../../services/api';
import { GenerationForm, GenerationFormData } from './ai-generation/GenerationForm';
import { GeneratedResults, GeneratedClassResults } from './ai-generation/GeneratedResults';
import { ClassPlayback, PlaybackItem } from '../class-playback/ClassPlayback';
import { logger } from '../../utils/logger';

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
        logger.error('[AIGenerationPanel] User not authenticated - cannot generate class');
        throw new Error('You must be logged in to generate a class');
      }
      logger.info('[AIGenerationPanel] Class generation started', {
        userId: user.id,
        formData: {
          duration: formData.duration,
          difficulty: formData.difficulty,
          focusAreas: formData.focusAreas,
        },
      });

      // SESSION 11.5: Use StandardAgent orchestration for ALL 6 sections
      // JENTIC STANDARDAGENT: Single orchestrated call for complete class
      const completeClassResponse = await agentsApi.generateCompleteClass({
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
      });

      // Validate StandardAgent response
      if (!completeClassResponse.data.success) {
        throw new Error(completeClassResponse.data.error || 'Failed to generate complete class');
      }

      // Extract ALL sections from backend response (AI-generated OR database)
      const backendData = completeClassResponse.data.data;
      const sequenceResponse = backendData.sequence;
      const musicResponse = backendData.music_recommendation;

      // These sections may be AI-generated (if use_ai_agent=true) or from database (if false)
      const preparationData = backendData.preparation;
      const warmupData = backendData.warmup;
      const cooldownData = backendData.cooldown;
      const meditationData = backendData.meditation;
      const homecareData = backendData.homecare;

      logger.debug('[AIGenerationPanel] Class generation complete', {
        mode: backendData.ai_reasoning ? 'AI AGENT' : 'DEFAULT',
        movementCount: sequenceResponse.data.movement_count,
        transitionCount: sequenceResponse.data.transition_count,
      });

      // Calculate ACTUAL total duration from all 6 sections (not user input)
      const actualDuration =
        (preparationData?.duration_seconds || 240) +  // Section 1
        (warmupData?.duration_seconds || 180) +       // Section 2
        sequenceResponse.data.sequence.reduce((sum: number, item: any) => sum + (item.duration_seconds || 60), 0) + // Section 3 (movements + transitions)
        (cooldownData?.duration_seconds || 180) +     // Section 4
        (meditationData?.duration_seconds || 0) +     // Section 5 (0 if excluded for <30min classes)
        (homecareData?.duration_seconds || 60);       // Section 6

      logger.info('[AIGenerationPanel] Calculated actual duration', {
        preparation: preparationData?.duration_seconds || 240,
        warmup: warmupData?.duration_seconds || 180,
        movementsAndTransitions: sequenceResponse.data.sequence.reduce((sum: number, item: any) => sum + (item.duration_seconds || 60), 0),
        cooldown: cooldownData?.duration_seconds || 180,
        meditation: meditationData?.duration_seconds || 0,
        homecare: homecareData?.duration_seconds || 60,
        totalSeconds: actualDuration,
        totalMinutes: Math.round(actualDuration / 60),
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
            // Voiceover audio fields (Session 13.5) - PRESERVE from backend!
            voiceover_url: m.voiceover_url,
            voiceover_duration_seconds: m.voiceover_duration_seconds,
            voiceover_enabled: m.voiceover_enabled,
            // Video demonstration (AWS Phase 1) - PRESERVE from backend!
            video_url: m.video_url,
          })),
          movement_count: sequenceResponse.data.movement_count || 0,
          transition_count: sequenceResponse.data.transition_count || 0,
          total_duration: actualDuration, // Use CALCULATED duration from all 6 sections
          muscle_balance: sequenceResponse.data.muscle_balance || {},
        },
        music: {
          // Handle case where music selection wasn't included in AI plan
          playlist: musicResponse?.data?.playlist?.map((track: any) => ({
            title: track.title || 'Unknown Track',
            artist: track.artist || 'Unknown Artist',
            bpm: track.bpm || 120,
            duration_seconds: track.duration_seconds || 180,
            url: track.url,
          })) || [],
          total_duration: musicResponse?.data?.total_duration || formData.duration * 60,
          average_bpm: musicResponse?.data?.average_bpm || 120,
        },
        meditation: {
          // Meditation is database object, not tool result - access fields directly
          script: meditationData?.script_text || '',
          duration_minutes: meditationData ? Math.floor(meditationData.duration_seconds / 60) : 5,
          theme: meditationData?.meditation_theme || formData.meditationTheme,
          breathing_pattern: meditationData?.breathing_guidance || '',
        },
        // SESSION 11: Store complete 6-section class for playback
        // FIX: Use backend sections (AI-generated when toggle ON, database when OFF)
        completeClass: {
          preparation: preparationData,  // AI-generated "Core Harmony" OR database default
          warmup: warmupData,            // Web-researched OR database default
          movements: sequenceResponse.data.sequence.filter((item: any) => item.type === 'movement'),
          transitions: sequenceResponse.data.sequence.filter((item: any) => item.type === 'transition'),
          cooldown: cooldownData,        // Web-researched OR database default
          meditation: meditationData,    // Database selection (same for both modes)
          homecare: homecareData,        // AI-generated "Hydration" advice OR database default
          difficulty: formData.difficulty,
          total_duration_minutes: formData.duration,
          music_playlist: musicResponse?.data || null,
        },
      };

      setResults(completeResults);
      setShowResultsModal(true); // Show the modal

      logger.info('[AIGenerationPanel] Setting modal state', {
        resultsSet: !!completeResults,
        showResultsModal: true,
        movementCount: completeResults.sequence.movement_count,
      });

      showToast('Complete 6-section class generated successfully!', 'success');
    } catch (error: any) {
      logger.error('Failed to generate complete class:', error);

      // Check if this is a token expiration error (from auth interceptor)
      if (error.userFriendly) {
        // User-friendly message from auth interceptor
        showToast(error.message, 'error');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 401) {
        // 401 but not caught by interceptor (shouldn't happen, but safety net)
        showToast('Your session has expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        // Other errors
        const errorMessage =
          error.response?.data?.detail || error.message || 'Failed to generate complete class';
        showToast(errorMessage, 'error');
      }
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

  const handleAcceptResults = async () => {
    if (!results || !lastFormData || !user) return;

    try {
      // SESSION 13: Save completed class to database for analytics tracking
      const saveResponse = await classPlansApi.saveCompleted({
        user_id: user.id,
        difficulty: lastFormData.difficulty,
        duration_minutes: lastFormData.duration,
        movements_snapshot: results.sequence.movements,  // Full sequence (movements + transitions)
        muscle_balance: results.sequence.muscle_balance,
        class_name: 'Automatically Generated Class',
      });

      logger.debug('[AIGenerationPanel] Class saved to database');

      // Add generated sequence to current class (frontend state)
      setCurrentClass({
        name: 'Automatically Generated Class',
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

      // Show success message with updated class count
      const message = saveResponse.data.message || 'Class added successfully!';
      showToast(message, 'success');
      setShowResultsModal(false); // Close the modal but keep results for Play Class button
    } catch (error: any) {
      logger.error('Failed to save class:', error);
      const errorMessage =
        error.response?.data?.detail || error.message || 'Failed to save class to database';
      showToast(errorMessage, 'error');
    }
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
  // FILTER: Exclude meditation for <30 min classes (backend returns null)
  const playbackItems: PlaybackItem[] = results && (results as any).completeClass
    ? [
        // Section 1: Preparation (null-safe: preparation may be missing if backend fails)
        {
          type: 'preparation' as const,
          script_name: (results as any).completeClass.preparation?.script_name || 'Pilates Principles',
          narrative: (results as any).completeClass.preparation?.narrative || 'No preparation narrative available.',
          key_principles: (results as any).completeClass.preparation?.key_principles || [],
          duration_seconds: (results as any).completeClass.preparation?.duration_seconds || 240,
          breathing_pattern: (results as any).completeClass.preparation?.breathing_pattern || 'Inhale/Exhale',
          breathing_focus: (results as any).completeClass.preparation?.breathing_focus || 'Lateral breathing',
          // Voiceover audio fields
          voiceover_url: (results as any).completeClass.preparation?.voiceover_url,
          voiceover_duration: (results as any).completeClass.preparation?.voiceover_duration,
          voiceover_enabled: (results as any).completeClass.preparation?.voiceover_enabled || false,
          // Video demonstration (AWS Phase 1)
          video_url: (results as any).completeClass.preparation?.video_url,
        },
        // Section 2: Warm-up (null-safe: warmup may be missing if backend fails)
        (() => {
          const warmup = (results as any).completeClass.warmup;
          logger.debug('[AIGenerationPanel] Warmup playback item:', {
            hasWarmup: !!warmup,
            voiceover_url: warmup?.voiceover_url,
            voiceover_enabled: warmup?.voiceover_enabled,
            voiceover_duration: warmup?.voiceover_duration,
          });
          return {
            type: 'warmup' as const,
            routine_name: warmup?.routine_name || 'Full Body Warm-up',
            narrative: warmup?.narrative || 'No warmup narrative available.',
            movements: warmup?.movements || [],
            duration_seconds: warmup?.duration_seconds || 180,
            focus_area: warmup?.focus_area || 'full_body',
            // Voiceover audio fields
            voiceover_url: warmup?.voiceover_url,
            voiceover_duration: warmup?.voiceover_duration,
            voiceover_enabled: warmup?.voiceover_enabled || false,
            // Video demonstration (AWS Phase 1)
            video_url: warmup?.video_url,
          };
        })(),
        // Section 3: Main movements (AI-generated, includes movements + transitions)
        // Use results.sequence.movements which contains BOTH movements and transitions from AI
        ...results.sequence.movements.map((m, index) => {
          if (m.type === 'transition') {
            return {
              type: 'transition' as const,
              from_position: (m as any).from_position || 'Unknown',
              to_position: (m as any).to_position || 'Unknown',
              narrative: (m as any).narrative || '',
              duration_seconds: m.duration_seconds || 60,
              name: m.name || 'Transition',
              // Voiceover audio fields (Session: Transitions voiceover support)
              voiceover_url: (m as any).voiceover_url,
              voiceover_duration: (m as any).voiceover_duration,
              voiceover_enabled: (m as any).voiceover_enabled || false,
            };
          }

          // DEBUG: Log movement voiceover data (especially for first movement)
          if (index === 0 || m.name === 'The Hundred') {
            logger.debug(`[AIGenerationPanel] Movement "${m.name}" playback item:`, {
              hasMovement: !!m,
              voiceover_url: (m as any).voiceover_url,
              voiceover_enabled: (m as any).voiceover_enabled,
              voiceover_duration_seconds: (m as any).voiceover_duration_seconds,
            });
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
            // Voiceover audio fields (Session 13.5)
            voiceover_url: (m as any).voiceover_url,
            voiceover_duration_seconds: (m as any).voiceover_duration_seconds,
            voiceover_enabled: (m as any).voiceover_enabled || false,
            // Video demonstration (AWS Phase 1)
            video_url: (m as any).video_url,
          };
        }),
        // Section 4: Cool-down (null-safe: cooldown may be missing if backend fails)
        {
          type: 'cooldown' as const,
          sequence_name: (results as any).completeClass.cooldown?.sequence_name || 'Full Body Cooldown',
          narrative: (results as any).completeClass.cooldown?.narrative || 'No cooldown narrative available.',
          stretches: (results as any).completeClass.cooldown?.stretches || [],
          duration_seconds: (results as any).completeClass.cooldown?.duration_seconds || 180,
          target_muscles: (results as any).completeClass.cooldown?.target_muscles || [],
          recovery_focus: (results as any).completeClass.cooldown?.recovery_focus || 'full_body',
          // Voiceover audio fields
          voiceover_url: (results as any).completeClass.cooldown?.voiceover_url,
          voiceover_duration: (results as any).completeClass.cooldown?.voiceover_duration,
          voiceover_enabled: (results as any).completeClass.cooldown?.voiceover_enabled || false,
          // Video demonstration (AWS Phase 1)
          video_url: (results as any).completeClass.cooldown?.video_url,
        },
        // Section 5: Closing Meditation (CONDITIONALLY INCLUDED - only for >30 min classes)
        // Backend returns null for <=30 min classes - filter it out instead of showing "No meditation script available"
        ...((results as any).completeClass.meditation ? [{
          type: 'meditation' as const,
          script_name: (results as any).completeClass.meditation.script_name || 'Body Scan & Gratitude',
          script_text: (results as any).completeClass.meditation.script_text || 'No meditation script available.',
          duration_seconds: (results as any).completeClass.meditation.duration_seconds || 300,
          breathing_guidance: (results as any).completeClass.meditation.breathing_guidance || '',
          meditation_theme: (results as any).completeClass.meditation.meditation_theme || 'body_scan',
          // Voiceover audio fields
          voiceover_url: (results as any).completeClass.meditation.voiceover_url,
          voiceover_duration: (results as any).completeClass.meditation.voiceover_duration,
          voiceover_enabled: (results as any).completeClass.meditation.voiceover_enabled || false,
          // Video demonstration (AWS Phase 1)
          video_url: (results as any).completeClass.meditation.video_url,
        }] : []),
        // Section 6: HomeCare Advice (null-safe: homecare may be missing if backend fails)
        {
          type: 'homecare' as const,
          advice_name: (results as any).completeClass.homecare?.advice_name || 'Post-Class Care',
          advice_text: (results as any).completeClass.homecare?.advice_text || 'No homecare advice available.',
          actionable_tips: (results as any).completeClass.homecare?.actionable_tips || [],
          duration_seconds: (results as any).completeClass.homecare?.duration_seconds || 60,
          focus_area: (results as any).completeClass.homecare?.focus_area || 'general',
          // Voiceover audio fields
          voiceover_url: (results as any).completeClass.homecare?.voiceover_url,
          voiceover_duration: (results as any).completeClass.homecare?.voiceover_duration,
          voiceover_enabled: (results as any).completeClass.homecare?.voiceover_enabled || false,
          // Video demonstration (AWS Phase 1)
          video_url: (results as any).completeClass.homecare?.video_url,
        },
      ]
    : [];

  // PWA DEBUG: Log modal rendering conditions
  useEffect(() => {
    logger.debug('[AIGenerationPanel] Modal rendering check', {
      showResultsModal,
      hasResults: !!results,
      isPlayingClass,
      willRenderModal: showResultsModal && results && !isPlayingClass,
    });
  }, [showResultsModal, results, isPlayingClass]);

  return (
    <>
      {/* Hide generation form when playback is active */}
      {!isPlayingClass && (
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
      )}

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
          coolDownMusicStyle={lastFormData.coolDownMusicStyle}
          onComplete={handleCompletePlayback}
          onExit={handleExitPlayback}
        />
      )}
    </>
  );
}
