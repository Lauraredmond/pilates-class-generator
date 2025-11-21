/**
 * SoundCloud Music Playlists
 *
 * Pre-curated playlists for Pilates class playback
 * Each playlist should be 60+ minutes of appropriate music
 *
 * SETUP REQUIRED:
 * 1. Create a SoundCloud account
 * 2. Create 9 playlists with the names below
 * 3. Upload or add 60+ minutes of music to each playlist
 * 4. Get the shareable URL for each playlist (e.g., https://soundcloud.com/your-username/your-playlist)
 * 5. Replace the placeholder URLs below with your actual playlist URLs
 */

export interface MusicPlaylist {
  id: string;
  name: string;
  category: 'movement' | 'cooldown';
  url: string;
  description: string;
}

/**
 * Movement Music Playlists (6 playlists)
 * Used during active Pilates movements
 */
export const MOVEMENT_PLAYLISTS: MusicPlaylist[] = [
  {
    id: 'ambient-pilates',
    name: 'Ambient Pilates',
    category: 'movement',
    // TESTING: Using a single public track known to work with Widget API
    url: 'https://api.soundcloud.com/tracks/293',
    // Alternative format: https://soundcloud.com/forss/flickermood
    // Original URL (embedding disabled by tracks): https://soundcloud.com/laura-redmond-504579291/sets/ambient-pilates
    description: 'Calm ambient soundscapes perfect for focused movement',
  },
  {
    id: 'meditation-instrumentals',
    name: 'Meditation Instrumentals',
    category: 'movement',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/meditation-instrumentals',
    description: 'Gentle instrumental melodies for mindful practice',
  },
  {
    id: 'chillout-beats',
    name: 'Chillout Beats',
    category: 'movement',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/chillout-beats',
    description: 'Relaxing electronic beats with steady rhythm',
  },
  {
    id: 'lofi-focus',
    name: 'Lo-Fi Focus',
    category: 'movement',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/lofi-focus',
    description: 'Lo-fi hip hop beats for concentration',
  },
  {
    id: 'acoustic-calm',
    name: 'Acoustic Calm',
    category: 'movement',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/acoustic-calm',
    description: 'Acoustic guitar and piano for serene movement',
  },
  {
    id: 'piano-minimal',
    name: 'Piano Minimal',
    category: 'movement',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/piano-minimal',
    description: 'Minimalist piano compositions for clarity',
  },
];

/**
 * Cool-Down Music Playlists (3 playlists)
 * Used during stretching and relaxation phase
 */
export const COOLDOWN_PLAYLISTS: MusicPlaylist[] = [
  {
    id: 'baroque-classical',
    name: 'Baroque Classical',
    category: 'cooldown',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/baroque-classical',
    description: 'Bach, Vivaldi, and baroque composers for relaxation',
  },
  {
    id: 'classical-piano',
    name: 'Classical Piano',
    category: 'cooldown',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/classical-piano',
    description: 'Chopin, Debussy, and romantic piano pieces',
  },
  {
    id: 'romantic-era',
    name: 'Romantic Era',
    category: 'cooldown',
    url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/romantic-era',
    description: 'Schumann, Brahms, and romantic orchestral works',
  },
];

/**
 * All playlists combined for easy access
 */
export const ALL_PLAYLISTS: MusicPlaylist[] = [
  ...MOVEMENT_PLAYLISTS,
  ...COOLDOWN_PLAYLISTS,
];

/**
 * Get playlist by ID
 */
export function getPlaylistById(id: string): MusicPlaylist | undefined {
  return ALL_PLAYLISTS.find(playlist => playlist.id === id);
}

/**
 * Get playlist URL by name (case-insensitive match)
 * Used when music style names come from backend
 */
export function getPlaylistByName(name: string): MusicPlaylist | undefined {
  const normalizedName = name.toLowerCase().trim();

  return ALL_PLAYLISTS.find(playlist =>
    playlist.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(playlist.name.toLowerCase())
  );
}

/**
 * Get random playlist by category
 */
export function getRandomPlaylist(category: 'movement' | 'cooldown'): MusicPlaylist {
  const playlists = category === 'movement' ? MOVEMENT_PLAYLISTS : COOLDOWN_PLAYLISTS;
  return playlists[Math.floor(Math.random() * playlists.length)];
}

/**
 * Default playlists for fallback
 */
export const DEFAULT_MOVEMENT_PLAYLIST = MOVEMENT_PLAYLISTS[0]; // Ambient Pilates
export const DEFAULT_COOLDOWN_PLAYLIST = COOLDOWN_PLAYLISTS[0]; // Baroque Classical
