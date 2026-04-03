-- Migration: Insert 3 new sequence rules (Instructor Feedback - March 2026)
-- Purpose: Document intensity gating, positional continuity, and position budget rules
-- Date: 2026-03-29
-- Existing rules: 4-23 (20 rules)
-- New rules: 24-26 (3 rules)
-- SAFE VERSION: Uses ON CONFLICT DO NOTHING to prevent duplicate key errors

INSERT INTO sequence_rules
(rule_number, description, rule_type, is_required, enforcement_level, created_at, updated_at)
VALUES

-- RULE 24: Intensity Phase Gating (IMPROVEMENT 1)
(24,
 'Movements are restricted by class timeline position based on their intensity_score and class_phase values. First 20% of class: warm_up only (intensity 1-3). Next 45% (20-65%): warm_up + early_middle (intensity 1-6). Peak zone (65-85%): all phases including peak movements (intensity 7-10). Final 15% (85-100%): warm_up + cool_down only. Prevents high-demand movements (Teaser, Swan Dive, Jack Knife) from appearing before the body is properly warmed up.',
 'safety',
 true,
 'strict',
 NOW(),
 NOW()),

-- RULE 25: Positional Continuity Preference (IMPROVEMENT 2)
(25,
 'When candidate movements score similarly on muscle balance, prefer movements that keep the same body position (supine, prone, seated, side-lying, standing, kneeling) as the previous movement. This reduces fragmented position jumping while maintaining muscle safety as the top priority. Applied as a soft bonus weight (+0.15) that is always smaller than the muscle-overuse penalty. Configurable via POSITION_CONTINUITY_BONUS in config/sequencing_config.py. Expected to reduce position changes by 30-40%.',
 'quality',
 false,
 'recommended',
 NOW(),
 NOW()),

-- RULE 26: Position Change Budget (IMPROVEMENT 3)
(26,
 'The total number of body-position transitions in a generated class is capped at a configurable maximum (default: 40% of total movements). For example, a 10-movement class allows 4 position changes. When the budget is nearly exhausted (< 20% remaining), the positional continuity bonus doubles. When budget is fully exhausted, a penalty is applied to movements that would change position. This encourages natural flow grouping while allowing flexibility. Can be overridden via API parameter max_position_changes.',
 'quality',
 false,
 'recommended',
 NOW(),
 NOW())

-- Handle conflicts: If rule_number already exists, do nothing
ON CONFLICT (rule_number) DO NOTHING;

-- Verification query
SELECT rule_number, description, rule_type, enforcement_level
FROM sequence_rules
WHERE rule_number >= 24
ORDER BY rule_number;
