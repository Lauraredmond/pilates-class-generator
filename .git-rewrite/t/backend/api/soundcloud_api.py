"""
SoundCloud API Integration
Fetches playlists and tracks from instructor's authenticated SoundCloud account
Uses OAuth access token from soundcloud_auth.py
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import httpx
from pydantic import BaseModel

from api.soundcloud_auth import get_valid_access_token

router = APIRouter(prefix="/api/soundcloud", tags=["soundcloud"])

# SoundCloud API Configuration
API_BASE = "https://api.soundcloud.com"


# Response Models
class SoundCloudTrack(BaseModel):
    id: int
    title: str
    duration: int  # milliseconds
    permalink_url: str
    stream_url: Optional[str] = None
    artwork_url: Optional[str] = None
    user: dict  # Contains artist info


class SoundCloudPlaylist(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration: int  # milliseconds (sum of all tracks)
    track_count: int
    permalink_url: str
    artwork_url: Optional[str] = None
    tracks: List[SoundCloudTrack] = []


@router.get("/playlists", response_model=List[SoundCloudPlaylist])
async def get_instructor_playlists(limit: int = Query(default=10, le=50)):
    """
    Fetch instructor's SoundCloud playlists
    Returns playlists from authenticated instructor account
    """
    access_token = get_valid_access_token()

    headers = {
        "Authorization": f"OAuth {access_token}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # Get user's playlists
            response = await client.get(
                f"{API_BASE}/me/playlists",
                headers=headers,
                params={"limit": limit}
            )
            response.raise_for_status()

            playlists_data = response.json()

            # Transform to our response model
            playlists = []
            for playlist in playlists_data:
                playlists.append(SoundCloudPlaylist(
                    id=playlist["id"],
                    title=playlist["title"],
                    description=playlist.get("description"),
                    duration=playlist.get("duration", 0),
                    track_count=playlist.get("track_count", 0),
                    permalink_url=playlist["permalink_url"],
                    artwork_url=playlist.get("artwork_url"),
                    tracks=[
                        SoundCloudTrack(**track)
                        for track in playlist.get("tracks", [])
                    ]
                ))

            return playlists

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="SoundCloud authentication expired. Please reconnect via /admin/soundcloud"
                )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SoundCloud API error: {e.response.text}"
            )


@router.get("/playlists/{playlist_id}", response_model=SoundCloudPlaylist)
async def get_playlist_details(playlist_id: int):
    """
    Fetch detailed information about a specific playlist
    Includes full track list
    """
    access_token = get_valid_access_token()

    headers = {
        "Authorization": f"OAuth {access_token}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{API_BASE}/playlists/{playlist_id}",
                headers=headers
            )
            response.raise_for_status()

            playlist_data = response.json()

            return SoundCloudPlaylist(
                id=playlist_data["id"],
                title=playlist_data["title"],
                description=playlist_data.get("description"),
                duration=playlist_data.get("duration", 0),
                track_count=playlist_data.get("track_count", 0),
                permalink_url=playlist_data["permalink_url"],
                artwork_url=playlist_data.get("artwork_url"),
                tracks=[
                    SoundCloudTrack(**track)
                    for track in playlist_data.get("tracks", [])
                ]
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="SoundCloud authentication expired. Please reconnect."
                )
            elif e.response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Playlist {playlist_id} not found"
                )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SoundCloud API error: {e.response.text}"
            )


@router.get("/tracks/{track_id}/stream")
async def get_track_stream_url(track_id: int):
    """
    Get streaming URL for a specific track
    Returns HLS stream URL that can be played in HTML5 audio player
    """
    access_token = get_valid_access_token()

    headers = {
        "Authorization": f"OAuth {access_token}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # Get track details including stream URL
            response = await client.get(
                f"{API_BASE}/tracks/{track_id}",
                headers=headers
            )
            response.raise_for_status()

            track_data = response.json()

            # Get the stream URL (requires separate API call with OAuth token)
            stream_response = await client.get(
                f"{API_BASE}/tracks/{track_id}/stream",
                headers=headers
            )
            stream_response.raise_for_status()

            # SoundCloud returns redirect to HLS stream
            stream_url = stream_response.json().get("url") or stream_response.url

            return {
                "track_id": track_id,
                "title": track_data["title"],
                "duration": track_data["duration"],
                "stream_url": str(stream_url),
                "artwork_url": track_data.get("artwork_url")
            }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="SoundCloud authentication expired. Please reconnect."
                )
            elif e.response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Track {track_id} not found or no stream available"
                )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SoundCloud API error: {e.response.text}"
            )


@router.get("/search/playlists")
async def search_playlists(query: str = Query(..., min_length=1)):
    """
    Search instructor's playlists by keyword
    Useful for finding specific class music (e.g., "Beginner", "Cardio", "Relaxation")
    """
    access_token = get_valid_access_token()

    headers = {
        "Authorization": f"OAuth {access_token}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # Get all playlists and filter client-side
            # (SoundCloud API doesn't have a direct "search my playlists" endpoint)
            response = await client.get(
                f"{API_BASE}/me/playlists",
                headers=headers,
                params={"limit": 50}
            )
            response.raise_for_status()

            all_playlists = response.json()

            # Filter by search query (case-insensitive)
            query_lower = query.lower()
            filtered = [
                playlist for playlist in all_playlists
                if query_lower in playlist["title"].lower() or
                   query_lower in (playlist.get("description") or "").lower()
            ]

            return [
                SoundCloudPlaylist(
                    id=p["id"],
                    title=p["title"],
                    description=p.get("description"),
                    duration=p.get("duration", 0),
                    track_count=p.get("track_count", 0),
                    permalink_url=p["permalink_url"],
                    artwork_url=p.get("artwork_url"),
                    tracks=[SoundCloudTrack(**t) for t in p.get("tracks", [])]
                )
                for p in filtered
            ]

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="SoundCloud authentication expired. Please reconnect."
                )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SoundCloud API error: {e.response.text}"
            )
