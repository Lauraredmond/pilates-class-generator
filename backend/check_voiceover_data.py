import os
from supabase import create_client

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials in environment")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check preparation scripts
print("=== PREPARATION SCRIPTS ===")
prep_result = supabase.table('preparation_scripts').select('script_name, voiceover_url, voiceover_duration, voiceover_enabled').execute()
for row in prep_result.data:
    print(f"{row['script_name']}: voiceover_enabled={row.get('voiceover_enabled')}, url={row.get('voiceover_url', 'None')}")

print("\n=== WARMUP ROUTINES ===")
warmup_result = supabase.table('warmup_routines').select('routine_name, voiceover_url, voiceover_duration, voiceover_enabled').execute()
for row in warmup_result.data:
    print(f"{row['routine_name']}: voiceover_enabled={row.get('voiceover_enabled')}, url={row.get('voiceover_url', 'None')}")

print("\n=== COOLDOWN SEQUENCES ===")
cooldown_result = supabase.table('cooldown_sequences').select('sequence_name, voiceover_url, voiceover_duration, voiceover_enabled').execute()
for row in cooldown_result.data:
    print(f"{row['sequence_name']}: voiceover_enabled={row.get('voiceover_enabled')}, url={row.get('voiceover_url', 'None')}")

print("\n=== MEDITATION SCRIPTS ===")
meditation_result = supabase.table('closing_meditation_scripts').select('script_name, voiceover_url, voiceover_duration, voiceover_enabled').execute()
for row in meditation_result.data:
    print(f"{row['script_name']}: voiceover_enabled={row.get('voiceover_enabled')}, url={row.get('voiceover_url', 'None')}")

print("\n=== HOMECARE ADVICE ===")
homecare_result = supabase.table('closing_homecare_advice').select('advice_name, voiceover_url, voiceover_duration, voiceover_enabled').execute()
for row in homecare_result.data:
    print(f"{row['advice_name']}: voiceover_enabled={row.get('voiceover_enabled')}, url={row.get('voiceover_url', 'None')}")
