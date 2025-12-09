-- Verify preparation script has voiceover configured
-- Run this in Supabase SQL Editor

SELECT
  script_name,
  LEFT(narrative, 50) || '...' AS narrative_preview,
  voiceover_url,
  voiceover_duration,
  voiceover_enabled,
  created_at,
  updated_at
FROM preparation_scripts;

-- Expected result:
-- script_name: 'Pilates Principles Introduction'
-- voiceover_url: 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/1-preparation-phase.mp3'
-- voiceover_duration: 107
-- voiceover_enabled: true
