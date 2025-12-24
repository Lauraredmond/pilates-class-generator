#!/usr/bin/env python3
"""
Download all music tracks from archive.org and save to music-downloads/
Handles titles with quotes, special characters, etc.
"""

import os
import sys
import subprocess
import urllib.parse
import re
import requests
from pathlib import Path

# Configuration
DOWNLOAD_DIR = Path("/Users/lauraredmond/Documents/Bassline/Projects/MVP2/music-downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

def get_music_tracks():
    """Query database for all music track URLs"""
    query = "SELECT id, title, audio_url FROM music_tracks ORDER BY stylistic_period, title;"

    result = subprocess.run(
        ["node", "scripts/db_readonly_query.mjs", query],
        capture_output=True,
        text=True,
        cwd="/Users/lauraredmond/Documents/Bassline/Projects/MVP2"
    )

    if result.returncode != 0:
        print(f"❌ Database query failed: {result.stderr}")
        sys.exit(1)

    # Parse output (skip header and footer)
    lines = result.stdout.strip().split('\n')
    tracks = []

    for line in lines[2:]:  # Skip header rows
        if '|' not in line or 'rows' in line or line.startswith('🔍'):
            continue

        parts = line.split('|')
        if len(parts) >= 3:
            track_id = parts[0].strip()
            title = parts[1].strip()
            url = parts[2].strip()

            if url and url.startswith('http'):
                tracks.append({'id': track_id, 'title': title, 'url': url})

    return tracks

def sanitize_filename(title):
    """Create safe filename from title"""
    # Remove special characters, keep alphanumeric and common punctuation
    safe = re.sub(r'[^\w\s\-\.]', '_', title)
    # Replace multiple spaces/underscores with single underscore
    safe = re.sub(r'[\s_]+', '_', safe)
    # Limit length
    safe = safe[:100]
    return f"{safe}.mp3"

def download_track(track):
    """Download a single track"""
    title = track['title']
    url = track['url']
    filename = sanitize_filename(title)
    output_path = DOWNLOAD_DIR / filename

    print(f"📥 Downloading: {title}")
    print(f"   URL: {url}")

    try:
        response = requests.get(url, timeout=120, stream=True)
        response.raise_for_status()

        # Save file
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Check file size
        file_size = output_path.stat().st_size

        if file_size > 50000:  # At least 50KB
            size_mb = file_size / (1024 * 1024)
            print(f"   ✅ Success ({size_mb:.1f} MB)")
            return True
        else:
            print(f"   ❌ Failed (file too small - likely error page)")
            output_path.unlink()
            return False

    except Exception as e:
        print(f"   ❌ Download failed: {e}")
        if output_path.exists():
            output_path.unlink()
        return False

def main():
    print("🎵 Downloading all music tracks from archive.org...")
    print(f"📁 Saving to: {DOWNLOAD_DIR}")
    print("")

    # Get all tracks from database
    tracks = get_music_tracks()
    print(f"Found {len(tracks)} tracks in database")
    print("")

    success = 0
    failed = 0

    for track in tracks:
        if download_track(track):
            success += 1
        else:
            failed += 1

        # Be nice to archive.org
        import time
        time.sleep(0.5)

    print("")
    print("━" * 60)
    print(f"📊 Download Summary:")
    print(f"   ✅ Successful: {success} / {len(tracks)}")
    print(f"   ❌ Failed: {failed} / {len(tracks)}")
    print("")
    print(f"📁 Downloaded files in:")
    print(f"   {DOWNLOAD_DIR}")
    print("")
    print("🚀 Next Steps:")
    print("   1. Upload all MP3 files to S3 bucket: pilates-music-tracks")
    print("   2. Run SQL migration to update database with S3 URLs")
    print("   3. Test music playback in production")
    print("━" * 60)

if __name__ == "__main__":
    main()
