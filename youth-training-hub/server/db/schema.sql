-- Youth Training Hub Database Schema
-- PostgreSQL schema for multi-sport youth training visibility platform

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext"; -- For case-insensitive text

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS & AUTHENTICATION
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE user_role AS ENUM ('coach', 'parent', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ═══════════════════════════════════════════════════════════════════════════════
-- YOUTH PLAYERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE youths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code CHAR(6) UNIQUE NOT NULL,
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- Ensure code is uppercase and excludes ambiguous characters
    CONSTRAINT youth_code_format CHECK (code ~ '^[A-Z2-9]{6}$' AND code !~ '[01ILO]')
);

CREATE UNIQUE INDEX idx_youths_code_ci ON youths(UPPER(code));
CREATE INDEX idx_youths_parent ON youths(parent_user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TEAMS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE sport_type AS ENUM ('rugby', 'soccer', 'gaa');

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    sport sport_type NOT NULL,
    level VARCHAR(50), -- e.g., "Division 2", "U16"
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_coach ON teams(coach_user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TEAM-YOUTH LINKAGE (Many-to-Many via codes)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE team_youth_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    youth_code CHAR(6) NOT NULL,
    linked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, youth_code),
    FOREIGN KEY (youth_code) REFERENCES youths(code) ON DELETE CASCADE
);

CREATE INDEX idx_team_youth_links_team ON team_youth_links(team_id);
CREATE INDEX idx_team_youth_links_youth ON team_youth_links(youth_code);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COACH SESSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE coach_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    training_date TIMESTAMPTZ NOT NULL, -- When training happened
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- When logged
    template_name VARCHAR(100),
    notes TEXT,
    sport sport_type NOT NULL,
    team_name VARCHAR(100) NOT NULL, -- Denormalized for performance
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coach_sessions_team ON coach_sessions(team_id);
CREATE INDEX idx_coach_sessions_training_date ON coach_sessions(training_date);
CREATE INDEX idx_coach_sessions_recorded_at ON coach_sessions(recorded_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSION DRILLS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE session_drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
    drill_id VARCHAR(20) NOT NULL, -- e.g., "r-wu-1", "s-pp-2"
    name VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    notes TEXT,
    position INTEGER NOT NULL, -- Order in session
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_drills_session ON session_drills(session_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSION ATTENDANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
    youth_code CHAR(6) NOT NULL REFERENCES youths(code) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, youth_code)
);

CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_youth ON session_attendance(youth_code);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARENT ACTIVITIES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE parent_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_code CHAR(6) NOT NULL REFERENCES youths(code) ON DELETE CASCADE,
    activity VARCHAR(100) NOT NULL, -- Free text: "Swimming", "Dance", etc.
    training_date TIMESTAMPTZ NOT NULL, -- When activity happened
    duration INTEGER NOT NULL, -- minutes
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- When logged
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parent_activities_youth ON parent_activities(youth_code);
CREATE INDEX idx_parent_activities_parent ON parent_activities(parent_user_id);
CREATE INDEX idx_parent_activities_training_date ON parent_activities(training_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS FOR TIMELINE AGGREGATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Combined timeline view for a youth
CREATE OR REPLACE VIEW youth_timeline AS
SELECT
    'coach' as source,
    cs.id,
    cs.training_date,
    cs.sport::VARCHAR as sport,
    cs.team_name as label,
    cs.template_name as detail,
    COALESCE(
        (SELECT SUM(duration) FROM session_drills WHERE session_id = cs.id),
        0
    ) as duration_mins,
    sa.youth_code,
    cs.recorded_at
FROM coach_sessions cs
JOIN session_attendance sa ON sa.session_id = cs.id

UNION ALL

SELECT
    'parent' as source,
    pa.id,
    pa.training_date,
    pa.activity as sport,
    pa.activity as label,
    NULL as detail,
    pa.duration as duration_mins,
    pa.youth_code,
    pa.recorded_at
FROM parent_activities pa;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY: Rate limiting for code attempts
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE code_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    attempted_code VARCHAR(10),
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_code_attempts_user ON code_attempts(user_id);
CREATE INDEX idx_code_attempts_ip ON code_attempts(ip_address);
CREATE INDEX idx_code_attempts_time ON code_attempts(attempted_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to generate unique youth codes
CREATE OR REPLACE FUNCTION generate_youth_code()
RETURNS CHAR(6) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    new_code CHAR(6);
    i INTEGER;
BEGIN
    LOOP
        new_code := '';
        FOR i IN 1..6 LOOP
            new_code := new_code || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
        END LOOP;

        -- Check if code already exists
        EXIT WHEN NOT EXISTS (SELECT 1 FROM youths WHERE code = new_code);
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_youths_updated_at BEFORE UPDATE ON youths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAMPLE INDICES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Composite index for timeline queries
CREATE INDEX idx_timeline_youth_date ON youth_timeline(youth_code, training_date DESC);

-- Index for weekly queries
CREATE INDEX idx_coach_sessions_week ON coach_sessions(
    DATE_TRUNC('week', training_date),
    team_id
);

CREATE INDEX idx_parent_activities_week ON parent_activities(
    DATE_TRUNC('week', training_date),
    youth_code
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE youths IS 'Youth players registered by parents with unique 6-char codes';
COMMENT ON COLUMN youths.code IS 'Unique 6-char code shared with coaches for linking';
COMMENT ON TABLE coach_sessions IS 'Training sessions logged by coaches with drill details';
COMMENT ON COLUMN coach_sessions.training_date IS 'When the training actually happened';
COMMENT ON COLUMN coach_sessions.recorded_at IS 'When the entry was created in the system';
COMMENT ON TABLE parent_activities IS 'Any sport/activity logged by parents';
COMMENT ON VIEW youth_timeline IS 'Aggregated view of all training events for timeline display';