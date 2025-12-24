"""
Debug endpoints for troubleshooting environment issues
IMPORTANT: Remove this file before production deployment!
"""

import os
import logging
from pathlib import Path
from fastapi import APIRouter, Depends
from typing import Dict, Any

from utils.supabase_client import get_supabase_client, SUPABASE_URL

router = APIRouter(prefix="/api/debug", tags=["debug"])
logger = logging.getLogger(__name__)


@router.get("/environment", response_model=Dict[str, Any])
async def debug_environment():
    """
    Debug endpoint to check environment configuration
    WARNING: This exposes sensitive information - remove before production!
    """

    # Check if .env file exists
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    env_exists = env_file.exists()

    # Get environment info
    is_render = os.getenv("RENDER") == "true"
    supabase_url = os.getenv("SUPABASE_URL", "NOT_SET")

    # Determine which database
    database_type = "UNKNOWN"
    if 'lixvcebtwusmaipodcpc' in supabase_url:
        database_type = "PRODUCTION"
    elif 'gntqrebxmpdjyuxztwww' in supabase_url:
        database_type = "DEV"

    # Check if supabase client is working
    try:
        supabase = get_supabase_client()
        # Try to query music tracks to verify connection
        result = supabase.table("music_tracks").select("id").limit(1).execute()
        db_connection = "WORKING"
        tracks_count = len(result.data) if result.data else 0
    except Exception as e:
        db_connection = f"ERROR: {str(e)}"
        tracks_count = -1

    return {
        "environment": {
            "is_render": is_render,
            "env_file_exists": env_exists,
            "env_file_path": str(env_file) if env_exists else None,
        },
        "supabase": {
            "url": supabase_url[:50] + "..." if len(supabase_url) > 50 else supabase_url,
            "database_type": database_type,
            "connection_status": db_connection,
            "test_query_count": tracks_count,
        },
        "diagnostic": {
            "module_supabase_url": SUPABASE_URL[:50] + "..." if SUPABASE_URL and len(SUPABASE_URL) > 50 else SUPABASE_URL,
            "current_working_dir": os.getcwd(),
            "python_path": os.environ.get("PYTHONPATH", "NOT_SET"),
        },
        "warning": "⚠️ This endpoint exposes sensitive info - remove before production!"
    }


@router.get("/check-music", response_model=Dict[str, Any])
async def check_music_source():
    """
    Check which database the music is coming from
    """
    try:
        supabase = get_supabase_client()

        # Determine which database
        supabase_url = os.getenv("SUPABASE_URL", "NOT_SET")
        database_type = "UNKNOWN"
        if 'lixvcebtwusmaipodcpc' in supabase_url:
            database_type = "PRODUCTION"
        elif 'gntqrebxmpdjyuxztwww' in supabase_url:
            database_type = "DEV"

        # Query for Celtic tracks (the ones you updated differently in dev vs prod)
        celtic_tracks = supabase.table("music_tracks").select("id,title,audio_url").eq(
            "stylistic_period", "Celtic Traditional"
        ).execute()

        # Check if URLs are AWS or archive.org
        tracks_info = []
        for track in celtic_tracks.data:
            is_aws = "s3" in track["audio_url"] or "amazonaws" in track["audio_url"]
            is_archive = "archive.org" in track["audio_url"]
            tracks_info.append({
                "title": track["title"],
                "url_type": "AWS" if is_aws else "ARCHIVE.ORG" if is_archive else "OTHER",
                "url_preview": track["audio_url"][:80] + "..." if len(track["audio_url"]) > 80 else track["audio_url"]
            })

        return {
            "database": database_type,
            "celtic_tracks": tracks_info,
            "conclusion": "If AWS URLs → DEV database, If archive.org URLs → PROD database"
        }

    except Exception as e:
        return {
            "error": str(e)
        }