/**
 * Music Stylistic Periods
 *
 * Mapping of musical periods for Pilates class playback
 * These correspond to stylistic_period values in the music database
 * All music sourced from Internet Archive (public domain/CC licensed)
 */

export interface StylisticPeriod {
  id: string;
  name: string;
  displayName: string;
  category: 'movement' | 'cooldown';
  description: string;
  era: string;
}

/**
 * Stylistic Periods for Movement Music
 * Used during active Pilates movements
 */
export const MOVEMENT_PERIODS: StylisticPeriod[] = [
  {
    id: 'IMPRESSIONIST',
    name: 'IMPRESSIONIST',
    displayName: 'Impressionist',
    category: 'movement',
    description: 'Atmospheric and flowing - Debussy, Ravel (c. 1890-1920)',
    era: '1890-1920',
  },
  {
    id: 'ROMANTIC',
    name: 'ROMANTIC',
    displayName: 'Romantic',
    category: 'movement',
    description: 'Expressive and flowing - Chopin, Tchaikovsky (c. 1820-1910)',
    era: '1820-1910',
  },
  {
    id: 'MODERN',
    name: 'MODERN',
    displayName: 'Modern',
    category: 'movement',
    description: 'Minimalist and meditative - Satie, Copland (c. 1900-1975)',
    era: '1900-1975',
  },
  {
    id: 'CONTEMPORARY',
    name: 'CONTEMPORARY',
    displayName: 'Contemporary',
    category: 'movement',
    description: 'Ambient and peaceful - Modern meditation music (1975-present)',
    era: '1975-present',
  },
];

/**
 * Stylistic Periods for Cool-Down Music
 * Used during stretching and relaxation phase
 */
export const COOLDOWN_PERIODS: StylisticPeriod[] = [
  {
    id: 'BAROQUE',
    name: 'BAROQUE',
    displayName: 'Baroque',
    category: 'cooldown',
    description: 'Serene and balanced - Bach, Handel (c. 1600-1750)',
    era: '1600-1750',
  },
  {
    id: 'CLASSICAL',
    name: 'CLASSICAL',
    displayName: 'Classical',
    category: 'cooldown',
    description: 'Elegant and structured - Mozart, Haydn (c. 1750-1820)',
    era: '1750-1820',
  },
  {
    id: 'CELTIC_TRADITIONAL',
    name: 'CELTIC_TRADITIONAL',
    displayName: 'Celtic Traditional',
    category: 'cooldown',
    description: 'Gentle and melodic - Irish flute tunes',
    era: 'Traditional',
  },
];

/**
 * All stylistic periods combined for easy access
 */
export const ALL_PERIODS: StylisticPeriod[] = [
  ...MOVEMENT_PERIODS,
  ...COOLDOWN_PERIODS,
];

/**
 * Get stylistic period by ID
 */
export function getPeriodById(id: string): StylisticPeriod | undefined {
  return ALL_PERIODS.find(period => period.id === id);
}

/**
 * Get stylistic period by display name (case-insensitive match)
 * Used when music style names come from UI
 */
export function getPeriodByName(name: string): StylisticPeriod | undefined {
  const normalizedName = name.toLowerCase().trim();

  return ALL_PERIODS.find(period =>
    period.displayName.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(period.displayName.toLowerCase())
  );
}

/**
 * Get random stylistic period by category
 */
export function getRandomPeriod(category: 'movement' | 'cooldown'): StylisticPeriod {
  const periods = category === 'movement' ? MOVEMENT_PERIODS : COOLDOWN_PERIODS;
  return periods[Math.floor(Math.random() * periods.length)];
}

/**
 * Default stylistic periods for fallback
 */
export const DEFAULT_MOVEMENT_PERIOD = MOVEMENT_PERIODS[0]; // Impressionist
export const DEFAULT_COOLDOWN_PERIOD = COOLDOWN_PERIODS[0]; // Baroque
