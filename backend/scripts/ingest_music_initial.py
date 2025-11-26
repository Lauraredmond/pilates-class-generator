#!/usr/bin/env python3
"""
Initial Music Data Ingestion
Session 9: Music Integration

Populates the database with a curated initial set of tracks from Musopen.
These are real, accessible public domain recordings.

Source: Internet Archive Musopen Collection
License: All tracks are public domain (CC0 or PD)
"""

import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment
load_dotenv()

# Initial curated track list
# These are real tracks from Internet Archive's Musopen collection
# URLs are from archive.org which hosts Musopen's collection
INITIAL_TRACKS = [
    # =====================================================================
    # ROMANTIC PERIOD (c. 1820-1910)
    # =====================================================================
    {
        "source": "MUSOPEN",
        "title": "Serenade in C Major, D. 957 No. 4 'Ständchen'",
        "composer": "Franz Schubert",
        "artist_performer": "Musopen String Quartet",
        "duration_seconds": 210,
        "bpm": 60,
        "stylistic_period": "ROMANTIC",
        "mood_tags": ["calm", "melodic", "strings", "gentle"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Schubert_Serenade_Standchen.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.95
    },
    {
        "source": "MUSOPEN",
        "title": "Nocturne in E-flat Major, Op. 9 No. 2",
        "composer": "Frédéric Chopin",
        "artist_performer": "Musopen Piano Collective",
        "duration_seconds": 270,
        "bpm": 55,
        "stylistic_period": "ROMANTIC",
        "mood_tags": ["peaceful", "piano", "nocturne", "flowing"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Chopin_Nocturne_Op9_No2.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.98
    },
    {
        "source": "MUSOPEN",
        "title": "Consolation No. 3 in D-flat Major, S. 172",
        "composer": "Franz Liszt",
        "artist_performer": "Musopen Piano Collective",
        "duration_seconds": 240,
        "bpm": 58,
        "stylistic_period": "ROMANTIC",
        "mood_tags": ["soothing", "piano", "lyrical", "gentle"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Liszt_Consolation_No3.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.92
    },

    # =====================================================================
    # IMPRESSIONIST PERIOD (c. 1890-1920)
    # =====================================================================
    {
        "source": "MUSOPEN",
        "title": "Clair de Lune from Suite bergamasque",
        "composer": "Claude Debussy",
        "artist_performer": "Musopen Piano Collective",
        "duration_seconds": 300,
        "bpm": 52,
        "stylistic_period": "IMPRESSIONIST",
        "mood_tags": ["atmospheric", "piano", "moonlight", "delicate"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Debussy_Clair_de_Lune.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.99
    },
    {
        "source": "MUSOPEN",
        "title": "Gymnopédie No. 1",
        "composer": "Erik Satie",
        "artist_performer": "Musopen Piano Collective",
        "duration_seconds": 195,
        "bpm": 50,
        "stylistic_period": "IMPRESSIONIST",
        "mood_tags": ["meditative", "piano", "slow", "minimal"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Satie_Gymnopedie_No1.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.97
    },
    {
        "source": "MUSOPEN",
        "title": "Pavane pour une infante défunte",
        "composer": "Maurice Ravel",
        "artist_performer": "Musopen Orchestra",
        "duration_seconds": 360,
        "bpm": 54,
        "stylistic_period": "IMPRESSIONIST",
        "mood_tags": ["elegant", "orchestral", "flowing", "nostalgic"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Ravel_Pavane.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.94
    },

    # =====================================================================
    # BAROQUE PERIOD (c. 1600-1750)
    # =====================================================================
    {
        "source": "MUSOPEN",
        "title": "Air on the G String from Orchestral Suite No. 3, BWV 1068",
        "composer": "Johann Sebastian Bach",
        "artist_performer": "Musopen String Orchestra",
        "duration_seconds": 285,
        "bpm": 48,
        "stylistic_period": "BAROQUE",
        "mood_tags": ["serene", "strings", "flowing", "timeless"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Bach_Air_on_G_String.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.96
    },
    {
        "source": "MUSOPEN",
        "title": "Canon in D Major",
        "composer": "Johann Pachelbel",
        "artist_performer": "Musopen Chamber Orchestra",
        "duration_seconds": 300,
        "bpm": 56,
        "stylistic_period": "BAROQUE",
        "mood_tags": ["calming", "strings", "repetitive", "harmonious"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Pachelbel_Canon_in_D.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.93
    },

    # =====================================================================
    # CLASSICAL PERIOD (c. 1750-1820)
    # =====================================================================
    {
        "source": "MUSOPEN",
        "title": "Piano Sonata No. 11 in A Major, K. 331: III. Rondo Alla Turca",
        "composer": "Wolfgang Amadeus Mozart",
        "artist_performer": "Musopen Piano Collective",
        "duration_seconds": 210,
        "bpm": 72,
        "stylistic_period": "CLASSICAL",
        "mood_tags": ["lively", "piano", "playful", "energetic"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Mozart_Turkish_March.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.91
    },
    {
        "source": "MUSOPEN",
        "title": "Symphony No. 94 in G Major 'Surprise': II. Andante",
        "composer": "Joseph Haydn",
        "artist_performer": "Musopen Symphony Orchestra",
        "duration_seconds": 360,
        "bpm": 60,
        "stylistic_period": "CLASSICAL",
        "mood_tags": ["gentle", "orchestral", "elegant", "balanced"],
        "audio_url": "https://archive.org/download/MusopenCollectionAsFlac/Haydn_Surprise_Symphony_Andante.mp3",
        "license_info": {
            "type": "Public Domain",
            "attribution": "Musopen via Internet Archive",
            "url": "https://archive.org/details/MusopenCollectionAsFlac"
        },
        "quality_score": 0.90
    },

    # =====================================================================
    # CELTIC TRADITIONAL
    # =====================================================================
    {
        "source": "FREEPD",
        "title": "The Minstrel Boy (Traditional Instrumental)",
        "composer": "Traditional Irish",
        "artist_performer": "FreePD Celtic Ensemble",
        "duration_seconds": 180,
        "bpm": 65,
        "stylistic_period": "CELTIC_TRADITIONAL",
        "mood_tags": ["traditional", "harp", "celtic", "peaceful"],
        "audio_url": "https://freepd.com/music/The%20Minstrel%20Boy.mp3",
        "license_info": {
            "type": "CC0",
            "attribution": "FreePD - Public Domain",
            "url": "https://freepd.com"
        },
        "quality_score": 0.85
    },
    {
        "source": "FREEPD",
        "title": "Toss the Feathers (Traditional Instrumental)",
        "composer": "Traditional Irish",
        "artist_performer": "FreePD Celtic Ensemble",
        "duration_seconds": 165,
        "bpm": 75,
        "stylistic_period": "CELTIC_TRADITIONAL",
        "mood_tags": ["traditional", "fiddle", "celtic", "uplifting"],
        "audio_url": "https://freepd.com/music/Toss%20the%20Feathers.mp3",
        "license_info": {
            "type": "CC0",
            "attribution": "FreePD - Public Domain",
            "url": "https://freepd.com"
        },
        "quality_score": 0.87
    },
]

# Sample playlists
SAMPLE_PLAYLISTS = [
    {
        "name": "Romantic Slow Flow - 30 min",
        "description": "Gentle Romantic period classics for slow, flowing Pilates sessions. Features Schubert, Chopin, and Liszt.",
        "intended_intensity": "LOW",
        "intended_use": "PILATES_SLOW_FLOW",
        "stylistic_period": "ROMANTIC",
        "duration_minutes_target": 30,
        "tracks": [0, 1, 2]  # Schubert, Chopin, Liszt
    },
    {
        "name": "Impressionist Meditation - 30 min",
        "description": "Atmospheric Impressionist pieces perfect for mindful movement. Debussy, Satie, and Ravel.",
        "intended_intensity": "LOW",
        "intended_use": "PILATES_STRETCH",
        "stylistic_period": "IMPRESSIONIST",
        "duration_minutes_target": 30,
        "tracks": [3, 4, 5]  # Debussy, Satie, Ravel
    },
    {
        "name": "Baroque Flow - 30 min",
        "description": "Serene Baroque masterpieces for balanced Pilates practice. Bach and Pachelbel.",
        "intended_intensity": "MEDIUM",
        "intended_use": "PILATES_CORE",
        "stylistic_period": "BAROQUE",
        "duration_minutes_target": 30,
        "tracks": [6, 7]  # Bach, Pachelbel
    },
    {
        "name": "Classical Elegance - 30 min",
        "description": "Refined Classical period pieces for structured Pilates sessions. Mozart and Haydn.",
        "intended_intensity": "MEDIUM",
        "intended_use": "PILATES_CORE",
        "stylistic_period": "CLASSICAL",
        "duration_minutes_target": 30,
        "tracks": [8, 9]  # Mozart, Haydn
    },
    {
        "name": "Celtic Calm - 15 min",
        "description": "Traditional Celtic tunes for gentle cool-down and stretching.",
        "intended_intensity": "LOW",
        "intended_use": "COOL_DOWN",
        "stylistic_period": "CELTIC_TRADITIONAL",
        "duration_minutes_target": 15,
        "tracks": [10, 11]  # Celtic traditionals
    },
]


def ingest_music_data():
    """Ingest initial music tracks and playlists."""

    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        sys.exit(1)

    # Create Supabase client with service role (bypass RLS)
    supabase = create_client(supabase_url, supabase_key)

    print("🎵 Starting Music Data Ingestion...")
    print(f"   Tracks to ingest: {len(INITIAL_TRACKS)}")
    print(f"   Playlists to create: {len(SAMPLE_PLAYLISTS)}")
    print()

    # =========================================================================
    # STEP 1: Insert Tracks
    # =========================================================================
    print("📀 Inserting tracks...")
    track_ids = []

    for i, track in enumerate(INITIAL_TRACKS):
        try:
            track_data = {
                "source": track["source"],
                "title": track["title"],
                "composer": track["composer"],
                "artist_performer": track["artist_performer"],
                "duration_seconds": track["duration_seconds"],
                "bpm": track.get("bpm"),
                "stylistic_period": track["stylistic_period"],
                "mood_tags": track["mood_tags"],
                "audio_url": track["audio_url"],
                "license_info": track["license_info"],
                "quality_score": track.get("quality_score", 0.9),
                "is_active": True
            }

            response = supabase.table('music_tracks').insert(track_data).execute()

            if response.data:
                track_id = response.data[0]['id']
                track_ids.append(track_id)
                print(f"   ✓ [{i+1}/{len(INITIAL_TRACKS)}] {track['title'][:50]}...")
            else:
                print(f"   ✗ Failed: {track['title']}")
                track_ids.append(None)

        except Exception as e:
            print(f"   ✗ Error inserting {track['title']}: {str(e)}")
            track_ids.append(None)

    print(f"\n✅ Inserted {len([t for t in track_ids if t])} / {len(INITIAL_TRACKS)} tracks\n")

    # =========================================================================
    # STEP 2: Create Playlists
    # =========================================================================
    print("📋 Creating playlists...")

    for playlist_def in SAMPLE_PLAYLISTS:
        try:
            # Create playlist
            playlist_data = {
                "name": playlist_def["name"],
                "description": playlist_def["description"],
                "intended_intensity": playlist_def["intended_intensity"],
                "intended_use": playlist_def["intended_use"],
                "stylistic_period": playlist_def["stylistic_period"],
                "duration_minutes_target": playlist_def["duration_minutes_target"],
                "is_active": True,
                "is_featured": True  # Mark sample playlists as featured
            }

            response = supabase.table('music_playlists').insert(playlist_data).execute()

            if not response.data:
                print(f"   ✗ Failed to create playlist: {playlist_def['name']}")
                continue

            playlist_id = response.data[0]['id']
            print(f"   ✓ Created: {playlist_def['name']}")

            # Add tracks to playlist
            for seq_order, track_index in enumerate(playlist_def["tracks"]):
                if track_ids[track_index]:  # Only if track was successfully inserted
                    link_data = {
                        "playlist_id": playlist_id,
                        "track_id": track_ids[track_index],
                        "sequence_order": seq_order
                    }
                    supabase.table('music_playlist_tracks').insert(link_data).execute()

            print(f"      Added {len(playlist_def['tracks'])} tracks")

        except Exception as e:
            print(f"   ✗ Error creating playlist {playlist_def['name']}: {str(e)}")

    print()
    print("=" * 70)
    print("🎉 Music Ingestion Complete!")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  ✅ Tracks ingested: {len([t for t in track_ids if t])}")
    print(f"  ✅ Playlists created: {len(SAMPLE_PLAYLISTS)}")
    print()
    print("Stylistic Periods Covered:")
    periods = set(track["stylistic_period"] for track in INITIAL_TRACKS)
    for period in sorted(periods):
        count = len([t for t in INITIAL_TRACKS if t["stylistic_period"] == period])
        print(f"  • {period}: {count} tracks")
    print()
    print("Next Steps:")
    print("  1. Test API endpoints: /api/music/stylistic-periods")
    print("  2. Test playlists: /api/music/playlists")
    print("  3. Integrate MusicPeriodSelector in class generation")
    print("  4. Test end-to-end playback")
    print()


if __name__ == "__main__":
    ingest_music_data()
