-- =====================================================
-- MIGRATION: Populate Soccer Sport Exercises
-- Date: March 2024
-- Description: Adds Soccer-specific Pilates exercises to sport_exercises table
-- =====================================================

-- Clear any existing Soccer data first
DELETE FROM sport_exercises WHERE sport = 'soccer';

-- Insert Soccer exercises
INSERT INTO sport_exercises (sport, exercise_name, category, description, sport_relevance, injury_prevention, position_specific, variations, muscle_groups)
VALUES
-- Warm-up exercises
('soccer', 'The Hundred', 'Warm-up',
'Pump arms vigorously while holding legs in tabletop or extended at 45 degrees. 100 total pumps with 5-count breathing pattern.',
'Essential for soccer players to build the core endurance needed for 90 minutes of play. The controlled breathing pattern helps manage exertion during sustained running.',
'Strengthens deep transverse abdominis which stabilizes the pelvis during running and kicking. Reduces lower back strain from repetitive kicking motions.',
'Particularly beneficial for central midfielders who cover the most distance. Goalkeepers benefit from the core stability for diving saves.',
NULL,
ARRAY['core', 'breathing', 'endurance']),

('soccer', 'Roll-Up', 'Warm-up',
'Sequential spinal articulation from supine to seated forward fold. Arms reach overhead then forward.',
'Develops the spinal flexibility needed for overhead kicks and throw-ins. Teaches controlled deceleration important for injury prevention.',
'Promotes proper spinal mechanics reducing disc injury risk. Strengthens eccentric control of abdominals preventing muscle strains during shooting.',
'Defenders benefit from improved spine flexibility for clearing headers. Useful for all players recovering from back stiffness.',
NULL,
ARRAY['core', 'spine_flexibility', 'control']),

('soccer', 'Single Leg Circles', 'Warm-up',
'Controlled hip circles with one leg while maintaining pelvic stability. 5-10 circles each direction.',
'Mimics the hip mobility required for passing and ball control. Develops independent hip movement crucial for deceptive body feints.',
'Addresses hip impingement common in soccer players. Strengthens hip stabilizers preventing groin strains.',
'Essential for wingers and playmakers who rely on hip mobility for dribbling. Helps all positions maintain healthy hip function.',
NULL,
ARRAY['hip_mobility', 'core_stability', 'flexibility']),

('soccer', 'Rolling Like a Ball', 'Warm-up',
'Balance on tailbone, roll back to shoulder blades and return to balance. Maintain C-curve spine.',
'Develops the body awareness needed for controlling falls and recovering quickly after tackles. Enhances proprioception for ball control.',
'Massages spine and teaches safe falling mechanics. Reduces impact injuries from collisions.',
'Valuable for all players, especially those in physical defensive positions who experience frequent contact.',
NULL,
ARRAY['balance', 'spine_mobility', 'core']),

-- Core strengthening
('soccer', 'Single Leg Stretch', 'Core',
'Alternate knee to chest pulls while maintaining neutral pelvis. Head and shoulders remain lifted.',
'Directly relates to the running motion and single-leg stability required during kicking. Builds core control during dynamic leg movements.',
'Prevents hip flexor strains common in soccer. Addresses muscle imbalances between dominant and non-dominant legs.',
'Critical for strikers who need powerful, accurate shots. All positions benefit from improved running mechanics.',
NULL,
ARRAY['core', 'hip_flexors', 'coordination']),

('soccer', 'Double Leg Stretch', 'Core',
'Simultaneous arm and leg extension from center. Challenges full-body coordination.',
'Builds explosive power for jumping headers and quick sprints. Develops the core control needed for aerial challenges.',
'Strengthens the anterior chain preventing abdominal strains. Protects spine during jumping and landing.',
'Particularly important for center-backs and strikers who compete for headers frequently.',
NULL,
ARRAY['core', 'power', 'coordination']),

('soccer', 'Criss-Cross', 'Core',
'Rotational exercise bringing elbow toward opposite knee. Emphasizes oblique engagement.',
'Directly trains the rotational power needed for shooting and long passing. Essential for developing a powerful shot across the body.',
'Builds balanced rotational strength preventing one-sided development. Reduces risk of oblique strains during shooting.',
'Crucial for midfielders and forwards who need to shoot with both feet from various angles.',
NULL,
ARRAY['obliques', 'rotation', 'core']),

-- Lower body strength
('soccer', 'Shoulder Bridge', 'Lower Body',
'Articulated bridge with optional single-leg variations. Focus on glute activation.',
'Develops the glute power essential for sprinting speed and jumping ability. Key for explosive first step acceleration.',
'Prevents hamstring injuries by improving glute activation. Addresses quad dominance common in soccer players.',
'Critical for all positions but especially fullbacks and wingers who need repeated sprint ability.',
NULL,
ARRAY['glutes', 'hamstrings', 'core']),

('soccer', 'Side Kicks', 'Lower Body',
'Side-lying leg movements: forward/back, up/down, circles. Maintain neutral pelvis.',
'Develops the hip strength and mobility needed for passing accuracy and defensive sliding tackles.',
'Strengthens hip abductors crucial for knee stability during cutting movements. Prevents IT band syndrome.',
'Essential for defenders who need strong lateral movement. Benefits all players'' agility and change of direction.',
NULL,
ARRAY['hips', 'abductors', 'stability']),

('soccer', 'Single Leg Kick', 'Lower Body',
'Prone hamstring curls with focus on glute engagement. Alternate legs with double pulse.',
'Builds hamstring strength essential for sprinting speed and deceleration control.',
'Directly addresses hamstring injury prevention - the most common injury in soccer. Promotes balanced development.',
'Critical for all positions, especially important for players returning from hamstring injuries.',
NULL,
ARRAY['hamstrings', 'glutes', 'prevention']),

('soccer', 'Double Leg Kick', 'Lower Body',
'Both legs kick simultaneously while prone, combine with back extension.',
'Develops posterior chain power for sprinting and jumping. Builds back strength for physical contests.',
'Strengthens entire posterior chain reducing injury risk. Counteracts forward-leaning posture from running.',
'Beneficial for all players to maintain posterior chain health throughout season.',
NULL,
ARRAY['posterior_chain', 'back', 'hamstrings']),

-- Full body integration
('soccer', 'Teaser', 'Full Body',
'V-sit position balancing on sit bones. Advanced core control exercise.',
'Builds exceptional core strength for maintaining balance during skills and aerial challenges.',
'Develops deep stabilizers protecting spine during rotational movements and impacts.',
'Advanced exercise for experienced players seeking elite core control.',
NULL,
ARRAY['core', 'balance', 'control']),

('soccer', 'Swimming', 'Full Body',
'Prone opposite arm/leg lifts in swimming motion. Focus on length and control.',
'Develops cross-body coordination essential for running efficiency and maintaining balance during skills.',
'Strengthens posterior chain preventing lower back pain. Improves running mechanics reducing energy expenditure.',
'Valuable for all positions to improve movement efficiency over 90 minutes.',
NULL,
ARRAY['back', 'coordination', 'endurance']),

('soccer', 'Plank to Push-Up', 'Full Body',
'Transition between forearm plank and high plank. Maintain neutral spine throughout.',
'Builds upper body strength for throw-ins and physical contests. Develops core stability under fatigue.',
'Prevents shoulder injuries while building functional pushing strength. Develops anti-rotation stability.',
'Important for all players involved in physical battles for possession.',
NULL,
ARRAY['shoulders', 'core', 'strength']),

-- Balance and proprioception
('soccer', 'Single Leg Balance Series', 'Balance',
'Standing on one leg with various arm movements and challenges.',
'Directly applicable to ball control skills and maintaining balance while shielding the ball.',
'Crucial for ankle injury prevention. Develops proprioception reducing risk of sprains on uneven surfaces.',
'Essential for all positions, particularly important for players with history of ankle injuries.',
NULL,
ARRAY['balance', 'ankles', 'proprioception']),

('soccer', 'Standing Roll Down', 'Balance',
'Standing spinal articulation to forward fold. Focus on weight distribution.',
'Teaches proper mechanics for picking up the ball and recovering from low positions.',
'Prevents back injuries by promoting proper bending patterns. Improves hamstring flexibility safely.',
'Useful for all players as a warm-up and cool-down exercise.',
NULL,
ARRAY['spine', 'hamstrings', 'control']),

-- Flexibility and recovery
('soccer', 'Spine Stretch Forward', 'Flexibility',
'Seated forward fold emphasizing spinal articulation rather than hamstring stretch.',
'Improves spine flexibility for varied movements. Helps recovery between training sessions.',
'Decompresses spine after impact and running. Reduces risk of disc injuries.',
'Important recovery exercise for all players after matches and training.',
NULL,
ARRAY['spine', 'flexibility', 'recovery']),

('soccer', 'Saw', 'Flexibility',
'Seated rotation with forward reach. Combines rotation with hamstring stretch.',
'Develops the thoracic rotation needed for scanning field while running. Improves passing range of motion.',
'Addresses thoracic stiffness common in soccer players. Prevents compensatory lower back rotation.',
'Particularly valuable for midfielders who need excellent field vision and passing range.',
NULL,
ARRAY['rotation', 'hamstrings', 'thoracic']),

('soccer', 'Mermaid Stretch', 'Flexibility',
'Lateral spine stretch in Z-sit position. Focus on length through side body.',
'Improves lateral flexibility for reaching during slide tackles and maintaining balance during physical challenges.',
'Addresses IT band and lateral chain tightness. Prevents rib and oblique strains.',
'Beneficial for all positions, especially defenders who frequently use sliding tackles.',
NULL,
ARRAY['lateral_flexibility', 'obliques', 'recovery']),

-- Power development
('soccer', 'Leg Pull Front', 'Power',
'Plank position with single leg lifts. Maintain level pelvis throughout.',
'Builds the anti-rotational stability needed during single-leg actions like shooting and passing.',
'Develops core stability preventing lower back injuries during kicking. Strengthens shoulders for physical play.',
'Essential for all players to maintain trunk stability during dynamic movements.',
NULL,
ARRAY['core', 'stability', 'shoulders']),

('soccer', 'Leg Pull Back', 'Power',
'Reverse plank with leg lifts. Challenges posterior chain and shoulder stability.',
'Develops power for backward movement and defensive recovery runs. Builds shoulder strength for physical contests.',
'Strengthens often-neglected posterior chain. Prevents shoulder injuries from falls and collisions.',
'Particularly important for defenders who frequently track back and engage physically.',
NULL,
ARRAY['posterior_chain', 'shoulders', 'power']),

('soccer', 'Kneeling Side Kicks', 'Power',
'Side plank position with dynamic leg movements. Advanced lateral stability exercise.',
'Develops the lateral power needed for quick direction changes and defensive sliding movements.',
'Strengthens lateral stabilizers crucial for ACL injury prevention. Builds resilience for cutting movements.',
'Critical for all positions, especially wingers and fullbacks who rely on lateral movement.',
NULL,
ARRAY['lateral_power', 'stability', 'prevention']),

-- Sport-specific adaptations
('soccer', 'Scissors', 'Sport-Specific',
'Rapid alternating straight leg movements. Emphasize speed and control.',
'Mimics the rapid leg movements in stepovers and quick feet drills. Develops hip flexor endurance.',
'Prevents hip flexor strains through controlled strengthening. Addresses imbalances from kicking.',
'Excellent for forwards and wingers who use quick footwork to beat defenders.',
NULL,
ARRAY['hip_flexors', 'speed', 'agility']),

('soccer', 'Bicycle', 'Sport-Specific',
'Cycling motion while supine. Can progress to include upper body rotation.',
'Simulates running motion while reducing impact. Excellent for maintaining fitness during injury recovery.',
'Low-impact conditioning protecting joints. Maintains cardiovascular fitness without stress.',
'Useful for all players during recovery periods or as active recovery between matches.',
NULL,
ARRAY['cardio', 'recovery', 'endurance']),

('soccer', 'Control Balance', 'Sport-Specific',
'Advanced balance exercise on shoulders with leg movements.',
'Develops exceptional body control for acrobatic skills like bicycle kicks and overhead clearances.',
'Builds total body awareness reducing injury risk during falls and collisions.',
'Advanced skill for players comfortable with inversions and seeking elite body control.',
NULL,
ARRAY['control', 'awareness', 'advanced']),

-- Injury prevention focus
('soccer', 'Clam Shells', 'Prevention',
'Side-lying hip external rotation. Focus on glute medius activation.',
'Strengthens hip stabilizers crucial for knee alignment during cutting and landing.',
'Primary ACL injury prevention exercise. Addresses weak glute medius common in soccer players.',
'Essential for all players, mandatory for those with previous knee injuries.',
NULL,
ARRAY['glutes', 'knee_stability', 'prevention']),

('soccer', 'Bird Dog', 'Prevention',
'Quadruped opposite arm/leg raises. Maintain neutral spine throughout.',
'Develops core stability for maintaining posture during long matches. Improves running efficiency.',
'Prevents lower back pain through improved core endurance. Addresses asymmetries from kicking.',
'Important for all players to maintain spinal health throughout season.',
NULL,
ARRAY['core', 'back', 'stability']),

('soccer', 'Wall Sits', 'Prevention',
'Isometric squat hold against wall. Progress by adding single-leg variations.',
'Builds quadriceps endurance for maintaining defensive stance and repeated jumping.',
'Develops balanced quad strength protecting knees. Builds fatigue resistance.',
'Particularly important for defenders and goalkeepers who maintain low stances.',
NULL,
ARRAY['quads', 'endurance', 'knees']),

-- Cool-down and recovery
('soccer', 'Child''s Pose', 'Recovery',
'Resting position with arms extended or by sides. Focus on breathing.',
'Promotes recovery between high-intensity drills. Reduces stress and promotes mental clarity.',
'Decompresses spine and relaxes hip flexors. Encourages parasympathetic recovery.',
'Essential cool-down for all players after training and matches.',
NULL,
ARRAY['recovery', 'relaxation', 'breathing']),

('soccer', 'Supine Spinal Twist', 'Recovery',
'Lying rotation with knees to one side. Hold for extended periods.',
'Releases tension from rotational movements. Helps recovery from shooting and passing repetitions.',
'Addresses lower back tightness preventing chronic pain. Improves rotation range of motion.',
'Important recovery tool for all players, especially after heavy training loads.',
NULL,
ARRAY['spine', 'recovery', 'flexibility']),

('soccer', 'Figure 4 Stretch', 'Recovery',
'Supine hip external rotation stretch. Target piriformis and deep hip rotators.',
'Addresses hip tightness from running and kicking. Improves hip mobility for technical skills.',
'Prevents piriformis syndrome and sciatic pain. Maintains healthy hip function.',
'Crucial for players experiencing hip or lower back discomfort.',
NULL,
ARRAY['hips', 'flexibility', 'recovery']),

-- Advanced conditioning
('soccer', 'Boomerang', 'Advanced',
'Complex exercise combining teaser, open leg rocker, and seal. Requires significant control.',
'Develops the complex coordination patterns needed for advanced soccer skills and aerial control.',
'Builds exceptional core strength and body awareness preventing injuries during complex movements.',
'Advanced exercise for elite players seeking maximum body control and coordination.',
NULL,
ARRAY['coordination', 'advanced', 'control']),

('soccer', 'Star', 'Advanced',
'Side plank with top leg and arm lifted. Hold position with perfect alignment.',
'Builds the lateral strength needed for powerful side volleys and maintaining balance during challenges.',
'Develops exceptional lateral stability preventing ankle and knee injuries during lateral movements.',
'Advanced exercise for players with strong foundation seeking elite lateral control.',
NULL,
ARRAY['lateral_strength', 'balance', 'advanced']),

('soccer', 'Snake/Twist', 'Advanced',
'Advanced spinal rotation exercise from plank position. Requires significant strength and mobility.',
'Develops rotational power for shooting while off-balance. Builds core strength for aerial challenges.',
'Strengthens entire core complex preventing injuries during rotational impacts.',
'Elite exercise for experienced players comfortable with complex movement patterns.',
NULL,
ARRAY['rotation', 'advanced', 'power']);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sport_exercises_soccer ON sport_exercises(sport) WHERE sport = 'soccer';
CREATE INDEX IF NOT EXISTS idx_sport_exercises_soccer_category ON sport_exercises(sport, category) WHERE sport = 'soccer';