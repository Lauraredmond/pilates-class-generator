#!/bin/bash
# Download all music tracks from archive.org
# Usage: bash scripts/download_music.sh

set -e

DOWNLOAD_DIR="/Users/lauraredmond/Documents/Bassline/Projects/MVP2/music-downloads"
mkdir -p "$DOWNLOAD_DIR"

echo "🎵 Downloading 43 music tracks from archive.org..."
echo "⏳ This may take 10-15 minutes depending on file sizes"
echo ""

# Track success/failure counts
SUCCESS=0
FAILED=0
FAILED_FILES=()

# Download each file with progress
declare -a URLS=(
"https://archive.org/download/chopin-nocturne-op.-9-no.-2/Chopin%20-%20Nocturne%20op.9%20No.2.mp3|Chopin_Nocturne_Op9_No2.mp3"
"https://ia802905.us.archive.org/17/items/100ClassicalMusicMasterpieces/1721%20Bach%20,%20Brandenburg%20Concerto%20No.%203,%201st%20movement.mp3|Bach_Brandenburg_Concerto_No3.mp3"
"https://dn790002.ca.archive.org/0/items/100ClassicalMusicMasterpieces/1727%20Bach%20%2C%20Air%20%28from%20Orchestral%20Suite%20No.%203%20in%20D%29.mp3|Bach_Air_on_G_String.mp3"
"https://archive.org/download/MozartSymphonyNo.40InGMinorKv.5501.moltoAllegroSalzburgMozarteum/11Sym40-1.mp3|Mozart_Symphony_No40.mp3"
"https://archive.org/download/ACoplandAppalachianSpring/Appalachian%20Spring.mp3|Copland_Appalachian_Spring.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1864%20Grieg-%20I%20Love%20You.mp3|Grieg_I_Love_You.mp3"
"https://dn720300.ca.archive.org/0/items/classical-music-mix-by-various-artists/11%20-%20Vivaldi%20-%20The%20Four%20Seasons%20%27Spring%27%2C%20in%20E%20Major%2C%20Op.%208%2C%20No.%203%2C%20Allegro.mp3|Vivaldi_Four_Seasons_Spring.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1810%20Beethoven-%20Fur%20Elise.mp3|Beethoven_Fur_Elise.mp3"
"https://dn790002.ca.archive.org/0/items/100ClassicalMusicMasterpieces/1762%20Gluck%20,%20Dance%20of%20the%20Blessed%20Spirtis%20(from%20'Orpheus%20and%20Eurydice').mp3|Gluck_Dance_Blessed_Spirits.mp3"
"https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart/1%20Hour%20Relaxing%20Jazz%20Coffee%20Shop%20Music%20%20The%20Best%20Melodies%20That%20Will%20Warm%20Your%20Heart.mp3|Jazz_Coffeeshop_1Hour.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1865%20Brahms-%20Waltz.mp3|Brahms_Waltz.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1822%20Schubert%20-%20Symphony%20No.8%20in%20B%20minor%2C%20%27Unfinished%27.mp3|Schubert_Symphony_No8_Unfinished.mp3"
"https://archive.org/download/TradschoolIrishFluteTunes/andersons_slow.mp3|Celtic_Andersons_Slow.mp3"
"https://archive.org/download/freefloatingmusic-aic2013/06%20-%20Silvercord%20-%20Womb%20of%20Tranquility.mp3|Ambient_Womb_of_Tranquility.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1778%20Rondo%20Alla%20Turca%2C%20from%20Piano%20Sonata%20in%20A.mp3|Mozart_Rondo_Alla_Turca.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1749%20Handel%20%2C%20Arrival%20of%20the%20Queen%20of%20Sheba%20%28from%20%27Solomon%27%29.mp3|Handel_Queen_of_Sheba.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1731%20Bach%20%2C%20Oboe%20Concerto%20in%20D%20minor%2C%202nd%20movement.mp3|Bach_Oboe_Concerto.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1867%20J.%20Strauss%20II-%20The%20Blue%20Danube%20-%20Waltz.mp3|Strauss_Blue_Danube.mp3"
"https://archive.org/download/classical_music_202209/Mozart%20-%20Eine%20Kleine%20Nachtmusik.mp3|Mozart_Eine_Kleine_Nachtmusik.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1739%20Handel%20%2C%20Concerto%20grosso%20in%20A%20minor%20op.%206%20No.%204.mp3|Handel_Concerto_Grosso.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1823%20Schubert%20-%20Ballet%20Music%20in%20G%2C%20from%20%27Rosamunde%27.mp3|Schubert_Rosamunde.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1811%20Schubert%20-%20German%20Dance%20No.1.mp3|Schubert_German_Dance.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1858%20Rubinstein-%20Melody%20in%20F.mp3|Rubinstein_Melody_in_F.mp3"
"https://archive.org/download/TradschoolIrishFluteTunes/humours_of_lissadell_slow.mp3|Celtic_Humours_of_Lissadell.mp3"
"https://archive.org/download/classical_music_202209/Bach%20-%20Jesu%2C%20Joy%20Of%20Man%27s%20Desiring.mp3|Bach_Jesu_Joy.mp3"
"https://dn790002.ca.archive.org/0/items/100ClassicalMusicMasterpieces/1801%20Beethoven-%20'Moonlight'%20Sonata,%201st%20movement.mp3|Beethoven_Moonlight_Sonata.mp3"
"https://ia902905.us.archive.org/17/items/100ClassicalMusicMasterpieces/1797%20Haydn-%20Emporor's%20Hymn,%20from%20String%20Quartet%20in%20C.mp3|Haydn_Emperors_Hymn.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1848%20Schumann%20-%20The%20Merry%20Peasant.mp3|Schumann_Merry_Peasant.mp3"
"https://archive.org/download/classical_music_202209/Debussy%20-%20Arabesque.mp3|Debussy_Arabesque.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1928%20Ravel%20-%20Bolero.mp3|Ravel_Bolero.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1821%20Rossini%20-%20The%20Barber%20Of%20Seville%20-%20Overture.mp3|Rossini_Barber_of_Seville.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1734%20Handel%20%2C%20Largo%20%28from%20%27Xerxes%27%29.mp3|Handel_Largo.mp3"
"https://dn790002.ca.archive.org/0/items/100ClassicalMusicMasterpieces/1721%20Bach%20,%20Minuet%20and%20Badinerie%20(from%20Orchestral%20Suite%20No.%202%20inB%20Minor).mp3|Bach_Minuet_Badinerie.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1825%20Schubert%20-%20Ave%20Maria.mp3|Schubert_Ave_Maria.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1734%20Bach%20%2C%20Sinfonia%20in%20G%20%28from%20%27Christmas%20Oratorio%27%29.mp3|Bach_Christmas_Oratorio.mp3"
"https://archive.org/download/QuintetInEMajorG.275Minuet/Quintet%20in%20E%20major%2C%20G.275%20-%20Minuet.mp3|Boccherini_Quintet_Minuet.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1796%20Beethoven-%20Minuet%20in%20G.mp3|Beethoven_Minuet_in_G.mp3"
"https://archive.org/download/BachMinuetInGMajor/Bach_Minuet_in_G_major.mp3|Bach_Minuet_in_G.mp3"
"https://archive.org/download/classical_music_202209/Chopin%20-%20Minute%20Waltz.mp3|Chopin_Minute_Waltz.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1742%20Handel%20%2C%20%27Hallelujah%27%20%28from%20%27Messiah%27%29.mp3|Handel_Hallelujah.mp3"
"https://dn790002.ca.archive.org/0/items/100ClassicalMusicMasterpieces/1892%20Tchaikovsky-%20Waltz%20of%20the%20FLowers,%20from%20'The%20Nutcracker'.mp3|Tchaikovsky_Waltz_of_Flowers.mp3"
"https://archive.org/download/100ClassicalMusicMasterpieces/1868%20Brahms-%20Cradle%20Song.mp3|Brahms_Cradle_Song.mp3"
)

for entry in "${URLS[@]}"; do
    URL="${entry%%|*}"
    FILENAME="${entry##*|}"
    OUTPUT_PATH="$DOWNLOAD_DIR/$FILENAME"

    echo "📥 Downloading: $FILENAME"

    # Try to download with retries (archive.org may be intermittent)
    if curl -L --retry 3 --retry-delay 2 --max-time 60 -o "$OUTPUT_PATH" "$URL" 2>/dev/null; then
        # Verify file was actually downloaded (not a 503 error page)
        FILE_SIZE=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null)

        if [ "$FILE_SIZE" -gt 50000 ]; then
            echo "   ✅ Success ($FILE_SIZE bytes)"
            ((SUCCESS++))
        else
            echo "   ❌ Failed (file too small - likely error page)"
            rm -f "$OUTPUT_PATH"
            FAILED_FILES+=("$FILENAME")
            ((FAILED++))
        fi
    else
        echo "   ❌ Download failed"
        FAILED_FILES+=("$FILENAME")
        ((FAILED++))
    fi

    # Small delay to avoid overwhelming archive.org
    sleep 0.5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Download Summary:"
echo "   ✅ Successful: $SUCCESS / 43"
echo "   ❌ Failed: $FAILED / 43"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Failed files:"
    for file in "${FAILED_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
fi

echo "📁 Downloaded files saved to:"
echo "   $DOWNLOAD_DIR"
echo ""

if [ $SUCCESS -gt 0 ]; then
    echo "✅ You can now upload the successful downloads to AWS S3"
    echo "   (archive.org appears to be having intermittent issues)"
else
    echo "⚠️  Archive.org appears to be completely down (503 errors)"
    echo "   Try again later when the service recovers"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
