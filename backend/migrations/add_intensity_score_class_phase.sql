-- Migration: Add intensity_score and class_phase to movements table
-- Purpose: Implement instructor feedback improvements for intelligent class sequencing
-- Author: Claude Code
-- Date: 2026-03-29

-- Add intensity_score column (1-10 scale indicating warmth demand)
ALTER TABLE movements
ADD COLUMN intensity_score INTEGER
CHECK (intensity_score BETWEEN 1 AND 10);

COMMENT ON COLUMN movements.intensity_score IS
'Warmth demand on a scale of 1-10. Low scores (1-3) are suitable for first 5 minutes cold, high scores (7-10) require full warm-up. This is separate from difficulty - a beginner movement may still require warm-up.';

-- Add class_phase column (position hint in class timeline)
ALTER TABLE movements
ADD COLUMN class_phase VARCHAR(20)
CHECK (class_phase IN ('warm_up', 'early_middle', 'peak', 'cool_down'));

COMMENT ON COLUMN movements.class_phase IS
'Recommended placement in class timeline: warm_up (1-3 intensity), early_middle (4-6), peak (7-9), cool_down (2-4). Used by sequencing algorithm to gate movement selection by class timeline.';

-- Create index for faster filtering by class_phase
CREATE INDEX idx_movements_class_phase ON movements(class_phase);

-- Create index for faster filtering by intensity_score
CREATE INDEX idx_movements_intensity_score ON movements(intensity_score);

-- Note: Values will be populated via UPDATE statements after web research validation
