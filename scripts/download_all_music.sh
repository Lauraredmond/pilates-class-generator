#!/bin/bash
# Download ALL 43 music tracks from archive.org (now that it's back online)
# Upload to AWS S3 for permanent hosting

set -e

DOWNLOAD_DIR="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/music-downloads"
mkdir -p "$DOWNLOAD_DIR"

echo "🎵 Downloading 43 music tracks from archive.org..."
echo "📁 Saving to: $DOWNLOAD_DIR"
echo ""

SUCCESS=0
FAILED=0

# Read all music track URLs from database and download
while IFS='|' read -r id title url; do
    # Clean up whitespace
    id=$(echo "$id" | xargs)
    title=$(echo "$title" | xargs)
    url=$(echo "$url" | xargs)

    # Skip header row
    if [ "$id" == "id" ]; then
        continue
    fi

    # Generate safe filename from title
    filename=$(echo "$title" | sed 's/[^a-zA-Z0-9._-]/_/g').mp3
    output_path="$DOWNLOAD_DIR/$filename"

    echo "📥 Downloading: $title"
    echo "   URL: $url"

    # Download with retries
    if curl -L --retry 3 --retry-delay 2 --max-time 120 -o "$output_path" "$url" 2>/dev/null; then
        # Verify file size
        file_size=$(stat -f%z "$output_path" 2>/dev/null || stat -c%s "$output_path" 2>/dev/null)

        if [ "$file_size" -gt 50000 ]; then
            echo "   ✅ Success ($(numfmt --to=iec-i --suffix=B $file_size))"
            ((SUCCESS++))
        else
            echo "   ❌ Failed (file too small - likely error page)"
            rm -f "$output_path"
            ((FAILED++))
        fi
    else
        echo "   ❌ Download failed"
        ((FAILED++))
    fi

    # Small delay to be nice to archive.org
    sleep 0.5
done < <(node /Users/lauraredmond/Documents/Bassline/Projects/MVP2/scripts/db_readonly_query.mjs "SELECT id, title, audio_url FROM music_tracks ORDER BY stylistic_period, title;" | tail -n +2)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Download Summary:"
echo "   ✅ Successful: $SUCCESS / 43"
echo "   ❌ Failed: $FAILED / 43"
echo ""
echo "📁 Downloaded files in:"
echo "   $DOWNLOAD_DIR"
echo ""
echo "🚀 Next Steps:"
echo "   1. Upload all MP3 files to S3 bucket: pilates-music-tracks"
echo "   2. Run SQL migration to update database with S3 URLs"
echo "   3. Test music playback in production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
