"""
Supabase Client Singleton
Shared Supabase client instance for the entire backend
"""

import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# CRITICAL FIX: Only load .env file if NOT in production
# This prevents .env files from overriding Render environment variables
if os.getenv("RENDER") != "true":
    logger.info("🔧 Loading .env file (local development)")
    load_dotenv()
else:
    logger.info("☁️ Using Render environment variables (production/dev deployment)")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Add diagnostic logging to identify which database we're connecting to
if SUPABASE_URL:
    if 'lixvcebtwusmaipodcpc' in SUPABASE_URL:
        logger.warning("🚨 CONNECTING TO PRODUCTION SUPABASE: %s", SUPABASE_URL[:50])
    elif 'gntqrebxmpdjyuxztwww' in SUPABASE_URL:
        logger.info("✅ CONNECTING TO DEV SUPABASE: %s", SUPABASE_URL[:50])
    else:
        logger.info("📊 CONNECTING TO SUPABASE: %s", SUPABASE_URL[:50])
else:
    logger.error("❌ SUPABASE_URL not set!")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Create singleton Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
logger.info("✅ Supabase client created successfully")


def get_supabase_client() -> Client:
    """
    FastAPI dependency injection function for Supabase client.

    Returns:
        Supabase client instance
    """
    return supabase
