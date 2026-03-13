// Sport colours and icons mapping
// Supports common sports with predefined styles
// Generates deterministic colours for unknown sports

export const SPORT_COLORS = {
  rugby: { bg: "#1a5632", accent: "#2d8a56", light: "#e8f5ee", icon: "🏉" },
  soccer: { bg: "#1a3d6e", accent: "#2b6cb0", light: "#e8f0fa", icon: "⚽" },
  gaa: { bg: "#7c3a1a", accent: "#c05621", light: "#fef3e8", icon: "🏐" },
  swimming: { bg: "#0e7490", accent: "#06b6d4", light: "#e0f7fa", icon: "🏊" },
  athletics: { bg: "#92400e", accent: "#d97706", light: "#fef3c7", icon: "🏃" },
  tennis: { bg: "#5b7e1a", accent: "#84cc16", light: "#f0fce8", icon: "🎾" },
  gymnastics: { bg: "#7e22ce", accent: "#a855f7", light: "#f3e8ff", icon: "🤸" },
  dance: { bg: "#be185d", accent: "#ec4899", light: "#fce7f3", icon: "💃" },
  hurling: { bg: "#4a3520", accent: "#92702a", light: "#f5f0e8", icon: "🏑" },
  camogie: { bg: "#6b2140", accent: "#b5465a", light: "#fae8ee", icon: "🏑" },
  basketball: { bg: "#c2410c", accent: "#ea580c", light: "#fff7ed", icon: "🏀" },
  hockey: { bg: "#155e75", accent: "#0891b2", light: "#ecfeff", icon: "🏒" },
  cycling: { bg: "#4d7c0f", accent: "#65a30d", light: "#f7fee7", icon: "🚴" },
  martial_arts: { bg: "#581c87", accent: "#7c3aed", light: "#ede9fe", icon: "🥋" },
  boxing: { bg: "#991b1b", accent: "#dc2626", light: "#fee2e2", icon: "🥊" },
  rowing: { bg: "#134e4a", accent: "#14b8a6", light: "#ccfbf1", icon: "🚣" },
  golf: { bg: "#065f46", accent: "#10b981", light: "#d1fae5", icon: "⛳" },
  cricket: { bg: "#713f12", accent: "#d97706", light: "#fef3c7", icon: "🏏" },
  netball: { bg: "#9f1239", accent: "#f43f5e", light: "#ffe4e6", icon: "🏀" },
  handball: { bg: "#6d28d9", accent: "#8b5cf6", light: "#ede9fe", icon: "🤾" },
};

/**
 * Get sport style (colours and icon) for a given sport name
 * Returns predefined style or generates deterministic colours for unknown sports
 * @param {string} name - Sport/activity name
 * @returns {Object} Style object with bg, accent, light colours and icon
 */
export function getSportStyle(name) {
  // Normalize the sport name
  const key = (name || "").toLowerCase().trim().replace(/\s+/g, "_");

  // Check exact match
  if (SPORT_COLORS[key]) {
    return SPORT_COLORS[key];
  }

  // Check without underscores (e.g., "martial arts" vs "martial_arts")
  const keyAlt = key.replace(/_/g, "");
  for (const [k, v] of Object.entries(SPORT_COLORS)) {
    if (k.replace(/_/g, "") === keyAlt) {
      return v;
    }
  }

  // Generate deterministic colours for unknown sports
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = Math.abs(hash) % 360;
  return {
    bg: `hsl(${h}, 45%, 30%)`,
    accent: `hsl(${h}, 55%, 45%)`,
    light: `hsl(${h}, 60%, 94%)`,
    icon: "🏅", // Generic sport icon
  };
}

/**
 * Get all predefined sport names
 * @returns {string[]} Array of sport names
 */
export function getKnownSports() {
  return Object.keys(SPORT_COLORS);
}