-- Update all transition voiceover URLs
-- Based on EXACT filenames from 11. Audio folder uploaded to Supabase storage

-- Kneeling transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_kneeling.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_Supine.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_prone.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_seated.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_SideLying.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Side-lying';

-- Supine transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_kneeling.mp3' WHERE from_position = 'Supine' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_supine.mp3' WHERE from_position = 'Supine' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_prone.mp3' WHERE from_position = 'Supine' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_seated.mp3' WHERE from_position = 'Supine' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_sideLying.mp3' WHERE from_position = 'Supine' AND to_position = 'Side-lying';

-- Prone transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_supine.mp3' WHERE from_position = 'Prone' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_kneeling.mp3' WHERE from_position = 'Prone' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_seated.mp3' WHERE from_position = 'Prone' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_prone.mp3' WHERE from_position = 'Prone' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_SideLying.mp3' WHERE from_position = 'Prone' AND to_position = 'Side-lying';

-- Seated transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_supine.mp3' WHERE from_position = 'Seated' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_kneeling.mp3' WHERE from_position = 'Seated' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_prone.mp3' WHERE from_position = 'Seated' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_seated.mp3' WHERE from_position = 'Seated' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_SideLying.mp3' WHERE from_position = 'Seated' AND to_position = 'Side-lying';

-- Side-lying transitions (NOTE: filenames use "SideLying" not "Side-lying")
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Supine.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_SideLying.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Side-lying';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Seated.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Prone.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Kneeling.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Kneeling';

-- Verify all updates
SELECT
  from_position,
  to_position,
  CASE
    WHEN voiceover_url IS NOT NULL THEN '✓ Updated'
    ELSE '✗ Missing'
  END AS status,
  voiceover_url
FROM transitions
ORDER BY from_position, to_position;
