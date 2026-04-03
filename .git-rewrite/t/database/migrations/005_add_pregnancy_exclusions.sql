-- Migration 005: Add Pregnancy and Medical Contraindication Exclusions
-- Created: 2025-11-17
-- Purpose: CRITICAL SAFETY - Prevent pregnant users from using the app
--          Pilates movements can be harmful during pregnancy without professional supervision

-- ============================================================================
-- ADD MEDICAL CONTRAINDICATIONS TO STUDENT PROFILES
-- ============================================================================

-- Add is_pregnant flag (explicit exclusion)
ALTER TABLE student_profiles
ADD COLUMN is_pregnant BOOLEAN DEFAULT FALSE NOT NULL;

-- Add medical contraindications array
ALTER TABLE student_profiles
ADD COLUMN medical_contraindications TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add last_medical_status_check timestamp
ALTER TABLE student_profiles
ADD COLUMN last_medical_status_check TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- ADD DISCLAIMER ACCEPTANCE TO USERS TABLE
-- ============================================================================

ALTER TABLE users
ADD COLUMN medical_disclaimer_accepted BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE users
ADD COLUMN medical_disclaimer_accepted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users
ADD COLUMN medical_disclaimer_version VARCHAR(10) DEFAULT '1.0';

-- ============================================================================
-- CREATE MEDICAL EXCLUSIONS TABLE (for audit trail)
-- ============================================================================

CREATE TABLE medical_exclusions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    exclusion_type VARCHAR(50) NOT NULL, -- 'pregnancy', 'injury', 'medical_condition'
    exclusion_reason TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_taken TEXT NOT NULL, -- 'app_access_denied', 'class_generation_blocked', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medical_exclusions_user ON medical_exclusions_log(user_id);
CREATE INDEX idx_medical_exclusions_student ON medical_exclusions_log(student_profile_id);
CREATE INDEX idx_medical_exclusions_type ON medical_exclusions_log(exclusion_type);

-- ============================================================================
-- CREATE FUNCTION TO CHECK PREGNANCY STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_pregnancy_exclusion(
    p_user_id UUID DEFAULT NULL,
    p_student_profile_id UUID DEFAULT NULL
)
RETURNS TABLE(
    is_excluded BOOLEAN,
    exclusion_reason TEXT,
    severity VARCHAR(20)
) AS $$
BEGIN
    -- Check if user or student profile indicates pregnancy
    IF p_student_profile_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            TRUE as is_excluded,
            'PREGNANCY DETECTED: This application cannot be used during pregnancy. Pilates movements require professional supervision during pregnancy.' as exclusion_reason,
            'CRITICAL' as severity
        FROM student_profiles
        WHERE id = p_student_profile_id
        AND is_pregnant = TRUE;
    END IF;

    -- Check for pregnancy in medical contraindications
    IF p_student_profile_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            TRUE as is_excluded,
            'PREGNANCY CONTRAINDICATION: Pregnancy listed in medical contraindications. App access denied.' as exclusion_reason,
            'CRITICAL' as severity
        FROM student_profiles
        WHERE id = p_student_profile_id
        AND 'pregnancy' = ANY(medical_contraindications);
    END IF;

    -- If no exclusions found, return safe
    IF NOT EXISTS (
        SELECT 1 FROM student_profiles
        WHERE id = p_student_profile_id
        AND (is_pregnant = TRUE OR 'pregnancy' = ANY(medical_contraindications))
    ) THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'SAFE'::VARCHAR(20);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGER TO LOG PREGNANCY DETECTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_pregnancy_detection()
RETURNS TRIGGER AS $$
BEGIN
    -- If pregnancy status changed to TRUE, log it
    IF NEW.is_pregnant = TRUE AND (OLD.is_pregnant IS NULL OR OLD.is_pregnant = FALSE) THEN
        INSERT INTO medical_exclusions_log (
            student_profile_id,
            user_id,
            exclusion_type,
            exclusion_reason,
            action_taken
        ) VALUES (
            NEW.id,
            (SELECT instructor_id FROM student_profiles WHERE id = NEW.id),
            'pregnancy',
            'Student marked as pregnant - all class generation blocked',
            'app_access_denied'
        );
    END IF;

    -- If pregnancy added to contraindications, log it
    IF 'pregnancy' = ANY(NEW.medical_contraindications) AND
       (OLD.medical_contraindications IS NULL OR NOT ('pregnancy' = ANY(OLD.medical_contraindications))) THEN
        INSERT INTO medical_exclusions_log (
            student_profile_id,
            user_id,
            exclusion_type,
            exclusion_reason,
            action_taken
        ) VALUES (
            NEW.id,
            (SELECT instructor_id FROM student_profiles WHERE id = NEW.id),
            'pregnancy',
            'Pregnancy added to medical contraindications',
            'app_access_denied'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_pregnancy_detection
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_pregnancy_detection();

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN student_profiles.is_pregnant IS
'CRITICAL SAFETY: If TRUE, user is EXCLUDED from all app features. Pilates during pregnancy requires professional supervision.';

COMMENT ON COLUMN student_profiles.medical_contraindications IS
'Array of medical conditions that exclude app usage: pregnancy, severe injuries, etc.';

COMMENT ON COLUMN users.medical_disclaimer_accepted IS
'User must accept medical disclaimer before using app. Disclaimer explicitly excludes pregnant users.';

COMMENT ON TABLE medical_exclusions_log IS
'Audit trail of medical exclusions for liability protection and safety monitoring';

COMMENT ON FUNCTION check_pregnancy_exclusion IS
'Validates whether user/student profile has pregnancy exclusion. Returns CRITICAL severity if pregnant.';
