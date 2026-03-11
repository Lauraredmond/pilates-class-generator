-- =====================================================
-- MIGRATION: Populate Rugby Sport Exercises
-- Date: March 2024
-- Description: Adds Rugby-specific Pilates exercises to sport_exercises table
-- =====================================================

-- Clear any existing Rugby data first
DELETE FROM sport_exercises WHERE sport = 'rugby';

-- Insert Rugby exercises
INSERT INTO sport_exercises (sport, exercise_name, category, description, sport_relevance, injury_prevention, position_specific, variations, muscle_groups)
VALUES
-- Warm-up and breathing
('rugby', 'The Hundred', 'Warm-up',
'100 arm pumps with controlled breathing pattern. Legs in tabletop or extended. 5 counts in, 5 counts out.',
'Builds the core endurance essential for maintaining strong body position in scrums and rucks. The breathing control helps manage exertion during intense physical contests.',
'Strengthens deep transverse abdominis protecting the spine during collisions. Develops breathing control crucial for recovery between plays.',
'Forwards benefit from enhanced core stability in scrums. Backs need this endurance for repeated sprint efforts.',
NULL,
ARRAY['core', 'breathing', 'endurance']),

('rugby', 'Roll-Up', 'Warm-up',
'Controlled spinal articulation from lying to seated. Focus on sequential vertebral movement.',
'Essential for developing the controlled forward fold needed in scrum binding and ruck clearance. Builds eccentric control for safe tackling technique.',
'Promotes proper spinal mechanics reducing disc injury risk from impact. Strengthens the controlled deceleration needed in contact situations.',
'Particularly important for forwards who spend time in compressed positions. All players benefit from spine mobility.',
NULL,
ARRAY['spine', 'core', 'flexibility']),

('rugby', 'Rolling Like a Ball', 'Warm-up',
'Balance on sit bones, roll back to shoulders maintaining C-curve. Return to balance position.',
'Develops body awareness crucial for safely absorbing impact in tackles and maintaining balance after contact.',
'Teaches safe falling mechanics and spine protection. Reduces injury risk from uncontrolled falls.',
'Valuable for all positions, especially back row forwards and centers who experience frequent tackles.',
NULL,
ARRAY['balance', 'core', 'body_awareness']),

-- Core power development
('rugby', 'Single Leg Stretch', 'Core',
'Alternating knee pulls with elevated head and shoulders. Maintain neutral pelvis throughout.',
'Mimics the single-leg drive phase of scrummaging and the leg position during rucking. Builds unilateral stability.',
'Prevents hip flexor strains common in rugby. Addresses imbalances from favoring one side in scrums.',
'Critical for props and hookers who need independent leg control in scrums. Benefits all players'' running mechanics.',
NULL,
ARRAY['core', 'hip_flexors', 'stability']),

('rugby', 'Double Leg Stretch', 'Core',
'Full body extension and contraction from center. Arms overhead, legs to 45 degrees.',
'Builds explosive power needed for lineout lifting and powerful tackles. Develops full-body coordination.',
'Strengthens anterior chain preventing abdominal tears. Protects spine during jumping and impact.',
'Essential for locks and lineout specialists. All players benefit from explosive power development.',
NULL,
ARRAY['core', 'power', 'coordination']),

('rugby', 'Criss-Cross', 'Core',
'Rotational core exercise with elbow to opposite knee. Emphasize thoracic rotation.',
'Develops rotational power for passing, especially important for scrum-halves and fly-halves making passes from the ground.',
'Builds balanced oblique strength preventing one-sided development from preferential passing side.',
'Crucial for halfbacks and centers who pass frequently. Benefits all players'' rotational stability.',
NULL,
ARRAY['obliques', 'rotation', 'core']),

('rugby', 'Double Straight Leg', 'Core',
'Lower both straight legs maintaining neutral spine. Hands support lower back.',
'Builds the deep core strength needed to maintain body position against opposition pressure in mauls and scrums.',
'Protects lower back during heavy lifting in lineouts. Strengthens core for impact absorption.',
'Critical for forwards involved in set pieces. Important for all players'' core resilience.',
NULL,
ARRAY['core', 'lower_abs', 'stability']),

-- Power and strength
('rugby', 'Teaser', 'Power',
'V-sit balance position. Most challenging core exercise requiring strength and control.',
'Develops exceptional core power for dominating contact situations and maintaining strong body position.',
'Builds deep stabilizer strength protecting spine during collisions. Enhances total body control.',
'Advanced exercise for experienced players seeking elite core strength.',
NULL,
ARRAY['core', 'balance', 'power']),

('rugby', 'Shoulder Bridge', 'Power',
'Articulated bridge focusing on glute activation. Progress to single-leg variations.',
'Develops the glute power essential for explosive scrummaging and powerful acceleration from breakdowns.',
'Prevents hamstring injuries by improving glute activation patterns. Critical for posterior chain health.',
'Essential for all forwards in scrums. Backs benefit from improved sprint power.',
NULL,
ARRAY['glutes', 'hamstrings', 'power']),

('rugby', 'Push-Up Series', 'Power',
'Various push-up positions with Pilates principles. Include wide, narrow, and single-leg variations.',
'Builds upper body pushing power for fending off tackles and dominating contact. Essential for hand-off strength.',
'Develops balanced shoulder strength preventing injuries from impacts. Builds functional pushing patterns.',
'Critical for all players involved in contact. Props and locks need exceptional pushing strength.',
NULL,
ARRAY['chest', 'shoulders', 'triceps']),

-- Lower body strength
('rugby', 'Side Kicks', 'Lower Body',
'Side-lying leg series: forward/back, up/down, circles. Maintain neutral spine.',
'Develops hip stability crucial for maintaining strong positions in rucks and effective footwork in defence.',
'Strengthens hip abductors preventing knee injuries from lateral impacts. Addresses IT band issues.',
'Important for all positions, especially flankers who need lateral mobility at breakdowns.',
NULL,
ARRAY['hips', 'abductors', 'stability']),

('rugby', 'Single Leg Kick', 'Lower Body',
'Prone hamstring curls with double pulse. Focus on glute-hamstring connection.',
'Builds hamstring strength essential for powerful running and safe scrummaging positions.',
'Primary prevention for hamstring injuries - the most common soft tissue injury in rugby.',
'Critical for wingers and fullbacks who sprint frequently. All players need hamstring resilience.',
NULL,
ARRAY['hamstrings', 'glutes', 'prevention']),

('rugby', 'Double Leg Kick', 'Lower Body',
'Both legs kick with back extension. Combines posterior chain strengthening.',
'Develops the posterior power needed for driving through contact and maintaining strong defensive lines.',
'Counteracts forward head posture from scrummaging. Builds balanced posterior strength.',
'Particularly important for front row forwards. Benefits all players'' posture and power.',
NULL,
ARRAY['posterior_chain', 'back', 'hamstrings']),

('rugby', 'Scissors', 'Lower Body',
'Rapid alternating straight leg movements. Quick tempo with control.',
'Develops hip flexor power for high knee drive when breaking tackles and rapid footwork at the breakdown.',
'Prevents hip flexor strains through controlled strengthening. Addresses kicking imbalances.',
'Excellent for outside backs needing acceleration. Useful for all players'' agility.',
NULL,
ARRAY['hip_flexors', 'agility', 'speed']),

-- Back strengthening
('rugby', 'Swimming', 'Back',
'Prone opposite arm/leg lifts in swimming pattern. Focus on length and control.',
'Builds the cross-body coordination needed for maintaining balance through contact and efficient running patterns.',
'Strengthens entire posterior chain preventing lower back injuries from impact.',
'Essential for all players to maintain back health throughout the season.',
NULL,
ARRAY['back', 'coordination', 'endurance']),

('rugby', 'Swan Dive', 'Back',
'Prone back extension with rocking motion. Advanced back strengthening exercise.',
'Develops the back strength needed for powerful scrummaging and maintaining position in mauls.',
'Builds resilience against compression forces in scrums. Prevents disc injuries.',
'Critical for forwards, especially front row. All players benefit from back strength.',
NULL,
ARRAY['back_extensors', 'power', 'control']),

('rugby', 'Rocking', 'Back',
'Prone back extension holding ankles, rock forward and back.',
'Builds posterior flexibility and strength simultaneously, important for powerful running and contact positions.',
'Addresses hip flexor tightness while strengthening back. Prevents compensation patterns.',
'Advanced exercise for players with good flexibility seeking performance gains.',
NULL,
ARRAY['back', 'hip_flexors', 'flexibility']),

-- Stability and balance
('rugby', 'Plank Variations', 'Stability',
'Front plank, side plank, and variations. Include leg lifts and arm reaches.',
'Develops the anti-rotational stability crucial for maintaining strong positions against opposition pressure.',
'Builds core stability in all planes protecting spine during multi-directional impacts.',
'Essential for all positions. Scrummagers need exceptional front plank strength.',
NULL,
ARRAY['core', 'stability', 'endurance']),

('rugby', 'Leg Pull Front', 'Stability',
'Plank with alternating leg lifts. Maintain level pelvis throughout.',
'Builds stability for maintaining body position while competing for ball at breakdown.',
'Develops balanced core strength preventing asymmetrical injuries from contact.',
'Important for all players, especially loose forwards competing at breakdowns.',
NULL,
ARRAY['core', 'shoulders', 'stability']),

('rugby', 'Leg Pull Back', 'Stability',
'Reverse plank with leg lifts. Challenges posterior chain stability.',
'Develops backward movement strength important for defensive positioning and maul defence.',
'Strengthens often-neglected posterior shoulders preventing injuries from backward falls.',
'Particularly valuable for defensive players and those involved in mauls.',
NULL,
ARRAY['posterior_chain', 'shoulders', 'stability']),

('rugby', 'Kneeling Side Kicks', 'Stability',
'Side plank on knee with leg movements. Advanced lateral stability exercise.',
'Develops lateral strength for maintaining position in scrums and resisting lateral pressure in rucks.',
'Critical for ACL prevention by strengthening lateral stabilizers. Protects knees from side impacts.',
'Essential for props dealing with lateral scrum pressure. Benefits all players'' knee stability.',
NULL,
ARRAY['lateral_stability', 'core', 'prevention']),

-- Flexibility and mobility
('rugby', 'Spine Stretch Forward', 'Flexibility',
'Seated forward fold emphasizing spinal articulation. Not a hamstring stretch.',
'Improves spinal flexibility for safe body positions in contact. Helps recovery between training.',
'Decompresses spine after compression from scrums and tackles. Maintains disc health.',
'Important recovery tool for all players, especially forwards after scrum sessions.',
NULL,
ARRAY['spine', 'flexibility', 'recovery']),

('rugby', 'Saw', 'Flexibility',
'Seated rotation with forward reach. Combines thoracic rotation with hamstring flexibility.',
'Develops rotational mobility for passing and scanning field. Important for distribution skills.',
'Addresses thoracic stiffness from impact. Prevents compensatory lower back rotation.',
'Particularly valuable for playmakers and halfbacks requiring passing range.',
NULL,
ARRAY['rotation', 'thoracic', 'hamstrings']),

('rugby', 'Mermaid Stretch', 'Flexibility',
'Lateral spine stretch in various positions. Emphasizes side body length.',
'Improves lateral flexibility for competing at breakdowns and reaching in tackles.',
'Addresses lateral chain tightness from scrummaging. Prevents rib injuries from impacts.',
'Beneficial for all positions, especially tight forwards with lateral tightness.',
NULL,
ARRAY['lateral_flexibility', 'obliques', 'ribs']),

('rugby', 'Seal', 'Flexibility',
'Rolling exercise with clapping feet. Playful spine mobilization.',
'Light recovery exercise promoting spine mobility and coordination. Good for team warm-ups.',
'Gentle spine massage helping recovery. Promotes relaxation between intense sessions.',
'Useful warm-up or cool-down for all players. Adds variety to training.',
NULL,
ARRAY['spine', 'coordination', 'recovery']),

-- Sport-specific power
('rugby', 'Hip Circles', 'Sport-Specific',
'Supported leg circles focusing on hip mobility and control.',
'Develops hip mobility crucial for effective rucking technique and maintaining low body positions.',
'Addresses hip impingement common in rugby players. Maintains healthy hip function.',
'Essential for forwards spending time in compressed positions. Benefits all players'' hip health.',
NULL,
ARRAY['hips', 'mobility', 'flexibility']),

('rugby', 'Cork-Screw', 'Sport-Specific',
'Legs circle together while maintaining stable torso. Advanced oblique exercise.',
'Develops rotational control for maintaining position against twisting forces in mauls and rucks.',
'Builds oblique strength preventing injuries from rotational impacts.',
'Advanced exercise for experienced players in contested positions.',
NULL,
ARRAY['obliques', 'control', 'core']),

('rugby', 'Boomerang', 'Sport-Specific',
'Complex flowing exercise combining multiple movements. Requires significant control.',
'Develops the complex movement patterns and body control needed for dynamic play.',
'Builds total body coordination reducing injury risk during unpredictable movements.',
'Advanced exercise for backs requiring agility and body control.',
NULL,
ARRAY['coordination', 'control', 'advanced']),

('rugby', 'Control Balance', 'Sport-Specific',
'Balance on shoulders with controlled leg movements. Advanced control exercise.',
'Develops exceptional body awareness for aerial contests and maintaining control through contact.',
'Builds proprioception reducing injury risk from falls and collisions.',
'Advanced skill for experienced players seeking elite body control.',
NULL,
ARRAY['balance', 'control', 'awareness']),

-- Injury prevention focus
('rugby', 'Clam Shells', 'Prevention',
'Side-lying hip external rotation. Essential glute medius activation.',
'Fundamental exercise for maintaining knee alignment during scrummaging and tackling.',
'Primary ACL injury prevention exercise. Addresses weak hip stabilizers common in rugby.',
'Mandatory for all players, especially those with previous knee injuries.',
NULL,
ARRAY['glutes', 'knee_stability', 'prevention']),

('rugby', 'Bird Dog', 'Prevention',
'Quadruped opposite arm/leg raises. Focus on maintaining neutral spine.',
'Develops core stability for maintaining strong positions during extended phases of play.',
'Prevents lower back pain through improved core endurance. Addresses asymmetries.',
'Important maintenance exercise for all players throughout season.',
NULL,
ARRAY['core', 'back', 'stability']),

('rugby', 'Dead Bug', 'Prevention',
'Supine opposite arm/leg lowering. Maintain neutral spine throughout.',
'Builds core control for protecting spine during impact while limbs are moving.',
'Develops deep core strength preventing back injuries during tackles.',
'Essential for all players exposed to regular contact.',
NULL,
ARRAY['core', 'coordination', 'prevention']),

-- Recovery and regeneration
('rugby', 'Child''s Pose', 'Recovery',
'Resting position with focus on breathing. Arms extended or by sides.',
'Promotes recovery between intense contact sessions. Reduces neural tension.',
'Decompresses spine after compression from scrums. Relaxes hip flexors and back.',
'Essential recovery tool for all players after training and matches.',
NULL,
ARRAY['recovery', 'relaxation', 'spine']),

('rugby', 'Supine Spinal Twist', 'Recovery',
'Lying rotation holding for extended periods. Focus on breathing and release.',
'Releases tension from rotational forces in contact. Aids recovery from intense sessions.',
'Addresses lower back tightness preventing chronic pain. Maintains rotation range.',
'Important recovery tool, especially after heavy contact training.',
NULL,
ARRAY['spine', 'recovery', 'rotation']),

('rugby', 'Hip Flexor Stretch', 'Recovery',
'Kneeling hip flexor stretch with posterior pelvic tilt. Hold for extended duration.',
'Addresses hip flexor tightness from scrummaging and running. Critical for front row forwards.',
'Prevents lower back pain by releasing hip flexor tension. Maintains pelvic alignment.',
'Essential for props and hookers. Beneficial for all players after running sessions.',
NULL,
ARRAY['hip_flexors', 'flexibility', 'recovery']),

('rugby', 'Foam Rolling Series', 'Recovery',
'Systematic foam rolling of major muscle groups. Emphasis on problem areas.',
'Accelerates recovery between training sessions. Maintains tissue quality throughout season.',
'Reduces muscle tension preventing overuse injuries. Improves movement quality.',
'Critical recovery tool for all players managing high training loads.',
NULL,
ARRAY['recovery', 'tissue_quality', 'maintenance']);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sport_exercises_rugby ON sport_exercises(sport) WHERE sport = 'rugby';
CREATE INDEX IF NOT EXISTS idx_sport_exercises_rugby_category ON sport_exercises(sport, category) WHERE sport = 'rugby';