"""
Supabase Admin Client - Service Role Key
Uses service role key to bypass RLS for compliance and system operations

This client should ONLY be used for:
1. Compliance operations (GDPR data export, ROPA logging)
2. System-level operations (audit logs, AI decision logging)
3. Admin operations (bias monitoring, model drift)

For regular user operations, use the standard supabase_client.py
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL must be set in environment variables")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError(
        "SUPABASE_SERVICE_ROLE_KEY must be set in environment variables. "
        "This is required for compliance operations. "
        "Find it in: Supabase Dashboard -> Settings -> API -> service_role key"
    )

# Create admin Supabase client with service role key
# This bypasses Row-Level Security (RLS) policies
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
