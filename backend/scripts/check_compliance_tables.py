"""
Quick script to check if compliance tables exist in Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Checking compliance tables...\n")

tables_to_check = [
    "ropa_audit_log",
    "ai_decision_log",
    "bias_monitoring",
    "model_drift_log"
]

for table in tables_to_check:
    try:
        # Try to select from the table
        result = supabase.table(table).select("*").limit(1).execute()
        print(f"✅ {table} - EXISTS (columns: {len(result.data[0].keys()) if result.data else 'empty'})")

        # Show columns if table has data
        if result.data:
            print(f"   Columns: {', '.join(result.data[0].keys())}")
    except Exception as e:
        error_msg = str(e).lower()
        if "does not exist" in error_msg or "relation" in error_msg:
            print(f"❌ {table} - DOES NOT EXIST")
            print(f"   Error: {e}")
        else:
            print(f"⚠️  {table} - ERROR: {e}")
    print()

print("\n📊 Summary:")
print("If tables don't exist, run the SQL migration files in Supabase:")
print("1. database/migrations/01_ropa_audit_log.sql")
print("2. database/migrations/02_ai_decision_log.sql")
print("3. database/migrations/03_bias_monitoring.sql")
print("4. database/migrations/04_model_drift_log.sql")
