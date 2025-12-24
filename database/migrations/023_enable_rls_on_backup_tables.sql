-- Migration 023: Enable RLS on backup tables
-- Date: 2025-12-24
-- Purpose: Fix Supabase Security Advisor warnings for music backup tables

-- Enable Row Level Security on backup tables
ALTER TABLE public.music_playlists_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_playlists_tracks_backup ENABLE ROW LEVEL SECURITY;

-- Create policies: Service role only (these are backup tables)
-- Only authenticated service role can access backup tables

-- Policy for music_playlists_backup
CREATE POLICY "Service role can access music_playlists_backup"
ON public.music_playlists_backup
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy for music_playlists_tracks_backup
CREATE POLICY "Service role can access music_playlists_tracks_backup"
ON public.music_playlists_tracks_backup
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: Allow authenticated users to READ backup tables (if needed for recovery)
-- Uncomment if you want users to see backup data:
-- CREATE POLICY "Authenticated users can read music_playlists_backup"
-- ON public.music_playlists_backup
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Authenticated users can read music_playlists_tracks_backup"
-- ON public.music_playlists_tracks_backup
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'music_playlists_backup') THEN
    RAISE EXCEPTION 'RLS not enabled on music_playlists_backup';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'music_playlists_tracks_backup') THEN
    RAISE EXCEPTION 'RLS not enabled on music_playlists_tracks_backup';
  END IF;

  RAISE NOTICE 'RLS successfully enabled on both backup tables';
END $$;
