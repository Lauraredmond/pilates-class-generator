-- Migration 017: Clean up preparation_scripts and update with voiceover
-- Date: December 8, 2025
-- Purpose: Remove all but one preparation script and update with new narrative + voiceover

-- ============================================================================
-- Step 1: Delete all preparation scripts EXCEPT 'Pilates Principles Introduction'
-- ============================================================================

DELETE FROM preparation_scripts
WHERE script_name != 'Pilates Principles Introduction';

-- ============================================================================
-- Step 2: Update the remaining record with new narrative and voiceover
-- ============================================================================

UPDATE preparation_scripts
SET
  narrative = 'Find a comfortable standing space wherever you''re exercising today. Stand comfortably with your feet parallel or slightly turned out, hip-distance apart. Ensure your knees are soft and not locked.
Balance your weight evenly through both feet.
Place your hands on the two bony points at the front of your pelvis and point your fingertips straight forward, parallel to the floor.
Rotate your pelvis forward and notice the fingertips angle slightly downward.
Now roll the pelvis backward tucking the tailbone under slightly and notice the fingertips angle upward.
Gently rock between these two motions and find the midpoint where your fingertips come back to level with the floor.
That position — where your fingertips point straight ahead — is your neutral pelvis.
Elongate the spine, imagining a string lifting the crown of the head upward.
Roll the shoulders gently, allowing the shoulder blades to gently cinch and then widen across the back.
Keep your chin level and your gaze forward.
This is your neutral spine setup.
Next, we'll set up your breathing.
Gently draw your lower abdomen inward, as though zipping up a light corset or belt. Place your hands on the base of your ribs, fingers touching. As you breathe in, allow the ribcage to widen to the sides and feel the breath move into the sides and back of the ribs. Keep the shoulders relaxed. As you breathe out, feel the ribs draw softly back toward the centre and your fingertips come together again.
This is lateral thoracic breathing.',
  voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/1-preparation-phase.mp3',
  voiceover_duration = 107,  -- 1 minute 47 seconds
  voiceover_enabled = true,
  updated_at = NOW()
WHERE script_name = 'Pilates Principles Introduction';

-- ============================================================================
-- Step 3: Verify the update
-- ============================================================================

SELECT
  script_name,
  LEFT(narrative, 100) || '...' AS narrative_preview,
  voiceover_url,
  voiceover_duration,
  voiceover_enabled
FROM preparation_scripts;

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- Should show exactly 1 row with:
-- - script_name: 'Pilates Principles Introduction'
-- - narrative: Starting with 'Find a comfortable standing space...'
-- - voiceover_url: 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/1-preparation-phase.mp3'
-- - voiceover_duration: [Your duration in seconds]
-- - voiceover_enabled: true
