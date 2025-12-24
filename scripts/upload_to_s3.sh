#!/bin/bash

# Upload all downloaded music tracks to AWS S3
# This will make the music work correctly from AWS instead of archive.org

BUCKET="pilates-music-tracks"
MUSIC_DIR="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/music-downloads"

echo "🚀 Uploading 42 music tracks to S3 bucket: $BUCKET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   brew install awscli"
    exit 1
fi

# Check if music directory exists
if [ ! -d "$MUSIC_DIR" ]; then
    echo "❌ Music directory not found: $MUSIC_DIR"
    exit 1
fi

# Count files
TOTAL_FILES=$(ls -1 "$MUSIC_DIR"/*.mp3 2>/dev/null | wc -l)
echo "📁 Found $TOTAL_FILES MP3 files to upload"
echo ""

# Upload each file
COUNTER=0
for file in "$MUSIC_DIR"/*.mp3; do
    if [ -f "$file" ]; then
        FILENAME=$(basename "$file")
        COUNTER=$((COUNTER + 1))

        echo "[$COUNTER/$TOTAL_FILES] Uploading: $FILENAME"

        # Upload with public-read ACL and correct content type
        aws s3 cp "$file" "s3://$BUCKET/$FILENAME" \
            --acl public-read \
            --content-type "audio/mpeg" \
            --metadata-directive REPLACE \
            --cache-control "public, max-age=31536000"

        if [ $? -eq 0 ]; then
            echo "   ✅ Success: https://$BUCKET.s3.us-east-1.amazonaws.com/$FILENAME"
        else
            echo "   ❌ Failed to upload $FILENAME"
        fi
        echo ""
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Upload complete! $COUNTER files uploaded to S3"
echo ""
echo "🎯 Next steps:"
echo "   1. Run the SQL migration to update database URLs"
echo "   2. Test playback in dev environment"
echo "   3. If successful, apply to production"