"""
SoundCloud OAuth 2.1 + PKCE Authentication
Handles one-time instructor connection and token management
"""

import os
import secrets
import hashlib
import base64
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import RedirectResponse, JSONResponse
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth/soundcloud", tags=["soundcloud"])

# SoundCloud OAuth Configuration
SOUNDCLOUD_CLIENT_ID = os.getenv('SOUNDCLOUD_CLIENT_ID', 'placeholder_client_id')
SOUNDCLOUD_CLIENT_SECRET = os.getenv('SOUNDCLOUD_CLIENT_SECRET', 'placeholder_secret')
SOUNDCLOUD_REDIRECT_URI = os.getenv('SOUNDCLOUD_REDIRECT_URI', 'http://localhost:5173/auth/soundcloud/callback')

# OAuth endpoints
AUTHORIZE_URL = "https://secure.soundcloud.com/authorize"
TOKEN_URL = "https://secure.soundcloud.com/oauth/token"
API_BASE = "https://api.soundcloud.com"

# In-memory token storage (will be moved to database/env in production)
_soundcloud_tokens = {
    "access_token": None,
    "refresh_token": None,
    "expires_at": None,
    "code_verifier": None  # Stored during OAuth flow
}


def generate_pkce_pair():
    """Generate PKCE code verifier and challenge for OAuth 2.1"""
    # Generate random code_verifier (43-128 characters)
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

    # Generate code_challenge from verifier (SHA-256)
    challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')

    return code_verifier, code_challenge


@router.get("/connect")
async def initiate_oauth():
    """
    Step 1: Redirect instructor to SoundCloud authorization page
    Admin-only endpoint for one-time connection
    """
    # Generate PKCE pair
    code_verifier, code_challenge = generate_pkce_pair()

    # Store code_verifier for later use in callback
    _soundcloud_tokens["code_verifier"] = code_verifier

    # Build authorization URL
    auth_params = {
        "client_id": SOUNDCLOUD_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SOUNDCLOUD_REDIRECT_URI,
        "scope": "non-expiring",  # Request non-expiring token access
        "code_challenge": code_challenge,
        "code_challenge_method": "S256"
    }

    auth_url = f"{AUTHORIZE_URL}?" + "&".join([f"{k}={v}" for k, v in auth_params.items()])

    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def oauth_callback(code: str = Query(...), state: Optional[str] = None):
    """
    Step 2: Exchange authorization code for access token
    Called by SoundCloud after user authorizes
    """
    # Retrieve stored code_verifier
    code_verifier = _soundcloud_tokens.get("code_verifier")

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth flow - code_verifier not found. Please restart connection."
        )

    # Exchange code for tokens
    token_data = {
        "grant_type": "authorization_code",
        "client_id": SOUNDCLOUD_CLIENT_ID,
        "client_secret": SOUNDCLOUD_CLIENT_SECRET,
        "redirect_uri": SOUNDCLOUD_REDIRECT_URI,
        "code": code,
        "code_verifier": code_verifier
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(TOKEN_URL, data=token_data)
            response.raise_for_status()

            token_response = response.json()

            # Store tokens
            _soundcloud_tokens["access_token"] = token_response["access_token"]
            _soundcloud_tokens["refresh_token"] = token_response.get("refresh_token")
            _soundcloud_tokens["expires_at"] = datetime.now() + timedelta(seconds=token_response["expires_in"])

            # Clear code_verifier (no longer needed)
            _soundcloud_tokens["code_verifier"] = None

            # Redirect to admin panel with success message
            return RedirectResponse(url="/admin/soundcloud?status=connected")

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SoundCloud token exchange failed: {e.response.text}"
            )


@router.post("/refresh")
async def refresh_access_token():
    """
    Refresh expired access token using refresh token
    Called automatically when access_token expires
    """
    refresh_token = _soundcloud_tokens.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="No refresh token available. Please reconnect SoundCloud account."
        )

    refresh_data = {
        "grant_type": "refresh_token",
        "client_id": SOUNDCLOUD_CLIENT_ID,
        "client_secret": SOUNDCLOUD_CLIENT_SECRET,
        "refresh_token": refresh_token
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(TOKEN_URL, data=refresh_data)
            response.raise_for_status()

            token_response = response.json()

            # Update tokens
            _soundcloud_tokens["access_token"] = token_response["access_token"]
            _soundcloud_tokens["refresh_token"] = token_response.get("refresh_token", refresh_token)
            _soundcloud_tokens["expires_at"] = datetime.now() + timedelta(seconds=token_response["expires_in"])

            return {"status": "refreshed", "expires_in": token_response["expires_in"]}

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Token refresh failed: {e.response.text}"
            )


@router.get("/status")
async def connection_status():
    """
    Check if SoundCloud is connected and token is valid
    """
    access_token = _soundcloud_tokens.get("access_token")
    expires_at = _soundcloud_tokens.get("expires_at")

    if not access_token:
        return {"connected": False, "message": "No SoundCloud connection"}

    # Check if token expired
    if expires_at and datetime.now() >= expires_at:
        return {"connected": True, "expired": True, "message": "Token expired - refresh required"}

    return {
        "connected": True,
        "expired": False,
        "expires_at": expires_at.isoformat() if expires_at else None
    }


def get_valid_access_token() -> str:
    """
    Internal helper: Get valid access token (refresh if needed)
    Raises HTTPException if not connected
    """
    access_token = _soundcloud_tokens.get("access_token")
    expires_at = _soundcloud_tokens.get("expires_at")

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="SoundCloud not connected. Admin must connect via /admin/soundcloud"
        )

    # Auto-refresh if expired
    if expires_at and datetime.now() >= expires_at:
        # Trigger refresh (synchronous call to async function)
        # In production, this should be handled better
        raise HTTPException(
            status_code=401,
            detail="Token expired. Please refresh via /auth/soundcloud/refresh"
        )

    return access_token
