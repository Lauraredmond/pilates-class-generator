"""
Quick migration runner
Executes SQL migration files against Supabase
"""

import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def run_migration(migration_file: str):
    """Run a SQL migration file"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

    # Read SQL file
    migration_path = Path(__file__).parent.parent.parent / 'database' / 'migrations' / migration_file

    with open(migration_path, 'r') as f:
        sql = f.read()

    print(f"Running migration: {migration_file}")
    print(f"SQL length: {len(sql)} characters")

    # Execute via raw SQL
    # Note: Supabase Python client doesn't support raw SQL execution directly
    # You need to run this via the Supabase dashboard SQL editor
    print("\n" + "="*60)
    print("MIGRATION SQL:")
    print("="*60)
    print(sql)
    print("="*60)
    print("\nPlease run this SQL in Supabase Dashboard SQL Editor:")
    print(f"https://supabase.com/dashboard/project/lixvcebtwusmaipodcpc/sql/new")

if __name__ == "__main__":
    run_migration('004_remove_excel_references.sql')
