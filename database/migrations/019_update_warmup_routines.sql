-- Migration 019: Clean up warmup_routines and update narrative
-- Date: December 8, 2025
-- Purpose: Remove all warmup routines except "Comprehensive Full Body Warm-up" and update its narrative

-- ============================================================================
-- Step 1: Delete all warmup routines EXCEPT "Comprehensive Full Body Warm-up"
-- ============================================================================

DELETE FROM warmup_routines
WHERE routine_name != 'Comprehensive Full Body Warm-up';

-- ============================================================================
-- Step 2: Update the remaining record with new narrative
-- ============================================================================

UPDATE warmup_routines
SET
  narrative = 'Let''s begin our short warm-up before we move into the movement phase of the class.
Come down onto your mat and lie comfortably on your back in supine position with your knees bent and your feet flat. Take a moment to settle on the floor.
We''ll start with some gentle pelvic tilts.
On your next exhale, imprint your spine against the mat as if you''re trying to close the gap between your lower back and the mat.
Inhale to release the pelvis forward, bringing you back into neutral pelvic position.
Repeat this movement until you get used to the difference in the range of motion.

Now we''ll move into hip rolls. Bring the heels toward the glutes, bending at the knee.
From a neutral pelvis, exhale, imprint the spine and begin to peel the spine off the mat, lifting the hips only as high as feels easy.
Pause at the top of your inhale.
As you exhale, melt the spine back down, one vertebra at a time.
Keep the movement steady and controlled.

Let''s open the upper back with some ribcage arcs.
Stretch out on the mat, legs lengthened.
Inhale to take the arms overhead toward one end of the room, only as far as your ribs stay quiet and grounded.
Exhale to float the arms back above the chest, hands now pointing toward the ceiling.
Allow the upper spine to open gently with each inhale.

Next, we''ll add some spinal rotation. Stretch out on the mat, legs bent at the knee.
Take your arms wide.
Let both knees drift to one side as you inhale.
Exhale to draw them back through centre.
Move to the other side.
Let the movement be easy, allowing the spine to unwind without force.

We''ll continue into a gentle thoracic rotation.
Roll onto your side, knees bent and arms and hands stacked pointing out in front.
Exhale to open the arm wide, letting the chest rotate toward the ceiling.
Inhale to return to starting position with arms out front.
One more here.
Then switch sides and repeat.

Come up to a seated or kneeling position for some shoulder mobilising.
Roll the shoulders gently, allowing the shoulder blades to gently cinch and then widen across the back.
Let any tension drop away.
Now create small, smooth circles with the arms, forward and back, keeping the movement light and controlled.

And now we''ll mobilise the hips with some knee circles.
Return to lying on your back.
With your knees bent, imagine tracing small circles with both knees together.
Reverse the direction, keeping the pelvis steady and the movement smooth.
We''ll finish with single-leg circles.
Bring one leg to tabletop.
Make small circles from the hip, keeping the pelvis anchored and quiet.
Reverse the direction.
Then switch legs and repeat.
This is all about control, precision, and gentle activation.
Now come to a comfortable seated or standing position.
Feel the breath steady, the spine long, and the body warm and switched on.',
  updated_at = NOW()
WHERE routine_name = 'Comprehensive Full Body Warm-up';

-- ============================================================================
-- Step 3: Verify the update
-- ============================================================================

SELECT
  routine_name,
  LEFT(narrative, 100) || '...' AS narrative_preview,
  focus_area,
  duration_seconds,
  difficulty_level,
  voiceover_url,
  voiceover_duration,
  voiceover_enabled
FROM warmup_routines;

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- Should show exactly 1 row with:
-- - routine_name: 'Comprehensive Full Body Warm-up'
-- - narrative: Starting with 'Let's begin our short warm-up...'
-- - voiceover_url: NULL (awaiting upload)
-- - voiceover_duration: NULL (awaiting upload)
-- - voiceover_enabled: false (awaiting upload)
