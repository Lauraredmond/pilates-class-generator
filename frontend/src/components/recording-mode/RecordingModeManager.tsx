/**
 * RecordingModeManager Component
 * Generates a special "recording mode" class with all 34 movements
 * for systematic voiceover recording
 */

import { useState } from 'react';
import { ClassPlayback, PlaybackItem } from '../class-playback/ClassPlayback';
import { Mic } from 'lucide-react';
import axios from 'axios';
import { logger } from '../../utils/logger';
import { API_BASE_URL } from '../../utils/api-config';

interface RecordingModeManagerProps {
  onClose?: () => void;
}

/**
 * Validates duration from database, using 60-second minimal default if NULL/missing
 * Logs warning when fallback is used
 */
function validateDuration(duration: number | null | undefined, sectionName: string): number {
  if (duration === null || duration === undefined || duration <= 0) {
    logger.warn(`[RecordingMode] Missing duration for ${sectionName}, using 60-second minimal default`);
    return 60;
  }
  return duration;
}

export function RecordingModeManager({ onClose }: RecordingModeManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackItems, setPlaybackItems] = useState<PlaybackItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleStartRecordingMode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      logger.debug('[RecordingMode] Fetching all movements');

      // Fetch all 34 movements from database
      const response = await axios.get(`${API_BASE_URL}/api/movements`);
      const allMovements = response.data;

      logger.debug(`[RecordingMode] Fetched ${allMovements.length} movements`);

      // DEBUG: Check if video_url exists in API response
      const hundredMovement = allMovements.find((m: any) => m.name === 'The Hundred');
      console.log('🎥 DEBUG: The Hundred from API:', hundredMovement);
      console.log('🎥 DEBUG: The Hundred video_url:', hundredMovement?.video_url);

      // Order movements: The Hundred, Open Leg Rocker, then the rest
      const theHundred = allMovements.find((m: any) => m.name === 'The Hundred');
      const openLegRocker = allMovements.find((m: any) => m.name === 'Open Leg Rocker');
      const otherMovements = allMovements.filter(
        (m: any) => m.name !== 'The Hundred' && m.name !== 'Open Leg Rocker'
      );

      const orderedMovements = [
        theHundred,
        openLegRocker,
        ...otherMovements
      ].filter(Boolean); // Remove any undefined

      logger.debug(`[RecordingMode] Ordered movements: ${orderedMovements.map((m: any) => m.name).join(', ')}`);

      // Call backend to add transitions between movements (fetches from database)
      logger.debug('[RecordingMode] Calling /api/movements/add-transitions');
      const transitionsResponse = await axios.post(`${API_BASE_URL}/api/movements/add-transitions`, {
        movements: orderedMovements
      });
      const movementsWithTransitions = transitionsResponse.data;
      logger.debug(`[RecordingMode] Received ${movementsWithTransitions.length} items (movements + transitions)`);

      // Fetch framing sections (preparation, warmup, cooldown, meditation, homecare)
      const preparationResponse = await axios.get(`${API_BASE_URL}/api/class-sections/preparation`);
      const warmupResponse = await axios.get(`${API_BASE_URL}/api/class-sections/warmup`);
      const cooldownResponse = await axios.get(`${API_BASE_URL}/api/class-sections/cooldown`);
      const meditationResponse = await axios.get(`${API_BASE_URL}/api/class-sections/closing-meditation`);
      const homecareResponse = await axios.get(`${API_BASE_URL}/api/class-sections/closing-homecare`);

      const preparation = preparationResponse.data[0];
      const warmup = warmupResponse.data[0];
      const cooldown = cooldownResponse.data[0];
      const meditation = meditationResponse.data[0];
      const homecare = homecareResponse.data[0];

      // Build playback items array
      const items: PlaybackItem[] = [];

      // Section 1: Preparation (duration from database)
      items.push({
        type: 'preparation' as const,
        script_name: preparation?.script_name || 'Pilates Principles',
        narrative: preparation?.narrative || 'No preparation narrative available.',
        key_principles: preparation?.key_principles || [],
        duration_seconds: validateDuration(preparation?.duration_seconds, 'Preparation'),
        breathing_pattern: preparation?.breathing_pattern || 'Inhale/Exhale',
        breathing_focus: preparation?.breathing_focus || 'Lateral breathing',
        voiceover_url: preparation?.voiceover_url,
        voiceover_duration: preparation?.voiceover_duration,
        voiceover_enabled: preparation?.voiceover_enabled || false,
        // Video demonstration (AWS Phase 1) - CRITICAL: Must map from backend
        video_url: preparation?.video_url,
      });

      // Section 2: Warmup (duration from database)
      items.push({
        type: 'warmup' as const,
        routine_name: warmup?.routine_name || 'Full Body Warm-up',
        narrative: warmup?.narrative || 'No warmup narrative available.',
        movements: warmup?.movements || [],
        duration_seconds: validateDuration(warmup?.duration_seconds, 'Warmup'),
        focus_area: warmup?.focus_area || 'full_body',
        voiceover_url: warmup?.voiceover_url,
        voiceover_duration: warmup?.voiceover_duration,
        voiceover_enabled: warmup?.voiceover_enabled || false,
        // Video demonstration (AWS Phase 1) - CRITICAL: Must map from backend
        video_url: warmup?.video_url,
      });

      // Section 3: All 34 movements with database transitions (durations from database)
      // Backend has already inserted transitions between movements
      for (const item of movementsWithTransitions) {
        if (item.type === 'movement') {
          items.push({
            type: 'movement' as const,
            id: item.id,
            name: item.name,
            duration_seconds: validateDuration(item.duration_seconds, `Movement: ${item.name}`),
            narrative: item.narrative,
            setup_position: item.setup_position,
            watch_out_points: item.watch_out_points,
            teaching_cues: item.teaching_cues || [],
            muscle_groups: item.muscle_groups || [],
            difficulty_level: item.difficulty_level,
            primary_muscles: item.primary_muscles || [],
            voiceover_url: item.voiceover_url,
            voiceover_duration_seconds: item.voiceover_duration_seconds,
            voiceover_enabled: item.voiceover_enabled || false,
            video_url: item.video_url,
          });
        } else if (item.type === 'transition') {
          // Transition from database with proper narrative, duration, and voiceover
          items.push({
            type: 'transition' as const,
            from_position: item.from_position || 'Unknown',
            to_position: item.to_position || 'Unknown',
            narrative: item.narrative || `Transition from ${item.from_position} to ${item.to_position}.`,
            duration_seconds: validateDuration(item.duration_seconds, `Transition: ${item.from_position} → ${item.to_position}`),
            voiceover_url: item.voiceover_url,
            voiceover_duration: item.voiceover_duration,
            voiceover_enabled: item.voiceover_enabled || false,
          });
        }
      }

      // Section 4: Cooldown (duration from database)
      items.push({
        type: 'cooldown' as const,
        sequence_name: cooldown?.sequence_name || 'Full Body Cooldown',
        narrative: cooldown?.narrative || 'No cooldown narrative available.',
        stretches: cooldown?.stretches || [],
        duration_seconds: validateDuration(cooldown?.duration_seconds, 'Cooldown'),
        target_muscles: cooldown?.target_muscles || [],
        recovery_focus: cooldown?.recovery_focus || 'full_body',
        voiceover_url: cooldown?.voiceover_url,
        voiceover_duration: cooldown?.voiceover_duration,
        voiceover_enabled: cooldown?.voiceover_enabled || false,
        // Video demonstration (AWS Phase 1)
        video_url: cooldown?.video_url,
      });

      // Section 5: Closing Meditation (duration from database)
      items.push({
        type: 'meditation' as const,
        script_name: meditation?.script_name || 'Body Scan & Gratitude',
        script_text: meditation?.script_text || 'No meditation script available.',
        duration_seconds: validateDuration(meditation?.duration_seconds, 'Meditation'),
        breathing_guidance: meditation?.breathing_guidance || '',
        meditation_theme: meditation?.meditation_theme || 'body_scan',
        voiceover_url: meditation?.voiceover_url,
        voiceover_duration: meditation?.voiceover_duration,
        voiceover_enabled: meditation?.voiceover_enabled || false,
        // Video demonstration (AWS Phase 1)
        video_url: meditation?.video_url,
      });

      // Section 6: HomeCare Advice (duration from database)
      items.push({
        type: 'homecare' as const,
        advice_name: homecare?.advice_name || 'Post-Class Care',
        advice_text: homecare?.advice_text || 'No homecare advice available.',
        actionable_tips: homecare?.actionable_tips || [],
        duration_seconds: validateDuration(homecare?.duration_seconds, 'HomeCare'),
        focus_area: homecare?.focus_area || 'general',
        voiceover_url: homecare?.voiceover_url,
        voiceover_duration: homecare?.voiceover_duration,
        voiceover_enabled: homecare?.voiceover_enabled || false,
        // Video demonstration (AWS Phase 1)
        video_url: homecare?.video_url,
      });

      // Calculate total duration from database values
      const totalDurationSeconds = items.reduce((sum, item) => sum + item.duration_seconds, 0);
      const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

      logger.debug(`[RecordingMode] Generated ${items.length} playback items`);
      logger.info(`[RecordingMode] Total class duration: ${totalDurationMinutes} minutes (${totalDurationSeconds} seconds) - calculated from database`);

      // DEBUG: Check if video_url made it into PlaybackItems
      const hundredPlaybackItem = items.find((item: any) => item.type === 'movement' && item.name === 'The Hundred');
      console.log('🎥 DEBUG: The Hundred PlaybackItem:', hundredPlaybackItem);
      console.log('🎥 DEBUG: The Hundred PlaybackItem.video_url:', (hundredPlaybackItem as any)?.video_url);

      setPlaybackItems(items);
      setIsPlaying(true);
    } catch (error: any) {
      logger.error('[RecordingMode] Failed to generate recording class:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to generate recording class');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExitPlayback = () => {
    setIsPlaying(false);
    setPlaybackItems([]);
    if (onClose) onClose();
  };

  const handleCompletePlayback = () => {
    setIsPlaying(false);
    setPlaybackItems([]);
    if (onClose) onClose();
  };

  if (isPlaying && playbackItems.length > 0) {
    return (
      <ClassPlayback
        items={playbackItems}
        movementMusicStyle="Classical" // Default music style for recording
        coolDownMusicStyle="Classical" // Same style for both phases in recording mode
        onComplete={handleCompletePlayback}
        onExit={handleExitPlayback}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-burgundy/10 border border-burgundy/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mic className="w-6 h-6 text-burgundy" />
          <h3 className="text-lg font-semibold text-cream">Recording Mode</h3>
        </div>

        <p className="text-cream/70 text-sm mb-4">
          Generate a special class containing all 34 classical Pilates movements
          for systematic voiceover recording.
        </p>

        <div className="bg-cream/5 rounded p-4 mb-4 text-sm text-cream/60 space-y-2">
          <p><strong className="text-cream">Order:</strong> The Hundred, Open Leg Rocker, then remaining 32 movements</p>
          <p><strong className="text-cream">Duration:</strong> Calculated from database (varies per section)</p>
          <p><strong className="text-cream">Sections:</strong> Preparation + Warmup + All 34 Movements + Transitions + Cooldown + Meditation + HomeCare</p>
          <p><strong className="text-cream">Total Items:</strong> ~41 sections (6 framing + 34 movements + transitions)</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartRecordingMode}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-6 py-3 rounded-lg font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-5 h-5" />
          {isGenerating ? 'Generating Recording Class...' : 'Start Recording Mode'}
        </button>
      </div>
    </div>
  );
}
