#!/bin/bash

# Script to remove remaining sensitive data from repository

echo "🔍 Removing sensitive data from tracked files..."

# 1. Replace hardcoded Supabase project IDs with environment variable checks
echo "📝 Replacing Supabase project IDs with environment variables..."

# backend/api/agents.py
sed -i '' "s/elif 'gntqrebxmpdjyuxztwww' in supabase_url:/elif os.getenv('SUPABASE_PROJECT_ID', '') in supabase_url:/" backend/api/agents.py

# backend/api/debug.py
sed -i '' "s/elif 'gntqrebxmpdjyuxztwww' in supabase_url:/elif os.getenv('SUPABASE_PROJECT_ID', '') in supabase_url:/" backend/api/debug.py
sed -i '' "s/elif 'gntqrebxmpdjyuxztwww' in supabase_url:/elif os.getenv('SUPABASE_PROJECT_ID', '') in supabase_url:/" backend/api/debug.py

# backend/utils/supabase_client.py
sed -i '' "s/elif 'gntqrebxmpdjyuxztwww' in SUPABASE_URL:/elif os.getenv('SUPABASE_PROJECT_ID', '') in SUPABASE_URL:/" backend/utils/supabase_client.py

# 2. Remove project ID from documentation files
echo "📝 Sanitizing documentation files..."

# database/migrations/README_RLS_FIX.md
sed -i '' 's/gntqrebxmpdjyuxztwww/\[PROJECT_ID\]/g' database/migrations/README_RLS_FIX.md
sed -i '' 's/jinhyb-nisreh-6maRto/\[DATABASE_PASSWORD\]/g' database/migrations/README_RLS_FIX.md

# docs/S3_MUSIC_MIGRATION_GUIDE.md
sed -i '' 's/gntqrebxmpdjyuxztwww/\[PROJECT_ID\]/g' docs/S3_MUSIC_MIGRATION_GUIDE.md

echo "✅ Sensitive data removed from tracked files"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Add SUPABASE_PROJECT_ID to your environment variables"
echo "2. Update backend code to import os where needed"
echo "3. Commit these changes"
echo "4. Rotate the following credentials immediately:"
echo "   - laura.bassline@proton.me password"
echo "   - Database password (jinhyb-nisreh-6maRto)"
echo "   - Generate new Supabase API keys"