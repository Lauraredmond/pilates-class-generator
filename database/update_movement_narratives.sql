-- ============================================================================
-- UPDATE MOVEMENT NARRATIVES FOR ALL 34 CLASSICAL PILATES MOVEMENTS
-- ============================================================================
-- Generated: December 1, 2025
-- Source: CSV files from Downloads folder
-- Purpose: Update narrative field for all movements with teaching instructions
-- ============================================================================

-- Note: Movement #1 (The Hundred) was already updated manually
-- This script updates movements 2-34

-- ============================================================================
-- BATCH 1: Movements from batch1_updated_narratives.csv
-- ============================================================================

UPDATE movements
SET narrative = 'This is the Swan Dive.
Set up prone base position with the arms out to the side and flexed at the elbows, making a rectangle shape.
On the out-breath, lengthen the thoracic spine and float the head and chest off the floor, maintaining the lumbar spine and head in neutral. Breathe in as you return to the floor. The arms remain loosely in contact with the floor at all times.
To progress, keep the arms lifted off the floor as you lift and lower.
To progress to the full version, place the hands slightly wider than shoulder-width apart, and on the out-breath, push the upper body up off the floor as you extend the arms.
Breathe in for preparation and on the out-breath, reach the arms forward and roll the chest onto the mat, lifting the legs up behind. Rock forwards and backwards 10 times.'
WHERE movement_number = 12;

UPDATE movements
SET narrative = 'This is One leg kick.
Lie prone on your mat, elbows under the shoulders, forearms pressing into the mat, chest lifted, legs long.
Breathe in to prepare and on your out-breath draw the abdominals in to support the spine.
Bend one knee, bringing the heel toward the seat for two small kicks, then extend the leg long again.
Switch legs, continuing the alternating kicks with precision and rhythm.
Lower gently to finish.'
WHERE movement_number = 13;

UPDATE movements
SET narrative = 'This is Double Leg Kick.
Lie prone in neutral with the legs slightly apart and the arms resting behind the back, palms facing the ceiling.
Breathe in to prepare as you lengthen through the spine.
On your out-breath, flex the feet and draw the heels toward the glutes with three small, precise kicks.
Breathe in as you extend the legs long again and simultaneously lift the head and chest away from the mat, reaching the arms down toward the feet.
Lower with control and repeat the sequence.
Complete 10 cycles.
This is a strength movement.'
WHERE movement_number = 14;

UPDATE movements
SET narrative = 'This is Neck pull.
Lie on your back with legs extended hip-width, feet flexed and anchored, hands lightly behind the head. Neutral spine, core engaged.
Breathe in to prepare and on your out-breath, imprint the spine and curl the head, neck, and shoulders up, rolling through the spine until you sit tall.
Breathe in to hinge back from the hips with a long spine, breathe out to roll down with control one vertebra at a time.
Elbows stay wide without pulling on the head. Finish by lowering the head gently to the mat.'
WHERE movement_number = 15;

UPDATE movements
SET narrative = 'This is Scissors.
Set up level 1 of the Hundred with one leg off the floor. Breathe in to prepare and on the out-breath, lower the leg to the floor with control, keeping the angle at the knee joint at 90 degrees.
To progress, set up level 2 of the Hundred and alternate the legs in a scissor action one at a time.
To progress further, speed up the movement by making two movements to each breath.
To progress to the full version, lie supine on the mat and extend the legs. On the out-breath, lengthen and lift the leg to the ceiling, keeping it straight. Raise the opposite leg slightly off the floor. Alternate the legs for two movements. Repeat 10 times with each leg.
To progress further, lift the head and grab the ankle of the leg approaching the face.'
WHERE movement_number = 16;

UPDATE movements
SET narrative = 'This is Bicycle.
Lie on your back with legs extended and arms by your sides. Neutral spine, core engaged. Breathe in to prepare and on your out-breath imprint the spine and bring both legs into shoulder-stand position, with hands placed supporting your lower back.
Rotate the legs in a cycling movement for two movements as you breathe in and again for two movements as you breathe out.
Reverse the direction and repeat.'
WHERE movement_number = 17;

UPDATE movements
SET narrative = 'This is Shoulder Bridge.
Set up supine base, heels close in towards the glutes.
Breathe in as you tilt the pelvis back, and out as you return the spine into neutral. Increase the range of movement with each cycle, eventually lifting up into the bridge position with the shoulders, hips, and knees in a straight line or ski-slope position.
Breathe in at the top and out as you return the spine one vertebra at a time to the mat.

To progress:
When you next reach the bridge position, float the arms up and over the head as you breathe in, and breathe out as you return the arms and the body back down together.

To challenge further:
Leave the arms above the head in the bridge position and return the spine down to the mat, followed by the arms on the breath in.

Full version:
In bridge position, breathe in to prepare and on the out-breath lengthen and lift one leg up toward the ceiling.
Breathe in as you lower the leg toward the floor, keeping the hips lifted; breathe out as you lift it back up and return the foot to its original position.
Repeat on the opposite leg. Perform 10 repetitions.'
WHERE movement_number = 18;

UPDATE movements
SET narrative = 'This is Side kick.
Lie on your side in a long line, ankles, hips, and shoulders stacked. Rest your lower arm under your head and place your top hand lightly in front for support. Draw the abdominals in and find length through the spine.

Level 1:
Breathe in to prepare and on your out-breath, lift the top leg to hip height, keeping it in line with your body.
Breathe in as you point the leg forward with control, and breathe out as you return it behind you in line with the body, maintaining a stable pelvis.

Level 2:
Increase the range of forward and backward movement slightly while keeping the torso completely still. Maintain length from crown to toes and avoid rocking.

Full version:
Remove some stability support by placing your top hand on your hip. Continue the forward-and-back pointing action while keeping the hips and shoulders stacked and the waist lifted.
Lower the leg with control and switch sides.'
WHERE movement_number = 21;

UPDATE movements
SET narrative = 'This is Teaser.
Lie in your supine position with legs extended and arms reaching overhead or to the ceiling. Neutral spine, core engaged.
Breathe in to prepare and on your out-breath, imprint the spine and peel the head, neck, and shoulders from the mat, allowing the legs to float to tabletop or extend.
Continue rolling up until you balance on your sit bones in your Teaser position, arms reaching parallel to the legs.
Breathe in to hold, breathe out to roll down one vertebra at a time, lowering the legs and arms with control.
Finish by lying back in your starting position.'
WHERE movement_number = 22;

UPDATE movements
SET narrative = 'This is Hip twist.
Sit tall on your sit bones with your legs extended in front of you and slightly apart, arms long by your sides or placed behind you for support. Lengthen through the spine and draw the abdominals in.
Breathe in to prepare and on your out-breath, lean back into a gentle C-curve, keeping the chest open. Float both legs to tabletop or extend them long if available, maintaining steadiness through the pelvis.
Breathe in as you rotate the legs together to one side, keeping the hips level. Breathe out as you return through centre and rotate to the opposite side, maintaining abdominal support.
After your final repetition, return the legs to centre and lower them gently to the mat.'
WHERE movement_number = 23;

UPDATE movements
SET narrative = 'Prone mode

Level 1:
Lie prone on your mat, head resting on your arms. Breathe in, drawing the abdominals gently away from the mat and on your out-breath, lift one leg slightly off the mat, then switch legs with controlled alternating lifts.

Level 2:
Progress to level 2 by bringing in the arms. Continue the motion set at level 1, raising alternate arm and leg on each cycle.

Full version:
Increase the pace of the arm and leg movement while keeping the torso long and stable, breathing steadily. Lower with control after your final cycle.

Box mode

Level 1:
Position yourself on hands and knees (box position), spine long and neutral. Breathe in to prepare and on your out-breath extend one leg, then bring the knee back to the mat on the breath in. Repeat on the other leg.

Level 2:
To progress to level 2, bring in the arms and continue the motion set at level 1, alternating leg and arm each cycle. Switch sides with precision.

Full version:
Flow arm and leg extensions continuously, alternating sides while keeping the torso steady and abdominals engaged. Return to box and sit back into rest position.'
WHERE movement_number = 24;

UPDATE movements
SET narrative = 'This is Side bend.
In a side-lined position, knees bent at a 90-degree angle, resting on your hip. Place your supporting hand beneath your shoulder, fingers pointing away from you, and rest your top arm lightly by your side. Draw the abdominals in.

Level 1:
Breathe in to prepare and on your out-breath, press through your supporting arm and lift the hips away from the mat into a gentle side lift.
Breathe in to hold, and breathe out to lower the hips back to the mat with control.

Level 2:
Progress by extending the top arm towards the ceiling as you lift into the side bend, increasing the height of the lift while keeping the ribs soft.

Level 3:
Extend the top arm overhead as you lift, creating a long arc from fingertips to knees. Maintain strong abdominal support and an open chest.

Full version:
Straighten the legs, stacking them fully, and lift the hips into a full side plank. Sweep the top arm overhead into a long arc as you inhale, and return it to your side as you exhale, maintaining stability.
Lower with control and switch sides.'
WHERE movement_number = 28;

-- ============================================================================
-- BATCH 2: Movements from batch2_updated_narratives.csv
-- ============================================================================

UPDATE movements
SET narrative = 'This is the roll-up. Set up seated neutral with your hands loosely placed underneath your thighs, gently holding onto the hamstrings. Begin the movement with a posterior pelvic tilt, dropping back off the base of the pelvis, breathing in as you go back and out as you return to the seated neutral position. To progress, increase the range of movement, dropping further back, aiming to lower one vertebrae at a time to the mat. If the hands are not needed on the return, remove from behind the thighs. Continue to progress your range of movement, eventually journeying all the way to the mat. Breathe out on the journey to the floor, taking a breath in at the top of the movement, and breathing out as you return to seated neutral. On the next return to the mat, progress further by bringing the arms over the head as you take a breath in, making sure to keep the spine in neutral. Raise the arms back up towards the ceiling and breathe out as you lift the body off the mat one vertebrae at a time, back up into seated position. To progress to the full version of the roll-up, lie in supine base position and stretch your arms above your head, keeping your legs straight and together with your toes pointed. Breathe in as you raise your arms up towards the ceiling, breathe out as you lift the body off the mat, rolling upwards and forwards up into seated base. Take a breath in and breathe out as you roll back down into the start position, keeping the movement smooth and flowing. Repeat 10 times. This is a strength movement.'
WHERE movement_number = 2;

UPDATE movements
SET narrative = 'This is the rollover. From level 2 position of the 100, on the next out-breath, begin to peel the spine away from the floor, keeping your arms down by your side for support, and return to the start position. To progress to the full version, set up supine base position. Breathe out as you float your legs up towards the ceiling, toes pointed, peeling the spine away from the floor, rolling over to bring the legs parallel to the floor, and opening the legs to hip width with the feet flexed. As you inhale, begin to roll the spine down towards the mat, keeping your arms down by your side. As the legs pass above the hips, bring them back together, pointing the toes, and exhale on the return to the mat. Repeat 10 times.'
WHERE movement_number = 3;

UPDATE movements
SET narrative = 'This is one leg circle. Set up level one of the hundred. With your leg in the coffee table position, place your hand on the knee and slowly start to make small circles using your hand as a guide. Breathe out as the leg moves away from the body and in on the return. To progress, take the hand away and start to make the circles bigger, maintaining neutral spine and keeping the pelvis stable. Keep the shin parallel to the floor throughout. To progress to the full version, lie supine on the mat, arms lengthened by your side, legs fully extended and toes pointed. Breathe out as you float the leg towards the ceiling, keeping it lengthened throughout. Keeping the toes pointed, circle the leg away from the body as you breathe out, breathing in as you return the leg across the body back into the start position. Your breathing should dictate the speed of the movement. Repeat ten times on one leg, then repeat on the opposite leg.'
WHERE movement_number = 4;

UPDATE movements
SET narrative = 'This is rolling back. Set up seated base, placing your hands on the floor, either side of your hips, and lower the chin towards the chest. Initiate the movement with a posterior pelvic tilt, breathing in as you roll back, keeping the head and neck off the mat, and out as you return to seated base with your feet flat on the floor, using the hands to assist in the upward phase if needed. To progress, place the hands loosely on the shins, rolling back on the in-breath, and returning to seated neutral with your feet on the floor as you breathe out. To progress to the full version, return to a balanced position at the top of the movement, keeping the feet off the floor. Initiate the next movement from this balanced position. Repeat 10 times.'
WHERE movement_number = 5;

UPDATE movements
SET narrative = 'This is one leg stretch. Set up supine base with knees bent. Inhale for preparation, and on the out-breath, slowly slide one leg away from the body along the floor, keeping the pelvis stable. Slide the leg back in on the in-breath. Keep your heel in contact with the floor throughout. Repeat on the opposite leg. To progress, set up level 1 of the 100. On the out-breath, slowly lengthen one leg away, bringing the thighs parallel and keeping the toes pointed. Breathe in as you return the leg to the start position. To progress further, set up level 2 of the 100. On the out-breath, slowly lengthen one leg away, to a 45-degree angle, keeping the opposite leg in the coffee table position, shin parallel to the floor. Breathe in as you return to the start position. Repeat on the opposite leg. To progress to the full version, lie supine on the mat. As you inhale, lift the head and shoulders off the mat, and draw the knee in towards the chest, keeping the opposite leg lengthened but lifted off the mat. Place one hand on your ankle, and the opposite hand on your knee. Breathe out as you alternate left and right leg, and breathe in as you alternate right and left leg again. Keep the head and shoulders lifted throughout. Repeat 10 times. This is a strength movement.'
WHERE movement_number = 6;

UPDATE movements
SET narrative = 'This is double leg stretch. Set up supine base. with knees bent. Float the arms to the ceiling and start making small circles in opposite directions, gradually increasing the size of the circle. Breathe out as the arms move away from the body and breathe in as the arms are turned towards the midline. To progress, float the leg into level 1 of the 100 and continue to circle the arms wide with each breath cycle. To progress to the full version, lift the head and shoulders off the mat whilst bringing the legs into level 2 of the 100. Place the hands on the knees to start, breathing out as you circle the arms wide and over the head at the same time as you lengthen the legs away. Breathe in as you bring the arms back in towards the midline and return the legs to the start position. Repeat 10 times.'
WHERE movement_number = 7;

UPDATE movements
SET narrative = 'This is Spine Stretch. Set up seated base position with the legs slightly wider than hip distance apart. Begin by reaching forward with the arms, bringing the spine into forward flexion. Stretch as far forward as possible as you breathe out, returning back to the start position as you breathe in. Keep the movement flowing. Repeat 10 times.'
WHERE movement_number = 8;

UPDATE movements
SET narrative = 'This is Rocker with open legs. Set up seated base with your hands loosely placed on your ankles and toes together. Lengthen the legs as you breathe out, extending the legs up towards the ceiling, keeping the legs apart in a V-shape. Breathe in as you tilt the pelvis back and roll the spine back onto the mat. Breathe out as you return to the start position, bending the knees and returning the toes to the floor. To progress to the full version, keep the legs lengthened throughout, coming back into a balanced position at the top of each movement.'
WHERE movement_number = 9;

UPDATE movements
SET narrative = 'This is the Corkscrew. Set up supine neutral. Breathe out as you float your legs with the toes up towards the ceiling. Breathe in to prepare, and as you raise the legs over your head, peel the spine away from the mat until the legs come parallel to the floor. Point and drop the legs slightly to one side so that your weight is now balancing slightly more on one side of your upper back. Breathe in, and on the out-breath begin to lower the body so that you are rolling down on one side of the spine only. Once the spine is back on the mat, repeat on the opposite side. Repeat this 10 times on each side.'
WHERE movement_number = 10;

UPDATE movements
SET narrative = 'This is Spine twist. Sit tall on your sit bones with legs extended in front, slightly wider than hip distance apart, feet flexed, arms stretched out to the sides in an embracing shape at shoulder height. Pull the abdominals in to lengthen the spine. Breathe in to prepare and on your out-breath rotate the torso to one side, pulsing a little further for two small controlled rotations without shifting the hips. Breathe in to return to centre. Repeat to the opposite side, maintaining lift through the spine and stability through the pelvis. Finish by returning to a centred, tall seated position.'
WHERE movement_number = 19;

UPDATE movements
SET narrative = 'This is the jack knife. Lying in supine neutral, legs lengthened and toes pointed, reach the arms down by your sides. Breathe in for preparation, then breathe out as you put your hands into the floor, lifting and lengthening the legs up above the face towards the ceiling, maintaining a straight line from your ankles through to the knees and hips. Breathe in as you return the spine to the mat and out as you lower the legs all the way to the floor. Repeat 10 times.'
WHERE movement_number = 20;

-- ============================================================================
-- BATCH 3: Movements from batch3_updated_narratives.csv
-- ============================================================================

UPDATE movements
SET narrative = 'This is the Saw. Set up in seated neutral with the legs wider than hip distance apart. Raise the arms out to the sides as in Spine twist, keeping the shoulders relaxed. Breathe in as you rotate the torso to one side, keeping the spine tall and the glutes firmly connected to the mat. Breathe out as you fold forward in a spine stretch, reaching the front arm toward the opposite foot, little finger moving toward little toe, while the back arm reaches behind with the palm facing the ceiling. Breathe in as you rebuild the spine and return to upright, then rotate to the other side. Repeat this sequence 10 times, alternating sides.'
WHERE movement_number = 11;

UPDATE movements
SET narrative = 'This is leg pull prone. Begin in a prone base position, resting on your forearms with the legs extended straight behind you, toes pointed and head in neutral. Draw the abdominals gently away from the mat, lengthening the spine while keeping the pubic bone in contact with the floor. To progress, lift the hips away from the mat so the weight is supported on the knees and forearms, maintaining a neutral spine in this static hold. To progress further, curl the toes under and straighten the legs, bringing the body into a full forearm plank, hips lifted and spine long. For the full version, straighten the arms to come up onto the hands. Keep the legs slightly apart and the head neutral. On the out-breath, lengthen and lift one leg to hip height; breathe in as you place it back down. Repeat on the opposite leg, performing this sequence 10 times.'
WHERE movement_number = 25;

UPDATE movements
SET narrative = 'This is leg pull supine. Begin in seated base with the hands placed flat on the floor slightly behind the hips, fingers pointing in toward the glutes and feet in dorsiflexion. On the out-breath, press through the hands and heels to lift the hips up toward the ceiling, forming a straight line from ankles to knees to hips, and point the toes into plantar flexion. Take a breath in to stabilise, and on the out-breath float one leg up, keeping the toes pointed; lower the leg back down on the in-breath. Repeat on the opposite leg, alternating sides for 10 repetitions, then gently lower the hips back to the mat.'
WHERE movement_number = 26;

UPDATE movements
SET narrative = 'This is Side kick kneeling. Start kneeling on the mat and lean the torso over to one side, placing the supporting hand lightly on the floor with the fingers touching the mat. On the opposite side, extend the leg out to the side, lengthening through the leg and pointing the toes. Place the free hand behind the head with the elbow pointing outward. Breathe in as you lengthen and lift the extended leg off the floor. Breathe out as you gently kick the leg forward, and breathe in as you return it to the start position. Perform 5 cycles on one side, then change sides and repeat.'
WHERE movement_number = 27;

UPDATE movements
SET narrative = 'This is the Boomerang. Set up in seated neutral with the legs extended and the ankles crossed. Hinge forward slightly from the hips, lengthening the spine, and reach the arms behind you with the palms facing up beside the hips. Breathe in as you roll back onto the shoulder blades, allowing the arms to reach forward as the legs sweep overhead. Switch the cross of the ankles, then breathe out as you roll forward, returning to the starting position with control. Repeat the movement, alternating the crossed position of the ankles each time, for a total of 10 repetitions.'
WHERE movement_number = 29;

UPDATE movements
SET narrative = 'This is the SEAL.
Begin in seated neutral with the knees bent and the soles of the feet together.
Thread the arms inside the legs and take hold of the outside of the ankles, lifting the feet slightly off the mat into your balanced position.
Breathe in as you roll back onto the shoulder blades, maintaining the rounded spine shape.
Breathe out as you roll forward, returning to balance at the top.
Repeat this smooth rocking motion 10 times.'
WHERE movement_number = 30;

UPDATE movements
SET narrative = 'This is the Crab. Set up in seated neutral with your knees bent and the ankles crossed, taking hold of each foot with the opposite hand. Lift the feet off the mat into a balanced position. Breathe in as you roll back onto the shoulder blades, switching the cross of the ankles at the back. Breathe out as you roll forward and return to the balanced seated position. Repeat this flowing action 10 times.'
WHERE movement_number = 31;

UPDATE movements
SET narrative = 'This is Rocking. Set up in a prone base position. Bend both knees and reach back to hold your feet, gently drawing the heels in toward the glutes. Breathe in to prepare and on the out-breath lift the head and chest away from the mat, pressing the feet into the hands. Breathe in as you rock the body forward, and continue to rock back and forth with a smooth, flowing motion, keeping the front of the body open. Repeat up to 10 times, then gently release and lower back to the mat.'
WHERE movement_number = 32;

UPDATE movements
SET narrative = 'This is the Control Balance. Lie in supine neutral with the arms extended overhead. Breathe out as you lift both legs up and over the face until they come parallel to the floor behind you, balancing the weight between the shoulder blades. Breathe in as you lengthen one leg up toward the ceiling, keeping the pelvis stable. Breathe out as you switch legs, lowering one and lifting the other. Repeat this controlled leg change 10 times on each side, then gently roll the spine back down onto the mat.'
WHERE movement_number = 33;

UPDATE movements
SET narrative = 'This is Push-up. Stand in neutral at the back of your mat. Breathe in to prepare and breathe out as you roll the spine down toward the floor, taking another in-breath as you approach the mat. Breathe out as you walk the hands forward into a box position, placing the hands slightly wider than shoulder-width with the knees under the hips. Breathe in as you bend the elbows to lower the chest and breathe out as you press back up to the box. Breathe in as you walk the hands back toward the feet and breathe out as you roll the spine back up to standing. Repeat this sequence 10 times. To progress, on the next journey forward, walk the hands further out so the knees, hips, and shoulders form a long straight line. For the full version, walk out to the length of the body and perform the push-up with ankles, knees, hips, and shoulders aligned.'
WHERE movement_number = 34;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after executing the updates to verify all narratives are populated:
--
-- SELECT movement_number, name,
--        CASE
--          WHEN narrative IS NULL THEN 'MISSING'
--          WHEN LENGTH(narrative) < 50 THEN 'TOO SHORT'
--          ELSE 'OK'
--        END as narrative_status,
--        LENGTH(narrative) as narrative_length
-- FROM movements
-- ORDER BY movement_number;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Movement #1 (The Hundred) was already updated manually by user
-- This script updates ALL remaining movements: 2-34
-- Movement 14 (Double Leg Kick) and 30 (Seal) were provided separately
-- Total movements in this script: 33 (movements 2-34)
-- Total movements with #1: 34 (complete set of classical Pilates movements)
-- ============================================================================
