--
-- PostgreSQL database dump
--

\restrict zRqLlkUV0xm6WYEvFAHGIcuAteGif9rcqSNLHuZ8bboF32KQ87MYF8xT8bJxwzD

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: music_intensity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.music_intensity AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


--
-- Name: music_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.music_source AS ENUM (
    'MUSOPEN',
    'FREEPD',
    'JAMENDO',
    'EPIDEMIC_SOUND',
    'INTERNET_ARCHIVE'
);


--
-- Name: music_use_case; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.music_use_case AS ENUM (
    'PILATES_SLOW_FLOW',
    'PILATES_CORE',
    'PILATES_STRETCH',
    'WARM_UP',
    'COOL_DOWN',
    'MEDITATION',
    'GENERAL'
);


--
-- Name: stylistic_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stylistic_period AS ENUM (
    'BAROQUE',
    'CLASSICAL',
    'ROMANTIC',
    'IMPRESSIONIST',
    'MODERN',
    'CONTEMPORARY',
    'CELTIC_TRADITIONAL',
    'JAZZ'
);


--
-- Name: TYPE stylistic_period; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.stylistic_period IS 'Musical stylistic periods for Pilates class music selection. Now includes JAZZ (added 2025-12-04).';


--
-- Name: calculate_movement_novelty_score(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_movement_novelty_score(user_id_param uuid, movement_id_param uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  times_performed INTEGER;
  days_since_last INTEGER;
  novelty_score INTEGER;
BEGIN
  -- Count how many times user has performed this movement
  SELECT COUNT(*)
  INTO times_performed
  FROM public.class_plans cp
  CROSS JOIN LATERAL jsonb_array_elements(cp.movements) AS movement_data
  WHERE cp.user_id = user_id_param
    AND (movement_data->>'movement_id')::UUID = movement_id_param;

  IF times_performed = 0 THEN
    RETURN 100; -- Brand new movement, highest novelty
  END IF;

  -- Calculate days since last performance
  SELECT EXTRACT(DAY FROM NOW() - MAX(cp.created_at))::INTEGER
  INTO days_since_last
  FROM public.class_plans cp
  CROSS JOIN LATERAL jsonb_array_elements(cp.movements) AS movement_data
  WHERE cp.user_id = user_id_param
    AND (movement_data->>'movement_id')::UUID = movement_id_param;

  -- Calculate novelty score (0-100)
  novelty_score := LEAST(100, (days_since_last * 2) - (times_performed * 5));

  RETURN GREATEST(0, novelty_score);
END;
$$;


--
-- Name: check_consecutive_muscle_overuse(uuid, character varying, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_consecutive_muscle_overuse(user_id_param uuid, muscle_group_param character varying, lookback_days integer DEFAULT 3) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  overuse_count INTEGER;
BEGIN
  -- Count how many times this muscle group was targeted in recent classes
  SELECT COUNT(*)
  INTO overuse_count
  FROM public.class_plans cp
  WHERE cp.user_id = user_id_param
    AND cp.created_at > NOW() - (lookback_days || ' days')::INTERVAL
    AND cp.muscle_balance @> jsonb_build_object(muscle_group_param, 'high');

  -- Return true if muscle group used more than 2 times in lookback period
  RETURN overuse_count > 2;
END;
$$;


--
-- Name: check_pregnancy_exclusion(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_pregnancy_exclusion(user_id_param uuid, movement_id_param uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  is_pregnant BOOLEAN;
  has_exclusion BOOLEAN;
BEGIN
  -- Check if user is pregnant
  SELECT pregnancy_status INTO is_pregnant
  FROM public.user_profiles
  WHERE user_id = user_id_param;

  IF NOT is_pregnant THEN
    RETURN FALSE; -- Not pregnant, no exclusion needed
  END IF;

  -- Check if movement has pregnancy exclusion
  SELECT pregnancy_exclusion INTO has_exclusion
  FROM public.movements
  WHERE id = movement_id_param;

  RETURN COALESCE(has_exclusion, FALSE);
END;
$$;


--
-- Name: get_user_movement_history(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_movement_history(user_id_param uuid, limit_param integer DEFAULT 10) RETURNS TABLE(movement_id uuid, movement_name character varying, last_performed timestamp without time zone, times_performed integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    MAX(cp.created_at) as last_performed,
    COUNT(*)::INTEGER as times_performed
  FROM public.class_plans cp
  CROSS JOIN LATERAL jsonb_array_elements(cp.movements) AS movement_data
  JOIN public.movements m ON m.id = (movement_data->>'movement_id')::UUID
  WHERE cp.user_id = user_id_param
  GROUP BY m.id, m.name
  ORDER BY last_performed DESC
  LIMIT limit_param;
END;
$$;


--
-- Name: log_pregnancy_detection(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_pregnancy_detection() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  -- Log when pregnancy status changes to true
  IF NEW.pregnancy_status = TRUE AND (OLD.pregnancy_status IS NULL OR OLD.pregnancy_status = FALSE) THEN
    INSERT INTO public.medical_exclusions_log (user_id, exclusion_type, detected_at)
    VALUES (NEW.user_id, 'pregnancy', NOW());
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: select_cooldown_by_muscle_groups(text[], character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.select_cooldown_by_muscle_groups(muscle_groups_param text[], intensity_param character varying DEFAULT 'moderate'::character varying) RETURNS TABLE(id uuid, sequence_name character varying, intensity_level character varying, narrative text, stretches jsonb, duration_seconds integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.sequence_name,
    cs.intensity_level,
    cs.narrative,
    cs.stretches,
    cs.duration_seconds
  FROM public.cooldown_sequences cs
  WHERE cs.intensity_level = intensity_param
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;


--
-- Name: select_warmup_by_muscle_groups(text[], character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.select_warmup_by_muscle_groups(muscle_groups_param text[], difficulty_param character varying DEFAULT 'Beginner'::character varying) RETURNS TABLE(id uuid, routine_name character varying, focus_area character varying, narrative text, movements jsonb, duration_seconds integer, difficulty_level character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.id,
    wr.routine_name,
    wr.focus_area,
    wr.narrative,
    wr.movements,
    wr.duration_seconds,
    wr.difficulty_level
  FROM public.warmup_routines wr
  WHERE wr.difficulty_level = difficulty_param
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;


--
-- Name: update_beta_feedback_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_beta_feedback_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_music_playlists_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_music_playlists_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_music_tracks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_music_tracks_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: validate_required_elements(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_required_elements(class_data jsonb) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  -- Check that all required sections exist
  IF NOT (
    class_data ? 'preparation' AND
    class_data ? 'warmup' AND
    class_data ? 'movements' AND
    class_data ? 'cooldown' AND
    class_data ? 'meditation'
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_decision_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_decision_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    agent_type character varying(50) NOT NULL,
    model_name character varying(100) NOT NULL,
    model_version character varying(50),
    input_parameters jsonb,
    output_result jsonb,
    reasoning text,
    confidence_score double precision,
    safety_validated boolean DEFAULT true,
    user_overridden boolean DEFAULT false,
    override_reason text,
    processing_time_ms integer,
    tokens_used integer,
    compliance_flags jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE ai_decision_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_decision_log IS 'EU AI Act - All AI decisions with reasoning';


--
-- Name: beta_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beta_feedback (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    country character varying(100),
    feedback_type character varying(50) NOT NULL,
    subject character varying(500) NOT NULL,
    message text NOT NULL,
    status character varying(20) DEFAULT 'new'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    admin_notes text
);


--
-- Name: TABLE beta_feedback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.beta_feedback IS 'Stores beta tester feedback, bug reports, and support queries';


--
-- Name: bias_monitoring; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bias_monitoring (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    metric_name character varying(100) NOT NULL,
    model_name character varying(100) NOT NULL,
    demographic_group character varying(100),
    metric_value double precision NOT NULL,
    baseline_value double precision,
    deviation_percentage double precision,
    alert_threshold_exceeded boolean DEFAULT false,
    sample_size integer,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE bias_monitoring; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.bias_monitoring IS 'EU AI Act - Detect and prevent algorithmic bias';


--
-- Name: class_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    class_plan_id uuid,
    user_id uuid NOT NULL,
    taught_date date NOT NULL,
    actual_duration_minutes integer,
    attendance_count integer,
    movements_snapshot jsonb NOT NULL,
    instructor_notes text,
    student_feedback jsonb DEFAULT '[]'::jsonb,
    difficulty_rating numeric(3,2),
    muscle_groups_targeted jsonb DEFAULT '[]'::jsonb,
    total_movements_taught integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE class_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.class_history IS 'Historical record of taught classes for analytics';


--
-- Name: COLUMN class_history.movements_snapshot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_history.movements_snapshot IS 'JSONB array of movements with muscle groups for variety tracking and analytics';


--
-- Name: class_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_movements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    class_plan_id uuid NOT NULL,
    movement_id uuid NOT NULL,
    sequence_order integer NOT NULL,
    section character varying(50) NOT NULL,
    level_used character varying(10),
    duration_override integer,
    special_notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE class_movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.class_movements IS 'Junction table linking movements to class plans with order';


--
-- Name: COLUMN class_movements.level_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_movements.level_used IS 'L1, L2, or FV for this specific class';


--
-- Name: class_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_plans (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    description text,
    difficulty_level character varying(20),
    duration_minutes integer DEFAULT 60,
    target_audience character varying(100),
    focus_areas jsonb DEFAULT '[]'::jsonb,
    total_movements integer,
    warm_up_movements jsonb DEFAULT '[]'::jsonb,
    main_sequence jsonb DEFAULT '[]'::jsonb,
    cool_down_movements jsonb DEFAULT '[]'::jsonb,
    generated_by_ai boolean DEFAULT false,
    ai_agent_version character varying(50),
    sequence_validation_passed boolean DEFAULT false,
    validation_notes text,
    status character varying(50) DEFAULT 'draft'::character varying,
    is_template boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    last_taught_at timestamp with time zone
);


--
-- Name: TABLE class_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.class_plans IS 'Saved class plans with AI-generated sequences';


--
-- Name: COLUMN class_plans.generated_by_ai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_plans.generated_by_ai IS 'True if sequence was AI-generated, false if manual';


--
-- Name: COLUMN class_plans.sequence_validation_passed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_plans.sequence_validation_passed IS 'True if all safety rules validated';


--
-- Name: closing_homecare_advice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.closing_homecare_advice (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    advice_name character varying(255) NOT NULL,
    focus_area character varying(100) NOT NULL,
    advice_text text NOT NULL,
    actionable_tips text[] NOT NULL,
    duration_seconds integer DEFAULT 60,
    related_to_class_focus boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    required_elements jsonb DEFAULT '[]'::jsonb,
    allow_ai_generation boolean DEFAULT false,
    source_preference character varying(255) DEFAULT 'American School of Medicine'::character varying,
    voiceover_url text,
    voiceover_duration integer,
    voiceover_enabled boolean DEFAULT false,
    video_url text
);


--
-- Name: TABLE closing_homecare_advice; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.closing_homecare_advice IS 'Practical home care advice to close the class';


--
-- Name: COLUMN closing_homecare_advice.actionable_tips; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_homecare_advice.actionable_tips IS 'Array of specific, actionable tips: ["Practice breathing daily", "Stretch hip flexors", ...]';


--
-- Name: COLUMN closing_homecare_advice.source_preference; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_homecare_advice.source_preference IS 'Preferred research source for AI generation';


--
-- Name: COLUMN closing_homecare_advice.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_homecare_advice.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';


--
-- Name: COLUMN closing_homecare_advice.voiceover_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_homecare_advice.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';


--
-- Name: COLUMN closing_homecare_advice.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_homecare_advice.voiceover_enabled IS 'Whether to play voiceover during class playback';


--
-- Name: COLUMN closing_homecare_advice.video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_homecare_advice.video_url IS 'CloudFront CDN URL for homecare demonstration video (optional)';


--
-- Name: closing_meditation_scripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.closing_meditation_scripts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    script_name character varying(255) NOT NULL,
    meditation_theme character varying(100) NOT NULL,
    script_text text NOT NULL,
    breathing_guidance text,
    duration_seconds integer DEFAULT 180 NOT NULL,
    post_intensity character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    required_elements jsonb DEFAULT '[]'::jsonb,
    allow_ai_variation boolean DEFAULT false,
    voiceover_url text,
    voiceover_duration integer,
    voiceover_enabled boolean DEFAULT false,
    video_url text
);


--
-- Name: TABLE closing_meditation_scripts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.closing_meditation_scripts IS 'Closing meditation scripts to end class mindfully';


--
-- Name: COLUMN closing_meditation_scripts.post_intensity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_meditation_scripts.post_intensity IS 'Intensity of class that preceded this meditation (affects tone/pace)';


--
-- Name: COLUMN closing_meditation_scripts.allow_ai_variation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_meditation_scripts.allow_ai_variation IS 'Can AI vary narrative in reasoner mode?';


--
-- Name: COLUMN closing_meditation_scripts.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_meditation_scripts.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';


--
-- Name: COLUMN closing_meditation_scripts.voiceover_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_meditation_scripts.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';


--
-- Name: COLUMN closing_meditation_scripts.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_meditation_scripts.voiceover_enabled IS 'Whether to play voiceover during class playback';


--
-- Name: COLUMN closing_meditation_scripts.video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.closing_meditation_scripts.video_url IS 'CloudFront CDN URL for meditation demonstration video (optional)';


--
-- Name: common_mistakes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.common_mistakes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    movement_id uuid NOT NULL,
    mistake_description text NOT NULL,
    correction text,
    severity character varying(20) DEFAULT 'medium'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE common_mistakes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.common_mistakes IS 'Common errors and corrections extracted from "Watch Out Points"';


--
-- Name: cooldown_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cooldown_sequences (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    sequence_name character varying(255) NOT NULL,
    intensity_level character varying(50) NOT NULL,
    narrative text NOT NULL,
    stretches jsonb NOT NULL,
    duration_seconds integer DEFAULT 300 NOT NULL,
    target_muscles text[],
    recovery_focus character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    required_muscle_groups text[] DEFAULT '{}'::text[],
    allow_ai_generation boolean DEFAULT false,
    voiceover_url text,
    voiceover_duration integer,
    voiceover_enabled boolean DEFAULT false,
    video_url text
);


--
-- Name: TABLE cooldown_sequences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cooldown_sequences IS 'Cool-down stretches and recovery movements';


--
-- Name: COLUMN cooldown_sequences.stretches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cooldown_sequences.stretches IS 'JSONB array of stretches: [{"name": "Child''s Pose", "duration": 30, "focus": "spine"}, ...]';


--
-- Name: COLUMN cooldown_sequences.required_muscle_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cooldown_sequences.required_muscle_groups IS 'Muscle groups that must be cooled down';


--
-- Name: COLUMN cooldown_sequences.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cooldown_sequences.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';


--
-- Name: COLUMN cooldown_sequences.voiceover_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cooldown_sequences.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';


--
-- Name: COLUMN cooldown_sequences.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cooldown_sequences.voiceover_enabled IS 'Whether to play voiceover during class playback';


--
-- Name: COLUMN cooldown_sequences.video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cooldown_sequences.video_url IS 'CloudFront CDN URL for cooldown demonstration video (optional)';


--
-- Name: llm_invocation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_invocation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    method_used character varying(20) NOT NULL,
    llm_called boolean DEFAULT false NOT NULL,
    llm_model character varying(50),
    llm_prompt text,
    llm_response text,
    llm_iterations integer,
    request_data jsonb,
    processing_time_ms double precision NOT NULL,
    success boolean DEFAULT true NOT NULL,
    error_message text,
    cost_estimate character varying(20),
    result_summary jsonb,
    CONSTRAINT llm_invocation_log_method_used_check CHECK (((method_used)::text = ANY ((ARRAY['ai_agent'::character varying, 'direct_api'::character varying])::text[])))
);


--
-- Name: TABLE llm_invocation_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.llm_invocation_log IS 'Log of all class generation attempts, showing when LLM reasoning is used vs direct API';


--
-- Name: medical_exclusions_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_exclusions_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    student_profile_id uuid,
    exclusion_type character varying(50) NOT NULL,
    exclusion_reason text NOT NULL,
    detected_at timestamp with time zone DEFAULT now(),
    action_taken text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE medical_exclusions_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.medical_exclusions_log IS 'Audit trail of medical exclusions for liability protection and safety monitoring';


--
-- Name: model_drift_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_drift_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    model_name character varying(100) NOT NULL,
    model_version character varying(50),
    drift_metric character varying(100) NOT NULL,
    current_value double precision NOT NULL,
    baseline_value double precision NOT NULL,
    drift_score double precision,
    drift_detected boolean DEFAULT false,
    action_taken character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE model_drift_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.model_drift_log IS 'EU AI Act - Monitor model performance over time';


--
-- Name: movement_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movement_levels (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    movement_id uuid NOT NULL,
    level_number integer NOT NULL,
    level_name character varying(50) NOT NULL,
    narrative text,
    setup_position character varying(255),
    watch_out_points text[],
    teaching_cues jsonb,
    visual_cues text[],
    muscle_groups jsonb,
    duration_seconds integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT movement_levels_level_number_check CHECK (((level_number >= 1) AND (level_number <= 4)))
);


--
-- Name: TABLE movement_levels; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.movement_levels IS 'Progressive difficulty levels for Pilates movements (L1→L2→L3→Full)';


--
-- Name: COLUMN movement_levels.level_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movement_levels.level_number IS '1=Level 1 (easiest), 2=Level 2, 3=Level 3, 4=Full (hardest)';


--
-- Name: movement_muscles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movement_muscles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    movement_id uuid NOT NULL,
    muscle_group_name text NOT NULL,
    is_primary boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE movement_muscles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.movement_muscles IS 'Many-to-many relationship: movements to muscle groups';


--
-- Name: movement_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movement_usage (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    movement_id uuid NOT NULL,
    last_used_date date NOT NULL,
    usage_count integer DEFAULT 1,
    weeks_since_last_use integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE movement_usage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.movement_usage IS 'Tracks movement usage to prevent overuse (Rule #4)';


--
-- Name: COLUMN movement_usage.weeks_since_last_use; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movement_usage.weeks_since_last_use IS 'Auto-calculated for variety enforcement';


--
-- Name: movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(50) DEFAULT 'Mat-based'::character varying,
    difficulty_level character varying(20) NOT NULL,
    narrative text,
    visual_cues text,
    watch_out_points text,
    setup_position character varying(50) NOT NULL,
    duration_seconds integer,
    breathing_pattern jsonb,
    equipment_required jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    movement_number integer NOT NULL,
    code character varying(50),
    movement_pattern character varying(50),
    level_3_description character varying(1) DEFAULT 'N'::character varying,
    level_1_description character varying(1) DEFAULT 'N'::character varying,
    level_2_description character varying(1) DEFAULT 'N'::character varying,
    full_version_description character varying(1) DEFAULT 'N'::character varying,
    voiceover_url text,
    voiceover_duration_seconds integer,
    voiceover_enabled boolean DEFAULT false,
    video_url text,
    CONSTRAINT full_version_description_check CHECK (((full_version_description)::text = ANY ((ARRAY['Y'::character varying, 'N'::character varying])::text[]))),
    CONSTRAINT level_1_description_check CHECK (((level_1_description)::text = ANY ((ARRAY['Y'::character varying, 'N'::character varying])::text[]))),
    CONSTRAINT level_2_description_check CHECK (((level_2_description)::text = ANY ((ARRAY['Y'::character varying, 'N'::character varying])::text[]))),
    CONSTRAINT level_3_description_check CHECK (((level_3_description)::text = ANY ((ARRAY['Y'::character varying, 'N'::character varying])::text[])))
);


--
-- Name: TABLE movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.movements IS 'Classical Pilates movements with corrected difficulty levels (Migration 006)';


--
-- Name: COLUMN movements.difficulty_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.difficulty_level IS 'Beginner, Intermediate, or Advanced';


--
-- Name: COLUMN movements.setup_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.setup_position IS 'Starting position: Supine, Prone, Kneeling, Seated, Side-lying';


--
-- Name: COLUMN movements.movement_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.movement_number IS 'Sequential movement number (1-34) for classical Pilates order';


--
-- Name: COLUMN movements.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.code IS 'URL-friendly identifier (e.g., "the_hundred", "roll_up")';


--
-- Name: COLUMN movements.level_3_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.level_3_description IS 'Flag: Does this movement have Level 3? (Y/N)';


--
-- Name: COLUMN movements.level_1_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.level_1_description IS 'Flag: Does this movement have Level 1? (Y/N)';


--
-- Name: COLUMN movements.level_2_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.level_2_description IS 'Flag: Does this movement have Level 2? (Y/N)';


--
-- Name: COLUMN movements.full_version_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.full_version_description IS 'Flag: Does this movement have Full Version? (Y/N)';


--
-- Name: COLUMN movements.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.voiceover_url IS 'Supabase Storage URL for pre-recorded voiceover audio (e.g., https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/The Hundred - Test audio.mp4)';


--
-- Name: COLUMN movements.voiceover_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.voiceover_duration_seconds IS 'Duration of voiceover audio in seconds (used for music ducking timing)';


--
-- Name: COLUMN movements.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.voiceover_enabled IS 'Whether to play voiceover audio during this movement (default: false)';


--
-- Name: COLUMN movements.video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movements.video_url IS 'CloudFront CDN URL for movement demonstration video (optional, Phase 1: The Hundred only)';


--
-- Name: muscle_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.muscle_groups (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE muscle_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.muscle_groups IS 'Muscle groups and movement goals from Excel';


--
-- Name: music_playlist_tracks_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.music_playlist_tracks_backup (
    id uuid,
    playlist_id uuid,
    track_id uuid,
    sequence_order integer,
    start_offset_seconds integer,
    end_offset_seconds integer,
    created_at timestamp with time zone
);


--
-- Name: music_playlists_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.music_playlists_backup (
    id uuid,
    name character varying(500),
    description text,
    intended_intensity public.music_intensity,
    intended_use public.music_use_case,
    duration_minutes_target integer,
    stylistic_period public.stylistic_period,
    is_active boolean,
    is_featured boolean,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: music_tracks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.music_tracks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source public.music_source NOT NULL,
    provider_track_id character varying(255),
    provider_url text,
    title character varying(500) NOT NULL,
    composer character varying(255),
    artist_performer character varying(255),
    duration_seconds integer NOT NULL,
    bpm integer,
    stylistic_period public.stylistic_period NOT NULL,
    mood_tags text[],
    audio_url text NOT NULL,
    waveform_url text,
    peak_data jsonb,
    license_info jsonb NOT NULL,
    is_active boolean DEFAULT true,
    quality_score numeric(3,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT music_tracks_bpm_check CHECK (((bpm > 0) AND (bpm < 300))),
    CONSTRAINT music_tracks_duration_seconds_check CHECK ((duration_seconds > 0)),
    CONSTRAINT music_tracks_quality_score_check CHECK (((quality_score >= (0)::numeric) AND (quality_score <= (1)::numeric)))
);


--
-- Name: TABLE music_tracks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_tracks IS 'Music tracks from Musopen/FreePD. Tracks with [DEV_FIXTURE] prefix are development placeholders only.';


--
-- Name: COLUMN music_tracks.audio_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_tracks.audio_url IS 'Direct streaming URL from provider CDN (never self-hosted)';


--
-- Name: COLUMN music_tracks.license_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_tracks.license_info IS 'JSONB containing license type, attribution requirements, etc.';


--
-- Name: pii_field_registry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pii_field_registry (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    table_schema character varying(255) NOT NULL,
    table_name character varying(255) NOT NULL,
    column_name character varying(255) NOT NULL,
    pii_category character varying(50) NOT NULL,
    gdpr_article character varying(50),
    data_type_label character varying(100),
    is_sensitive boolean DEFAULT false,
    requires_explicit_consent boolean DEFAULT false,
    purpose text,
    legal_basis character varying(100),
    retention_period character varying(100),
    encryption_method character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pii_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pii_tokens (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    token character varying(255) NOT NULL,
    encrypted_value text NOT NULL,
    pii_type character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    accessed_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE pii_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pii_tokens IS 'Secure encrypted storage for PII (emails, names, etc.)';


--
-- Name: preparation_scripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preparation_scripts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    script_name character varying(255) NOT NULL,
    script_type character varying(50) NOT NULL,
    narrative text NOT NULL,
    key_principles text[],
    duration_seconds integer DEFAULT 120 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    required_elements jsonb DEFAULT '[]'::jsonb,
    allow_ai_generation boolean DEFAULT false,
    voiceover_url text,
    voiceover_duration integer,
    voiceover_enabled boolean DEFAULT false,
    video_url text
);


--
-- Name: TABLE preparation_scripts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.preparation_scripts IS 'Opening preparation scripts for class (Pilates principles, breathing, centering)';


--
-- Name: COLUMN preparation_scripts.required_elements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preparation_scripts.required_elements IS 'Non-negotiable elements (4 core principles)';


--
-- Name: COLUMN preparation_scripts.allow_ai_generation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preparation_scripts.allow_ai_generation IS 'Can AI generate new scripts in reasoner mode?';


--
-- Name: COLUMN preparation_scripts.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preparation_scripts.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';


--
-- Name: COLUMN preparation_scripts.voiceover_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preparation_scripts.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';


--
-- Name: COLUMN preparation_scripts.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preparation_scripts.voiceover_enabled IS 'Whether to play voiceover during class playback';


--
-- Name: COLUMN preparation_scripts.video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preparation_scripts.video_url IS 'CloudFront CDN URL for preparation demonstration video (optional)';


--
-- Name: ropa_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ropa_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    transaction_type character varying(50) NOT NULL,
    pii_fields text[],
    purpose character varying(100) NOT NULL,
    processing_system character varying(100) NOT NULL,
    actor_id uuid,
    actor_type character varying(20) DEFAULT 'user'::character varying,
    ip_address text,
    user_agent text,
    request_endpoint character varying(255),
    http_method character varying(10),
    status character varying(20) DEFAULT 'success'::character varying,
    retention_period character varying(50) DEFAULT '7 years'::character varying,
    third_party_recipients text[],
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE ropa_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ropa_audit_log IS 'GDPR Article 30 - Record of Processing Activities';


--
-- Name: sequence_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequence_rules (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    rule_number integer NOT NULL,
    description text NOT NULL,
    rule_type character varying(50) DEFAULT 'safety'::character varying,
    is_required boolean DEFAULT true,
    enforcement_level character varying(20) DEFAULT 'strict'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    parameter_key character varying(100),
    value_numeric integer,
    value_unit character varying(20),
    difficulty_level character varying(20),
    business_rationale text,
    last_changed_by character varying(100),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE sequence_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sequence_rules IS 'Class planning rules for safe, effective sequencing (CRITICAL)';


--
-- Name: COLUMN sequence_rules.enforcement_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.enforcement_level IS 'strict=must enforce, recommended=warn, optional=suggest';


--
-- Name: COLUMN sequence_rules.parameter_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.parameter_key IS 'Unique key for code to query specific numeric parameters (NULL for qualitative rules)';


--
-- Name: COLUMN sequence_rules.value_numeric; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.value_numeric IS 'Numeric value (seconds for durations, count for movements)';


--
-- Name: COLUMN sequence_rules.value_unit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.value_unit IS 'Unit: seconds, minutes, or count';


--
-- Name: COLUMN sequence_rules.difficulty_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.difficulty_level IS 'NULL (applies to all) or specific: Beginner, Intermediate, Advanced';


--
-- Name: COLUMN sequence_rules.business_rationale; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.business_rationale IS 'WHY this value was chosen (for stakeholder transparency)';


--
-- Name: COLUMN sequence_rules.last_changed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sequence_rules.last_changed_by IS 'Email of user who last modified this rule (audit trail)';


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profiles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    student_name_token character varying(255) NOT NULL,
    student_email_token character varying(255),
    fitness_level character varying(50),
    injuries jsonb DEFAULT '[]'::jsonb,
    modifications_needed jsonb DEFAULT '[]'::jsonb,
    goals jsonb DEFAULT '[]'::jsonb,
    preferred_difficulty character varying(20),
    avoid_movements jsonb DEFAULT '[]'::jsonb,
    favorite_movements jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_pregnant boolean DEFAULT false NOT NULL,
    medical_contraindications text[] DEFAULT ARRAY[]::text[],
    last_medical_status_check timestamp with time zone
);


--
-- Name: TABLE student_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_profiles IS 'Student information for customized class planning';


--
-- Name: COLUMN student_profiles.avoid_movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_profiles.avoid_movements IS 'Movements to avoid due to injuries (Rule #10)';


--
-- Name: COLUMN student_profiles.is_pregnant; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_profiles.is_pregnant IS 'CRITICAL SAFETY: If TRUE, user is EXCLUDED from all app features. Pilates during pregnancy requires professional supervision.';


--
-- Name: COLUMN student_profiles.medical_contraindications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_profiles.medical_contraindications IS 'Array of medical conditions that exclude app usage: pregnancy, severe injuries, etc.';


--
-- Name: teaching_cues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teaching_cues (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    movement_id uuid NOT NULL,
    cue_type character varying(50) NOT NULL,
    cue_text text NOT NULL,
    cue_order integer,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE teaching_cues; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.teaching_cues IS 'Cueing strategies and imagery for each movement';


--
-- Name: transitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transitions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    from_position character varying(50) NOT NULL,
    to_position character varying(50) NOT NULL,
    narrative text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    voiceover_url text,
    voiceover_duration integer,
    voiceover_enabled boolean DEFAULT false,
    duration_seconds integer DEFAULT 60 NOT NULL
);


--
-- Name: TABLE transitions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.transitions IS 'Position-based transition narratives for smooth class flow';


--
-- Name: COLUMN transitions.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transitions.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';


--
-- Name: COLUMN transitions.voiceover_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transitions.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync and music ducking)';


--
-- Name: COLUMN transitions.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transitions.voiceover_enabled IS 'Whether to play voiceover during this transition (default: false)';


--
-- Name: COLUMN transitions.duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transitions.duration_seconds IS 'Duration of transition in seconds (configurable for UAT testing)';


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL,
    strictness_level text DEFAULT 'guided'::text,
    default_class_duration integer DEFAULT 60,
    favorite_movements jsonb DEFAULT '[]'::jsonb,
    music_preferences jsonb DEFAULT '{}'::jsonb,
    research_sources jsonb DEFAULT '[]'::jsonb,
    enable_mcp_research boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now(),
    email_notifications boolean DEFAULT true,
    class_reminders boolean DEFAULT true,
    weekly_summary boolean DEFAULT false,
    analytics_enabled boolean DEFAULT true,
    data_sharing_enabled boolean DEFAULT false,
    use_ai_agent boolean DEFAULT false,
    preferred_movement_level character varying(50) DEFAULT 'beginner'::character varying,
    show_full_progression boolean DEFAULT false,
    use_reasoner_mode boolean DEFAULT false,
    reasoner_enabled_date timestamp with time zone,
    experience_level character varying(50) DEFAULT 'beginner'::character varying,
    classes_completed integer DEFAULT 0,
    first_class_date date,
    preferred_movements uuid[] DEFAULT '{}'::uuid[],
    CONSTRAINT check_experience_level CHECK (((experience_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[])))
);


--
-- Name: COLUMN user_preferences.email_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.email_notifications IS 'User wants to receive email notifications about account activity';


--
-- Name: COLUMN user_preferences.class_reminders; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.class_reminders IS 'User wants to receive notifications before scheduled classes';


--
-- Name: COLUMN user_preferences.weekly_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.weekly_summary IS 'User wants to receive a weekly summary of their progress';


--
-- Name: COLUMN user_preferences.analytics_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.analytics_enabled IS 'User allows sharing anonymous usage data for analytics';


--
-- Name: COLUMN user_preferences.data_sharing_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.data_sharing_enabled IS 'User allows sharing data with third-party services';


--
-- Name: COLUMN user_preferences.use_ai_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.use_ai_agent IS 'Whether to use AI agent for class generation (costly but intelligent using GPT-4) or direct API calls (fast but basic). Default: false (free tier)';


--
-- Name: COLUMN user_preferences.preferred_movement_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.preferred_movement_level IS 'User''s preferred difficulty: beginner, intermediate, advanced';


--
-- Name: COLUMN user_preferences.show_full_progression; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.show_full_progression IS 'Show L1→L2→L3→Full progression in class narrative (for instructors)';


--
-- Name: COLUMN user_preferences.use_reasoner_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.use_reasoner_mode IS 'Enable AI reasoning for personalized class generation (Reasoner Mode)';


--
-- Name: COLUMN user_preferences.reasoner_enabled_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.reasoner_enabled_date IS 'Timestamp when user enabled reasoner mode';


--
-- Name: COLUMN user_preferences.experience_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.experience_level IS 'User experience level: beginner, intermediate, advanced';


--
-- Name: COLUMN user_preferences.classes_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.classes_completed IS 'Total number of classes completed by user';


--
-- Name: COLUMN user_preferences.first_class_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.first_class_date IS 'Date of first class to track progression';


--
-- Name: COLUMN user_preferences.preferred_movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.preferred_movements IS 'Array of movement IDs user wants to practice more';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    hashed_password text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_login timestamp without time zone,
    age_range character varying(20),
    gender_identity character varying(50),
    country character varying(100),
    pilates_experience character varying(20),
    goals jsonb DEFAULT '[]'::jsonb,
    is_admin boolean DEFAULT false,
    accepted_privacy_at timestamp with time zone,
    accepted_beta_terms_at timestamp with time zone,
    accepted_safety_at timestamp with time zone,
    is_pregnant boolean DEFAULT false,
    is_injury_free boolean DEFAULT false,
    CONSTRAINT check_age_range CHECK (((age_range IS NULL) OR ((age_range)::text = ANY ((ARRAY['18-24'::character varying, '25-34'::character varying, '35-44'::character varying, '45-54'::character varying, '55-64'::character varying, '65+'::character varying])::text[])))),
    CONSTRAINT check_pilates_experience CHECK (((pilates_experience IS NULL) OR ((pilates_experience)::text = ANY ((ARRAY['Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying, 'Instructor'::character varying])::text[]))))
);


--
-- Name: TABLE user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_profiles IS 'User profiles with demographics and Pilates experience for personalization';


--
-- Name: COLUMN user_profiles.age_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.age_range IS 'Age range: 18-24, 25-34, 35-44, 45-54, 55-64, 65+';


--
-- Name: COLUMN user_profiles.gender_identity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.gender_identity IS 'Optional: Female, Male, Non-binary, Prefer not to say, Other';


--
-- Name: COLUMN user_profiles.country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.country IS 'User country (ISO 3166-1 alpha-2 or full name)';


--
-- Name: COLUMN user_profiles.pilates_experience; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.pilates_experience IS 'Beginner, Intermediate, Advanced, Instructor';


--
-- Name: COLUMN user_profiles.goals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.goals IS 'Array of goals: stress_relief, tone_strength, performance, habit_building';


--
-- Name: COLUMN user_profiles.is_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.is_admin IS 'Admin users can view LLM invocation logs and analytics';


--
-- Name: COLUMN user_profiles.accepted_privacy_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.accepted_privacy_at IS 'Timestamp when user accepted Privacy Policy';


--
-- Name: COLUMN user_profiles.accepted_beta_terms_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.accepted_beta_terms_at IS 'Timestamp when user accepted Beta Tester Agreement';


--
-- Name: COLUMN user_profiles.accepted_safety_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.accepted_safety_at IS 'Timestamp when user accepted Health & Safety Disclaimer (before first class)';


--
-- Name: COLUMN user_profiles.is_pregnant; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.is_pregnant IS 'User confirmed they are NOT pregnant (registration requirement)';


--
-- Name: COLUMN user_profiles.is_injury_free; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.is_injury_free IS 'User confirmed they are injury-free (registration requirement)';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    email_token character varying(255) NOT NULL,
    full_name_token character varying(255),
    role character varying(50) DEFAULT 'instructor'::character varying,
    preferences jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    medical_disclaimer_accepted boolean DEFAULT false NOT NULL,
    medical_disclaimer_accepted_at timestamp with time zone,
    medical_disclaimer_version character varying(10) DEFAULT '1.0'::character varying
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'User accounts with tokenized PII for GDPR compliance';


--
-- Name: COLUMN users.medical_disclaimer_accepted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.medical_disclaimer_accepted IS 'User must accept medical disclaimer before using app. Disclaimer explicitly excludes pregnant users.';


--
-- Name: warmup_routines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warmup_routines (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    routine_name character varying(255) NOT NULL,
    focus_area character varying(100) NOT NULL,
    narrative text NOT NULL,
    movements jsonb NOT NULL,
    duration_seconds integer DEFAULT 300 NOT NULL,
    contraindications text[],
    modifications jsonb,
    difficulty_level character varying(50) DEFAULT 'Beginner'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    required_muscle_groups text[] DEFAULT '{}'::text[],
    allow_ai_generation boolean DEFAULT false,
    voiceover_url text,
    voiceover_duration integer,
    voiceover_enabled boolean DEFAULT false,
    video_url text
);


--
-- Name: TABLE warmup_routines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.warmup_routines IS 'Warm-up routines to prepare body for main movements';


--
-- Name: COLUMN warmup_routines.movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warmup_routines.movements IS 'JSONB array of simple movements: [{"name": "Neck Rolls", "reps": 5, "direction": "clockwise"}, ...]';


--
-- Name: COLUMN warmup_routines.required_muscle_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warmup_routines.required_muscle_groups IS 'Muscle groups that must be warmed up';


--
-- Name: COLUMN warmup_routines.voiceover_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warmup_routines.voiceover_url IS 'Supabase Storage URL for voiceover audio file (MP3, 22050 Hz, 145 kbps)';


--
-- Name: COLUMN warmup_routines.voiceover_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warmup_routines.voiceover_duration IS 'Duration of voiceover in seconds (for timeline sync)';


--
-- Name: COLUMN warmup_routines.voiceover_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warmup_routines.voiceover_enabled IS 'Whether to play voiceover during class playback';


--
-- Name: COLUMN warmup_routines.video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warmup_routines.video_url IS 'CloudFront CDN URL for warmup demonstration video (optional)';


--
-- Name: ai_decision_log ai_decision_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_decision_log
    ADD CONSTRAINT ai_decision_log_pkey PRIMARY KEY (id);


--
-- Name: beta_feedback beta_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beta_feedback
    ADD CONSTRAINT beta_feedback_pkey PRIMARY KEY (id);


--
-- Name: bias_monitoring bias_monitoring_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bias_monitoring
    ADD CONSTRAINT bias_monitoring_pkey PRIMARY KEY (id);


--
-- Name: class_history class_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_history
    ADD CONSTRAINT class_history_pkey PRIMARY KEY (id);


--
-- Name: class_movements class_movements_class_plan_id_sequence_order_section_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_movements
    ADD CONSTRAINT class_movements_class_plan_id_sequence_order_section_key UNIQUE (class_plan_id, sequence_order, section);


--
-- Name: class_movements class_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_movements
    ADD CONSTRAINT class_movements_pkey PRIMARY KEY (id);


--
-- Name: class_plans class_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_plans
    ADD CONSTRAINT class_plans_pkey PRIMARY KEY (id);


--
-- Name: closing_homecare_advice closing_homecare_advice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closing_homecare_advice
    ADD CONSTRAINT closing_homecare_advice_pkey PRIMARY KEY (id);


--
-- Name: closing_meditation_scripts closing_meditation_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closing_meditation_scripts
    ADD CONSTRAINT closing_meditation_scripts_pkey PRIMARY KEY (id);


--
-- Name: common_mistakes common_mistakes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_mistakes
    ADD CONSTRAINT common_mistakes_pkey PRIMARY KEY (id);


--
-- Name: cooldown_sequences cooldown_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooldown_sequences
    ADD CONSTRAINT cooldown_sequences_pkey PRIMARY KEY (id);


--
-- Name: llm_invocation_log llm_invocation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_invocation_log
    ADD CONSTRAINT llm_invocation_log_pkey PRIMARY KEY (id);


--
-- Name: medical_exclusions_log medical_exclusions_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_exclusions_log
    ADD CONSTRAINT medical_exclusions_log_pkey PRIMARY KEY (id);


--
-- Name: model_drift_log model_drift_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_drift_log
    ADD CONSTRAINT model_drift_log_pkey PRIMARY KEY (id);


--
-- Name: movement_levels movement_levels_movement_id_level_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_levels
    ADD CONSTRAINT movement_levels_movement_id_level_number_key UNIQUE (movement_id, level_number);


--
-- Name: movement_levels movement_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_levels
    ADD CONSTRAINT movement_levels_pkey PRIMARY KEY (id);


--
-- Name: movement_muscles movement_muscles_movement_id_muscle_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_muscles
    ADD CONSTRAINT movement_muscles_movement_id_muscle_group_id_key UNIQUE (movement_id, muscle_group_name);


--
-- Name: movement_muscles movement_muscles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_muscles
    ADD CONSTRAINT movement_muscles_pkey PRIMARY KEY (id);


--
-- Name: movement_usage movement_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_usage
    ADD CONSTRAINT movement_usage_pkey PRIMARY KEY (id);


--
-- Name: movement_usage movement_usage_user_id_movement_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_usage
    ADD CONSTRAINT movement_usage_user_id_movement_id_key UNIQUE (user_id, movement_id);


--
-- Name: movements movements_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_code_unique UNIQUE (code);


--
-- Name: movements movements_movement_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_movement_number_unique UNIQUE (movement_number);


--
-- Name: movements movements_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_name_key UNIQUE (name);


--
-- Name: movements movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_pkey PRIMARY KEY (id);


--
-- Name: muscle_groups muscle_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscle_groups
    ADD CONSTRAINT muscle_groups_name_key UNIQUE (name);


--
-- Name: muscle_groups muscle_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscle_groups
    ADD CONSTRAINT muscle_groups_pkey PRIMARY KEY (id);


--
-- Name: music_tracks music_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_tracks
    ADD CONSTRAINT music_tracks_pkey PRIMARY KEY (id);


--
-- Name: pii_field_registry pii_field_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pii_field_registry
    ADD CONSTRAINT pii_field_registry_pkey PRIMARY KEY (id);


--
-- Name: pii_field_registry pii_field_registry_table_schema_table_name_column_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pii_field_registry
    ADD CONSTRAINT pii_field_registry_table_schema_table_name_column_name_key UNIQUE (table_schema, table_name, column_name);


--
-- Name: pii_tokens pii_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pii_tokens
    ADD CONSTRAINT pii_tokens_pkey PRIMARY KEY (id);


--
-- Name: pii_tokens pii_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pii_tokens
    ADD CONSTRAINT pii_tokens_token_key UNIQUE (token);


--
-- Name: preparation_scripts preparation_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preparation_scripts
    ADD CONSTRAINT preparation_scripts_pkey PRIMARY KEY (id);


--
-- Name: ropa_audit_log ropa_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ropa_audit_log
    ADD CONSTRAINT ropa_audit_log_pkey PRIMARY KEY (id);


--
-- Name: sequence_rules sequence_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_rules
    ADD CONSTRAINT sequence_rules_pkey PRIMARY KEY (id);


--
-- Name: sequence_rules sequence_rules_rule_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_rules
    ADD CONSTRAINT sequence_rules_rule_number_key UNIQUE (rule_number);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);


--
-- Name: teaching_cues teaching_cues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teaching_cues
    ADD CONSTRAINT teaching_cues_pkey PRIMARY KEY (id);


--
-- Name: transitions transitions_from_position_to_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transitions
    ADD CONSTRAINT transitions_from_position_to_position_key UNIQUE (from_position, to_position);


--
-- Name: transitions transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transitions
    ADD CONSTRAINT transitions_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: user_profiles user_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_token_key UNIQUE (email_token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warmup_routines warmup_routines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warmup_routines
    ADD CONSTRAINT warmup_routines_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_agent_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_agent_type ON public.ai_decision_log USING btree (agent_type);


--
-- Name: idx_ai_model_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_model_name ON public.ai_decision_log USING btree (model_name);


--
-- Name: idx_ai_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_timestamp ON public.ai_decision_log USING btree ("timestamp" DESC);


--
-- Name: idx_ai_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_user_id ON public.ai_decision_log USING btree (user_id);


--
-- Name: idx_beta_feedback_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beta_feedback_created ON public.beta_feedback USING btree (created_at DESC);


--
-- Name: idx_beta_feedback_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beta_feedback_status ON public.beta_feedback USING btree (status);


--
-- Name: idx_beta_feedback_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beta_feedback_type ON public.beta_feedback USING btree (feedback_type);


--
-- Name: idx_beta_feedback_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beta_feedback_user_id ON public.beta_feedback USING btree (user_id);


--
-- Name: idx_bias_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bias_metric ON public.bias_monitoring USING btree (metric_name);


--
-- Name: idx_bias_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bias_model ON public.bias_monitoring USING btree (model_name);


--
-- Name: idx_bias_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bias_timestamp ON public.bias_monitoring USING btree ("timestamp" DESC);


--
-- Name: idx_class_history_class_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_history_class_plan ON public.class_history USING btree (class_plan_id);


--
-- Name: idx_class_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_history_date ON public.class_history USING btree (taught_date);


--
-- Name: idx_class_history_movements_snapshot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_history_movements_snapshot ON public.class_history USING gin (movements_snapshot);


--
-- Name: idx_class_history_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_history_user ON public.class_history USING btree (user_id);


--
-- Name: idx_class_history_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_history_user_date ON public.class_history USING btree (user_id, taught_date DESC);


--
-- Name: idx_class_movements_class_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_movements_class_plan ON public.class_movements USING btree (class_plan_id);


--
-- Name: idx_class_movements_movement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_movements_movement ON public.class_movements USING btree (movement_id);


--
-- Name: idx_class_movements_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_movements_sequence ON public.class_movements USING btree (class_plan_id, sequence_order);


--
-- Name: idx_class_plans_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_plans_difficulty ON public.class_plans USING btree (difficulty_level);


--
-- Name: idx_class_plans_is_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_plans_is_template ON public.class_plans USING btree (is_template);


--
-- Name: idx_class_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_plans_status ON public.class_plans USING btree (status);


--
-- Name: idx_class_plans_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_plans_user ON public.class_plans USING btree (user_id);


--
-- Name: idx_closing_homecare_focus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_closing_homecare_focus ON public.closing_homecare_advice USING btree (focus_area);


--
-- Name: idx_closing_meditation_intensity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_closing_meditation_intensity ON public.closing_meditation_scripts USING btree (post_intensity);


--
-- Name: idx_closing_meditation_theme; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_closing_meditation_theme ON public.closing_meditation_scripts USING btree (meditation_theme);


--
-- Name: idx_common_mistakes_movement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_common_mistakes_movement ON public.common_mistakes USING btree (movement_id);


--
-- Name: idx_cooldown_has_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cooldown_has_video ON public.cooldown_sequences USING btree (video_url) WHERE (video_url IS NOT NULL);


--
-- Name: idx_cooldown_sequences_allow_ai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cooldown_sequences_allow_ai ON public.cooldown_sequences USING btree (allow_ai_generation);


--
-- Name: idx_cooldown_sequences_intensity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cooldown_sequences_intensity ON public.cooldown_sequences USING btree (intensity_level);


--
-- Name: idx_cooldown_sequences_required_muscles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cooldown_sequences_required_muscles ON public.cooldown_sequences USING gin (required_muscle_groups);


--
-- Name: idx_drift_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drift_model ON public.model_drift_log USING btree (model_name);


--
-- Name: idx_drift_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drift_timestamp ON public.model_drift_log USING btree ("timestamp" DESC);


--
-- Name: idx_homecare_has_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homecare_has_video ON public.closing_homecare_advice USING btree (video_url) WHERE (video_url IS NOT NULL);


--
-- Name: idx_llm_invocation_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_invocation_log_created_at ON public.llm_invocation_log USING btree (created_at DESC);


--
-- Name: idx_llm_invocation_log_llm_called; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_invocation_log_llm_called ON public.llm_invocation_log USING btree (llm_called);


--
-- Name: idx_llm_invocation_log_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_invocation_log_method ON public.llm_invocation_log USING btree (method_used);


--
-- Name: idx_llm_invocation_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_invocation_log_user_id ON public.llm_invocation_log USING btree (user_id);


--
-- Name: idx_medical_exclusions_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_exclusions_student ON public.medical_exclusions_log USING btree (student_profile_id);


--
-- Name: idx_medical_exclusions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_exclusions_type ON public.medical_exclusions_log USING btree (exclusion_type);


--
-- Name: idx_medical_exclusions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_exclusions_user ON public.medical_exclusions_log USING btree (user_id);


--
-- Name: idx_meditation_has_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meditation_has_video ON public.closing_meditation_scripts USING btree (video_url) WHERE (video_url IS NOT NULL);


--
-- Name: idx_movement_levels_level_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_levels_level_number ON public.movement_levels USING btree (level_number);


--
-- Name: idx_movement_levels_movement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_levels_movement_id ON public.movement_levels USING btree (movement_id);


--
-- Name: idx_movement_muscles_movement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_muscles_movement ON public.movement_muscles USING btree (movement_id);


--
-- Name: idx_movement_muscles_muscle_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_muscles_muscle_group ON public.movement_muscles USING btree (muscle_group_name);


--
-- Name: idx_movement_usage_last_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_usage_last_used ON public.movement_usage USING btree (last_used_date);


--
-- Name: idx_movement_usage_movement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_usage_movement ON public.movement_usage USING btree (movement_id);


--
-- Name: idx_movement_usage_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movement_usage_user ON public.movement_usage USING btree (user_id);


--
-- Name: idx_movements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_category ON public.movements USING btree (category);


--
-- Name: idx_movements_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_code ON public.movements USING btree (code);


--
-- Name: idx_movements_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_difficulty ON public.movements USING btree (difficulty_level);


--
-- Name: idx_movements_has_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_has_video ON public.movements USING btree (video_url) WHERE (video_url IS NOT NULL);


--
-- Name: idx_movements_movement_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_movement_number ON public.movements USING btree (movement_number);


--
-- Name: idx_movements_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_name ON public.movements USING btree (name);


--
-- Name: idx_movements_setup_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_setup_position ON public.movements USING btree (setup_position);


--
-- Name: idx_music_tracks_bpm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_tracks_bpm ON public.music_tracks USING btree (bpm) WHERE (bpm IS NOT NULL);


--
-- Name: idx_music_tracks_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_tracks_is_active ON public.music_tracks USING btree (is_active);


--
-- Name: idx_music_tracks_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_tracks_source ON public.music_tracks USING btree (source);


--
-- Name: idx_music_tracks_stylistic_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_tracks_stylistic_period ON public.music_tracks USING btree (stylistic_period);


--
-- Name: idx_pii_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_category ON public.pii_field_registry USING btree (pii_category);


--
-- Name: idx_pii_registry_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_registry_lookup ON public.pii_field_registry USING btree (table_schema, table_name, column_name);


--
-- Name: idx_pii_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_tokens_token ON public.pii_tokens USING btree (token);


--
-- Name: idx_pii_tokens_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pii_tokens_type ON public.pii_tokens USING btree (pii_type);


--
-- Name: idx_preparation_has_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preparation_has_video ON public.preparation_scripts USING btree (video_url) WHERE (video_url IS NOT NULL);


--
-- Name: idx_preparation_scripts_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preparation_scripts_type ON public.preparation_scripts USING btree (script_type);


--
-- Name: idx_ropa_processing_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ropa_processing_system ON public.ropa_audit_log USING btree (processing_system);


--
-- Name: idx_ropa_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ropa_timestamp ON public.ropa_audit_log USING btree ("timestamp" DESC);


--
-- Name: idx_ropa_transaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ropa_transaction_type ON public.ropa_audit_log USING btree (transaction_type);


--
-- Name: idx_ropa_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ropa_user_id ON public.ropa_audit_log USING btree (user_id);


--
-- Name: idx_sensitive_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensitive_data ON public.pii_field_registry USING btree (is_sensitive) WHERE (is_sensitive = true);


--
-- Name: idx_sequence_rules_parameter_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequence_rules_parameter_key ON public.sequence_rules USING btree (parameter_key) WHERE (parameter_key IS NOT NULL);


--
-- Name: idx_student_profiles_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_profiles_instructor ON public.student_profiles USING btree (instructor_id);


--
-- Name: idx_student_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_profiles_is_active ON public.student_profiles USING btree (is_active);


--
-- Name: idx_teaching_cues_movement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teaching_cues_movement ON public.teaching_cues USING btree (movement_id);


--
-- Name: idx_teaching_cues_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teaching_cues_type ON public.teaching_cues USING btree (cue_type);


--
-- Name: idx_user_preferences_classes_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_classes_completed ON public.user_preferences USING btree (classes_completed);


--
-- Name: idx_user_preferences_experience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_experience ON public.user_preferences USING btree (experience_level);


--
-- Name: idx_user_preferences_reasoner_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_reasoner_mode ON public.user_preferences USING btree (use_reasoner_mode);


--
-- Name: idx_user_profiles_age_range; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_age_range ON public.user_profiles USING btree (age_range);


--
-- Name: idx_user_profiles_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_country ON public.user_profiles USING btree (country);


--
-- Name: idx_user_profiles_pilates_experience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_pilates_experience ON public.user_profiles USING btree (pilates_experience);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_warmup_has_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warmup_has_video ON public.warmup_routines USING btree (video_url) WHERE (video_url IS NOT NULL);


--
-- Name: idx_warmup_routines_allow_ai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warmup_routines_allow_ai ON public.warmup_routines USING btree (allow_ai_generation);


--
-- Name: idx_warmup_routines_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warmup_routines_difficulty ON public.warmup_routines USING btree (difficulty_level);


--
-- Name: idx_warmup_routines_focus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warmup_routines_focus ON public.warmup_routines USING btree (focus_area);


--
-- Name: idx_warmup_routines_required_muscles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warmup_routines_required_muscles ON public.warmup_routines USING gin (required_muscle_groups);


--
-- Name: music_tracks music_tracks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER music_tracks_updated_at BEFORE UPDATE ON public.music_tracks FOR EACH ROW EXECUTE FUNCTION public.update_music_tracks_updated_at();


--
-- Name: student_profiles trigger_log_pregnancy_detection; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_pregnancy_detection BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.log_pregnancy_detection();


--
-- Name: beta_feedback update_beta_feedback_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_beta_feedback_updated_at_trigger BEFORE UPDATE ON public.beta_feedback FOR EACH ROW EXECUTE FUNCTION public.update_beta_feedback_updated_at();


--
-- Name: class_plans update_class_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_plans_updated_at BEFORE UPDATE ON public.class_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: movement_usage update_movement_usage_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_movement_usage_updated_at BEFORE UPDATE ON public.movement_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: movements update_movements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON public.movements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_profiles update_student_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: beta_feedback beta_feedback_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beta_feedback
    ADD CONSTRAINT beta_feedback_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


--
-- Name: beta_feedback beta_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beta_feedback
    ADD CONSTRAINT beta_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: class_history class_history_class_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_history
    ADD CONSTRAINT class_history_class_plan_id_fkey FOREIGN KEY (class_plan_id) REFERENCES public.class_plans(id) ON DELETE SET NULL;


--
-- Name: class_history class_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_history
    ADD CONSTRAINT class_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_movements class_movements_class_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_movements
    ADD CONSTRAINT class_movements_class_plan_id_fkey FOREIGN KEY (class_plan_id) REFERENCES public.class_plans(id) ON DELETE CASCADE;


--
-- Name: class_movements class_movements_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_movements
    ADD CONSTRAINT class_movements_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: class_plans class_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_plans
    ADD CONSTRAINT class_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: common_mistakes common_mistakes_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_mistakes
    ADD CONSTRAINT common_mistakes_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: llm_invocation_log llm_invocation_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_invocation_log
    ADD CONSTRAINT llm_invocation_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: medical_exclusions_log medical_exclusions_log_student_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_exclusions_log
    ADD CONSTRAINT medical_exclusions_log_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;


--
-- Name: medical_exclusions_log medical_exclusions_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_exclusions_log
    ADD CONSTRAINT medical_exclusions_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: movement_levels movement_levels_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_levels
    ADD CONSTRAINT movement_levels_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: movement_muscles movement_muscles_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_muscles
    ADD CONSTRAINT movement_muscles_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: movement_usage movement_usage_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_usage
    ADD CONSTRAINT movement_usage_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: movement_usage movement_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movement_usage
    ADD CONSTRAINT movement_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_profiles student_profiles_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teaching_cues teaching_cues_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teaching_cues
    ADD CONSTRAINT teaching_cues_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: movements Admins can manage movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage movements" ON public.movements USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: muscle_groups Admins can manage muscle groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage muscle groups" ON public.muscle_groups USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: teaching_cues Admins can manage teaching cues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teaching cues" ON public.teaching_cues USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: beta_feedback Admins can update all feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all feedback" ON public.beta_feedback FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: beta_feedback Admins can view all feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all feedback" ON public.beta_feedback FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: llm_invocation_log Admins can view all invocation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all invocation logs" ON public.llm_invocation_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: cooldown_sequences Authenticated users can view cooldown sequences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view cooldown sequences" ON public.cooldown_sequences FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: closing_homecare_advice Authenticated users can view homecare advice; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view homecare advice" ON public.closing_homecare_advice FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: closing_meditation_scripts Authenticated users can view meditation scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view meditation scripts" ON public.closing_meditation_scripts FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: movement_levels Authenticated users can view movement levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view movement levels" ON public.movement_levels FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: preparation_scripts Authenticated users can view preparation scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view preparation scripts" ON public.preparation_scripts FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: warmup_routines Authenticated users can view warmup routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view warmup routines" ON public.warmup_routines FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: common_mistakes Common mistakes are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Common mistakes are publicly readable" ON public.common_mistakes FOR SELECT USING (true);


--
-- Name: student_profiles Instructors can create student profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Instructors can create student profiles" ON public.student_profiles FOR INSERT WITH CHECK ((auth.uid() = instructor_id));


--
-- Name: student_profiles Instructors can delete own students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Instructors can delete own students" ON public.student_profiles FOR DELETE USING ((auth.uid() = instructor_id));


--
-- Name: POLICY "Instructors can delete own students" ON student_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Instructors can delete own students" ON public.student_profiles IS 'Implements GDPR right to erasure - instructors can delete student data';


--
-- Name: student_profiles Instructors can update own students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Instructors can update own students" ON public.student_profiles FOR UPDATE USING ((auth.uid() = instructor_id));


--
-- Name: student_profiles Instructors can view own students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Instructors can view own students" ON public.student_profiles FOR SELECT USING ((auth.uid() = instructor_id));


--
-- Name: movement_muscles Movement muscles are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Movement muscles are publicly readable" ON public.movement_muscles FOR SELECT USING (true);


--
-- Name: movement_usage Movement usage can be tracked; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Movement usage can be tracked" ON public.movement_usage USING ((auth.uid() = user_id));


--
-- Name: movements Movements are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Movements are publicly readable" ON public.movements FOR SELECT USING (true);


--
-- Name: POLICY "Movements are publicly readable" ON movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Movements are publicly readable" ON public.movements IS 'Movements are reference data, safe to expose publicly';


--
-- Name: muscle_groups Muscle groups are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Muscle groups are publicly readable" ON public.muscle_groups FOR SELECT USING (true);


--
-- Name: pii_tokens PII tokens are service-role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "PII tokens are service-role only" ON public.pii_tokens USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: POLICY "PII tokens are service-role only" ON pii_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "PII tokens are service-role only" ON public.pii_tokens IS 'CRITICAL: PII tokens must only be accessed by backend service role, never by client';


--
-- Name: sequence_rules Sequence rules are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sequence rules are publicly readable" ON public.sequence_rules FOR SELECT USING (true);


--
-- Name: llm_invocation_log Service can insert invocation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert invocation logs" ON public.llm_invocation_log FOR INSERT WITH CHECK (true);


--
-- Name: class_history Service role can access all class history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can access all class history" ON public.class_history USING ((((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text));


--
-- Name: POLICY "Service role can access all class history" ON class_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role can access all class history" ON public.class_history IS 'Allows backend service role to access all class history for GDPR compliance operations (Article 15: Right to Access)';


--
-- Name: class_plans Service role can access all class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can access all class plans" ON public.class_plans USING ((((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text));


--
-- Name: POLICY "Service role can access all class plans" ON class_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role can access all class plans" ON public.class_plans IS 'Allows backend service role to access all class plans for GDPR compliance operations (Article 15: Right to Access)';


--
-- Name: bias_monitoring Service role can insert bias monitoring records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert bias monitoring records" ON public.bias_monitoring FOR INSERT WITH CHECK (true);


--
-- Name: medical_exclusions_log Service role can insert medical exclusions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert medical exclusions" ON public.medical_exclusions_log FOR INSERT WITH CHECK (true);


--
-- Name: model_drift_log Service role can insert model drift records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert model drift records" ON public.model_drift_log FOR INSERT WITH CHECK (true);


--
-- Name: bias_monitoring Service role can read bias monitoring records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read bias monitoring records" ON public.bias_monitoring FOR SELECT USING (true);


--
-- Name: model_drift_log Service role can read model drift records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read model drift records" ON public.model_drift_log FOR SELECT USING (true);


--
-- Name: teaching_cues Teaching cues are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teaching cues are publicly readable" ON public.teaching_cues FOR SELECT USING (true);


--
-- Name: class_plans Templates are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Templates are publicly readable" ON public.class_plans FOR SELECT USING (((is_template = true) AND ((status)::text = 'published'::text)));


--
-- Name: POLICY "Templates are publicly readable" ON class_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Templates are publicly readable" ON public.class_plans IS 'Published templates are shareable community resources';


--
-- Name: transitions Transitions are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Transitions are publicly readable" ON public.transitions FOR SELECT USING (true);


--
-- Name: class_movements Users can add movements to own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add movements to own class plans" ON public.class_movements FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.class_plans
  WHERE ((class_plans.id = class_movements.class_plan_id) AND (class_plans.user_id = auth.uid())))));


--
-- Name: class_history Users can create own class history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own class history" ON public.class_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: class_plans Users can create own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own class plans" ON public.class_plans FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: class_movements Users can delete movements from own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete movements from own class plans" ON public.class_movements FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.class_plans
  WHERE ((class_plans.id = class_movements.class_plan_id) AND (class_plans.user_id = auth.uid())))));


--
-- Name: class_plans Users can delete own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own class plans" ON public.class_plans FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: beta_feedback Users can insert own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own feedback" ON public.beta_feedback FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: class_movements Users can update movements in own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update movements in own class plans" ON public.class_movements FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.class_plans
  WHERE ((class_plans.id = class_movements.class_plan_id) AND (class_plans.user_id = auth.uid())))));


--
-- Name: class_history Users can update own class history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own class history" ON public.class_history FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: class_plans Users can update own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own class plans" ON public.class_plans FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: class_history Users can view own class history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own class history" ON public.class_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: class_movements Users can view own class movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own class movements" ON public.class_movements FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.class_plans
  WHERE ((class_plans.id = class_movements.class_plan_id) AND (class_plans.user_id = auth.uid())))));


--
-- Name: class_plans Users can view own class plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own class plans" ON public.class_plans FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: POLICY "Users can view own class plans" ON class_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Users can view own class plans" ON public.class_plans IS 'Users can only see their own class plans (privacy)';


--
-- Name: beta_feedback Users can view own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own feedback" ON public.beta_feedback FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: llm_invocation_log Users can view own invocation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own invocation logs" ON public.llm_invocation_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: medical_exclusions_log Users can view own medical exclusions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own medical exclusions" ON public.medical_exclusions_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: movement_usage Users can view own movement usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own movement usage" ON public.movement_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: ai_decision_log Users can view their own AI decisions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own AI decisions" ON public.ai_decision_log FOR SELECT USING (((user_id)::text = (auth.uid())::text));


--
-- Name: ropa_audit_log Users can view their own PII transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own PII transactions" ON public.ropa_audit_log FOR SELECT USING (((user_id)::text = (auth.uid())::text));


--
-- Name: ai_decision_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_decision_log ENABLE ROW LEVEL SECURITY;

--
-- Name: beta_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: bias_monitoring; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bias_monitoring ENABLE ROW LEVEL SECURITY;

--
-- Name: class_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_history ENABLE ROW LEVEL SECURITY;

--
-- Name: class_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: class_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: closing_homecare_advice; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.closing_homecare_advice ENABLE ROW LEVEL SECURITY;

--
-- Name: closing_meditation_scripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.closing_meditation_scripts ENABLE ROW LEVEL SECURITY;

--
-- Name: common_mistakes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.common_mistakes ENABLE ROW LEVEL SECURITY;

--
-- Name: cooldown_sequences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cooldown_sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: llm_invocation_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.llm_invocation_log ENABLE ROW LEVEL SECURITY;

--
-- Name: medical_exclusions_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medical_exclusions_log ENABLE ROW LEVEL SECURITY;

--
-- Name: model_drift_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.model_drift_log ENABLE ROW LEVEL SECURITY;

--
-- Name: movement_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movement_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: movement_muscles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movement_muscles ENABLE ROW LEVEL SECURITY;

--
-- Name: movement_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movement_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

--
-- Name: muscle_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: music_tracks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

--
-- Name: music_tracks music_tracks_insert_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY music_tracks_insert_service ON public.music_tracks FOR INSERT WITH CHECK (false);


--
-- Name: music_tracks music_tracks_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY music_tracks_select_active ON public.music_tracks FOR SELECT USING ((is_active = true));


--
-- Name: music_tracks music_tracks_update_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY music_tracks_update_service ON public.music_tracks FOR UPDATE USING (false);


--
-- Name: pii_field_registry; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pii_field_registry ENABLE ROW LEVEL SECURITY;

--
-- Name: pii_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pii_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: preparation_scripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.preparation_scripts ENABLE ROW LEVEL SECURITY;

--
-- Name: ropa_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ropa_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: sequence_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sequence_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: pii_field_registry service_role_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_only ON public.pii_field_registry USING (true);


--
-- Name: student_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: teaching_cues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teaching_cues ENABLE ROW LEVEL SECURITY;

--
-- Name: transitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transitions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: warmup_routines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.warmup_routines ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict zRqLlkUV0xm6WYEvFAHGIcuAteGif9rcqSNLHuZ8bboF32KQ87MYF8xT8bJxwzD

